// Configurações do jogo
const GAME_CONFIG = {
    canvas: {
        width: 800,
        height: 400
    },
    character: {
        width: 60,
        height: 60,
        x: 100,
        jumpHeight: 180, // Aumentado de 120 para 180
        jumpSpeed: 10,   // Reduzido de 12 para 10 (pulo mais controlado)
        gravity: 0.4     // Reduzido de 0.6 para 0.4 (descida mais lenta)
    },
    obstacles: {
        width: 40,
        height: 40,
        speed: 2.5,      // Reduzido de 3 para 2.5
        spawnRate: 2500, // Aumentado de 1500 para 2500 (menos frequente)
        groundLevelChance: 0.5 // Reduzido de 0.7 para 0.5 (50% dos obstáculos na altura do jogador)
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
    jumpCount: 0,        // Contador de saltos no cenário atual
    totalJumps: 0,       // Contador total de saltos
    lastJumpTime: 0,     // Tempo do último salto
    gameStartTime: 0,    // Tempo de início do jogo
    soundEnabled: true,  // Controle de som
    character: {
        y: 0,
        velocityY: 0,
        isJumping: false,
        onGround: true
    },
    obstacles: [],
    images: {},
    sounds: {
        background: null,
        jump: null,
        collision: null,
        victory: null
    },
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
    soundToggle: null,
    canvas: null,
    ctx: null,
    currentScenario: null,
    lifeIndicator: null,
    progressIndicator: null,
    jumpIndicator: null,
    finalMessage: null
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando jogo...');
    initializeElements();
    loadImages();
    loadSounds();
    setupEventListeners();
});

function initializeElements() {
    elements.startScreen = document.getElementById('startScreen');
    elements.gamePlayScreen = document.getElementById('gamePlayScreen');
    elements.gameOverScreen = document.getElementById('gameOverScreen');
    elements.startButton = document.getElementById('startButton');
    elements.restartButton = document.getElementById('restartButton');
    elements.jumpButton = document.getElementById('jumpButton');
    elements.soundToggle = document.getElementById('soundToggle');
    elements.canvas = document.getElementById('gameCanvas');
    elements.ctx = elements.canvas.getContext('2d');
    elements.currentScenario = document.getElementById('scenarioName');
    elements.lifeIndicator = document.getElementById('lifeCounter');
    elements.progressIndicator = document.getElementById('progressCounter');
    elements.jumpIndicator = document.getElementById('jumpCounter');
    elements.finalMessage = document.getElementById('gameOverMessage');
    
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
    
    // Carregar cenários
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
}

function loadSounds() {
    console.log('Carregando sons...');
    
    // Som de fundo
    gameState.sounds.background = new Audio('back.mp3');
    gameState.sounds.background.loop = true;
    gameState.sounds.background.volume = 0.3;
    
    // Som de pulo
    gameState.sounds.jump = new Audio('pula.mp3');
    gameState.sounds.jump.volume = 0.5;
    
    // Som de colisão
    gameState.sounds.collision = new Audio('colide.mp3');
    gameState.sounds.collision.volume = 0.7;
    
    // Som de vitória
    gameState.sounds.victory = new Audio('venceu.mp3');
    gameState.sounds.victory.volume = 0.8;
    
    console.log('Sons carregados');
}

function playSound(soundName) {
    if (!gameState.soundEnabled || !gameState.sounds[soundName]) return;
    
    try {
        gameState.sounds[soundName].currentTime = 0;
        gameState.sounds[soundName].play().catch(e => {
            console.log(`Erro ao reproduzir som ${soundName}:`, e);
        });
    } catch (error) {
        console.log(`Erro ao reproduzir som ${soundName}:`, error);
    }
}

function stopSound(soundName) {
    if (!gameState.sounds[soundName]) return;
    
    try {
        gameState.sounds[soundName].pause();
        gameState.sounds[soundName].currentTime = 0;
    } catch (error) {
        console.log(`Erro ao parar som ${soundName}:`, error);
    }
}

function setupEventListeners() {
    elements.startButton.addEventListener('click', startGame);
    elements.restartButton.addEventListener('click', restartGame);
    elements.jumpButton.addEventListener('click', jump);
    elements.soundToggle.addEventListener('click', toggleSound);
    
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
    gameState.jumpCount = 0;
    gameState.totalJumps = 0;
    gameState.gameStartTime = Date.now();
    gameState.lastJumpTime = Date.now();
    gameState.character.y = 0;
    gameState.character.velocityY = 0;
    gameState.character.isJumping = false;
    gameState.character.onGround = true;
    gameState.obstacles = [];
    
    // Iniciar som de fundo
    playSound('background');
    
    // Mudança de tela
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
    const groundY = 0; // No chão, y = 0
    const maxHeight = 200; // Altura máxima que o personagem pode alcançar
    
    if (char.isJumping || char.velocityY > 0) {
        // Aplicar gravidade
        char.velocityY -= GAME_CONFIG.character.gravity;
        // Atualizar posição
        char.y += char.velocityY;
        
        // Verificar se atingiu o teto
        if (char.y >= maxHeight) {
            char.y = maxHeight;
            char.velocityY = 0; // Para o movimento para cima
        }
        
        // Verificar se tocou o chão
        if (char.y <= groundY) {
            char.y = groundY;
            char.velocityY = 0;
            char.isJumping = false;
            char.onGround = true;
        }
    } else {
        // Garantir que está no chão quando não está pulando
        char.y = groundY;
        char.onGround = true;
    }
    
    console.log(`Personagem - X: ${GAME_CONFIG.character.x}, Y: ${GAME_CONFIG.canvas.height - GAME_CONFIG.character.height - 50 - char.y}, gameState.character.y: ${char.y}, velocityY: ${char.velocityY}, isJumping: ${char.isJumping}`);
}

