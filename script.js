class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.player = new Player(this);
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.gameStarted = false;
        
        this.keys = {};
        this.enemySpawnTimer = 0;
        this.enemySpawnRate = 120;
        
        this.setupEventListeners();
        this.setupUI();
        this.animate();
    }
    
    setupEventListeners() {
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Сенсорные кнопки
        document.getElementById('leftBtn').addEventListener('mousedown', () => this.keys['ArrowLeft'] = true);
        document.getElementById('leftBtn').addEventListener('mouseup', () => this.keys['ArrowLeft'] = false);
        document.getElementById('leftBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = true;
        });
        document.getElementById('leftBtn').addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = false;
        });
        
        document.getElementById('rightBtn').addEventListener('mousedown', () => this.keys['ArrowRight'] = true);
        document.getElementById('rightBtn').addEventListener('mouseup', () => this.keys['ArrowRight'] = false);
        document.getElementById('rightBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['ArrowRight'] = true;
        });
        document.getElementById('rightBtn').addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowRight'] = false;
        });
        
        document.getElementById('fireBtn').addEventListener('mousedown', () => this.player.shoot());
        document.getElementById('fireBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.player.shoot();
        });
        
        // Кнопки интерфейса
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
    }
    
    setupUI() {
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('score').textContent = `Очки: ${this.score}`;
        document.getElementById('lives').textContent = `Жизни: ${this.lives}`;
        document.getElementById('level').textContent = `Уровень: ${this.level}`;
    }
    
    startGame() {
        this.gameStarted = true;
        this.gameOver = false;
        document.getElementById('startScreen').classList.add('hidden');
        this.reset();
    }
    
    restartGame() {
        this.gameOver = false;
        this.gameStarted = true;
        document.getElementById('gameOver').classList.add('hidden');
        this.reset();
    }
    
    reset() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.enemySpawnRate = 120;
        this.player.x = this.width / 2;
        this.player.y = this.height - 50;
        this.updateUI();
    }
    
    spawnEnemy() {
        this.enemies.push(new Enemy(this));
    }
    
    checkCollisions() {
        // Пули с врагами
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < bullet.radius + enemy.radius) {
                    // Столкновение - уничтожаем врага
                    this.createExplosion(enemy.x, enemy.y);
                    this.bullets.splice(i, 1);
                    this.enemies.splice(j, 1);
                    this.score += 100;
                    
                    // Проверка уровня (теперь правильно)
                    const neededScore = this.level * 1000;
                    if (this.score >= neededScore) {
                        this.level++;
                        this.enemySpawnRate = Math.max(20, 120 - this.level * 15);
                    }
                    break;
                }
            }
        }
        
        // Игрок с врагами
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.player.radius + enemy.radius) {
                this.createExplosion(enemy.x, enemy.y);
                this.enemies.splice(i, 1);
                this.lives--;
                this.updateUI();
                
                if (this.lives <= 0) {
                    this.endGame();
                }
                break;
            }
        }
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(this, x, y));
        }
    }
    
    endGame() {
        this.gameOver = true;
        this.gameStarted = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    update() {
        if (!this.gameStarted || this.gameOver) return;
        
        // Обновление игрока
        this.player.update();
        
        // Спавн врагов
        this.enemySpawnTimer++;
        if (this.enemySpawnTimer >= this.enemySpawnRate) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
            
            // Иногда спавним несколько врагов сразу
            if (Math.random() < 0.3) {
                this.spawnEnemy();
            }
        }
        
        // Обновление врагов
        this.enemies.forEach(enemy => enemy.update());
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
        
        // Обновление пуль
        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(bullet => !bullet.markedForDeletion);
        
        // Обновление частиц
        this.particles.forEach(particle => particle.update());
        this.particles = this.particles.filter(particle => !particle.markedForDeletion);
        
        // Проверка столкновений
        this.checkCollisions();
    }
    
    draw() {
        // Очистка canvas
        this.ctx.fillStyle = 'rgba(0, 8, 20, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Рисование звездного фона
        this.drawBackground();
        
        // Рисование игровых объектов
        this.particles.forEach(particle => particle.draw());
        this.bullets.forEach(bullet => bullet.draw());
        this.enemies.forEach(enemy => enemy.draw());
        this.player.draw();
    }
    
    drawBackground() {
        // Простой звездный фон
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < 30; i++) {
            const x = (i * 47 + Date.now() * 0.05) % this.width;
            const y = (i * 23 + Date.now() * 0.03) % this.height;
            const size = Math.random() * 1.5;
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

class Player {
    constructor(game) {
        this.game = game;
        this.x = game.width / 2;
        this.y = game.height - 50;
        this.radius = 15;
        this.speed = 6;
        this.shootCooldown = 0;
    }
    
    update() {
        // Движение
        if (this.game.keys['ArrowLeft'] || this.game.keys['KeyA']) {
            this.x -= this.speed;
        }
        if (this.game.keys['ArrowRight'] || this.game.keys['KeyD']) {
            this.x += this.speed;
        }
        
        // Границы
        this.x = Math.max(this.radius, Math.min(this.game.width - this.radius, this.x));
        
        // Стрельба
        this.shootCooldown--;
        if ((this.game.keys['Space'] || this.game.keys['Space']) && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = 15;
        }
    }
    
    shoot() {
        if (this.game.gameStarted && !this.game.gameOver) {
            this.game.bullets.push(new Bullet(this.game, this.x, this.y - this.radius));
        }
    }
    
    draw() {
        const ctx = this.game.ctx;
        
        // Корабль игрока
        ctx.save();
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x - this.radius, this.y + this.radius);
        ctx.lineTo(this.x + this.radius, this.y + this.radius);
        ctx.closePath();
        ctx.fill();
        
        // Двигатель
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(this.x - 8, this.y + this.radius);
        ctx.lineTo(this.x, this.y + this.radius + 8);
        ctx.lineTo(this.x + 8, this.y + this.radius);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

class Enemy {
    constructor(game) {
        this.game = game;
        this.radius = 12 + Math.random() * 8;
        this.x = Math.random() * (game.width - this.radius * 2) + this.radius;
        this.y = -this.radius;
        this.speed = 2 + Math.random() * 2 + game.level * 0.3;
        this.markedForDeletion = false;
    }
    
    update() {
        this.y += this.speed;
        
        if (this.y > this.game.height + this.radius) {
            this.markedForDeletion = true;
        }
    }
    
    draw() {
        const ctx = this.game.ctx;
        
        // Враг
        ctx.save();
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Детали
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Bullet {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.speed = 8;
        this.markedForDeletion = false;
    }
    
    update() {
        this.y -= this.speed;
        
        if (this.y < -this.radius) {
            this.markedForDeletion = true;
        }
    }
    
    draw() {
        const ctx = this.game.ctx;
        
        ctx.save();
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Свечение
        ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Particle {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.color = `hsl(${Math.random() * 60}, 100%, 50%)`;
        this.markedForDeletion = false;
        this.life = 30;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
        this.size *= 0.95;
        
        if (this.life <= 0 || this.size < 0.5) {
            this.markedForDeletion = true;
        }
    }
    
    draw() {
        const ctx = this.game.ctx;
        
        ctx.save();
        ctx.globalAlpha = this.life / 30;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Запуск игры когда страница загружена
window.addEventListener('load', () => {
    new Game();
});