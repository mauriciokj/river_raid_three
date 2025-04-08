// Classe para gerenciar inputs do jogo
export default class InputManager {
    constructor(game) {
        this.game = game;
        this.setupControls();
    }
    
    setupControls() {
        // Movement controls
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            ' ': false, // Space key for firing
            'c': false, // C key for camera toggle
            'p': false, // P key for pause (minúsculo)
            'P': false, // P key for pause (maiúsculo)
            '+': false, // Aumentar tamanho do modelo
            '-': false, // Diminuir tamanho do modelo
            'spaceWasPressed': false,
            'cWasPressed': false,
            'pWasPressed': false // Flag para controle da tecla P
        };
        
        // Flags para controlar os ajustes de escala (evitar ajustes múltiplos ao segurar a tecla)
        this.scaleKeyPressed = {
            '+': false,
            '-': false
        };
        
        // Handle keyboard input
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(e) {
        console.log("Tecla pressionada:", e.key);
        
        if (this.keys.hasOwnProperty(e.key)) {
            this.keys[e.key] = true;
            
            // Ajustar escala do modelo quando as teclas + ou - são pressionadas
            if ((e.key === '+' || e.key === '-') && !this.scaleKeyPressed[e.key]) {
                this.scaleKeyPressed[e.key] = true;
                
                // Calcular fator de escala (+ aumenta, - diminui)
                const scaleFactor = e.key === '+' ? 1.2 : 0.8;
                
                // Ajustar escala do modelo
                if (this.game.player) {
                    this.game.player.adjustScale(scaleFactor);
                
                    // Exibir informações sobre a escala atual na tela
                    if (this.game.ui) {
                        this.game.ui.showScaleInfo(this.game.player.currentScale);
                    }
                }
            }
            
            // Verificar tecla P para pausa
            if ((e.key === 'p' || e.key === 'P') && !this.keys.pWasPressed) {
                console.log("Tecla P detectada, chamando togglePause()");
                this.keys.pWasPressed = true;
                this.game.togglePause();
            }
        }
    }
    
    handleKeyUp(e) {
        if (this.keys.hasOwnProperty(e.key)) {
            this.keys[e.key] = false;
            
            // Resetar as flags de escala
            if (e.key === '+' || e.key === '-') {
                this.scaleKeyPressed[e.key] = false;
            }
            
            // Resetar flag da tecla P
            if (e.key === 'p' || e.key === 'P') {
                this.keys.pWasPressed = false;
            }
        }
    }
    
    isKeyPressed(key) {
        return this.keys[key] === true;
    }
    
    getInput() {
        return this.keys;
    }
} 