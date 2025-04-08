// Classe para gerenciar as câmeras do jogo
export default class CameraManager {
    constructor(game) {
        this.game = game;
        this.setupCameras();
    }
    
    setupCameras() {
        // Set up camera for top-down view like the original River Raid
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 0); // Position above the scene
        this.camera.lookAt(0, 0, 0); // Look down at the scene
        
        // Create a first-person camera
        this.fpCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Create a cockpit camera (dentro da cabine)
        this.cockpitCamera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.05, 1000);
        
        // Track which camera is active (0=top-down, 1=follow, 2=cockpit)
        this.cameraMode = 0;
        this.activeCamera = this.camera;
        
        // Handle window resize for all cameras
        window.addEventListener('resize', () => this.handleResize());
    }
    
    handleResize() {
        const aspect = window.innerWidth / window.innerHeight;
        
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        
        this.fpCamera.aspect = aspect;
        this.fpCamera.updateProjectionMatrix();
        
        this.cockpitCamera.aspect = aspect;
        this.cockpitCamera.updateProjectionMatrix();
        
        if (this.game.renderer) {
            this.game.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
    
    toggleCamera() {
        // Cycle through camera modes (0->1->2->0)
        this.cameraMode = (this.cameraMode + 1) % 3;
        
        // Update active camera based on mode
        switch (this.cameraMode) {
            case 0:
                this.activeCamera = this.camera;
                if (this.game.ui) this.game.ui.showMessage("Câmera: Visão Clássica");
                break;
            case 1:
                this.activeCamera = this.fpCamera;
                if (this.game.ui) this.game.ui.showMessage("Câmera: Visão Externa");
                break;
            case 2:
                this.activeCamera = this.cockpitCamera;
                if (this.game.ui) this.game.ui.showMessage("Câmera: Visão Cockpit");
                break;
        }
        
        // Atualizar visibilidade do cockpit se existir
        if (this.game.cockpit) {
            this.game.cockpit.visible = (this.cameraMode === 2);
        }
    }
    
    updateFPCamera() {
        if (!this.game.player) return;
        
        // Position the first-person camera slightly above and behind the player model
        const playerPosition = this.game.player.object.position.clone();
        
        // External view camera - positioned behind and above player
        this.fpCamera.position.set(
            playerPosition.x,
            playerPosition.y + 0.7, // Slightly above the player's position
            playerPosition.z + 2.5  // Behind the player
        );
        
        // Point the camera slightly ahead of the player
        this.fpCamera.lookAt(
            playerPosition.x,
            playerPosition.y,
            playerPosition.z - 10 // Look ahead (forward is -Z)
        );
    }
    
    updateCockpitCamera() {
        if (!this.game.player) return;
        
        const playerPosition = this.game.player.object.position.clone();
        
        // Posicionar a câmera no cockpit do avião
        this.cockpitCamera.position.set(
            playerPosition.x,          // Centralizado no avião
            playerPosition.y + 0.3,    // Altura dos olhos do piloto
            playerPosition.z + 0.1     // Ligeiramente à frente para ver o cockpit
        );
        
        // Olhar para frente
        this.cockpitCamera.lookAt(
            playerPosition.x,
            playerPosition.y + 0.1, // Ligeiramente acima da linha do horizonte
            playerPosition.z - 10   // Olhar para longe na direção de movimento
        );
    }
    
    getCurrentCamera() {
        return this.activeCamera;
    }
    
    getCameraMode() {
        return this.cameraMode;
    }
} 