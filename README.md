# Lokarta: Come Into The Light

> A browser-native, single-player, 2D tile-based subterranean dungeon exploration RPG inspired by classic PC titles (*Tibia*, *Ultima VI*).

---

## 1. Overview & Vision

**Lokarta: Come Into The Light** combines deliberate grid-locked movement, tactile floor inventory stacks, and atmospheric light-versus-darkness mechanics.

The game is structured with a **client-authoritative Single Page Application (SPA)** frontend to guarantee zero-latency tactical responsiveness and combat feedback, paired with a companion **FastAPI + SQLite** backend responsible for dungeon layout distribution, loot seeding, and persistent character/world state saves.

### Key Highlights
- **The "Light" Mechanic:** Subterranean dungeon chambers are naturally pitch black. Players navigate using illumination from equipped torches, ambient wall sconces, or class spells (*Light Aura*), while darkness conceals lurking monsters and terrain hazards.
- **Oblique Top-Down Pixel Aesthetic:** Rendered on a rigid 32×32 pixel grid with upright walls, entities, and flat stone flagstones.
- **Tactile Environment:** Dropped items, potions, and equipment physically render on the ground tile stack (`tile.items = [...]`). Objects exist directly in the game world.
- **Modular Desktop Shell:** A centered rendering canvas viewport surrounded by classic modular panels: equipment paperdoll, backpack containers, health/mana status pools, ability hotbar, and a scrolling combat message log.

---

## 2. Architecture & Technology Stack

```text
┌────────────────────────────────────────────────────────┐
│                   Browser SPA Client                   │
│  ├── Engine Core (Headless TypeScript):               │
│  │   - Internal tick loop (100ms / 10 Hz)              │
│  │   - Discrete grid coordinates (x, y)                │
│  │   - Raycasting for Line-of-Sight & Light Radius     │
│  │   - Monster AI state machines & A* pathfinding      │
│  └── View & UI Layer:                                  │
│      - HTML5 2D Canvas viewport & procedural sprites   │
│      - Light-mask / Fog-of-War darkness overlay        │
│      - DOM/CSS HUD (Paperdoll, Backpack, Combat Log)   │
└───────────────▲────────────────────────▲───────────────┘
                │ GET /api/dungeons/{id} │ POST /api/character/save
                │ (Layout & Spawns)      │ POST /api/dungeon/sync
┌───────────────▼────────────────────────▼───────────────┐
│                    FastAPI Backend                     │
│  ├── /api/dungeons/{id} -> Matrix, Spawner Layout      │
│  ├── /api/characters/{id} -> Vocation, Stats, Inventory│
│  └── SQLite DB (characters, inventory, world_progress) │
└────────────────────────────────────────────────────────┘
```

- **Frontend:** TypeScript + Vite, HTML5 2D Canvas rendering, modular DOM/CSS UI.
- **Backend:** Python 3.9+ (Python 3.11/3.12 recommended), FastAPI, Uvicorn, Pydantic v2.
- **Persistence:** SQLite (`lokarta.db`) with asynchronous access via `aiosqlite`.
- **Testing:** `pytest` + `pytest-asyncio` (backend), `vitest` (frontend engine).

---

## 3. Setup & Execution Guide

### Prerequisites
- **Python:** 3.9 or higher (3.11+ recommended)
- **Node.js & npm:** Node.js v18+ and npm v9+

### Quick Start

1. **Install Dependencies:**
   ```bash
   ./install.sh
   ```
   This script provisions the Python virtual environment (`.venv`), installs required Python packages from `requirements.txt`, and runs `npm install` inside `./frontend`.

2. **Launch Services:**
   ```bash
   ./run.sh
   ```
   This launches both services concurrently:
   - **Backend API:** `http://127.0.0.1:8000` (Interactive API Docs: `http://127.0.0.1:8000/docs`)
   - **Frontend Client:** `http://localhost:5173`
   - Logs are captured in `tmp/backend.log` and `tmp/frontend.log`.
   - Press `Ctrl+C` to gracefully terminate both services.

3. **Open the Game:**
   Navigate your web browser to **`http://localhost:5173`**.

---

## 4. Controls & Gameplay

### Character Selection
At launch, choose between two distinct vocations:
- **Magician:** High mana pool, fragile health. Starts equipped with an *Apprentice Wand*, *Wooden Torch*, and *Cloth Robe*.
- **Archer:** Balanced health and mana. Starts equipped with a *Wooden Bow*, *Leather Armor*, and a quiver of *Arrows*.

