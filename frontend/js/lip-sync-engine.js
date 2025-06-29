/**
 * Lip-Sync Engine - Manages lip-sync animation based on viseme data
 */

class LipSyncEngine {
    constructor(avatarManager) {
        this.avatarManager = avatarManager;
        this.isPlaying = false;
        this.startTime = 0;
        this.visemeSequence = [];
        this.currentVisemeIndex = 0;
        this.animationId = null;
        
        // Animation settings
        this.smoothing = 0.15; // How smooth transitions should be
        this.intensity = 1.0;  // Overall animation intensity
        
        // Debug elements
        this.debugElements = {
            currentViseme: document.getElementById('current-viseme'),
            animationFrame: document.getElementById('animation-frame'),
            visemeSequence: document.getElementById('viseme-sequence')
        };
        
        // Current state
        this.currentViseme = 0;
        this.targetViseme = 0;
        this.animationFrame = 0;
        
        console.log('LipSyncEngine initialized');
    }
    
    /**
     * Start lip-sync animation with viseme sequence
     * @param {Array} visemes - Array of viseme objects with time_offset, viseme_id, duration
     * @param {number} audioStartTime - When the audio started playing (performance.now())
     */
    startAnimation(visemes, audioStartTime = null) {
        this.visemeSequence = visemes || [];
        this.isPlaying = true;
        this.startTime = audioStartTime || performance.now();
        this.currentVisemeIndex = 0;
        this.animationFrame = 0;
        
        // Update debug info
        this.updateDebugInfo();
        
        if (this.visemeSequence.length === 0) {
            console.warn('No viseme sequence provided');
            return;
        }
        
        console.log(`Starting lip-sync animation with ${this.visemeSequence.length} visemes`);
        
        // Start animation loop
        this.animate();
    }
    
    /**
     * Stop lip-sync animation
     */
    stopAnimation() {
        this.isPlaying = false;
        this.currentViseme = 0;
        this.targetViseme = 0;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Reset avatar to neutral position
        this.avatarManager.animateViseme(0, 0);
        
        console.log('Lip-sync animation stopped');
    }
    
    /**
     * Pause lip-sync animation
     */
    pauseAnimation() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Resume lip-sync animation
     */
    resumeAnimation(newStartTime = null) {
        if (newStartTime) {
            this.startTime = newStartTime;
        }
        this.isPlaying = true;
        this.animate();
    }
    
    /**
     * Main animation loop
     */
    animate() {
        if (!this.isPlaying) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const currentTime = performance.now();
        const elapsedTime = (currentTime - this.startTime) / 1000; // Convert to seconds
        
        this.animationFrame++;
        
        // Find current viseme based on elapsed time
        const currentViseme = this.getCurrentViseme(elapsedTime);
        
        if (currentViseme !== null) {
            this.targetViseme = currentViseme.viseme_id;
            
            // Smooth transition to target viseme
            this.currentViseme += (this.targetViseme - this.currentViseme) * this.smoothing;
            
            // Calculate intensity based on timing
            const intensity = this.calculateIntensity(currentViseme, elapsedTime);
            
            // Animate avatar
            this.avatarManager.animateViseme(Math.round(this.currentViseme), intensity);
        } else {
            // No current viseme, transition to neutral
            this.currentViseme += (0 - this.currentViseme) * this.smoothing;
            this.avatarManager.animateViseme(0, 0);
        }
        
        // Update debug info
        this.updateDebugInfo();
    }
    
    /**
     * Get current viseme based on elapsed time
     * @param {number} elapsedTime - Time elapsed since animation start
     * @returns {Object|null} Current viseme object or null
     */
    getCurrentViseme(elapsedTime) {
        if (this.visemeSequence.length === 0) return null;
        
        // Find the viseme that should be active at this time
        for (let i = 0; i < this.visemeSequence.length; i++) {
            const viseme = this.visemeSequence[i];
            const visemeStart = viseme.time_offset;
            const visemeEnd = visemeStart + (viseme.duration || 0.1);
            
            if (elapsedTime >= visemeStart && elapsedTime <= visemeEnd) {
                this.currentVisemeIndex = i;
                return viseme;
            }
        }
        
        // Check if we're before the first viseme
        if (elapsedTime < this.visemeSequence[0].time_offset) {
            return { viseme_id: 0, time_offset: 0, duration: 0.1 }; // Neutral
        }
        
        // Check if we're after the last viseme
        const lastViseme = this.visemeSequence[this.visemeSequence.length - 1];
        if (elapsedTime > lastViseme.time_offset + (lastViseme.duration || 0.1)) {
            return { viseme_id: 0, time_offset: elapsedTime, duration: 0.1 }; // Neutral
        }
        
        return null;
    }
    
    /**
     * Calculate animation intensity based on viseme timing
     * @param {Object} viseme - Current viseme object
     * @param {number} elapsedTime - Current elapsed time
     * @returns {number} Intensity value (0-1)
     */
    calculateIntensity(viseme, elapsedTime) {
        if (!viseme) return 0;
        
        const visemeStart = viseme.time_offset;
        const visemeDuration = viseme.duration || 0.1;
        const relativeTime = elapsedTime - visemeStart;
        const progress = relativeTime / visemeDuration;
        
        // Create a smooth intensity curve (ease in/out)
        let intensity = 1.0;
        
        if (progress < 0.2) {
            // Ease in
            intensity = progress / 0.2;
        } else if (progress > 0.8) {
            // Ease out
            intensity = (1.0 - progress) / 0.2;
        }
        
        return Math.max(0, Math.min(1, intensity * this.intensity));
    }
    
    /**
     * Set animation intensity
     * @param {number} intensity - Intensity value (0-1)
     */
    setIntensity(intensity) {
        this.intensity = Math.max(0, Math.min(1, intensity));
    }
    
    /**
     * Set animation smoothing
     * @param {number} smoothing - Smoothing value (0-1)
     */
    setSmoothing(smoothing) {
        this.smoothing = Math.max(0.01, Math.min(1, smoothing));
    }
    
    /**
     * Update debug information display
     */
    updateDebugInfo() {
        if (this.debugElements.currentViseme) {
            this.debugElements.currentViseme.textContent = `${Math.round(this.currentViseme)} (target: ${this.targetViseme})`;
        }
        
        if (this.debugElements.animationFrame) {
            this.debugElements.animationFrame.textContent = this.animationFrame;
        }
        
        if (this.debugElements.visemeSequence && this.visemeSequence.length > 0) {
            const sequence = this.visemeSequence
                .slice(0, 10) // Show first 10 visemes
                .map(v => `${v.viseme_id}@${v.time_offset.toFixed(2)}s`)
                .join('\n');
            this.debugElements.visemeSequence.textContent = sequence + 
                (this.visemeSequence.length > 10 ? '\n...' : '');
        }
    }
    
    /**
     * Get current animation state
     * @returns {Object} Current state information
     */
    getState() {
        return {
            isPlaying: this.isPlaying,
            currentViseme: this.currentViseme,
            targetViseme: this.targetViseme,
            animationFrame: this.animationFrame,
            visemeCount: this.visemeSequence.length,
            currentIndex: this.currentVisemeIndex
        };
    }
}

// Export for use in other modules
window.LipSyncEngine = LipSyncEngine;
