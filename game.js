// --- Game Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const moneyDisplay = document.getElementById('moneyDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const waveDisplay = document.getElementById('waveDisplay');
const buildBasicTowerBtn = document.getElementById('buildBasicTowerBtn');
const buildSlowTowerBtn = document.getElementById('buildSlowTowerBtn');
const buildAoeTowerBtn = document.getElementById('buildAoeTowerBtn');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreText = document.getElementById('finalScore');
const playAgainBtn = document.getElementById('playAgainBtn');
const pauseScreen = document.getElementById('pauseScreen');
const resumeBtn = document.getElementById('resumeBtn');
const towerInfoPanel = document.getElementById('towerInfoPanel');
const towerType = document.getElementById('towerType');
const towerLevel = document.getElementById('towerLevel');
const towerDamage = document.getElementById('towerDamage');
const towerRange = document.getElementById('towerRange');
const towerFireRate = document.getElementById('towerFireRate');
const sellTowerBtn = document.getElementById('sellTowerBtn');
const upgradeTowerBtn = document.getElementById('upgradeTowerBtn'); // New button element

const TILE_SIZE = 40;

let gameRunning = true;
let money = 100;
let lives = 10;
let wave = 0;
let isPaused = false;
let selectedTower = null;

let enemies = [];
let towers = [];
let projectiles = [];

let isBuilding = false;
let towerToBuild = null;
let mouseX = 0;
let mouseY = 0;

// --- Map Data (Simple Grid Path Example) ---
const gameMap = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

let path = [];
gameMap.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
        if (cell === 1 || cell === 2 || cell === 3) {
            path.push({ x: cIdx * TILE_SIZE + TILE_SIZE / 2, y: rIdx * TILE_SIZE + TILE_SIZE / 2 });
        }
    });
});
path.sort((a, b) => a.x - b.x);


// --- Game Objects (Classes/Constructors) ---
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.pathIndex = 0;
        this.radius = 10;
        this.type = type;
        
        this.slowMultiplier = 1;
        this.slowDuration = 0;
        this.lastTime = performance.now();
        
        switch (this.type) {
            case 'basic':
                this.health = 10;
                this.speed = 1.5;
                this.reward = 10;
                this.color = 'blue';
                this.baseHealth = 10;
                break;
            case 'fast':
                this.health = 5;
                this.speed = 2.5;
                this.reward = 5;
                this.color = 'cyan';
                this.baseHealth = 5;
                break;
            case 'tank':
                this.health = 30;
                this.speed = 0.8;
                this.reward = 20;
                this.color = 'darkred';
                this.baseHealth = 30;
                break;
            default:
                this.health = 10;
                this.speed = 1.5;
                this.reward = 10;
                this.color = 'blue';
                this.baseHealth = 10;
                break;
        }
    }

    update(currentTime) {
        if (this.slowDuration > 0) {
            this.slowDuration -= (currentTime - this.lastTime);
            if (this.slowDuration <= 0) {
                this.slowMultiplier = 1;
            }
        }
        this.lastTime = currentTime;

        const effectiveSpeed = this.speed * this.slowMultiplier;

        if (this.pathIndex < path.length - 1) {
            const nextPoint = path[this.pathIndex + 1];
            const dx = nextPoint.x - this.x;
            const dy = nextPoint.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < effectiveSpeed) {
                this.x = nextPoint.x;
                this.y = nextPoint.y;
                this.pathIndex++;
            } else {
                this.x += (dx / distance) * effectiveSpeed;
                this.y += (dy / distance) * effectiveSpeed;
            }
        } else {
            lives--;
            updateUI();
            return true;
        }
        return false;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        const healthBarWidth = this.radius * 2;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 5, healthBarWidth, 3);
        ctx.fillStyle = 'green';
        const healthPercentage = this.health / this.baseHealth;
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 5, healthBarWidth * healthPercentage, 3);
    }
}

