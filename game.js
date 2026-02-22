// ── Stadium Runner — Phaser 3 ──────────────────────────────────────

const GAME_W = 800;
const GAME_H = 500;
const STAND_H = 60;          // height of fan stands (top & bottom)
const FIELD_TOP = STAND_H;
const FIELD_BOT = GAME_H - STAND_H;
const FIELD_H = FIELD_BOT - FIELD_TOP;
const LEVEL_LENGTH = 3000;   // pixels the player must travel per level
const PLAYER_SPEED = 160;
const AUTO_SCROLL = 100;     // base auto-scroll px/s

// ── Boot Scene ─────────────────────────────────────────────────────
class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }

    create() {
        this.generateTextures();
        this.scene.start('Title');
    }

    generateTextures() {
        // — Player (simple character) —
        const pg = this.make.graphics({ add: false });
        pg.fillStyle(0x2255ff);
        pg.fillRoundedRect(2, 2, 20, 28, 4);
        pg.fillStyle(0xffcc88);
        pg.fillCircle(12, 6, 6);         // head
        pg.fillStyle(0xff4444);
        pg.fillRect(6, 14, 12, 10);      // jersey
        pg.fillStyle(0x222222);
        pg.fillRect(6, 24, 5, 6);        // left leg
        pg.fillRect(13, 24, 5, 6);       // right leg
        pg.generateTexture('player', 24, 32);
        pg.destroy();

        // — Soccer ball —
        const bg = this.make.graphics({ add: false });
        bg.fillStyle(0xffffff);
        bg.fillCircle(8, 8, 8);
        bg.fillStyle(0x222222);
        // pentagon pattern (simplified)
        bg.fillCircle(8, 4, 2.5);
        bg.fillCircle(4, 10, 2.5);
        bg.fillCircle(12, 10, 2.5);
        bg.fillCircle(6, 6, 1.5);
        bg.fillCircle(10, 6, 1.5);
        bg.generateTexture('ball', 16, 16);
        bg.destroy();

        // — Ball shadow —
        const sg = this.make.graphics({ add: false });
        sg.fillStyle(0x000000, 0.3);
        sg.fillEllipse(8, 4, 14, 6);
        sg.generateTexture('shadow', 16, 8);
        sg.destroy();

        // — White particle —
        const wp = this.make.graphics({ add: false });
        wp.fillStyle(0xffffff);
        wp.fillCircle(2, 2, 2);
        wp.generateTexture('particle_white', 4, 4);
        wp.destroy();

        // — Yellow star particle —
        const yp = this.make.graphics({ add: false });
        yp.fillStyle(0xffff00);
        yp.fillCircle(3, 3, 3);
        yp.generateTexture('particle_yellow', 6, 6);
        yp.destroy();

        // — Red particle —
        const rp = this.make.graphics({ add: false });
        rp.fillStyle(0xff3333);
        rp.fillCircle(2, 2, 2);
        rp.generateTexture('particle_red', 4, 4);
        rp.destroy();

        // — Field tile (green with subtle stripes) —
        const fg = this.make.graphics({ add: false });
        fg.fillStyle(0x2d8a4e);
        fg.fillRect(0, 0, 64, 64);
        fg.fillStyle(0x33995a);
        fg.fillRect(0, 0, 32, 64);
        fg.generateTexture('field_tile', 64, 64);
        fg.destroy();
    }
}

// ── Title Scene ────────────────────────────────────────────────────
class TitleScene extends Phaser.Scene {
    constructor() { super('Title'); }