function updateObstacles() {
    gameState.obstacles.forEach((obstacle, index) => {
        obstacle.x -= GAME_CONFIG.obstacles.speed;
        
        // Remove obstáculos que saíram da tela
        if (obstacle.x + GAME_CONFIG.obstacles.width < 0) {
            gameState.obstacles.splice(index, 1);
        }
    });
}

function checkCollisions() {
    const charX = GAME_CONFIG.character.x;
    const groundY = GAME_CONFIG.canvas.height - GAME_CONFIG.character.height - 50;
    const charY = groundY - gameState.character.y;
    const charWidth = GAME_CONFIG.character.width;
    const charHeight = GAME_CONFIG.character.height;
    
    gameState.obstacles.forEach(obstacle => {
        if (charX < obstacle.x + GAME_CONFIG.obstacles.width &&
            charX + charWidth > obstacle.x &&
            charY < obstacle.y + GAME_CONFIG.obstacles.height &&
            charY + charHeight > obstacle.y) {
            
            endGame('Game Over! Você colidiu com um obstáculo.');
        }
    });
}

function updateProgress() {
    gameState.progress += 0.15; // Reduzido de 0.2 para 0.15 (progresso mais lento)
    
    // Verificar se o jogador está pulando o suficiente
    const currentTime = Date.now();
    const timeSinceLastJump = currentTime - gameState.lastJumpTime;
    
    // Se passou muito tempo sem pular (mais de 8 segundos), forçar obstáculos no chão
    if (timeSinceLastJump > 8000) {
        // Spawnar obstáculo forçado no chão
        spawnGroundObstacle();
        gameState.lastJumpTime = currentTime - 4000; // Reset parcial do timer
    }
    
    if (gameState.progress >= 100) {
        gameState.currentScenario++;
        gameState.progress = 0;
        gameState.jumpCount = 0; // Reset contador de saltos para o próximo cenário
        gameState.lastJumpTime = Date.now();
        
        if (gameState.currentScenario >= GAME_CONFIG.scenarios.length) {
            // Vitória - jogador completou todos os cenários
            let victoryMessage = 'Parabéns! Você encontrou o tesouro e o Santo Graal!';
            
            // Adicionar mensagem baseada no total de saltos (apenas informativo)
            const avgJumpsPerScenario = gameState.totalJumps / GAME_CONFIG.scenarios.length;
            if (avgJumpsPerScenario >= 8) {
                victoryMessage += ' 🏆 Performance Excelente!';
            } else if (avgJumpsPerScenario >= 5) {
                victoryMessage += ' 🥈 Boa Performance!';
            } else {
                victoryMessage += ' 🥉 Performance Básica!';
            }
            
            endGame(victoryMessage);
            return;
        }
        
        // Aumentar dificuldade progressivamente
        GAME_CONFIG.obstacles.speed += 0.3;
        GAME_CONFIG.obstacles.spawnRate = Math.max(800, GAME_CONFIG.obstacles.spawnRate - 150);
        
        clearInterval(gameState.intervals.obstacleSpawn);
        gameState.intervals.obstacleSpawn = setInterval(spawnObstacle, GAME_CONFIG.obstacles.spawnRate);
    }
    
    updateUI();
}

function spawnObstacle() {
    if (!gameState.isRunning) return;
    
    const groundY = GAME_CONFIG.canvas.height - GAME_CONFIG.character.height - 50;
    let obstacleY;
    
    // 50% dos obstáculos na altura do jogador (forçando pulos)
    if (Math.random() < GAME_CONFIG.obstacles.groundLevelChance) {
        obstacleY = groundY; // Na altura do jogador
    } else {
        // 50% em alturas variadas (mais altas para dar variedade)
        obstacleY = Math.random() * (GAME_CONFIG.canvas.height - 200) + 50;
    }
    
    const obstacle = {
        x: GAME_CONFIG.canvas.width,
        y: obstacleY,
        imageIndex: Math.floor(Math.random() * GAME_CONFIG.obstacleImages.length)
    };
    
    gameState.obstacles.push(obstacle);
}