class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.lastShotTime = 0;
        this.level = 1; 

        switch (this.type) {
            case 'basic':
                this.damage = 10;
                this.range = 100;
                this.fireRate = 1000;
                this.cost = 50;
                this.sellPrice = 40;
                this.color = 'purple';
                this.upgradeCost = 25; // Base upgrade cost
                break;
            case 'slow':
                this.damage = 5;
                this.range = 120;
                this.fireRate = 1500;
                this.cost = 75;
                this.sellPrice = 60;
                this.color = 'aqua';
                this.upgradeCost = 40;
                break;
            case 'aoe':
                this.damage = 15;
                this.range = 150;
                this.fireRate = 2000;
                this.cost = 125;
                this.sellPrice = 100;
                this.color = 'red';
                this.upgradeCost = 60;
                break;
        }
        this.maxLevel = 10;
    }

    upgrade() {
        if (this.level < this.maxLevel) {
            this.level++;
            this.damage *= 1.5; 
            this.range += 10;
            this.fireRate *= 0.8;
            this.sellPrice += this.upgradeCost * 0.75;
            this.upgradeCost = Math.round(this.upgradeCost * 1.5); // Increase cost for next level
            return true;
        }
        return false;
    }

    update(currentTime) {
        if (currentTime - this.lastShotTime > this.fireRate) {
            let target = this.findTarget();
            if (target) {
                projectiles.push(new Projectile(this.x, this.y, target, this.damage, this.type));
                this.lastShotTime = currentTime;
            }
        }
    }

    findTarget() {
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.range) {
                return enemy;
            }
        }
        return null;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - TILE_SIZE / 2, this.y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
        
        // Draw selection highlight
        if (selectedTower === this) {
            ctx.strokeStyle = 'gold';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - TILE_SIZE / 2, this.y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class Projectile {
    constructor(x, y, target, damage, towerType) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.towerType = towerType;
        this.speed = 8;
        this.radius = 5;
        this.color = (this.towerType === 'slow') ? 'lightblue' : (this.towerType === 'aoe' ? 'darkred' : 'orange');
        this.explosionRadius = 50;
    }

    update() {
        if (!this.target || this.target.health <= 0) {
            return true;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            if (this.towerType === 'aoe') {
                enemies.forEach(enemy => {
                    const explosionDx = enemy.x - this.x;
                    const explosionDy = enemy.y - this.y;
                    const explosionDistance = Math.sqrt(explosionDx * explosionDx + explosionDy * explosionDy);

                    if (explosionDistance < this.explosionRadius) {
                        enemy.health -= this.damage;
                        if (enemy.health <= 0) {
                            money += enemy.reward;
                            updateUI();
                        }
                    }
                });
            } else {
                this.target.health -= this.damage;
                if (this.towerType === 'slow') {
                    this.target.slowMultiplier = 0.5;
                    this.target.slowDuration = 2000;
                }
                
                if (this.target.health <= 0) {
                    money += this.target.reward;
                    updateUI();
                }
            }
            return true;
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
            return false;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}


// --- Game Logic Functions ---
function showTowerInfo(tower) {
    if (!tower) {
        towerInfoPanel.style.display = 'none';
        return;
    }
    selectedTower = tower;
    towerInfoPanel.style.display = 'flex';
    towerType.textContent = tower.type.charAt(0).toUpperCase() + tower.type.slice(1) + ' Tower';
    towerLevel.textContent = tower.level;
    towerDamage.textContent = tower.damage;
    towerRange.textContent = tower.range;
    towerFireRate.textContent = tower.fireRate;
    sellTowerBtn.textContent = `Sell (${tower.sellPrice}G)`;

    // Handle Upgrade button visibility and state
    if (tower.level < tower.maxLevel) {
        upgradeTowerBtn.style.display = 'block';
        upgradeTowerBtn.textContent = `Upgrade (${tower.upgradeCost}G)`;
        upgradeTowerBtn.disabled = money < tower.upgradeCost;
    } else {
        upgradeTowerBtn.style.display = 'block';
        upgradeTowerBtn.textContent = `Max Level`;
        upgradeTowerBtn.disabled = true;
    }
}

function sellTower() {
    if (selectedTower) {
        money += selectedTower.sellPrice;
        towers = towers.filter(t => t !== selectedTower);
        showTowerInfo(null);
        updateUI();
    }
}

function upgradeTower() {
    if (selectedTower && money >= selectedTower.upgradeCost && selectedTower.level < selectedTower.maxLevel) {
        money -= selectedTower.upgradeCost;
        selectedTower.upgrade();
        showTowerInfo(selectedTower);
        updateUI();
    }
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        pauseScreen.style.display = 'flex';
    } else {
        pauseScreen.style.display = 'none';
        requestAnimationFrame(gameLoop);
    }
}

function spawnWave() {
    wave++;
    updateUI();
    
    let waveEnemies = [];
    if (wave === 1) {
        waveEnemies = new Array(5).fill('basic');
    } else if (wave === 2) {
        waveEnemies = new Array(3).fill('basic').concat(new Array(2).fill('fast'));
    } else if (wave === 3) {
        waveEnemies = new Array(5).fill('basic').concat(new Array(2).fill('tank'));
    } else if (wave === 4) {
        waveEnemies = new Array(3).fill('basic').concat(new Array(3).fill('fast')).concat(new Array(1).fill('tank'));
    } else {
        waveEnemies = new Array(Math.floor(wave / 2)).fill('tank')
                        .concat(new Array(wave * 2).fill('basic'))
                        .concat(new Array(Math.floor(wave / 3)).fill('fast'));
    }

    let delay = 500;
    
    waveEnemies.forEach((enemyType, index) => {
        setTimeout(() => {
            if (gameRunning && !isPaused) {
                enemies.push(new Enemy(path[0].x, path[0].y, enemyType));
            }
        }, index * delay);
    });
}

function updateUI() {
    moneyDisplay.textContent = money;
    livesDisplay.textContent = lives;
    waveDisplay.textContent = wave;
}

function checkGameOver() {
    if (lives <= 0) {
        endGame();
    }
}

function endGame() {
    gameRunning = false;
    finalScoreText.textContent = `You survived ${wave} waves.`;
    gameOverScreen.style.display = 'flex';
}

function drawPath() {
    ctx.fillStyle = 'brown';
    gameMap.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
            if (cell === 1 || cell === 2 || cell === 3) {
                ctx.fillRect(cIdx * TILE_SIZE, rIdx * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        });
    });
}

