// ConfiguraÃ§Ãµes do jogo
const GAME_CONFIG = {
    canvas: {
        width: 800,
        height: 400
    },
    character: {
        width: 60,
        height: 60,
        x: 100,
        jumpHeight: 120,
        jumpSpeed: 8,
        gravity: 0.5
    },
    obstacles: {
        width: 40,
        height: 40,
        speed: 3,
        spawnRate: 2000
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

// VariÃ¡veis do jogo
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
    finalMessage: null
};

// InicializaÃ§Ã£o
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando jogo...');
    initializeElements();
    loadImages();
    setupEventListeners();
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
        }
    }
    
    function onImageError(src) {
        console.error(`Erro ao carregar imagem: ${src}`);
        loadedCount++;
    }
    
    // Carregar personagem
    gameState.images.character = new Image();
    gameState.images.character.onload = onImageLoad;
    gameState.images.character.onerror = () => onImageError('character_toy.png');
    gameState.images.character.src = 'character_toy.png';
    
    // Carregar cenÃ¡rios
    gameState.images.scenarios = [];
    GAME_CONFIG.scenarios.forEach((scenarioFile, index) => {
        const img = new Image();
        img.onload = onImageLoad;
        img.onerror = () => onImageError(scenarioFile);
        img.src = scenarioFile;
        gameState.images.scenarios[index] = img;
    });
    
    // Carregar obstÃ¡culos
    gameState.images.obstacles = [];
    GAME_CONFIG.obstacleImages.forEach((obstacleFile, index) => {
        const img = new Image();
        img.onload = onImageLoad;
        img.onerror = () => onImageError(obstacleFile);
        img.src = obstacleFile;
        gameState.images.obstacles[index] = img;
    });
}

function setupEventListeners() {
    elements.startButton.addEventListener('click', startGame);
    elements.restartButton.addEventListener('click', restartGame);
    elements.jumpButton.addEventListener('click', jump);
    
    // Controles de teclado
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && gameState.isRunning) {
            event.preventDefault();
            jump();
        }
    });
    
    // Controles de toque
    elements.canvas.addEventListener('touchstart', (event) => {
        if (gameState.isRunning) {
            event.preventDefault();
            jump();
        }
    });
    
    console.log('Event listeners configurados');
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
    
    // MudanÃ§a de tela
    elements.startScreen.classList.add('hidden');
    elements.gameOverScreen.classList.add('hidden');
    elements.gamePlayScreen.classList.remove('hidden');
    
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
    const groundY = GAME_CONFIG.canvas.height - GAME_CONFIG.character.height - 50;
    
    if (char.isJumping) {
        char.velocityY -= GAME_CONFIG.character.gravity;
        char.y -= char.velocityY;
        
        if (char.y >= groundY) {
            char.y = groundY;
            char.velocityY = 0;
            char.isJumping = false;
            char.onGround = true;
        }
    } else {
        char.y = groundY;
    }
}

function updateObstacles() {
    gameState.obstacles.forEach((obstacle, index) => {
        obstacle.x -= GAME_CONFIG.obstacles.speed;
        
        // Remove obstÃ¡culos que saÃ­ram da tela
        if (obstacle.x + GAME_CONFIG.obstacles.width < 0) {
            gameState.obstacles.splice(index, 1);
        }
    });
}

function checkCollisions() {
    const charX = GAME_CONFIG.character.x;
    const charY = GAME_CONFIG.canvas.height - GAME_CONFIG.character.height - 50 - gameState.character.y;
    const charWidth = GAME_CONFIG.character.width;
    const charHeight = GAME_CONFIG.character.height;
    
    gameState.obstacles.forEach(obstacle => {
        if (charX < obstacle.x + GAME_CONFIG.obstacles.width &&
            charX + charWidth > obstacle.x &&
            charY < obstacle.y + GAME_CONFIG.obstacles.height &&
            charY + charHeight > obstacle.y) {
            
            endGame('Game Over! VocÃª colidiu com um obstÃ¡culo.');
        }
    });
}

