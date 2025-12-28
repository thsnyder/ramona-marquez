/* ============================================
   WHERE IS TOODLES? - PHASER 3 + TONE.JS
   ============================================ */

// ============================================
// LEVEL CONFIGURATIONS
// ============================================

const levelConfigs = [
    {
        level: 1,
        clutterCount: 8,
        toodlesSize: 80,  // Bigger for level 1
        toodlesOpacity: 0.9,
        spawnZones: [
            { x: 10, y: 20, width: 30, height: 30 },
            { x: 40, y: 15, width: 30, height: 30 },
            { x: 60, y: 25, width: 30, height: 30 },
            { x: 20, y: 50, width: 30, height: 30 },
            { x: 50, y: 55, width: 30, height: 30 },
            { x: 70, y: 60, width: 25, height: 25 }
        ]
    },
    {
        level: 2,
        clutterCount: 15,
        toodlesSize: 55,  // Medium for level 2
        toodlesOpacity: 0.75,
        spawnZones: [
            { x: 5, y: 10, width: 25, height: 25 },
            { x: 35, y: 12, width: 25, height: 25 },
            { x: 65, y: 18, width: 25, height: 25 },
            { x: 15, y: 45, width: 25, height: 25 },
            { x: 45, y: 50, width: 25, height: 25 },
            { x: 75, y: 55, width: 20, height: 20 },
            { x: 25, y: 70, width: 25, height: 25 }
        ]
    },
    {
        level: 3,
        clutterCount: 22,
        toodlesSize: 40,  // Smaller for level 3
        toodlesOpacity: 0.6,
        spawnZones: [
            { x: 8, y: 8, width: 20, height: 20 },
            { x: 30, y: 10, width: 20, height: 20 },
            { x: 55, y: 15, width: 20, height: 20 },
            { x: 75, y: 12, width: 18, height: 18 },
            { x: 12, y: 40, width: 20, height: 20 },
            { x: 40, y: 45, width: 20, height: 20 },
            { x: 65, y: 50, width: 18, height: 18 },
            { x: 20, y: 65, width: 20, height: 20 },
            { x: 50, y: 70, width: 18, height: 18 }
        ]
    }
];

// ============================================
// HORROR TEXT FLAVOR LINES
// ============================================

const horrorTexts = [
    "The attic breathes.",
    "Something watches.",
    "Time is running out.",
    "The shadows shift.",
    "You're not alone.",
    "The infection spreads.",
    "Find her. Now.",
    "The darkness grows.",
    "Tick. Tock.",
    "She's waiting."
];

// ============================================
// INFECTION STAGES
// ============================================

const InfectionStages = {
    NORMAL: { name: 'Normal', threshold: 0, color: 0x4a9eff, heartbeat: 0 },
    WORRIED: { name: 'Worried', threshold: 10, color: 0x9b59b6, heartbeat: 60 },
    SAD: { name: 'Sad', threshold: 20, color: 0xe74c3c, heartbeat: 90 },
    TAKEOVER: { name: 'Takeover', threshold: 30, color: 0x8b0000, heartbeat: 120 }
};

// ============================================
// VISUAL EFFECTS (Using Phaser's native systems)
// ============================================
// Flashlight effect implemented via masks and graphics
// Film grain via particle system
// ============================================

// AUDIO SYSTEM (TONE.JS)
// ============================================

class AudioManager {
    constructor() {
        this.isMuted = false;
        this.ambientOsc = null;
        this.heartbeatOsc = null;
        this.heartbeatInterval = null;
    }

    async init() {
        await Tone.start();
    }

    playAmbient() {
        if (this.isMuted) return;
        
        if (this.ambientOsc) {
            this.ambientOsc.stop();
        }
        
        this.ambientOsc = new Tone.Oscillator(60, 'sawtooth').toDestination();
        this.ambientOsc.volume.value = -26; // ~0.05 volume
        this.ambientOsc.start();
        
        // Subtle frequency variation
        this.ambientOsc.frequency.rampTo(58, 2);
        this.ambientOsc.frequency.rampTo(60, 4);
    }

    playHeartbeat(bpm = 60) {
        if (this.isMuted) return;
        
        if (this.heartbeatOsc) {
            this.heartbeatOsc.stop();
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
            }
        }
        
        this.heartbeatOsc = new Tone.Oscillator(40, 'sine').toDestination();
        this.heartbeatOsc.volume.value = -22; // ~0.08 volume
        
        const interval = 60000 / bpm;
        
        const beat = () => {
            this.heartbeatOsc.start();
            this.heartbeatOsc.volume.rampTo(-22, 0);
            this.heartbeatOsc.volume.rampTo(-40, 0.1);
            setTimeout(() => this.heartbeatOsc.stop(), 100);
        };
        
        beat();
        this.heartbeatInterval = setInterval(beat, interval);
    }

    stopHeartbeat() {
        if (this.heartbeatOsc) {
            this.heartbeatOsc.stop();
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    playClick() {
        if (this.isMuted) return;
        const osc = new Tone.Oscillator(800, 'square').toDestination();
        osc.volume.value = -16;
        osc.start();
        osc.stop('+0.1');
    }

    playSuccess() {
        if (this.isMuted) return;
        const notes = [523, 659, 784]; // C, E, G
        notes.forEach((freq, i) => {
            const osc = new Tone.Oscillator(freq, 'sine').toDestination();
            osc.volume.value = -14;
            osc.start(`+${i * 0.1}`);
            osc.stop(`+${i * 0.1 + 0.2}`);
        });
    }

    playFail() {
        if (this.isMuted) return;
        const osc1 = new Tone.Oscillator(150, 'sawtooth').toDestination();
        osc1.volume.value = -10;
        osc1.start();
        osc1.stop('+0.5');
        
        const osc2 = new Tone.Oscillator(100, 'sawtooth').toDestination();
        osc2.volume.value = -10;
        osc2.start('+0.2');
        osc2.stop('+0.7');
    }

    stopAll() {
        if (this.ambientOsc) this.ambientOsc.stop();
        this.stopHeartbeat();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopAll();
        }
        return this.isMuted;
    }
}

const audioManager = new AudioManager();