function drawTowerPreview() {
    const gridX = Math.floor(mouseX / TILE_SIZE);
    const gridY = Math.floor(mouseY / TILE_SIZE);
    const previewX = gridX * TILE_SIZE;
    const previewY = gridY * TILE_SIZE;

    ctx.fillStyle = 'rgba(128, 0, 128, 0.5)';
    ctx.fillRect(previewX, previewY, TILE_SIZE, TILE_SIZE);
}


// --- Event Listeners ---
document.addEventListener('keydown', e => {
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
    }
});

buildBasicTowerBtn.addEventListener('click', () => {
    selectedTower = null;
    showTowerInfo(null);
    const basicTowerCost = new Tower(0, 0, 'basic').cost;
    if (money >= basicTowerCost) {
        isBuilding = true;
        towerToBuild = 'basic';
        canvas.style.cursor = 'crosshair';
    } else {
        alert('Not enough money!');
    }
});

buildSlowTowerBtn.addEventListener('click', () => {
    selectedTower = null;
    showTowerInfo(null);
    const slowTowerCost = new Tower(0, 0, 'slow').cost;
    if (money >= slowTowerCost) {
        isBuilding = true;
        towerToBuild = 'slow';
        canvas.style.cursor = 'crosshair';
    } else {
        alert('Not enough money!');
    }
});

