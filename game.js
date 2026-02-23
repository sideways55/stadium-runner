// ── Nutmeg Arcade — Phaser 3 ───────────────────────────────────────

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

// ── Profile & Leaderboard ──────────────────────────────────────────
const COUNTRIES = [
    'Argentina', 'Australia', 'Belgium', 'Brazil', 'Canada',
    'Chile', 'Colombia', 'Croatia', 'Denmark', 'Ecuador',
    'England', 'France', 'Germany', 'Ghana', 'Ireland',
    'Italy', 'Japan', 'Mexico', 'Morocco', 'Netherlands',
    'Nigeria', 'Norway', 'Poland', 'Portugal', 'Scotland',
    'South Korea', 'Spain', 'Sweden', 'USA', 'Uruguay', 'Wales',
];

const COUNTRY_FLAGS = {
    'Argentina': '\u{1F1E6}\u{1F1F7}', 'Australia': '\u{1F1E6}\u{1F1FA}',
    'Belgium': '\u{1F1E7}\u{1F1EA}', 'Brazil': '\u{1F1E7}\u{1F1F7}',
    'Canada': '\u{1F1E8}\u{1F1E6}', 'Chile': '\u{1F1E8}\u{1F1F1}',
    'Colombia': '\u{1F1E8}\u{1F1F4}', 'Croatia': '\u{1F1ED}\u{1F1F7}',
    'Denmark': '\u{1F1E9}\u{1F1F0}', 'Ecuador': '\u{1F1EA}\u{1F1E8}',
    'England': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
    'France': '\u{1F1EB}\u{1F1F7}', 'Germany': '\u{1F1E9}\u{1F1EA}',
    'Ghana': '\u{1F1EC}\u{1F1ED}', 'Ireland': '\u{1F1EE}\u{1F1EA}',
    'Italy': '\u{1F1EE}\u{1F1F9}', 'Japan': '\u{1F1EF}\u{1F1F5}',
    'Mexico': '\u{1F1F2}\u{1F1FD}', 'Morocco': '\u{1F1F2}\u{1F1E6}',
    'Netherlands': '\u{1F1F3}\u{1F1F1}', 'Nigeria': '\u{1F1F3}\u{1F1EC}',
    'Norway': '\u{1F1F3}\u{1F1F4}', 'Poland': '\u{1F1F5}\u{1F1F1}',
    'Portugal': '\u{1F1F5}\u{1F1F9}', 'Scotland': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
    'South Korea': '\u{1F1F0}\u{1F1F7}', 'Spain': '\u{1F1EA}\u{1F1F8}',
    'Sweden': '\u{1F1F8}\u{1F1EA}', 'USA': '\u{1F1FA}\u{1F1F8}',
    'Uruguay': '\u{1F1FA}\u{1F1FE}', 'Wales': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}',
};

function getFlag(country) {
    return COUNTRY_FLAGS[country] || country;
}

const CLUBS = [
    'Ajax', 'Arsenal', 'Atletico Madrid', 'Barcelona', 'Bayern Munich',
    'Benfica', 'Borussia Dortmund', 'Celtic', 'Chelsea', 'Flamengo',
    'Inter Milan', 'Juventus', 'Leeds United', 'Liverpool', 'Lyon',
    'Man City', 'Man United', 'Marseille', 'AC Milan', 'Napoli',
    'Newcastle', 'PSG', 'Porto', 'Rangers', 'Real Madrid',
    'River Plate', 'Roma', 'Santos', 'Sao Paulo', 'Spurs',
    'West Ham', 'Wolves',
];

const ProfileManager = {
    PROFILE_KEY: 'stadium_profile',        // legacy single-profile key
    PROFILES_KEY: 'stadium_profiles',      // array of all profiles
    ACTIVE_KEY: 'stadium_active_id',       // active profile id
    LEADERBOARD_KEY: 'stadium_leaderboard',
    MAX_ENTRIES: 10,

    migrateIfNeeded() {
        const legacy = localStorage.getItem(this.PROFILE_KEY);
        if (legacy && !localStorage.getItem(this.PROFILES_KEY)) {
            try {
                const old = JSON.parse(legacy);
                old.id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
                localStorage.setItem(this.PROFILES_KEY, JSON.stringify([old]));
                localStorage.setItem(this.ACTIVE_KEY, String(old.id));
            } catch (e) {
                // corrupted legacy data — discard it
            }
            localStorage.removeItem(this.PROFILE_KEY);
        }
        this.dedupeLeaderboard();
    },
    dedupeLeaderboard() {
        const lb = this.getLeaderboard();
        if (!lb || typeof lb !== 'object') return;
        let changed = false;
        for (const mode of Object.keys(lb)) {
            const best = {};
            for (const entry of lb[mode]) {
                if (!best[entry.name] || entry.score > best[entry.name].score) {
                    best[entry.name] = entry;
                }
            }
            const deduped = Object.values(best).sort((a, b) => b.score - a.score);
            if (deduped.length !== lb[mode].length) changed = true;
            lb[mode] = deduped;
        }
        if (changed) {
            localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(lb));
        }
    },
    getAllProfiles() {
        const raw = localStorage.getItem(this.PROFILES_KEY);
        if (!raw) return [];
        try { return JSON.parse(raw); } catch (e) { return []; }
    },
    getProfile() {
        const id = this.getActiveId();
        if (id === null) return null;
        return this.getAllProfiles().find(p => p.id === id) || null;
    },
    getActiveId() {
        const raw = localStorage.getItem(this.ACTIVE_KEY);
        return raw ? Number(raw) : null;
    },
    saveProfile(profile) {
        if (!profile.id) profile.id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
        const profiles = this.getAllProfiles();
        const idx = profiles.findIndex(p => p.id === profile.id);
        if (idx >= 0) profiles[idx] = profile;
        else profiles.push(profile);
        localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles));
    },
    setActive(id) {
        localStorage.setItem(this.ACTIVE_KEY, String(id));
    },
    deleteProfile(id) {
        let profiles = this.getAllProfiles().filter(p => p.id !== id);
        localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles));
        if (this.getActiveId() === id) {
            localStorage.removeItem(this.ACTIVE_KEY);
        }
    },
    hasProfile() {
        return this.getAllProfiles().length > 0;
    },
    hasActiveProfile() {
        return this.getProfile() !== null;
    },
    getLeaderboard() {
        const raw = localStorage.getItem(this.LEADERBOARD_KEY);
        if (!raw) return { dodgeball: [], dribble: [], penalties: [] };
        try { return JSON.parse(raw); } catch (e) { return { dodgeball: [], dribble: [], penalties: [] }; }
    },
    addEntry(mode, entryData) {
        const profile = this.getProfile();
        if (!profile) return;
        const lb = this.getLeaderboard();
        const entry = {
            name: profile.name,
            country: profile.country,
            club: profile.club,
            score: entryData.score || 0,
            level: entryData.level || null,
            result: entryData.result || null,
            date: new Date().toISOString().split('T')[0],
        };
        if (!lb[mode]) lb[mode] = [];
        const existing = lb[mode].findIndex(e => e.name === profile.name);
        if (existing >= 0) {
            if (entry.score <= lb[mode][existing].score) return; // not a new best
            lb[mode][existing] = entry;
        } else {
            lb[mode].push(entry);
        }
        lb[mode].sort((a, b) => b.score - a.score);
        lb[mode] = lb[mode].slice(0, this.MAX_ENTRIES);
        localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(lb));
    },
    getEntries(mode) {
        return this.getLeaderboard()[mode] || [];
    },
};

