// Configurações do jogo
const GAME_CONFIG = {
    canvas: {
        width: 800,
        height: 400
    },
    player: {
        width: 60,
        height: 80,
        x: 100,
        groundY: 320,
        jumpHeight: 120,
        jumpSpeed: 15,
        gravity: 0.8
    },
    obstacles: {
        width: 40,
        height: 40,
        speed: 3,
        spawnRate: 0.02,
        maxOnScreen: 3
    },
    scenarios: [
        {
            name: "Chapada Diamantina",
            background: "./scenario_1_chapada.png",
            duration: 2000,
            obstacleRate: 0.015
        },
        {
            name: "Deserto Árabe",
            background: "./scenario_2_deserto.png",
            duration: 2000,
            obstacleRate: 0.02
        },
        {
            name: "Cidade Mágica",
            background: "./scenario_3_cidade.png",
            duration: 2000,
            obstacleRate: 0.025
        },
        {
            name: "Caverna do Tesouro",
            background: "./scenario_4_caverna_tesouro.png",
            duration: 1500,
            obstacleRate: 0.03
        }
    ]
};

// Estado do jogo
let gameState = {
    screen: 'start', // 'start', 'playing', 'gameOver', 'victory'
    currentScenario: 0,
    progress: 0,
    totalProgress: 0,
    isAlive: true,
    isPaused: false
};

// Elementos do DOM
const screens = {
    start: document.getElementById('startScreen'),
    game: document.getElementById('gameScreen'),
    gameOver: document.getElementById('gameOverScreen'),
    victory: document.getElementById('victoryScreen')
};

const buttons = {
    start: document.getElementById('startButton'),
    restart: document.getElementById('restartButton'),
    playAgain: document.getElementById('playAgainButton'),
    backToMenu: document.getElementById('backToMenuButton'),
    backToMenu2: document.getElementById('backToMenuButton2'),
    jump: document.getElementById('jumpButton')
};

const ui = {
    scenario: document.getElementById('currentScenario'),
    life: document.getElementById('lifeIndicator'),
    progress: document.getElementById('progressIndicator')
};

// Canvas e contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajustar canvas para responsividade
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const aspectRatio = GAME_CONFIG.canvas.width / GAME_CONFIG.canvas.height;
    
    let newWidth = Math.min(containerWidth * 0.9, GAME_CONFIG.canvas.width);
    let newHeight = newWidth / aspectRatio;
    
    if (newHeight > containerHeight * 0.6) {
        newHeight = containerHeight * 0.6;
        newWidth = newHeight * aspectRatio;
    }
    
    canvas.style.width = newWidth + 'px';
    canvas.style.height = newHeight + 'px';
}

// Classe do jogador
class Player {
    constructor() {
        this.x = GAME_CONFIG.player.x;
        this.y = GAME_CONFIG.player.groundY;
        this.width = GAME_CONFIG.player.width;
        this.height = GAME_CONFIG.player.height;
        this.velocityY = 0;
        this.isJumping = false;
        this.groundY = GAME_CONFIG.player.groundY;
        
        // Carregar sprite
        this.sprite = new Image();
        this.sprite.src = './character_toy.png';
        this.sprite.onerror = () => {
            console.error('Erro ao carregar imagem do personagem');
        };
    }
    
    jump() {
        if (!this.isJumping) {
            this.velocityY = -GAME_CONFIG.player.jumpSpeed;
            this.isJumping = true;
        }
    }
    
    update() {
        // Aplicar gravidade
        this.velocityY += GAME_CONFIG.player.gravity;
        this.y += this.velocityY;
        
        // Verificar se tocou o chão
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.velocityY = 0;
            this.isJumping = false;
        }
    }
    
    draw() {
        if (this.sprite.complete && this.sprite.naturalWidth > 0) {
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        } else {
            // Fallback se a imagem não carregou
            ctx.fillStyle = '#4ecdc4';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            // Desenhar um rosto simples
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x + 15, this.y + 15, 8, 8); // olho esquerdo
            ctx.fillRect(this.x + 35, this.y + 15, 8, 8); // olho direito
            ctx.fillRect(this.x + 20, this.y + 35, 20, 5); // boca
        }
    }
    
    getBounds() {
        return {
            x: this.x + 10,
            y: this.y + 10,
            width: this.width - 20,
            height: this.height - 20
        };
    }
}

