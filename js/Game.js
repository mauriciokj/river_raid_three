import * as THREE from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js';
import Player from './Player.js';
import Enemy from './Enemy.js';
import SceneryObject from './SceneryObject.js';
import Projectile from './Projectile.js';
import Environment from './Environment.js';

export default class Game {
    constructor(autoStart = true) {
        // Initialize high score system
        this.highScore = this.loadHighScore();
        this.createHighScoreElements();
        
        // Initialize lives system
        this.maxLives = 3;
        this.lives = this.maxLives;
        this.createLivesDisplay();
        
        // Create game over screen (hidden initially)
        this.createGameOverScreen();
        
        this.setupScene();
        this.setupCameras();
        this.setupRenderer();
        
        this.environment = new Environment(this.scene);
        this.riverWidth = this.environment.getRiverWidth();
        this.riverLength = this.environment.getRiverLength();
        
        this.player = new Player(this.riverWidth);
        this.scene.add(this.player.object);
        
        this.enemies = [];
        this.createEnemies(5);
        
        this.sceneryObjects = [];
        this.createSceneryObjects(15);
        
        this.projectiles = [];
        this.explosions = [];
        
        this.score = 0;
        this.scoreDisplay = document.getElementById('scoreDisplay');
        
        this.setupControls();
        
        // Movement speed
        this.baseSpeed = 0.1;
        this.accelerationSpeed = 0.2;
        this.scenerySpeed = 0.2;
        
        // Game state
        this.isRunning = false;
        
        // Render the initial scene without animation
        this.renderer.render(this.scene, this.camera);
        
        // Start the game loop if autoStart is true
        if (autoStart) {
            this.start();
        }
        
        // Adicionar carregamento de sons
        this.loadSounds();
        
    }
    
