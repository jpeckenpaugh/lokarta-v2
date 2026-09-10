# Feature: State Persistence and Session Management

## Capability Description

Provides game session lifecycle management, dungeon distribution, character initialization, and persistent progression state synchronization across browser sessions.

## Key Capabilities & Authoritative Seed Rules

- **Boot & Character Initialization:**
  - Initial character creation supporting four playable vocations: Magician, Archer, Fighter, Paladin.
  - Zero-inventory character initialization triggering the Level 1 Fate Grant sequence.
- **Dungeon Manifest Distribution:**
  - Retrieval and initialization of the 40×40 dungeon floor layout, terrain matrix, obstacle coordinates, and entity/loot spawn distributions from the backend (`GET /api/dungeon/1`).
- **Progress Persistence & Floor State Synchronization:**
  - Synchronizes character health, mana, XP, level, learned spells, action slots, backpack inventory, and equipment state to persistent SQLite backend (`POST /api/character/save`).
  - Records cleared floor state, defeated monsters, and collected ground items upon reaching the illuminated exit tile (`POST /api/dungeon/sync`).
  - Ensures full progression persists reliably across browser reloads.

*(Note: Data schemas, endpoint contracts, and sync payloads are owned by Stage 3 briefs and engineering stages.)*