// Classe dos obstáculos
class Obstacle {
    constructor(type = 0) {
        this.x = GAME_CONFIG.canvas.width;
        this.y = 0;
        this.width = GAME_CONFIG.obstacles.width;
        this.height = GAME_CONFIG.obstacles.height;
        this.speed = GAME_CONFIG.obstacles.speed;
        this.type = type;
        
        // Carregar sprite baseado no tipo
        this.sprite = new Image();
        const sprites = ['./obstacle_1_rock.png', './obstacle_2_fruit.png', './obstacle_3_lamp.png'];
        this.sprite.src = sprites[type % sprites.length];
        this.sprite.onerror = () => {
            console.error('Erro ao carregar imagem do obstáculo:', sprites[type % sprites.length]);
        };
    }
    
    update() {
        this.x -= this.speed;
        this.y += 2; // Velocidade de queda
    }
    
    draw() {
        if (this.sprite.complete && this.sprite.naturalWidth > 0) {
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        } else {
            // Fallback se a imagem não carregou
            const colors = ['#8B4513', '#FF6347', '#FFD700']; // marrom, vermelho, dourado
            ctx.fillStyle = colors[this.type % colors.length];
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    
    getBounds() {
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
    
    isOffScreen() {
        return this.x + this.width < 0 || this.y > GAME_CONFIG.canvas.height;
    }
}

// Classe do cenário
class Background {
    constructor() {
        this.images = [];
        this.currentImage = null;
        this.loadImages();
    }
    
    loadImages() {
        GAME_CONFIG.scenarios.forEach((scenario, index) => {
            const img = new Image();
            img.src = scenario.background;
            img.onerror = () => {
                console.error('Erro ao carregar imagem do cenário:', scenario.background);
            };
            this.images[index] = img;
        });
    }
    
    setScenario(index) {
        if (this.images[index]) {
            this.currentImage = this.images[index];
        }
    }
    
    draw() {
        if (this.currentImage && this.currentImage.complete && this.currentImage.naturalWidth > 0) {
            ctx.drawImage(this.currentImage, 0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);
        } else {
            // Fallback gradient baseado no cenário
            const gradients = [
                ['#87ceeb', '#98fb98'], // Chapada - azul para verde
                ['#ffd700', '#ff6347'], // Deserto - dourado para laranja
                ['#9370db', '#ff69b4'], // Cidade - roxo para rosa
                ['#2f4f4f', '#ffd700']  // Caverna - cinza escuro para dourado
            ];
            
            const currentGradient = gradients[gameState.currentScenario] || gradients[0];
            const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.canvas.height);
            gradient.addColorStop(0, currentGradient[0]);
            gradient.addColorStop(1, currentGradient[1]);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);
        }
    }
}

// Instâncias do jogo
let player;
let obstacles = [];
let background;
let gameStartTime;
let lastObstacleSpawn = 0;

// Função de detecção de colisão
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Função para spawnar obstáculos
function spawnObstacle() {
    const currentScenario = GAME_CONFIG.scenarios[gameState.currentScenario];
    const now = Date.now();
    
    if (now - lastObstacleSpawn > 1000 && 
        Math.random() < currentScenario.obstacleRate && 
        obstacles.length < GAME_CONFIG.obstacles.maxOnScreen) {
        
        const obstacleType = Math.floor(Math.random() * 3);
        obstacles.push(new Obstacle(obstacleType));
        lastObstacleSpawn = now;
    }
}

// Função para atualizar o progresso
function updateProgress() {
    const now = Date.now();
    const elapsed = now - gameStartTime;
    
    // Calcular progresso do cenário atual
    const currentScenario = GAME_CONFIG.scenarios[gameState.currentScenario];
    const scenarioProgress = Math.min(elapsed % currentScenario.duration / currentScenario.duration, 1);
    
    // Calcular progresso total
    const totalDuration = GAME_CONFIG.scenarios.reduce((sum, scenario) => sum + scenario.duration, 0);
    const totalElapsed = Math.min(elapsed, totalDuration);
    gameState.totalProgress = (totalElapsed / totalDuration) * 100;
    
    // Verificar mudança de cenário
    let accumulatedTime = 0;
    for (let i = 0; i < GAME_CONFIG.scenarios.length; i++) {
        accumulatedTime += GAME_CONFIG.scenarios[i].duration;
        if (elapsed < accumulatedTime) {
            if (gameState.currentScenario !== i) {
                gameState.currentScenario = i;
                background.setScenario(i);
                updateUI();
            }
            break;
        }
    }
    
    // Verificar vitória
    if (gameState.totalProgress >= 100) {
        showScreen('victory');
        return;
    }
}

// Função para atualizar a UI
function updateUI() {
    const scenario = GAME_CONFIG.scenarios[gameState.currentScenario];
    ui.scenario.textContent = `Cenário ${gameState.currentScenario + 1}: ${scenario.name}`;
    ui.life.textContent = gameState.isAlive ? '❤️ Vida: 1' : '💀 Game Over';
    ui.progress.textContent = `Progresso: ${Math.floor(gameState.totalProgress)}%`;
}

// Loop principal do jogo
function gameLoop() {
    if (gameState.screen !== 'playing' || gameState.isPaused) {
        return;
    }
    
    // Limpar canvas
    ctx.clearRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);
    
