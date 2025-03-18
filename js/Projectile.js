import * as THREE from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js';

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
        return new THREE.Box3().setFromObject(this.mesh);
    }
}