// ============================================
// MENU SCENE
// ============================================

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // Load Toodles image for menu
        this.load.image('toodles', 'toodles-standing.png');
        
        // Add load error handler
        this.load.on('filecomplete-image-toodles', () => {
            console.log('Toodles image loaded successfully');
        });
        
        this.load.on('loaderror', (file) => {
            console.error('Failed to load:', file.key, file.src);
        });
    }

    create() {
        const { width, height } = this.scale;
        
        // Create background
        this.add.rectangle(width / 2, height / 2, width, height, 0x1a0f1a);
        
        // Display Toodles on the menu screen so players know what to look for
        // Position to the left of the menu content area
        // Menu overlay content is centered, max-width 500px, so position Toodles to the left
        const menuContentWidth = 500; // Max width of overlay-content
        const toodlesX = (width / 2) - (menuContentWidth / 2) - 200; // Left of menu content
        const toodlesY = height / 2; // Vertically centered with menu
        
        // Check if texture is loaded before creating sprite
        if (this.textures.exists('toodles')) {
            const menuToodles = this.add.sprite(toodlesX, toodlesY, 'toodles');
            
            // Scale Toodles to a nice size for the menu
            const texture = this.textures.get('toodles');
            const originalWidth = texture.source[0].width;
            const originalHeight = texture.source[0].height;
            const menuScale = 800 / Math.max(originalWidth, originalHeight); // Scale to 800px
            menuToodles.setScale(menuScale);
            menuToodles.setAlpha(1);
            menuToodles.clearTint();
            menuToodles.setDepth(10); // Higher depth to ensure visibility
            menuToodles.setOrigin(0.5, 0.5); // Center the sprite
            menuToodles.setVisible(true); // Ensure sprite is visible
            
            console.log('Toodles sprite created at:', toodlesX, toodlesY, 'scale:', menuScale);
            
            // Store reference for animation
            this.menuToodles = menuToodles;
        
            // Add subtle animation to make Toodles more noticeable
            this.tweens.add({
                targets: menuToodles,
                y: menuToodles.y - 15,
                duration: 2000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            
            // Add a gentle glow effect (scaled up for bigger Toodles)
            const glow = this.add.graphics();
            glow.fillStyle(0x9b59b6, 0.4);
            glow.fillCircle(toodlesX, toodlesY, 900); // Large glow
            glow.setDepth(5); // Below Toodles but above background
            
            // Pulse the glow
            this.tweens.add({
                targets: glow,
                alpha: { from: 0.4, to: 0.7 },
                scaleX: { from: 1, to: 1.3 },
                scaleY: { from: 1, to: 1.3 },
                duration: 1500,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            
            this.menuGlow = glow;
        } else {
            console.error('Toodles texture not loaded!');
        }
        
        // Menu is handled by HTML overlay
        // This scene just initializes audio and displays Toodles
        audioManager.init();
    }
}

// ============================================
// GAME SCENE
// ============================================

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.currentLevel = 0;
        this.timeRemaining = 15;
        this.infectionStage = 0;
        this.highContrastMode = false;
        this.toodles = null;
        this.clutterObjects = [];
        this.flashlightShader = null;
        this.grainShader = null;
        this.mousePos = { x: 0.5, y: 0.5 };
        this.flashlightPos = { x: 0, y: 0 };
        this.flashlightRadius = 0;
    }

    preload() {
        // Load Toodles images
        this.load.image('toodles', 'toodles-standing.png');
        this.load.image('toodles-infected', 'toodles-infected.png');
        
        // Add load event handlers for debugging
        this.load.on('filecomplete-image-toodles', () => {
            console.log('Toodles standing image loaded successfully');
        });
        
        this.load.on('filecomplete-image-toodles-infected', () => {
            console.log('Toodles infected image loaded successfully');
        });
        
        this.load.on('loaderror', (file) => {
            console.error('Failed to load image:', file.key, file.src);
        });
    }

    create() {
        const { width, height } = this.scale;
        
        // Create background with gradient effect
        this.background = this.add.rectangle(width / 2, height / 2, width, height, 0x1a0f1a);
        
        // Create dark overlay for flashlight effect
        this.darkOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000);
        this.darkOverlay.setAlpha(0.8);
        this.darkOverlay.setDepth(100);
        this.darkOverlay.setInteractive(); // Make it interactive so it doesn't block clicks
        this.darkOverlay.disableInteractive(); // But disable it so clicks pass through
        
        // Set up camera fade
        this.cameras.main.fadeIn(500, 0, 0, 0);
        
        // Create flashlight mask graphics (bright circle)
        this.flashlightMaskGraphics = this.make.graphics();
        this.updateFlashlightMask(width / 2, height / 2);
        
        // Create mask from graphics
        const mask = this.flashlightMaskGraphics.createGeometryMask();
        mask.setInvertAlpha(true); // Invert so dark overlay is cut out where mask is
        this.darkOverlay.setMask(mask);
        
        // Create flashlight bright spot overlay
        this.flashlightSpot = this.add.graphics();
        this.flashlightSpot.setDepth(99);
        this.flashlightSpot.setInteractive(); // Make interactive
        this.flashlightSpot.disableInteractive(); // But disable so clicks pass through
        this.updateFlashlightSpot(width / 2, height / 2);
        
        // Create main container for game objects
        this.gameContainer = this.add.container(0, 0);
        this.gameContainer.setDepth(50); // Below Toodles but above background
        
        // Create film grain overlay using particles
        this.createFilmGrain();
        
        // Create crosshair that follows cursor
        this.crosshair = this.add.graphics();
        this.crosshair.setDepth(200); // Above everything
        this.updateCrosshair(width / 2, height / 2);
        
        // Initialize flashlight position to center
        this.flashlightPos.x = width / 2;
        this.flashlightPos.y = height / 2;
        this.flashlightRadius = Math.min(width, height) * 0.25;
        
        // Track mouse/touch for flashlight and crosshair
        this.input.on('pointermove', (pointer) => {
            this.updateFlashlightMask(pointer.x, pointer.y);
            this.updateFlashlightSpot(pointer.x, pointer.y);
            this.updateCrosshair(pointer.x, pointer.y);
        });
        
        this.input.on('pointerdown', (pointer) => {
            this.updateFlashlightMask(pointer.x, pointer.y);
            this.updateFlashlightSpot(pointer.x, pointer.y);
            this.updateCrosshair(pointer.x, pointer.y);
        });
        
        // Also update on pointer hover (for desktop)
        this.input.on('pointerover', (pointer) => {
            this.updateFlashlightMask(pointer.x, pointer.y);
            this.updateFlashlightSpot(pointer.x, pointer.y);
            this.updateCrosshair(pointer.x, pointer.y);
        });
        
        // Start first level
        this.startLevel(0);
    }
    
    updateFlashlightMask(x, y) {
        const radius = Math.min(this.scale.width, this.scale.height) * 0.25;
        
        // Store flashlight position and radius for Toodles visibility calculation
        this.flashlightPos.x = x;
        this.flashlightPos.y = y;
        this.flashlightRadius = radius;
        
        this.flashlightMaskGraphics.clear();
        this.flashlightMaskGraphics.fillStyle(0xffffff);
        this.flashlightMaskGraphics.fillCircle(x, y, radius);
        
        // Update Toodles visibility based on flashlight position
        this.updateToodlesVisibility();
    }
    
    updateFlashlightSpot(x, y) {
        const radius = Math.min(this.scale.width, this.scale.height) * 0.25;
        const brightness = this.highContrastMode ? 0.7 : 0.4;
        
        this.flashlightSpot.clear();
        
        // Outer glow
        this.flashlightSpot.fillStyle(0xffffff, brightness * 0.3);
        this.flashlightSpot.fillCircle(x, y, radius * 1.3);
        
        // Main spot
        this.flashlightSpot.fillStyle(0xffffff, brightness);
        this.flashlightSpot.fillCircle(x, y, radius);
        
        // Inner bright core
        this.flashlightSpot.fillStyle(0xffffff, brightness * 1.2);
        this.flashlightSpot.fillCircle(x, y, radius * 0.6);
    }
    
    updateCrosshair(x, y) {
        this.crosshair.clear();
        
        const size = 20;
        const thickness = 2;
        
        // Draw crosshair - white with slight glow
        this.crosshair.lineStyle(thickness + 1, 0x000000, 0.5);
        this.crosshair.lineStyle(thickness, 0xffffff, 0.9);
        
        // Horizontal line
        this.crosshair.moveTo(x - size, y);
        this.crosshair.lineTo(x + size, y);
        
        // Vertical line
        this.crosshair.moveTo(x, y - size);
        this.crosshair.lineTo(x, y + size);
        
        // Center dot
        this.crosshair.fillStyle(0xffffff, 0.9);
        this.crosshair.fillCircle(x, y, 2);
        
        this.crosshair.strokePath();
    }
    
    updateToodlesVisibility() {
        if (!this.toodles) return;
        
        // Don't update visibility if game is lost (infection form should stay visible)
        if (this.timeRemaining <= 0 && this.toodles.tint !== 0x4a0000) {
            // Check if Toodles is in infection form (has dark red tint)
            // If not in infection form yet, allow visibility updates
        } else if (this.timeRemaining <= 0) {
            // Game is lost and Toodles is transforming - don't update visibility
            return;
        }
        
        // Calculate distance from Toodles to flashlight center
        const dx = this.toodles.x - this.flashlightPos.x;
        const dy = this.toodles.y - this.flashlightPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Get base opacity from level config
        const levelConfig = levelConfigs[this.currentLevel];
        const baseOpacity = levelConfig.toodlesOpacity;
        
        // Calculate visibility based on distance from flashlight
        // Very dark when far, bright when close
        const maxDistance = this.flashlightRadius * 1.2; // Slightly beyond flashlight radius
        const minOpacity = 0.1; // Very hard to see when not in flashlight (almost invisible)
        const maxOpacity = baseOpacity; // Full visibility when in flashlight center
        
        // Smooth falloff - more visible the closer to flashlight center
        let visibility = 1 - (distance / maxDistance);
        visibility = Phaser.Math.Clamp(visibility, 0, 1);
        
        // Apply smooth curve for better visual effect (steeper falloff)
        visibility = Math.pow(visibility, 2);
        
        // Calculate final alpha
        const finalAlpha = minOpacity + (maxOpacity - minOpacity) * visibility;
        
        // Update Toodles alpha directly
        this.toodles.setAlpha(finalAlpha);
        this.toodles.baseAlpha = finalAlpha;
    }
    
    createFilmGrain() {
        // Create grain texture if not exists
        if (!this.textures.exists('grain')) {
            const graphics = this.add.graphics();
            graphics.fillStyle(0xffffff);
            graphics.fillRect(0, 0, 2, 2);
            graphics.generateTexture('grain', 2, 2);
            graphics.destroy();
        }
        
        // Create grain effect using small particles
        this.grainParticles = this.add.particles(0, 0, 'grain', {
            x: { min: 0, max: this.scale.width },
            y: { min: 0, max: this.scale.height },
            speed: { min: 0.5, max: 1.5 },
            scale: { start: 0.3, end: 0.1 },
            alpha: { start: 0.15, end: 0 },
            lifespan: 2000,
            frequency: 50
        });
        this.grainParticles.setDepth(200);
    }

    update(time, delta) {
        // Update timer
        if (this.timeRemaining > 0) {
            this.timeRemaining -= delta / 1000;
            const timeElapsed = 15 - this.timeRemaining;
            this.updateTimer(timeElapsed);
            
            if (this.timeRemaining <= 0) {
                this.loseGame();
            }
        }
        
        // Continuously update Toodles visibility based on flashlight position
        this.updateToodlesVisibility();
    }

    startLevel(levelIndex) {
        if (levelIndex >= levelConfigs.length) {
            this.winGame();
            return;
        }
        
        this.currentLevel = levelIndex;
        this.timeRemaining = 15;
        this.infectionStage = 0;
        
        const levelConfig = levelConfigs[levelIndex];
        
        // Clear previous objects
        this.clutterObjects.forEach(obj => obj.destroy());
        this.clutterObjects = [];
        if (this.toodles) {
            // Clean up outline if it exists
            if (this.toodles.outline) {
                this.toodles.outline.destroy();
            }
            this.toodles.destroy();
        }
        
        // Clean up infection form effects if they exist
        if (this.infectionGlow) {
            this.infectionGlow.destroy();
            this.infectionGlow = null;
        }
        if (this.hollowEyes) {
            this.hollowEyes.destroy();
            this.hollowEyes = null;
        }
        
        // Update UI
        document.getElementById('level-display').textContent = levelConfig.level;
        const timerDisplay = document.getElementById('timer-display');
        timerDisplay.textContent = '15';
        
        // Update progress bar
        const totalLevels = levelConfigs.length;
        const currentLevelNum = levelIndex + 1; // levelIndex is 0-based, so add 1
        const progressPercent = (currentLevelNum / totalLevels) * 100;
        document.getElementById('progress-fill').style.width = progressPercent + '%';
        document.getElementById('progress-text').textContent = `${currentLevelNum} / ${totalLevels}`;
        timerDisplay.classList.remove('warning', 'critical'); // Reset timer styling
        document.getElementById('infection-bar').style.width = '0%';
        document.getElementById('infection-bar').style.transition = 'width 0.3s ease, background 0.3s ease';
        document.getElementById('infection-bar').style.background = '#' + InfectionStages.NORMAL.color.toString(16).padStart(6, '0');
        document.getElementById('infection-stage').textContent = InfectionStages.NORMAL.name;
        
        // Make each level progressively dimmer and less forgiving
        const dimness = 0.7 + (levelIndex * 0.1); // 0.7, 0.8, 0.9
        if (this.darkOverlay) {
            this.darkOverlay.setAlpha(0.8 * dimness);
        }
        
        // Spawn clutter (more with each level)
        this.spawnClutter(levelConfig);
        
        // Spawn Toodles (smaller, harder to see)
        this.spawnToodles(levelConfig);
        
        // Ensure game Toodles is visible (in case it was hidden from success screen)
        if (this.toodles) {
            this.toodles.setVisible(true);
        }
        
        // Start audio
        audioManager.playAmbient();
        
        // Show horror text
        this.time.delayedCall(500, () => this.showHorrorText());
    }

    spawnClutter(levelConfig) {
        const { width, height } = this.scale;
        const clutterTypes = ['box', 'trunk', 'sheet', 'frame', 'cobweb'];
        
        for (let i = 0; i < levelConfig.clutterCount; i++) {
            const type = clutterTypes[Math.floor(Math.random() * clutterTypes.length)];
            const obj = this.createClutterObject(type, width, height);
            this.clutterObjects.push(obj);
            this.gameContainer.add(obj);
        }
    }

    createClutterObject(type, sceneWidth, sceneHeight) {
        let graphics, width, height;
        
        switch (type) {
            case 'box':
                width = 60 + Math.random() * 80;
                height = 60 + Math.random() * 80;
                graphics = this.add.graphics();
                graphics.fillStyle(0x2a1f1a);
                graphics.fillRect(0, 0, width, height);
                graphics.lineStyle(2, 0x1a0f0a);
                graphics.strokeRect(0, 0, width, height);
                // Highlight
                graphics.fillStyle(0xffffff, 0.1);
                graphics.fillRect(0, 0, width, height * 0.3);
                break;
                
            case 'trunk':
                width = 80 + Math.random() * 100;
                height = 50 + Math.random() * 70;
                graphics = this.add.graphics();
                graphics.fillStyle(0x1a0f0a);
                graphics.fillRoundedRect(0, 0, width, height, 4);
                graphics.lineStyle(3, 0x0a0505);
                graphics.strokeRoundedRect(0, 0, width, height, 4);
                // Lid
                graphics.fillStyle(0x0a0505);
                graphics.fillRoundedRect(width * 0.1, 0, width * 0.8, 8, 2);
                break;
                
            case 'sheet':
                width = 100 + Math.random() * 120;
                height = 80 + Math.random() * 100;
                graphics = this.add.graphics();
                graphics.fillStyle(0xc8c8c8, 0.3);
                graphics.fillRect(0, 0, width, height);
                graphics.lineStyle(1, 0xffffff, 0.2);
                graphics.strokeRect(0, 0, width, height);
                break;
                
            case 'frame':
                width = 50 + Math.random() * 70;
                height = 60 + Math.random() * 80;
                graphics = this.add.graphics();
                graphics.fillStyle(0x3a2f1a);
                graphics.fillRect(0, 0, width, height);
                graphics.lineStyle(4, 0x2a1f0a);
                graphics.strokeRect(0, 0, width, height);
                // Inner frame
                graphics.fillStyle(0x1a0f0a);
                graphics.fillRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8);
                break;
                
            case 'cobweb':
                width = 40 + Math.random() * 60;
                height = 40 + Math.random() * 60;
                graphics = this.add.graphics();
                graphics.lineStyle(1, 0xffffff, 0.3);
                // Cross pattern
                graphics.moveTo(0, height / 2);
                graphics.lineTo(width, height / 2);
                graphics.moveTo(width / 2, 0);
                graphics.lineTo(width / 2, height);
                graphics.strokePath();
                break;
        }
        
        // Position randomly
        graphics.x = Math.random() * (sceneWidth - width);
        graphics.y = Math.random() * (sceneHeight - height);
        graphics.rotation = (Math.random() - 0.5) * 0.26; // ~15 degrees
        
        // Make interactive
        graphics.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
        graphics.on('pointerdown', () => {
            this.tweens.add({
                targets: graphics,
                x: graphics.x + (Math.random() - 0.5) * 4,
                y: graphics.y + (Math.random() - 0.5) * 4,
                rotation: graphics.rotation + (Math.random() - 0.5) * 0.02,
                duration: 100,
                yoyo: true,
                ease: 'Power2'
            });
            audioManager.playClick();
        });
        
        return graphics;
    }

    spawnToodles(levelConfig) {
        const { width, height } = this.scale;
        
        // Select random spawn zone
        const zone = levelConfig.spawnZones[
            Math.floor(Math.random() * levelConfig.spawnZones.length)
        ];
        
        // Calculate position
        const zoneX = (zone.x / 100) * width;
        const zoneY = (zone.y / 100) * height;
        const zoneW = (zone.width / 100) * width;
        const zoneH = (zone.height / 100) * height;
        
        const x = zoneX + Math.random() * zoneW;
        const y = zoneY + Math.random() * zoneH;
        
        // Create Toodles sprite from image
        const targetSize = levelConfig.toodlesSize;
        
        // Check if texture exists before using it
        if (!this.textures.exists('toodles')) {
            console.error('Toodles texture not found! Make sure toodles-standing.png is loaded.');
            return;
        }
        
        // Get the original image dimensions to calculate scale
        const texture = this.textures.get('toodles');
        if (!texture || !texture.source || !texture.source[0]) {
            console.error('Toodles texture source not available!');
            return;
        }
        
        const originalWidth = texture.source[0].width;
        const originalHeight = texture.source[0].height;
        
        if (!originalWidth || !originalHeight) {
            console.error('Toodles image dimensions invalid:', originalWidth, originalHeight);
            return;
        }
        
        // Calculate scale to fit target size (maintain aspect ratio)
        const scale = targetSize / Math.max(originalWidth, originalHeight);
        
        // Create sprite with proper origin
        const sprite = this.add.sprite(0, 0, 'toodles');
        sprite.setOrigin(0.5, 0.5); // Center the sprite
        sprite.setScale(scale);
        
        // Start with very low opacity - will be updated by flashlight proximity
        sprite.setAlpha(0.15);
        sprite.baseAlpha = 0.15; // Store base alpha for calculations
        
        // Calculate sprite dimensions
        const spriteWidth = originalWidth * scale;
        const spriteHeight = originalHeight * scale;
        
        // Position sprite
        sprite.x = Math.max(spriteWidth / 2, Math.min(x, width - spriteWidth / 2));
        sprite.y = Math.max(spriteHeight / 2, Math.min(y, height - spriteHeight / 2));
        
        // Store dimensions for later use
        sprite.spriteWidth = spriteWidth;
        sprite.spriteHeight = spriteHeight;
        
        // Set high depth so Toodles is above dark overlay and can receive clicks
        sprite.setDepth(150);
        sprite.setVisible(true); // Ensure sprite is visible
        
        // Make interactive - use the sprite's hit area
        sprite.setInteractive({ useHandCursor: false });
        
        console.log('Toodles sprite created:', {
            x: sprite.x,
            y: sprite.y,
            scale: scale,
            width: spriteWidth,
            height: spriteHeight,
            alpha: sprite.alpha,
            visible: sprite.visible,
            depth: sprite.depth
        });
        
        // Click handler - clicking Toodles is the success condition
        sprite.on('pointerdown', (pointer) => {
            console.log('Toodles clicked!', this.timeRemaining);
            // Only allow clicking if game is still playing
            if (this.timeRemaining > 0) {
                console.log('Calling foundToodles()');
                this.foundToodles();
            } else {
                console.log('Timer already expired');
            }
        });
        
        // Add hover effect to show Toodles is clickable
        sprite.on('pointerover', () => {
            if (this.timeRemaining > 0) {
                sprite.setTint(0xffffff);
            }
        });
        
        sprite.on('pointerout', () => {
            sprite.clearTint();
        });
        
        // Subtle blink animation (will be updated by flashlight visibility)
        // Store reference for potential cleanup
        sprite.blinkTween = null;
        
        this.toodles = sprite;
        // Don't add to container - sprite needs to be at depth 150 (above dark overlay at 100)
        // Containers manage their own depth, so adding to container would override sprite depth
        // The sprite is already added to the scene via this.add.sprite()
        
        // High contrast outline (add a graphics overlay for outline)
        if (this.highContrastMode) {
            const outline = this.add.graphics();
            outline.lineStyle(3, 0xffff00, 1);
            outline.strokeRect(
                sprite.x - spriteWidth / 2 - 3,
                sprite.y - spriteHeight / 2 - 3,
                spriteWidth + 6,
                spriteHeight + 6
            );
            outline.setDepth(sprite.depth - 1);
            sprite.outline = outline; // Store reference for cleanup
        }
    }

    updateTimer(timeElapsed) {
        const timerDisplay = document.getElementById('timer-display');
        const timeLeft = Math.ceil(this.timeRemaining);
        timerDisplay.textContent = timeLeft;
        
        // Make timer more obvious with visual feedback
        timerDisplay.classList.remove('warning', 'critical');
        if (timeLeft <= 10) {
            timerDisplay.classList.add('critical');
        } else if (timeLeft <= 20) {
            timerDisplay.classList.add('warning');
        }
        
        // Update infection stage
        let stage;
        if (timeElapsed >= 15) {
            stage = InfectionStages.TAKEOVER;
        } else if (timeElapsed >= 10) {
            stage = InfectionStages.SAD;
        } else if (timeElapsed >= 5) {
            stage = InfectionStages.WORRIED;
        } else {
            stage = InfectionStages.NORMAL;
        }
        
        if (this.infectionStage !== stage.threshold) {
            this.infectionStage = stage.threshold;
            
            // Update UI
            document.getElementById('infection-stage').textContent = stage.name;
            const percent = (timeElapsed / 15) * 100;
            document.getElementById('infection-bar').style.width = percent + '%';
            document.getElementById('infection-bar').style.background = '#' + stage.color.toString(16).padStart(6, '0');
            
            // Update visual effects
            const container = document.getElementById('game-container');
            container.className = 'game-container';
            if (stage === InfectionStages.WORRIED) {
                container.classList.add('stage-worried');
            } else if (stage === InfectionStages.SAD) {
                container.classList.add('stage-sad');
            } else if (stage === InfectionStages.TAKEOVER) {
                container.classList.add('stage-takeover');
            }
            
            // Update heartbeat
            audioManager.stopHeartbeat();
            if (stage.heartbeat > 0) {
                audioManager.playHeartbeat(stage.heartbeat);
            }
        }
    }

    foundToodles() {
        console.log('foundToodles() called - SUCCESS!');
        
        // Prevent multiple calls
        if (this.timeRemaining <= 0) {
            console.log('Already processed success');
            return;
        }
        
        // Freeze timer and infection
        this.timeRemaining = 0;
        const timerDisplay = document.getElementById('timer-display');
        timerDisplay.textContent = Math.ceil(this.timeRemaining);
        
        // Stop infection bar animation
        const infectionBar = document.getElementById('infection-bar');
        const currentWidth = infectionBar.style.width;
        infectionBar.style.transition = 'none';
        infectionBar.style.width = currentWidth;
        
        // Stop heartbeat
        audioManager.stopHeartbeat();
        
        // BIG SUCCESS FEEDBACK - Make it very clear success happened
        
        // 1. Success checkmark at click location
        const pointer = this.input.activePointer;
        const checkmark = this.add.graphics();
        checkmark.setDepth(250); // Above everything
        
        // Draw checkmark
        const checkSize = 60;
        checkmark.lineStyle(8, 0x00ff00, 1);
        checkmark.beginPath();
        checkmark.moveTo(pointer.x - checkSize * 0.4, pointer.y);
        checkmark.lineTo(pointer.x - checkSize * 0.1, pointer.y + checkSize * 0.3);
        checkmark.lineTo(pointer.x + checkSize * 0.4, pointer.y - checkSize * 0.3);
        checkmark.strokePath();
        
        // Animate checkmark
        checkmark.setScale(0);
        this.tweens.add({
            targets: checkmark,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 800,
            ease: 'Back.easeOut',
            onComplete: () => checkmark.destroy()
        });
        
        // 2. Success particles explosion
        // Create particle texture if needed
        if (!this.textures.exists('success-particle')) {
            const particleGraphics = this.add.graphics();
            particleGraphics.fillStyle(0x00ff00);
            particleGraphics.fillCircle(0, 0, 4);
            particleGraphics.generateTexture('success-particle', 8, 8);
            particleGraphics.destroy();
        }
        
        const particles = this.add.particles(pointer.x, pointer.y, 'success-particle', {
            speed: { min: 100, max: 200 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            quantity: 25,
            tint: 0x00ff00
        });
        particles.setDepth(245);
        setTimeout(() => particles.destroy(), 600);
        
        // 3. Big "SUCCESS!" text
        const successText = this.add.text(pointer.x, pointer.y - 80, 'SUCCESS!', {
            fontSize: '48px',
            fontFamily: 'Courier New',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 4,
                stroke: true,
                fill: true
            }
        });
        successText.setOrigin(0.5);
        successText.setDepth(250);
        successText.setAlpha(0);
        successText.setScale(0);
        
        this.tweens.add({
            targets: successText,
            alpha: 1,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            ease: 'Back.easeOut',
            yoyo: true,
            hold: 500,
            onComplete: () => {
                this.tweens.add({
                    targets: successText,
                    alpha: 0,
                    scaleX: 0.8,
                    scaleY: 0.8,
                    duration: 400,
                    onComplete: () => successText.destroy()
                });
            }
        });
        
        // 4. Warm light bloom effect - create a bright warm glow around Toodles
        const warmLight = this.add.graphics();
        warmLight.fillStyle(0xffd700, 0.8); // Brighter golden warm light
        warmLight.fillCircle(this.toodles.x, this.toodles.y, 200);
        warmLight.setDepth(this.toodles.depth + 1);
        
        // Fade out warm light
        this.tweens.add({
            targets: warmLight,
            alpha: 0,
            scaleX: 2.5,
            scaleY: 2.5,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => warmLight.destroy()
        });
        
        // 5. Toodles brightens and looks relieved - bigger animation
        this.tweens.add({
            targets: this.toodles,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 1,
            duration: 500,
            ease: 'Elastic.easeOut',
            yoyo: true,
            hold: 300
        });
        
        // 6. Infection recedes slightly - reduce infection bar
        const currentPercent = parseFloat(currentWidth) || 0;
        const recededPercent = Math.max(0, currentPercent - 15); // Recede by 15%
        this.tweens.add({
            targets: { value: currentPercent },
            value: recededPercent,
            duration: 800,
            ease: 'Power2',
            onUpdate: (tween) => {
                infectionBar.style.width = tween.targets.value + '%';
            }
        });
        
        // 7. Play success sound (louder/more prominent)
        audioManager.playSuccess();
        
        // 8. Screen flash effect
        const flash = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x00ff00);
        flash.setAlpha(0.3);
        flash.setDepth(240);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 400,
            onComplete: () => flash.destroy()
        });
        
        // Show success screen with Toodles and speech bubble
        const isLastLevel = this.currentLevel + 1 >= levelConfigs.length;
        
        // Create a larger, happy version of Toodles for the success screen
        setTimeout(() => {
            this.showSuccessScreen();
        }, 1500); // After initial success effects
    }
    
    showSuccessScreen() {
        // Hide the game Toodles so we don't see two Toodles at once
        if (this.toodles) {
            this.toodles.setVisible(false); // Hide game Toodles
        }
        
        // Hide game overlays that might cover Toodles
        if (this.darkOverlay) {
            this.darkOverlay.setAlpha(0); // Hide dark overlay
        }
        if (this.flashlightSpot) {
            this.flashlightSpot.setAlpha(0); // Hide flashlight spot
        }
        
        // Show success screen overlay (now very transparent)
        const successScreen = document.getElementById('success-screen');
        successScreen.classList.remove('hidden');
        
        // Create Toodles sprite for success screen (in Phaser, above overlay)
        const { width, height } = this.scale;
        
        // Check if texture exists
        if (!this.textures.exists('toodles')) {
            console.error('Toodles texture not found for success screen!');
            return;
        }
        
        // Center Toodles in the middle of the screen
        const successToodles = this.add.sprite(width / 2, height / 2, 'toodles');
        successToodles.setOrigin(0.5, 0.5); // Center the sprite
        
        // Make Toodles bigger and happy for success screen - brighter and more visible
        const texture = this.textures.get('toodles');
        if (!texture || !texture.source || !texture.source[0]) {
            console.error('Toodles texture source not available for success screen!');
            return;
        }
        
        const originalWidth = texture.source[0].width;
        const originalHeight = texture.source[0].height;
        
        if (!originalWidth || !originalHeight) {
            console.error('Toodles image dimensions invalid for success screen:', originalWidth, originalHeight);
            return;
        }
        
        const baseScale = 250 / Math.max(originalWidth, originalHeight); // Bigger size
        successToodles.setScale(baseScale);
        successToodles.setAlpha(1);
        successToodles.clearTint(); // Full color, no tint
        
        // Make Toodles brighter with a bright white glow
        const toodlesGlow = this.add.graphics();
        toodlesGlow.fillStyle(0xffffff, 0.8); // Brighter glow
        toodlesGlow.fillCircle(width / 2, height / 2, 200); // Larger glow radius
        toodlesGlow.setDepth(348); // Below Toodles
        
        // Add an even brighter inner glow
        const innerGlow = this.add.graphics();
        innerGlow.fillStyle(0xffffff, 1.0); // Maximum brightness
        innerGlow.fillCircle(width / 2, height / 2, 120);
        innerGlow.setDepth(349); // Just below Toodles
        
        successToodles.setDepth(350); // Above all glows and overlay (z-index 300)
        this.successToodlesGlow = toodlesGlow;
        this.successToodlesInnerGlow = innerGlow;
        
        // Animate Toodles - happy bounce (centered)
        this.tweens.add({
            targets: successToodles,
            scaleX: baseScale * 1.2,
            scaleY: baseScale * 1.2,
            y: height / 2 - 30, // Slight upward movement but stays centered
            duration: 400,
            ease: 'Back.easeOut',
            yoyo: true,
            repeat: -1,
            repeatDelay: 2000
        });
        
        // Store reference for cleanup
        this.successToodles = successToodles;
        
        // Show speech bubble with delay
        setTimeout(() => {
            const speechBubble = document.querySelector('.speech-bubble');
            if (speechBubble) {
                speechBubble.style.animation = 'none';
                setTimeout(() => {
                    speechBubble.style.animation = 'bubblePop 0.5s ease-out';
                }, 10);
            }
        }, 800);
        
        // Transition to next level after showing success screen
        const isLastLevel = this.currentLevel + 1 >= levelConfigs.length;
        setTimeout(() => {
            if (isLastLevel) {
                // For last level, show win screen
                successScreen.classList.add('hidden');
                if (this.successToodles) {
                    this.successToodles.destroy();
                    this.successToodles = null;
                }
            if (this.successToodlesGlow) {
                this.successToodlesGlow.destroy();
                this.successToodlesGlow = null;
            }
            if (this.successToodlesInnerGlow) {
                this.successToodlesInnerGlow.destroy();
                this.successToodlesInnerGlow = null;
            }
            this.winGame();
            } else {
                // Fade out success screen
                this.cameras.main.fadeOut(800, 0, 0, 0);
                setTimeout(() => {
                    successScreen.classList.add('hidden');
            if (this.successToodles) {
                this.successToodles.destroy();
                this.successToodles = null;
            }
            if (this.successToodlesGlow) {
                this.successToodlesGlow.destroy();
                this.successToodlesGlow = null;
            }
            if (this.successToodlesInnerGlow) {
                this.successToodlesInnerGlow.destroy();
                this.successToodlesInnerGlow = null;
            }
            this.winLevel();
                }, 800);
            }
        }, 3000); // Show success screen for 3 seconds
    }

    winLevel() {
        audioManager.stopAll();
        document.getElementById('found-overlay').classList.add('hidden');
        document.getElementById('success-screen').classList.add('hidden');
        
        // Clean up success screen Toodles and glows if they exist
        if (this.successToodles) {
            this.successToodles.destroy();
            this.successToodles = null;
        }
        if (this.successToodlesGlow) {
            this.successToodlesGlow.destroy();
            this.successToodlesGlow = null;
        }
        if (this.successToodlesInnerGlow) {
            this.successToodlesInnerGlow.destroy();
            this.successToodlesInnerGlow = null;
        }
        
        // Restore game overlays for next level
        if (this.darkOverlay) {
            const levelConfig = levelConfigs[this.currentLevel];
            const dimness = 0.7 + (this.currentLevel * 0.1);
            this.darkOverlay.setAlpha(0.8 * dimness);
        }
        if (this.flashlightSpot) {
            this.flashlightSpot.setAlpha(1);
        }
        
        if (this.currentLevel + 1 >= levelConfigs.length) {
            this.winGame();
        } else {
            // Fade in for next level (dimmer, more challenging)
            this.cameras.main.fadeIn(800, 0, 0, 0);
            this.startLevel(this.currentLevel + 1);
        }
    }

    winGame() {
        audioManager.stopAll();
        audioManager.playSuccess();
        
        // Create confetti effect (both Phaser and HTML)
        this.createConfetti();
        this.createHTMLConfetti();
        
        // Show win overlay after a brief delay
        setTimeout(() => {
            document.getElementById('win-overlay').classList.remove('hidden');
        }, 500);
    }
    
    createHTMLConfetti() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff1493', '#00ff7f', '#ff69b4'];
        const container = document.getElementById('game-container');
        
        // Create confetti elements
        for (let i = 0; i < 200; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = (6 + Math.random() * 12) + 'px';
            confetti.style.height = confetti.style.width;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-50px';
            confetti.style.zIndex = '500'; // Above win overlay (z-index 200)
            confetti.style.pointerEvents = 'none';
            confetti.style.borderRadius = '50%';
            confetti.style.opacity = '0.9';
            
            container.appendChild(confetti);
            
            // Animate confetti falling
            const fallDuration = 2000 + Math.random() * 3000;
            const driftAmount = (Math.random() - 0.5) * 300;
            const rotation = Math.random() * 360;
            
            confetti.animate([
                { 
                    transform: `translateY(0) translateX(0) rotate(0deg)`,
                    opacity: 0.9
                },
                { 
                    transform: `translateY(${window.innerHeight + 100}px) translateX(${driftAmount}px) rotate(${rotation + 720}deg)`,
                    opacity: 0
                }
            ], {
                duration: fallDuration,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }).onfinish = () => {
                confetti.remove();
            };
        }
        
        // Second wave
        setTimeout(() => {
            for (let i = 0; i < 150; i++) {
                const confetti = document.createElement('div');
                confetti.style.position = 'fixed';
                confetti.style.width = (6 + Math.random() * 12) + 'px';
                confetti.style.height = confetti.style.width;
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '-50px';
                confetti.style.zIndex = '500';
                confetti.style.pointerEvents = 'none';
                confetti.style.borderRadius = '50%';
                confetti.style.opacity = '0.9';
                
                container.appendChild(confetti);
                
                const fallDuration = 2000 + Math.random() * 3000;
                const driftAmount = (Math.random() - 0.5) * 300;
                const rotation = Math.random() * 360;
                
                confetti.animate([
                    { 
                        transform: `translateY(0) translateX(0) rotate(0deg)`,
                        opacity: 0.9
                    },
                    { 
                        transform: `translateY(${window.innerHeight + 100}px) translateX(${driftAmount}px) rotate(${rotation + 720}deg)`,
                        opacity: 0
                    }
                ], {
                    duration: fallDuration,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }).onfinish = () => {
                    confetti.remove();
                };
            }
        }, 500);
    }
    
    createConfetti() {
        const { width, height } = this.scale;
        
        // Confetti colors - bright and festive
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffa500, 0xff1493, 0x00ff7f, 0xff69b4];
        
        // Create confetti pieces falling from the top
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * width;
            const y = -Math.random() * 300 - 50; // Start above screen
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 6 + Math.random() * 12;
            
            // Create confetti piece (rectangle)
            const confetti = this.add.rectangle(x, y, size, size, color);
            confetti.setDepth(1000); // Above everything - highest depth
            confetti.setAlpha(0.9);
            
            // Random rotation
            confetti.rotation = Math.random() * Math.PI * 2;
            
            // Animate confetti falling with rotation
            const fallDuration = 2000 + Math.random() * 3000;
            this.tweens.add({
                targets: confetti,
                y: height + 100,
                rotation: confetti.rotation + (Math.random() * 4 - 2) * Math.PI,
                duration: fallDuration,
                ease: 'Power2',
                onComplete: () => {
                    confetti.destroy();
                }
            });
            
            // Add horizontal drift/sway
            const driftAmount = (Math.random() - 0.5) * 300;
            this.tweens.add({
                targets: confetti,
                x: x + driftAmount,
                duration: fallDuration * 0.8,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: 1
            });
        }
        
        // Create a second wave of confetti after a delay
        this.time.delayedCall(500, () => {
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * width;
                const y = -Math.random() * 200 - 50;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = 6 + Math.random() * 12;
                
                const confetti = this.add.rectangle(x, y, size, size, color);
                confetti.setDepth(1000); // Above everything - highest depth
                confetti.setAlpha(0.9);
                confetti.rotation = Math.random() * Math.PI * 2;
                
                const fallDuration = 2000 + Math.random() * 3000;
                this.tweens.add({
                    targets: confetti,
                    y: height + 100,
                    rotation: confetti.rotation + (Math.random() * 4 - 2) * Math.PI,
                    duration: fallDuration,
                    ease: 'Power2',
                    onComplete: () => {
                        confetti.destroy();
                    }
                });
                
                const driftAmount = (Math.random() - 0.5) * 300;
                this.tweens.add({
                    targets: confetti,
                    x: x + driftAmount,
                    duration: fallDuration * 0.8,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: 1
                });
            }
        });
    }

    loseGame() {
        // Stop timer and prevent further updates
        this.timeRemaining = 0;
        
        // Stop visibility updates so infection form stays visible
        // (updateToodlesVisibility will be called but we'll handle it in the transformation)
        
        // Audio: Drop to silence, then distorted surge
        audioManager.stopAll();
        
        setTimeout(() => {
            // Distorted surge sound
            audioManager.playFail();
            
            // Create distorted audio effect (using multiple oscillators for distortion effect)
            if (!audioManager.isMuted) {
                const distortedOsc1 = new Tone.Oscillator(80, 'sawtooth').toDestination();
                distortedOsc1.volume.value = -12;
                distortedOsc1.start();
                distortedOsc1.stop('+0.6');
                
                const distortedOsc2 = new Tone.Oscillator(60, 'square').toDestination();
                distortedOsc2.volume.value = -15;
                distortedOsc2.start('+0.1');
                distortedOsc2.stop('+0.8');
            }
        }, 500);
        
        // Transform Toodles into infection form using infected image
        // Step 1: Make toodles-standing.png grow large
        if (this.toodles) {
            // Make sure Toodles is visible (in case she was hidden)
            this.toodles.setVisible(true);
            
            // Get current position and scale
            const currentX = this.toodles.x;
            const currentY = this.toodles.y;
            const currentScale = this.toodles.scaleX;
            const centerX = this.scale.width / 2;
            const centerY = this.scale.height / 2;
            
            // Calculate large size for standing Toodles
            const largeSize = 400; // Large size for the standing form
            const standingTexture = this.textures.get('toodles');
            if (standingTexture && standingTexture.source && standingTexture.source[0]) {
                const standingOriginalWidth = standingTexture.source[0].width;
                const standingOriginalHeight = standingTexture.source[0].height;
                const largeScale = largeSize / Math.max(standingOriginalWidth, standingOriginalHeight);
                
                // Animate Toodles standing form to grow large and move to center
                this.tweens.add({
                    targets: this.toodles,
                    scaleX: largeScale,
                    scaleY: largeScale,
                    x: centerX,
                    y: centerY,
                    duration: 800,
                    ease: 'Power2',
                    onComplete: () => {
                        // Step 2: Wait 1 second, then transform to infected
                        setTimeout(() => {
                            // Calculate infection form size - bigger
                            if (!this.textures.exists('toodles-infected')) {
                                console.error('Toodles-infected texture not found!');
                                return;
                            }
                            
                            const texture = this.textures.get('toodles-infected');
                            if (!texture || !texture.source || !texture.source[0]) {
                                console.error('Toodles-infected texture source not available!');
                                return;
                            }
                            
                            const originalWidth = texture.source[0].width;
                            const originalHeight = texture.source[0].height;
                            
                            if (!originalWidth || !originalHeight) {
                                console.error('Toodles-infected image dimensions invalid:', originalWidth, originalHeight);
                                return;
                            }
                            
                            const infectionSize = 300; // Target size for infected form
                            const infectionScale = infectionSize / Math.max(originalWidth, originalHeight);
                            
                            // Create infected Toodles sprite at same position, initially invisible
                            const infectedToodles = this.add.sprite(centerX, centerY, 'toodles-infected');
                            infectedToodles.setOrigin(0.5, 0.5); // Center the sprite
                            infectedToodles.setScale(largeScale); // Start at large scale
                            infectedToodles.setAlpha(0); // Start invisible
                            infectedToodles.setDepth(this.toodles.depth);
                            
                            // Transform animation: fade from normal to infected over 1 second
                            this.tweens.add({
                                targets: this.toodles,
                                alpha: 0,
                                duration: 1000,
                                ease: 'Power2'
                            });
                            
                            this.tweens.add({
                                targets: infectedToodles,
                                alpha: 1,
                                scaleX: infectionScale,
                                scaleY: infectionScale,
                                rotation: 0.15, // Wrong posture
                                duration: 1000,
                                ease: 'Power2',
                                onComplete: () => {
                                    // Remove normal Toodles after transformation
                                    if (this.toodles) {
                                        this.toodles.destroy();
                                    }
                                    this.toodles = infectedToodles; // Replace with infected form
                                    
                                    // Add infection glow effect
                                    const infectionGlow = this.add.graphics();
                                    infectionGlow.fillStyle(0x4a0000, 0.6); // Dark red glow
                                    infectionGlow.fillCircle(centerX, centerY, 200);
                                    infectionGlow.setDepth(infectedToodles.depth - 1);
                                    this.tweens.add({
                                        targets: infectionGlow,
                                        alpha: { from: 0.6, to: 0.8 },
                                        scaleX: { from: 1, to: 1.3 },
                                        scaleY: { from: 1, to: 1.3 },
                                        duration: 1500,
                                        ease: 'Sine.easeInOut',
                                        yoyo: true,
                                        repeat: -1
                                    });
                                    this.infectionGlow = infectionGlow;
                                    
                                    // Step 3: Wait 2 seconds after transformation, then show lose screen
                                    setTimeout(() => {
                                        // Show lose message
                                        document.getElementById('toodles-question').textContent = "toodles?";
                                        document.getElementById('lose-text').textContent = "its too late";
                                        document.getElementById('lose-overlay').classList.remove('hidden');
                                    }, 2000); // 2 second delay after transformation
                                }
                            });
                        }, 1000); // 1 second delay before transforming to infected
                    }
                });
            }
        } else {
            // If Toodles doesn't exist, wait 2 seconds then show lose screen
            setTimeout(() => {
                document.getElementById('toodles-question').textContent = "toodles?";
                document.getElementById('lose-text').textContent = "its too late";
                document.getElementById('lose-overlay').classList.remove('hidden');
            }, 2000);
        }
        
        // Make attic feel "alive" - subtle movement/animation
        this.clutterObjects.forEach((obj, index) => {
            this.time.delayedCall(index * 50, () => {
                this.tweens.add({
                    targets: obj,
                    x: obj.x + (Math.random() - 0.5) * 3,
                    y: obj.y + (Math.random() - 0.5) * 3,
                    rotation: obj.rotation + (Math.random() - 0.5) * 0.05,
                    duration: 2000,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
            });
        });
    }

    showHorrorText() {
        const text = horrorTexts[Math.floor(Math.random() * horrorTexts.length)];
        const element = document.getElementById('horror-text');
        element.textContent = text;
        element.classList.remove('hidden');
        
        setTimeout(() => {
            element.classList.add('hidden');
        }, 3000);
    }

    toggleHighContrast() {
        this.highContrastMode = !this.highContrastMode;
        
        // Update Toodles outline if it exists
        if (this.toodles) {
            if (this.highContrastMode && !this.toodles.outline) {
                // Add outline
                const spriteWidth = this.toodles.spriteWidth || (this.toodles.width * this.toodles.scaleX);
                const spriteHeight = this.toodles.spriteHeight || (this.toodles.height * this.toodles.scaleY);
                const outline = this.add.graphics();
                outline.lineStyle(3, 0xffff00, 1);
                outline.strokeRect(
                    this.toodles.x - spriteWidth / 2 - 3,
                    this.toodles.y - spriteHeight / 2 - 3,
                    spriteWidth + 6,
                    spriteHeight + 6
                );
                outline.setDepth(this.toodles.depth - 1);
                this.toodles.outline = outline;
            } else if (!this.highContrastMode && this.toodles.outline) {
                // Remove outline
                this.toodles.outline.destroy();
                this.toodles.outline = null;
            }
        }
        
        // Update flashlight brightness
        const pointer = this.input.activePointer;
        if (pointer) {
            this.updateFlashlightMask(pointer.x, pointer.y);
            this.updateFlashlightSpot(pointer.x, pointer.y);
        }
        return this.highContrastMode;
    }
}

// ============================================
// GAME CONFIGURATION
// ============================================

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-game',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a0f1a',
    scene: [MenuScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        antialias: true,
        pixelArt: false
    }
};

