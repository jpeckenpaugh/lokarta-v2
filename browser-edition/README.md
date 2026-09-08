# Lokarta: Browser Edition

**Lokarta: Browser Edition** is a zero-backend, static, offline-capable distribution of *Lokarta: Come Into The Light*. It runs entirely inside standard modern web browsers using native Web standards: **Web Workers**, **IndexedDB**, **vanilla ES Modules**, HTML5 Canvas rendering, and **procedural Web Audio API**.

---

## 🌟 Key Highlights

- **Zero-Backend & Fully Static:** No Python, FastAPI, SQLite, or server runtime required to play. Can be hosted on GitHub Pages, Cloudflare Pages, S3, or any local static HTTP file server.
- **Dedicated Web Worker:** Runs procedural floor generation and state synchronization in a background worker thread (`game-worker.js`) communicating over a typed RPC protocol (`game-client.js`).
- **IndexedDB Persistence:** Complete character progression, equipped gear, 6-slot backpack state, settings, and dungeon floors 1–20 persist locally across browser reloads.
- **Procedural 20-Floor Dungeon:** Deterministic Mulberry32 PRNG generator (`floor-generator.js`) across 4 biomes (Subterranean Crypt, Catacombs of Whispers, Shadow Vaults, Abyssal Sanctum) culminating in the Floor 20 Abyssal Overlord boss fight.
- **Procedural Web Audio:** Real-time synthesis of sound effects (footsteps, wand sparks, energy beams, bow shots, power shots, monster hits, level-up fanfares, potions) using the Web Audio API.

---

## 🚀 Quick Start & Launching

Because the Browser Edition uses native ES Modules and Web Workers (`type: "module"`), files must be served over HTTP/HTTPS rather than opened directly as `file://` URLs.

### Option 1: Root Launcher Script (Recommended)
From the project root:
```bash
./run-browser.sh
```
This automatically detects available tools (`python3`, `npx serve`, `live-server`, or `http-server`) and launches the game on **`http://localhost:3000`**.

### Option 2: Python 3 Built-in HTTP Server
```bash
python3 -m http.server -d browser-edition 3000
```
Open [http://localhost:3000](http://localhost:3000) in any modern browser.

### Option 3: Node.js `serve` / `npx`
```bash
npx serve browser-edition -l 3000
```

---

## 🧪 Running Automated Tests

Lokarta Browser Edition features a test suite using Node.js's native test runner (`node:test` and `node:assert/strict`).

Run the test suite with:
```bash
node --test browser-edition/tests/engine.test.mjs
```

### Verified Test Suites (46/46 Tests Passing):
1. **Floor Generator (1-20):** Deterministic Mulberry32 seed generation, 40×40 boundary constraints, spawn at `(2,2)`, exit stairs at `(35,35)`, full BFS room/corridor connectivity, depth-based monster scaling, and Floor 20 Abyssal Overlord boss stats (600 HP, 20 ATK, 6 DEF).
2. **GridMap & Tile Bounds:** Walkability, walls, stairs, doors, coordinate boundaries, and ground item stack management.
3. **LightingSystem & LOS:** Dynamic light radii (Base 3, Torch 7, Light Spell 6), Bresenham raycasting, wall occlusion, and light-triggered monster aggro.
4. **ProgressionSystem & Leveling:** XP formulas (`level * 100`), monster kill XP, Magician/Archer stat growth (+8 HP/+16 MP for Magician, +14 HP/+8 MP for Archer), skill boosts, and Level 20 cap.
5. **CombatSystem & Abilities:** Wand Spark, Light Spell, piercing Energy Beam, Bow Shot (with arrow depletion), Power Shot, and monster loot tables.
6. **InventorySystem & Stacking:** 6-slot backpack limit, 9-item stack limit for Potions/Torches, 99-item limit for Arrows, and 3-slot Paperdoll equipment mechanics.
7. **GameClient & Worker Protocol:** Asynchronous command serialization, request/response lifecycle, timeout protection, and error propagation.

---

## 🏛️ Architectural Mapping (Browser Edition vs Fullstack)

| Browser Edition Component | Fullstack (Vite + FastAPI) Equivalent | Architectural Purpose |
| :--- | :--- | :--- |
| `browser-edition/floor-generator.js` | `backend/services/dungeon_service.py` & `seed_data/` | Procedural 40×40 dungeon floor generation, room carving, corridors, door placement, monster & loot spawning. |
| `browser-edition/storage.js` | `backend/database.py` & SQLite (`aiosqlite`) | Local persistence layer. Replaces server SQLite tables with IndexedDB Object Stores (`characters`, `dungeon_floors`, `profile`, `game_settings`). |
| `browser-edition/game-worker.js` | `backend/main.py` & `backend/routers/*` | Dedicated background thread handling authoritative state persistence, floor caching, and data operations without blocking the main UI loop. |
| `browser-edition/game-client.js` | `frontend/src/services/api.ts` | Typed asynchronous RPC client. Replaces `fetch()` HTTP requests with Promise-wrapped Web Worker `postMessage()` dispatches. |
| `browser-edition/engine.js` | `frontend/src/engine/*` (`GameEngine`, `GridMap`, `LightingSystem`, `CombatSystem`, `EntityAI`, `InventorySystem`, `ProgressionSystem`) | Standalone core game simulation modules, discrete grid movement, Bresenham raycasting, A* monster pathfinding, and combat calculations. |
| `browser-edition/audio.js` | Audio assets / SFX subsystem | Procedural Web Audio synthesizer generating dynamic retro sound effects on the fly with zero external WAV/MP3 asset files. |
| `browser-edition/app.js` | `frontend/src/main.ts` & `frontend/src/renderer/*` | Canvas tile/sprite rendering pipeline, 10 Hz fixed tick simulation loop, 60 FPS interpolated animation, HUD panel controller, and keyboard input binding. |
| `browser-edition/index.html` & `styles.css` | `frontend/index.html` & CSS modules | Desktop RPG layout container, paperdoll UI, 6-slot backpack, ability hotbars, vitals meters, and scrolling combat log. |

---

## 🎮 Controls & Gameplay

- **Movement:** `W` / `A` / `S` / `D` or `Arrow Keys` (or on-screen D-Pad)
- **Select Vocation:** Magician (ranged magic & illumination) or Archer (high single-target damage & ammo management)
- **Abilities:**
  - **Key `1`:** Primary Skill (*Wand Spark* / *Bow Shot*)
  - **Key `2`:** Utility Skill (*Light Spell* / *Power Shot*)
  - **Key `3`:** Ultimate Skill (*Energy Beam* - piercing line damage)
- **Items & Interaction:**
  - **Key `E` or `Space`:** Pick up item from ground tile into backpack
  - **Backpack Clicks:** Click any backpack slot to use consumable or equip gear
  - **Paperdoll Clicks:** Click equipped item to unequip back into backpack
  - **Stairs:** Step onto the radiant stairs portal at `(35,35)` to advance to the next floor