// ── Boot Scene ─────────────────────────────────────────────────────
class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }

    create() {
        sfx.init();
        this.generateTextures();
        ProfileManager.migrateIfNeeded();
        if (!ProfileManager.hasProfile()) {
            this.scene.start('Profile');
        } else if (ProfileManager.hasActiveProfile()) {
            this.scene.start('Title');
        } else {
            const profiles = ProfileManager.getAllProfiles();
            if (profiles.length === 1) {
                ProfileManager.setActive(profiles[0].id);
                this.scene.start('Title');
            } else {
                this.scene.start('ProfileSelect');
            }
        }
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

// ── Profile Select Scene ──────────────────────────────────────────
class ProfileSelectScene extends Phaser.Scene {
    constructor() { super('ProfileSelect'); }

    create() {
        this.cameras.main.setBackgroundColor('#1a2a4a');
        this.profiles = ProfileManager.getAllProfiles();
        this.selected = 0; // index in the display list (profiles + "NEW PLAYER")
        this.deleteHeld = false;
        this.deleteTimer = null;

        this.add.text(GAME_W / 2, 35, 'SELECT PLAYER', {
            fontSize: '36px', fontFamily: 'Arial Black, Arial',
            color: '#ffffff', stroke: '#000000', strokeThickness: 5,
        }).setOrigin(0.5);

        this.listContainer = this.add.container(0, 0);
        this.cursorGfx = this.add.graphics();
        this.buildList();

        this.add.text(GAME_W / 2, GAME_H - 50, 'UP/DOWN to navigate  |  SPACE to select', {
            fontSize: '14px', fontFamily: 'Arial', color: '#aaaaaa',
        }).setOrigin(0.5);
        this.deleteHint = this.add.text(GAME_W / 2, GAME_H - 28, 'Hold BACKSPACE to delete selected profile', {
            fontSize: '12px', fontFamily: 'Arial', color: '#666666',
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-UP', () => { this.selected = Math.max(0, this.selected - 1); this.updateList(); });
        this.input.keyboard.on('keydown-DOWN', () => { this.selected = Math.min(this.profiles.length, this.selected + 1); this.updateList(); });
        this.input.keyboard.on('keydown-W', () => { this.selected = Math.max(0, this.selected - 1); this.updateList(); });
        this.input.keyboard.on('keydown-S', () => { this.selected = Math.min(this.profiles.length, this.selected + 1); this.updateList(); });
        this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection());
        this.input.keyboard.on('keydown-BACKSPACE', () => this.startDelete());
        this.input.keyboard.on('keyup-BACKSPACE', () => this.cancelDelete());
    }

    buildList() {
        this.listContainer.removeAll(true);
        this.itemTexts = [];
        const startY = 100;
        const rowH = 50;
        const maxVisible = 7;
        const count = this.profiles.length + 1; // +1 for NEW PLAYER

        for (let i = 0; i < Math.min(count, maxVisible); i++) {
            const y = startY + i * rowH;
            if (i < this.profiles.length) {
                const p = this.profiles[i];
                const flag = getFlag(p.country);
                const txt = this.add.text(GAME_W / 2, y, `${flag}  ${p.name}  —  ${p.club}`, {
                    fontSize: '20px', fontFamily: 'Arial Black, Arial', color: '#888888',
                }).setOrigin(0.5);
                this.itemTexts.push(txt);
                this.listContainer.add(txt);
            } else {
                const txt = this.add.text(GAME_W / 2, y, '+ NEW PLAYER', {
                    fontSize: '20px', fontFamily: 'Arial Black, Arial', color: '#888888',
                }).setOrigin(0.5);
                this.itemTexts.push(txt);
                this.listContainer.add(txt);
            }
        }
        this.updateList();
    }

    updateList() {
        const count = this.profiles.length + 1;
        if (this.selected >= count) this.selected = count - 1;

        this.itemTexts.forEach((txt, i) => {
            if (i === this.selected) {
                txt.setColor(i === this.profiles.length ? '#44aaff' : '#44ff88').setScale(1.1);
            } else {
                txt.setColor('#888888').setScale(1);
            }
        });

        this.cursorGfx.clear();
        if (this.selected < this.itemTexts.length) {
            const target = this.itemTexts[this.selected];
            this.cursorGfx.lineStyle(2, 0x44ff88, 0.8);
            const w = target.width * target.scaleX + 30;
            this.cursorGfx.strokeRoundedRect(target.x - w / 2, target.y - 18, w, 36, 5);
        }

        // show/hide delete hint based on whether a profile (not NEW PLAYER) is selected
        if (this.deleteHint) {
            this.deleteHint.setVisible(this.selected < this.profiles.length);
        }
    }

    confirmSelection() {
        sfx.select();
        if (this.selected < this.profiles.length) {
            ProfileManager.setActive(this.profiles[this.selected].id);
            this.scene.start('Title');
        } else {
            this.scene.start('Profile', { returnTo: 'ProfileSelect' });
        }
    }

    startDelete() {
        if (this.selected >= this.profiles.length) return; // can't delete NEW PLAYER
        if (this.deleteTimer) return;
        this.deleteHeld = true;
        // visual feedback — flash the selected item red
        const target = this.itemTexts[this.selected];
        if (target) target.setColor('#ff4444');
        this.deleteTimer = this.time.delayedCall(800, () => {
            if (this.deleteHeld) {
                const p = this.profiles[this.selected];
                ProfileManager.deleteProfile(p.id);
                this.profiles = ProfileManager.getAllProfiles();
                if (this.profiles.length === 0) {
                    this.scene.start('Profile');
                    return;
                }
                this.selected = Math.min(this.selected, this.profiles.length - 1);
                sfx.select();
                this.buildList();
            }
            this.deleteTimer = null;
        });
    }

    cancelDelete() {
        this.deleteHeld = false;
        if (this.deleteTimer) {
            this.deleteTimer.remove(false);
            this.deleteTimer = null;
        }
        this.updateList();
    }
}

// ── Profile Scene ──────────────────────────────────────────────────
class ProfileScene extends Phaser.Scene {
    constructor() { super('Profile'); }

    init(data) {
        this.returnTo = data.returnTo || 'Title';
        this.existingProfile = ProfileManager.getProfile();
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a2a4a');
        this.step = 'name';
        this.currentName = this.existingProfile ? this.existingProfile.name : '';

        // title
        this.add.text(GAME_W / 2, 30, 'PLAYER PROFILE', {
            fontSize: '36px', fontFamily: 'Arial Black, Arial',
            color: '#ffffff', stroke: '#000000', strokeThickness: 5,
        }).setOrigin(0.5);

        // step indicator
        this.stepTexts = [];
        const steps = ['NAME', 'NATIONALITY', 'CLUB'];
        const stepY = 70;
        for (let i = 0; i < 3; i++) {
            const x = GAME_W / 2 + (i - 1) * 140;
            this.stepTexts.push(this.add.text(x, stepY, steps[i], {
                fontSize: '16px', fontFamily: 'Arial Black, Arial', color: '#555555',
            }).setOrigin(0.5));
            if (i < 2) {
                this.add.text(x + 70, stepY, '>', {
                    fontSize: '16px', fontFamily: 'Arial', color: '#444444',
                }).setOrigin(0.5);
            }
        }

        // container for step content
        this.stepContainer = this.add.container(0, 0);

        this.updateStepIndicator();
        this.setupNameInput();
    }

    updateStepIndicator() {
        const idx = this.step === 'name' ? 0 : this.step === 'country' ? 1 : 2;
        this.stepTexts.forEach((t, i) => {
            if (i < idx) t.setColor('#ffdd44');
            else if (i === idx) t.setColor('#44ff88');
            else t.setColor('#555555');
        });
    }

    clearStep() {
        this.stepContainer.removeAll(true);
        this.input.keyboard.removeAllListeners();
    }

    // ── NAME INPUT (arcade letter grid) ──
    setupNameInput() {
        this.clearStep();
        this.nameChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ '.split('');
        this.gridCols = 9;
        this.gridRows = 3;
        this.gridX = 0;
        this.gridY = 0;
        this.specialRow = false; // when true, cursor is on DEL/OK row
        this.specialIdx = 0; // 0=DEL, 1=OK
        this.maxNameLen = 10;

        // name preview
        this.namePreview = this.add.text(GAME_W / 2, 110, this.getNamePreview(), {
            fontSize: '30px', fontFamily: 'Arial Black, Arial', color: '#44ff88',
        }).setOrigin(0.5);
        this.stepContainer.add(this.namePreview);

        // letter grid
        const startX = GAME_W / 2 - (this.gridCols - 1) * 24;
        const startY = 165;
        const cellW = 48;
        const cellH = 44;
        this.letterTexts = [];

        for (let row = 0; row < this.gridRows; row++) {
            this.letterTexts[row] = [];
            for (let col = 0; col < this.gridCols; col++) {
                const idx = row * this.gridCols + col;
                if (idx < this.nameChars.length) {
                    const ch = this.nameChars[idx] === ' ' ? '_' : this.nameChars[idx];
                    const txt = this.add.text(startX + col * cellW, startY + row * cellH, ch, {
                        fontSize: '24px', fontFamily: 'Arial Black, Arial', color: '#888888',
                    }).setOrigin(0.5);
                    this.letterTexts[row][col] = txt;
                    this.stepContainer.add(txt);
                }
            }
        }

        // DEL and OK buttons
        const specialY = startY + this.gridRows * cellH + 10;
        this.delText = this.add.text(GAME_W / 2 - 80, specialY, 'DEL', {
            fontSize: '22px', fontFamily: 'Arial Black, Arial', color: '#888888',
        }).setOrigin(0.5);
        this.okText = this.add.text(GAME_W / 2 + 80, specialY, 'OK', {
            fontSize: '22px', fontFamily: 'Arial Black, Arial', color: '#888888',
        }).setOrigin(0.5);
        this.stepContainer.add(this.delText);
        this.stepContainer.add(this.okText);

        // cursor highlight
        this.cursorGfx = this.add.graphics();
        this.stepContainer.add(this.cursorGfx);

        // hint
        const hint = this.add.text(GAME_W / 2, GAME_H - 25, 'Arrow Keys to move, SPACE to select', {
            fontSize: '14px', fontFamily: 'Arial', color: '#aaaaaa',
        }).setOrigin(0.5);
        this.stepContainer.add(hint);

        this.updateNameGrid();

        // input
        this.input.keyboard.on('keydown-LEFT', () => {
            if (this.specialRow) { this.specialIdx = Math.max(0, this.specialIdx - 1); }
            else { this.gridX = Math.max(0, this.gridX - 1); }
            this.updateNameGrid();
        });
        this.input.keyboard.on('keydown-RIGHT', () => {
            if (this.specialRow) { this.specialIdx = Math.min(1, this.specialIdx + 1); }
            else { this.gridX = Math.min(this.gridCols - 1, this.gridX); const maxCol = Math.min(this.gridCols - 1, this.nameChars.length - this.gridY * this.gridCols - 1); this.gridX = Math.min(this.gridX + 1, maxCol); }
            this.updateNameGrid();
        });
        this.input.keyboard.on('keydown-UP', () => {
            if (this.specialRow) { this.specialRow = false; }
            else if (this.gridY > 0) { this.gridY--; }
            this.updateNameGrid();
        });
        this.input.keyboard.on('keydown-DOWN', () => {
            if (!this.specialRow && this.gridY < this.gridRows - 1) { this.gridY++; }
            else if (!this.specialRow) { this.specialRow = true; }
            this.updateNameGrid();
        });
        this.input.keyboard.on('keydown-A', () => { if (!this.specialRow) { this.gridX = Math.max(0, this.gridX - 1); this.updateNameGrid(); } });
        this.input.keyboard.on('keydown-D', () => { if (!this.specialRow) { const maxCol = Math.min(this.gridCols - 1, this.nameChars.length - this.gridY * this.gridCols - 1); this.gridX = Math.min(this.gridX + 1, maxCol); this.updateNameGrid(); } });
        this.input.keyboard.on('keydown-W', () => { if (this.specialRow) { this.specialRow = false; } else if (this.gridY > 0) { this.gridY--; } this.updateNameGrid(); });
        this.input.keyboard.on('keydown-S', () => { if (!this.specialRow && this.gridY < this.gridRows - 1) { this.gridY++; } else if (!this.specialRow) { this.specialRow = true; } this.updateNameGrid(); });

        this.input.keyboard.on('keydown-SPACE', () => this.selectNameChar());
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.existingProfile) this.scene.start(this.returnTo);
        });
    }

    getNamePreview() {
        let preview = this.currentName;
        while (preview.length < this.maxNameLen) preview += '_';
        return preview.split('').join(' ');
    }

    selectNameChar() {
        if (this.specialRow) {
            if (this.specialIdx === 0) {
                // DEL
                if (this.currentName.length > 0) {
                    this.currentName = this.currentName.slice(0, -1);
                    sfx.select();
                }
            } else {
                // OK
                if (this.currentName.trim().length >= 1) {
                    sfx.levelUp();
                    this.step = 'country';
                    this.updateStepIndicator();
                    this.setupCountrySelect();
                    return;
                }
            }
        } else {
            const idx = this.gridY * this.gridCols + this.gridX;
            if (idx < this.nameChars.length && this.currentName.length < this.maxNameLen) {
                this.currentName += this.nameChars[idx];
                sfx.select();
            }
        }
        this.namePreview.setText(this.getNamePreview());
        this.updateNameGrid();
    }

    updateNameGrid() {
        // highlight current cell, dim others
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const txt = this.letterTexts[row] && this.letterTexts[row][col];
                if (txt) {
                    if (!this.specialRow && row === this.gridY && col === this.gridX) {
                        txt.setColor('#44ff88').setScale(1.3);
                    } else {
                        txt.setColor('#888888').setScale(1);
                    }
                }
            }
        }
        this.delText.setColor(this.specialRow && this.specialIdx === 0 ? '#ff6644' : '#888888');
        this.delText.setScale(this.specialRow && this.specialIdx === 0 ? 1.3 : 1);
        this.okText.setColor(this.specialRow && this.specialIdx === 1 ? '#44ff88' : '#888888');
        this.okText.setScale(this.specialRow && this.specialIdx === 1 ? 1.3 : 1);

        // cursor box
        this.cursorGfx.clear();
        this.cursorGfx.lineStyle(2, 0x44ff88, 0.8);
        if (this.specialRow) {
            const target = this.specialIdx === 0 ? this.delText : this.okText;
            this.cursorGfx.strokeRoundedRect(target.x - 30, target.y - 16, 60, 32, 5);
        } else {
            const txt = this.letterTexts[this.gridY] && this.letterTexts[this.gridY][this.gridX];
            if (txt) this.cursorGfx.strokeRoundedRect(txt.x - 18, txt.y - 18, 36, 36, 5);
        }
    }

    // ── COUNTRY SELECT ──
    setupCountrySelect() {
        this.clearStep();
        this.listItems = COUNTRIES;
        this.listIdx = 0;
        if (this.existingProfile) {
            const idx = COUNTRIES.indexOf(this.existingProfile.country);
            if (idx >= 0) this.listIdx = idx;
        }
        this.setupScrollableList('Select Your Nationality', () => {
            this.selectedCountry = this.listItems[this.listIdx];
            this.step = 'club';
            this.updateStepIndicator();
            this.setupClubSelect();
        }, () => {
            this.step = 'name';
            this.updateStepIndicator();
            this.setupNameInput();
        });
    }

    // ── CLUB TYPE CHOICE ──
    setupClubSelect() {
        this.clearStep();

        const title = this.add.text(GAME_W / 2, 110, 'Choose Club Type', {
            fontSize: '24px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
        }).setOrigin(0.5);
        this.stepContainer.add(title);

        this.clubTypeIdx = 0;
        const btnStyle = { fontSize: '22px', fontFamily: 'Arial Black, Arial', color: '#888888', stroke: '#000000', strokeThickness: 3 };
        const descStyle = { fontSize: '13px', fontFamily: 'Arial', color: '#aaaaaa', align: 'center' };

        this.clubTypeBtns = [
            this.add.text(GAME_W / 2 - 150, 210, 'Pro Club', btnStyle).setOrigin(0.5),
            this.add.text(GAME_W / 2 + 150, 210, 'Local Club', btnStyle).setOrigin(0.5),
        ];
        this.clubTypeDescs = [
            this.add.text(GAME_W / 2 - 150, 245, 'Pick from a list of\nprofessional clubs', descStyle).setOrigin(0.5),
            this.add.text(GAME_W / 2 + 150, 245, 'Type in the name of\nyour local club', descStyle).setOrigin(0.5),
        ];
        this.clubTypeBtns.forEach(b => this.stepContainer.add(b));
        this.clubTypeDescs.forEach(d => this.stepContainer.add(d));

        const hint = this.add.text(GAME_W / 2, GAME_H - 25, 'LEFT/RIGHT to choose, SPACE to confirm, ESC to go back', {
            fontSize: '14px', fontFamily: 'Arial', color: '#aaaaaa',
        }).setOrigin(0.5);
        this.stepContainer.add(hint);

        this.updateClubTypeSelection();

        this.input.keyboard.on('keydown-LEFT', () => { this.clubTypeIdx = 0; this.updateClubTypeSelection(); });
        this.input.keyboard.on('keydown-RIGHT', () => { this.clubTypeIdx = 1; this.updateClubTypeSelection(); });
        this.input.keyboard.on('keydown-A', () => { this.clubTypeIdx = 0; this.updateClubTypeSelection(); });
        this.input.keyboard.on('keydown-D', () => { this.clubTypeIdx = 1; this.updateClubTypeSelection(); });
        this.input.keyboard.on('keydown-SPACE', () => {
            sfx.select();
            if (this.clubTypeIdx === 0) this.setupProClubSelect();
            else this.setupLocalClubInput();
        });
        this.input.keyboard.on('keydown-ESC', () => {
            this.step = 'country';
            this.updateStepIndicator();
            this.setupCountrySelect();
        });
    }

    updateClubTypeSelection() {
        this.clubTypeBtns.forEach((btn, i) => {
            btn.setColor(i === this.clubTypeIdx ? '#44ff88' : '#888888');
            btn.setScale(i === this.clubTypeIdx ? 1.15 : 1);
        });
    }

    // ── PRO CLUB (scrollable list) ──
    setupProClubSelect() {
        this.clearStep();
        this.listItems = CLUBS;
        this.listIdx = 0;
        if (this.existingProfile) {
            const idx = CLUBS.indexOf(this.existingProfile.club);
            if (idx >= 0) this.listIdx = idx;
        }
        this.setupScrollableList('Select Pro Club', () => {
            this.finishProfile(this.listItems[this.listIdx]);
        }, () => {
            this.setupClubSelect();
        });
    }

    // ── LOCAL CLUB (type name) ──
    setupLocalClubInput() {
        this.clearStep();
        this.clubName = '';
        this.maxClubLen = 16;
        this.nameChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ '.split('');
        this.gridCols = 9;
        this.gridRows = 3;
        this.gridX = 0;
        this.gridY = 0;
        this.specialRow = false;
        this.specialIdx = 0;

        const titleTxt = this.add.text(GAME_W / 2, 100, 'Type Your Club Name', {
            fontSize: '22px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
        }).setOrigin(0.5);
        this.stepContainer.add(titleTxt);

        // club name preview
        this.clubPreview = this.add.text(GAME_W / 2, 135, this.getClubPreview(), {
            fontSize: '26px', fontFamily: 'Arial Black, Arial', color: '#44ff88',
        }).setOrigin(0.5);
        this.stepContainer.add(this.clubPreview);

        // letter grid
        const startX = GAME_W / 2 - (this.gridCols - 1) * 24;
        const startY = 175;
        const cellW = 48;
        const cellH = 40;
        this.letterTexts = [];

        for (let row = 0; row < this.gridRows; row++) {
            this.letterTexts[row] = [];
            for (let col = 0; col < this.gridCols; col++) {
                const idx = row * this.gridCols + col;
                if (idx < this.nameChars.length) {
                    const ch = this.nameChars[idx] === ' ' ? '_' : this.nameChars[idx];
                    const txt = this.add.text(startX + col * cellW, startY + row * cellH, ch, {
                        fontSize: '22px', fontFamily: 'Arial Black, Arial', color: '#888888',
                    }).setOrigin(0.5);
                    this.letterTexts[row][col] = txt;
                    this.stepContainer.add(txt);
                }
            }
        }

        // DEL and OK
        const specialY = startY + this.gridRows * cellH + 8;
        this.delText = this.add.text(GAME_W / 2 - 80, specialY, 'DEL', {
            fontSize: '20px', fontFamily: 'Arial Black, Arial', color: '#888888',
        }).setOrigin(0.5);
        this.okText = this.add.text(GAME_W / 2 + 80, specialY, 'OK', {
            fontSize: '20px', fontFamily: 'Arial Black, Arial', color: '#888888',
        }).setOrigin(0.5);
        this.stepContainer.add(this.delText);
        this.stepContainer.add(this.okText);

        this.cursorGfx = this.add.graphics();
        this.stepContainer.add(this.cursorGfx);

        const hint = this.add.text(GAME_W / 2, GAME_H - 25, 'Arrow Keys to move, SPACE to select, ESC to go back', {
            fontSize: '14px', fontFamily: 'Arial', color: '#aaaaaa',
        }).setOrigin(0.5);
        this.stepContainer.add(hint);

        this.updateClubGrid();

        // input
        this.input.keyboard.on('keydown-LEFT', () => {
            if (this.specialRow) this.specialIdx = Math.max(0, this.specialIdx - 1);
            else this.gridX = Math.max(0, this.gridX - 1);
            this.updateClubGrid();
        });
        this.input.keyboard.on('keydown-RIGHT', () => {
            if (this.specialRow) this.specialIdx = Math.min(1, this.specialIdx + 1);
            else { const maxCol = Math.min(this.gridCols - 1, this.nameChars.length - this.gridY * this.gridCols - 1); this.gridX = Math.min(this.gridX + 1, maxCol); }
            this.updateClubGrid();
        });
        this.input.keyboard.on('keydown-UP', () => {
            if (this.specialRow) this.specialRow = false;
            else if (this.gridY > 0) this.gridY--;
            this.updateClubGrid();
        });
        this.input.keyboard.on('keydown-DOWN', () => {
            if (!this.specialRow && this.gridY < this.gridRows - 1) this.gridY++;
            else if (!this.specialRow) this.specialRow = true;
            this.updateClubGrid();
        });
        this.input.keyboard.on('keydown-A', () => { if (!this.specialRow) { this.gridX = Math.max(0, this.gridX - 1); this.updateClubGrid(); } });
        this.input.keyboard.on('keydown-D', () => { if (!this.specialRow) { const maxCol = Math.min(this.gridCols - 1, this.nameChars.length - this.gridY * this.gridCols - 1); this.gridX = Math.min(this.gridX + 1, maxCol); this.updateClubGrid(); } });
        this.input.keyboard.on('keydown-W', () => { if (this.specialRow) this.specialRow = false; else if (this.gridY > 0) this.gridY--; this.updateClubGrid(); });
        this.input.keyboard.on('keydown-S', () => { if (!this.specialRow && this.gridY < this.gridRows - 1) this.gridY++; else if (!this.specialRow) this.specialRow = true; this.updateClubGrid(); });
        this.input.keyboard.on('keydown-SPACE', () => this.selectClubChar());
        this.input.keyboard.on('keydown-ESC', () => this.setupClubSelect());
    }

    getClubPreview() {
        let preview = this.clubName;
        while (preview.length < this.maxClubLen) preview += '_';
        return preview.split('').join(' ');
    }

    selectClubChar() {
        if (this.specialRow) {
            if (this.specialIdx === 0) {
                if (this.clubName.length > 0) { this.clubName = this.clubName.slice(0, -1); sfx.select(); }
            } else {
                if (this.clubName.trim().length >= 1) {
                    this.finishProfile(this.clubName.trim());
                    return;
                }
            }
        } else {
            const idx = this.gridY * this.gridCols + this.gridX;
            if (idx < this.nameChars.length && this.clubName.length < this.maxClubLen) {
                this.clubName += this.nameChars[idx];
                sfx.select();
            }
        }
        this.clubPreview.setText(this.getClubPreview());
        this.updateClubGrid();
    }

    updateClubGrid() {
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const txt = this.letterTexts[row] && this.letterTexts[row][col];
                if (txt) {
                    if (!this.specialRow && row === this.gridY && col === this.gridX) {
                        txt.setColor('#44ff88').setScale(1.3);
                    } else {
                        txt.setColor('#888888').setScale(1);
                    }
                }
            }
        }
        this.delText.setColor(this.specialRow && this.specialIdx === 0 ? '#ff6644' : '#888888');
        this.delText.setScale(this.specialRow && this.specialIdx === 0 ? 1.3 : 1);
        this.okText.setColor(this.specialRow && this.specialIdx === 1 ? '#44ff88' : '#888888');
        this.okText.setScale(this.specialRow && this.specialIdx === 1 ? 1.3 : 1);

        this.cursorGfx.clear();
        this.cursorGfx.lineStyle(2, 0x44ff88, 0.8);
        if (this.specialRow) {
            const target = this.specialIdx === 0 ? this.delText : this.okText;
            this.cursorGfx.strokeRoundedRect(target.x - 30, target.y - 16, 60, 32, 5);
        } else {
            const txt = this.letterTexts[this.gridY] && this.letterTexts[this.gridY][this.gridX];
            if (txt) this.cursorGfx.strokeRoundedRect(txt.x - 18, txt.y - 16, 36, 32, 5);
        }
    }

    finishProfile(clubName) {
        const profile = {
            id: this.existingProfile ? this.existingProfile.id : Date.now() * 1000 + Math.floor(Math.random() * 1000),
            name: this.currentName.trim(),
            country: this.selectedCountry,
            club: clubName,
        };
        ProfileManager.saveProfile(profile);
        ProfileManager.setActive(profile.id);
        sfx.levelUp();
        this.scene.start(this.returnTo);
    }

    // ── SHARED SCROLLABLE LIST ──
    setupScrollableList(title, onConfirm, onBack) {
        const titleTxt = this.add.text(GAME_W / 2, 105, title, {
            fontSize: '22px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
        }).setOrigin(0.5);
        this.stepContainer.add(titleTxt);

        const visibleCount = 7;
        const centerY = 270;
        const spacing = 38;
        this.listTexts = [];

        for (let i = 0; i < visibleCount; i++) {
            const y = centerY + (i - 3) * spacing;
            const txt = this.add.text(GAME_W / 2, y, '', {
                fontSize: '22px', fontFamily: 'Arial', color: '#888888',
            }).setOrigin(0.5);
            this.listTexts.push(txt);
            this.stepContainer.add(txt);
        }

        // arrows hint
        const upArrow = this.add.text(GAME_W / 2, centerY - 3.5 * spacing - 5, '^ ^ ^', {
            fontSize: '16px', fontFamily: 'Arial', color: '#555555',
        }).setOrigin(0.5);
        const downArrow = this.add.text(GAME_W / 2, centerY + 3.5 * spacing + 5, 'v v v', {
            fontSize: '16px', fontFamily: 'Arial', color: '#555555',
        }).setOrigin(0.5);
        this.stepContainer.add(upArrow);
        this.stepContainer.add(downArrow);

        const hint = this.add.text(GAME_W / 2, GAME_H - 25, 'UP/DOWN to scroll, SPACE to confirm, ESC to go back', {
            fontSize: '14px', fontFamily: 'Arial', color: '#aaaaaa',
        }).setOrigin(0.5);
        this.stepContainer.add(hint);

        this.updateScrollableList();

        this.input.keyboard.on('keydown-UP', () => { this.listIdx = Math.max(0, this.listIdx - 1); sfx.select(); this.updateScrollableList(); });
        this.input.keyboard.on('keydown-DOWN', () => { this.listIdx = Math.min(this.listItems.length - 1, this.listIdx + 1); sfx.select(); this.updateScrollableList(); });
        this.input.keyboard.on('keydown-W', () => { this.listIdx = Math.max(0, this.listIdx - 1); sfx.select(); this.updateScrollableList(); });
        this.input.keyboard.on('keydown-S', () => { this.listIdx = Math.min(this.listItems.length - 1, this.listIdx + 1); sfx.select(); this.updateScrollableList(); });
        this.input.keyboard.on('keydown-SPACE', () => onConfirm());
        this.input.keyboard.on('keydown-ESC', () => onBack());
    }

    updateScrollableList() {
        const mid = 3;
        const isCountryList = this.listItems === COUNTRIES;
        for (let i = 0; i < this.listTexts.length; i++) {
            const dataIdx = this.listIdx + (i - mid);
            if (dataIdx >= 0 && dataIdx < this.listItems.length) {
                const item = this.listItems[dataIdx];
                const label = isCountryList ? `${getFlag(item)}  ${item}` : item;
                this.listTexts[i].setText(label).setVisible(true);
                const dist = Math.abs(i - mid);
                if (dist === 0) {
                    this.listTexts[i].setColor('#44ff88').setScale(1.2).setAlpha(1);
                } else {
                    this.listTexts[i].setColor('#aaaaaa').setScale(1).setAlpha(1 - dist * 0.2);
                }
            } else {
                this.listTexts[i].setVisible(false);
            }
        }
    }
}

