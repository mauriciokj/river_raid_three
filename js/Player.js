// Usamos o THREE global carregado pelo script no HTML

// --- Constantes para Configuração ---
// Use o tucano.gltf local com cor amarela
const MODEL_URL = '../models/tucano.gltf?v=' + Date.now(); // Modelo tucano local
const ALTERNATE_MODEL_URL = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/Parrot.glb'; // Modelo alternativo
const INITIAL_SCALE = 0.100; // Escala ajustada conforme feedback do usuário
const VERTICAL_OFFSET = 0.3; // Altura ajustada para o avião
const INITIAL_Z_POSITION = 5; // Posição Z inicial (mais para frente na câmera)
const TILT_ANGLE = 0.3; // Ângulo de inclinação ao virar (em radianos)

export default class Player {
    /**
     * Construtor da classe Player.
     * @param {number} riverWidth - A largura total do rio para calcular os limites.
     * @param {function} [onLoadComplete=null] - Função de callback a ser chamada quando o modelo 3D terminar de carregar (ou falhar).
     */
    constructor(riverWidth, onLoadComplete = null) {
        // Calcula a fronteira X máxima/mínima com base na largura do rio
        // Subtrai um valor (ex: 0.5 ou metade da largura estimada do avião) para margem
        this.riverWidth = riverWidth; // Armazena a largura do rio
        this.riverBoundary = (riverWidth / 2) - (INITIAL_SCALE * 1.5); // Ajuste a margem conforme necessário
        this.baseSpeed = 0.1; // Velocidade de movimento lateral
        this.onLoadComplete = onLoadComplete; // Armazena a função de callback
        this.modelRetries = 0; // Contador de tentativas de carregamento de modelos
        this.currentScale = INITIAL_SCALE; // Armazena a escala atual para ajustes
        
        // Adicionar flag de estado do jogador
        this.active = true;
        
        // Novas propriedades para animação
        this.propeller = null; // Referência para a hélice (se existir no modelo)
        this.isMovingLeft = false; // Flag para controlar inclinação
        this.isMovingRight = false; // Flag para controlar inclinação
        this.targetTilt = 0; // Ângulo alvo para inclinação suave
        this.currentTilt = 0; // Ângulo atual de inclinação

        // Cria um Grupo THREE.Group VAZIO imediatamente.
        // Este grupo será o objeto principal do jogador ('this.object').
        // O modelo 3D carregado será adicionado como filho deste grupo.
        // É importante porque a cena adicionará este grupo, e o carregamento é assíncrono.
        this.object = new THREE.Group();
        this.object.position.set(0, 0.2, 5); // Garantir que Y seja 0.2 para todas as verificações
        
        // Inicia o carregamento do modelo 3D
        this._loadAirplaneModel();
    }

