/**
 * Main Application - AI Avatar Generator with Lip-Sync
 */

class AvatarApp {
    constructor() {
        this.avatarManager = null;
        this.lipSyncEngine = null;
        this.audioProcessor = null;
        
        // API configuration
        this.apiBaseUrl = 'http://localhost:5000/api';
        
        // UI elements
        this.elements = {
            textInput: document.getElementById('text-input'),
            charCount: document.getElementById('char-count'),
            languageSelect: document.getElementById('language-select'),
            speedControl: document.getElementById('speed-control'),
            speedValue: document.getElementById('speed-value'),
            volumeControl: document.getElementById('volume-control'),
            volumeValue: document.getElementById('volume-value'),
            avatarSelect: document.getElementById('avatar-select'),
            generateBtn: document.getElementById('generate-btn'),
            stopBtn: document.getElementById('stop-btn'),
            playPauseBtn: document.getElementById('play-pause-btn'),
            loadAvatarBtn: document.getElementById('load-avatar-btn'),
            resetAvatarBtn: document.getElementById('reset-avatar-btn'),
            audioSection: document.getElementById('audio-section'),
            generationStatus: document.getElementById('generation-status'),
            statusText: document.getElementById('status-text')
        };
        
        // Application state
        this.state = {
            isGenerating: false,
            hasAudio: false,
            isPlaying: false,
            currentAudio: null
        };
        
        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing AI Avatar Generator...');
            
            // Initialize core components
            this.avatarManager = new AvatarManager('avatar-canvas');
            this.lipSyncEngine = new LipSyncEngine(this.avatarManager);
            this.audioProcessor = new AudioProcessor();
            
            // Setup UI event listeners
            this.setupEventListeners();
            
            // Setup audio processor callbacks
            this.setupAudioCallbacks();
            
            // Check API health
            await this.checkApiHealth();
            
            // Update UI
            this.updateUI();
            
            console.log('AI Avatar Generator initialized successfully');
            
        } catch (error) {
            console.error('Error initializing application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }
    
    setupEventListeners() {
        // Text input
        this.elements.textInput.addEventListener('input', () => {
            this.updateCharacterCount();
        });
        
        // Control sliders
        this.elements.speedControl.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.speedValue.textContent = `${value.toFixed(1)}x`;
            this.audioProcessor.setPlaybackRate(value);
        });
        
        this.elements.volumeControl.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.volumeValue.textContent = `${Math.round(value * 100)}%`;
            this.audioProcessor.setVolume(value);
        });
        
        // Buttons
        this.elements.generateBtn.addEventListener('click', () => {
            this.generateSpeech();
        });
        
        this.elements.stopBtn.addEventListener('click', () => {
            this.stopPlayback();
        });
        
        this.elements.playPauseBtn.addEventListener('click', () => {
            this.togglePlayback();
        });
        
        this.elements.loadAvatarBtn.addEventListener('click', () => {
            this.loadSelectedAvatar();
        });
        
        this.elements.resetAvatarBtn.addEventListener('click', () => {
            this.avatarManager.resetPosition();
        });
        
        // Avatar selection
        this.elements.avatarSelect.addEventListener('change', () => {
            this.loadSelectedAvatar();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.avatarManager.resize();
            this.audioProcessor.resize();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.generateSpeech();
                        break;
                    case ' ':
                        e.preventDefault();
                        this.togglePlayback();
                        break;
                }
            }
        });
    }
    
    setupAudioCallbacks() {
        this.audioProcessor.onPlay = () => {
            this.state.isPlaying = true;
            this.updatePlayButton();
            
            // Start lip-sync animation
            if (this.state.currentAudio && this.state.currentAudio.visemes) {
                const startTime = performance.now();
                this.lipSyncEngine.startAnimation(this.state.currentAudio.visemes, startTime);
            }
        };
        
        this.audioProcessor.onPause = () => {
            this.state.isPlaying = false;
            this.updatePlayButton();
            this.lipSyncEngine.pauseAnimation();
        };
        
        this.audioProcessor.onEnded = () => {
            this.state.isPlaying = false;
            this.updatePlayButton();
            this.lipSyncEngine.stopAnimation();
        };
        
        this.audioProcessor.onTimeUpdate = (currentTime, duration) => {
            // Update lip-sync timing if needed
        };
    }
    
    async checkApiHealth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            if (!response.ok) {
                throw new Error(`API health check failed: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API health check:', data);
            
        } catch (error) {
            console.warn('API not available, using offline mode:', error);
            // Could implement offline fallback here
        }
    }
    
    async generateSpeech() {
        const text = this.elements.textInput.value.trim();
        
        if (!text) {
            this.showError('Please enter some text to generate speech.');
            return;
        }
        
        if (this.state.isGenerating) {
            return; // Already generating
        }
        
        try {
            this.state.isGenerating = true;
            this.showGenerationStatus(true, 'Generating speech...');
            this.updateUI();
            
            const language = this.elements.languageSelect.value;
            const requestData = {
                text: text,
                language: language,
                provider: 'gtts'
            };
            
            console.log('Generating speech for:', text);
            
            const response = await fetch(`${this.apiBaseUrl}/generate-speech`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Speech generation failed');
            }
            
            console.log('Speech generated successfully:', {
                duration: result.duration,
                visemes: result.visemes.length,
                format: result.format
            });
            
            // Load audio
            this.showGenerationStatus(true, 'Loading audio...');
            await this.audioProcessor.loadAudio(result.audio_data, result.format);
            
            // Store audio data
            this.state.currentAudio = result;
            this.state.hasAudio = true;
            
            // Show audio section
            this.elements.audioSection.classList.remove('hidden');
            
            // Auto-play if desired
            setTimeout(() => {
                this.playAudio();
            }, 500);
            
        } catch (error) {
            console.error('Error generating speech:', error);
            this.showError(`Failed to generate speech: ${error.message}`);
        } finally {
            this.state.isGenerating = false;
            this.showGenerationStatus(false);
            this.updateUI();
        }
    }
    
    async playAudio() {
        if (!this.state.hasAudio || this.state.isPlaying) {
            return;
        }
        
        try {
            await this.audioProcessor.play();
        } catch (error) {
            console.error('Error playing audio:', error);
            this.showError('Failed to play audio. Please try again.');
        }
    }
    
    togglePlayback() {
        if (!this.state.hasAudio) {
            return;
        }
        
        if (this.state.isPlaying) {
            this.audioProcessor.pause();
        } else {
            this.playAudio();
        }
    }
    
    stopPlayback() {
        this.audioProcessor.stop();
        this.lipSyncEngine.stopAnimation();
        this.state.isPlaying = false;
        this.updatePlayButton();
    }
    
    async loadSelectedAvatar() {
        const selectedType = this.elements.avatarSelect.value;
        
        if (selectedType === 'custom') {
            const url = prompt('Enter custom avatar URL (GLB/GLTF format):');
            if (url) {
                await this.avatarManager.loadAvatar('custom', url);
            }
        } else {
            await this.avatarManager.loadAvatar(selectedType);
        }
    }
    
    updateCharacterCount() {
        const text = this.elements.textInput.value;
        const count = text.length;
        const max = 500;
        
        this.elements.charCount.textContent = `${count}/${max}`;
        
        if (count > max) {
            this.elements.charCount.style.color = '#ef4444';
            this.elements.textInput.value = text.substring(0, max);
        } else if (count > max * 0.9) {
            this.elements.charCount.style.color = '#f59e0b';
        } else {
            this.elements.charCount.style.color = '#71717a';
        }
    }
    
    updatePlayButton() {
        const btn = this.elements.playPauseBtn;
        const icon = btn.querySelector('.btn-icon');
        
        if (this.state.isPlaying) {
            icon.textContent = '⏸️';
            btn.classList.remove('hidden');
        } else if (this.state.hasAudio) {
            icon.textContent = '▶️';
            btn.classList.remove('hidden');
        } else {
            btn.classList.add('hidden');
        }
    }
    
    updateUI() {
        // Update generate button
        if (this.state.isGenerating) {
            this.elements.generateBtn.disabled = true;
            this.elements.generateBtn.querySelector('.btn-icon').textContent = '⏳';
            this.elements.stopBtn.classList.remove('hidden');
        } else {
            this.elements.generateBtn.disabled = false;
            this.elements.generateBtn.querySelector('.btn-icon').textContent = '🎤';
            this.elements.stopBtn.classList.add('hidden');
        }
        
        // Update play button
        this.updatePlayButton();
        
        // Update character count
        this.updateCharacterCount();
    }
    
    showGenerationStatus(show, message = '') {
        if (show) {
            this.elements.statusText.textContent = message;
            this.elements.generationStatus.classList.remove('hidden');
        } else {
            this.elements.generationStatus.classList.add('hidden');
        }
    }
    
    showError(message) {
        // Simple error display - could be enhanced with a proper toast system
        alert(message);
        console.error('Application error:', message);
    }
    
    showSuccess(message) {
        // Simple success display - could be enhanced with a proper toast system
        console.log('Success:', message);
    }
    
    dispose() {
        // Clean up resources
        if (this.avatarManager) {
            this.avatarManager.dispose();
        }
        
        if (this.lipSyncEngine) {
            this.lipSyncEngine.stopAnimation();
        }
        
        if (this.audioProcessor) {
            this.audioProcessor.dispose();
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.avatarApp = new AvatarApp();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.avatarApp) {
        window.avatarApp.dispose();
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});