    // Method to start the game
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    }

    setupCameras() {
        // Set up camera for top-down view like the original River Raid
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 0); // Position above the scene
        this.camera.lookAt(0, 0, 0); // Look down at the scene
        
        // Create a first-person camera
        this.fpCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Track which camera is active
        this.isFirstPerson = false;
        this.activeCamera = this.camera;
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.fpCamera.aspect = window.innerWidth / window.innerHeight;
            this.fpCamera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    createEnemies(count) {
        for (let i = 0; i < count; i++) {
            const enemy = new Enemy(this.riverWidth, this.riverLength);
            this.scene.add(enemy.object);
            this.enemies.push(enemy);
        }
    }

    createSceneryObjects(count) {
        for (let i = 0; i < count; i++) {
            const isLeft = i % 2 === 0; // Alternate left and right
            const sceneryObject = new SceneryObject(isLeft, this.riverWidth, this.riverLength);
            this.scene.add(sceneryObject.object);
            this.sceneryObjects.push(sceneryObject);
        }
    }

    createProjectile() {
        const projectile = new Projectile(this.player.object.position.clone(), this.riverLength);
        this.scene.add(projectile.mesh);
        this.projectiles.push(projectile);
    }
    
    // Create explosion effect
    createExplosion(position) {
        // Create a larger, more visible explosion
        const particleCount = 50;
        const particles = new THREE.Group();
        
        // Create explosion particles with larger size and brighter colors
        for (let i = 0; i < particleCount; i++) {
            const size = 0.2 + Math.random() * 0.3; // Larger particles
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(size, 8, 8),
                new THREE.MeshBasicMaterial({ 
                    color: Math.random() > 0.5 ? 0xff4500 : 0xffcc00,
                    transparent: true,
                    opacity: 1
                })
            );
            
            // Set initial position at the explosion center
            particle.position.copy(position);
            
            // Random velocity in all directions with higher speed
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            
            // Add to group
            particles.add(particle);
        }
        
        // Add particles to scene
        this.scene.add(particles);
        
        // Store the creation time
        particles.userData.creationTime = Date.now();
        
        // Add to explosions array
        this.explosions.push(particles);
        
        // Debug log
        console.log("Explosion created at", position.x, position.y, position.z);
        console.log("Number of explosions:", this.explosions.length);
    }

    // Update explosion particles
    updateExplosions() {
        if (!this.explosions || this.explosions.length === 0) return;
        
        const currentTime = Date.now();
        
        // Debug log
        if (this.explosions.length > 0) {
            console.log("Updating", this.explosions.length, "explosions");
        }
        
        // Update each explosion
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            const age = currentTime - explosion.userData.creationTime;
            
            // Remove explosion after 1.5 seconds
            if (age > 1500) {
                this.scene.remove(explosion);
                this.explosions.splice(i, 1);
                console.log("Removed explosion, remaining:", this.explosions.length);
                continue;
            }
            
            // Update each particle
            explosion.children.forEach(particle => {
                // Move particle according to its velocity
                particle.position.add(particle.userData.velocity);
                
                // Fade out particle (reduce opacity)
                const material = particle.material;
                material.opacity = 1 - (age / 1500);
                
                // Reduce size over time
                const scale = 1 - (age / 1500) * 0.5;
                particle.scale.set(scale, scale, scale);
            });
        }
    }

    setupControls() {
        // Movement controls
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            ' ': false, // Space key for firing
            'c': false  // C key for camera toggle
        };
        
        // Handle keyboard input
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
        });
    }

    updateFPCamera() {
        // Position the camera at the airplane's position
        this.fpCamera.position.copy(this.player.object.position);
        // Raise it slightly above the airplane
        this.fpCamera.position.y += 0.3;
        // Move it forward a bit to see ahead
        this.fpCamera.position.z -= 0.5;
        // Look forward down the river
        this.fpCamera.lookAt(
            this.player.object.position.x, 
            this.player.object.position.y, 
            this.player.object.position.z - 10
        );
    }

    toggleCamera() {
        this.isFirstPerson = !this.isFirstPerson;
        this.activeCamera = this.isFirstPerson ? this.fpCamera : this.camera;
    }

    checkCollisions() {
        // Get player collision box
        const playerBox = this.player.getCollisionBox();
        
        // Check collisions with enemies
        for (const enemy of this.enemies) {
            const enemyBox = enemy.getCollisionBox();
            
            if (playerBox.intersectsBox(enemyBox)) {
                this.handleCollision("enemy");
                break;
            }
        }
        
        // Check collisions with river banks - improved detection
        const playerX = this.player.object.position.x;
        const riverBoundary = this.riverWidth / 2;
        
        // If player crosses river boundary, trigger collision
        // Using a tighter boundary check to ensure detection works
        if (Math.abs(playerX) > riverBoundary - 0.8) {
            console.log("River bank collision detected!");
            this.handleCollision("bank");
        }
    }
    
    handleCollision(type = "enemy") {
        // Prevent multiple collisions in quick succession
        if (this.isColliding) return;
        this.isColliding = true;
        
        console.log("Collision detected with:", type);
        
        // Simple collision response - flash the background red
        this.scene.background = new THREE.Color(0xff0000);
        
        // Store player position before hiding
        const playerPosition = this.player.object.position.clone();
        
        // Create explosion effect at player position
        this.createExplosion(playerPosition);
        
        // Play explosion sound - melhorado com fallback
        this.playExplosionSound();
        
        // Make player temporarily invisible
        this.player.object.visible = false;
        
        // Reset after a short delay
        setTimeout(() => {
            this.scene.background = new THREE.Color(0x87CEEB);
            
            // Decrease lives
            this.lives--;
            this.updateLivesDisplay();
            
            // Check if game over
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                // Reset player position but keep score
                this.player.object.position.set(0, 0.2, 5);
                this.player.object.visible = true;
            }
            
            // Allow new collisions
            setTimeout(() => {
                this.isColliding = false;
            }, 1000);
        }, 500);
    }
    
    // Create lives display
    createLivesDisplay() {
        this.livesDisplay = document.createElement('div');
        this.livesDisplay.id = 'livesDisplay';
        this.livesDisplay.style.position = 'absolute';
        this.livesDisplay.style.top = '10px';
        this.livesDisplay.style.left = '50%';
        this.livesDisplay.style.transform = 'translateX(-50%)';
        this.livesDisplay.style.color = 'white';
        this.livesDisplay.style.fontFamily = 'Arial, sans-serif';
        this.livesDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.livesDisplay.style.padding = '10px';
        this.livesDisplay.style.borderRadius = '5px';
        this.livesDisplay.style.zIndex = '100';
        this.updateLivesDisplay();
        document.body.appendChild(this.livesDisplay);
    }
    
    // Update lives display
    updateLivesDisplay() {
        let livesHTML = 'Lives: ';
        for (let i = 0; i < this.lives; i++) {
            livesHTML += '❤️ ';
        }
        this.livesDisplay.innerHTML = livesHTML;
    }
    
    // Create game over screen
    createGameOverScreen() {
        this.gameOverScreen = document.createElement('div');
        this.gameOverScreen.id = 'gameOverScreen';
        this.gameOverScreen.style.position = 'absolute';
        this.gameOverScreen.style.top = '0';
        this.gameOverScreen.style.left = '0';
        this.gameOverScreen.style.width = '100%';
        this.gameOverScreen.style.height = '100%';
        this.gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.gameOverScreen.style.color = 'white';
        this.gameOverScreen.style.fontFamily = 'Arial, sans-serif';
        this.gameOverScreen.style.display = 'flex';
        this.gameOverScreen.style.flexDirection = 'column';
        this.gameOverScreen.style.justifyContent = 'center';
        this.gameOverScreen.style.alignItems = 'center';
        this.gameOverScreen.style.zIndex = '300';
        this.gameOverScreen.style.display = 'none';
        
        // Game over title
        const gameOverTitle = document.createElement('h1');
        gameOverTitle.textContent = 'GAME OVER';
        gameOverTitle.style.color = '#ff0000';
        gameOverTitle.style.fontSize = '48px';
        gameOverTitle.style.marginBottom = '20px';
        this.gameOverScreen.appendChild(gameOverTitle);
        
        // Score display
        this.finalScoreDisplay = document.createElement('p');
        this.finalScoreDisplay.style.fontSize = '24px';
        this.finalScoreDisplay.style.marginBottom = '10px';
        this.gameOverScreen.appendChild(this.finalScoreDisplay);
        
        // High score display
        this.finalHighScoreDisplay = document.createElement('p');
        this.finalHighScoreDisplay.style.fontSize = '24px';
        this.finalHighScoreDisplay.style.marginBottom = '30px';
        this.gameOverScreen.appendChild(this.finalHighScoreDisplay);
        
        // Restart button
        const restartButton = document.createElement('button');
        restartButton.textContent = 'PLAY AGAIN';
        restartButton.style.padding = '15px 30px';
        restartButton.style.fontSize = '20px';
        restartButton.style.backgroundColor = '#4CAF50';
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '5px';
        restartButton.style.cursor = 'pointer';
        restartButton.addEventListener('click', () => this.restartGame());
        this.gameOverScreen.appendChild(restartButton);
        
        document.body.appendChild(this.gameOverScreen);
    }
    
    // Show game over screen
    showGameOverScreen() {
        // Update final score displays
        this.finalScoreDisplay.textContent = `Your Score: ${this.score}`;
        this.finalHighScoreDisplay.textContent = `High Score: ${this.highScore}`;
        
        // Show the game over screen
        this.gameOverScreen.style.display = 'flex';
    }
    
    // Restart the game
    restartGame() {
        // Hide game over screen
        this.gameOverScreen.style.display = 'none';
        
        // Reset lives
        this.lives = this.maxLives;
        this.updateLivesDisplay();
        
        // Reset score
        this.score = 0;
        this.scoreDisplay.textContent = this.score;
        
        // Reset player position
        this.player.object.position.set(0, 0.2, 5);
        
        // Reset enemies
        for (const enemy of this.enemies) {
            enemy.resetPosition();
        }
        
        // Start the game again
        this.isRunning = true;
        this.animate();
    }
    
    // Carregar sons do jogo
    loadSounds() {
        // Criar um listener de áudio
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);
        
        // Criar um som para a explosão
        this.explosionSound = new THREE.Audio(this.listener);
        
        // Carregar o arquivo de som
        const audioLoader = new THREE.AudioLoader();
        
        // Usar caminho relativo e adicionar fallback para HTML5 Audio
        audioLoader.load('./sounds/explosion.mp3', 
            // onLoad callback
            (buffer) => {
                this.explosionSound.setBuffer(buffer);
                this.explosionSound.setVolume(0.7); // Aumentar volume
                console.log('Som de explosão carregado com sucesso');
            },
            // onProgress callback
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% carregado');
            },
            // onError callback
            (err) => {
                console.error('Erro ao carregar som:', err);
                // Criar um elemento de áudio HTML como fallback
                this.createFallbackAudio();
            }
        );
        
        // Criar um elemento de áudio HTML como fallback
        this.createFallbackAudio();
    }
    
    // Criar um elemento de áudio HTML como fallback
    createFallbackAudio() {
        this.fallbackExplosion = document.createElement('audio');
        this.fallbackExplosion.src = './sounds/explosion.mp3';
        this.fallbackExplosion.preload = 'auto';
        document.body.appendChild(this.fallbackExplosion);
    }
    
    // Método para reproduzir o som de explosão com fallback
    playExplosionSound() {
        // Tentar reproduzir com Three.js Audio
        if (this.explosionSound && this.explosionSound.buffer) {
            if (this.explosionSound.isPlaying) {
                this.explosionSound.stop();
            }
            this.explosionSound.play();
            console.log('Reproduzindo som de explosão com Three.js');
        } 
        // Fallback para HTML5 Audio
        else if (this.fallbackExplosion) {
            this.fallbackExplosion.currentTime = 0;
            this.fallbackExplosion.play()
                .then(() => console.log('Reproduzindo som de explosão com fallback'))
                .catch(err => console.error('Erro ao reproduzir som de fallback:', err));
        }
        else {
            console.warn('Nenhum som de explosão disponível');
        }
    }
    
    // Game over function
    gameOver() {
        // Stop the game
        this.isRunning = false;
        
        // Update high score if needed
        this.updateHighScore();
        
        // Show game over screen
        this.showGameOverScreen();
    }
    
    // Load high score from localStorage
    loadHighScore() {
        const savedHighScore = localStorage.getItem('riverRaidHighScore');
        return savedHighScore ? parseInt(savedHighScore) : 0;
    }
    
    // Save high score to localStorage
    saveHighScore(score) {
        localStorage.setItem('riverRaidHighScore', score.toString());
        this.highScore = score;
    }
    
    // Create high score display elements
    createHighScoreElements() {
        // Create high score display
        this.highScoreDisplay = document.createElement('div');
        this.highScoreDisplay.id = 'highScoreDisplay';
        this.highScoreDisplay.style.position = 'absolute';
        this.highScoreDisplay.style.top = '10px';
        this.highScoreDisplay.style.right = '10px';
        this.highScoreDisplay.style.color = 'white';
        this.highScoreDisplay.style.fontFamily = 'Arial, sans-serif';
        this.highScoreDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.highScoreDisplay.style.padding = '10px';
        this.highScoreDisplay.style.borderRadius = '5px';
        this.highScoreDisplay.style.zIndex = '100';
        this.highScoreDisplay.innerHTML = `High Score: ${this.highScore}`;
        document.body.appendChild(this.highScoreDisplay);
        
        // Create new record notification
        this.newRecordNotification = document.createElement('div');
        this.newRecordNotification.id = 'newRecordNotification';
        this.newRecordNotification.style.position = 'absolute';
        this.newRecordNotification.style.top = '50px';
        this.newRecordNotification.style.left = '50%';
        this.newRecordNotification.style.transform = 'translateX(-50%)';
        this.newRecordNotification.style.color = '#ffcc00';
        this.newRecordNotification.style.fontFamily = 'Arial, sans-serif';
        this.newRecordNotification.style.fontSize = '24px';
        this.newRecordNotification.style.fontWeight = 'bold';
        this.newRecordNotification.style.textShadow = '2px 2px 4px #000000';
        this.newRecordNotification.style.padding = '10px';
        this.newRecordNotification.style.zIndex = '200';
        this.newRecordNotification.style.display = 'none';
        this.newRecordNotification.innerHTML = 'NEW HIGH SCORE!';
        document.body.appendChild(this.newRecordNotification);
    }
    
    // Show new record notification
    showNewRecordNotification() {
        this.newRecordNotification.style.display = 'block';
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            this.newRecordNotification.style.display = 'none';
        }, 3000);
    }
    
    // Update high score if current score is higher
    updateHighScore() {
        if (this.score > this.highScore) {
            // First time beating the high score in this session
            if (this.score > this.highScore && this.highScore !== 0) {
                this.showNewRecordNotification();
            }
            this.saveHighScore(this.score);
            this.highScoreDisplay.innerHTML = `High Score: ${this.highScore}`;
        }
    }

    checkProjectileCollisions() {
        for (let i = 0; i < this.projectiles.length; i++) {
            const projectile = this.projectiles[i];
            
            if (!projectile.active) continue;
            
            const projectileBox = projectile.getCollisionBox();
            
            for (let j = 0; j < this.enemies.length; j++) {
                const enemy = this.enemies[j];
                const enemyBox = enemy.getCollisionBox();
                
                if (projectileBox.intersectsBox(enemyBox)) {
                    // Hit! Remove projectile and reset enemy
                    projectile.active = false;
                    this.scene.remove(projectile.mesh);
                    
                    // Reset enemy position
                    enemy.resetPosition();
                    
                    // Increase score
                    this.score += 10;
                    this.scoreDisplay.textContent = this.score;
                    
                    // Check if we have a new high score
                    this.updateHighScore();
                    
                    break;
                }
            }
        }
    }

    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(this.animate.bind(this));
        
        // Always move scenery objects to create constant forward movement
        const currentSpeed = this.keys.ArrowUp ? 
            this.scenerySpeed + this.accelerationSpeed : this.scenerySpeed;
        
        // Move all scenery objects
        for (const sceneryObject of this.sceneryObjects) {
            sceneryObject.move(currentSpeed);
        }
        
        // Move all enemies
        for (const enemy of this.enemies) {
            enemy.move(currentSpeed);
        }
        
        // Handle firing
        if (this.keys[' ']) {
            // Only fire when space is first pressed (not held)
            if (!this.keys.spaceWasPressed) {
                this.createProjectile();
                this.keys.spaceWasPressed = true;
            }
        } else {
            this.keys.spaceWasPressed = false;
        }
        
        // Move projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.move();
            
            // Remove inactive projectiles
            if (!projectile.active) {
                this.scene.remove(projectile.mesh);
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update explosions - ensure this is called every frame
        this.updateExplosions();
        
        // Check for collisions
        this.checkCollisions();
        this.checkProjectileCollisions();
        
        // Handle airplane movements
        if (this.keys.ArrowLeft) {
            this.player.moveLeft();
        }
        if (this.keys.ArrowRight) {
            this.player.moveRight();
        }
        
        // Handle camera toggle
        if (this.keys['c']) {
            // Only toggle when C is first pressed (not held)
            if (!this.keys.cWasPressed) {
                this.toggleCamera();
                this.keys.cWasPressed = true;
            }
        } else {
            this.keys.cWasPressed = false;
        }
        
        // Update first-person camera position
        this.updateFPCamera();
        
        // Render the scene
        this.renderer.render(this.scene, this.activeCamera);
    }
}