function updateProgress() {
    gameState.progress += 0.2;
    
    if (gameState.progress >= 100) {
        gameState.currentScenario++;
        gameState.progress = 0;
        
        if (gameState.currentScenario >= GAME_CONFIG.scenarios.length) {
            endGame('ParabÃ©ns! VocÃª encontrou o tesouro na Chapada Diamantina!');
            return;
        }
        
        // Aumentar dificuldade
        GAME_CONFIG.obstacles.speed += 0.5;
        GAME_CONFIG.obstacles.spawnRate = Math.max(1000, GAME_CONFIG.obstacles.spawnRate - 200);
        
        clearInterval(gameState.intervals.obstacleSpawn);
        gameState.intervals.obstacleSpawn = setInterval(spawnObstacle, GAME_CONFIG.obstacles.spawnRate);
    }
    
    updateUI();
}

function spawnObstacle() {
    if (!gameState.isRunning) return;
    
    const obstacle = {
        x: GAME_CONFIG.canvas.width,
        y: Math.random() * (GAME_CONFIG.canvas.height - 150) + 50,
        imageIndex: Math.floor(Math.random() * GAME_CONFIG.obstacleImages.length)
    };
    
    gameState.obstacles.push(obstacle);
}

function jump() {
    if (gameState.character.onGround && gameState.isRunning) {
        gameState.character.isJumping = true;
        gameState.character.onGround = false;
        gameState.character.velocityY = GAME_CONFIG.character.jumpSpeed;
        console.log('Personagem pulou!');
    }
}

function render() {
    const ctx = elements.ctx;
    const canvas = elements.canvas;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar cenÃ¡rio de fundo
    if (gameState.images.scenarios[gameState.currentScenario]) {
        ctx.drawImage(gameState.images.scenarios[gameState.currentScenario], 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback: gradiente de fundo
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Desenhar personagem
    const charX = GAME_CONFIG.character.x;
    const charY = canvas.height - GAME_CONFIG.character.height - 50 - gameState.character.y;
    
    if (gameState.images.character && gameState.images.character.complete) {
        ctx.drawImage(gameState.images.character, charX, charY, GAME_CONFIG.character.width, GAME_CONFIG.character.height);
    } else {
        // Fallback: retÃ¢ngulo colorido
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(charX, charY, GAME_CONFIG.character.width, GAME_CONFIG.character.height);
    }
    
    // Desenhar obstÃ¡culos
    gameState.obstacles.forEach(obstacle => {
        const obstacleImg = gameState.images.obstacles[obstacle.imageIndex];
        if (obstacleImg && obstacleImg.complete) {
            ctx.drawImage(obstacleImg, obstacle.x, obstacle.y, GAME_CONFIG.obstacles.width, GAME_CONFIG.obstacles.height);
        } else {
            // Fallback: retÃ¢ngulo colorido
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(obstacle.x, obstacle.y, GAME_CONFIG.obstacles.width, GAME_CONFIG.obstacles.height);
        }
    });
}

function updateUI() {
    const scenarioNames = [
        'CenÃ¡rio 1: Chapada Diamantina',
        'CenÃ¡rio 2: Deserto Ãrabe', 
        'CenÃ¡rio 3: Cidade MÃ¡gica',
        'CenÃ¡rio 4: Caverna do Tesouro'
    ];
    
    elements.currentScenario.textContent = scenarioNames[gameState.currentScenario] || 'CenÃ¡rio Desconhecido';
    elements.lifeIndicator.textContent = `â¤ï¸ Vida: ${gameState.lives}`;
    elements.progressIndicator.textContent = `Progresso: ${Math.floor(gameState.progress)}%`;
}

function endGame(message) {
    console.log('Fim de jogo:', message);
    
    gameState.isRunning = false;
    
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
    
    // Reset das configuraÃ§Ãµes
    GAME_CONFIG.obstacles.speed = 3;
    GAME_CONFIG.obstacles.spawnRate = 2000;
    
    startGame();
}
