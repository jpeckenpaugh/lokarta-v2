# Lokarta: Come Into The Light

> A browser-native, single-player, 2D tile-based subterranean dungeon exploration RPG inspired by classic PC titles (*Tibia*, *Ultima VI*).

---

## 1. Overview & Vision

**Lokarta: Come Into The Light** is a 2D grid-locked subterranean exploration RPG combining deliberate tactical movement, tactile floor inventory mechanics, and atmospheric light-versus-darkness dynamics.

The application is structured as a **client-authoritative Single Page Application (SPA)** to ensure zero-latency tactical response and immediate combat feedback, coupled with a companion **FastAPI + SQLite** backend responsible for dungeon layout distribution, loot seeding, and persistent character/world state saves.

### Key Highlights & Pillars
- **The "Light" Mechanic:** Subterranean dungeon chambers are naturally pitch black. Players navigate using illumination from equipped torches, ambient wall sconces, or class spells (*Light Aura*, *Holy Radiance*), while darkness conceals lurking monsters and terrain hazards until brought into the light radius.
- **Oblique Top-Down Pixel Aesthetic:** Rendered on a rigid 32×32 pixel grid with upright walls, entities, and flat stone flagstones.
- **Tactile Environment & Auto-Loot:** Items physically exist in the game world on ground tile stacks (`tile.items = [...]`). Stepping over items auto-loots them directly into active slots without cumbersome menus.
- **Roguelike Fate Grant Drafting:** Characters start with zero initial inventory. At Level 1 and at every level-up milestone, players draft active abilities, weapons, spells, and equipment from a weighted 5-card offering.
- **Multi-Modal Action Hotbar:** 10 action slots mapped to keys `1`–`9` and `0` supporting dynamic input timing (Tap, Hold/Charge, Double-Tap).
- **Modular Desktop Shell:** A centered rendering canvas viewport flanked by modular panels: 4-slot Paperdoll, 6-slot Backpack container, status pools (HP/MP gauges + buff timers), 10 Action Slots, and a scrolling combat message log.

---

## 2. 4 Playable Vocations

Players can embark on their descent with four distinct vocations, each featuring unique attribute balances, starting combat cards, and sprite aesthetics:

| Vocation | Base HP | Base Mana | Combat Role & Core Kit | Archetype Fantasy |
| :--- | :--- | :--- | :--- | :--- |
| **🧙 Magician** | 60 | 150 | High magic burst, fragile health. *Wand Spark* (Ranged projectile), *Light Aura* (Vision boost to 7 tiles for 30s), *Energy Beam* (Piercing line attack through 4 tiles). | Master of arcane rays and illuminating auras. |
| **🏹 Archer** | 90 | 80 | Balanced ranged skirmisher. *Bow Shot* (Consumes arrows), *Power Shot* (High physical damage burst), *Eagle Eye* (Extended line-of-sight). | Tactical sniper maintaining line-of-sight and ammo reserves. |
| **⚔️ Fighter** | 140 | 30 | High durability melee powerhouse. *Slash* (Adjacent physical strike), *Cleave* (Sweeping arc hit), *Fortify* (Defensive stance absorbing 50% damage). | Frontline brawler cleaving through swarms of crypt horrors. |
| **🛡️ Paladin** | 120 | 90 | Holy champion blending melee and radiant magic. *Holy Strike* (Radiant blade hit), *Healing Prayer* (Restores HP), *Holy Radiance* (Passive light and protection). | Sacred crusader vanquishing darkness with divine power. |

---

## 3. 10 Action Slots & Multi-Modal Gesture Engine

The user interface features **10 modular action slots** bound to number keys `1` through `9` and `0`. Each slot can hold weapons, active spells, class techniques, scrolls, torches, or consumables.

### Multi-Modal Timing & Activation Modes

The input engine classifies key presses and pointer clicks into three distinct gesture modes:

1. **Tap (< 250ms):**
   - Triggers standard primary action execution (e.g. quick strike, standard spell cast, or drinking a potion).
2. **Hold / Charge (≥ 250ms, up to 1.5s):**
   - Displays a live, real-time visual energetic charge meter filling over the slot button.
   - Discharging the held key releases an **Overcharged Attack** delivering 1.5× bonus damage or expanded area coverage.
