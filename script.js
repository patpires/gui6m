// Configurações do jogo
const GAME_CONFIG = {
    canvas: {
        width: 800,
        height: 400
    },
    character: {
        width: 60,
        height: 60,
        x: 100, // Personagem fixo horizontalmente para o efeito de "runner"
        jumpHeight: 120,
        jumpSpeed: 8,
        gravity: 0.5
    },
    obstacles: {
        width: 40,
        height: 40,
        speed: 3, // Velocidade horizontal dos obstáculos (da direita para a esquerda)
        spawnRate: 2000,
        fallSpeed: 2 // Nova velocidade de queda dos obstáculos (de cima para baixo)
    },
    // Nomes dos arquivos de cenário atualizados para GIFs
    scenarios: [
        'scenario_1_chapada.gif',
        'scenario_2_deserto.gif',
        'scenario_3_cidade.gif',
        'scenario_4_caverna_tesouro.gif'
    ],
    obstacleImages: [
        'obstacle_1_rock.png',
        'obstacle_2_fruit.png',
        'obstacle_3_lamp.png'
    ]
};

// Variáveis do jogo
let gameState = {
    isRunning: false,
    currentScenario: 0,
    progress: 0,
    lives: 1,
    character: {
        y: 0,
        velocityY: 0,
        isJumping: false,
        onGround: true
    },
    obstacles: [],
    images: {},
    audio: { // Adicionando objetos de áudio
        backgroundMusic: null,
        jumpSound: null,
        collisionSound: null
    },
    isSoundOn: true, // Estado inicial do som (ON por padrão)
    intervals: {
        gameLoop: null,
        obstacleSpawn: null
    }
};

// Elementos DOM
const elements = {
    startScreen: null,
    gamePlayScreen: null,
    gameOverScreen: null,
    startButton: null,
    restartButton: null,
    jumpButton: null,
    canvas: null,
    ctx: null,
    currentScenario: null,
    lifeIndicator: null,
    progressIndicator: null,
    finalMessage: null,
    soundToggleButton: null // Novo elemento para controle de som
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando jogo...');
    initializeElements();
    loadImages();
    loadAudio(); // Nova função para carregar áudio
    setupEventListeners();
    // Esconder a tela de início até que as imagens carreguem
    elements.startScreen.classList.add('hidden');
});

function initializeElements() {
    elements.startScreen = document.getElementById('start-screen');
    elements.gamePlayScreen = document.getElementById('game-play-screen');
    elements.gameOverScreen = document.getElementById('game-over-screen');
    elements.startButton = document.getElementById('start-button');
    elements.restartButton = document.getElementById('restart-button');
    elements.jumpButton = document.getElementById('jump-button');
    elements.canvas = document.getElementById('game-canvas');
    elements.ctx = elements.canvas.getContext('2d');
    elements.currentScenario = document.getElementById('current-scenario');
    elements.lifeIndicator = document.getElementById('life-indicator');
    elements.progressIndicator = document.getElementById('progress-indicator');
    elements.finalMessage = document.getElementById('final-message');
    elements.soundToggleButton = document.getElementById('sound-toggle-button'); // Captura o novo botão de som
    
    // Ajustar tamanho do canvas
    elements.canvas.width = GAME_CONFIG.canvas.width;
    elements.canvas.height = GAME_CONFIG.canvas.height;

    console.log('Elementos DOM inicializados');
}

function loadImages() {
    console.log('Carregando imagens...');
    let loadedCount = 0;
    const totalImages = 1 + GAME_CONFIG.scenarios.length + GAME_CONFIG.obstacleImages.length;
    
    function onImageLoad() {
        loadedCount++;
        console.log(`Imagem carregada: ${loadedCount}/${totalImages}`);
        if (loadedCount === totalImages) {
            console.log('Todas as imagens carregadas!');
            elements.startScreen.classList.remove('hidden'); // Mostra a tela de início quando tudo estiver carregado
            updateUI(); // Atualiza o texto do botão de som
        }
    }
    
    function onImageError(src) {
        console.error(`Erro ao carregar imagem: ${src}`);
        loadedCount++; // Ainda conta como carregada para não travar o carregamento
        if (loadedCount === totalImages) {
             elements.startScreen.classList.remove('hidden');
             updateUI();
        }
    }
    
    // Carregar personagem
    gameState.images.character = new Image();
    gameState.images.character.onload = onImageLoad;
    gameState.images.character.onerror = () => onImageError('character_toy.png');
    gameState.images.character.src = 'character_toy.png';
    
    // Carregar cenários (agora como GIFs)
    gameState.images.scenarios = [];
    GAME_CONFIG.scenarios.forEach((scenarioFile, index) => {
        const img = new Image();
        img.onload = onImageLoad;
        img.onerror = () => onImageError(scenarioFile);
        img.src = scenarioFile;
        gameState.images.scenarios[index] = img;
    });
    
    // Carregar obstáculos
    gameState.images.obstacles = [];
    GAME_CONFIG.obstacleImages.forEach((obstacleFile, index) => {
        const img = new Image();
        img.onload = onImageLoad;
        img.onerror = () => onImageError(obstacleFile);
        img.src = obstacleFile;
        gameState.images.obstacles[index] = img;
    });
    // Se não houver imagens para carregar (caso de teste), mostrar tela inicial imediatamente
    if (totalImages === 0) {
        elements.startScreen.classList.remove('hidden');
        updateUI();
    }
}