    create() {
        this.cameras.main.setBackgroundColor('#1a472a');

        // Stadium backdrop
        this.drawMiniStadium();

        // Title
        this.add.text(GAME_W / 2, 100, 'STADIUM RUNNER', {
            fontSize: '52px', fontFamily: 'Arial Black, Arial',
            color: '#ffffff', stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5);

        this.add.text(GAME_W / 2, 160, 'Dodge the soccer balls!', {
            fontSize: '18px', fontFamily: 'Arial',
            color: '#ccffcc',
        }).setOrigin(0.5);

        // High score
        const hi = localStorage.getItem('stadiumRunner_hi') || 0;
        this.add.text(GAME_W / 2, 210, `High Score: Level ${hi}`, {
            fontSize: '20px', fontFamily: 'Arial',
            color: '#ffdd44',
        }).setOrigin(0.5);

        // Instructions
        const inst = this.add.text(GAME_W / 2, 320, 'Arrow Keys / WASD to move\nTouch & drag on mobile', {
            fontSize: '16px', fontFamily: 'Arial',
            color: '#aaddaa', align: 'center', lineSpacing: 6,
        }).setOrigin(0.5);

        // Blink prompt
        const prompt = this.add.text(GAME_W / 2, 400, 'Press SPACE to Start', {
            fontSize: '26px', fontFamily: 'Arial',
            color: '#ffffff',
        }).setOrigin(0.5);

        this.tweens.add({
            targets: prompt, alpha: 0.2,
            duration: 600, yoyo: true, repeat: -1,
        });

        // Input
        this.input.keyboard.once('keydown-SPACE', () => this.startGame());
        this.input.once('pointerdown', () => this.startGame());
    }

    drawMiniStadium() {
        const g = this.add.graphics();
        // top stand
        g.fillStyle(0x993333); g.fillRect(0, 0, GAME_W, STAND_H);
        // bottom stand
        g.fillStyle(0x333399); g.fillRect(0, GAME_H - STAND_H, GAME_W, STAND_H);
        // field
        g.fillStyle(0x2d8a4e); g.fillRect(0, STAND_H, GAME_W, FIELD_H);
        // mini fans
        for (let i = 0; i < 40; i++) {
            const c = Phaser.Display.Color.HSVColorWheel()[Phaser.Math.Between(0, 359)];
            g.fillStyle(c.color, 0.6);
            g.fillCircle(Phaser.Math.Between(20, GAME_W - 20), Phaser.Math.Between(8, STAND_H - 8), 5);
            g.fillCircle(Phaser.Math.Between(20, GAME_W - 20), Phaser.Math.Between(GAME_H - STAND_H + 8, GAME_H - 8), 5);
        }
    }

    startGame() {
        this.scene.start('Game', { level: 1 });
    }
}

// ── Game Scene ─────────────────────────────────────────────────────
class GameScene extends Phaser.Scene {
    constructor() { super('Game'); }

    init(data) {
        this.level = data.level || 1;
        this.distance = 0;
        this.alive = true;
    }

