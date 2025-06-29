/**
 * Avatar Manager - Handles 3D avatar loading and rendering with Three.js
 */

class AvatarManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.avatar = null;
        this.avatarGroup = null;
        this.mixer = null;
        this.morphTargets = null;
        this.isLoaded = false;
        
        // Lighting
        this.ambientLight = null;
        this.directionalLight = null;
        
        // Animation
        this.animationId = null;
        this.clock = new THREE.Clock();
        
        // Avatar URLs for different types
        this.avatarUrls = {
            default: 'https://models.readyplayer.me/6409b9c7d4c64bda5b9b7b94.glb',
            female: 'https://models.readyplayer.me/6409b9c7d4c64bda5b9b7b95.glb',
            male: 'https://models.readyplayer.me/6409b9c7d4c64bda5b9b7b96.glb'
        };
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
        this.setupControls();
        this.startRenderLoop();
        
        // Load default avatar
        this.loadDefaultAvatar();
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        
        // Add fog for depth
        this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
    }
    
    setupCamera() {
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 1.6, 3);
        this.camera.lookAt(0, 1.6, 0);
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    setupLighting() {
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(this.ambientLight);
        
        // Main directional light
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(2, 4, 2);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 1024;
        this.directionalLight.shadow.mapSize.height = 1024;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 50;
        this.scene.add(this.directionalLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0x4040ff, 0.3);
        fillLight.position.set(-2, 2, -2);
        this.scene.add(fillLight);
        
        // Rim light
        const rimLight = new THREE.DirectionalLight(0xff4040, 0.2);
        rimLight.position.set(0, 2, -4);
        this.scene.add(rimLight);
    }
    
    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.target.set(0, 1.6, 0);
    }
    
    startRenderLoop() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            
            const deltaTime = this.clock.getDelta();
            
            // Update controls
            this.controls.update();
            
            // Update animation mixer
            if (this.mixer) {
                this.mixer.update(deltaTime);
            }
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }
    
    async loadDefaultAvatar() {
        await this.loadAvatar('default');
    }
    
    async loadAvatar(type = 'default', customUrl = null) {
        try {
            this.showLoadingIndicator(true);
            
            // Remove existing avatar
            if (this.avatarGroup) {
                this.scene.remove(this.avatarGroup);
                this.avatarGroup = null;
                this.avatar = null;
                this.morphTargets = null;
            }
            
            const url = customUrl || this.avatarUrls[type] || this.avatarUrls.default;
            
            // Create fallback avatar if URL fails
            if (!url || url === 'custom') {
                this.createFallbackAvatar();
                this.showLoadingIndicator(false);
                return;
            }
            
            const loader = new THREE.GLTFLoader();
            
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    url,
                    resolve,
                    (progress) => {
                        const percent = (progress.loaded / progress.total * 100).toFixed(0);
                        console.log(`Loading avatar: ${percent}%`);
                    },
                    reject
                );
            });
            
            this.avatar = gltf.scene;
            this.avatarGroup = new THREE.Group();
            this.avatarGroup.add(this.avatar);
            
            // Scale and position avatar
            this.avatar.scale.setScalar(1);
            this.avatar.position.set(0, 0, 0);
            
            // Setup shadows
            this.avatar.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Setup materials
                    if (child.material) {
                        child.material.needsUpdate = true;
                    }
                }
            });
            
            // Find morph targets for facial animation
            this.findMorphTargets();
            
            // Setup animation mixer
            this.mixer = new THREE.AnimationMixer(this.avatar);
            
            // Add to scene
            this.scene.add(this.avatarGroup);
            
            this.isLoaded = true;
            this.showLoadingIndicator(false);
            
            console.log('Avatar loaded successfully:', type);
            
        } catch (error) {
            console.error('Error loading avatar:', error);
            this.createFallbackAvatar();
            this.showLoadingIndicator(false);
        }
    }
    
    findMorphTargets() {
        this.morphTargets = new Map();
        
        if (!this.avatar) return;
        
        this.avatar.traverse((child) => {
            if (child.isMesh && child.morphTargetDictionary) {
                // Common viseme morph target names
                const visemeNames = [
                    'viseme_sil', 'viseme_PP', 'viseme_FF', 'viseme_TH',
                    'viseme_DD', 'viseme_kk', 'viseme_CH', 'viseme_SS',
                    'viseme_nn', 'viseme_RR', 'viseme_aa', 'viseme_E',
                    'viseme_I', 'viseme_O', 'viseme_U'
                ];
                
                visemeNames.forEach((name, index) => {
                    if (child.morphTargetDictionary[name] !== undefined) {
                        this.morphTargets.set(index, {
                            mesh: child,
                            index: child.morphTargetDictionary[name]
                        });
                    }
                });
                
                console.log('Found morph targets:', Object.keys(child.morphTargetDictionary));
            }
        });
    }
    
    createFallbackAvatar() {
        // Create a simple geometric avatar as fallback
        this.avatarGroup = new THREE.Group();
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 1.6, 0);
        head.castShadow = true;
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 1.65, 0.25);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 1.65, 0.25);
        
        // Mouth
        const mouthGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
        const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0x880000 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 1.5, 0.28);
        mouth.rotation.z = Math.PI / 2;
        
        // Body (simple cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x4040ff });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0, 0.8, 0);
        body.castShadow = true;
        
        this.avatarGroup.add(head, leftEye, rightEye, mouth, body);
        this.scene.add(this.avatarGroup);
        
        // Store references for animation
        this.avatar = {
            head: head,
            mouth: mouth,
            leftEye: leftEye,
            rightEye: rightEye
        };
        
        this.isLoaded = true;
        console.log('Fallback avatar created');
    }
    
    animateViseme(visemeId, intensity = 1.0) {
        if (!this.isLoaded) return;
        
        // If we have morph targets, use them
        if (this.morphTargets && this.morphTargets.has(visemeId)) {
            const target = this.morphTargets.get(visemeId);
            if (target.mesh.morphTargetInfluences) {
                // Reset all morph targets
                target.mesh.morphTargetInfluences.fill(0);
                // Set current viseme
                target.mesh.morphTargetInfluences[target.index] = intensity;
            }
        } else if (this.avatar && this.avatar.mouth) {
            // Fallback animation for simple avatar
            this.animateFallbackMouth(visemeId, intensity);
        }
    }
    
    animateFallbackMouth(visemeId, intensity) {
        if (!this.avatar || !this.avatar.mouth) return;
        
        const mouth = this.avatar.mouth;
        
        // Simple mouth animation based on viseme
        switch (visemeId) {
            case 0: // Silence
                mouth.scale.set(1, 1, 1);
                break;
            case 1: // P, B, M
                mouth.scale.set(0.5, 0.5, 1);
                break;
            case 8: // AA, AO (open vowels)
                mouth.scale.set(1.5, 1.8, 1);
                break;
            case 11: // IY (close vowels)
                mouth.scale.set(1.2, 0.8, 1);
                break;
            case 12: // UW (rounded vowels)
                mouth.scale.set(1, 1, 1.5);
                break;
            default:
                mouth.scale.set(1 + intensity * 0.3, 1 + intensity * 0.2, 1);
        }
        
        // Add slight head movement
        if (this.avatar.head && intensity > 0.5) {
            this.avatar.head.rotation.y = (Math.random() - 0.5) * 0.1;
            this.avatar.head.rotation.x = (Math.random() - 0.5) * 0.05;
        }
    }
    
    resetPosition() {
        if (this.camera && this.controls) {
            this.camera.position.set(0, 1.6, 3);
            this.controls.target.set(0, 1.6, 0);
            this.controls.update();
        }
    }
    
    showLoadingIndicator(show) {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.classList.toggle('hidden', !show);
        }
    }
    
    resize() {
        if (!this.camera || !this.renderer) return;
        
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Clean up scene
        while (this.scene && this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
    }
}

// Export for use in other modules
window.AvatarManager = AvatarManager;