function loadAudio() {
    // Música de fundo (loop)
    // OBS: Você precisará fornecer um arquivo 'background_music.mp3'
    gameState.audio.backgroundMusic = new Audio('background_music.mp3'); 
    gameState.audio.backgroundMusic.loop = true;
    gameState.audio.backgroundMusic.volume = 0.5;

    // Efeito sonoro de pulo
    // OBS: Você precisará fornecer um arquivo 'jump_sound.mp3'
    gameState.audio.jumpSound = new Audio('jump_sound.mp3'); 
    gameState.audio.jumpSound.volume = 0.7;

    // Efeito sonoro de colisão/game over
    // OBS: Você precisará fornecer um arquivo 'collision_sound.mp3'
    gameState.audio.collisionSound = new Audio('collision_sound.mp3'); 
    gameState.audio.collisionSound.volume = 0.8;

    console.log('Áudios carregados.');
}

function setupEventListeners() {
    elements.startButton.addEventListener('click', startGame);
    elements.restartButton.addEventListener('click', restartGame);
    elements.jumpButton.addEventListener('click', jump);
    elements.soundToggleButton.addEventListener('click', toggleSound); // Event listener para o botão de som
    
    // Controles de teclado
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && gameState.isRunning) {
            event.preventDefault(); // Impede que a barra de espaço role a página
            jump();
        }
    });
    
    // Controles de toque no canvas (para dispositivos móveis)
    elements.canvas.addEventListener('touchstart', (event) => {
        if (gameState.isRunning) {
            event.preventDefault(); // Impede o comportamento padrão do toque
            jump();
        }
    });
    
    console.log('Event listeners configurados');
}

function toggleSound() {
    gameState.isSoundOn = !gameState.isSoundOn;
    if (gameState.isSoundOn) {
        elements.soundToggleButton.textContent = '🔊 Som: ON';
        if (gameState.isRunning) { // Se o jogo estiver rodando, ligar a música
            gameState.audio.backgroundMusic.play().catch(e => console.error("Erro ao tocar música:", e));
        }
    } else {
        elements.soundToggleButton.textContent = '🔇 Som: OFF';
        gameState.audio.backgroundMusic.pause();
        gameState.audio.jumpSound.pause(); // Parar sons que podem estar tocando
        gameState.audio.collisionSound.pause();
    }
    console.log('Som:', gameState.isSoundOn ? 'ON' : 'OFF');
}

function startGame() {
    console.log('Iniciando jogo...');
    
    // Reset do estado do jogo
    gameState.isRunning = true;
    gameState.currentScenario = 0;
    gameState.progress = 0;
    gameState.lives = 1; 
    gameState.character.y = 0;
    gameState.character.velocityY = 0;
    gameState.character.isJumping = false;
    gameState.character.onGround = true;
    gameState.obstacles = [];
    
    // Mudança de tela
    elements.startScreen.classList.add('hidden');
    elements.gameOverScreen.classList.add('hidden');
    elements.gamePlayScreen.classList.remove('hidden');
    
    // Iniciar música de fundo se o som estiver ligado
    if (gameState.isSoundOn) {
        gameState.audio.backgroundMusic.currentTime = 0; // Reinicia a música
        gameState.audio.backgroundMusic.play().catch(e => console.error("Erro ao tocar música:", e));
    }

    // Atualizar UI
    updateUI();
    
    // Iniciar loops do jogo
    gameState.intervals.gameLoop = setInterval(gameLoop, 1000/60); // 60 FPS
    gameState.intervals.obstacleSpawn = setInterval(spawnObstacle, GAME_CONFIG.obstacles.spawnRate);
    
    console.log('Jogo iniciado!');
}

