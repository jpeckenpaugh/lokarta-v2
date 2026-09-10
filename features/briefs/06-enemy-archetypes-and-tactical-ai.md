# Feature Brief: 06 — Enemy Archetypes and Tactical AI

## Purpose

Provides challenging, autonomous enemy monsters with distinct tactical AI state machines, line-of-sight aggro detection, pathfinding, and tactile death loot drops.

## Expected Behavior

1. **Illumination-Driven Aggro Detection:**
   - Dormant monsters rest in unlit dungeon chambers.
   - When a monster's grid tile becomes illuminated by the player's active light radius or spell light, the monster awakens and transitions into an active aggressive state (`Aggro`).
2. **Crypt Skeleton (Melee Archetype):**
   - *Behavior & Pathfinding:* Pursues the player across the dungeon grid using A* pathfinding around stone walls and obstacles.
   - *Combat Attack:* Once directly adjacent (distance = 1 tile), attacks the player in close melee every 1.5 seconds, dealing physical damage.
3. **Shadow Cultist (Ranged / Caster Archetype):**
   - *Behavior & Spacing:* Maintains a tactical standoff distance, attempting to remain 3 to 4 tiles away from the player while preserving line-of-sight. If the player rushes close, the cultist backsteps if walkable tiles exist behind it.
   - *Combat Attack:* Channels and casts *Shadow Bolt* projectiles that travel in a straight line toward the player's coordinate, damaging the player on impact.
4. **Tactile Death Loot Drops:**
   - When a monster's HP reaches 0, the monster entity is removed from the grid and its defeated body spawns rolled loot items (e.g., Health/Mana Potions, Arrows, Coins, Equipment, Relics) directly onto the monster's death tile stack (`tile.items`).
   - Ground items remain physically rendered on the floor tile for the player to collect.

## Inputs / Outputs

- **Inputs:**
  - Player position `(x, y)` and current illumination radius.
  - Dungeon obstacle map for pathfinding calculations.
  - Combat damage inflicted on monsters.
- **Outputs:**
  - Monster position updates `(x, y)` on the grid.
  - Monster attack swings and projectile trajectories.
  - Damage dealt to the player.
  - XP awards to the player upon monster defeat.
  - Spawned floor loot items on the death tile.

## User-Visible Behavior

- Enemies emerge from the darkness when illuminated by the player's torch or light spells.
- Crypt Skeletons march menacingly toward the player and strike when adjacent, accompanied by skeletal clatter sounds and hit sparks.
- Shadow Cultists maintain distance and shoot dark purple energy bolts through the corridors.
- Defeated enemies dissolve into ash or bone piles, leaving shiny loot icons resting visibly on the dungeon floor.

## Constraints

- Monsters cannot detect or aggro onto the player while fully shrouded in darkness.
- Monsters cannot walk through stone walls or impassable terrain.
- Projectiles from Shadow Cultists are blocked by solid walls.
- Monster pathfinding must run performantly at 10 Hz without lagging the 60 FPS client renderer.

## Basic Acceptance Expectations

1. A Crypt Skeleton resting in darkness remains dormant until illuminated by player light.
2. Once illuminated, the Skeleton pathfinds toward the player and attacks when adjacent.
3. A Shadow Cultist maintains a 3–4 tile distance and fires projectile bolts when line-of-sight exists.
4. Damaging a monster reduces its HP, and reaching 0 HP defeats it.
5. Defeating an enemy awards XP and places physical loot items onto the ground tile where the monster died.
