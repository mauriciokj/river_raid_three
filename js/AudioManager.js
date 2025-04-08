// Classe para gerenciar áudio do jogo
export default class AudioManager {
    constructor(game) {
        this.game = game;
        this.loadSounds();
    }
    
    loadSounds() {
        // Criar um listener de áudio
        this.listener = new THREE.AudioListener();
        
        // Adicionar o listener na câmera principal
        setTimeout(() => {
            // Usar timeout para garantir que a câmera já está configurada
            if (this.game.cameras && this.game.cameras.camera) {
                this.game.cameras.camera.add(this.listener);
            }
        }, 100);
        
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
    
    // Atualizar o listener de áudio para a câmera ativa
    updateAudioListener(camera) {
        if (this.listener && camera) {
            camera.add(this.listener);
        }
    }
} 