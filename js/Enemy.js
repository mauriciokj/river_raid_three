// Usamos o THREE global carregado pelo script no HTML

export default class Enemy {
    constructor(riverWidth, riverLength) {
        this.riverWidth = riverWidth;
        this.riverLength = riverLength;
        this.modelScale = 0.005; // Aumentado de 0.0015 para ter mais detalhes visíveis
        this.object = null;
        this.active = true; // Flag para controle de estado do inimigo
        
        // Carregar o modelo 3D do navio
        this.loadShipModel();
    }

    loadShipModel() {
        const loader = new THREE.GLTFLoader();
        const modelUrl = '../models/warship.glb?v=' + Date.now(); // Evitar cache
        
        // Criar um grupo temporário vazio enquanto o modelo carrega
        this.object = new THREE.Group();
        this.resetPosition(this.object);
        
        loader.load(
            modelUrl,
            // Callback de sucesso
            (gltf) => {
                const model = gltf.scene;
                
                // Configurar o modelo
                model.scale.set(this.modelScale, this.modelScale, this.modelScale);
                
                // Rotacionar para a orientação correta:
                // 1. Girar no eixo Y para ficar perpendicular à direção do avião (formando um T)
                model.rotation.y = Math.PI/2; // 90 graus, perpendicular à direção de scroll
                // 2. Manter na horizontal sobre a água
                model.rotation.z = Math.PI/2; 
                // 3. Inverter a orientação para que o casco fique para baixo
                model.rotation.x = -Math.PI/2; // Invertido para -90 graus
                
                // Ajuste de posição para parecer parcialmente imerso na água
                model.position.y = 0.07; // Valor intermediário para ficar parcialmente submerso
                
                // Aplicar materiais para melhor aparência
                model.traverse((child) => {
                    if (child.isMesh) {
                        // Melhora a aparência com materiais mais realistas
                        child.material = new THREE.MeshStandardMaterial({
                            color: child.material.color || 0x888888,
                            metalness: 0.7,
                            roughness: 0.3,
                            emissive: 0x222222,
                            emissiveIntensity: 0.2
                        });
                        
                        // Ativar sombras
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Substituir o grupo temporário pelo modelo carregado
                const oldPosition = this.object.position.clone();
                const wasVisible = this.object.visible;
                
                // Limpar o grupo antigo
                while (this.object.children.length > 0) {
                    this.object.remove(this.object.children[0]);
                }
                
                // Adicionar o modelo ao grupo
                this.object.add(model);
                
                // Restaurar posição e visibilidade
                this.object.position.copy(oldPosition);
                this.object.visible = wasVisible;
                
                console.log("Modelo de navio carregado com sucesso");
            },
            // Callback de progresso (opcional)
            (xhr) => {
                const percentLoaded = (xhr.loaded / xhr.total * 100).toFixed(2);
                console.log(`Carregando navio: ${percentLoaded}%`);
            },
            // Callback de erro
            (error) => {
                console.error("Erro ao carregar o modelo do navio:", error);
                
                // Criar um modelo de fallback simples (navio pixelado original)
                this.createPixelShip();
            }
        );
    }

    createPixelShip() {
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
        
        // Substituir o grupo existente
        const oldPosition = this.object.position.clone();
        const wasVisible = this.object.visible;
        
        // Limpar o grupo antigo
        while (this.object.children.length > 0) {
            this.object.remove(this.object.children[0]);
        }
        
        // Adicionar o navio pixel art
        this.object.add(enemy);
        
        // Restaurar posição e visibilidade
        this.object.position.copy(oldPosition);
        this.object.visible = wasVisible;
        
        console.log("Modelo de fallback criado para o navio");
    }

    resetPosition(enemyObject = this.object) {
        const maxX = this.riverWidth/2 - 1;
        enemyObject.position.set(
            (Math.random() * 2 - 1) * maxX, // Random x within river
            0.05, // Baixar para ficar parcialmente submerso na água
            -this.riverLength/2 - Math.random() * 10 // Start above the visible area
        );
        
        // Garantir que o inimigo esteja visível e ativo após reposicionamento
        this.object.visible = true;
        this.active = true;
    }

    move(speed) {
        this.object.position.z += speed;
        
        // If enemy moves past the bottom of the screen, reset to top with new random position
        if (this.object.position.z > this.riverLength/2 + 5) {
            this.resetPosition();
        }
    }

    getCollisionBox() {
        // Criar uma caixa de colisão ligeiramente menor que o objeto para colisões mais precisas
        const box = new THREE.Box3().setFromObject(this.object);
        
        // Reduzir ligeiramente o tamanho da caixa de colisão
        const size = new THREE.Vector3();
        box.getSize(size);
        
        // Reduzir o tamanho da caixa em 20%
        size.multiplyScalar(0.8);
        
        // Recalcular a caixa com tamanho reduzido
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        const reducedBox = new THREE.Box3();
        reducedBox.setFromCenterAndSize(center, size);
        
        return reducedBox;
    }

    // Retorna a posição atual do inimigo para criação de explosão
    getPosition() {
        return this.object.position.clone();
    }
    
    // Desativa o inimigo, tornando-o invisível temporariamente
    deactivate() {
        this.active = false;
        this.object.visible = false;
    }
    
    // Reativa o inimigo e reposiciona
    reactivate() {
        this.active = true;
        this.object.visible = true;
        this.resetPosition();
    }
}