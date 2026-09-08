# Concept: Lokarta: Come Into The Light

## 1. Executive Summary & Vision

**Lokarta: Come Into The Light** is a browser-native, single-player, 2D tile-based dungeon exploration RPG. Visually and mechanically inspired by early PC classics like *Tibia* and *Ultima VI*, the game combines deliberate grid-locked movement, tactile floor inventory stacks, and atmospheric light-versus-darkness mechanics.

The game is structured as a client-authoritative Single Page Application (SPA) to guarantee zero-latency tactical movement, immediate combat feedback, and lightweight hosting. It is strictly decoupled from a companion **FastAPI + SQLite** backend responsible for dungeon layout distribution, loot seeding, and persistent character/world state saves. This separation ensures an immediate vertical slice while leaving a clean pathway toward multiplayer or alternative client shells in future phases.

## 2. Thematic Pillar & Visual Feel

* **The "Light" Mechanic:** Subterranean dungeon chambers are naturally pitch black. The player only sees tiles illuminated by equipped torches, ambient wall sconces, or class spells. Darkness masks lurking monsters and terrain hazards until brought into the light radius.
* **Oblique Top-Down Pixel Aesthetic:** Rendered on a rigid 32×32 pixel grid with flat floor tiles and upright vertical elements (walls, props, entities). No isometric diamonds, 3D mesh projections, or smooth analog physics.
* **Tactile Environment:** Dropped items, potions, and equipment physically render on the ground tile stack (`tile.items = [...]`). Objects exist in the game world, not behind abstract loot menus.
* **Desktop Shell Framing:** A centered rendering canvas viewport surrounded by classic modular panels: equipment paperdoll, backpack containers, health/mana status pools, and a scrolling combat message log.

## 3. Scope Boundaries (Proof of Concept / MVP)

### In-Scope (Core Vertical Slice):

* **Single Floor Descent:** A handcrafted or seed-generated 40×40 subterranean crypt with stone walls, walkable flagstones, dynamic light-masking, a starting entrance, and an illuminated exit stairway.
* **Two Playable Vocations:**
* **Magician:** Fragile, high mana pool. Basic ranged wand spark.
* *Spell 1 (Light):* Casts an illumination aura increasing field-of-view radius for 30 seconds.
* *Spell 2 (Energy Beam):* High-damage piercing line strike that damages all enemies in a 4-tile path.


* **Archer:** Balanced health and mana. Standard ranged bow shot requiring line-of-sight and consuming physical arrows.
* *Ability (Power Shot):* Heavy single-target physical burst on a separate cooldown.




* **Two Enemy Archetypes:**
* *Crypt Skeleton (Melee):* Aggro triggered upon entering player's illuminated radius. Chases via grid pathfinding; attacks every 1.5 seconds when directly adjacent.
* *Shadow Cultist (Ranged/Caster):* Maintains a 3-to-4 tile standoff distance; casts shadow bolts that travel straight at the player.


* **Inventory & Ground Interaction:**
* 6-slot backpack grid + 3 paperdoll equip slots (Right Hand / Weapon, Left Hand / Shield or Light, Armor).
* Ground interactions: Pick up items from the current tile, drop items to adjacent floor coordinates, or consume potions directly from the ground or backpack.
* Essential items: Health Potion, Mana Potion, Wooden Torch, Arrows, Basic Equipment.


* **Decoupled Architecture Contract:**
* **Browser Client:** Drives the 60 FPS visual canvas, local tick engine (10 Hz), input processing, combat resolutions, and monster state machines.
* **FastAPI Backend:** Serves initial dungeon seed manifests and exposes REST sync endpoints to commit character progression and cleared floor state to SQLite.



### Explicitly Out-of-Scope (Deferred):

* Live WebSocket synchronization or server-authoritative multiplayer loops.
* Multi-floor $Z$-axis elevation transitions (confined to a single flat floor for POC).
* Complex branching NPC dialogue or quest state engines.
* Full account registration / secure OAuth authentication (uses local profile names / player IDs).

## 4. Architectural Primitives

```text
┌────────────────────────────────────────────────────────┐
│                   Browser SPA Client                   │
│  ├── Engine Core (Headless TypeScript):               │
│  │   - Internal tick loop (100ms / 10 Hz)              │
│  │   - Discrete grid coordinates (x, y)                │
│  │   - Raycasting for Line-of-Sight & Light Radius     │
│  │   - Monster AI state machines & A* pathfinding      │
│  └── View & UI Layer:                                  │
│      - 2D Canvas / PixiJS grid & sprite renderer       │
│      - Light-mask / Fog-of-War darkness overlay        │
│      - DOM/CSS HUD (Paperdoll, Backpack, Combat Log)   │
└───────────────▲────────────────────────▲───────────────┘
                │ GET /api/dungeon       │ POST /api/character/save
                │ (Layout & Spawns)      │ POST /api/dungeon/sync
┌───────────────▼────────────────────────▼───────────────┐
│                    FastAPI Backend                     │
│  ├── /api/dungeons/{id} -> Matrix, Spawner Layout      │
│  ├── /api/characters/{id} -> Vocation, Stats, Inventory│
│  └── SQLite DB (characters, inventories, world_state)  │
└────────────────────────────────────────────────────────┘

```

## 5. Technology Stack Selection

* **Frontend:** TypeScript + Vite, using HTML5 2D Canvas or PixiJS for tile/sprite rendering and standard HTML/CSS for modular interface framing.
* **Backend:** Python 3.11+ with FastAPI, Pydantic v2 validation models, and SQLite (via `sqlite3` or `aiosqlite`).
* **Asset Pipeline:** CC0 32×32 fantasy pixel art tileset (e.g., Kenney Micro RPG or DawnLike) with modular fallback colored bounding boxes during initial agent wiring.

## 6. Definition of Done (Acceptance Criteria)

1. **Boot & Session Init:** The FastAPI service starts, initializes the SQLite database, and the browser client boots cleanly through Vite.
2. **Character Choice:** The player chooses between Magician or Archer at start, loading initial stats and equipped items from the backend.
3. **Map Retrieval:** The client fetches the 40×40 dungeon floor from `GET /api/dungeon/1`, rendering stone corridors, spawn locations, and ambient darkness.
4. **Light & Exploration:** Moving the character with WASD/Arrows updates the dynamic light mask; darkness conceals rooms until a torch or light spell illuminates them.
5. **Combat & Looting:** The player engages an enemy in combat, defeats it with auto-attacks or class abilities, and observes dropped loot appear directly on the enemy's death tile.
6. **Persistence Handoff:** Picking up loot and reaching the illuminated exit tile dispatches a `POST` sync request to the FastAPI server, verifying updated health, mana, and inventory persist across browser reloads.
