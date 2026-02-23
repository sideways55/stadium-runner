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

// ── Sound FX (Web Audio synthesis) ─────────────────────────────────
class SoundFX {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio not available');
        }
    }

    ensure() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    // short percussive kick sound
    kick() {
        this.ensure();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        // thwack — noise burst + low thump
        const g = this.ctx.createGain();
        g.connect(this.ctx.destination);
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + 0.15);

        // click layer
        const g2 = this.ctx.createGain();
        g2.connect(this.ctx.destination);
        g2.gain.setValueAtTime(0.3, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(800, t);
        osc2.frequency.exponentialRampToValueAtTime(200, t + 0.06);
        osc2.connect(g2);
        osc2.start(t);
        osc2.stop(t + 0.06);
    }

    // getting hit — harsh buzz
    hit() {
        this.ensure();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        const g = this.ctx.createGain();
        g.connect(this.ctx.destination);
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + 0.4);

        // noise-like crunch
        const g2 = this.ctx.createGain();
        g2.connect(this.ctx.destination);
        g2.gain.setValueAtTime(0.2, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(90, t);
        osc2.connect(g2);
        osc2.start(t);
        osc2.stop(t + 0.2);
    }

    // ball landing — soft bounce thud
    bounce() {
        this.ensure();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        const g = this.ctx.createGain();
        g.connect(this.ctx.destination);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    // whoosh — ball incoming
    whoosh() {
        this.ensure();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        // filtered noise via oscillator detuning
        const g = this.ctx.createGain();
        g.connect(this.ctx.destination);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.08, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.25);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + 0.25);
    }

    // level complete — ascending arpeggio
    levelUp() {
        this.ensure();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const g = this.ctx.createGain();
            g.connect(this.ctx.destination);
            const start = t + i * 0.12;
            g.gain.setValueAtTime(0.2, start);
            g.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            osc.connect(g);
            osc.start(start);
            osc.stop(start + 0.3);
        });
    }

    // menu select — quick blip
    select() {
        this.ensure();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        const g = this.ctx.createGain();
        g.connect(this.ctx.destination);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1100, t + 0.04);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    // goal scored — big celebration chord
    goal() {
        this.ensure();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        const notes = [261, 329, 392, 523, 659]; // C4-E5 chord spread

        notes.forEach((freq, i) => {
            const g = this.ctx.createGain();
            g.connect(this.ctx.destination);
            const start = t + i * 0.06;
            g.gain.setValueAtTime(0.25, start);
            g.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            osc.connect(g);
            osc.start(start);
            osc.stop(start + 0.6);
        });
    }

    // tackle — short harsh thud
    tackle() {
        this.ensure();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        const g = this.ctx.createGain();
        g.connect(this.ctx.destination);
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + 0.25);
    }

    // skill move — quick swoosh
    skill() {
        this.ensure();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        const g = this.ctx.createGain();
        g.connect(this.ctx.destination);
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(900, t + 0.1);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.18);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + 0.18);
    }

    // points scored — cheerful ding
    points() {
        this.ensure();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        const g = this.ctx.createGain();
        g.connect(this.ctx.destination);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        osc.connect(g);
        osc.start(t);
        osc.stop(t + 0.2);
    }
}

const sfx = new SoundFX();

// ── Boot Scene ─────────────────────────────────────────────────────
class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }

    create() {
        sfx.init();
        this.generateTextures();
        this.scene.start('Title');
    }

    generateTextures() {
        // — Player: kick ready (bright jersey with glow outline) —
        const pg = this.make.graphics({ add: false });
        pg.fillStyle(0x44aaff, 0.3);
        pg.fillRoundedRect(0, 0, 28, 36, 6);   // glow outline
        pg.fillStyle(0x2255ff);
        pg.fillRoundedRect(2, 2, 24, 32, 4);
        pg.fillStyle(0xffcc88);
        pg.fillCircle(14, 8, 7);         // head
        pg.fillStyle(0xff4444);
        pg.fillRect(7, 16, 14, 10);      // jersey
        pg.fillStyle(0x222222);
        pg.fillRect(7, 26, 6, 8);        // left leg
        pg.fillRect(15, 26, 6, 8);       // right leg
        pg.generateTexture('player_ready', 28, 36);
        pg.destroy();

        // — Player: cooldown (dimmer jersey, no glow) —
        const pc = this.make.graphics({ add: false });
        pc.fillStyle(0x1a1a44);
        pc.fillRoundedRect(2, 2, 24, 32, 4);
        pc.fillStyle(0xddbb88);
        pc.fillCircle(14, 8, 7);         // head
        pc.fillStyle(0x993333);
        pc.fillRect(7, 16, 14, 10);      // jersey (dimmer)
        pc.fillStyle(0x222222);
        pc.fillRect(7, 26, 6, 8);        // left leg
        pc.fillRect(15, 26, 6, 8);       // right leg
        pc.generateTexture('player_cooldown', 28, 36);
        pc.destroy();

        // — Player: kicking (right leg extended out) —
        const pk = this.make.graphics({ add: false });
        pk.fillStyle(0x44ff88, 0.4);
        pk.fillRoundedRect(0, 0, 36, 36, 6);   // kick glow
        pk.fillStyle(0x2255ff);
        pk.fillRoundedRect(2, 2, 24, 32, 4);
        pk.fillStyle(0xffcc88);
        pk.fillCircle(14, 8, 7);         // head
        pk.fillStyle(0xff4444);
        pk.fillRect(7, 16, 14, 10);      // jersey
        pk.fillStyle(0x222222);
        pk.fillRect(7, 26, 6, 8);        // left leg (standing)
        pk.fillStyle(0x333333);
        pk.fillRect(20, 22, 14, 5);      // right leg extended out
        pk.fillStyle(0xffffff);
        pk.fillRect(32, 21, 4, 7);       // shoe/foot
        pk.generateTexture('player_kick', 38, 36);
        pk.destroy();

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

        // — Defender (red jersey) —
        const dg = this.make.graphics({ add: false });
        dg.fillStyle(0x441111);
        dg.fillRoundedRect(2, 2, 24, 32, 4);
        dg.fillStyle(0xddbb88);
        dg.fillCircle(14, 8, 7);         // head
        dg.fillStyle(0xdd2222);
        dg.fillRect(7, 16, 14, 10);      // red jersey
        dg.fillStyle(0x222222);
        dg.fillRect(7, 26, 6, 8);
        dg.fillRect(15, 26, 6, 8);
        dg.generateTexture('defender', 28, 36);
        dg.destroy();

        // — Goalkeeper (yellow jersey, gloves) —
        const gk = this.make.graphics({ add: false });
        gk.fillStyle(0x444411);
        gk.fillRoundedRect(2, 2, 24, 32, 4);
        gk.fillStyle(0xddbb88);
        gk.fillCircle(14, 8, 7);         // head
        gk.fillStyle(0xeecc00);
        gk.fillRect(7, 16, 14, 10);      // yellow jersey
        gk.fillStyle(0x44ff44);
        gk.fillRect(3, 18, 5, 6);        // left glove
        gk.fillRect(20, 18, 5, 6);       // right glove
        gk.fillStyle(0x222222);
        gk.fillRect(7, 26, 6, 8);
        gk.fillRect(15, 26, 6, 8);
        gk.generateTexture('goalkeeper', 28, 36);
        gk.destroy();

        // — Dribble player (blue, no kick states needed) —
        const dp = this.make.graphics({ add: false });
        dp.fillStyle(0x2255ff);
        dp.fillRoundedRect(2, 2, 24, 32, 4);
        dp.fillStyle(0xffcc88);
        dp.fillCircle(14, 8, 7);
        dp.fillStyle(0x4488ff);
        dp.fillRect(7, 16, 14, 10);
        dp.fillStyle(0x222222);
        dp.fillRect(7, 26, 6, 8);
        dp.fillRect(15, 26, 6, 8);
        dp.generateTexture('dribble_player', 28, 36);
        dp.destroy();

        // — Goal post —
        const gp = this.make.graphics({ add: false });
        gp.fillStyle(0xffffff);
        gp.fillRect(0, 0, 10, 120);      // left post
        gp.fillRect(0, 0, 40, 8);        // crossbar top
        gp.fillRect(0, 112, 40, 8);      // crossbar bottom
        gp.fillStyle(0xcccccc, 0.3);
        gp.fillRect(10, 8, 30, 104);     // net
        // net lines
        gp.lineStyle(1, 0xaaaaaa, 0.4);
        for (let ny = 18; ny < 112; ny += 12) {
            gp.moveTo(10, ny); gp.lineTo(40, ny); gp.strokePath();
        }
        for (let nx = 18; nx < 40; nx += 10) {
            gp.moveTo(nx, 8); gp.lineTo(nx, 112); gp.strokePath();
        }
        gp.generateTexture('goal', 40, 120);
        gp.destroy();
    }
}

// ── Title Scene (Mode Select) ─────────────────────────────────────
class TitleScene extends Phaser.Scene {
    constructor() { super('Title'); }

