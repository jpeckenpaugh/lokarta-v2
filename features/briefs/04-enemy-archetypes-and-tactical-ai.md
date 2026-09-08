# Feature Brief: Enemy Archetypes and Tactical AI

- **Feature ID:** `04-enemy-archetypes-and-tactical-ai`
- **Related Capability:** `features/04-enemy-archetypes-and-tactical-ai.md`

## 1. Purpose

Provides autonomous monster behaviors, light-triggered aggro mechanics, distinct melee and ranged tactical positioning AI, combat attacks, and ground loot drop generation upon enemy defeat.

## 2. Expected Behavior

1. **Light-Triggered Aggro Mechanic:**
   - Monsters spawn in dormant / un-aggroed state in pitch darkness.
   - When the player's light radius reaches a monster's tile (and there is clear line-of-sight), the monster enters the active **Aggro** state.
   - Once aggroed, the monster engages its archetype behavior loop to pursue or engage the player.

2. **Crypt Skeleton (Melee Archetype):**
   - **Tactical Movement:** Computes shortest walkable path to the player using discrete grid pathfinding (A*), avoiding impassable stone walls and obstacles.
   - **Engagement:** Pursues the player until reaching a directly adjacent cardinal tile (North, South, East, West).
   - **Attack Cadence:** Delivers a melee slash attack every **1.5 seconds** while remaining adjacent to the player, inflicting physical damage.

3. **Shadow Cultist (Ranged/Caster Archetype):**
   - **Tactical Positioning:** Actively seeks to maintain a **3-to-4 tile standoff distance** from the player:
     - If the player is within 1–2 tiles, the cultist retreats to open walkable tiles away from the player.
     - If the player is further than 4 tiles away, the cultist advances into the 3–4 tile sweet spot.
   - **Attack Cadence:** Casts dark *Shadow Bolt* projectiles that travel in a straight line toward the player every **2.0 seconds**, provided there is unobstructed line-of-sight.

4. **Defeat & Ground Loot Generation:**
   - When a monster's health pool reaches 0, it is removed from the active enemy matrix and combat loop.
   - A death event spawns loot items (such as Health/Mana Potions, Arrows, Torches, or Equipment) directly onto the monster's exact death tile coordinates within the world ground stack (`tile.items`).

## 3. Inputs / Outputs

- **System Inputs:**
  - Monster state machines (coordinates, health, current aggro state, attack cooldown timer).
  - Player position coordinates `(x, y)`.
  - Tile collision map and active illumination mask.
- **System Outputs:**
  - Monster position updates per tick.
  - Monster attacks directed at the player (damage deducted from player HP).
  - Projectile animations for *Shadow Bolt*.
  - Death removal and addition of dropped item entities to `tile.items`.
  - Logged combat events (e.g., *"Crypt Skeleton strikes you for 12 damage."*, *"Shadow Cultist was slain! Dropped Health Potion."*).

## 4. User-Visible Behavior

- Skeletons remain hidden in dark rooms until illuminated, at which point their eyes glow red and they march relentlessly toward the player.
- Shadow Cultists backpedal away from approaching players to maintain distance and fling purple shadow bolts down corridors.
- Slain enemies collapse and their physical loot items immediately appear resting on the dungeon floor tile.

## 5. Constraints

- **Skeleton Attack Cadence:** Exactly 1.5 seconds between melee attacks when adjacent.
- **Cultist Distance:** Standoff range locked to 3–4 tiles.
- **Aggro Rule:** Aggro triggered strictly upon entering the player's illuminated radius with line of sight.
- **Tactile Drops:** Loot items must drop into the physical tile ground stack (`tile.items`), not in an abstract pop-up window.

## 6. Basic Acceptance Expectations

1. A Crypt Skeleton dormant in darkness remains inactive until brought into the player's light radius.
2. An aggroed Skeleton navigates around walls, approaches to an adjacent tile, and executes an attack every 1.5 seconds.
3. A Shadow Cultist steps backward if the player moves adjacent, preserving a 3–4 tile distance, and fires shadow bolts.
4. Reducing any enemy to 0 HP removes the entity and places dropped items directly on the floor at that coordinate.
5. Slain enemy actions and loot drops are printed to the combat log.
