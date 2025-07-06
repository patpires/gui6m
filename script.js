// Configurações do jogo
const GAME_CONFIG = {
    canvas: {
        width: 800,
        height: 400
    },
    character: {
        width: 60,
        height: 60,
        x: 100, // Posição horizontal fixa do jogador
        jumpHeight: 120,
        jumpSpeed: 8,
        gravity: 0.5
    },
    obstacles: {
        width: 40,
        height: 40,
        speed: 3, // Velocidade horizontal dos obstáculos (direita para esquerda)
        spawnRate: 2000,
        fallSpeed: 2 // Velocidade vertical (de cima para baixo)
    },
    scenarios: [
        'scenario_1_chapada.png',
        'scenario_2_deserto.png',
        'scenario_3_cidade.png',
        'scenario_4_caverna_tesouro.png'
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
    audio: {
        backgroundMusic: null,
        jumpSound: null,
        collisionSound: null
    },
    isSoundOn: true,
    intervals: {
        gameLoop: null,
        obstacleSpawn: null
    }
};

// Elementos do DOM
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
    soundToggleButton: null
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    loadImages();
    loadAudio();
    setupEventListeners();
    elements.startScreen.classList.add('hidden');
});

// Função para inicializar elementos do DOM
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
    elements.soundToggleButton = document.getElementById('sound-toggle-button');

    elements.canvas.width = GAME_CONFIG.canvas.width;
    elements.canvas.height = GAME_CONFIG.canvas.height;
}

// Função para carregar imagens
function loadImages() {
    let loadedCount = 0;
    const totalImages = 1 + GAME_CONFIG.scenarios.length + GAME_CONFIG.obstacleImages.length;

    function onImageLoad() {
        loadedCount++;
        if (loadedCount === totalImages) {
            elements.startScreen.classList.remove('hidden');
        }
    }

    function onImageError(src) {
        console.error(`Erro ao carregar imagem: ${src}`);
        loadedCount++;
        if (loadedCount === totalImages) {
            elements.startScreen.classList.remove('hidden');
        }
    }

    gameState.images.character = new Image();
    gameState.images.character.onload = onImageLoad;
    gameState.images.character.onerror = () => onImageError('character_toy.png');
    gameState.images.character.src = 'character_toy.png';

    gameState.images.scenarios = [];
    GAME_CONFIG.scenarios.forEach((scenarioFile, index) => {
        const img = new Image();
        img.onload = onImageLoad;
        img.onerror = () => onImageError(scenarioFile);
        img.src = scenarioFile;
        gameState.images.scenarios[index] = img;
    });

    gameState.images.obstacles = [];
    GAME_CONFIG.obstacleImages.forEach((obstacleFile, index) => {
        const img = new Image();
        img.onload = onImageLoad;
        img.onerror = () => onImageError(obstacleFile);
        img.src = obstacleFile;
        gameState.images.obstacles[index] = img;
    });
}

// Função para carregar áudio
function loadAudio() {
    gameState.audio.backgroundMusic = new Audio('background_music.mp3');
    gameState.audio.backgroundMusic.loop = true;
    gameState.audio.backgroundMusic.volume = 0.5;

    gameState.audio.jumpSound = new Audio('jump_sound.mp3');
    gameState.audio.jumpSound.volume = 0.7;

    gameState.audio.collisionSound = new Audio('collision_sound.mp3');
    gameState.audio.collisionSound.volume = 0.8;
}

// Configurar eventos
function setupEventListeners() {
    elements.startButton.addEventListener('click', startGame);
    elements.restartButton.addEventListener('click', restartGame);
    elements.jumpButton.addEventListener('click', jump);
    elements.soundToggleButton.addEventListener('click', toggleSound);

    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && gameState.isRunning) {
            event.preventDefault();
            jump();
        }
    });
}

// Alternar som
function toggleSound() {
    gameState.isSoundOn = !gameState.isSoundOn;
    elements.soundToggleButton.textContent = gameState.isSoundOn ? '🔊 Som: ON' : '🔇 Som: OFF';
    if (gameState.isSoundOn) {
        gameState.audio.backgroundMusic.play();
    } else {
        gameState.audio.backgroundMusic.pause();
    }
}

// Iniciar o jogo
function startGame() {
    gameState.isRunning = true;
    gameState.lives = 1;
    gameState.progress = 0;
    gameState.character.y = 0;
    gameState.character.velocityY = 0;
    elements.startScreen.classList.add('hidden');
    elements.gamePlayScreen.classList.remove('hidden');

    if (gameState.isSoundOn) {
        gameState.audio.backgroundMusic.currentTime = 0;
        gameState.audio.backgroundMusic.play();
    }

    gameState.intervals.gameLoop = setInterval(gameLoop, 1000 / 60);
    gameState.intervals.obstacleSpawn = setInterval(spawnObstacle, GAME_CONFIG.obstacles.spawnRate);
}

// Função do loop principal do jogo
function gameLoop() {
    if (!gameState.isRunning) return;

    updateObstacles();
    checkCollisions();
    render();
}

// Atualizar os obstáculos
function updateObstacles() {
    gameState.obstacles.forEach((obstacle, index) => {
        obstacle.x -= GAME_CONFIG.obstacles.speed;
        obstacle.y += GAME_CONFIG.obstacles.fallSpeed;

        if (obstacle.x + GAME_CONFIG.obstacles.width < 0 || obstacle.y > GAME_CONFIG.canvas.height) {
            gameState.obstacles.splice(index, 1);
        }
    });
}

// Verificar colisões
function checkCollisions() {
    const charX = GAME_CONFIG.character.x;
    const charWidth = GAME_CONFIG.character.width;
    const charYCanvas = GAME_CONFIG.canvas.height - GAME_CONFIG.character.height - gameState.character.y;

    gameState.obstacles.forEach((obstacle) => {
        if (
            charX < obstacle.x + GAME_CONFIG.obstacles.width &&
            charX + charWidth > obstacle.x &&
            charYCanvas < obstacle.y + GAME_CONFIG.obstacles.height
        ) {
            endGame('Você foi atingido por um obstáculo!');
        }
    });
}

// Renderizar elementos no canvas
function render() {
    const ctx = elements.ctx;
    ctx.clearRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);

    const scenarioImage = gameState.images.scenarios[gameState.currentScenario];
    if (scenarioImage && scenarioImage.complete) {
        ctx.drawImage(scenarioImage, 0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);
    }

    const charYCanvas = GAME_CONFIG.canvas.height - GAME_CONFIG.character.height - gameState.character.y;
    const characterImage = gameState.images.character;
    ctx.drawImage(characterImage, GAME_CONFIG.character.x, charYCanvas, GAME_CONFIG.character.width, GAME_CONFIG.character.height);

    gameState.obstacles.forEach((obstacle) => {
        const obstacleImage = gameState.images.obstacles[obstacle.imageIndex];
        ctx.drawImage(obstacleImage, obstacle.x, obstacle.y, GAME_CONFIG.obstacles.width, GAME_CONFIG.obstacles.height);
    });
}

// Finalizar o jogo
function endGame(message) {
    gameState.isRunning = false;
    gameState.audio.backgroundMusic.pause();

    clearInterval(gameState.intervals.gameLoop);
    clearInterval(gameState.intervals.obstacleSpawn);

    elements.finalMessage.textContent = message;
    elements.gameOverScreen.classList.remove('hidden');
    elements.gamePlayScreen.classList.add('hidden');
}

// Reiniciar o jogo
function restartGame() {
    startGame();
}