    create() {
        this.cameras.main.setBackgroundColor('#1a472a');
        this.drawMiniStadium();

        // Title
        this.add.text(GAME_W / 2, 70, 'STADIUM RUNNER', {
            fontSize: '52px', fontFamily: 'Arial Black, Arial',
            color: '#ffffff', stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5);

        this.add.text(GAME_W / 2, 130, 'Choose a Game Mode', {
            fontSize: '20px', fontFamily: 'Arial', color: '#ccffcc',
        }).setOrigin(0.5);

        // Mode buttons
        this.selected = 0;
        const btnStyle = { fontSize: '22px', fontFamily: 'Arial Black, Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 5 };
        const descStyle = { fontSize: '11px', fontFamily: 'Arial', color: '#aaddaa', align: 'center' };

        this.modeBtns = [];
        this.modeDescs = [];

        const modeX = [GAME_W / 2 - 260, GAME_W / 2, GAME_W / 2 + 260];
        const names = ['Dodgeball', 'Dribble', 'Penalties'];
        const descs = [
            'Run through the stadium\ndodging soccer balls\nSPACE to kick them back',
            'Dribble past defenders\nand score a goal\nMore defenders each level',
            'Penalty shootout!\nShoot then save\nBest of 5 rounds',
        ];

        const hiDodge = localStorage.getItem('stadiumRunner_hiScore') || 0;
        const hiDribble = localStorage.getItem('dribble_hiLevel') || 0;
        const hiPen = localStorage.getItem('penalty_hiScore') || 0;
        const hiLabels = [`Best: ${hiDodge} pts`, `Best: Level ${hiDribble}`, `Best: ${hiPen} pts`];

        for (let i = 0; i < 3; i++) {
            this.modeBtns.push(this.add.text(modeX[i], 210, names[i], btnStyle).setOrigin(0.5));
            this.modeDescs.push(this.add.text(modeX[i], 245, descs[i], descStyle).setOrigin(0.5));
            this.add.text(modeX[i], 290, hiLabels[i], { fontSize: '13px', fontFamily: 'Arial', color: '#ffdd44' }).setOrigin(0.5);
        }

        // Controls hint
        this.add.text(GAME_W / 2, 400, 'Arrow Keys / WASD to move  |  Touch & drag on mobile', {
            fontSize: '14px', fontFamily: 'Arial', color: '#88aa88',
        }).setOrigin(0.5);

        // Blink prompt
        const prompt = this.add.text(GAME_W / 2, 440, 'Left / Right to choose, SPACE to start', {
            fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
        }).setOrigin(0.5);
        this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

        this.updateModeSelection();

        // Input
        this.input.keyboard.on('keydown-LEFT', () => { this.selected = Math.max(0, this.selected - 1); this.updateModeSelection(); });
        this.input.keyboard.on('keydown-RIGHT', () => { this.selected = Math.min(2, this.selected + 1); this.updateModeSelection(); });
        this.input.keyboard.on('keydown-A', () => { this.selected = Math.max(0, this.selected - 1); this.updateModeSelection(); });
        this.input.keyboard.on('keydown-D', () => { this.selected = Math.min(2, this.selected + 1); this.updateModeSelection(); });
        this.input.keyboard.on('keydown-SPACE', () => this.startGame());

        this.modeBtns.forEach((btn, i) => {
            btn.setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => { this.selected = i; this.startGame(); });
        });
    }

    updateModeSelection() {
        this.modeBtns.forEach((btn, i) => {
            btn.setColor(i === this.selected ? '#44ff88' : '#888888');
            btn.setScale(i === this.selected ? 1.15 : 1);
        });
    }

    drawMiniStadium() {
        const g = this.add.graphics();
        g.fillStyle(0x993333); g.fillRect(0, 0, GAME_W, STAND_H);
        g.fillStyle(0x333399); g.fillRect(0, GAME_H - STAND_H, GAME_W, STAND_H);
        g.fillStyle(0x2d8a4e); g.fillRect(0, STAND_H, GAME_W, FIELD_H);
        for (let i = 0; i < 40; i++) {
            const c = Phaser.Display.Color.HSVColorWheel()[Phaser.Math.Between(0, 359)];
            g.fillStyle(c.color, 0.6);
            g.fillCircle(Phaser.Math.Between(20, GAME_W - 20), Phaser.Math.Between(8, STAND_H - 8), 5);
            g.fillCircle(Phaser.Math.Between(20, GAME_W - 20), Phaser.Math.Between(GAME_H - STAND_H + 8, GAME_H - 8), 5);
        }
    }

    startGame() {
        sfx.select();
        if (this.selected === 0) {
            this.scene.start('Game', { level: 1 });
        } else if (this.selected === 1) {
            this.scene.start('Dribble', { level: 1 });
        } else {
            this.scene.start('Penalty', { round: 1, playerGoals: 0, cpuGoals: 0, score: 0 });
        }
    }
}

// ── Game Scene ─────────────────────────────────────────────────────
class GameScene extends Phaser.Scene {
    constructor() { super('Game'); }

    init(data) {
        this.level = data.level || 1;
        this.score = data.score || 0;
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
        this.player = this.physics.add.sprite(80, GAME_H / 2, 'player_ready')
            .setDepth(10).setCollideWorldBounds(true);
        this.player.body.setSize(18, 26).setOffset(5, 8);
        this.kickAnimTimer = 0;

        // ── Kick-ready ring ──
        this.kickRing = this.add.graphics().setDepth(9);
        this.kickRingPulse = 0;

        // ── Camera follow ──
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // ── Balls group ──
        this.balls = this.physics.add.group();
        this.shadows = this.add.group();

        // ── Kicked balls group ──
        this.kickedBalls = this.physics.add.group();

        // ── Collision ──
        this.physics.add.overlap(this.player, this.balls, this.hitByBall, null, this);

        // ── Controls ──
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.kickKey = this.input.keyboard.addKey('SPACE');
        this.kickCooldown = 0;
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
        return Math.max(400, 1400 - (this.level - 1) * 100);
    }

    getBallSpeed() {
        return 10 + (this.level - 1) * 8;
    }