### Keybindings & Interactions

| Key / Control | Action | Details |
| :--- | :--- | :--- |
| **`W` / `Up Arrow`** | Move North | Step 1 tile north (10 Hz discrete movement). |
| **`S` / `Down Arrow`** | Move South | Step 1 tile south (10 Hz discrete movement). |
| **`A` / `Left Arrow`** | Move West | Step 1 tile west (10 Hz discrete movement). |
| **`D` / `Right Arrow`** | Move East | Step 1 tile east (10 Hz discrete movement). |
| **`[1]`** | Primary Attack | Magician: *Wand Spark* (Ranged magic projectile)<br>Archer: *Bow Shot* (Consumes 1 Arrow). |
| **`[2]`** | Class Ability | Magician: *Light Aura* (Expands sight radius to 7 tiles for 30s)<br>Archer: *Power Shot* (High physical damage burst). |
| **`[3]`** | Secondary Spell | Magician: *Energy Beam* (Piercing line attack through up to 4 tiles). |
| **`[E]`** | Pick Up Item | Picks up the top item on the current tile into your 6-slot backpack. |
| **`[U]`** | Use Ground Potion | Drinks a potion directly from the floor tile without picking it up. |
| **Mouse Click** | UI Interactions | Click backpack items to use/equip/drop; click paperdoll slots to unequip. |

---

## 5. Implementation Summary (What Was Built)

The vertical slice implements all 7 capability areas defined in the project specifications:

1. **Dungeon Environment & Grid Exploration (`features/01`):**
   - 40×40 Subterranean Crypt with walkable stone flagstones, solid perimeter/interior stone walls, an entrance at `(2, 2)`, and illuminated exit stairs at `(37, 37)`.
   - Discrete 10 Hz tick loop ensuring grid-aligned movement on 32×32px tiles without analog slipping.
2. **Dynamic Lighting & Line-of-Sight (`features/02`):**
   - Bresenham raycasting computing light propagation from the player and ambient wall sconces.
   - Wall light occlusion preventing light leaks through solid structures.
   - Pitch-black fog-of-war alpha compositing that conceals dormant monsters until illuminated.
   - Dynamic sight radii: 1 tile baseline unlit, 5 tiles with equipped torch, 7 tiles with Magician *Light* aura, and 3 tiles for static ambient emitters.
3. **Playable Vocations & Combat Abilities (`features/03`):**
   - Magician and Archer archetypes with dedicated stat pools and active ability sets.
   - Strict resource enforcement: Mana deduction for magic spells, physical arrow inventory consumption for archery.
   - Piercing multi-target projectile mechanics for *Energy Beam*.
4. **Enemy Archetypes & Tactical AI (`features/04`):**
   - **Crypt Skeleton (Melee):** Awakens when brought into player's light radius; pursues using A* pathfinding; attacks every 1.5 seconds when adjacent.
   - **Shadow Cultist (Ranged):** Maintains a 3-to-4 tile standoff distance (advancing or retreating) and casts *Shadow Bolt* projectiles every 2.0 seconds with line-of-sight.
   - Defeated monsters dynamically spawn loot directly on their death tiles.
5. **Tactile Inventory, Equipment & Ground Stacks (`features/05`):**
   - 6-slot backpack container and 3-slot paperdoll (`right_hand`, `left_hand`, `armor`).
   - Ground items stack directly on grid tiles (`tile.items = [...]`).
   - Support for picking up, dropping, equipping, and consuming items directly from backpack or floor.
6. **Modular Desktop Shell Interface (`features/06`):**
   - Viewport canvas flanked by modular UI panels: Paperdoll, Backpack, Status Bars (HP/MP gauges + buff timers), Action Hotbar (with cooldown indicators), and auto-scrolling Combat Log.
7. **State Persistence & Synchronization (`features/07`):**
   - REST endpoints (`/api/dungeons/{id}`, `/api/characters/{id}`, `/api/character/save`, `/api/dungeon/sync`).
   - SQLite tables (`characters`, `inventory_items`, `dungeon_floors`, `world_progress`) committing mutated stats, equipment, and floor clearance.

---

## 6. Verification Results

A comprehensive verification pass was executed in Stage 08, covering live REST services, automated test suites, asset builds, and static engine inspection.

### Test Suites & Status: **PASS (All 9 Verification Areas Passed)**

