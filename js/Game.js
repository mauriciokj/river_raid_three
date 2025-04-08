// Usamos o THREE global carregado pelo script no HTML
import Player from './Player.js';
import Enemy from './Enemy.js';
import SceneryObject from './SceneryObject.js';
import Projectile from './Projectile.js';
import Environment from './Environment.js';
import UIManager from './UIManager.js';
import CameraManager from './CameraManager.js';
import InputManager from './InputManager.js';
import CollisionManager from './CollisionManager.js';
import AudioManager from './AudioManager.js';

export default class Game {
    constructor(autoStart = true) {
        // Initialize high score system
        this.highScore = this.loadHighScore();
        
        // Initialize lives system
        this.maxLives = 3;
        this.lives = this.maxLives;
        
        // Setup base scene components
        this.setupScene();
        this.setupRenderer();
        
        // Initialize managers
        this.cameras = new CameraManager(this);
        this.ui = new UIManager(this);
        this.input = new InputManager(this);
        this.collisions = new CollisionManager(this);
        this.audio = new AudioManager(this);
        
        // Initialize game environment
        this.environment = new Environment(this.scene);
        this.riverWidth = this.environment.getRiverWidth();
        this.riverLength = this.environment.getRiverLength();
        
        // Initialize player
        this.player = new Player(this.riverWidth, () => {
            console.log("Player model loaded successfully");
            this.createCockpitDashboard();
        });
        this.scene.add(this.player.object);
        
        // Initialize entities
        this.enemies = [];
        this.createEnemies(5);
        
        this.sceneryObjects = [];
        this.createSceneryObjects(15);
        
        this.projectiles = [];
        this.explosions = [];
        
        // Initialize score
        this.score = 0;
        
        // Movement speed
        this.baseSpeed = 0.1;
        this.accelerationSpeed = 0.2;
        this.scenerySpeed = 0.2;
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        
        // Render the initial scene without animation
        this.renderer.render(this.scene, this.cameras.getCurrentCamera());
        
        // Start the game loop if autoStart is true
        if (autoStart) {
            this.start();
        }
    }
    
    // Method to start the game
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            
            // Mostrar a escala inicial do modelo
            this.ui.showScaleInfo(this.player.currentScale);
            