function gameLoop() {
    if (!gameState.isRunning) return;
    
    updateCharacter();
    updateObstacles();
    checkCollisions();
    updateProgress();
    render();
}

function updateCharacter() {
    const char = gameState.character;
    const groundY = 0; // O 'y' do personagem é a distância *acima* do chão
    
    if (char.isJumping) {
        char.velocityY -= GAME_CONFIG.character.gravity;
        char.y += char.velocityY;
        
        // Se o personagem desceu abaixo do chão (y <= 0 na nossa lógica)
        if (char.y <= groundY) {
            char.y = groundY; // Trava no chão
            char.velocityY = 0; // Zera velocidade
            char.isJumping = false; // Não está mais pulando
            char.onGround = true; // Está no chão
        }
    } else {
        // Aplica gravidade se o personagem não estiver pulando e não estiver no chão
        if (!char.onGround) {
            char.velocityY -= GAME_CONFIG.character.gravity;
            char.y += char.velocityY;
            if (char.y <= groundY) {
                char.y = groundY;
                char.velocityY = 0;
                char.onGround = true;
            }
        }
    }
}

function updateObstacles() {
    gameState.obstacles.forEach((obstacle, index) => {
        // Movimento horizontal (direita para esquerda)
        obstacle.x -= GAME_CONFIG.obstacles.speed;
        // Movimento vertical (cair de cima para baixo)
        obstacle.y += GAME_CONFIG.obstacles.fallSpeed;
        
        // Remove obstáculos que saíram da tela (horizontalmente ou verticalmente)
        if (obstacle.x + GAME_CONFIG.obstacles.width < 0 || obstacle.y > GAME_CONFIG.canvas.height) {
            gameState.obstacles.splice(index, 1);
        }
    });
}

function checkCollisions() {
    const charX = GAME_CONFIG.character.x;
    const charWidth = GAME_CONFIG.character.width;
    const charHeight = GAME_CONFIG.character.height;
    
    // charYCanvas é a posição vertical ABSOLUTA do topo do personagem no canvas
    // visualGroundY é a base visual do chão no canvas, onde o personagem "pousa"
    const visualGroundY = GAME_CONFIG.canvas.height - GAME_CONFIG.character.height - 50; 
    const charYCanvas = visualGroundY - gameState.character.y; // Posição Y real do topo do personagem no canvas

    gameState.obstacles.forEach(obstacle => {
        // Verificação de colisão
        if (charX < obstacle.x + GAME_CONFIG.obstacles.width &&
            charX + charWidth > obstacle.x &&
            charYCanvas < obstacle.y + GAME_CONFIG.obstacles.height && // Obstáculo está caindo (Y aumenta)
            charYCanvas + charHeight > obstacle.y) {
            
            // Colisão detectada!
            if (gameState.isRunning) { // Evita múltiplas chamadas de endGame por colisão contínua
                endGame('Game Over! Você colidiu com um obstáculo.');
                if (gameState.isSoundOn) {
                    gameState.audio.collisionSound.play().catch(e => console.error("Erro ao tocar som de colisão:", e));
                }
            }
        }
    });
}

function updateProgress() {
    gameState.progress += 0.2; // Aumenta progresso gradualmente
    
    // Se o progresso atingir 100%, avança para o próximo cenário
    if (gameState.progress >= 100) {
        gameState.currentScenario++;
        gameState.progress = 0; // Zera progresso para o novo cenário
        
        // Se todos os cenários foram completados
        if (gameState.currentScenario >= GAME_CONFIG.scenarios.length) {
            endGame('Parabéns! Você encontrou o tesouro na Chapada Diamantina!');
            return;
        }
        
        // Aumentar dificuldade ao mudar de cenário
        GAME_CONFIG.obstacles.speed += 0.5; // Aumenta velocidade horizontal dos obstáculos
        // Garante que o spawnRate não fique muito baixo (min 1000ms) para não gerar obstáculos demais
        GAME_CONFIG.obstacles.spawnRate = Math.max(1000, GAME_CONFIG.obstacles.spawnRate - 200);
        GAME_CONFIG.obstacles.fallSpeed += 0.2; // Aumenta velocidade de queda dos obstáculos

        // Reinicia o intervalo de spawn de obstáculos com a nova taxa de spawn
        clearInterval(gameState.intervals.obstacleSpawn);
        gameState.intervals.obstacleSpawn = setInterval(spawnObstacle, GAME_CONFIG.obstacles.spawnRate);
    }
    
    updateUI();
}

