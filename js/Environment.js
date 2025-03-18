import * as THREE from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js';

export default class Environment {
    constructor(scene) {
        this.scene = scene;
        this.riverWidth = 10;
        this.riverLength = 50;
        this.bankWidth = 5;
        
        this.createRiver();
        this.createRiverBanks();
    }

    createRiver() {
        const riverGeometry = new THREE.PlaneGeometry(this.riverWidth, this.riverLength);
        const riverMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22, side: THREE.DoubleSide });
        this.river = new THREE.Mesh(riverGeometry, riverMaterial);
        this.river.rotation.x = Math.PI / 2; // Rotate to be horizontal
        this.scene.add(this.river);
    }

    createRiverBanks() {
        const leftBankGeometry = new THREE.PlaneGeometry(this.bankWidth, this.riverLength);
        const rightBankGeometry = new THREE.PlaneGeometry(this.bankWidth, this.riverLength);
        const bankMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513, side: THREE.DoubleSide });
        
        this.leftBank = new THREE.Mesh(leftBankGeometry, bankMaterial);
        this.leftBank.rotation.x = Math.PI / 2;
        this.leftBank.position.x = -(this.riverWidth/2 + this.bankWidth/2);
        this.scene.add(this.leftBank);
        
        this.rightBank = new THREE.Mesh(rightBankGeometry, bankMaterial);
        this.rightBank.rotation.x = Math.PI / 2;
        this.rightBank.position.x = (this.riverWidth/2 + this.bankWidth/2);
        this.scene.add(this.rightBank);
    }

    getRiverWidth() {
        return this.riverWidth;
    }

    getRiverLength() {
        return this.riverLength;
    }
}