# Nutmeg Arcade

Browser-based soccer arcade built with **Phaser 3**. Three mini-games, player profiles, and leaderboards — all in a single HTML + JS file with zero external assets.

## Games

**Dodgeball** — Sprint down a scrolling pitch while dodging soccer balls hurled by fans. Kick them away or weave through the chaos. Levels get progressively harder.

**Ankle Breakers** — Dribble past defenders on a fixed-length field and score. Use skill moves to juke tacklers and find a path to goal.

**Panenka** — Penalty shootout. Alternate between taking shots and saving them across 5 rounds.

## How to Play

Open `index.html` in any modern browser. No server or build step required.

### Controls

| Action | Keys |
|--------|------|
| Move | Arrow keys / WASD |
| Kick / Shoot | Space |
| Menu navigate | Arrow keys |
| Select | Space / Enter |
| Back | Escape |

## Features

- All graphics and sound effects are procedurally generated — no image or audio files
- Multi-profile support with per-player leaderboards
- 31 national teams and 32 clubs to choose from
- Persistent progress via localStorage

## Tech

- [Phaser 3.60](https://phaser.io/) (loaded via CDN)
- Web Audio API for synthesized SFX
- Vanilla JS, no build tools or dependencies
