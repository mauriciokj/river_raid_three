import * as THREE from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/loaders/GLTFLoader.js';

// --- Constantes para Configuração ---
const MODEL_URL = '/models/player.glb?v=' + Date.now(); // Caminho absoluto a partir da raiz do site com timestamp para evitar cache
const INITIAL_SCALE = 0.01; // Escala ajustada para o modelo de avião
const VERTICAL_OFFSET = 0.3; // Altura ajustada para o avião
const INITIAL_Z_POSITION = 5; // Posição Z inicial (mais para frente na câmera)

export default class Player {
    /**
     * Construtor da classe Player.
     * @param {number} riverWidth - A largura total do rio para calcular os limites.
     * @param {function} [onLoadComplete=null] - Função de callback a ser chamada quando o modelo 3D terminar de carregar (ou falhar).
     */
    constructor(riverWidth, onLoadComplete = null) {
        // Calcula a fronteira X máxima/mínima com base na largura do rio
        // Subtrai um valor (ex: 0.5 ou metade da largura estimada do avião) para margem
        this.riverBoundary = (riverWidth / 2) - (INITIAL_SCALE * 1.5); // Ajuste a margem conforme necessário
        this.baseSpeed = 0.1; // Velocidade de movimento lateral
        this.onLoadComplete = onLoadComplete; // Armazena a função de callback

        // Cria um Grupo THREE.Group VAZIO imediatamente.
        // Este grupo será o objeto principal do jogador ('this.object').
        // O modelo 3D carregado será adicionado como filho deste grupo.
        // É importante porque a cena adicionará este grupo, e o carregamento é assíncrono.
        this.object = new THREE.Group();
        this.object.position.set(0, VERTICAL_OFFSET, INITIAL_Z_POSITION); // Define a posição inicial do GRUPO

        // Inicia o carregamento do modelo 3D
        this._loadAirplaneModel();
    }

    /**
     * Método privado para carregar o modelo GLTF do avião.
     * @private
     */
    _loadAirplaneModel() {
        const loader = new GLTFLoader();

        loader.load(
            MODEL_URL,
            // --- Callback de Sucesso ---
            (gltf) => {
                const model = gltf.scene;
                console.log("Modelo de avião carregado:", model);

                // --- Ajustes no Modelo Carregado ---
                // Escala: Ajusta o tamanho geral do modelo
                model.scale.set(INITIAL_SCALE, INITIAL_SCALE, INITIAL_SCALE);

                // Rotação para o modelo de avião:
                // Ajustando a orientação para que o avião fique na direção correta
                model.rotation.y = Math.PI; // Rotaciona 180 graus para ficar virado para frente
                // Não precisamos rotacionar no eixo X para o modelo de avião

                // Posição (Opcional): Se precisar ajustar a posição *relativa* ao centro do grupo.
                // model.position.set(0, 0, 0); // Geralmente 0,0,0 está ok aqui.

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

                // Opcional: Criar um objeto substituto simples em caso de falha
                console.warn("Criando um objeto substituto (cubo vermelho) para o jogador.");
                const fallbackGeometry = new THREE.BoxGeometry(INITIAL_SCALE * 2, INITIAL_SCALE * 0.5, INITIAL_SCALE * 2.5);
                const fallbackMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x550000 });
                const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
                this.object.add(fallbackMesh); // Adiciona o fallback ao grupo

                // Chama o callback mesmo em caso de erro, para que o jogo possa continuar (talvez com o fallback)
                if (this.onLoadComplete) {
                    this.onLoadComplete(false); // Passa 'false' para indicar falha no carregamento principal
                }
            }
        );
    }

    /**
     * Move o jogador para a esquerda, respeitando os limites do rio.
     */
    moveLeft() {
        // O movimento é aplicado ao GRUPO (this.object)
        this.object.position.x -= this.baseSpeed;
        // Garante que o jogador não saia pela borda esquerda
        this.object.position.x = Math.max(this.object.position.x, -this.riverBoundary);
    }

    /**
     * Move o jogador para a direita, respeitando os limites do rio.
     */
    moveRight() {
        // O movimento é aplicado ao GRUPO (this.object)
        this.object.position.x += this.baseSpeed;
        // Garante que o jogador não saia pela borda direita
        this.object.position.x = Math.min(this.object.position.x, this.riverBoundary);
    }

    /**
     * Retorna a caixa delimitadora (Bounding Box) do objeto do jogador.
     * Útil para detecção de colisão.
     * @returns {THREE.Box3} A caixa delimitadora. Retorna uma caixa vazia se o modelo ainda não carregou.
     */
    getCollisionBox() {
        // Calcula a caixa delimitadora a partir do GRUPO.
        // O método setFromObject considera os filhos do grupo.
        const box = new THREE.Box3();

        // É importante verificar se o grupo tem filhos (o modelo carregado ou o fallback)
        // antes de tentar calcular a caixa, para evitar erros se chamado muito cedo.
        if (this.object.children.length > 0) {
            box.setFromObject(this.object);
        }

        return box;
    }

    /**
     * Método para atualizar o jogador (se necessário no futuro).
     * Pode ser usado para animações internas do jogador, etc.
     * @param {number} deltaTime - Tempo desde o último frame.
     */
    update(deltaTime) {
        // Por enquanto, não faz nada, mas pode ser útil depois.
        // Exemplo: Animar a hélice se o modelo tiver essa parte separada.
    }
}