// ============================================
// GAME INITIALIZATION
// ============================================

let game;

// DOM Elements
const elements = {
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
    playAgainBtn: document.getElementById('play-again-btn'),
    muteBtn: document.getElementById('mute-btn'),
    gotItBtn: document.getElementById('got-it-btn')
};

// Initialize game
function initGame() {
    game = new Phaser.Game(config);
    
    // Start in menu scene
    game.scene.start('MenuScene');
}

// Event Listeners
// Handle "Got it" button on explainer modal
elements.gotItBtn.addEventListener('click', () => {
    document.getElementById('explainer-modal').classList.add('hidden');
    document.getElementById('menu-overlay').classList.remove('hidden');
});

elements.startBtn.addEventListener('click', () => {
    document.getElementById('menu-overlay').classList.add('hidden');
    game.scene.start('GameScene');
});

elements.restartBtn.addEventListener('click', () => {
    document.getElementById('lose-overlay').classList.add('hidden');
    document.getElementById('win-overlay').classList.add('hidden');
    document.getElementById('menu-overlay').classList.remove('hidden');
    game.scene.stop('GameScene');
    game.scene.start('MenuScene');
});

elements.playAgainBtn.addEventListener('click', () => {
    document.getElementById('win-overlay').classList.add('hidden');
    document.getElementById('menu-overlay').classList.remove('hidden');
    game.scene.stop('GameScene');
    game.scene.start('MenuScene');
});