// ── Leaderboard Scene ──────────────────────────────────────────────
class LeaderboardScene extends Phaser.Scene {
    constructor() { super('Leaderboard'); }

    init(data) {
        this.returnTo = data.returnTo || 'Title';
        this.returnData = data.returnData || {};
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');

        this.add.text(GAME_W / 2, 30, 'LEADERBOARD', {
            fontSize: '34px', fontFamily: 'Arial Black, Arial',
            color: '#ffdd44', stroke: '#000000', strokeThickness: 5,
        }).setOrigin(0.5);

        // mode tabs
        this.modes = ['dodgeball', 'dribble', 'penalties'];
        this.modeLabels = ['DODGEBALL', 'ANKLE BREAKERS', 'PANENKA'];
        this.selectedMode = 0;
        this.tabTexts = [];

        for (let i = 0; i < 3; i++) {
            const x = GAME_W / 2 + (i - 1) * 180;
            const txt = this.add.text(x, 70, this.modeLabels[i], {
                fontSize: '16px', fontFamily: 'Arial Black, Arial', color: '#888888',
            }).setOrigin(0.5);
            this.tabTexts.push(txt);
        }

        // column headers
        const headerY = 105;
        const hStyle = { fontSize: '12px', fontFamily: 'Arial Black, Arial', color: '#ffdd44' };
        this.add.text(50, headerY, '#', hStyle).setOrigin(0.5);
        this.add.text(160, headerY, 'NAME', hStyle).setOrigin(0.5);
        this.add.text(300, headerY, 'NAT.', hStyle).setOrigin(0.5);
        this.add.text(440, headerY, 'CLUB', hStyle).setOrigin(0.5);
        this.add.text(590, headerY, 'SCORE', hStyle).setOrigin(0.5);
        this.add.text(710, headerY, 'DATE', hStyle).setOrigin(0.5);

        // separator line
        const lineGfx = this.add.graphics();
        lineGfx.lineStyle(1, 0xffdd44, 0.3);
        lineGfx.moveTo(20, headerY + 12);
        lineGfx.lineTo(GAME_W - 20, headerY + 12);
        lineGfx.strokePath();

        this.entryTexts = [];
        this.updateTabs();
        this.displayEntries();

        // hint
        this.add.text(GAME_W / 2, GAME_H - 20, 'LEFT/RIGHT: switch mode  |  SPACE: back', {
            fontSize: '13px', fontFamily: 'Arial', color: '#777777',
        }).setOrigin(0.5);

        // input (delayed to prevent accidental press)
        this.time.delayedCall(300, () => {
            this.input.keyboard.on('keydown-LEFT', () => { this.selectedMode = Math.max(0, this.selectedMode - 1); sfx.select(); this.updateTabs(); this.displayEntries(); });
            this.input.keyboard.on('keydown-RIGHT', () => { this.selectedMode = Math.min(2, this.selectedMode + 1); sfx.select(); this.updateTabs(); this.displayEntries(); });
            this.input.keyboard.on('keydown-A', () => { this.selectedMode = Math.max(0, this.selectedMode - 1); sfx.select(); this.updateTabs(); this.displayEntries(); });
            this.input.keyboard.on('keydown-D', () => { this.selectedMode = Math.min(2, this.selectedMode + 1); sfx.select(); this.updateTabs(); this.displayEntries(); });
            this.input.keyboard.on('keydown-SPACE', () => this.scene.start(this.returnTo, this.returnData));
            this.input.keyboard.on('keydown-ESC', () => this.scene.start(this.returnTo, this.returnData));
        });
    }