3. **Double-Tap (< 300ms between presses):**
   - Triggers rapid combo activations, twin-strike maneuvers, or rapid utility triggers.

All action slots feature real-time radial cooldown sweep animations and resource cost indicators. Slots can be freely rearranged via drag-and-drop.

---

## 4. Zero-Inventory Start & Fate Grant Roguelike Engine

Lokarta replaces fixed starting equipment loadouts with a dynamic roguelike draft engine:

- **Zero Starting Inventory:** Every new character profile begins with empty action slots, an empty backpack, and an unequipped paperdoll.
- **Level 1 Fate Grant Draft:** Upon entering the crypt, exploration pauses and the **Fate Grant Modal** presents a 5-card draft with guaranteed vocation-aligned starter cards (e.g. basic weapon/spell, lighting tool, restorative potion).
- **Level-Up Milestones:** Every level gained awards a fresh 5-card draft with weighted offerings across rarity tiers:
  - **Common (60%):** Standard weapons, basic spell upgrades, minor potions.
  - **Rare (25%):** Enchanted equipment, piercing abilities, advanced elixirs.
  - **Epic (12%):** Masterwork armaments, high-tier spells, persistent relics.
  - **Legendary (3%):** Mythic artifacts and ultimate vocation techniques.
- **Smart Inventory Placement:** Drafted cards automatically populate the lowest empty Action Slot (1–10) first, followed by the Backpack (1–6).

---

## 5. Frictionless Floor Interaction & Inventory Architecture

### Walkover Auto-Loot
- Stepping onto any floor coordinate containing dropped items automatically loots them into the lowest available Action Slot, then Backpack.
- Items remain physically rendered on the floor tile stack only if inventory capacity is fully saturated.
- Direct pointer clicks on adjacent floor items immediately gather them into inventory.
- Legacy `[E]` (pickup) and `[U]` (use) interaction keys have been completely removed in favor of fluid, frictionless movement.

### Inventory & Paperdoll Layout
- **Paperdoll (4 Equipment Slots):**
  - `main_hand`: Weapons and wands.
  - `off_hand`: Shields, torches, and auxiliary focus items.
  - `armor`: Robes, chainmail, and plate armors.
  - `relic`: Sacred amulets, rings, and magical talismans.
- **Backpack (6 Container Slots):**
  - Dedicated storage grid `#1` through `#6` for excess gear, potions, and consumables with drag-and-drop and one-click equip capabilities.

---

## 6. Architecture & Technology Stack

```text
┌────────────────────────────────────────────────────────┐
│                   Browser SPA Client                   │
│  ├── Engine Core (Headless TypeScript):               │
│  │   - Internal tick loop (100ms / 10 Hz)              │
│  │   - Discrete grid coordinates (x, y)                │
│  │   - Bresenham Raycasting (Lighting & LOS)           │
│  │   - Multi-Modal Gesture Engine (Tap, Hold, D-Tap)   │
│  │   - Fate Grant Roguelike Drafting & Level Scaling   │
│  │   - Tactical Monster AI (A* pursuit & standoff)     │
│  └── View & UI Layer:                                  │
│      - HTML5 2D Canvas Viewport (32x32px tiles/sprites)│
│      - Dynamic Light-mask & Fog-of-War Alpha Overlay   │
│      - Modular DOM/CSS HUD (10 Slots, Paperdoll, Logs) │
└───────────────▲────────────────────────▲───────────────┘
                │ GET /api/dungeons/{id} │ POST /api/character/save
                │ (Layout & Spawns)      │ POST /api/dungeon/sync
┌───────────────▼────────────────────────▼───────────────┐
│                    FastAPI Backend                     │
│  ├── /api/dungeons/{id} -> 40x40 Matrix & Spawners     │
│  ├── /api/characters/{id} -> 4 Vocations, Stats, Slots │
│  └── SQLite DB (characters, inventory, world_progress) │
└────────────────────────────────────────────────────────┘
```