            this.animate();
        }
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
        
        // Adicionar iluminação à cena
        this.setupLights();
    }

    setupLights() {
        // Luz ambiente para iluminação básica geral
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Luz direcional principal (como o sol)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Luz direcional secundária para iluminar as sombras
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-10, 5, -5);
        this.scene.add(fillLight);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,  // Ativa anti-aliasing para linhas mais suaves
            alpha: true       // Permite transparência se necessário
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true; // Ativa renderização de sombras
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Tipo de sombra mais suave
        this.renderer.setPixelRatio(window.devicePixelRatio); // Melhor qualidade em telas de alta resolução
        document.body.appendChild(this.renderer.domElement);
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
        // Obter posição atual do jogador
        const playerPos = this.player.object.position.clone();
        
        // Criar e configurar o novo projétil
        const projectile = new Projectile(playerPos, this.riverLength);
        
        // Garantir que o projétil está ativo
        projectile.active = true;
        
        // Adicionar à cena
        this.scene.add(projectile.mesh);
        
        // Adicionar à lista de projéteis
        this.projectiles.push(projectile);
        
        // Log para debug
        console.log("Projétil criado na posição:", projectile.mesh.position);
        console.log("Total de projéteis ativos:", this.projectiles.length);
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
            
            // Random lifetime between 60 and 120 frames (~1-2 seconds)
            particle.userData.lifetime = 60 + Math.random() * 60;
            particle.userData.age = 0;
            
            particles.add(particle);
        }
        
        this.explosions.push(particles);
        this.scene.add(particles);
    }
    
    // Update and animate explosion particles
    updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            let allParticlesExpired = true;
            
            explosion.children.forEach(particle => {
                // Update age
                particle.userData.age++;
                
                // Move particle based on velocity
                particle.position.add(particle.userData.velocity);
                
                // Apply "gravity" effect - makes particles fall down over time
                particle.userData.velocity.y -= 0.005;
                
                // Fade out based on age
                if (particle.material) {
                    const lifeRatio = particle.userData.age / particle.userData.lifetime;
                    particle.material.opacity = 1 - lifeRatio;
                    
                    // Apply a size reduction
                    const scale = 1 - lifeRatio * 0.5;
                    particle.scale.set(scale, scale, scale);
                    
                    // Check if this particle is still alive
                    if (particle.userData.age < particle.userData.lifetime) {
                        allParticlesExpired = false;
                    }
                }
            });
            
            // Remove explosion if all particles have expired
            if (allParticlesExpired) {
                this.scene.remove(explosion);
                this.explosions.splice(i, 1);
            }
        }
    }
    
    // Restart the game
    restartGame() {
        console.log("Reiniciando o jogo...");
        
        // Reset game state
        this.isRunning = false;
        this.isPaused = false;
        this.ui.hideGameOverScreen();
        
        // Reset score
        this.score = 0;
        this.ui.updateScore(this.score);
        
        // Reset lives
        this.lives = this.maxLives;
        this.ui.updateLivesDisplay();
        
        // Remove all projectiles
        for (const projectile of this.projectiles) {
            this.scene.remove(projectile.mesh);
        }
        this.projectiles = [];
        
        // Remove all explosions
        for (const explosion of this.explosions) {
            this.scene.remove(explosion);
        }
        this.explosions = [];
        
        // Reset player position and make visible
        this.player.object.position.set(0, 0.2, 5);
        this.player.object.visible = true;
        
        // Recriar managers que gerenciam as colisões para que não haja problemas
        this.collisions = new CollisionManager(this);
        
        // Reset enemies
        this.enemies.forEach(enemy => {
            this.scene.remove(enemy.object);
        });
        this.enemies = [];
        this.createEnemies(5);
        
        // Reinicia os objetos de cenário
        this.sceneryObjects.forEach(obj => {
            this.scene.remove(obj.object);
        });
        this.sceneryObjects = [];
        this.createSceneryObjects(15);
        
        // Start the game again
        this.isRunning = true;
        this.animate();
        
        console.log("Jogo reiniciado com sucesso");
    }
    
    // Play explosion sound using AudioManager
    playExplosionSound() {
        this.audio.playExplosionSound();
    }
    
    // Game over function
    gameOver() {
        // Stop the game
        this.isRunning = false;
        
        // Update high score if needed
        this.updateHighScore();
        
        // Show game over screen
        this.ui.showGameOverScreen();
    }
    
    // Load high score from localStorage
    loadHighScore() {
        const savedHighScore = localStorage.getItem('riverRaidHighScore');
        return savedHighScore ? parseInt(savedHighScore) : 0;
    }
    
    // Save high score to localStorage
    saveHighScore(score) {
        localStorage.setItem('riverRaidHighScore', score.toString());
    }
    
    // Update high score if current score is higher
    updateHighScore() {
        if (this.score > this.highScore) {
            // Mostrar mensagem de novo recorde
            this.ui.showMessage("NOVO RECORDE: " + this.score + "!", 3000);
            
            // Atualizar o highscore
            this.highScore = this.score;
            this.saveHighScore(this.highScore);
            
            // Atualizar display de high score
            if (this.ui && this.ui.highScoreDisplay) {
                this.ui.highScoreDisplay.textContent = `High Score: ${this.highScore}`;
            }
            
            console.log("Novo recorde estabelecido:", this.highScore);
            return true;
        }
        return false;
    }
    
    createCockpitDashboard() {
        // Criar um grupo para conter todos os elementos do cockpit
        this.cockpit = new THREE.Group();
        
        // Criar um painel de controle básico (uma placa à frente do jogador)
        const dashboardGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.01);
        const dashboardMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.2
        });
        const dashboard = new THREE.Mesh(dashboardGeometry, dashboardMaterial);
        dashboard.position.z = 0.15; // Posicionado à frente do piloto
        dashboard.position.y = -0.05; // Abaixo do nível dos olhos
        this.cockpit.add(dashboard);
        
        // Adicionar instrumentos ao painel (pequenos círculos)
        const instrumentRadius = 0.02;
        const instrumentGeometry = new THREE.CircleGeometry(instrumentRadius, 16);
        
        // Velocímetro
        const speedMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const speedometer = new THREE.Mesh(instrumentGeometry, speedMaterial);
        speedometer.position.set(-0.08, -0.05, 0.151); // Ligeiramente à frente do painel
        speedometer.rotation.y = Math.PI; // Para ficar virado para o piloto
        this.cockpit.add(speedometer);
        
        // Altímetro
        const altMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const altimeter = new THREE.Mesh(instrumentGeometry, altMaterial);
        altimeter.position.set(0, -0.05, 0.151);
        altimeter.rotation.y = Math.PI;
        this.cockpit.add(altimeter);
        
        // Radar
        const radarMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const radar = new THREE.Mesh(instrumentGeometry, radarMaterial);
        radar.position.set(0.08, -0.05, 0.151);
        radar.rotation.y = Math.PI;
        this.cockpit.add(radar);
        
        // Joystick
        const joystickGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.07, 8);
        const joystickMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const joystick = new THREE.Mesh(joystickGeometry, joystickMaterial);
        joystick.position.set(0, -0.03, 0.10);
        joystick.rotation.x = Math.PI / 6; // Inclinado para frente
        this.cockpit.add(joystick);
        
        // Manche do joystick
        const knobGeometry = new THREE.SphereGeometry(0.015, 8, 8);
        const knobMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const knob = new THREE.Mesh(knobGeometry, knobMaterial);
        knob.position.set(0, 0.035, 0); // Topo do joystick
        joystick.add(knob);
        
        // Adicionar o cockpit como filho do objeto player para que ele se mova junto
        this.player.object.add(this.cockpit);
        
        // Inicializar a visibilidade do cockpit (só visível no modo cockpit)
        this.cockpit.visible = (this.cameras.getCameraMode() === 2);
        
        // Atualizar as referências para acesso posterior (animações, etc.)
        this.dashboardElements = {
            speedometer,
            altimeter,
            radar,
            joystick
        };
    }
    
    // Atualizar o painel do cockpit com informações de jogo
    updateCockpitDashboard() {
        if (!this.cockpit) return;
        
        // Animar o radar (girar)
        if (this.dashboardElements?.radar) {
            this.dashboardElements.radar.rotation.z += 0.05;
        }
        
        // Inclinar o joystick com base na direção do movimento
        if (this.dashboardElements?.joystick) {
            const joystick = this.dashboardElements.joystick;
            const keys = this.input.getInput();
            
            if (keys.ArrowLeft) {
                joystick.rotation.z = Math.PI / 12; // Inclinado para a esquerda
            } else if (keys.ArrowRight) {
                joystick.rotation.z = -Math.PI / 12; // Inclinado para a direita
            } else {
                joystick.rotation.z = 0; // Centralizado
            }
        }
    }

    // Alternar entre jogo pausado e não pausado
    togglePause() {
        // Não permitir pausa se o jogo estiver em game over (isRunning = false)
        if (!this.isRunning) return;
        
        this.isPaused = !this.isPaused;
        console.log("Estado de pausa alterado para:", this.isPaused);
        
        if (this.isPaused) {
            this.ui.showMessage("JOGO PAUSADO");
            this.ui.createPauseOverlay();
        } else {
            this.ui.removePauseOverlay();
            this.ui.showMessage("Jogo Continuando");
        }
    }

    animate() {
        if (!this.isRunning) return;
        
        // Se o jogo estiver pausado, apenas re-renderizar a cena e continuar o loop
        if (this.isPaused) {
            console.log("Jogo pausado, apenas mantendo o loop de animação");
            // Render the scene
            this.renderer.render(this.scene, this.cameras.getCurrentCamera());
            requestAnimationFrame(() => this.animate());
            return;
        }

        requestAnimationFrame(() => this.animate());
        
        // Atualizar a simulação da água
        this.environment.update();
        
        // Update player
        this.player.update();
        
        // Get input state
        const keys = this.input.getInput();
        
        // Processar movimentação do avião
        if (keys.ArrowLeft) {
            this.player.moveLeft();
        }
        if (keys.ArrowRight) {
            this.player.moveRight();
        }
        
        // Always move scenery objects to create constant forward movement
        const currentSpeed = keys.ArrowUp ? 
            this.scenerySpeed + this.accelerationSpeed : this.scenerySpeed;
        
        // Move all scenery objects
        for (const sceneryObject of this.sceneryObjects) {
            sceneryObject.move(currentSpeed);
        }
        
        // Move all enemies
        for (const enemy of this.enemies) {
            if (enemy.active) { // Apenas move inimigos ativos
                enemy.move(currentSpeed);
            }
        }
        
        // Handle firing
        if (keys[' ']) {
            // Only fire when space is first pressed (not held)
            if (!keys.spaceWasPressed) {
                this.createProjectile();
                keys.spaceWasPressed = true;
            }
        } else {
            keys.spaceWasPressed = false;
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
        
        // Update explosions
        this.updateExplosions();
        
        // Check collisions
        this.collisions.checkCollisions();
        
        // Certifique-se de que a pontuação é atualizada na UI
        this.ui.updateScore(this.score);
        
        // Handle camera toggle
        if (keys['c']) {
            // Only toggle when C is first pressed (not held)
            if (!keys.cWasPressed) {
                this.cameras.toggleCamera();
                keys.cWasPressed = true;
            }
        } else {
            keys.cWasPressed = false;
        }
        
        // Update cameras
        this.cameras.updateFPCamera();
        this.cameras.updateCockpitCamera();
        
        // Update cockpit
        this.updateCockpitDashboard();
        
        // Render the scene
        this.renderer.render(this.scene, this.cameras.getCurrentCamera());
    }
}