    updateTabs() {
        this.tabTexts.forEach((t, i) => {
            if (i === this.selectedMode) {
                t.setColor('#44ff88').setScale(1.15);
            } else {
                t.setColor('#888888').setScale(1);
            }
        });
    }

    displayEntries() {
        this.entryTexts.forEach(t => t.destroy());
        this.entryTexts = [];

        const mode = this.modes[this.selectedMode];
        const entries = ProfileManager.getEntries(mode);
        const startY = 130;
        const rowH = 29;
        const profile = ProfileManager.getProfile();

        if (entries.length === 0) {
            const empty = this.add.text(GAME_W / 2, 260, 'No entries yet!\nPlay a game to appear here.', {
                fontSize: '20px', fontFamily: 'Arial', color: '#555555', align: 'center',
            }).setOrigin(0.5);
            this.entryTexts.push(empty);
            return;
        }

        entries.forEach((entry, i) => {
            const y = startY + i * rowH;
            const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
            const rankColor = i < 3 ? rankColors[i] : '#888888';
            const isMe = profile && entry.name === profile.name;
            const textColor = isMe ? '#ccffcc' : '#cccccc';
            const style = { fontSize: '13px', fontFamily: 'Arial', color: textColor };

            this.entryTexts.push(
                this.add.text(50, y, `${i + 1}`, { ...style, fontSize: '14px', fontFamily: 'Arial Black, Arial', color: rankColor }).setOrigin(0.5),
                this.add.text(160, y, entry.name, style).setOrigin(0.5),
                this.add.text(300, y, getFlag(entry.country), { ...style, fontSize: '18px' }).setOrigin(0.5),
                this.add.text(440, y, entry.club, style).setOrigin(0.5),
                this.add.text(590, y, this.formatScore(mode, entry), style).setOrigin(0.5),
                this.add.text(710, y, entry.date || '', { ...style, fontSize: '11px', color: '#777777' }).setOrigin(0.5),
            );
        });
    }

