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
                this.handleCollision();
                break;
            }
        }
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
    
    handleCollision() {
        // Simple collision response - flash the background red
        this.scene.background = new THREE.Color(0xff0000);
        
        // Reset after a short delay
        setTimeout(() => {
            this.scene.background = new THREE.Color(0x87CEEB);
        }, 200);
        
        // Decrease lives instead of resetting score
        this.lives--;
        this.updateLivesDisplay();
        
        // Check if game over
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset player position but keep score
            this.player.object.position.set(0, 0.2, 5);
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