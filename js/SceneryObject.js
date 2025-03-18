import * as THREE from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js';

export default class SceneryObject {
    constructor(isLeft, riverWidth, riverLength) {
        this.isLeft = isLeft;
        this.riverWidth = riverWidth;
        this.riverLength = riverLength;
        this.object = this.createSceneryObject();
    }

    createSceneryObject() {
        const types = [
            { geometry: new THREE.BoxGeometry(0.8, 0.3, 0.8), color: 0x006400 }, // Dark green (trees)
            { geometry: new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8), color: 0x8B4513 }, // Brown (houses)
            { geometry: new THREE.BoxGeometry(1, 0.5, 1.5), color: 0x808080 } // Gray (buildings)
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        const material = new THREE.MeshBasicMaterial({ color: type.color });
        const object = new THREE.Mesh(type.geometry, material);
        
        this.resetPosition(object);
        
        return object;
    }

    resetPosition(objectToReset = this.object) {
        // Position on either left or right bank
        const bankOffset = this.riverWidth/2 + Math.random() * 3;
        objectToReset.position.x = this.isLeft ? -bankOffset : bankOffset;
        
        // Random position along the river length, starting from top (negative z)
        objectToReset.position.z = -this.riverLength/2 - Math.random() * 10;
        objectToReset.position.y = 0.3; // Slightly above ground
    }

    move(speed) {
        this.object.position.z += speed;
        
        // If object moves past the bottom of the screen, reset to top with new random position
        if (this.object.position.z > this.riverLength/2 + 5) {
            this.resetPosition();
        }
    }
}