function spawnGroundObstacle() {
    if (!gameState.isRunning) return;
    
    const groundY = GAME_CONFIG.canvas.height - GAME_CONFIG.character.height - 50;
    
    const obstacle = {
        x: GAME_CONFIG.canvas.width,
        y: groundY, // Sempre na altura do jogador
        imageIndex: Math.floor(Math.random() * GAME_CONFIG.obstacleImages.length)
    };
    
    gameState.obstacles.push(obstacle);
}

function jump() {
    if (gameState.isRunning) {
        // Permitir pulo a qualquer momento (no chão ou no ar)
        gameState.character.isJumping = true;
        gameState.character.onGround = false;
        
        // Reproduzir som de pulo
        playSound('jump');
        
        // Se já está no ar, dar um impulso menor
        if (gameState.character.velocityY > 0) {
            gameState.character.velocityY = GAME_CONFIG.character.jumpSpeed * 0.7; // 70% da força normal
        } else {
            gameState.character.velocityY = GAME_CONFIG.character.jumpSpeed; // Força total
        }
        
        // Contar saltos e atualizar tempo do último salto
        gameState.jumpCount++;
        gameState.totalJumps++;
        gameState.lastJumpTime = Date.now();
        
        console.log(`Personagem pulou! Total de saltos neste cenário: ${gameState.jumpCount}`);
    }
}

function render() {
    const ctx = elements.ctx;
    const canvas = elements.canvas;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar cenário de fundo
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
    const groundY = GAME_CONFIG.canvas.height - GAME_CONFIG.character.height - 50;
    const charY = groundY - gameState.character.y;
    
    // Debug: log das coordenadas do personagem
    if (Math.random() < 0.01) { // Log apenas ocasionalmente para não sobrecarregar
        console.log(`Personagem - X: ${charX}, Y: ${charY}, gameState.character.y: ${gameState.character.y}`);
    }
    
    if (gameState.images.character && gameState.images.character.complete) {
        ctx.drawImage(gameState.images.character, charX, charY, GAME_CONFIG.character.width, GAME_CONFIG.character.height);
    } else {
        // Fallback: retângulo colorido
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(charX, charY, GAME_CONFIG.character.width, GAME_CONFIG.character.height);
    }
    
    // Desenhar obstáculos
    gameState.obstacles.forEach(obstacle => {
        // Debug: log das coordenadas dos obstáculos
        if (Math.random() < 0.01) {
            console.log(`Obstáculo - X: ${obstacle.x}, Y: ${obstacle.y}`);
        }
        
        const obstacleImg = gameState.images.obstacles[obstacle.imageIndex];
        if (obstacleImg && obstacleImg.complete) {
            ctx.drawImage(obstacleImg, obstacle.x, obstacle.y, GAME_CONFIG.obstacles.width, GAME_CONFIG.obstacles.height);
        } else {
            // Fallback: retângulo colorido
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(obstacle.x, obstacle.y, GAME_CONFIG.obstacles.width, GAME_CONFIG.obstacles.height);
        }
    });
}

function updateUI() {
    const scenarioNames = [
        'Cenário 1: Floresta',
        'Cenário 2: Deserto', 
        'Cenário 3: Cidade Medieval',
        'Cenário 4: Caverna do Tesouro'
    ];
    
    elements.currentScenario.textContent = scenarioNames[gameState.currentScenario] || 'Cenário Desconhecido';
    elements.lifeIndicator.textContent = `❤️ Vida: ${gameState.lives}`;
    elements.progressIndicator.textContent = `Progresso: ${Math.floor(gameState.progress)}%`;
    
    // Atualizar contador de saltos se existir
    if (elements.jumpIndicator) {
        elements.jumpIndicator.textContent = `🦘 Saltos: ${gameState.jumpCount}`;
    }
}

function endGame(message) {
    console.log('Fim de jogo:', message);
    
    gameState.isRunning = false;
    
    // Parar som de fundo
    stopSound('background');
    
    // Reproduzir som apropriado
    if (message.includes('Parabéns') || message.includes('venceu') || message.includes('tesouro')) {
        playSound('victory');
    } else {
        playSound('collision');
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
    
    // Reset das configurações
    GAME_CONFIG.obstacles.speed = 3;
    GAME_CONFIG.obstacles.spawnRate = 2000;
    
    startGame();
}



function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    
    if (elements.soundToggle) {
        elements.soundToggle.textContent = gameState.soundEnabled ? '🔊 Som: ON' : '🔇 Som: OFF';
    }
    
    // Se desabilitou o som, parar todos os sons
    if (!gameState.soundEnabled) {
        stopSound('background');
    } else if (gameState.isRunning) {
        // Se habilitou o som e o jogo está rodando, tocar som de fundo
        playSound('background');
    }
    
    console.log('Som', gameState.soundEnabled ? 'habilitado' : 'desabilitado');
}