    formatScore(mode, entry) {
        if (mode === 'dribble') return `${entry.score} (Lv${entry.level || '?'})`;
        if (mode === 'penalties') return `${entry.score}${entry.result ? ' ' + entry.result : ''}`;
        return `${entry.score}`;
    }
}

// ── Title Scene (Mode Select) ─────────────────────────────────────
class TitleScene extends Phaser.Scene {
    constructor() { super('Title'); }

    create() {
        this.cameras.main.setBackgroundColor('#1a472a');
        this.drawMiniStadium();

        // Title
        this.add.text(GAME_W / 2, 60, 'NUTMEG ARCADE', {
            fontSize: '52px', fontFamily: 'Arial Black, Arial',
            color: '#ffffff', stroke: '#000000', strokeThickness: 6,
        }).setOrigin(0.5);

        this.add.text(GAME_W / 2, 100, '\u00A9 bzy studios', {
            fontSize: '13px', fontFamily: 'Arial', color: '#88aa88',
        }).setOrigin(0.5);

        this.add.text(GAME_W / 2, 130, 'Choose a Game Mode', {
            fontSize: '20px', fontFamily: 'Arial', color: '#ccffcc',
        }).setOrigin(0.5);

        // Mode buttons
        this.selected = 0;
        const btnStyle = { fontSize: '22px', fontFamily: 'Arial Black, Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 5 };

        this.modeBtns = [];
        this.modeIcons = [];

        const modeX = [GAME_W / 2 - 260, GAME_W / 2, GAME_W / 2 + 260];
        const names = ['Dodgeball', 'Ankle Breakers', 'Panenka'];

        const hiDodge = localStorage.getItem('stadiumRunner_hiScore') || 0;
        const hiDribble = localStorage.getItem('dribble_hiLevel') || 0;
        const hiPen = localStorage.getItem('penalty_hiScore') || 0;
        const hiLabels = [`Best: ${hiDodge} pts`, `Best: Level ${hiDribble}`, `Best: ${hiPen} pts`];

        for (let i = 0; i < 3; i++) {
            this.modeBtns.push(this.add.text(modeX[i], 230, names[i], btnStyle).setOrigin(0.5));
            this.add.text(modeX[i], 265, hiLabels[i], { fontSize: '13px', fontFamily: 'Arial', color: '#ffdd44' }).setOrigin(0.5);
        }

        // mode icons
        this.modeIcons = [];
        for (let i = 0; i < 3; i++) {
            const ig = this.add.graphics().setDepth(5);
            const cx = modeX[i], cy = 175;
            if (i === 0) {
                // Dodgeball — multiple balls flying
                ig.fillStyle(0xffffff); ig.fillCircle(cx - 18, cy - 5, 7);
                ig.fillStyle(0x222222); ig.fillCircle(cx - 18, cy - 5, 4);
                ig.fillStyle(0xffffff); ig.fillCircle(cx + 2, cy - 12, 7);
                ig.fillStyle(0x222222); ig.fillCircle(cx + 2, cy - 12, 4);
                ig.fillStyle(0xffffff); ig.fillCircle(cx + 18, cy + 2, 7);
                ig.fillStyle(0x222222); ig.fillCircle(cx + 18, cy + 2, 4);
                // motion lines
                ig.lineStyle(2, 0xffaa44, 0.6);
                ig.moveTo(cx - 30, cy - 3); ig.lineTo(cx - 38, cy - 1); ig.strokePath();
                ig.moveTo(cx - 10, cy - 12); ig.lineTo(cx - 18, cy - 14); ig.strokePath();
                ig.moveTo(cx + 8, cy + 4); ig.lineTo(cx + 2, cy + 6); ig.strokePath();
            } else if (i === 1) {
                // Ankle Breakers — player dribbling past defender
                // player (blue)
                ig.fillStyle(0x2255ff); ig.fillRoundedRect(cx - 22, cy - 12, 14, 20, 3);
                ig.fillStyle(0xffcc88); ig.fillCircle(cx - 15, cy - 14, 5);
                // ball at feet
                ig.fillStyle(0xffffff); ig.fillCircle(cx - 10, cy + 12, 5);
                ig.fillStyle(0x222222); ig.fillCircle(cx - 10, cy + 12, 3);
                // defender (red, stumbling)
                ig.fillStyle(0xdd3333); ig.fillRoundedRect(cx + 8, cy - 8, 14, 20, 3);
                ig.fillStyle(0xffcc88); ig.fillCircle(cx + 15, cy - 10, 5);
                // dizzy stars (small diamonds)
                ig.fillStyle(0xffff44, 0.8);
                ig.fillCircle(cx + 24, cy - 16, 3);
                ig.fillCircle(cx + 8, cy - 18, 2);
            } else {
                // Panenka — goal with ball in top corner
                ig.lineStyle(3, 0xffffff, 0.8);
                ig.strokeRect(cx - 25, cy - 15, 50, 30);
                // net lines
                ig.lineStyle(1, 0xcccccc, 0.25);
                for (let nx = cx - 20; nx <= cx + 20; nx += 10) {
                    ig.moveTo(nx, cy - 15); ig.lineTo(nx, cy + 15); ig.strokePath();
                }
                for (let ny = cy - 10; ny <= cy + 10; ny += 10) {
                    ig.moveTo(cx - 25, ny); ig.lineTo(cx + 25, ny); ig.strokePath();
                }
                // ball in top corner
                ig.fillStyle(0xffffff); ig.fillCircle(cx + 18, cy - 8, 6);
                ig.fillStyle(0x222222); ig.fillCircle(cx + 18, cy - 8, 3);
            }
            this.modeIcons.push(ig);
        }

        // player profile display
        const profile = ProfileManager.getProfile();
        if (profile) {
            this.add.text(GAME_W - 15, 15, profile.name, {
                fontSize: '16px', fontFamily: 'Arial Black, Arial',
                color: '#ffdd44', stroke: '#000000', strokeThickness: 3,
            }).setOrigin(1, 0);
            this.add.text(GAME_W - 15, 35, `${profile.club} | ${getFlag(profile.country)}`, {
                fontSize: '11px', fontFamily: 'Arial', color: '#aaaaaa',
            }).setOrigin(1, 0);
        }

        // utility buttons row
        this.navRow = 0; // 0 = modes, 1 = utility
        this.utilSelected = 0;
        const utilStyle = { fontSize: '18px', fontFamily: 'Arial Black, Arial', color: '#888888', stroke: '#000000', strokeThickness: 3 };
        this.utilBtns = [
            this.add.text(GAME_W / 2 - 240, 340, 'Leaderboard', utilStyle).setOrigin(0.5),
            this.add.text(GAME_W / 2, 340, 'Edit Profile', utilStyle).setOrigin(0.5),
            this.add.text(GAME_W / 2 + 240, 340, 'Switch Player', utilStyle).setOrigin(0.5),
        ];

        // Controls hint
        this.add.text(GAME_W / 2, 400, 'Arrow Keys / WASD to navigate  |  Touch & drag on mobile', {
            fontSize: '14px', fontFamily: 'Arial', color: '#88aa88',
        }).setOrigin(0.5);

        // Blink prompt
        const prompt = this.add.text(GAME_W / 2, 440, 'SPACE to select', {
            fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
        }).setOrigin(0.5);
        this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

        this.updateAllSelections();

        // Input
        this.input.keyboard.on('keydown-LEFT', () => {
            if (this.navRow === 0) this.selected = Math.max(0, this.selected - 1);
            else this.utilSelected = Math.max(0, this.utilSelected - 1);
            this.updateAllSelections();
        });
        this.input.keyboard.on('keydown-RIGHT', () => {
            if (this.navRow === 0) this.selected = Math.min(2, this.selected + 1);
            else this.utilSelected = Math.min(2, this.utilSelected + 1);
            this.updateAllSelections();
        });
        this.input.keyboard.on('keydown-A', () => {
            if (this.navRow === 0) this.selected = Math.max(0, this.selected - 1);
            else this.utilSelected = Math.max(0, this.utilSelected - 1);
            this.updateAllSelections();
        });
        this.input.keyboard.on('keydown-D', () => {
            if (this.navRow === 0) this.selected = Math.min(2, this.selected + 1);
            else this.utilSelected = Math.min(2, this.utilSelected + 1);
            this.updateAllSelections();
        });
        this.input.keyboard.on('keydown-UP', () => { if (this.navRow === 1) { this.navRow = 0; this.updateAllSelections(); } });
        this.input.keyboard.on('keydown-DOWN', () => { if (this.navRow === 0) { this.navRow = 1; this.updateAllSelections(); } });
        this.input.keyboard.on('keydown-W', () => { if (this.navRow === 1) { this.navRow = 0; this.updateAllSelections(); } });
        this.input.keyboard.on('keydown-S', () => { if (this.navRow === 0) { this.navRow = 1; this.updateAllSelections(); } });
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.navRow === 0) this.startGame();
            else this.startUtil();
        });

        this.modeBtns.forEach((btn, i) => {
            btn.setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => { this.navRow = 0; this.selected = i; this.startGame(); });
        });
        this.utilBtns.forEach((btn, i) => {
            btn.setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => { this.navRow = 1; this.utilSelected = i; this.startUtil(); });
        });
    }

    updateAllSelections() {
        const modeActive = this.navRow === 0;
        this.modeBtns.forEach((btn, i) => {
            if (modeActive && i === this.selected) {
                btn.setColor('#44ff88').setScale(1.15);
            } else {
                btn.setColor('#888888').setScale(1);
            }
        });
        this.utilBtns.forEach((btn, i) => {
            if (!modeActive && i === this.utilSelected) {
                btn.setColor('#44ff88').setScale(1.1);
            } else {
                btn.setColor('#888888').setScale(1);
            }
        });
    }

    drawMiniStadium() {
        const g = this.add.graphics();
        const pad = 30; // padding around the pitch
        const fw = GAME_W - pad * 2; // field width
        const fh = GAME_H - pad * 2; // field height
        const fx = pad, fy = pad;

        // grass base
        g.fillStyle(0x2d8a4e);
        g.fillRect(0, 0, GAME_W, GAME_H);

        // mow stripes
        const stripeW = fw / 12;
        for (let i = 0; i < 12; i++) {
            if (i % 2 === 0) {
                g.fillStyle(0x33995a, 0.35);
                g.fillRect(fx + i * stripeW, fy, stripeW, fh);
            }
        }

        // dark border around pitch
        g.fillStyle(0x1a5e35);
        g.fillRect(0, 0, GAME_W, fy);           // top strip
        g.fillRect(0, fy + fh, GAME_W, pad);     // bottom strip
        g.fillRect(0, 0, fx, GAME_H);            // left strip
        g.fillRect(fx + fw, 0, pad, GAME_H);     // right strip

        const lineAlpha = 0.35;
        g.lineStyle(2, 0xffffff, lineAlpha);

        // outer boundary
        g.strokeRect(fx, fy, fw, fh);

        // halfway line
        g.moveTo(GAME_W / 2, fy);
        g.lineTo(GAME_W / 2, fy + fh);
        g.strokePath();

        // center circle
        g.beginPath();
        g.arc(GAME_W / 2, GAME_H / 2, fh * 0.18, 0, Math.PI * 2);
        g.strokePath();

        // center spot
        g.fillStyle(0xffffff, lineAlpha);
        g.fillCircle(GAME_W / 2, GAME_H / 2, 3);

        // left penalty box
        const boxW = fw * 0.14;
        const boxH = fh * 0.52;
        const boxY = fy + (fh - boxH) / 2;
        g.lineStyle(2, 0xffffff, lineAlpha);
        g.strokeRect(fx, boxY, boxW, boxH);

        // left goal box (6-yard)
        const goalBoxW = boxW * 0.45;
        const goalBoxH = boxH * 0.52;
        const goalBoxY = fy + (fh - goalBoxH) / 2;
        g.strokeRect(fx, goalBoxY, goalBoxW, goalBoxH);

        // left penalty spot
        g.fillStyle(0xffffff, lineAlpha);
        g.fillCircle(fx + boxW * 0.75, GAME_H / 2, 2);

        // left penalty arc
        g.lineStyle(2, 0xffffff, lineAlpha);
        g.beginPath();
        g.arc(fx + boxW * 0.75, GAME_H / 2, fh * 0.18, Phaser.Math.DegToRad(-50), Phaser.Math.DegToRad(50), false);
        g.strokePath();

        // left goal
        g.lineStyle(3, 0xffffff, lineAlpha * 1.5);
        const goalH = fh * 0.2;
        const goalY = fy + (fh - goalH) / 2;
        g.strokeRect(fx - 8, goalY, 8, goalH);

        // right penalty box
        g.lineStyle(2, 0xffffff, lineAlpha);
        g.strokeRect(fx + fw - boxW, boxY, boxW, boxH);

        // right goal box (6-yard)
        g.strokeRect(fx + fw - goalBoxW, goalBoxY, goalBoxW, goalBoxH);

        // right penalty spot
        g.fillStyle(0xffffff, lineAlpha);
        g.fillCircle(fx + fw - boxW * 0.75, GAME_H / 2, 2);

        // right penalty arc
        g.lineStyle(2, 0xffffff, lineAlpha);
        g.beginPath();
        g.arc(fx + fw - boxW * 0.75, GAME_H / 2, fh * 0.18, Phaser.Math.DegToRad(130), Phaser.Math.DegToRad(230), false);
        g.strokePath();

        // right goal
        g.lineStyle(3, 0xffffff, lineAlpha * 1.5);
        g.strokeRect(fx + fw, goalY, 8, goalH);

        // corner arcs
        const cornerR = fh * 0.04;
        g.lineStyle(2, 0xffffff, lineAlpha);
        g.beginPath(); g.arc(fx, fy, cornerR, 0, Math.PI * 0.5); g.strokePath();
        g.beginPath(); g.arc(fx + fw, fy, cornerR, Math.PI * 0.5, Math.PI); g.strokePath();
        g.beginPath(); g.arc(fx, fy + fh, cornerR, Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(360)); g.strokePath();
        g.beginPath(); g.arc(fx + fw, fy + fh, cornerR, Math.PI, Phaser.Math.DegToRad(270)); g.strokePath();

        // dark overlay so text is readable
        g.fillStyle(0x000000, 0.45);
        g.fillRect(0, 0, GAME_W, GAME_H);
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

    startUtil() {
        sfx.select();
        if (this.utilSelected === 0) {
            this.scene.start('Leaderboard');
        } else if (this.utilSelected === 1) {
            this.scene.start('Profile', { returnTo: 'Title' });
        } else if (this.utilSelected === 2) {
            this.scene.start('ProfileSelect');
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

        // Menu button
        const menuBtn = this.add.text(GAME_W - 10, 6, 'ESC MENU', {
            fontSize: '12px', fontFamily: 'Arial Black, Arial',
            color: '#ffffff', stroke: '#000000', strokeThickness: 3,
            backgroundColor: '#00000066', padding: { x: 6, y: 3 },
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(200).setInteractive({ useHandCursor: true });
        menuBtn.on('pointerdown', () => this.scene.start('Title'));
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('Title'));
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

        // Menu button
        const menuBtn = this.add.text(GAME_W - 10, 6, 'ESC MENU', {
            fontSize: '12px', fontFamily: 'Arial Black, Arial',
            color: '#ffffff', stroke: '#000000', strokeThickness: 3,
            backgroundColor: '#00000066', padding: { x: 6, y: 3 },
        }).setOrigin(1, 0).setDepth(200).setInteractive({ useHandCursor: true });
        menuBtn.on('pointerdown', () => this.scene.start('Title'));
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('Title'));

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

        // ESC to menu
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('Title'));

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

        // Perspective field lines — shooter's view looking at goal
        // Real proportions: goal=7.32m, goal area=18.32m×5.5m,
        // penalty area=40.32m×16.5m, penalty mark=11m from goal line,
        // penalty arc=9.15m radius OUTSIDE penalty area, pitch=68m wide
        const fieldBot = GAME_H;
        const goalLineY = vpY + 30; // where the goal line sits on screen

        // goal line — extends wide across screen
        g.lineStyle(2, 0xffffff, 0.2);
        g.beginPath(); g.moveTo(0, goalLineY); g.lineTo(GAME_W, goalLineY); g.strokePath();

        // goal area (6-yard box) — only slightly wider than the goal
        // 5.5m each side of posts, 5.5m deep. Goal is 7.32m so box is 18.32m wide
        g.lineStyle(2, 0xffffff, 0.25);
        const gaFarW = 120;   // half-width at goal line
        const gaNearW = 145;  // half-width at near edge (perspective widens)
        const gaNearY = goalLineY + 65; // 5.5m out from goal line
        g.beginPath();
        g.moveTo(vpX - gaNearW, gaNearY);
        g.lineTo(vpX - gaFarW, goalLineY);
        g.lineTo(vpX + gaFarW, goalLineY);
        g.lineTo(vpX + gaNearW, gaNearY);
        g.closePath();
        g.strokePath();

        // penalty area (18-yard box) — much wider, you're standing inside it
        // 16.5m each side of posts, 16.5m deep. Box is 40.32m wide
        g.lineStyle(2, 0xffffff, 0.3);
        const paFarW = 250;   // half-width at goal line
        const paNearW = 400;  // half-width at near edge (way past screen edges)
        const paNearY = GAME_H - 20; // near edge of box — just below the player/penalty mark
        // near edge horizontal line
        g.beginPath(); g.moveTo(vpX - paNearW, paNearY); g.lineTo(vpX + paNearW, paNearY); g.strokePath();
        // side lines connecting near edge to goal line
        g.beginPath(); g.moveTo(vpX - paNearW, paNearY); g.lineTo(vpX - paFarW, goalLineY); g.strokePath();
        g.beginPath(); g.moveTo(vpX + paNearW, paNearY); g.lineTo(vpX + paFarW, goalLineY); g.strokePath();

        // penalty mark — where the player stands (GAME_H - 60)
        const penSpotY = GAME_H - 60;
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(vpX, penSpotY, 4);

        // penalty arc (the D) — OUTSIDE the penalty area, curves away from goal
        g.lineStyle(2, 0xffffff, 0.2);
        g.beginPath();
        g.arc(vpX, penSpotY, 55, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(150), false);
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

        // Field lines — goalkeeper view, looking out from goal toward far end
        // Same real proportions as shoot phase, reversed perspective
        const vpX2 = GAME_W / 2;
        const farY = GAME_H * 0.2; // horizon / vanishing point

        // goal line — we're standing on it, extends wide across bottom
        g.lineStyle(2, 0xffffff, 0.15);
        g.beginPath(); g.moveTo(0, GAME_H - 10); g.lineTo(GAME_W, GAME_H - 10); g.strokePath();

        // goal area (6-yard box) — closest to us, only slightly wider than goal
        g.lineStyle(2, 0xffffff, 0.25);
        const gaNearW2 = 180;   // half-width at goal line (near us)
        const gaFarW2 = 145;    // half-width at far edge
        const gaFarY2 = GAME_H * 0.65;  // 5.5m out
        g.beginPath();
        g.moveTo(vpX2 - gaNearW2, GAME_H - 10);
        g.lineTo(vpX2 - gaFarW2, gaFarY2);
        g.lineTo(vpX2 + gaFarW2, gaFarY2);
        g.lineTo(vpX2 + gaNearW2, GAME_H - 10);
        g.closePath();
        g.strokePath();

        // penalty area (18-yard box) — much wider, extends further out
        g.lineStyle(2, 0xffffff, 0.25);
        const paNearW2 = 420;   // half-width at goal line (extends past screen edges)
        const paFarW2 = 260;    // half-width at far edge
        const paFarY2 = GAME_H * 0.35;  // 16.5m out from goal line
        g.beginPath();
        g.moveTo(vpX2 - paNearW2, GAME_H - 10);
        g.lineTo(vpX2 - paFarW2, paFarY2);
        // far edge horizontal line
        g.lineTo(vpX2 + paFarW2, paFarY2);
        g.lineTo(vpX2 + paNearW2, GAME_H - 10);
        g.closePath();
        g.strokePath();

        // penalty spot — 11m out, about 2/3 from goal line to box edge
        const penSpotY2 = GAME_H - 10 - (GAME_H - 10 - paFarY2) * 0.67;
        g.fillStyle(0xffffff, 0.5);
        g.fillCircle(vpX2, penSpotY2, 4);

        // penalty arc (the D) — OUTSIDE the penalty area, curves away from goal
        g.lineStyle(2, 0xffffff, 0.18);
        g.beginPath();
        g.arc(vpX2, penSpotY2, 50, Phaser.Math.DegToRad(220), Phaser.Math.DegToRad(320), false);
        g.strokePath();

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

        // Menu button
        const menuBtn = this.add.text(10, 6, 'ESC MENU', {
            fontSize: '12px', fontFamily: 'Arial Black, Arial',
            color: '#ffffff', stroke: '#000000', strokeThickness: 3,
            backgroundColor: '#00000066', padding: { x: 6, y: 3 },
        }).setOrigin(0, 0).setDepth(200).setInteractive({ useHandCursor: true });
        menuBtn.on('pointerdown', () => this.scene.start('Title'));
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
            const result = `${won ? 'W' : 'L'} ${this.playerGoals}-${this.cpuGoals}`;
            ProfileManager.addEntry('penalties', { score: this.score, result: result });
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

            const btnStyle = { fontSize: '18px', fontFamily: 'Arial Black, Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 4 };
            this.selected = 0;
            this.endBtns = [
                this.add.text(GAME_W / 2 - 200, 340, 'Play Again', btnStyle).setOrigin(0.5),
                this.add.text(GAME_W / 2, 340, 'Leaderboard', btnStyle).setOrigin(0.5),
                this.add.text(GAME_W / 2 + 200, 340, 'Menu', btnStyle).setOrigin(0.5),
            ];
            this.updateEndSelection();

            this.time.delayedCall(500, () => {
                this.input.keyboard.on('keydown-LEFT', () => { this.selected = Math.max(0, this.selected - 1); this.updateEndSelection(); });
                this.input.keyboard.on('keydown-RIGHT', () => { this.selected = Math.min(2, this.selected + 1); this.updateEndSelection(); });
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
        } else if (this.selected === 1) {
            this.scene.start('Leaderboard', { returnTo: 'Title' });
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
            ProfileManager.addEntry('dodgeball', { score: this.finalScore, level: this.level });
        } else {
            const prevHi = parseInt(localStorage.getItem('dribble_hiLevel') || '0');
            if (this.level > prevHi) localStorage.setItem('dribble_hiLevel', this.level.toString());
            ProfileManager.addEntry('dribble', { score: this.finalScore, level: this.level });
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

        // ── Continue / Reset / Leaderboard / Menu buttons ──
        this.selected = 0;
        const btnY = 365;
        const btnStyle = { fontSize: '18px', fontFamily: 'Arial Black, Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 4 };

        this.btns = [
            this.add.text(GAME_W / 2 - 270, btnY, 'Continue', btnStyle).setOrigin(0.5),
            this.add.text(GAME_W / 2 - 90, btnY, 'Reset', btnStyle).setOrigin(0.5),
            this.add.text(GAME_W / 2 + 100, btnY, 'Leaderboard', btnStyle).setOrigin(0.5),
            this.add.text(GAME_W / 2 + 280, btnY, 'Menu', btnStyle).setOrigin(0.5),
        ];

        this.add.text(GAME_W / 2, btnY + 35, 'Arrow Keys to choose, SPACE to select', {
            fontSize: '12px', fontFamily: 'Arial', color: '#999999',
        }).setOrigin(0.5);

        this.updateSelection();

        this.time.delayedCall(500, () => {
            this.input.keyboard.on('keydown-LEFT', () => { this.selected = Math.max(0, this.selected - 1); this.updateSelection(); });
            this.input.keyboard.on('keydown-RIGHT', () => { this.selected = Math.min(3, this.selected + 1); this.updateSelection(); });
            this.input.keyboard.on('keydown-A', () => { this.selected = Math.max(0, this.selected - 1); this.updateSelection(); });
            this.input.keyboard.on('keydown-D', () => { this.selected = Math.min(3, this.selected + 1); this.updateSelection(); });
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
        } else if (this.selected === 2) {
            this.scene.start('Leaderboard', { returnTo: 'Title' });
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
    scene: [BootScene, ProfileSelectScene, ProfileScene, LeaderboardScene, TitleScene, GameScene, DribbleScene, PenaltyScene, GameOverScene],
};

const game = new Phaser.Game(config);
