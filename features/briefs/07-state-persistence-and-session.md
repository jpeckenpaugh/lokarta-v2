# Feature Brief: State Persistence and Session Management

- **Feature ID:** `07-state-persistence-and-session`
- **Related Capability:** `features/07-state-persistence-and-session.md`

## 1. Purpose

Provides game session lifecycle initialization, backend dungeon layout distribution, character selection loading, and reliable state persistence across browser reloads via REST synchronization with the SQLite database.

## 2. Expected Behavior

1. **Boot & Session Initialization:**
   - On initial browser load, the application presents a character selection screen allowing the player to choose between **Magician** and **Archer**.
   - Upon selection, the client requests the character's profile, base attributes, and starting loadout from the backend via `GET /api/characters/{id}`.

2. **Dungeon Manifest Distribution:**
   - The client fetches the 40×40 subterranean crypt floor layout, tile matrix, spawn points, and initial loot placements via `GET /api/dungeons/{id}` (e.g. `GET /api/dungeons/1`).
   - The client engine parses the manifest and builds the local 40×40 tile grid, placing the player at the entrance coordinates and populating enemy entities and ground items.

3. **In-Game State Synchronization:**
   - **Loot Pickup Trigger:** Whenever the player picks up an item from the floor into their backpack or equipment, the client dispatches a background save request to `POST /api/character/save` with current inventory and stats.
   - **Exit Stairway Floor Clear Trigger:** When the player reaches and steps onto the illuminated exit stairway tile, the client dispatches a floor clear synchronization request (`POST /api/dungeon/sync`) along with a full character state snapshot.
   - The backend records character HP, Mana, equipped items, backpack items, and cleared floor completion state to the SQLite database.

4. **Session Resume & Reload Resilience:**
   - When the user refreshes the browser or re-opens the game, the application detects the existing session/character and loads the latest saved state from the backend rather than resetting back to zero.

## 3. Inputs / Outputs

- **User Inputs:**
  - Vocation selection click on the boot screen.
  - In-game loot pickups and stepping onto the exit stairway tile (triggering automatic sync).
- **Backend API Endpoints:**
  - `GET /api/dungeons/{id}`: Returns 40×40 dungeon matrix, wall boundaries, spawn points, and loot.
  - `GET /api/characters/{id}`: Returns vocation, stats (HP, Mana), equipped items, and backpack contents.
  - `POST /api/character/save`: Commits updated player stats and inventory to SQLite.
  - `POST /api/dungeon/sync`: Commits cleared floor completion state and updated world data.

## 4. User-Visible Behavior

- Smooth start screen welcoming the player to choose their vocation.
- Fast, clean transition into the dungeon as map data loads from the backend.
- Subtle save indicator in the UI / combat log (e.g., *"Progress saved."*) when loot is secured or the floor exit is reached.
- Refreshing the web page maintains all accumulated loot and remaining health/mana.

## 5. Constraints

- **Decoupled Architecture:** Client is authoritative for local tick simulation and immediate inputs; FastAPI + SQLite handles layout distribution and persistent storage.
- **RESTful Endpoints:** State sync occurs over discrete HTTP REST calls (`GET` / `POST`); no persistent WebSocket protocol required for MVP.
- **SQLite Persistence:** All character records, inventory items, and floor progression must persist reliably in SQLite.

## 6. Basic Acceptance Expectations

1. Starting the application displays Magician and Archer selection options.
2. Selecting a character loads starting stats and inventory from `GET /api/characters/{id}` and dungeon map from `GET /api/dungeons/1`.
3. Picking up an item sends a `POST /api/character/save` request and successfully stores the updated inventory in SQLite.
4. Stepping on the exit stairway sends a `POST /api/dungeon/sync` request marking the floor complete.
5. Reloading the browser restores the player's saved health, mana, and inventory items.