```text
============================= Backend Test Suite (pytest) =============================
tests/test_backend.py::test_health_endpoints PASSED                             [ 14%]
tests/test_backend.py::test_get_dungeon_floor_1 PASSED                          [ 28%]
tests/test_backend.py::test_get_nonexistent_dungeon_floor PASSED                [ 42%]
tests/test_backend.py::test_character_seeding_magician PASSED                   [ 57%]
tests/test_backend.py::test_character_seeding_archer PASSED                     [ 71%]
tests/test_backend.py::test_character_save_and_persistence PASSED               [ 85%]
tests/test_backend.py::test_dungeon_sync PASSED                                 [100%]
================================ 7 passed in 0.22s ====================================

============================ Frontend Test Suite (vitest) =============================
 ✓ tests/engine.test.ts (13 tests)
   ✓ GridMap & Collision > correctly reports walkable floor and blocking walls
   ✓ GridMap & Collision > handles floor item stacking and popping
   ✓ LightingSystem & Line of Sight > computes correct light radii for base, torch, and spell aura
   ✓ LightingSystem & Line of Sight > occludes line-of-sight behind solid walls
   ✓ CombatSystem & Abilities > executes Magician Light spell and checks mana cost and cooldown
   ✓ CombatSystem & Abilities > executes Archer Bow Shot, decrements arrows, and checks empty ammo guard
   ✓ CombatSystem & Abilities > executes Magician Energy Beam along 4-tile direction piercing multiple enemies
   ✓ EntityAI Tactical Archetypes > Skeleton moves towards player and attacks when adjacent
   ✓ EntityAI Tactical Archetypes > Cultist maintains standoff distance and casts shadow bolt
   ✓ InventorySystem & Consumables > picks up items into backpack with 6-slot capacity enforcement
   ✓ InventorySystem & Consumables > equips and unequips items to paperdoll slots
   ✓ InventorySystem & Consumables > consumes health potion from backpack and restores HP
   ✓ InventorySystem & Consumables > consumes potion directly from ground tile without picking up
================================ 13 passed in 3ms =====================================

========================= Production Asset Compilation (vite) ==========================
✓ 23 modules transformed.
dist/index.html                  1.96 kB │ gzip:  0.84 kB
dist/assets/index-J9FPeuFh.css  11.08 kB │ gzip:  2.86 kB
dist/assets/index-DMfERvW4.js   55.56 kB │ gzip: 15.60 kB
✓ built in 95ms
```

To run the test suites locally:
```bash
# Run backend pytest suite
.venv/bin/pytest -v

# Run frontend vitest suite
(cd frontend && npm test)

# Run frontend build
(cd frontend && npm run build)
```

For full details and captured HTTP payloads, refer to [`docs/verification-report.md`](docs/verification-report.md).

---

## 7. Known Issues & Limitations

As recorded during verification and architectural design:
1. **Single Floor Scope:** The vertical slice is confined to a single subterranean crypt floor (Floor 1). Multi-floor $Z$-axis transitions and deeper floor generation are deferred to future milestones.
2. **Local Session Identity:** Authentication uses local character profile IDs (`magician`, `archer`) rather than multi-user OAuth or tokenized accounts.
3. **Client-Authoritative Architecture:** Combat, AI, and light calculations run client-side. Live WebSocket server-authoritative multiplayer is out-of-scope for the MVP.
4. **Testing Disclosure:** Browser DOM and Canvas UI interactions were verified via unit tests, TypeScript compilation, and static code inspection; live browser automation (e.g. Playwright/Puppeteer) was not executed in the verification environment.

---

## 8. Recommended Next Actions

For future development passes, the following enhancements are recommended:
1. **Procedural Multi-Floor Dungeon Generator:** Add support for deeper floors ($Z$-transitions) with increasing monster difficulty, themed tilesets, and staircase transitions.
2. **Expanded Vocation & Spell Trees:** Introduce additional classes (Knight, Paladin, Druid), active defensive shields, area-of-effect spells, and passive talent progression.
3. **Boss Encounters & Special Mechanics:** Implement multi-phase crypt boss encounters requiring tactical light management and environmental interactions.
4. **Sound FX & Ambient Audio:** Integrate Web Audio sound effects for footfalls, wand sparks, bow releases, skeleton clatter, and ambient subterranean hums.
5. **Server-Authoritative Co-Op:** Expand the FastAPI backend with WebSockets to enable cooperative multi-player dungeon delving.
