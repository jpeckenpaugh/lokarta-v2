# Feature Brief: 09 — State Persistence and Session Management

## Purpose

Manages the game session lifecycle, distributes dungeon manifests from the server, initializes new character runs, and ensures complete player progression and floor state persist across browser sessions.

## Expected Behavior

1. **Boot & Session Initialization:**
   - The browser application loads and establishes a session with the backend service.
   - The player selects a character profile name and chooses from one of four vocations: Magician, Archer, Fighter, or Paladin.
   - Initial character creation initializes a zero-inventory character state and triggers the Level 1 Fate Grant sequence.
2. **Dungeon Manifest Distribution (`GET /api/dungeon/{id}`):**
   - The client fetches the 40×40 dungeon floor manifest from the backend API.
   - The payload provides the complete tile matrix (walls, flagstones), entrance coordinates, illuminated exit stairway coordinates, light emitter positions, monster spawn coordinates/archetypes, and initial ground loot spawns.
3. **Character Progression Persistence (`POST /api/character/save`):**
   - The client periodically or upon significant state change events (e.g., leveling up, equipping items, drinking potions) serializes the character's current state (Vocation, Level, XP, Current HP/Mana, Max HP/Mana, 10 Action Slots, 6 Backpack slots, equipped Paperdoll items, learned spells) and transmits it to the backend SQLite store.
4. **Floor Clear State Synchronization (`POST /api/dungeon/sync`):**
   - When the player steps onto the illuminated exit stairway tile, the client dispatches a synchronization payload recording the cleared dungeon state, defeated monster identifiers, collected ground items, and updated player stats.
5. **Session Recovery & Reload Resilience:**
   - Refreshing or reopening the browser loads the latest saved character progression and dungeon state, restoring the player's exact inventory, action slots, and level milestone without data loss.

## Inputs / Outputs

- **Inputs:**
  - Character creation form input (profile name, vocation choice).
  - Exit stairway tile trigger event.
  - Periodic auto-save / manual save trigger events.
- **Outputs:**
  - HTTP `GET /api/dungeon/{id}` response with dungeon floor layout and spawns.
  - HTTP `POST /api/character/save` persistence payload.
  - HTTP `POST /api/dungeon/sync` floor clearance payload.
  - Restored game session state on browser reload.

## User-Visible Behavior

- At startup, the player sees a character creation / selection screen presenting the 4 vocations with summaries of their combat strengths.
- Entering the dungeon seamlessly loads the crypt layout.
- Saving state occurs unobtrusively in the background, with a subtle "Game Saved" indicator appearing in the combat log upon reaching milestones or exit stairs.
- Reloading the page smoothly resumes the character with all drafted cards, action slot bindings, and XP intact.

## Constraints

- Server communication uses REST endpoints over HTTP JSON payloads.
- Persistence failures (e.g., network disconnects) must fail gracefully with local fallback caching or user-visible retry indicators.
- Character progression must accurately preserve the 10 Action Slots and 6 Backpack slots exactly as arranged by the player.

## Basic Acceptance Expectations

1. Creating a character with any of the 4 vocations initializes a persistent profile.
2. Dungeon layout and monster spawns load successfully from `GET /api/dungeon/1`.
3. Leveling up and drafting items sends updated inventory and stats to `POST /api/character/save`.
4. Reaching the exit stairway successfully calls `POST /api/dungeon/sync`.
5. Refreshing the browser page preserves character level, HP/Mana, action slot loadout, and backpack contents.
