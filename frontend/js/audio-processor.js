/**
 * Audio Processor - Handles audio processing and visualization
 */

class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.audioElement = document.getElementById('audio-player');
        this.canvas = document.getElementById('audio-visualizer');
        this.canvasCtx = this.canvas.getContext('2d');
        
        this.analyser = null;
        this.dataArray = null;
        this.bufferLength = 0;
        
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.duration = 0;
        
        // Visualization settings
        this.visualizationId = null;
        this.barWidth = 3;
        this.barGap = 1;
        
        // Volume and speed control
        this.volume = 0.8;
        this.playbackRate = 1.0;
        
        // Event callbacks
        this.onTimeUpdate = null;
        this.onEnded = null;
        this.onPlay = null;
        this.onPause = null;
        
        this.init();
    }
    
    init() {
        this.setupAudioElement();
        this.initializeAudioContext();
        this.setupCanvas();
    }
    
    setupAudioElement() {
        this.audioElement.volume = this.volume;
        this.audioElement.playbackRate = this.playbackRate;
        
        // Audio event listeners
        this.audioElement.addEventListener('loadedmetadata', () => {
            this.duration = this.audioElement.duration;
            this.updateTimeDisplay();
        });
        
        this.audioElement.addEventListener('timeupdate', () => {
            this.currentTime = this.audioElement.currentTime;
            this.updateTimeDisplay();
            this.updateProgressBar();
            
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.currentTime, this.duration);
            }
        });
        
        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
            this.isPaused = false;
            this.stopVisualization();
            
            if (this.onEnded) {
                this.onEnded();
            }
            
            this.updateAudioStatus('Finished');
        });
        
        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            this.isPaused = false;
            this.startVisualization();
            
            if (this.onPlay) {
                this.onPlay();
            }
            
            this.updateAudioStatus('Playing');
        });
        
        this.audioElement.addEventListener('pause', () => {
            this.isPaused = true;
            this.isPlaying = false;
            
            if (this.onPause) {
                this.onPause();
            }
            
            this.updateAudioStatus('Paused');
        });
        
        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.updateAudioStatus('Error');
        });
    }
    
    initializeAudioContext() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            
            // Connect audio element to analyser
            const source = this.audioContext.createMediaElementSource(this.audioElement);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
        } catch (error) {
            console.error('Error initializing audio context:', error);
        }
    }
    
    setupCanvas() {
        // Set canvas size
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.canvasCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Initial visualization
        this.drawIdleVisualization();
    }
    
    /**
     * Load and prepare audio for playback
     * @param {string} audioData - Base64 encoded audio data
     * @param {string} format - Audio format (mp3, wav, etc.)
     */
    async loadAudio(audioData, format = 'mp3') {
        try {
            // Create blob URL from base64 data
            const byteCharacters = atob(audioData);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: `audio/${format}` });
            const audioUrl = URL.createObjectURL(blob);
            
            // Load into audio element
            this.audioElement.src = audioUrl;
            
            // Wait for audio to be ready
            await new Promise((resolve, reject) => {
                this.audioElement.addEventListener('canplaythrough', resolve, { once: true });
                this.audioElement.addEventListener('error', reject, { once: true });
                this.audioElement.load();
            });
            
            console.log(`Audio loaded: ${this.duration.toFixed(2)}s`);
            this.updateAudioStatus('Ready');
            
        } catch (error) {
            console.error('Error loading audio:', error);
            this.updateAudioStatus('Error');
            throw error;
        }
    }
    
    /**
     * Play audio
     */
    async play() {
        try {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            await this.audioElement.play();
            return performance.now(); // Return start time for sync
            
        } catch (error) {
            console.error('Error playing audio:', error);
            this.updateAudioStatus('Error');
            throw error;
        }
    }
    
    /**
     * Pause audio
     */
    pause() {
        this.audioElement.pause();
    }
    
    /**
     * Stop audio
     */
    stop() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.stopVisualization();
        this.updateAudioStatus('Stopped');
    }
    
    /**
     * Set playback volume
     * @param {number} volume - Volume level (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audioElement.volume = this.volume;
    }
    
    /**
     * Set playback speed
     * @param {number} rate - Playback rate (0.5-2.0)
     */
    setPlaybackRate(rate) {
        this.playbackRate = Math.max(0.5, Math.min(2.0, rate));
        this.audioElement.playbackRate = this.playbackRate;
    }
    
    /**
     * Seek to specific time
     * @param {number} time - Time in seconds
     */
    seekTo(time) {
        if (this.audioElement.duration) {
            this.audioElement.currentTime = Math.max(0, Math.min(time, this.audioElement.duration));
        }
    }
    
    /**
     * Start audio visualization
     */
    startVisualization() {
        if (this.visualizationId) return;
        
        const draw = () => {
            if (!this.isPlaying) return;
            
            this.visualizationId = requestAnimationFrame(draw);
            
            if (this.analyser) {
                this.analyser.getByteFrequencyData(this.dataArray);
                this.drawVisualization();
            }
        };
        
        draw();
    }
    
    /**
     * Stop audio visualization
     */
    stopVisualization() {
        if (this.visualizationId) {
            cancelAnimationFrame(this.visualizationId);
            this.visualizationId = null;
        }
        this.drawIdleVisualization();
    }
    
    /**
     * Draw audio visualization
     */
    drawVisualization() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        
        // Clear canvas
        this.canvasCtx.fillStyle = '#1a1a2e';
        this.canvasCtx.fillRect(0, 0, width, height);
        
        if (!this.dataArray) return;
        
        const barCount = Math.floor(width / (this.barWidth + this.barGap));
        const dataStep = Math.floor(this.bufferLength / barCount);
        
        // Draw frequency bars
        for (let i = 0; i < barCount; i++) {
            const dataIndex = i * dataStep;
            const value = this.dataArray[dataIndex] || 0;
            const barHeight = (value / 255) * height * 0.8;
            
            const x = i * (this.barWidth + this.barGap);
            const y = height - barHeight;
            
            // Create gradient
            const gradient = this.canvasCtx.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, '#6366f1');
            gradient.addColorStop(0.5, '#8b5cf6');
            gradient.addColorStop(1, '#ec4899');
            
            this.canvasCtx.fillStyle = gradient;
            this.canvasCtx.fillRect(x, y, this.barWidth, barHeight);
        }
        
        // Draw center line
        this.canvasCtx.strokeStyle = '#374151';
        this.canvasCtx.lineWidth = 1;
        this.canvasCtx.beginPath();
        this.canvasCtx.moveTo(0, height / 2);
        this.canvasCtx.lineTo(width, height / 2);
        this.canvasCtx.stroke();
    }
    
    /**
     * Draw idle visualization (when not playing)
     */
    drawIdleVisualization() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        
        // Clear canvas
        this.canvasCtx.fillStyle = '#1a1a2e';
        this.canvasCtx.fillRect(0, 0, width, height);
        
        // Draw static bars
        const barCount = Math.floor(width / (this.barWidth + this.barGap));
        
        for (let i = 0; i < barCount; i++) {
            const x = i * (this.barWidth + this.barGap);
            const baseHeight = 5;
            const y = height / 2 - baseHeight / 2;
            
            this.canvasCtx.fillStyle = '#374151';
            this.canvasCtx.fillRect(x, y, this.barWidth, baseHeight);
        }
        
        // Draw "Audio Ready" text
        this.canvasCtx.fillStyle = '#71717a';
        this.canvasCtx.font = '14px Inter, sans-serif';
        this.canvasCtx.textAlign = 'center';
        this.canvasCtx.fillText('Audio Visualizer', width / 2, height / 2 - 20);
    }
    
    /**
     * Update time display
     */
    updateTimeDisplay() {
        const timeElement = document.getElementById('audio-time');
        if (timeElement) {
            const current = this.formatTime(this.currentTime);
            const total = this.formatTime(this.duration);
            timeElement.textContent = `${current} / ${total}`;
        }
    }
    
    /**
     * Update progress bar
     */
    updateProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar && this.duration > 0) {
            const progress = (this.currentTime / this.duration) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }
    
    /**
     * Update audio status display
     */
    updateAudioStatus(status) {
        const statusElement = document.getElementById('audio-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    /**
     * Format time in MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Get current audio state
     * @returns {Object} Current state information
     */
    getState() {
        return {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            currentTime: this.currentTime,
            duration: this.duration,
            volume: this.volume,
            playbackRate: this.playbackRate
        };
    }
    
    /**
     * Resize canvas (call when container size changes)
     */
    resize() {
        this.setupCanvas();
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        this.stop();
        
        if (this.visualizationId) {
            cancelAnimationFrame(this.visualizationId);
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        // Revoke object URLs to prevent memory leaks
        if (this.audioElement.src && this.audioElement.src.startsWith('blob:')) {
            URL.revokeObjectURL(this.audioElement.src);
        }
    }
}

// Export for use in other modules
window.AudioProcessor = AudioProcessor;