- **Frontend:** TypeScript + Vite, HTML5 2D Canvas rendering, modular CSS grid framing.
- **Backend:** Python 3.9+ (Python 3.11/3.12 recommended), FastAPI, Uvicorn, Pydantic v2.
- **Persistence:** SQLite (`lokarta.db`) with asynchronous operations via `aiosqlite`.
- **Testing:** `pytest` + `pytest-asyncio` (backend), `vitest` (frontend engine).

---

## 7. Setup & Execution Guide

### Prerequisites
- **Python:** 3.9 or higher (3.11/3.12 recommended)
- **Node.js & npm:** Node.js v18+ and npm v9+

### Quick Start

1. **Install Dependencies:**
   ```bash
   ./install.sh
   ```
   Provisions the Python virtual environment (`.venv`), installs backend dependencies from `requirements.txt`, and runs `npm install` inside `./frontend`.

2. **Launch Services:**
   ```bash
   ./run.sh
   ```
   Spawns both backend and frontend concurrently:
   - **Backend API:** `http://127.0.0.1:8000` (Swagger UI: `http://127.0.0.1:8000/docs`)
   - **Frontend Client:** `http://localhost:5173`
   - Real-time service logs are directed to `tmp/backend.log` and `tmp/frontend.log`.
   - Press `Ctrl+C` to gracefully terminate all services.

3. **Play:**
   Open your browser to **`http://localhost:5173`**.

---

## 8. Controls & Keybindings Reference

| Key / Input | Action | Behavior / Notes |
| :--- | :--- | :--- |
| **`W` / `Up Arrow`** | Move North | Step 1 tile north (10 Hz discrete grid movement). |
| **`S` / `Down Arrow`** | Move South | Step 1 tile south (10 Hz discrete grid movement). |
| **`A` / `Left Arrow`** | Move West | Step 1 tile west (10 Hz discrete grid movement). |
| **`D` / `Right Arrow`** | Move East | Step 1 tile east (10 Hz discrete grid movement). |
| **`[1]` – `[9]`, `[0]` (Tap)** | Primary Action | Quick-cast spell, perform basic weapon strike, or drink potion in slot. |
| **`[1]` – `[9]`, `[0]` (Hold)** | Charged Action | Hold ≥250ms to fill charge meter; release for 1.5× Overcharged attack. |
| **`[1]` – `[9]`, `[0]` (Double-Tap)** | Combo Action | Press twice within 300ms for rapid twin-strike or quick utility burst. |
| **Walkover** | Auto-Loot | Walk onto any ground item to immediately loot into Action Slots / Backpack. |
| **Left Click (Canvas)** | Interact / Target | Click an enemy to target; click adjacent floor item to loot. |
| **Left Click (Inventory)** | Equip / Use | Click backpack items to equip/use; click paperdoll slots to unequip. |
| **Drag & Drop** | Slot Management | Rearrange items freely across 10 Action Slots and 6 Backpack slots. |

---

## 9. Verification Results

A comprehensive verification pass was conducted across the completed stack (`backend/` and `frontend/`) against all specifications in `concept.md`, `docs/architecture.md`, and `features/briefs/01-09`:

### Verification Summary: **PASS (9/9 Capability Areas Verified)**

- **Backend Pytest Suite:** **8/8 tests passed** (Health checks, 4-vocation zero-inventory seeding, 40×40 dungeon matrix delivery, 10-slot action bar persistence, 4-slot paperdoll storage, level/XP progression, and floor clearance sync).
- **Frontend Vitest Suite:** **20/20 tests passed** (Grid collision, LOS wall occlusion, dynamic light radii, multi-modal gesture classification, 4-vocation combat kits, Fate Grant drafting, walkover auto-loot, and state synchronization).
- **Production Asset Compilation:** **0 TypeScript or Vite bundling errors**.

