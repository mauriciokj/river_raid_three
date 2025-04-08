// Classe para gerenciar colisões do jogo
export default class CollisionManager {
    constructor(game) {
        this.game = game;
        this.isColliding = false; // Flag para evitar múltiplas colisões em sequência
    }
    
    checkCollisions() {
        // Skip if player is not initialized yet
        if (!this.game.player || !this.game.player.object) return;
        
        // Skip if isColliding is true (player already in collision handling)
        if (this.isColliding) return;
        
        // Check different types of collisions
        this.checkPlayerCollisions();
        this.checkProjectileCollisions();
        this.checkRiverBoundaryCollisions();
    }
    
    checkPlayerCollisions() {
        // Verifica se o jogador está ativo e visível
        if (!this.game.player.active || !this.game.player.object.visible) {
            return false;
        }
        
        // Obter posição do jogador
        const playerPos = this.game.player.object.position;
        
        // Para cada inimigo, verificar colisão
        for (let i = 0; i < this.game.enemies.length; i++) {
            const enemy = this.game.enemies[i];
            
            // Pular inimigos inativos ou invisíveis
            if (!enemy.active || !enemy.object.visible) continue;
            
            // Obter posição do inimigo
            const enemyPos = enemy.object.position;
            
            // Verificar distância horizontal (apenas X e Z, ignorando Y)
            const dx = playerPos.x - enemyPos.x;
            const dz = playerPos.z - enemyPos.z;
            const distXZ = Math.sqrt(dx*dx + dz*dz);
            
            // Distância para colisão - valor pequeno para melhor precisão
            const collisionDistance = 0.5;
            
            // Se a distância for menor que o limite, houve colisão
            if (distXZ < collisionDistance) {
                // Tratar colisão com inimigo
                this.handleEnemyCollision(enemy);
                return true;
            }
        }
        
        return false;
    }
    
    checkRiverBoundaryCollisions() {
        // Get player position
        const playerX = this.game.player.object.position.x;
        const riverWidth = this.game.riverWidth;
        
        // Check if player is outside river boundaries (with some margin)
        if (Math.abs(playerX) > (riverWidth / 2 - 0.8)) {
            this.handleRiverBoundaryCollision();
        }
    }
    
    checkProjectileCollisions() {
        for (let i = this.game.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.game.projectiles[i];
            
            // Skip inactive projectiles
            if (!projectile.active) continue;
            
            const projectileBox = projectile.getCollisionBox();
            
            for (const enemy of this.game.enemies) {
                // Skip inactive enemies
                if (!enemy.active || !enemy.object.visible) continue;
                
                const enemyBox = enemy.getCollisionBox();
                
                // Check collision between projectile and enemy
                if (projectileBox.intersectsBox(enemyBox)) {
                    // Projectile hit enemy - enemy destroyed
                    this.handleProjectileEnemyCollision(projectile, enemy);
                    return true;
                }
            }
        }
        
        return false;
    }
    
    handleEnemyCollision(enemy) {
        if (this.isColliding) return; // Evitar processamento múltiplo
        
        // Ativar flag de colisão
        this.isColliding = true;
        
        // Criar explosão na posição do inimigo
        this.game.createExplosion(enemy.getPosition());
        
        // Tocar som de explosão
        this.game.playExplosionSound();
        
        // Desativar o inimigo (será reposicionado)
        enemy.deactivate();
        
        // Fazer o jogador ficar temporariamente invisível
        this.game.player.object.visible = false;
        
        // Perder uma vida
        this.game.lives--;
        if (this.game.ui) {
            this.game.ui.updateLivesDisplay();
        }
        
        // Verificar se é game over
        if (this.game.lives <= 0) {
            this.game.gameOver();
            return;
        }
        
        // Reposicionar o jogador após um breve delay
        setTimeout(() => {
            // Resetar posição do jogador
            this.game.player.object.position.set(0, 0.2, 5);
            
            // Tornar o jogador visível novamente
            this.game.player.object.visible = true;
            
            // Resetar flag de colisão
            this.isColliding = false;
        }, 1000);
    }
    
    handleRiverBoundaryCollision() {
        if (this.isColliding) return;
        
        this.isColliding = true;
        
        // Criar explosão na posição do jogador
        this.game.createExplosion(this.game.player.object.position.clone());
        
        // Tocar som de explosão
        this.game.playExplosionSound();
        
        // Fazer o jogador ficar temporariamente invisível
        this.game.player.object.visible = false;
        
        // Perder uma vida
        this.game.lives--;
        if (this.game.ui) {
            this.game.ui.updateLivesDisplay();
        }
        
        // Verificar se é game over
        if (this.game.lives <= 0) {
            this.game.gameOver();
            return;
        }
        
        // Reposicionar o jogador após um breve delay
        setTimeout(() => {
            // Resetar posição do jogador
            this.game.player.object.position.set(0, 0.2, 5);
            
            // Tornar o jogador visível novamente
            this.game.player.object.visible = true;
            
            // Resetar flag de colisão
            this.isColliding = false;
        }, 1000);
    }
    
    handleProjectileEnemyCollision(projectile, enemy) {
        // Create explosion at the enemy position
        this.game.createExplosion(enemy.getPosition());
        
        // Play explosion sound
        this.game.playExplosionSound();
        
        // Deactivate the projectile and enemy
        projectile.deactivate();
        enemy.deactivate();
        
        // Increase score
        this.game.score += 100;
        if (this.game.ui) {
            this.game.ui.updateScore(this.game.score);
        }
        
        // Verificar se bateu o recorde após aumentar a pontuação
        this.game.updateHighScore();
        
        // Reativar o inimigo após um delay (2 segundos)
        setTimeout(() => {
            enemy.reactivate();
        }, 2000);
    }

    // Substituir o método handlePlayerEnemyCollision para usar a nova função padronizada
    handlePlayerEnemyCollision(enemy) {
        this.handleEnemyCollision(enemy);
    }
} 