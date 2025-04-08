// Usamos o THREE global carregado pelo script no HTML

export default class Projectile {
    constructor(startPosition, riverLength) {
        this.riverLength = riverLength;
        this.active = true;
        this.mesh = this.createProjectile(startPosition);
    }

    createProjectile(startPosition) {
        const projectileGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.3);
        const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        
        // Position at the front of the airplane
        projectile.position.copy(startPosition);
        projectile.position.z -= 1; // Start slightly in front of the airplane
        
        return projectile;
    }

    move() {
        if (!this.active) return;
        
        this.mesh.position.z -= 0.5; // Projectiles move faster than the player
        
        // Check if projectile is out of bounds
        if (this.mesh.position.z < -this.riverLength/2 - 5) {
            this.active = false;
        }
    }

    getCollisionBox() {
        // Criar uma caixa de colisão ligeiramente maior que o projétil para facilitar hits
        const box = new THREE.Box3().setFromObject(this.mesh);
        
        // Expandir ligeiramente a caixa de colisão
        const size = new THREE.Vector3();
        box.getSize(size);
        
        // Aumentar o tamanho da caixa em 20%
        size.multiplyScalar(1.2);
        
        // Recalcular a caixa com tamanho aumentado
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        const expandedBox = new THREE.Box3();
        expandedBox.setFromCenterAndSize(center, size);
        
        return expandedBox;
    }
    
    // Método para desativar o projétil
    deactivate() {
        this.active = false;
    }
}