    getSimultaneousBalls() {
        return 1 + Math.floor(this.level * 0.5);
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

        // Score display
        this.hudScore = this.add.text(GAME_W - 10, STAND_H + 6, `Score: ${this.score}`, {
            fontSize: '20px', fontFamily: 'Arial Black, Arial',
            color: '#ffdd44', stroke: '#000000', strokeThickness: 4,
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

        // Kick hint
        this.add.text(GAME_W / 2, GAME_H - STAND_H + 6, 'SPACE to kick', {
            fontSize: '12px', fontFamily: 'Arial',
            color: '#aaaaaa',
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
    }

    updateHUD() {
        const pct = Phaser.Math.Clamp(this.distance / LEVEL_LENGTH, 0, 1);
        this.hudBarFill.clear();
        this.hudBarFill.fillStyle(0x44dd66);
        this.hudBarFill.fillRoundedRect(GAME_W / 2 - 118, 8, 236 * pct, 12, 3);
        this.hudDistText.setText(`${Math.floor(pct * 100)}%`);
        this.hudScore.setText(`Score: ${this.score}`);
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
        sfx.whoosh();

        // arc tween — consistent flight time per level
        const flightTime = 2200 / (1 + (this.level - 1) * 0.05);

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
                        sfx.bounce();

                        // ball rolls on field after landing
                        const angle = Phaser.Math.Angle.Between(spawnX, spawnY, targetX, targetY);
                        const rollSpeed = speed * 0.35;
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

    // ── Kick mechanic ──
    tryKick() {
        if (!this.alive || this.kickCooldown > 0) return;

        this.kickCooldown = 300; // ms cooldown

        const kickRange = 40;
        const playerX = this.player.x;
        const playerY = this.player.y;

        let kicked = false;
        this.balls.getChildren().slice().forEach(ball => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, ball.x, ball.y);
            if (dist < kickRange) {
                kicked = true;
                // remove from dangerous balls
                this.balls.remove(ball);

                // stop any tweens on this ball
                this.tweens.killTweensOf(ball);

                // kick it away from the player toward the stands
                const kickAngle = Phaser.Math.Angle.Between(playerX, playerY, ball.x, ball.y);
                const kickSpeed = 300;
                ball.body.setVelocity(
                    Math.cos(kickAngle) * kickSpeed,
                    Math.sin(kickAngle) * kickSpeed
                );
                ball.setTint(0x44ff44);
                this.kickedBalls.add(ball);

                // points!
                const points = 10 * this.level;
                this.score += points;
                this.showFloatingScore(ball.x, ball.y, points);
                sfx.points();

                // particle burst
                this.starEmitter.emitParticleAt(ball.x, ball.y, 6);

                // fade out kicked ball
                this.time.delayedCall(600, () => {
                    if (ball.active) {
                        const sh = ball.getData('shadow');
                        if (sh) sh.destroy();
                        this.tweens.add({
                            targets: ball, alpha: 0, duration: 200,
                            onComplete: () => ball.destroy(),
                        });
                    }
                });
            }
        });

        if (kicked) {
            sfx.kick();
            this.kickAnimTimer = 150; // show kick pose for 150ms
            this.cameras.main.shake(80, 0.005);
        }
    }

    showFloatingScore(x, y, points) {
        const txt = this.add.text(x, y, `+${points}`, {
            fontSize: '22px', fontFamily: 'Arial Black, Arial',
            color: '#ffff00', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(150);

        this.tweens.add({
            targets: txt, y: y - 50, alpha: 0,
            duration: 800, ease: 'Power2',
            onComplete: () => txt.destroy(),
        });
    }

    // ── Collision ──
    hitByBall(player, ball) {
        if (!this.alive) return;
        // only collide if ball is within the field area vertically
        if (ball.y < FIELD_TOP + 5 || ball.y > FIELD_BOT - 5) return;

        this.alive = false;
        sfx.hit();

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
                score: this.score,
                mode: 'Game',
            });
        });
    }

    // ── Level complete ──
    levelComplete() {
        if (!this.alive) return;
        this.alive = false;
        sfx.levelUp();

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
            this.scene.start('Game', { level: this.level + 1, score: this.score });
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

        // ── Kick ──
        this.kickCooldown = Math.max(0, this.kickCooldown - delta);
        this.kickAnimTimer = Math.max(0, this.kickAnimTimer - delta);
        if (Phaser.Input.Keyboard.JustDown(this.kickKey)) {
            this.tryKick();
        }

        // ── Player texture swap + kick ring ──
        this.kickRing.clear();
        if (this.kickAnimTimer > 0) {
            this.player.setTexture('player_kick');
        } else if (this.kickCooldown > 0) {
            this.player.setTexture('player_cooldown');
        } else {
            this.player.setTexture('player_ready');
            // pulsing ring when kick is ready
            this.kickRingPulse += delta * 0.006;
            const pulse = 0.5 + 0.5 * Math.sin(this.kickRingPulse);
            const radius = 22 + pulse * 6;
            this.kickRing.lineStyle(2.5, 0x44ffaa, 0.4 + pulse * 0.5);
            this.kickRing.strokeCircle(this.player.x, this.player.y, radius);
            this.kickRing.lineStyle(1.5, 0xffffff, 0.2 + pulse * 0.3);
            this.kickRing.strokeCircle(this.player.x, this.player.y, radius + 4);
        }

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

// ── Dribble Scene ─────────────────────────────────────────────────
class DribbleScene extends Phaser.Scene {
    constructor() { super('Dribble'); }

    init(data) {
        this.level = data.level || 1;
        this.score = data.score || 0;
        this.alive = true;
        this.scored = false;
    }

    create() {
        // ── Field (single screen, no scrolling) ──
        this.cameras.main.setBackgroundColor('#1a472a');

        const fieldG = this.add.graphics().setDepth(0);
        // pitch
        fieldG.fillStyle(0x2d8a4e); fieldG.fillRect(0, FIELD_TOP, GAME_W, FIELD_H);
        fieldG.fillStyle(0x33995a); // alternate stripes
        for (let x = 0; x < GAME_W; x += 80) {
            fieldG.fillRect(x, FIELD_TOP, 40, FIELD_H);
        }

        // stands
        fieldG.fillStyle(0x882222); fieldG.fillRect(0, 0, GAME_W, STAND_H);
        fieldG.fillStyle(0x222288); fieldG.fillRect(0, FIELD_BOT, GAME_W, STAND_H);
        const hsvWheel = Phaser.Display.Color.HSVColorWheel();
        for (let i = 0; i < 60; i++) {
            const c = hsvWheel[Phaser.Math.Between(0, 359)].color;
            fieldG.fillStyle(c, 0.7);
            fieldG.fillCircle(Phaser.Math.Between(10, GAME_W - 10), Phaser.Math.Between(8, STAND_H - 8), Phaser.Math.Between(3, 6));
            fieldG.fillCircle(Phaser.Math.Between(10, GAME_W - 10), Phaser.Math.Between(FIELD_BOT + 6, GAME_H - 8), Phaser.Math.Between(3, 6));
        }

        // field lines
        const lineG = this.add.graphics().setDepth(1);
        lineG.lineStyle(2, 0xffffff, 0.35);
        lineG.strokeRect(20, FIELD_TOP + 4, GAME_W - 40, FIELD_H - 8);
        // center line
        lineG.moveTo(GAME_W / 2, FIELD_TOP + 4); lineG.lineTo(GAME_W / 2, FIELD_BOT - 4); lineG.strokePath();
        lineG.strokeCircle(GAME_W / 2, GAME_H / 2, 50);
        // penalty box right
        lineG.strokeRect(GAME_W - 120, GAME_H / 2 - 70, 100, 140);

        // ── Goal (right side) ──
        this.goalZone = this.add.zone(GAME_W - 20, GAME_H / 2, 30, 120).setOrigin(0.5);
        this.physics.add.existing(this.goalZone, true);
        this.add.image(GAME_W - 20, GAME_H / 2, 'goal').setDepth(2);

        // ── Player ──
        this.player = this.physics.add.sprite(60, GAME_H / 2, 'dribble_player')
            .setDepth(10).setCollideWorldBounds(true);
        this.player.body.setSize(18, 26).setOffset(5, 8);
        this.physics.world.setBounds(20, FIELD_TOP + 8, GAME_W - 40, FIELD_H - 16);

        // ── Dribble ball (follows player, needs physics for goal overlap) ──
        this.dribbleBall = this.physics.add.sprite(this.player.x + 14, this.player.y + 4, 'ball').setDepth(11);
        this.dribbleBall.body.setCircle(6, 2, 2);
        this.dribbleOffset = 0; // oscillates for dribble effect

        // ── Defenders ──
        this.defenders = this.physics.add.group();
        this.spawnDefenders();

        // ── Goalkeeper ──
        this.keeper = this.physics.add.sprite(GAME_W - 50, GAME_H / 2, 'goalkeeper').setDepth(10);
        this.keeper.body.setSize(18, 26).setOffset(5, 8);
        this.keeperDir = 1;
        this.keeperSpeed = 40 + (this.level - 1) * 8;
        this.keeperDiving = false;
        this.keeperDiveTarget = 0;

        // ── Collisions ──
        this.physics.add.overlap(this.player, this.defenders, this.tackled, null, this);
        this.physics.add.overlap(this.player, this.keeper, this.tackled, null, this);
        this.physics.add.overlap(this.dribbleBall, this.goalZone, this.goalScored, null, this);
        this.physics.add.overlap(this.dribbleBall, this.defenders, this.shotBlocked, null, this);
        this.physics.add.overlap(this.dribbleBall, this.keeper, this.shotSaved, null, this);

        // ── Controls ──
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.sprintKey = this.input.keyboard.addKey('SHIFT');
        this.shootKey = this.input.keyboard.addKey('SPACE');
        this.skillKey = this.input.keyboard.addKey('E');
        this.hasBall = true;       // player is dribbling
        this.shotFired = false;    // ball is in flight
        this.charging = false;     // holding space to charge
        this.shotPower = 0;        // 0-100
        this.stamina = 100;
        this.sprinting = false;
        this.skillCooldown = 0;
        this.skillActive = false;
        this.skillTimer = 0;
        this.touchTarget = null;
        this.touchSprinting = false;
        this.input.on('pointerdown', (p) => { this.touchTarget = { x: p.x, y: p.y }; });
        this.input.on('pointermove', (p) => { if (p.isDown) this.touchTarget = { x: p.x, y: p.y }; });
        this.input.on('pointerup', () => { this.touchTarget = null; });

        // ── HUD ──
        this.hudLevel = this.add.text(10, STAND_H + 6, `Level ${this.level}`, {
            fontSize: '20px', fontFamily: 'Arial Black, Arial',
            color: '#ffffff', stroke: '#000000', strokeThickness: 4,
        }).setDepth(100);

        this.hudScore = this.add.text(GAME_W - 10, STAND_H + 6, `Score: ${this.score}`, {
            fontSize: '20px', fontFamily: 'Arial Black, Arial',
            color: '#ffdd44', stroke: '#000000', strokeThickness: 4,
        }).setOrigin(1, 0).setDepth(100);

        this.hudDefenders = this.add.text(GAME_W / 2, STAND_H + 6, `Defenders: ${this.getDefenderCount()}`, {
            fontSize: '16px', fontFamily: 'Arial',
            color: '#ffaaaa', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5, 0).setDepth(100);

        // Stamina bar
        this.add.text(10, GAME_H - STAND_H + 8, 'SPRINT [Shift]  |  SHOOT [Space]  |  SKILL [E]', {
            fontSize: '11px', fontFamily: 'Arial', color: '#aaaaaa',
        }).setDepth(100);
        this.staminaBarBg = this.add.graphics().setDepth(100);
        this.staminaBarBg.fillStyle(0x000000, 0.5);
        this.staminaBarBg.fillRoundedRect(10, GAME_H - STAND_H + 24, 120, 12, 3);
        this.staminaBarFill = this.add.graphics().setDepth(101);

        // Skill cooldown indicator
        this.skillLabel = this.add.text(140, GAME_H - STAND_H + 24, 'E', {
            fontSize: '12px', fontFamily: 'Arial Black, Arial',
            color: '#44ff88', stroke: '#000000', strokeThickness: 2,
        }).setDepth(101);
        this.skillGfx = this.add.graphics().setDepth(100);

        // Shot power bar (drawn above player, only visible while charging)
        this.powerBarGfx = this.add.graphics().setDepth(150);

        // ── Particle emitters ──
        this.hitEmitter = this.add.particles(0, 0, 'particle_red', {
            speed: { min: 80, max: 200 }, scale: { start: 1.5, end: 0 },
            lifespan: 500, blendMode: 'ADD', emitting: false,
        }).setDepth(20);

        this.starEmitter = this.add.particles(0, 0, 'particle_yellow', {
            speed: { min: 50, max: 150 }, scale: { start: 1, end: 0 },
            lifespan: 400, blendMode: 'ADD', emitting: false,
        }).setDepth(20);

        // ── Level banner ──
        const banner = this.add.text(GAME_W / 2, GAME_H / 2, `Level ${this.level}`, {
            fontSize: '48px', fontFamily: 'Arial Black, Arial',
            color: '#ffff44', stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(200);
        this.tweens.add({ targets: banner, alpha: 0, scale: 2, duration: 1200, ease: 'Power2', onComplete: () => banner.destroy() });
    }

    getDefenderCount() {
        return this.level;
    }

    getDefenderSpeed() {
        return 35 + (this.level - 1) * 7;
    }

    spawnDefenders() {
        const count = this.getDefenderCount();
        const spacing = FIELD_H / (count + 1);
        for (let i = 0; i < count; i++) {
            // spread defenders across the right half of the field
            const dx = 200 + Math.random() * (GAME_W - 350);
            const dy = FIELD_TOP + spacing * (i + 1);
            const def = this.physics.add.sprite(dx, dy, 'defender').setDepth(10);
            def.body.setSize(18, 26).setOffset(5, 8);
            def.setData('homeX', dx);
            def.setData('homeY', dy);
            def.setData('chaseRange', 150 + this.level * 15);
            this.defenders.add(def);
        }
    }

    performSkill() {
        if (!this.alive || this.scored || !this.hasBall || this.skillCooldown > 0) return;

        sfx.skill();
        this.skillCooldown = 2000; // 2 second cooldown
        this.skillActive = true;
        this.skillTimer = 350;     // skill lasts 350ms

        // determine juke direction — perpendicular to movement
        const vx = this.player.body.velocity.x;
        const vy = this.player.body.velocity.y;
        // juke sideways relative to movement (or just upward if standing still)
        let jukeX, jukeY;
        if (Math.abs(vx) > 10 || Math.abs(vy) > 10) {
            // perpendicular to velocity
            jukeX = -vy;
            jukeY = vx;
            // pick the side based on which direction key is more recent
            const up = this.cursors.up.isDown || this.wasd.W.isDown;
            const down = this.cursors.down.isDown || this.wasd.S.isDown;
            if (down) { jukeX = -jukeX; jukeY = -jukeY; }
        } else {
            // standing still — juke upward
            jukeX = 0; jukeY = -1;
        }
        // normalize
        const len = Math.sqrt(jukeX * jukeX + jukeY * jukeY) || 1;
        jukeX /= len; jukeY /= len;

        // quick burst movement
        const burstSpeed = 350;
        this.player.body.setVelocity(jukeX * burstSpeed, jukeY * burstSpeed);

        // stun nearby defenders — they freeze and get faked out
        const stunRange = 80;
        this.defenders.getChildren().forEach(def => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, def.x, def.y);
            if (dist < stunRange) {
                def.setData('stunned', true);
                def.setTint(0x888888);
                def.body.setVelocity(0, 0);
                // fake them out — they move the wrong way briefly
                def.body.setVelocity(-jukeX * 60, -jukeY * 60);
                this.time.delayedCall(800, () => {
                    if (def.active) {
                        def.setData('stunned', false);
                        def.clearTint();
                    }
                });
            }
        });

        // also fake out keeper if close enough
        const keeperDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.keeper.x, this.keeper.y);
        if (keeperDist < stunRange) {
            this.keeper.setData('stunned', true);
            this.keeper.setTint(0x888888);
            this.keeper.body.setVelocity(-jukeX * 50, -jukeY * 50);
            this.time.delayedCall(600, () => {
                if (this.keeper.active) {
                    this.keeper.setData('stunned', false);
                    this.keeper.clearTint();
                }
            });
        }

        // particle trail
        for (let i = 0; i < 4; i++) {
            this.time.delayedCall(i * 60, () => {
                this.starEmitter.emitParticleAt(this.player.x, this.player.y, 3);
            });
        }

        // bonus points for juking near a defender
        this.defenders.getChildren().forEach(def => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, def.x, def.y);
            if (dist < stunRange) {
                const pts = 25 * this.level;
                this.score += pts;
                this.showFloatingScore(def.x, def.y, pts);
                sfx.points();
            }
        });
    }

    showFloatingScore(x, y, points) {
        const txt = this.add.text(x, y, `+${points}`, {
            fontSize: '22px', fontFamily: 'Arial Black, Arial',
            color: '#ffff00', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(150);

        this.tweens.add({
            targets: txt, y: y - 50, alpha: 0,
            duration: 800, ease: 'Power2',
            onComplete: () => txt.destroy(),
        });
    }

    shootBall(power) {
        if (!this.hasBall || this.shotFired || !this.alive || this.scored) return;

        this.hasBall = false;
        this.shotFired = true;
        this.charging = false;
        this.shotPower = 0;
        sfx.kick();

        // power: 0-100 → speed: 100-500
        const shotSpeed = 100 + (power / 100) * 400;

        // shoot toward the goal — aim based on player's vertical position
        const goalX = GAME_W - 20;
        // aim at the player's current Y, clamped within the goal posts
        const goalTop = GAME_H / 2 - 52;
        const goalBot = GAME_H / 2 + 52;
        const goalY = Phaser.Math.Clamp(this.player.y, goalTop, goalBot);
        const angle = Phaser.Math.Angle.Between(this.dribbleBall.x, this.dribbleBall.y, goalX, goalY);

        this.dribbleBall.body.setVelocity(
            Math.cos(angle) * shotSpeed,
            Math.sin(angle) * shotSpeed
        );

        // tint based on power
        if (power > 75) {
            this.dribbleBall.setTint(0xff4444); // red = power shot
        } else if (power > 40) {
            this.dribbleBall.setTint(0xffffaa); // yellow = decent
        } else {
            this.dribbleBall.setTint(0xaaaaaa); // grey = weak
        }

        // if it goes off-screen or too far, it's a miss
        this.time.delayedCall(3000, () => {
            if (this.shotFired && this.alive && !this.scored) {
                this.shotMissed();
            }
        });
    }

    shotBlocked(ball, defender) {
        if (!this.shotFired || !this.alive || this.scored) return;
        this.shotFired = false;
        sfx.tackle();

        // ball bounces off defender
        this.dribbleBall.body.setVelocity(0, 0);
        this.dribbleBall.setTint(0xff4444);
        this.hitEmitter.emitParticleAt(ball.x, ball.y, 10);
        this.cameras.main.shake(150, 0.01);

        // ball lost — give player a moment then game over
        this.alive = false;
        this.physics.pause();

        const txt = this.add.text(GAME_W / 2, GAME_H / 2, 'BLOCKED!', {
            fontSize: '40px', fontFamily: 'Arial Black, Arial',
            color: '#ff6644', stroke: '#000000', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(200);

        this.time.delayedCall(1200, () => {
            this.scene.start('GameOver', {
                level: this.level, score: this.score, mode: 'Dribble',
            });
        });
    }

    shotMissed() {
        if (!this.alive || this.scored) return;
        this.shotFired = false;
        this.alive = false;
        sfx.hit();
        this.physics.pause();

        this.dribbleBall.body.setVelocity(0, 0);

        const txt = this.add.text(GAME_W / 2, GAME_H / 2, 'MISSED!', {
            fontSize: '40px', fontFamily: 'Arial Black, Arial',
            color: '#ff6644', stroke: '#000000', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(200);

        this.time.delayedCall(1200, () => {
            this.scene.start('GameOver', {
                level: this.level, score: this.score, mode: 'Dribble',
            });
        });
    }

    shotSaved(ball, keeper) {
        if (!this.shotFired || !this.alive || this.scored) return;
        this.shotFired = false;
        this.alive = false;
        sfx.tackle();

        this.dribbleBall.body.setVelocity(0, 0);
        this.dribbleBall.setTint(0xff4444);
        this.hitEmitter.emitParticleAt(keeper.x, keeper.y, 12);
        this.cameras.main.shake(200, 0.015);
        this.physics.pause();

        const txt = this.add.text(GAME_W / 2, GAME_H / 2, 'SAVED!', {
            fontSize: '44px', fontFamily: 'Arial Black, Arial',
            color: '#ffaa00', stroke: '#000000', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(200);

        this.time.delayedCall(1200, () => {
            this.scene.start('GameOver', {
                level: this.level, score: this.score, mode: 'Dribble',
            });
        });
    }

    tackled(player, defender) {
        if (!this.alive || this.scored) return;
        this.alive = false;
        sfx.tackle();

        this.hitEmitter.emitParticleAt(player.x, player.y, 15);
        this.cameras.main.shake(300, 0.02);
        player.setTint(0xff0000);
        this.physics.pause();

        this.time.delayedCall(800, () => {
            this.scene.start('GameOver', {
                level: this.level,
                score: this.score,
                mode: 'Dribble',
            });
        });
    }

    goalScored() {
        if (!this.alive || this.scored) return;
        this.scored = true;
        sfx.goal();

        // celebration
        for (let i = 0; i < 8; i++) {
            this.time.delayedCall(i * 80, () => {
                this.starEmitter.emitParticleAt(
                    GAME_W - 20 + Phaser.Math.Between(-30, 10),
                    GAME_H / 2 + Phaser.Math.Between(-50, 50),
                    10
                );
            });
        }

        const points = 100 * this.level;
        this.score += points;

        const goalTxt = this.add.text(GAME_W / 2, GAME_H / 2, 'GOAL!', {
            fontSize: '60px', fontFamily: 'Arial Black, Arial',
            color: '#44ff88', stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(200);

        const ptsTxt = this.add.text(GAME_W / 2, GAME_H / 2 + 50, `+${points}`, {
            fontSize: '30px', fontFamily: 'Arial Black, Arial',
            color: '#ffff00', stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({ targets: goalTxt, scale: { from: 0.5, to: 1.3 }, duration: 600, ease: 'Back.easeOut' });
        this.tweens.add({ targets: ptsTxt, y: GAME_H / 2 + 30, alpha: 0, duration: 1200, delay: 400 });

        this.physics.pause();

        // save high score
        const hi = parseInt(localStorage.getItem('dribble_hiLevel') || '0');
        if (this.level > hi) localStorage.setItem('dribble_hiLevel', this.level.toString());

        this.time.delayedCall(2000, () => {
            this.scene.start('Dribble', { level: this.level + 1, score: this.score });
        });
    }

    update(time, delta) {
        if (!this.alive || this.scored) return;

        const dt = delta / 1000;

        // ── Sprint & stamina ──
        const moving = this.cursors.left.isDown || this.cursors.right.isDown ||
                        this.cursors.up.isDown || this.cursors.down.isDown ||
                        this.wasd.A.isDown || this.wasd.D.isDown ||
                        this.wasd.W.isDown || this.wasd.S.isDown || this.touchTarget;
        const wantSprint = this.sprintKey.isDown || this.touchSprinting;
        this.sprinting = wantSprint && moving && this.stamina > 0;

        if (this.sprinting) {
            this.stamina = Math.max(0, this.stamina - 40 * dt);
        } else {
            this.stamina = Math.min(100, this.stamina + 20 * dt);
        }

        const speed = this.sprinting ? PLAYER_SPEED * 1.7 : PLAYER_SPEED;

        // ── Player movement ──
        let vx = 0, vy = 0;
        const left = this.cursors.left.isDown || this.wasd.A.isDown;
        const right = this.cursors.right.isDown || this.wasd.D.isDown;
        const up = this.cursors.up.isDown || this.wasd.W.isDown;
        const down = this.cursors.down.isDown || this.wasd.S.isDown;

        if (left) vx -= speed;
        if (right) vx += speed;
        if (up) vy -= speed;
        if (down) vy += speed;

        // Touch
        if (this.touchTarget) {
            const dx = this.touchTarget.x - this.player.x;
            const dy = this.touchTarget.y - this.player.y;
            if (Math.abs(dx) > 10) vx = Phaser.Math.Clamp(dx * 3, -speed, speed);
            if (Math.abs(dy) > 10) vy = Phaser.Math.Clamp(dy * 3, -speed, speed);
        }

        // normalize diagonal
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.body.setVelocity(vx, vy);

        // sprint tint
        if (this.skillActive) {
            this.player.setTint(0xffff44);
        } else if (this.sprinting) {
            this.player.setTint(0x88ccff);
        } else {
            this.player.clearTint();
        }

        // ── Skill move ──
        this.skillCooldown = Math.max(0, this.skillCooldown - delta);
        this.skillTimer = Math.max(0, this.skillTimer - delta);
        if (this.skillTimer <= 0) this.skillActive = false;

        if (Phaser.Input.Keyboard.JustDown(this.skillKey)) {
            this.performSkill();
        }

        // ── Skill cooldown indicator ──
        this.skillGfx.clear();
        if (this.skillCooldown > 0) {
            this.skillLabel.setColor('#666666');
            // draw cooldown sweep
            const cdPct = this.skillCooldown / 2000;
            this.skillGfx.fillStyle(0x000000, 0.5);
            this.skillGfx.fillRoundedRect(138, GAME_H - STAND_H + 22, 18, 16, 3);
            this.skillGfx.fillStyle(0x666666, 0.5);
            this.skillGfx.fillRoundedRect(138, GAME_H - STAND_H + 22 + 16 * (1 - cdPct), 18, 16 * cdPct, 3);
        } else {
            this.skillLabel.setColor('#44ff88');
            this.skillGfx.fillStyle(0x44ff88, 0.2);
            this.skillGfx.fillRoundedRect(138, GAME_H - STAND_H + 22, 18, 16, 3);
        }

        // ── Shoot (hold to charge, release to fire) ──
        if (this.hasBall && !this.shotFired) {
            if (this.shootKey.isDown) {
                if (!this.charging) {
                    this.charging = true;
                    this.shotPower = 0;
                }
                this.shotPower = Math.min(100, this.shotPower + 80 * dt);
            } else if (this.charging) {
                // released — fire!
                this.shootBall(this.shotPower);
            }
        }

        // ── Power bar (drawn above player while charging) ──
        this.powerBarGfx.clear();
        if (this.charging && this.hasBall) {
            const barW = 40;
            const barH = 6;
            const bx = this.player.x - barW / 2;
            const by = this.player.y - 28;
            const pct = this.shotPower / 100;

            // background
            this.powerBarGfx.fillStyle(0x000000, 0.6);
            this.powerBarGfx.fillRoundedRect(bx - 1, by - 1, barW + 2, barH + 2, 2);

            // fill — green → yellow → red
            let color;
            if (pct < 0.4) color = 0x44dd66;
            else if (pct < 0.75) color = 0xdddd44;
            else color = 0xff3333;
            this.powerBarGfx.fillStyle(color);
            this.powerBarGfx.fillRoundedRect(bx, by, barW * pct, barH, 2);

            // white border
            this.powerBarGfx.lineStyle(1, 0xffffff, 0.5);
            this.powerBarGfx.strokeRoundedRect(bx - 1, by - 1, barW + 2, barH + 2, 2);

            // aim line — dotted line from ball to goal target
            const aimGoalTop = GAME_H / 2 - 52;
            const aimGoalBot = GAME_H / 2 + 52;
            const aimY = Phaser.Math.Clamp(this.player.y, aimGoalTop, aimGoalBot);
            this.powerBarGfx.lineStyle(2, 0xffffff, 0.35);
            const dashLen = 8;
            const gapLen = 6;
            const sx = this.dribbleBall.x;
            const sy = this.dribbleBall.y;
            const ex = GAME_W - 20;
            const ey = aimY;
            const totalDist = Phaser.Math.Distance.Between(sx, sy, ex, ey);
            const dx = (ex - sx) / totalDist;
            const dy = (ey - sy) / totalDist;
            let d = 0;
            while (d < totalDist) {
                const x1 = sx + dx * d;
                const y1 = sy + dy * d;
                const seg = Math.min(dashLen, totalDist - d);
                const x2 = sx + dx * (d + seg);
                const y2 = sy + dy * (d + seg);
                this.powerBarGfx.moveTo(x1, y1);
                this.powerBarGfx.lineTo(x2, y2);
                this.powerBarGfx.strokePath();
                d += dashLen + gapLen;
            }
            // aim crosshair at target
            this.powerBarGfx.lineStyle(2, 0xff4444, 0.6);
            this.powerBarGfx.strokeCircle(ex, ey, 8);
            this.powerBarGfx.moveTo(ex - 12, ey); this.powerBarGfx.lineTo(ex + 12, ey); this.powerBarGfx.strokePath();
            this.powerBarGfx.moveTo(ex, ey - 12); this.powerBarGfx.lineTo(ex, ey + 12); this.powerBarGfx.strokePath();
        }

        // ── Dribble ball follows player (only while holding) ──
        if (this.hasBall) {
            this.dribbleOffset += delta * 0.008;
            const bobX = Math.sin(this.dribbleOffset) * 3;
            const bobY = Math.cos(this.dribbleOffset * 1.5) * 2;
            const facing = vx >= 0 ? 1 : -1;
            this.dribbleBall.setPosition(
                this.player.x + facing * 14 + bobX,
                this.player.y + 6 + bobY
            );
        }

        // ── Defender AI ──
        const defSpeed = this.getDefenderSpeed();
        this.defenders.getChildren().forEach(def => {
            if (def.getData('stunned')) return; // skip stunned defenders

            const dist = Phaser.Math.Distance.Between(def.x, def.y, this.player.x, this.player.y);
            const chaseRange = def.getData('chaseRange');

            if (dist < chaseRange) {
                const angle = Phaser.Math.Angle.Between(def.x, def.y, this.player.x, this.player.y);
                def.body.setVelocity(
                    Math.cos(angle) * defSpeed,
                    Math.sin(angle) * defSpeed
                );
            } else {
                const homeX = def.getData('homeX');
                const homeY = def.getData('homeY');
                const homeDist = Phaser.Math.Distance.Between(def.x, def.y, homeX, homeY);
                if (homeDist > 5) {
                    const angle = Phaser.Math.Angle.Between(def.x, def.y, homeX, homeY);
                    def.body.setVelocity(
                        Math.cos(angle) * defSpeed * 0.4,
                        Math.sin(angle) * defSpeed * 0.4
                    );
                } else {
                    def.body.setVelocity(0, 0);
                }
            }
        });

        // ── Goalkeeper AI — stands still, dives slowly when shot is fired ──
        if (!this.keeper.getData('stunned')) {
            if (this.shotFired) {
                if (!this.keeperDiving) {
                    this.keeperDiving = true;
                    this.keeperDiveTarget = this.dribbleBall.y + Phaser.Math.Between(-20, 20);
                }
                const diff = this.keeperDiveTarget - this.keeper.y;
                const diveSpeed = 30 + (this.level - 1) * 5;
                if (Math.abs(diff) > 4) {
                    this.keeper.body.setVelocityY(diff > 0 ? diveSpeed : -diveSpeed);
                } else {
                    this.keeper.body.setVelocityY(0);
                }
            } else {
                this.keeperDiving = false;
                this.keeper.body.setVelocityY(0);
            }
        }

        // ── HUD ──
        this.hudScore.setText(`Score: ${this.score}`);

        // stamina bar
        this.staminaBarFill.clear();
        const pct = this.stamina / 100;
        const barColor = this.stamina < 20 ? 0xff4444 : (this.sprinting ? 0x44aaff : 0x44dd66);
        this.staminaBarFill.fillStyle(barColor);
        this.staminaBarFill.fillRoundedRect(12, GAME_H - STAND_H + 26, 116 * pct, 8, 2);
    }
}

// ── Penalty Shootout Scene ─────────────────────────────────────────
class PenaltyScene extends Phaser.Scene {
    constructor() { super('Penalty'); }

    init(data) {
        this.round = data.round || 1;
        this.playerGoals = data.playerGoals || 0;
        this.cpuGoals = data.cpuGoals || 0;
        this.score = data.score || 0;
        this.maxRounds = 5;
        // each round: player shoots then player saves
        this.phase = 'shoot'; // 'shoot' or 'save'
        this.done = false;
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a472a');
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.spaceKey = this.input.keyboard.addKey('SPACE');

        // particles
        this.starEmitter = this.add.particles(0, 0, 'particle_yellow', {
            speed: { min: 50, max: 150 }, scale: { start: 1, end: 0 },
            lifespan: 400, blendMode: 'ADD', emitting: false,
        }).setDepth(50);

        this.setupShootPhase();
    }

    // ═══════════════════════════════════════════════════════════════
    // SHOOT PHASE — behind the penalty taker
    // ═══════════════════════════════════════════════════════════════
    setupShootPhase() {
        this.phase = 'shoot';
        this.done = false;
        this.clearScene();

        const g = this.add.graphics().setDepth(0);
        const vpX = GAME_W / 2, vpY = 60;

        // sky / stands behind the goal
        g.fillStyle(0x334466); g.fillRect(0, 0, GAME_W, vpY + 10);

        // fans behind the goal (in the stands)
        const fansG = this.add.graphics().setDepth(1);
        const hsvWheel = Phaser.Display.Color.HSVColorWheel();
        fansG.fillStyle(0x554433, 0.6);
        fansG.fillRect(0, 0, GAME_W, vpY + 5);
        for (let row = 0; row < 3; row++) {
            const rowY = 8 + row * 18;
            for (let i = 0; i < 35; i++) {
                const fx = Phaser.Math.Between(10, GAME_W - 10);
                const fy = rowY + Phaser.Math.Between(-4, 4);
                const c = hsvWheel[Phaser.Math.Between(0, 359)].color;
                fansG.fillStyle(c, 0.6);
                fansG.fillCircle(fx, fy, Phaser.Math.Between(3, 5));
                fansG.fillStyle(c, 0.4);
                fansG.fillRect(fx - 3, fy + 4, 6, 7);
            }
        }

        // pitch — mowed stripe pattern
        g.fillStyle(0x2d8a4e); g.fillRect(0, vpY + 10, GAME_W, GAME_H - vpY - 10);
        for (let row = 0; row < 20; row++) {
            const y = vpY + 10 + row * 25;
            if (row % 2 === 0) {
                g.fillStyle(0x33995a, 0.4);
                g.fillRect(0, y, GAME_W, 25);
            }
        }

        // perspective side lines
        g.lineStyle(2, 0xffffff, 0.3);
        g.moveTo(0, GAME_H); g.lineTo(vpX - 140, vpY + 30); g.strokePath();
        g.moveTo(GAME_W, GAME_H); g.lineTo(vpX + 140, vpY + 30); g.strokePath();

        // penalty box (perspective trapezoid)
        g.lineStyle(2, 0xffffff, 0.25);
        g.beginPath();
        g.moveTo(vpX - 220, GAME_H - 40);
        g.lineTo(vpX - 130, vpY + 35);
        g.lineTo(vpX + 130, vpY + 35);
        g.lineTo(vpX + 220, GAME_H - 40);
        g.closePath();
        g.strokePath();

        // six-yard box
        g.lineStyle(2, 0xffffff, 0.2);
        g.beginPath();
        g.moveTo(vpX - 100, vpY + 90);
        g.lineTo(vpX - 80, vpY + 40);
        g.lineTo(vpX + 80, vpY + 40);
        g.lineTo(vpX + 100, vpY + 90);
        g.closePath();
        g.strokePath();

        // penalty spot
        g.fillStyle(0xffffff, 0.5);
        g.fillCircle(vpX, GAME_H - 90, 3);

        // center circle arc (partial, behind player)
        g.lineStyle(2, 0xffffff, 0.15);
        g.beginPath();
        g.arc(vpX, GAME_H + 60, 80, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
        g.strokePath();

        // goal — net background + mesh + thick white posts
        const goalW = 200, goalH = 70;
        const goalX = vpX - goalW / 2, goalY = vpY;
        g.fillStyle(0x1a1a2a, 0.4);
        g.fillRect(goalX, goalY, goalW, goalH);
        g.lineStyle(1, 0xcccccc, 0.25);
        for (let nx = goalX + 15; nx < goalX + goalW; nx += 15) {
            g.moveTo(nx, goalY); g.lineTo(nx, goalY + goalH); g.strokePath();
        }
        for (let ny = goalY + 12; ny < goalY + goalH; ny += 12) {
            g.moveTo(goalX, ny); g.lineTo(goalX + goalW, ny); g.strokePath();
        }
        g.lineStyle(5, 0xffffff, 0.95);
        g.strokeRect(goalX, goalY, goalW, goalH);

        // store goal bounds for aim mapping
        this.goalBounds = { x: goalX, y: goalY, w: goalW, h: goalH };

        // AI keeper in goal (small, far away)
        this.aiKeeper = this.add.graphics().setDepth(10);
        this.aiKeeper.fillStyle(0xeecc00);
        this.aiKeeper.fillRoundedRect(-8, -14, 16, 28, 3);
        this.aiKeeper.fillStyle(0xddbb88);
        this.aiKeeper.fillCircle(0, -10, 5);
        this.aiKeeper.fillStyle(0x44cc44);
        this.aiKeeper.fillCircle(-8, -2, 3);
        this.aiKeeper.fillCircle(8, -2, 3);
        this.aiKeeper.setPosition(vpX, goalY + goalH / 2 + 5);

        // player (big, bottom of screen — behind view)
        this.shooterGfx = this.add.graphics().setDepth(5);
        // jersey
        this.shooterGfx.fillStyle(0x2255ff);
        this.shooterGfx.fillRoundedRect(-20, -35, 40, 55, 6);
        // head
        this.shooterGfx.fillStyle(0xffcc88);
        this.shooterGfx.fillCircle(0, -30, 12);
        // hair
        this.shooterGfx.fillStyle(0x332211);
        this.shooterGfx.fillRect(-10, -42, 20, 8);
        // shirt detail + number
        this.shooterGfx.fillStyle(0x4488ff);
        this.shooterGfx.fillRect(-15, -15, 30, 20);
        this.shooterGfx.fillStyle(0xffffff, 0.8);
        this.shooterGfx.fillRect(-7, -12, 14, 14);
        this.shooterGfx.fillStyle(0x2255ff);
        this.shooterGfx.fillRect(-5, -10, 10, 10);
        // white shorts
        this.shooterGfx.fillStyle(0xffffff);
        this.shooterGfx.fillRect(-14, 10, 12, 10);
        this.shooterGfx.fillRect(2, 10, 12, 10);
        // dark socks/boots
        this.shooterGfx.fillStyle(0x222222);
        this.shooterGfx.fillRect(-13, 18, 10, 12);
        this.shooterGfx.fillRect(3, 18, 10, 12);
        this.shooterGfx.setPosition(GAME_W / 2, GAME_H - 60);

        // ball at feet
        this.penBall = this.add.image(GAME_W / 2, GAME_H - 25, 'ball').setScale(1.5).setDepth(6);

        // aim crosshair
        this.aimX = vpX;
        this.aimY = goalY + goalH / 2;
        this.aimGfx = this.add.graphics().setDepth(20);

        // power
        this.charging = false;
        this.shotPower = 0;
        this.powerGfx = this.add.graphics().setDepth(20);

        // HUD
        this.createHUD();

        // instructions
        this.phaseLabel = this.add.text(GAME_W / 2, GAME_H - 10, 'Aim with Arrow Keys, hold SPACE to power up', {
            fontSize: '14px', fontFamily: 'Arial', color: '#ccffcc',
        }).setOrigin(0.5).setDepth(100);

        // round banner
        const banner = this.add.text(GAME_W / 2, GAME_H / 2, `Round ${this.round} — Your Shot`, {
            fontSize: '36px', fontFamily: 'Arial Black, Arial',
            color: '#ffff44', stroke: '#000000', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(200);
        this.tweens.add({ targets: banner, alpha: 0, scale: 1.5, duration: 1200, ease: 'Power2', onComplete: () => banner.destroy() });
    }

    // ═══════════════════════════════════════════════════════════════
    // SAVE PHASE — inside the net, looking out
    // ═══════════════════════════════════════════════════════════════
    setupSavePhase() {
        this.phase = 'save';
        this.done = false;
        this.clearScene();

        const g = this.add.graphics().setDepth(0);

        // view from inside the net — field stretches out with perspective
        // sky / far stand at top
        g.fillStyle(0x334466); g.fillRect(0, 0, GAME_W, GAME_H * 0.2);

        // far-side fans (top of screen, behind the pitch)
        const farFansG = this.add.graphics().setDepth(1);
        const hsvWheel = Phaser.Display.Color.HSVColorWheel();
        farFansG.fillStyle(0x554433, 0.5);
        farFansG.fillRect(0, 0, GAME_W, GAME_H * 0.2);
        for (let row = 0; row < 2; row++) {
            const rowY = GAME_H * 0.05 + row * 22;
            for (let i = 0; i < 30; i++) {
                const fx = Phaser.Math.Between(20, GAME_W - 20);
                const fy = rowY + Phaser.Math.Between(-5, 5);
                const c = hsvWheel[Phaser.Math.Between(0, 359)].color;
                farFansG.fillStyle(c, 0.45);
                farFansG.fillCircle(fx, fy, Phaser.Math.Between(3, 5));
                farFansG.fillStyle(c, 0.3);
                farFansG.fillRect(fx - 3, fy + 4, 6, 6);
            }
        }

        // pitch
        g.fillStyle(0x2d8a4e); g.fillRect(0, GAME_H * 0.2, GAME_W, GAME_H * 0.8);
        // mow stripes
        for (let row = 0; row < 14; row++) {
            const y = GAME_H * 0.2 + row * 28;
            if (row % 2 === 0) {
                g.fillStyle(0x33995a, 0.4);
                g.fillRect(0, y, GAME_W, 28);
            }
        }

        // field lines — center line, penalty box outlines (perspective from inside net)
        const vpX2 = GAME_W / 2, vpY2 = GAME_H * 0.25;
        g.lineStyle(2, 0xffffff, 0.2);
        // side touchlines converging
        g.moveTo(0, GAME_H * 0.2); g.lineTo(vpX2 - 200, GAME_H); g.strokePath();
        g.moveTo(GAME_W, GAME_H * 0.2); g.lineTo(vpX2 + 200, GAME_H); g.strokePath();
        // penalty box
        g.lineStyle(2, 0xffffff, 0.2);
        g.beginPath();
        g.moveTo(vpX2 - 180, GAME_H);
        g.lineTo(vpX2 - 100, GAME_H * 0.4);
        g.lineTo(vpX2 + 100, GAME_H * 0.4);
        g.lineTo(vpX2 + 180, GAME_H);
        g.closePath();
        g.strokePath();
        // six-yard box
        g.lineStyle(2, 0xffffff, 0.15);
        g.beginPath();
        g.moveTo(vpX2 - 120, GAME_H);
        g.lineTo(vpX2 - 70, GAME_H * 0.6);
        g.lineTo(vpX2 + 70, GAME_H * 0.6);
        g.lineTo(vpX2 + 120, GAME_H);
        g.closePath();
        g.strokePath();
        // penalty spot
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(vpX2, GAME_H * 0.75, 3);

        // goal frame (we're inside it — posts and crossbar only, no mesh)
        const frameG = this.add.graphics().setDepth(15);
        const frameW = 14;
        // posts
        frameG.fillStyle(0xffffff);
        frameG.fillRect(0, 0, frameW, GAME_H);
        frameG.fillRect(GAME_W - frameW, 0, frameW, GAME_H);
        // crossbar
        frameG.fillRect(0, 0, GAME_W, frameW);

        // fans behind the net (behind us, visible at bottom)
        const fansG = this.add.graphics().setDepth(1);
        fansG.fillStyle(0x553322, 0.4);
        fansG.fillRect(0, GAME_H * 0.65, GAME_W, GAME_H * 0.35);
        for (let row = 0; row < 3; row++) {
            const rowY = GAME_H * 0.68 + row * 30;
            for (let i = 0; i < 30; i++) {
                const fx = Phaser.Math.Between(20, GAME_W - 20);
                const fy = rowY + Phaser.Math.Between(-8, 8);
                const c = hsvWheel[Phaser.Math.Between(0, 359)].color;
                fansG.fillStyle(c, 0.5);
                fansG.fillCircle(fx, fy, Phaser.Math.Between(4, 7));
                fansG.fillStyle(c, 0.35);
                fansG.fillRect(fx - 4, fy + 5, 8, 10);
            }
        }

        // AI shooter (visible, center of field)
        this.aiShooter = this.add.graphics().setDepth(5);
        // shadow
        this.aiShooter.fillStyle(0x000000, 0.3);
        this.aiShooter.fillEllipse(0, 28, 30, 8);
        // boots
        this.aiShooter.fillStyle(0x111111);
        this.aiShooter.fillRect(-12, 18, 9, 10);
        this.aiShooter.fillRect(3, 18, 9, 10);
        // white shorts
        this.aiShooter.fillStyle(0xffffff);
        this.aiShooter.fillRect(-12, 8, 10, 12);
        this.aiShooter.fillRect(2, 8, 10, 12);
        // red jersey
        this.aiShooter.fillStyle(0xdd2222);
        this.aiShooter.fillRoundedRect(-14, -18, 28, 30, 4);
        // jersey trim
        this.aiShooter.fillStyle(0xff4444);
        this.aiShooter.fillRect(-14, -18, 28, 4);
        // number on chest
        this.aiShooter.fillStyle(0xffffff, 0.9);
        this.aiShooter.fillRect(-5, -10, 10, 12);
        this.aiShooter.fillStyle(0xdd2222);
        this.aiShooter.fillRect(-3, -8, 6, 8);
        // head
        this.aiShooter.fillStyle(0xddbb88);
        this.aiShooter.fillCircle(0, -22, 8);
        // hair
        this.aiShooter.fillStyle(0x222222);
        this.aiShooter.fillRect(-7, -30, 14, 6);
        this.aiShooter.setPosition(GAME_W / 2, GAME_H - 60);

        // ball starts small at shooter, will fly toward camera
        this.penBall = this.add.image(GAME_W / 2, GAME_H - 35, 'ball').setScale(0.5).setDepth(10);

        // player goalkeeper — stands center, will dive on choice
        this.keeperGfx = this.add.graphics().setDepth(12);
        this.keeperX = GAME_W / 2;
        this.keeperGroundY = GAME_H * 0.55;
        this.keeperY = this.keeperGroundY;
        this.drawKeeper(0, 0);
        this.keeperGfx.setPosition(this.keeperX, this.keeperY);

        // CPU decides which side to shoot: 'left', 'center', or 'right'
        const sides = ['left', 'center', 'right'];
        this.cpuShotSide = sides[Phaser.Math.Between(0, 2)];
        // map side to actual target coordinates
        if (this.cpuShotSide === 'left') {
            this.cpuShotTarget = { x: Phaser.Math.Between(frameW + 30, GAME_W * 0.3), y: Phaser.Math.Between(frameW + 30, GAME_H * 0.6) };
        } else if (this.cpuShotSide === 'right') {
            this.cpuShotTarget = { x: Phaser.Math.Between(GAME_W * 0.7, GAME_W - frameW - 30), y: Phaser.Math.Between(frameW + 30, GAME_H * 0.6) };
        } else {
            this.cpuShotTarget = { x: Phaser.Math.Between(GAME_W * 0.35, GAME_W * 0.65), y: Phaser.Math.Between(frameW + 30, GAME_H * 0.5) };
        }

        // dive choice state
        this.diveChosen = false;
        this.diveChoice = null; // 'left', 'center', 'right'

        // state
        this.saveTimer = 0;
        this.shotInFlight = false;
        this.shotDelay = 1800; // wait before CPU shoots

        // HUD
        this.createHUD();

        // draw the 3 dive option arrows/labels
        this.diveOptionsGfx = this.add.graphics().setDepth(18);
        this.diveLabels = [];
        const optStyle = { fontSize: '20px', fontFamily: 'Arial Black, Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 4 };
        const leftLabel = this.add.text(GAME_W * 0.15, GAME_H * 0.35, 'LEFT', optStyle).setOrigin(0.5).setDepth(20);
        const centerLabel = this.add.text(GAME_W * 0.5, GAME_H * 0.35, 'CENTER', optStyle).setOrigin(0.5).setDepth(20);
        const rightLabel = this.add.text(GAME_W * 0.85, GAME_H * 0.35, 'RIGHT', optStyle).setOrigin(0.5).setDepth(20);
        this.diveLabels = [leftLabel, centerLabel, rightLabel];
        // draw arrow indicators
        this.drawDiveOptions();

        this.phaseLabel = this.add.text(GAME_W / 2, GAME_H - 10, 'Press LEFT, DOWN (center), or RIGHT to dive!', {
            fontSize: '14px', fontFamily: 'Arial', color: '#ccffcc',
        }).setOrigin(0.5).setDepth(100);

        const banner = this.add.text(GAME_W / 2, GAME_H / 2, `Round ${this.round} — Save It!`, {
            fontSize: '36px', fontFamily: 'Arial Black, Arial',
            color: '#44aaff', stroke: '#000000', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(200);
        this.tweens.add({ targets: banner, alpha: 0, scale: 1.5, duration: 1200, ease: 'Power2', onComplete: () => banner.destroy() });
    }

    drawDiveOptions() {
        this.diveOptionsGfx.clear();
        const positions = [GAME_W * 0.15, GAME_W * 0.5, GAME_W * 0.85];
        const y = GAME_H * 0.35;
        for (let i = 0; i < 3; i++) {
            // highlight box behind each option
            this.diveOptionsGfx.fillStyle(0x000000, 0.3);
            this.diveOptionsGfx.fillRoundedRect(positions[i] - 50, y - 20, 100, 40, 8);
            // arrow indicator
            this.diveOptionsGfx.lineStyle(3, 0xffff44, 0.8);
            if (i === 0) {
                // left arrow
                this.diveOptionsGfx.moveTo(positions[i] - 35, y + 25); this.diveOptionsGfx.lineTo(positions[i] - 45, y + 35); this.diveOptionsGfx.lineTo(positions[i] - 35, y + 45); this.diveOptionsGfx.strokePath();
            } else if (i === 2) {
                // right arrow
                this.diveOptionsGfx.moveTo(positions[i] + 35, y + 25); this.diveOptionsGfx.lineTo(positions[i] + 45, y + 35); this.diveOptionsGfx.lineTo(positions[i] + 35, y + 45); this.diveOptionsGfx.strokePath();
            } else {
                // down arrow
                this.diveOptionsGfx.moveTo(positions[i] - 10, y + 30); this.diveOptionsGfx.lineTo(positions[i], y + 45); this.diveOptionsGfx.lineTo(positions[i] + 10, y + 30); this.diveOptionsGfx.strokePath();
            }
        }
    }

    drawKeeper(offX, offY) {
        this.keeperGfx.clear();
        // large keeper (close-up view from inside net)
        this.keeperGfx.fillStyle(0xeecc00);
        this.keeperGfx.fillRoundedRect(-18 + offX, -28 + offY, 36, 50, 5);
        this.keeperGfx.fillStyle(0xffcc88);
        this.keeperGfx.fillCircle(offX, -24 + offY, 10);
        // gloves
        this.keeperGfx.fillStyle(0x44ff44);
        this.keeperGfx.fillRoundedRect(-30 + offX, -14 + offY, 14, 14, 3);
        this.keeperGfx.fillRoundedRect(16 + offX, -14 + offY, 14, 14, 3);
        this.keeperGfx.fillStyle(0x222222);
        this.keeperGfx.fillRect(-12 + offX, 22 + offY, 10, 16);
        this.keeperGfx.fillRect(2 + offX, 22 + offY, 10, 16);
    }

    clearScene() {
        // remove all children except camera
        this.children.removeAll(true);
    }

    createHUD() {
        const scoreStyle = { fontSize: '18px', fontFamily: 'Arial Black, Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 4 };
        this.add.text(GAME_W / 2, 30, `Round ${this.round} / ${this.maxRounds}`, scoreStyle).setOrigin(0.5).setDepth(100);
        this.add.text(GAME_W / 2 - 80, 52, `You: ${this.playerGoals}`, {
            fontSize: '16px', fontFamily: 'Arial', color: '#44ff88',
        }).setOrigin(0.5).setDepth(100);
        this.add.text(GAME_W / 2 + 80, 52, `CPU: ${this.cpuGoals}`, {
            fontSize: '16px', fontFamily: 'Arial', color: '#ff6644',
        }).setOrigin(0.5).setDepth(100);

        if (this.score > 0) {
            this.add.text(GAME_W - 10, 30, `Score: ${this.score}`, {
                fontSize: '16px', fontFamily: 'Arial', color: '#ffdd44', stroke: '#000000', strokeThickness: 3,
            }).setOrigin(1, 0).setDepth(100);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════════════════════════
    update(time, delta) {
        if (this.done) return;
        const dt = delta / 1000;

        if (this.phase === 'shoot') {
            this.updateShoot(dt, delta);
        } else {
            this.updateSave(dt, delta);
        }
    }

    updateShoot(dt, delta) {
        const gb = this.goalBounds;
        const aimSpeed = 150;

        // aim
        if (this.cursors.left.isDown || this.wasd.A.isDown) this.aimX -= aimSpeed * dt;
        if (this.cursors.right.isDown || this.wasd.D.isDown) this.aimX += aimSpeed * dt;
        if (this.cursors.up.isDown || this.wasd.W.isDown) this.aimY -= aimSpeed * dt;
        if (this.cursors.down.isDown || this.wasd.S.isDown) this.aimY += aimSpeed * dt;

        this.aimX = Phaser.Math.Clamp(this.aimX, gb.x + 10, gb.x + gb.w - 10);
        this.aimY = Phaser.Math.Clamp(this.aimY, gb.y + 10, gb.y + gb.h - 10);

        // draw crosshair
        this.aimGfx.clear();
        this.aimGfx.lineStyle(2, 0xff4444, 0.8);
        this.aimGfx.strokeCircle(this.aimX, this.aimY, 10);
        this.aimGfx.moveTo(this.aimX - 15, this.aimY); this.aimGfx.lineTo(this.aimX + 15, this.aimY); this.aimGfx.strokePath();
        this.aimGfx.moveTo(this.aimX, this.aimY - 15); this.aimGfx.lineTo(this.aimX, this.aimY + 15); this.aimGfx.strokePath();

        // power charge
        if (this.spaceKey.isDown) {
            if (!this.charging) { this.charging = true; this.shotPower = 0; }
            this.shotPower = Math.min(100, this.shotPower + 70 * dt);
        } else if (this.charging) {
            this.executeShot();
            return;
        }

        // power bar
        this.powerGfx.clear();
        if (this.charging) {
            const bx = GAME_W / 2 - 60, by = GAME_H - 35, bw = 120, bh = 10;
            const pct = this.shotPower / 100;
            this.powerGfx.fillStyle(0x000000, 0.6);
            this.powerGfx.fillRoundedRect(bx, by, bw, bh, 3);
            const col = pct < 0.4 ? 0x44dd66 : pct < 0.75 ? 0xdddd44 : 0xff3333;
            this.powerGfx.fillStyle(col);
            this.powerGfx.fillRoundedRect(bx + 2, by + 2, (bw - 4) * pct, bh - 4, 2);
        }
    }

    executeShot() {
        this.done = true;
        this.charging = false;
        sfx.kick();

        const power = this.shotPower;
        const gb = this.goalBounds;

        // accuracy penalty — higher power = more random offset
        // power 0-50: very accurate, 50-80: some spread, 80-100: wild
        const errorScale = power < 50 ? power * 0.3 : power < 80 ? 15 + (power - 50) * 1.2 : 51 + (power - 80) * 2.5;
        const offsetX = (Math.random() - 0.5) * errorScale * 2;
        const offsetY = (Math.random() - 0.5) * errorScale * 2;

        let tx = this.aimX + offsetX;
        let ty = this.aimY + offsetY;

        // check if the shot misses the goal entirely
        const missed = tx < gb.x || tx > gb.x + gb.w || ty < gb.y || ty > gb.y + gb.h;

        // slower shot flight — high power still faster but overall much slower
        const dur = 700 + (100 - power) * 6;

        this.tweens.add({
            targets: this.penBall,
            x: tx, y: ty,
            scale: 0.6,
            duration: dur,
            ease: 'Sine.easeIn',
            onComplete: () => {
                if (missed) {
                    sfx.hit();
                    this.showResult('MISSED!', '#ffaa44');
                    this.time.delayedCall(1500, () => this.setupSavePhase());
                    return;
                }

                // AI keeper dives (random, sometimes wrong)
                const keeperDiveX = Phaser.Math.Between(gb.x + 20, gb.x + gb.w - 20);
                const keeperDiveY = Phaser.Math.Between(gb.y + 10, gb.y + gb.h - 10);

                this.tweens.add({
                    targets: this.aiKeeper,
                    x: keeperDiveX, y: keeperDiveY,
                    duration: 300,
                    ease: 'Power2',
                });

                // did keeper save it?
                this.time.delayedCall(350, () => {
                    const dist = Phaser.Math.Distance.Between(tx, ty, keeperDiveX, keeperDiveY);
                    const saved = dist < 35;

                    if (saved) {
                        sfx.tackle();
                        this.showResult('SAVED!', '#ff6644');
                    } else {
                        sfx.goal();
                        this.playerGoals++;
                        const pts = Math.floor(power * 2);
                        this.score += pts;
                        this.showResult('GOAL!', '#44ff88');
                        for (let i = 0; i < 6; i++) {
                            this.time.delayedCall(i * 60, () => {
                                this.starEmitter.emitParticleAt(tx + Phaser.Math.Between(-20, 20), ty + Phaser.Math.Between(-20, 20), 5);
                            });
                        }
                    }

                    // transition to save phase
                    this.time.delayedCall(1500, () => this.setupSavePhase());
                });
            }
        });
    }

    updateSave(dt, delta) {
        // pick a side before the shot — lock in choice but don't dive yet
        if (!this.diveChosen) {
            if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.wasd.A)) {
                this.lockInChoice('left');
            } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.wasd.D)) {
                this.lockInChoice('right');
            } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.wasd.S)) {
                this.lockInChoice('center');
            }
        }

        // wait then CPU shoots
        this.saveTimer += delta;
        if (this.saveTimer >= this.shotDelay && !this.shotInFlight) {
            // if player hasn't chosen yet, default to center
            if (!this.diveChosen) this.lockInChoice('center');

            this.shotInFlight = true;
            sfx.kick();

            // now the keeper dives
            this.executeDive(this.diveChoice);

            const tx = this.cpuShotTarget.x;
            const ty = this.cpuShotTarget.y;
            const dur = 1000 + Phaser.Math.Between(0, 400);

            this.tweens.add({
                targets: this.penBall,
                x: tx, y: ty,
                scale: 2.5,
                duration: dur,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    this.done = true;
                    const saved = this.diveChoice === this.cpuShotSide;

                    if (saved) {
                        sfx.tackle();
                        this.showResult('SAVED!', '#44ff88');
                        this.score += 50;
                    } else {
                        sfx.hit();
                        this.cpuGoals++;
                        this.showResult('GOAL...', '#ff6644');
                        this.cameras.main.shake(200, 0.015);
                    }

                    this.time.delayedCall(1500, () => this.nextRound());
                }
            });
        }
    }

    lockInChoice(side) {
        this.diveChosen = true;
        this.diveChoice = side;
        sfx.select();

        // highlight the chosen option, dim the others
        const sideIndex = side === 'left' ? 0 : side === 'center' ? 1 : 2;
        this.diveLabels.forEach((label, i) => {
            if (i === sideIndex) {
                label.setColor('#ffff44');
                label.setScale(1.3);
            } else {
                label.setAlpha(0.3);
            }
        });

        // redraw option boxes with highlight
        this.diveOptionsGfx.clear();
        const positions = [GAME_W * 0.15, GAME_W * 0.5, GAME_W * 0.85];
        const y = GAME_H * 0.35;
        for (let i = 0; i < 3; i++) {
            if (i === sideIndex) {
                this.diveOptionsGfx.fillStyle(0xffff44, 0.3);
                this.diveOptionsGfx.fillRoundedRect(positions[i] - 55, y - 25, 110, 50, 10);
                this.diveOptionsGfx.lineStyle(2, 0xffff44, 0.8);
                this.diveOptionsGfx.strokeRoundedRect(positions[i] - 55, y - 25, 110, 50, 10);
            } else {
                this.diveOptionsGfx.fillStyle(0x000000, 0.15);
                this.diveOptionsGfx.fillRoundedRect(positions[i] - 50, y - 20, 100, 40, 8);
            }
        }
    }

    executeDive(side) {
        sfx.whoosh();

        // hide choice UI
        this.diveLabels.forEach(l => l.destroy());
        this.diveOptionsGfx.clear();

        // animate keeper diving to chosen side
        let targetX, targetY;
        if (side === 'left') {
            targetX = GAME_W * 0.18;
            targetY = this.keeperGroundY - 40;
        } else if (side === 'right') {
            targetX = GAME_W * 0.82;
            targetY = this.keeperGroundY - 40;
        } else {
            targetX = GAME_W / 2;
            targetY = this.keeperGroundY - 20;
        }

        this.tweens.add({
            targets: this,
            keeperX: targetX,
            keeperY: targetY,
            duration: 400,
            ease: 'Power2',
            onUpdate: () => {
                this.keeperGfx.setPosition(this.keeperX, this.keeperY);
                if (side === 'left') this.keeperGfx.setRotation(-0.5);
                else if (side === 'right') this.keeperGfx.setRotation(0.5);
            }
        });
    }

    showResult(text, color) {
        const txt = this.add.text(GAME_W / 2, GAME_H / 2, text, {
            fontSize: '52px', fontFamily: 'Arial Black, Arial',
            color: color, stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(200);
        this.tweens.add({ targets: txt, scale: { from: 0.5, to: 1.2 }, duration: 400, ease: 'Back.easeOut' });
    }

    nextRound() {
        if (this.round >= this.maxRounds) {
            // shootout over
            const prevHi = parseInt(localStorage.getItem('penalty_hiScore') || '0');
            if (this.score > prevHi) localStorage.setItem('penalty_hiScore', this.score.toString());

            const won = this.playerGoals > this.cpuGoals;
            this.clearScene();
            this.cameras.main.setBackgroundColor(won ? '#1a331a' : '#331a1a');

            const g = this.add.graphics();
            g.fillStyle(0x000000, 0.6); g.fillRect(0, 0, GAME_W, GAME_H);

            this.add.text(GAME_W / 2, 80, won ? 'YOU WIN!' : 'YOU LOSE', {
                fontSize: '52px', fontFamily: 'Arial Black, Arial',
                color: won ? '#44ff88' : '#ff4444', stroke: '#000000', strokeThickness: 6,
            }).setOrigin(0.5);

            this.add.text(GAME_W / 2, 160, `${this.playerGoals} - ${this.cpuGoals}`, {
                fontSize: '40px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
            }).setOrigin(0.5);

            this.add.text(GAME_W / 2, 210, `Score: ${this.score}`, {
                fontSize: '24px', fontFamily: 'Arial', color: '#ffdd44',
            }).setOrigin(0.5);

            const hiScore = Math.max(prevHi, this.score);
            this.add.text(GAME_W / 2, 245, `Best: ${hiScore}`, {
                fontSize: '18px', fontFamily: 'Arial', color: '#ffaa22',
            }).setOrigin(0.5);

            if (won) {
                sfx.levelUp();
                for (let i = 0; i < 8; i++) {
                    this.time.delayedCall(i * 80, () => {
                        this.starEmitter.emitParticleAt(GAME_W / 2 + Phaser.Math.Between(-100, 100), Phaser.Math.Between(60, 180), 6);
                    });
                }
            } else {
                sfx.hit();
            }

            const btnStyle = { fontSize: '22px', fontFamily: 'Arial Black, Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 4 };
            this.selected = 0;
            this.endBtns = [
                this.add.text(GAME_W / 2 - 120, 340, 'Play Again', btnStyle).setOrigin(0.5),
                this.add.text(GAME_W / 2 + 120, 340, 'Menu', btnStyle).setOrigin(0.5),
            ];
            this.updateEndSelection();

            this.time.delayedCall(500, () => {
                this.input.keyboard.on('keydown-LEFT', () => { this.selected = 0; this.updateEndSelection(); });
                this.input.keyboard.on('keydown-RIGHT', () => { this.selected = 1; this.updateEndSelection(); });
                this.input.keyboard.on('keydown-SPACE', () => this.endConfirm());
                this.endBtns.forEach((btn, i) => {
                    btn.setInteractive({ useHandCursor: true });
                    btn.on('pointerdown', () => { this.selected = i; this.endConfirm(); });
                });
            });
        } else {
            // next round
            this.round++;
            this.setupShootPhase();
        }
    }

    updateEndSelection() {
        this.endBtns.forEach((btn, i) => {
            btn.setColor(i === this.selected ? '#44ff88' : '#888888');
            btn.setScale(i === this.selected ? 1.15 : 1);
        });
    }

    endConfirm() {
        sfx.select();
        if (this.selected === 0) {
            this.scene.start('Penalty', { round: 1, playerGoals: 0, cpuGoals: 0, score: 0 });
        } else {
            this.scene.start('Title');
        }
    }
}

// ── Game Over Scene ────────────────────────────────────────────────
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOver'); }

    init(data) {
        this.level = data.level || 1;
        this.pct = data.pct || 0;
        this.finalScore = data.score || 0;
        this.mode = data.mode || 'Game';
    }

    create() {
        this.cameras.main.setBackgroundColor('#220000');

        // save high score
        if (this.mode === 'Game') {
            const prevHi = parseInt(localStorage.getItem('stadiumRunner_hiScore') || '0');
            if (this.finalScore > prevHi) localStorage.setItem('stadiumRunner_hiScore', this.finalScore.toString());
        } else {
            const prevHi = parseInt(localStorage.getItem('dribble_hiLevel') || '0');
            if (this.level > prevHi) localStorage.setItem('dribble_hiLevel', this.level.toString());
        }

        // dark overlay
        const g = this.add.graphics();
        g.fillStyle(0x000000, 0.7);
        g.fillRect(0, 0, GAME_W, GAME_H);

        const isDribble = this.mode === 'Dribble';
        const title = isDribble ? 'TACKLED!' : 'GAME OVER';

        this.add.text(GAME_W / 2, 70, title, {
            fontSize: '48px', fontFamily: 'Arial Black, Arial',
            color: '#ff4444', stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5);

        this.add.image(GAME_W / 2, 135, 'ball').setScale(3);

        this.add.text(GAME_W / 2, 195, `Level: ${this.level}`, {
            fontSize: '28px', fontFamily: 'Arial', color: '#ffffff',
        }).setOrigin(0.5);

        if (!isDribble) {
            this.add.text(GAME_W / 2, 228, `Distance: ${this.pct}%`, {
                fontSize: '18px', fontFamily: 'Arial', color: '#cccccc',
            }).setOrigin(0.5);
        }

        this.add.text(GAME_W / 2, 265, `Score: ${this.finalScore}`, {
            fontSize: '28px', fontFamily: 'Arial Black, Arial', color: '#ffdd44',
        }).setOrigin(0.5);

        const hiLabel = isDribble
            ? `Best: Level ${localStorage.getItem('dribble_hiLevel') || 0}`
            : `Best Score: ${localStorage.getItem('stadiumRunner_hiScore') || 0}`;
        this.add.text(GAME_W / 2, 300, hiLabel, {
            fontSize: '18px', fontFamily: 'Arial', color: '#ffaa22',
        }).setOrigin(0.5);

        // ── Continue / Reset / Menu buttons ──
        this.selected = 0;
        const btnY = 365;
        const btnStyle = { fontSize: '20px', fontFamily: 'Arial Black, Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 4 };

        this.btns = [
            this.add.text(GAME_W / 2 - 200, btnY, `Continue`, btnStyle).setOrigin(0.5),
            this.add.text(GAME_W / 2, btnY, 'Reset', btnStyle).setOrigin(0.5),
            this.add.text(GAME_W / 2 + 200, btnY, 'Menu', btnStyle).setOrigin(0.5),
        ];

        this.add.text(GAME_W / 2, btnY + 35, 'Arrow Keys to choose, SPACE to select', {
            fontSize: '12px', fontFamily: 'Arial', color: '#999999',
        }).setOrigin(0.5);

        this.updateSelection();

        this.time.delayedCall(500, () => {
            this.input.keyboard.on('keydown-LEFT', () => { this.selected = Math.max(0, this.selected - 1); this.updateSelection(); });
            this.input.keyboard.on('keydown-RIGHT', () => { this.selected = Math.min(2, this.selected + 1); this.updateSelection(); });
            this.input.keyboard.on('keydown-A', () => { this.selected = Math.max(0, this.selected - 1); this.updateSelection(); });
            this.input.keyboard.on('keydown-D', () => { this.selected = Math.min(2, this.selected + 1); this.updateSelection(); });
            this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection());

            this.btns.forEach((btn, i) => {
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerdown', () => { this.selected = i; this.confirmSelection(); });
            });
        });
    }

    updateSelection() {
        this.btns.forEach((btn, i) => {
            btn.setColor(i === this.selected ? '#44ff88' : '#888888');
            btn.setScale(i === this.selected ? 1.15 : 1);
        });
    }

    confirmSelection() {
        sfx.select();
        if (this.selected === 0) {
            this.scene.start(this.mode, { level: this.level, score: this.finalScore });
        } else if (this.selected === 1) {
            this.scene.start(this.mode, { level: 1, score: 0 });
        } else {
            this.scene.start('Title');
        }
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
    scene: [BootScene, TitleScene, GameScene, DribbleScene, PenaltyScene, GameOverScene],
};

const game = new Phaser.Game(config);
