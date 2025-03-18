import * as THREE from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js';

export default class Enemy {
    constructor(riverWidth, riverLength) {
        this.riverWidth = riverWidth;
        this.riverLength = riverLength;
        this.object = this.createEnemy();
    }

    createEnemy() {
        const enemy = new THREE.Group();
        
        // Create a pixel-art style enemy ship
        const pixelSize = 0.15;
        
        // Define the pixel layout for the enemy ship (1 = red, 2 = dark gray, 3 = orange)
        const pixelLayout = [
            [0, 0, 2, 0, 0],
            [0, 2, 2, 2, 0],
            [1, 1, 1, 1, 1],
            [3, 3, 3, 3, 3]
        ];
        
        const colorMap = {
            1: 0xff0000, // Red
            2: 0x333333, // Dark gray
            3: 0xff6600  // Orange
        };
        
        const width = pixelLayout[0].length;
        const height = pixelLayout.length;
        
        // Build the enemy ship pixel by pixel
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelType = pixelLayout[y][x];
                if (pixelType > 0) {
                    const pixelGeometry = new THREE.BoxGeometry(pixelSize, pixelSize, pixelSize);
                    const pixelMaterial = new THREE.MeshBasicMaterial({ 
                        color: colorMap[pixelType]
                    });
                    const pixel = new THREE.Mesh(pixelGeometry, pixelMaterial);
                    pixel.position.set(
                        (x - width/2 + 0.5) * pixelSize,
                        0.05,
                        (y - height/2 + 0.5) * pixelSize
                    );
                    enemy.add(pixel);
                }
            }
        }
        
        // Position adjustments
        enemy.rotation.x = Math.PI/2; // Lay flat horizontally
        
        // Random position within the river
        this.resetPosition(enemy);
        
        // Add collision box
        enemy.userData.collisionBox = new THREE.Box3().setFromObject(enemy);
        
        return enemy;
    }

    resetPosition(enemyObject = this.object) {
        const maxX = this.riverWidth/2 - 1;
        enemyObject.position.set(
            (Math.random() * 2 - 1) * maxX, // Random x within river
            0.2,
            -this.riverLength/2 - Math.random() * 10 // Start above the visible area
        );
    }

    move(speed) {
        this.object.position.z += speed;
        
        // If enemy moves past the bottom of the screen, reset to top with new random position
        if (this.object.position.z > this.riverLength/2 + 5) {
            this.resetPosition();
        }
    }

    getCollisionBox() {
        this.object.userData.collisionBox.setFromObject(this.object);
        return this.object.userData.collisionBox;
    }
}