    create() {
        // ── World bounds & camera ──
        const worldW = LEVEL_LENGTH + GAME_W;
        this.physics.world.setBounds(0, FIELD_TOP, worldW, FIELD_H);
        this.cameras.main.setBounds(0, 0, worldW, GAME_H);

        // ── Scrolling field ──
        this.fieldTile = this.add.tileSprite(0, FIELD_TOP, worldW, FIELD_H, 'field_tile')
            .setOrigin(0, 0).setDepth(0);

        // ── Field line markings ──
        this.fieldLines = this.add.graphics().setDepth(1);
        this.drawFieldLines(worldW);

        // ── Fan stands (scrolling graphics) ──
        this.drawStands(worldW);

        // ── Player ──
        this.player = this.physics.add.sprite(80, GAME_H / 2, 'player')
            .setDepth(10).setCollideWorldBounds(true);
        this.player.body.setSize(16, 24).setOffset(4, 6);

        // ── Camera follow ──
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // ── Balls group ──
        this.balls = this.physics.add.group();
        this.shadows = this.add.group();

        // ── Collision ──
        this.physics.add.overlap(this.player, this.balls, this.hitByBall, null, this);

        // ── Controls ──
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.setupTouch();

        // ── HUD (fixed to camera) ──
        this.createHUD();

        // ── Ball spawner ──
        this.spawnTimer = 0;
        this.spawnInterval = this.getSpawnInterval();

        // ── Particle emitters ──
        this.hitEmitter = this.add.particles(0, 0, 'particle_red', {
            speed: { min: 80, max: 200 },
            scale: { start: 1.5, end: 0 },
            lifespan: 500,
            blendMode: 'ADD',
            emitting: false,
        }).setDepth(20);

        this.starEmitter = this.add.particles(0, 0, 'particle_yellow', {
            speed: { min: 50, max: 150 },
            scale: { start: 1, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            emitting: false,
        }).setDepth(20);

        // ── Level banner ──
        this.showLevelBanner();
    }

    // ── Difficulty scaling ──
    getSpawnInterval() {
        // ms between ball spawns – decreases with level
        return Math.max(300, 1200 - (this.level - 1) * 120);
    }

    getBallSpeed() {
        return 200 + (this.level - 1) * 30;
    }

    getSimultaneousBalls() {
        return 1 + Math.floor(this.level * 0.6);
    }

    // ── Field markings ──
    drawFieldLines(worldW) {
        const g = this.fieldLines;
        g.lineStyle(2, 0xffffff, 0.35);
        // sidelines
        g.strokeRect(20, FIELD_TOP + 4, worldW - 40, FIELD_H - 8);
        // vertical stripes every 200px
        for (let x = 200; x < worldW; x += 200) {
            g.moveTo(x, FIELD_TOP + 4);
            g.lineTo(x, FIELD_BOT - 4);
            g.strokePath();
        }
        // center circle at each halfway
        for (let x = 0; x < worldW; x += LEVEL_LENGTH) {
            const cx = x + LEVEL_LENGTH / 2;
            g.strokeCircle(cx, GAME_H / 2, 50);
        }
    }

    // ── Fan stands ──
    drawStands(worldW) {
        const topStand = this.add.graphics().setDepth(5);
        const botStand = this.add.graphics().setDepth(5);

        // solid stand color
        topStand.fillStyle(0x882222); topStand.fillRect(0, 0, worldW, STAND_H);
        botStand.fillStyle(0x222288); botStand.fillRect(0, FIELD_BOT, worldW, STAND_H);

        // random fans (colored circles)
        const fanCount = Math.floor(worldW / 8);
        const hsvWheel = Phaser.Display.Color.HSVColorWheel();
        for (let i = 0; i < fanCount; i++) {
            const c = hsvWheel[Phaser.Math.Between(0, 359)].color;
            const x = Phaser.Math.Between(4, worldW - 4);
            topStand.fillStyle(c, 0.7);
            topStand.fillCircle(x, Phaser.Math.Between(10, STAND_H - 6), Phaser.Math.Between(3, 6));
            botStand.fillStyle(c, 0.7);
            botStand.fillCircle(Phaser.Math.Between(4, worldW - 4), Phaser.Math.Between(FIELD_BOT + 6, GAME_H - 6), Phaser.Math.Between(3, 6));
        }

        // stand edge lines
        topStand.lineStyle(3, 0xffffff, 0.5);
        topStand.strokeRect(0, STAND_H - 2, worldW, 2);
        botStand.lineStyle(3, 0xffffff, 0.5);
        botStand.strokeRect(0, FIELD_BOT, worldW, 2);
    }

    // ── Touch controls ──
    setupTouch() {
        this.touchTarget = null;
        this.input.on('pointerdown', (p) => { this.touchTarget = { x: p.worldX, y: p.worldY }; });
        this.input.on('pointermove', (p) => {
            if (p.isDown) this.touchTarget = { x: p.worldX, y: p.worldY };
        });
        this.input.on('pointerup', () => { this.touchTarget = null; });
    }

    // ── HUD ──
    createHUD() {
        const cam = this.cameras.main;

        this.hudLevel = this.add.text(10, STAND_H + 6, `Level ${this.level}`, {
            fontSize: '20px', fontFamily: 'Arial Black, Arial',
            color: '#ffffff', stroke: '#000000', strokeThickness: 4,
        }).setScrollFactor(0).setDepth(100);

        // Progress bar background
        this.hudBarBg = this.add.graphics().setScrollFactor(0).setDepth(100);
        this.hudBarBg.fillStyle(0x000000, 0.5);
        this.hudBarBg.fillRoundedRect(GAME_W / 2 - 120, 6, 240, 16, 4);

        this.hudBarFill = this.add.graphics().setScrollFactor(0).setDepth(101);

        this.hudDistText = this.add.text(GAME_W / 2, 26, '0%', {
            fontSize: '11px', fontFamily: 'Arial', color: '#ffffff',
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(102);
    }

    updateHUD() {
        const pct = Phaser.Math.Clamp(this.distance / LEVEL_LENGTH, 0, 1);
        this.hudBarFill.clear();
        this.hudBarFill.fillStyle(0x44dd66);
        this.hudBarFill.fillRoundedRect(GAME_W / 2 - 118, 8, 236 * pct, 12, 3);
        this.hudDistText.setText(`${Math.floor(pct * 100)}%`);
    }

    // ── Level banner ──
    showLevelBanner() {
        const banner = this.add.text(this.player.x + 320, GAME_H / 2, `Level ${this.level}`, {
            fontSize: '48px', fontFamily: 'Arial Black, Arial',
            color: '#ffff44', stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(200).setScrollFactor(0)
          .setPosition(GAME_W / 2, GAME_H / 2);

        this.tweens.add({
            targets: banner, alpha: 0, scale: 2,
            duration: 1200, ease: 'Power2',
            onComplete: () => banner.destroy(),
        });
    }

    // ── Ball spawning ──
    spawnBall() {
        if (!this.alive) return;

        const count = this.getSimultaneousBalls();
        for (let i = 0; i < count; i++) {
            this.time.delayedCall(i * 80, () => this._launchBall());
        }
    }

    _launchBall() {
        if (!this.alive) return;

        const fromTop = Math.random() < 0.5;
        const speed = this.getBallSpeed();

        // spawn near the player's x position (+/- some range)
        const spawnX = this.player.x + Phaser.Math.Between(-100, 400);
        const spawnY = fromTop ? FIELD_TOP - 8 : FIELD_BOT + 8;

        // target somewhere on the field near the player
        const targetX = this.player.x + Phaser.Math.Between(-60, 200);
        const targetY = Phaser.Math.Between(FIELD_TOP + 20, FIELD_BOT - 20);

        // shadow
        const shadow = this.add.image(spawnX, targetY, 'shadow').setAlpha(0).setDepth(3);
        this.shadows.add(shadow);

        // ball
        const ball = this.physics.add.sprite(spawnX, spawnY, 'ball').setDepth(15);
        ball.body.setCircle(6, 2, 2);
        ball.setData('shadow', shadow);
        ball.setData('landed', false);
        ball.setScale(0.6);

        this.balls.add(ball);

        // arc tween — ball flies in an arc from stands to field
        const flightTime = Phaser.Math.Between(600, 900) / (1 + (this.level - 1) * 0.1);

        // rise phase (ball appears to go up, gets bigger)
        this.tweens.add({
            targets: ball,
            x: targetX,
            y: targetY,
            scale: 1.3,
            duration: flightTime * 0.5,
            ease: 'Sine.easeOut',
            onUpdate: () => {
                shadow.setPosition(
                    Phaser.Math.Linear(spawnX, targetX, this.tweens.getTweensOf(ball)[0]?.progress || 0),
                    targetY
                );
                shadow.setAlpha(0.15);
            },
            onComplete: () => {
                // fall phase (ball comes down, gets smaller to normal)
                this.tweens.add({
                    targets: ball,
                    scale: 1,
                    duration: flightTime * 0.5,
                    ease: 'Sine.easeIn',
                    onUpdate: () => {
                        shadow.setAlpha(0.35);
                    },
                    onComplete: () => {
                        ball.setData('landed', true);
                        shadow.setAlpha(0.3);

                        // ball rolls on field after landing
                        const angle = Phaser.Math.Angle.Between(spawnX, spawnY, targetX, targetY);
                        const rollSpeed = speed * 0.5;
                        ball.body.setVelocity(
                            Math.cos(angle) * rollSpeed,
                            Math.sin(angle) * rollSpeed
                        );

                        // fade out after a delay
                        this.time.delayedCall(1500, () => {
                            if (ball.active) {
                                this.tweens.add({
                                    targets: [ball, shadow],
                                    alpha: 0, duration: 300,
                                    onComplete: () => {
                                        shadow.destroy();
                                        ball.destroy();
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

        // Danger: enable collision body during the descent portion
        // Ball can hit player when it's near field level
        ball.body.enable = true;
    }

    // ── Collision ──
    hitByBall(player, ball) {
        if (!this.alive) return;
        // only collide if ball is within the field area vertically
        if (ball.y < FIELD_TOP + 5 || ball.y > FIELD_BOT - 5) return;

        this.alive = false;

        // effects
        this.hitEmitter.emitParticleAt(player.x, player.y, 20);
        this.cameras.main.shake(300, 0.02);
        player.setTint(0xff0000);

        // stop everything
        this.physics.pause();

        // save high score
        const hi = parseInt(localStorage.getItem('stadiumRunner_hi') || '0');
        if (this.level > hi) localStorage.setItem('stadiumRunner_hi', this.level.toString());

        this.time.delayedCall(800, () => {
            this.scene.start('GameOver', {
                level: this.level,
                distance: Math.floor(this.distance),
                pct: Math.floor((this.distance / LEVEL_LENGTH) * 100),
            });
        });
    }

    // ── Level complete ──
    levelComplete() {
        if (!this.alive) return;
        this.alive = false;

        // celebration
        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(i * 100, () => {
                this.starEmitter.emitParticleAt(
                    this.player.x + Phaser.Math.Between(-30, 30),
                    this.player.y + Phaser.Math.Between(-20, 20),
                    8
                );
            });
        }

        const banner = this.add.text(GAME_W / 2, GAME_H / 2, `Level ${this.level} Complete!`, {
            fontSize: '40px', fontFamily: 'Arial Black, Arial',
            color: '#44ff88', stroke: '#000000', strokeThickness: 5,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.tweens.add({
            targets: banner, scale: { from: 0.5, to: 1.2 },
            duration: 600, ease: 'Back.easeOut',
        });

        // save high score
        const hi = parseInt(localStorage.getItem('stadiumRunner_hi') || '0');
        if (this.level > hi) localStorage.setItem('stadiumRunner_hi', this.level.toString());

        this.time.delayedCall(1800, () => {
            this.scene.start('Game', { level: this.level + 1 });
        });
    }

    // ── Update loop ──
    update(time, delta) {
        if (!this.alive) return;

        const dt = delta / 1000;

        // ── Player movement ──
        let vx = AUTO_SCROLL;
        let vy = 0;

        const left = this.cursors.left.isDown || this.wasd.A.isDown;
        const right = this.cursors.right.isDown || this.wasd.D.isDown;
        const up = this.cursors.up.isDown || this.wasd.W.isDown;
        const down = this.cursors.down.isDown || this.wasd.S.isDown;

        if (left) vx -= PLAYER_SPEED * 0.6;
        if (right) vx += PLAYER_SPEED * 0.7;
        if (up) vy -= PLAYER_SPEED;
        if (down) vy += PLAYER_SPEED;

        // Touch controls
        if (this.touchTarget) {
            const dx = this.touchTarget.x - this.player.x;
            const dy = this.touchTarget.y - this.player.y;
            if (Math.abs(dx) > 10) vx += Phaser.Math.Clamp(dx, -PLAYER_SPEED * 0.6, PLAYER_SPEED * 0.7);
            if (Math.abs(dy) > 10) vy = Phaser.Math.Clamp(dy * 3, -PLAYER_SPEED, PLAYER_SPEED);
        }

        this.player.body.setVelocity(vx, vy);

        // ── Track distance ──
        this.distance += vx * dt;

        // ── Spawn balls ──
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer -= this.spawnInterval;
            this.spawnBall();
        }

        // ── Update shadows to follow balls ──
        this.balls.getChildren().forEach(ball => {
            const sh = ball.getData('shadow');
            if (sh && sh.active) {
                sh.x = ball.x;
            }
        });

        // ── HUD ──
        this.updateHUD();

        // ── Level complete check ──
        if (this.distance >= LEVEL_LENGTH) {
            this.levelComplete();
        }

        // ── Cleanup off-screen balls ──
        this.balls.getChildren().forEach(ball => {
            if (ball.x < this.cameras.main.scrollX - 100 ||
                ball.x > this.cameras.main.scrollX + GAME_W + 200) {
                const sh = ball.getData('shadow');
                if (sh) sh.destroy();
                ball.destroy();
            }
        });
    }
}

// ── Game Over Scene ────────────────────────────────────────────────
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOver'); }

    init(data) {
        this.level = data.level || 1;
        this.pct = data.pct || 0;
    }

    create() {
        this.cameras.main.setBackgroundColor('#220000');

        // dark overlay
        const g = this.add.graphics();
        g.fillStyle(0x000000, 0.7);
        g.fillRect(0, 0, GAME_W, GAME_H);

        // Game over text
        this.add.text(GAME_W / 2, 100, 'GAME OVER', {
            fontSize: '52px', fontFamily: 'Arial Black, Arial',
            color: '#ff4444', stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5);

        // ball hit icon
        this.add.image(GAME_W / 2, 175, 'ball').setScale(3);

        // Stats
        this.add.text(GAME_W / 2, 240, `Level: ${this.level}`, {
            fontSize: '28px', fontFamily: 'Arial', color: '#ffffff',
        }).setOrigin(0.5);

        this.add.text(GAME_W / 2, 275, `Distance: ${this.pct}%`, {
            fontSize: '22px', fontFamily: 'Arial', color: '#cccccc',
        }).setOrigin(0.5);

        const hi = localStorage.getItem('stadiumRunner_hi') || 0;
        this.add.text(GAME_W / 2, 320, `Best: Level ${hi}`, {
            fontSize: '22px', fontFamily: 'Arial', color: '#ffdd44',
        }).setOrigin(0.5);

        // Retry prompt
        const prompt = this.add.text(GAME_W / 2, 410, 'Press SPACE to Retry', {
            fontSize: '24px', fontFamily: 'Arial', color: '#ffffff',
        }).setOrigin(0.5);

        this.tweens.add({
            targets: prompt, alpha: 0.2,
            duration: 600, yoyo: true, repeat: -1,
        });

        // Input — slight delay to prevent accidental skip
        this.time.delayedCall(500, () => {
            this.input.keyboard.once('keydown-SPACE', () => this.scene.start('Game', { level: 1 }));
            this.input.once('pointerdown', () => this.scene.start('Game', { level: 1 }));
        });
    }
}

// ── Phaser Config ──────────────────────────────────────────────────
const config = {
    type: Phaser.AUTO,
    width: GAME_W,
    height: GAME_H,
    parent: document.body,
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: { debug: false },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, TitleScene, GameScene, GameOverScene],
};

const game = new Phaser.Game(config);