function spawnObstacle() {
    if (!gameState.isRunning) return;
    
    const obstacle = {
        x: GAME_CONFIG.canvas.width, // Obstáculo começa na borda direita do canvas
        y: -GAME_CONFIG.obstacles.height, // Obstáculo começa acima do canvas para cair
        imageIndex: Math.floor(Math.random() * GAME_CONFIG.obstacleImages.length)
    };
    
    gameState.obstacles.push(obstacle);
}

function jump() {
    if (gameState.character.onGround && gameState.isRunning) {
        gameState.character.isJumping = true;
        gameState.character.onGround = false;
        gameState.character.velocityY = GAME_CONFIG.character.jumpSpeed;
        if (gameState.isSoundOn) {
            gameState.audio.jumpSound.currentTime = 0; // Reinicia o som para tocar novamente imediatamente
            gameState.audio.jumpSound.play().catch(e => console.error("Erro ao tocar som de pulo:", e));
        }
        console.log('Personagem pulou!');
    }
}

function render() {
    const ctx = elements.ctx;
    const canvas = elements.canvas;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar cenário de fundo (GIFs agora)
    if (gameState.images.scenarios[gameState.currentScenario]) {
        ctx.drawImage(gameState.images.scenarios[gameState.currentScenario], 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback: gradiente de fundo se a imagem não carregar ou não existir
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Desenhar personagem
    const charX = GAME_CONFIG.character.x;
    // Posição Y visual do chão (base do personagem)
    const visualGroundY = GAME_CONFIG.canvas.height - GAME_CONFIG.character.height - 50; 
    // Posição Y real no canvas (topo do personagem)
    const charYCanvas = visualGroundY - gameState.character.y;
    
    if (gameState.images.character && gameState.images.character.complete) {
        ctx.drawImage(gameState.images.character, charX, charYCanvas, GAME_CONFIG.character.width, GAME_CONFIG.character.height);
    } else {
        // Fallback: retângulo colorido para personagem
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(charX, charYCanvas, GAME_CONFIG.character.width, GAME_CONFIG.character.height);
    }
    
    // Desenhar obstáculos
    gameState.obstacles.forEach(obstacle => {
        const obstacleImg = gameState.images.obstacles[obstacle.imageIndex];
        if (obstacleImg && obstacleImg.complete) {
            ctx.drawImage(obstacleImg, obstacle.x, obstacle.y, GAME_CONFIG.obstacles.width, GAME_CONFIG.obstacles.height);
        } else {
            // Fallback: retângulo colorido para obstáculo
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(obstacle.x, obstacle.y, GAME_CONFIG.obstacles.width, GAME_CONFIG.obstacles.height);
        }
    });
}

function updateUI() {
    const scenarioNames = [
        'Cenário 1: Chapada Diamantina',
        'Cenário 2: Deserto Árabe', 
        'Cenário 3: Cidade Mágica',
        'Cenário 4: Caverna do Tesouro'
    ];
    
    elements.currentScenario.textContent = scenarioNames[gameState.currentScenario] || 'Cenário Desconhecido';
    elements.lifeIndicator.textContent = `❤️ Vida: ${gameState.lives}`;
    elements.progressIndicator.textContent = `Progresso: ${Math.floor(gameState.progress)}%`;
    // Atualizar texto do botão de som na UI inicial
    elements.soundToggleButton.textContent = gameState.isSoundOn ? '🔊 Som: ON' : '🔇 Som: OFF';
}

function endGame(message) {
    console.log('Fim de jogo:', message);
    
    gameState.isRunning = false;
    
    // Parar música de fundo
    if (gameState.isSoundOn) {
        gameState.audio.backgroundMusic.pause();
        gameState.audio.backgroundMusic.currentTime = 0; // Reinicia a música para a próxima partida
    }
    
    // Limpar intervalos
    if (gameState.intervals.gameLoop) {
        clearInterval(gameState.intervals.gameLoop);
        gameState.intervals.gameLoop = null;
    }
    if (gameState.intervals.obstacleSpawn) {
        clearInterval(gameState.intervals.obstacleSpawn);
        gameState.intervals.obstacleSpawn = null;
    }
    
    // Mostrar tela de game over
    elements.finalMessage.textContent = message;
    elements.gamePlayScreen.classList.add('hidden');
    elements.gameOverScreen.classList.remove('hidden');
}

function restartGame() {
    console.log('Reiniciando jogo...');
    
    // Resetar configurações de dificuldade para o início
    GAME_CONFIG.obstacles.speed = 3;
    GAME_CONFIG.obstacles.spawnRate = 2000;
    GAME_CONFIG.obstacles.fallSpeed = 2; // Resetar velocidade de queda
    
    startGame();
}
