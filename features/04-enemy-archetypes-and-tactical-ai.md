# Feature: Enemy Archetypes and Tactical AI

## Capability Description

Provides autonomous enemy monsters featuring distinct combat roles, light-triggered aggro, tactical positioning AI, and localized death loot generation.

## Key Capabilities & Authoritative Seed Rules

- **Crypt Skeleton (Melee Archetype):**
  - Aggro behavior: Aggro is triggered when the skeleton enters the player's illuminated radius.
  - Movement & Pathfinding: Chases the player across walkable floor tiles using grid pathfinding.
  - Attack profile: Delivers melee attacks every 1.5 seconds when positioned directly adjacent (cardinal/grid contact) to the player.
- **Shadow Cultist (Ranged/Caster Archetype):**
  - Aggro & Positioning: Maintains a 3-to-4 tile standoff distance from the player.
  - Attack profile: Casts shadow bolts that travel in a straight line toward the player.
- **Defeat & Death Drops:**
  - Upon zero health, enemies are eliminated from the combat matrix and drop loot items directly onto their death coordinate tile on the ground stack.

*(Note: Pathfinding edge cases, aggro tethering, and exact loot drop tables are owned by Stage 3 briefs.)*
