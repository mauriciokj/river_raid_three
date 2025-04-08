// Usamos o THREE global carregado pelo script no HTML

export default class Environment {
    constructor(scene) {
        this.scene = scene;
        this.riverWidth = 10;
        this.riverLength = 50;
        this.bankWidth = 5;
        
        // Carregar texturas para a água
        this.waterTexture = null;
        this.loadWaterTexture();
        
        // Para animação da água
        this.clock = new THREE.Clock();
        this.waterUniforms = {
            time: { value: 0 },
            waveHeight: { value: 0.03 },
            waveFrequency: { value: 3.0 },
            waveSpeed: { value: 0.7 },
            waterColor: { value: new THREE.Color(0x4CAFEB) }, // Azul claro mais brilhante
            waterTexture: { value: null }
        };
        
        this.createRiver();
        this.createRiverBanks();
    }
    
    loadWaterTexture() {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('./textures/water_normal.jpg', (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(5, 10); // Repetir a textura para cobrir a área
            this.waterTexture = texture;
            this.waterUniforms.waterTexture.value = texture;
            
            // Atualizar o material da água com a textura carregada
            if (this.river && this.river.material) {
                this.river.material.needsUpdate = true;
            }
        });
    }
    
    createRiver() {
        const riverGeometry = new THREE.PlaneGeometry(this.riverWidth, this.riverLength, 32, 64);
        
        // Shader para água mais realista com textura
        const waterVertexShader = `
            uniform float time;
            uniform float waveHeight;
            uniform float waveFrequency;
            uniform float waveSpeed;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vPosition = position;
                
                // Aplicar ondulação à água
                float wave = sin(position.x * waveFrequency + time * waveSpeed) * 
                           sin(position.z * waveFrequency + time * waveSpeed) * 
                           waveHeight;
                
                vec3 newPosition = position;
                newPosition.y += wave;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `;
        
        const waterFragmentShader = `
            uniform vec3 waterColor;
            uniform float time;
            uniform sampler2D waterTexture;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                // Deslocar coordenadas de textura para criar movimento
                vec2 uv = vUv;
                uv.y -= time * 0.3;
                
                // Criar padrão de ondas dinâmico
                float pattern1 = sin(vUv.x * 20.0 + time) * sin(vUv.y * 20.0 + time) * 0.1;
                float pattern2 = sin(vUv.x * 30.0 - time * 0.5) * sin(vUv.y * 15.0 - time * 0.5) * 0.05;
                
                // Obter normal da textura
                vec4 texColor = texture2D(waterTexture, uv);
                
                // Base de cor azul água
                vec3 finalColor = waterColor;
                
                // Adicionar detalhes da textura
                finalColor += texColor.rgb * 0.15;
                
                // Adicionar variação e brilho nas ondas
                float brightness = 0.8 + pattern1 + pattern2;
                finalColor *= brightness;
                
                // Adicionar brilho especular nas "cristas" das ondas
                float specular = pow(max(pattern1 + pattern2, 0.0), 2.0) * 0.3;
                finalColor += vec3(specular);
                
                gl_FragColor = vec4(finalColor, 0.95); // Leve transparência
            }
        `;
        
        // Criar material ShaderMaterial para a água
        const riverMaterial = new THREE.ShaderMaterial({
            uniforms: this.waterUniforms,
            vertexShader: waterVertexShader,
            fragmentShader: waterFragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.river = new THREE.Mesh(riverGeometry, riverMaterial);
        this.river.rotation.x = Math.PI / 2; // Rotacionar para ser horizontal
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
    
    // Método para atualizar a animação da água
    update() {
        if (this.waterUniforms) {
            this.waterUniforms.time.value = this.clock.getElapsedTime();
        }
    }
}