elements.muteBtn.addEventListener('click', () => {
    const isMuted = audioManager.toggleMute();
    elements.muteBtn.textContent = isMuted ? '🔇 Sound Off' : '🔊 Sound On';
});

// Handle window resize
window.addEventListener('resize', () => {
    if (game) {
        game.scale.resize(window.innerWidth, window.innerHeight);
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene) {
            // Update background and overlay sizes
            if (gameScene.background) {
                gameScene.background.setSize(window.innerWidth, window.innerHeight);
                gameScene.background.setPosition(window.innerWidth / 2, window.innerHeight / 2);
            }
            if (gameScene.darkOverlay) {
                // Resize dark overlay
                gameScene.darkOverlay.setSize(window.innerWidth, window.innerHeight);
                gameScene.darkOverlay.setPosition(window.innerWidth / 2, window.innerHeight / 2);
                
                // Update flashlight position
                const pointer = gameScene.input.activePointer;
                if (pointer) {
                    gameScene.updateFlashlightMask(pointer.x, pointer.y);
                    gameScene.updateFlashlightSpot(pointer.x, pointer.y);
                }
            }
        }
    }
});

// Start game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

console.log('Where is Toodles? - Phaser 3 + Tone.js Initialized');
console.log('TODO: Add more levels, lore system, real art assets, particle effects');