    /**
     * Cria um modelo de avião simplificado com geometria básica Three.js
     * @returns {THREE.Group} O modelo simplificado
     */
    _createSimpleAirplane() {
        const airplane = new THREE.Group();

        // Fuselagem do avião (corpo principal)
        const bodyGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFD700, // Amarelo (gold)
            metalness: 0.3,
            roughness: 0.4,
            emissive: 0x554400,
            emissiveIntensity: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.z = Math.PI / 2; // Deitar o cilindro horizontalmente
        airplane.add(body);

        // Asas
        const wingGeometry = new THREE.BoxGeometry(0.6, 0.03, 0.2);
        const wingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFD700, // Amarelo (gold)
            metalness: 0.3,
            roughness: 0.4
        });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.y = 0.03;
        airplane.add(wings);

        // Cauda
        const tailGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.03);
        const tailMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFD700, // Amarelo (gold)
            metalness: 0.3,
            roughness: 0.4
        });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.x = -0.25;
        tail.position.y = 0.05;
        airplane.add(tail);
        
        return airplane;
    }

    /**
     * Método privado para carregar o modelo GLTF do avião.
     * @private
     */
    _loadAirplaneModel() {
        const loader = new THREE.GLTFLoader();

        loader.load(
            MODEL_URL,
            // --- Callback de Sucesso ---
            (gltf) => {
                const model = gltf.scene;
                console.log("Modelo de avião carregado:", model);

                // Primeiro, limpe qualquer modelo antigo no grupo
                while (this.object.children.length > 0) {
                    this.object.remove(this.object.children[0]);
                }

                // Processar todos os materiais e procurar a hélice
                model.traverse((child) => {
                    if (child.isMesh) {
                        // Aplicar cor amarela e propriedades metálicas ao tucano
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xFFD700, // Amarelo (gold)
                            metalness: 0.3,
                            roughness: 0.4,
                            emissive: 0x554400,
                            emissiveIntensity: 0.2
                        });
                        
                        // Ativar sombras
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Tentar identificar a hélice pelo nome ou posição
                        if (child.name.toLowerCase().includes('propel') || 
                            child.name.toLowerCase().includes('helic') ||
                            child.name.toLowerCase().includes('rotor')) {
                            console.log("Hélice encontrada:", child.name);
                            this.propeller = child;
                            
                            // Ajustar o ponto de rotação da hélice
                            if (this.propeller.geometry) {
                                // Calcular o centro da geometria
                                this.propeller.geometry.computeBoundingBox();
                                const center = new THREE.Vector3();
                                this.propeller.geometry.boundingBox.getCenter(center);
                                
                                // Ajustar a geometria para que o centro seja o ponto de rotação
                                this.propeller.geometry.translate(-center.x, -center.y, -center.z);
                                this.propeller.position.set(center.x, center.y, center.z);
                                
                                console.log("Ponto de rotação da hélice ajustado");
                            }
                        }
                    }
                });
                
                // Se não encontrou a hélice pelo nome, tentar pelo posicionamento
                if (!this.propeller) {
                    // Procurar na frente do avião (posição z negativa)
                    model.traverse((child) => {
                        if (child.isMesh && child.geometry) {
                            // Calcular centro do objeto
                            const boundingBox = new THREE.Box3().setFromObject(child);
                            const center = new THREE.Vector3();
                            boundingBox.getCenter(center);
                            
                            // Se estiver na frente do avião e for pequeno/fino, provavelmente é a hélice
                            if (center.z < -0.5 * this.currentScale && 
                                boundingBox.max.y - boundingBox.min.y < 0.2 * this.currentScale) {
                                console.log("Hélice identificada pela posição:", child.name);
                                this.propeller = child;
                                
                                // Ajustar o ponto de rotação
                                child.geometry.computeBoundingBox();
                                const helixCenter = new THREE.Vector3();
                                child.geometry.boundingBox.getCenter(helixCenter);
                                
                                // Ajustar a geometria para que o centro seja o ponto de rotação
                                child.geometry.translate(-helixCenter.x, -helixCenter.y, -helixCenter.z);
                                child.position.set(helixCenter.x, helixCenter.y, helixCenter.z);
                                
                                console.log("Ponto de rotação da hélice ajustado");
                            }
                        }
                    });
                }

                // --- Ajustes no Modelo Carregado ---
                // Escala: Ajusta o tamanho geral do modelo
                model.scale.set(this.currentScale, this.currentScale, this.currentScale);

                // Rotação para o modelo de avião:
                // Ajustando a orientação para que o avião fique na direção correta
                model.rotation.y = Math.PI; // Rotaciona 180 graus para ficar virado para frente
                
                // Para o modelo tucano, ajuste de acordo com sua orientação original
                model.rotation.x = 0; // Sem rotação em X inicialmente

                // Adiciona o modelo carregado como filho do grupo 'this.object'
                this.object.add(model);

                console.log("Modelo adicionado ao grupo do jogador.");

                // Chama o callback para sinalizar que o carregamento foi concluído
                if (this.onLoadComplete) {
                    this.onLoadComplete(true); // Passa 'true' para indicar sucesso
                }
            },
            // --- Callback de Progresso (Opcional) ---
            (xhr) => {
                const percentLoaded = (xhr.loaded / xhr.total * 100).toFixed(2);
                console.log(`Carregando avião: ${percentLoaded}%`);
            },
            // --- Callback de Erro ---
            (error) => {
                console.error('Erro ao carregar o modelo do avião:', error);

                this.modelRetries++;
                
                // Tentar o modelo alternativo se for a primeira falha
                if (this.modelRetries === 1) {
                    console.log("Tentando modelo alternativo...");
                    // Tentar carregar o modelo alternativo
                    loader.load(
                        ALTERNATE_MODEL_URL,
                        (gltf) => {
                            const model = gltf.scene;
                            console.log("Modelo alternativo carregado:", model);
                            
                            // Limpar modelos existentes
                            while (this.object.children.length > 0) {
                                this.object.remove(this.object.children[0]);
                            }

                            // Aplicar cor amarela ao modelo alternativo
                            model.traverse((child) => {
                                if (child.isMesh) {
                                    child.material = new THREE.MeshStandardMaterial({
                                        color: 0xFFD700, // Amarelo (gold)
                                        metalness: 0.3,
                                        roughness: 0.4,
                                        emissive: 0x554400,
                                        emissiveIntensity: 0.2
                                    });
                                    
                                    // Ativar sombras
                                    child.castShadow = true;
                                    child.receiveShadow = true;
                                }
                            });

                            // Ajustar tamanho e rotação
                            model.scale.set(this.currentScale, this.currentScale, this.currentScale);
                            model.rotation.y = Math.PI;
                            model.rotation.x = -Math.PI / 2; // O modelo alternativo precisa desta rotação

                            // Adicionar o modelo
                            this.object.add(model);
                            
                            // Chama o callback para sinalizar que o carregamento foi concluído
                            if (this.onLoadComplete) {
                                this.onLoadComplete(true);
                            }
                        },
                        undefined,
                        // Se o modelo alternativo também falhar
                        (secondError) => {
                            console.error("Falha no modelo alternativo também:", secondError);
                            this._createFallbackModel();
                        }
                    );
                } else {
                    // Se já tentamos o modelo alternativo, criar o modelo de fallback
                    this._createFallbackModel();
                }
            }
        );
    }

    /**
     * Cria um modelo de fallback (avião simplificado ou cubo vermelho)
     * @private
     */
    _createFallbackModel() {
        console.warn("Criando um modelo simplificado para o jogador.");
        
        // Limpar modelos existentes
        while (this.object.children.length > 0) {
            this.object.remove(this.object.children[0]);
        }
        
        // Criar um modelo de avião simplificado
        const airplane = this._createSimpleAirplane();
        this.object.add(airplane);
        
        console.log("Modelo simplificado de avião criado e adicionado ao jogador");
        
        // Chama o callback mesmo com o fallback, para que o jogo possa continuar
        if (this.onLoadComplete) {
            this.onLoadComplete(false);
        }
    }

    /**
     * Move o jogador para a esquerda, respeitando os limites do rio.
     */
    moveLeft() {
        // O movimento é aplicado ao GRUPO (this.object)
        this.object.position.x -= this.baseSpeed;
        // Garante que o jogador não saia pela borda esquerda
        this.object.position.x = Math.max(this.object.position.x, -this.riverBoundary);
        
        // Configurar flags para inclinação
        this.isMovingLeft = true;
        this.isMovingRight = false;
        this.targetTilt = -TILT_ANGLE; // Inclinação negativa para a esquerda (invertido)
    }

    /**
     * Move o jogador para a direita, respeitando os limites do rio.
     */
    moveRight() {
        // O movimento é aplicado ao GRUPO (this.object)
        this.object.position.x += this.baseSpeed;
        // Garante que o jogador não saia pela borda direita
        this.object.position.x = Math.min(this.object.position.x, this.riverBoundary);
        
        // Configurar flags para inclinação
        this.isMovingRight = true;
        this.isMovingLeft = false;
        this.targetTilt = TILT_ANGLE; // Inclinação positiva para a direita (invertido)
    }

    /**
     * Retorna a caixa delimitadora (Bounding Box) do objeto do jogador.
     * Útil para detecção de colisão.
     * @returns {THREE.Box3} A caixa delimitadora. Retorna uma caixa vazia se o modelo ainda não carregou.
     */
    getCollisionBox() {
        // Criar uma caixa de colisão ligeiramente menor que o objeto para colisões mais precisas
        const box = new THREE.Box3().setFromObject(this.object);
        
        // Reduzir ligeiramente o tamanho da caixa de colisão
        const size = new THREE.Vector3();
        box.getSize(size);
        
        // Reduzir o tamanho da caixa em 40% para colisões mais precisas (mais do que para inimigos)
        size.multiplyScalar(0.6);
        
        // Recalcular a caixa com tamanho reduzido
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        const reducedBox = new THREE.Box3();
        reducedBox.setFromCenterAndSize(center, size);
        
        return reducedBox;
    }

    // Método auxiliar para visualizar a caixa de colisão (apenas debug)
    showCollisionBox(box) {
        // Remover caixa anterior se existir
        if (this.debugBox) {
            this.object.parent.remove(this.debugBox);
            this.debugBox = null;
        }
        
        // Criar uma caixa visível para debug
        const helper = new THREE.Box3Helper(box, 0x00ff00);
        this.object.parent.add(helper);
        this.debugBox = helper;
    }

    /**
     * Método para atualizar o jogador (animações, movimentos, etc.).
     * @param {number} deltaTime - Tempo desde o último frame.
     */
    update(deltaTime) {
        // Girar a hélice, se existir
        if (this.propeller) {
            // Rotacionar a hélice em torno do seu próprio eixo
            this.propeller.rotateOnAxis(new THREE.Vector3(0, 0, 1), 0.5);
        }
        
        // Se não está se movendo para os lados, retornar à posição normal
        if (!this.isMovingLeft && !this.isMovingRight) {
            this.targetTilt = 0;
        }
        
        // Reset das flags de movimento (serão definidas novamente no próximo frame se necessário)
        this.isMovingLeft = false;
        this.isMovingRight = false;
        
        // Interpolar suavemente para o ângulo de inclinação alvo
        const tiltSpeed = 0.1; // Velocidade de transição da inclinação
        this.currentTilt += (this.targetTilt - this.currentTilt) * tiltSpeed;
        
        // Aplicar a inclinação atual ao modelo
        if (this.object.children.length > 0) {
            // A inclinação é aplicada ao modelo (primeiro filho do grupo)
            const model = this.object.children[0];
            model.rotation.z = this.currentTilt;
        }
    }

    /**
     * Ajusta a escala do modelo do jogador
     * @param {number} scaleFactor - Fator para aumentar (>1) ou diminuir (<1) a escala
     */
    adjustScale(scaleFactor) {
        // Atualiza a escala atual
        this.currentScale *= scaleFactor;
        
        // Limites para evitar que o modelo fique muito grande ou muito pequeno
        this.currentScale = Math.max(0.01, Math.min(0.2, this.currentScale));
        
        // Atualiza a escala do modelo
        if (this.object.children.length > 0) {
            const model = this.object.children[0];
            model.scale.set(this.currentScale, this.currentScale, this.currentScale);
            
            // Recalcula a boundary do rio com base na nova escala
            this.riverBoundary = (this.riverWidth / 2) - (this.currentScale * 1.5);
            
            console.log(`Escala do modelo ajustada para: ${this.currentScale.toFixed(3)}`);
        }
    }

    /**
     * Verifica se o jogador está em uma posição válida para colisões
     * @returns {boolean} True se o jogador estiver em posição válida
     */
    isValidForCollision() {
        return this.active && 
               this.object.visible &&
               Math.abs(this.object.position.x) < this.riverBoundary;
    }
}