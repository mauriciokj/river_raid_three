import * as THREE from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js';

export default class Player {
    constructor(riverWidth) {
        this.object = this.createAirplane();
        this.riverBoundary = (riverWidth / 2) - 0.5;
        this.baseSpeed = 0.1;
    }

    createAirplane() {
        const airplane = new THREE.Group();
        
        // Use a slightly larger pixel size for better visibility
        const pixelSize = 0.15;
        
        // Define the pixel layout for the airplane (1 = filled, 0 = empty)
        // This creates a retro-style airplane viewed from above
        const pixelLayout = [
            [0, 0, 0, 1, 0, 0, 0],  // Top tail
            [0, 0, 1, 1, 1, 0, 0],  // Upper tail
            [0, 1, 1, 1, 1, 1, 0],  // Wings top
            [1, 1, 1, 1, 1, 1, 1],  // Main wings
            [0, 0, 1, 1, 1, 0, 0],  // Body
            [0, 0, 1, 1, 1, 0, 0],  // Lower body
            [0, 1, 0, 0, 0, 1, 0],  // Rear details
            [0, 1, 0, 0, 0, 1, 0],  // Bottom details
            [0, 0, 1, 1, 1, 0, 0]   // Tail end
        ];
        
        // Create a pixel for each filled position
        const pixelGeometry = new THREE.BoxGeometry(pixelSize, pixelSize, pixelSize);
        const pixelMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 }); // Yellow color like original Atari
        
        const width = pixelLayout[0].length;
        const height = pixelLayout.length;
        
        // Build the airplane pixel by pixel
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixelLayout[y][x] === 1) {
                    const pixel = new THREE.Mesh(pixelGeometry, pixelMaterial);
                    pixel.position.set(
                        (x - width/2 + 0.5) * pixelSize,
                        0.05, // Slightly above ground
                        (y - height/2 + 0.5) * pixelSize
                    );
                    airplane.add(pixel);
                }
            }
        }

        // Position adjustments
        airplane.rotation.x = Math.PI/2; // Lay flat horizontally
        airplane.position.set(0, 0.2, 5); // Adjust Y position for better visibility
        airplane.scale.set(1.2, 1.2, 1.2); // Make it slightly larger

        return airplane;
    }

    moveLeft() {
        this.object.position.x -= this.baseSpeed;
        // Keep within river width boundaries
        this.object.position.x = Math.max(this.object.position.x, -this.riverBoundary);
    }

    moveRight() {
        this.object.position.x += this.baseSpeed;
        // Keep within river width boundaries
        this.object.position.x = Math.min(this.object.position.x, this.riverBoundary);
    }

    getCollisionBox() {
        return new THREE.Box3().setFromObject(this.object);
    }
}