```text
============================= Backend Test Suite (pytest) =============================
tests/test_backend.py::test_health_endpoints PASSED                      [ 12%]
tests/test_backend.py::test_get_dungeon_floor_1 PASSED                   [ 25%]
tests/test_backend.py::test_get_nonexistent_dungeon_floor PASSED         [ 37%]
tests/test_backend.py::test_character_seeding_all_four_vocations_zero_inventory PASSED [ 50%]
tests/test_backend.py::test_character_save_and_persistence_with_10_action_slots_and_paperdoll PASSED [ 62%]
tests/test_backend.py::test_dungeon_sync PASSED                          [ 75%]
tests/test_backend.py::test_get_multiple_dungeon_floors_and_boss_floor_20 PASSED [ 87%]
tests/test_backend.py::test_character_level_and_xp_persistence PASSED    [100%]
============================== 8 passed in 0.26s ===============================

============================ Frontend Test Suite (vitest) =============================
 ✓ tests/engine.test.ts (20 tests)
   ✓ GridMap & Collision > correctly reports walkable floor and blocking walls
   ✓ GridMap & Collision > handles floor item stacking and popping
   ✓ LightingSystem & Line of Sight > computes correct light radii for base, torch, and spell aura
   ✓ LightingSystem & Line of Sight > occludes line-of-sight behind solid walls
   ✓ CombatSystem & Abilities > executes Magician Light spell and checks mana cost and cooldown
   ✓ CombatSystem & Abilities > executes Archer Bow Shot, decrements arrows, and checks empty ammo guard
   ✓ CombatSystem & Abilities > executes Magician Energy Beam along 4-tile direction piercing multiple enemies
   ✓ CombatSystem & Abilities > executes Fighter Cleave damaging adjacent enemies
   ✓ CombatSystem & Abilities > executes Paladin Healing Prayer and restores HP
   ✓ GestureEngine & Multi-Modal Inputs > classifies short press as Tap
   ✓ GestureEngine & Multi-Modal Inputs > classifies held press as Hold / Charge
   ✓ GestureEngine & Multi-Modal Inputs > classifies rapid consecutive presses as Double-Tap
   ✓ EntityAI Tactical Archetypes > Skeleton moves towards player and attacks when adjacent
   ✓ EntityAI Tactical Archetypes > Cultist maintains standoff distance and casts shadow bolt
   ✓ InventorySystem & Consumables > walkover auto-loots items into action bar first, then backpack
   ✓ InventorySystem & Consumables > equips and unequips items to 4-slot paperdoll
   ✓ InventorySystem & Consumables > consumes health potion from backpack and restores HP
   ✓ FateGrantSystem > generates 5 cards with guaranteed vocation starter cards at Level 1
   ✓ FateGrantSystem > rolls higher rarity cards on Level-Up
   ✓ ProgressionSystem > adds XP and triggers level-up event
============================== 20 passed in 6ms ================================
```

To run test suites locally:
```bash
# Backend pytest suite
.venv/bin/pytest tests/test_backend.py -v

# Frontend vitest suite
npm --prefix frontend test

# Frontend production build
npm --prefix frontend run build
```

For full details, live HTTP payloads, and traceability tables, refer to [`docs/verification-report.md`](docs/verification-report.md).

---

## 10. Known Issues & Limitations

1. **Single Floor Active Scope:** The vertical slice features a handcrafted 40×40 crypt floor (Floor 1). Multi-floor $Z$-axis elevation transitions and procedural floor generation are planned for future passes.
2. **Local Session Authentication:** Uses local profile IDs (`magician`, `archer`, `fighter`, `paladin`) without centralized multi-user OAuth.
3. **Client-Authoritative Architecture:** Combat calculations, gesture timings, and local AI state machines execute in the browser client. Live WebSocket server-authoritative multiplayer is deferred.
4. **Testing Disclosure:** Browser DOM and Canvas UI interactions were verified through automated TypeScript unit tests, Vite build compilation, and static code inspection; live browser automation was not executed in the test environment.

---

## 11. Recommended Next Actions

1. **Procedural Multi-Floor Crypts:** Introduce procedural dungeon generation with staircase transitions connecting deeper crypt levels.
2. **Boss Encounters & Dynamic Lighting Hazards:** Add multi-phase dungeon bosses with shadow aura mechanics that extinguish player light sources.
3. **Audio & Sound FX Engine:** Integrate Web Audio sound effects for weapon impacts, spell charges, footsteps, and atmospheric dungeon ambiance.
4. **Expanded Card Pool & Relic Synergies:** Enrich the Fate Grant draft pool with passive build-defining artifacts and hybrid spell combinations.
5. **Multiplayer Co-Op:** Expand the FastAPI backend with WebSocket channels for co-op dungeon exploration.
