# Feature: State Persistence and Session Management

## Capability Description

Provides game session lifecycle management, initial dungeon layout distribution, character initialization, and persistent progression state synchronization across browser sessions.

## Key Capabilities & Authoritative Seed Rules

- **Boot & Character Initialization:**
  - Initial character selection between Magician and Archer vocations.
  - Loading baseline stats, attributes, and starting loadout from persistent storage.
- **Dungeon Manifest Distribution:**
  - Retrieval and initialization of the 40×40 dungeon floor layout, terrain matrix, obstacle coordinates, and entity/loot spawn distributions.
- **Progress Persistence & Floor State Synchronization:**
  - Synchronizes character health, mana, and inventory when picking up loot or reaching the illuminated exit tile.
  - Ensures player progression and cleared floor state persist reliably across browser reloads.

*(Note: Data schemas, endpoint contracts, and sync payloads are owned by Stage 3 briefs and engineering stages.)*