    // Desenhar fundo
    background.draw();
    
    // Atualizar e desenhar jogador
    player.update();
    player.draw();
    
    // Spawnar obstáculos
    spawnObstacle();
    
    // Atualizar obstáculos
    obstacles = obstacles.filter(obstacle => {
        obstacle.update();
        obstacle.draw();
        
        // Verificar colisão
        if (checkCollision(player.getBounds(), obstacle.getBounds())) {
            gameState.isAlive = false;
            showScreen('gameOver');
            return false;
        }
        
        // Remover obstáculos fora da tela
        return !obstacle.isOffScreen();
    });
    
    // Atualizar progresso
    updateProgress();
    updateUI();
    
    // Continuar o loop
    requestAnimationFrame(gameLoop);
}

// Função para mostrar tela
function showScreen(screenName) {
    gameState.screen = screenName;
    
    // Esconder todas as telas
    Object.values(screens).forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Mostrar tela específica
    if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
    }
}

// Função para inicializar o jogo
function initGame() {
    player = new Player();
    obstacles = [];
    background = new Background();
    gameStartTime = Date.now();
    lastObstacleSpawn = 0;
    
    gameState = {
        screen: 'playing',
        currentScenario: 0,
        progress: 0,
        totalProgress: 0,
        isAlive: true,
        isPaused: false
    };
    
    background.setScenario(0);
    showScreen('game');
    updateUI();
    gameLoop();
}

// Event listeners
buttons.start.addEventListener('click', initGame);
buttons.restart.addEventListener('click', initGame);
buttons.playAgain.addEventListener('click', initGame);
buttons.backToMenu.addEventListener('click', () => showScreen('start'));
buttons.backToMenu2.addEventListener('click', () => showScreen('start'));

// Controles do jogo
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState.screen === 'playing') {
        e.preventDefault();
        player.jump();
    }
});

// Controle móvel
buttons.jump.addEventListener('click', () => {
    if (gameState.screen === 'playing') {
        player.jump();
    }
});

// Controle por toque na tela
canvas.addEventListener('click', () => {
    if (gameState.screen === 'playing') {
        player.jump();
    }
});

// Prevenir zoom no mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.screen === 'playing') {
        player.jump();
    }
});

// Redimensionar canvas quando a janela muda de tamanho
window.addEventListener('resize', resizeCanvas);

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    showScreen('start');
});

// Detectar dispositivos móveis
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Ajustar controles para mobile
if (isMobile()) {
    document.body.classList.add('mobile-device');
}