buildAoeTowerBtn.addEventListener('click', () => {
    selectedTower = null;
    showTowerInfo(null);
    const aoeTowerCost = new Tower(0, 0, 'aoe').cost;
    if (money >= aoeTowerCost) {
        isBuilding = true;
        towerToBuild = 'aoe';
        canvas.style.cursor = 'crosshair';
    } else {
        alert('Not enough money!');
    }
});

sellTowerBtn.addEventListener('click', sellTower);
upgradeTowerBtn.addEventListener('click', upgradeTower);  
playAgainBtn.addEventListener('click', initGame);
resumeBtn.addEventListener('click', togglePause);

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    if (isBuilding) {
        const mouseGridX = Math.floor(clickX / TILE_SIZE);
        const mouseGridY = Math.floor(clickY / TILE_SIZE);
        
        const isPathCell = gameMap[mouseGridY] && (gameMap[mouseGridY][mouseGridX] === 1 || gameMap[mouseGridY][mouseGridX] === 2 || gameMap[mouseGridY][mouseGridX] === 3);
        
        const towerExists = towers.some(t => {
            const towerGridX = Math.floor(t.x / TILE_SIZE);
            const towerGridY = Math.floor(t.y / TILE_SIZE);
            return towerGridX === mouseGridX && towerGridY === mouseGridY;
        });

        if (!isPathCell && !towerExists) {
            const towerX = mouseGridX * TILE_SIZE + TILE_SIZE / 2;
            const towerY = mouseGridY * TILE_SIZE + TILE_SIZE / 2;
            
            towers.push(new Tower(towerX, towerY, towerToBuild));
            
            const towerCost = new Tower(0, 0, towerToBuild).cost;
            money -= towerCost;
            updateUI();
            isBuilding = false;
            towerToBuild = null;
            canvas.style.cursor = 'default';
        } else {
            alert('Cannot build here! It\'s either on the path or occupied.');
        }
    } else {
        const clickedTower = towers.find(tower => {
            const dx = tower.x - clickX;
            const dy = tower.y - clickY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < TILE_SIZE / 2;
        });
        
        showTowerInfo(clickedTower);
    }
});

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
});


// --- Game Loop ---
let lastFrameTime = 0;
let lastEnemySpawnTime = 0;
const waveSpawnInterval = 10000;

function gameLoop(currentTime) {
    if (!gameRunning || isPaused) {
        return;
    }

    enemies = enemies.filter(enemy => {
        const reachedEnd = enemy.update(currentTime);
        return !reachedEnd && enemy.health > 0;
    });

    towers.forEach(tower => tower.update(currentTime));
    projectiles = projectiles.filter(projectile => !projectile.update());
    checkGameOver();

    if (currentTime - lastEnemySpawnTime > waveSpawnInterval && enemies.length === 0) {
        spawnWave();
        lastEnemySpawnTime = currentTime;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPath();

    towers.forEach(tower => tower.draw());
    projectiles.forEach(projectile => projectile.draw());
    enemies.forEach(enemy => enemy.draw());
    
    if (isBuilding) {
        drawTowerPreview();
    }

    lastFrameTime = currentTime;
    requestAnimationFrame(gameLoop);
}

// Initial setup
initGame();

function initGame() {
    gameRunning = true;
    isPaused = false;
    money = 10000;
    lives = 10;
    wave = 0;
    enemies = [];
    towers = [];
    projectiles = [];
    isBuilding = false;
    towerToBuild = null;
    selectedTower = null;
    canvas.style.cursor = 'default';
    lastEnemySpawnTime = performance.now() - waveSpawnInterval + 3000;
    lastFrameTime = performance.now();
    updateUI();
    gameOverScreen.style.display = 'none';
    pauseScreen.style.display = 'none';
    towerInfoPanel.style.display = 'none';
    requestAnimationFrame(gameLoop);
}