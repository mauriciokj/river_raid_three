// Classe para gerenciar elementos de interface do usuário
export default class UIManager {
    constructor(game) {
        this.game = game;
        
        // Inicializar elementos de UI
        this.createLivesDisplay();
        this.createHighScoreElements();
        this.createGameOverScreen();
        
        // Usar o elemento score que já existe no HTML
        this.scoreDisplay = document.getElementById('scoreDisplay');
        if (this.scoreDisplay) {
            console.log("Usando elemento scoreDisplay existente no HTML");
            this.updateScore(this.game.score);
        } else {
            console.error("Elemento scoreDisplay não encontrado no HTML!");
        }
    }
    
    createHighScoreElements() {
        this.highScoreDisplay = document.createElement('div');
        this.highScoreDisplay.id = 'highScoreDisplay';
        this.highScoreDisplay.style.position = 'absolute';
        this.highScoreDisplay.style.top = '20px';
        this.highScoreDisplay.style.right = '20px';
        this.highScoreDisplay.style.color = 'white';
        this.highScoreDisplay.style.fontFamily = 'Arial, sans-serif';
        this.highScoreDisplay.style.fontSize = '18px';
        this.highScoreDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.highScoreDisplay.style.padding = '10px';
        this.highScoreDisplay.style.borderRadius = '5px';
        this.highScoreDisplay.style.zIndex = '100';
        this.highScoreDisplay.textContent = `High Score: ${this.game.highScore}`;
        document.body.appendChild(this.highScoreDisplay);
    }
    
    createLivesDisplay() {
        this.livesDisplay = document.createElement('div');
        this.livesDisplay.id = 'livesDisplay';
        this.livesDisplay.style.position = 'absolute';
        this.livesDisplay.style.top = '60px';
        this.livesDisplay.style.left = '50%';
        this.livesDisplay.style.transform = 'translateX(-50%)';
        this.livesDisplay.style.color = 'white';
        this.livesDisplay.style.fontFamily = 'Arial, sans-serif';
        this.livesDisplay.style.fontSize = '18px';
        this.livesDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.livesDisplay.style.padding = '10px';
        this.livesDisplay.style.borderRadius = '5px';
        this.livesDisplay.style.zIndex = '100';
        
        this.updateLivesDisplay();
        document.body.appendChild(this.livesDisplay);
    }
    
    updateLivesDisplay() {
        let livesHTML = 'Lives: ';
        for (let i = 0; i < this.game.lives; i++) {
            livesHTML += '❤️ ';
        }
        this.livesDisplay.innerHTML = livesHTML;
    }
    
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
        restartButton.addEventListener('click', () => this.game.restartGame());
        this.gameOverScreen.appendChild(restartButton);
        
        document.body.appendChild(this.gameOverScreen);
    }
    
    showGameOverScreen() {
        // Update final score displays
        this.finalScoreDisplay.textContent = `Your Score: ${this.game.score}`;
        this.finalHighScoreDisplay.textContent = `High Score: ${this.game.highScore}`;
        
        // Show the game over screen
        this.gameOverScreen.style.display = 'flex';
    }
    
    hideGameOverScreen() {
        this.gameOverScreen.style.display = 'none';
    }
    
    updateScore(score) {
        // Atualizar o conteúdo do elemento de pontuação com apenas o valor numérico
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = score;
            
            // Adicionar um efeito visual para destacar mudanças de pontuação
            this.scoreDisplay.style.transform = 'scale(1.2)';
            this.scoreDisplay.style.transition = 'transform 0.2s ease-in-out';
            
            // Voltar ao tamanho normal após 200ms
            setTimeout(() => {
                this.scoreDisplay.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    showMessage(message, duration = 2000) {
        // Remover mensagem anterior se existir
        const existingMessage = document.getElementById('gameMessage');
        if (existingMessage) {
            document.body.removeChild(existingMessage);
        }
        
        // Criar novo elemento para a mensagem
        const messageElement = document.createElement('div');
        messageElement.id = 'gameMessage';
        messageElement.style.position = 'absolute';
        messageElement.style.top = '120px';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translateX(-50%)';
        messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        messageElement.style.color = 'white';
        messageElement.style.padding = '10px 20px';
        messageElement.style.borderRadius = '5px';
        messageElement.style.fontFamily = 'Arial, sans-serif';
        messageElement.style.fontSize = '16px';
        messageElement.style.zIndex = '1000';
        messageElement.textContent = message;
        
        // Adicionar à página
        document.body.appendChild(messageElement);
        
        // Remover após o tempo especificado
        setTimeout(() => {
            if (document.body.contains(messageElement)) {
                document.body.removeChild(messageElement);
            }
        }, duration);
    }
    
    // Criar um overlay visual para a pausa
    createPauseOverlay() {
        // Remover overlay existente se houver
        this.removePauseOverlay();
        
        // Criar overlay
        this.pauseOverlay = document.createElement('div');
        this.pauseOverlay.id = 'pauseOverlay';
        this.pauseOverlay.style.position = 'absolute';
        this.pauseOverlay.style.top = '0';
        this.pauseOverlay.style.left = '0';
        this.pauseOverlay.style.width = '100%';
        this.pauseOverlay.style.height = '100%';
        this.pauseOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.pauseOverlay.style.display = 'flex';
        this.pauseOverlay.style.justifyContent = 'center';
        this.pauseOverlay.style.alignItems = 'center';
        this.pauseOverlay.style.zIndex = '1000';
        
        // Texto de pausa
        const pauseText = document.createElement('div');
        pauseText.textContent = 'JOGO PAUSADO';
        pauseText.style.color = 'white';
        pauseText.style.fontSize = '48px';
        pauseText.style.fontFamily = 'Arial, sans-serif';
        pauseText.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        pauseText.style.padding = '20px 40px';
        pauseText.style.borderRadius = '10px';
        
        // Adicionar instruções
        const instructions = document.createElement('div');
        instructions.textContent = 'Pressione P para continuar';
        instructions.style.color = 'white';
        instructions.style.fontSize = '20px';
        instructions.style.marginTop = '10px';
        instructions.style.textAlign = 'center';
        
        pauseText.appendChild(instructions);
        this.pauseOverlay.appendChild(pauseText);
        document.body.appendChild(this.pauseOverlay);
    }
    
    removePauseOverlay() {
        if (this.pauseOverlay && document.body.contains(this.pauseOverlay)) {
            document.body.removeChild(this.pauseOverlay);
            this.pauseOverlay = null;
        }
    }
    
    showScaleInfo(scale) {
        const scalePercent = (scale * 100).toFixed(0);
        this.showMessage(`Escala do modelo: ${scalePercent}%`, 2000);
    }
} 