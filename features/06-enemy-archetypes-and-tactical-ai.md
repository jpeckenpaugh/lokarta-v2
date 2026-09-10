# Feature: Enemy Archetypes and Tactical AI

## Capability Description

Provides distinct monster archetypes with autonomous grid pathfinding, line-of-sight aggro triggers, tactical engagement distances, and tactile death loot drops.

## Key Capabilities & Authoritative Seed Rules

- **Crypt Skeleton (Melee Archetype):**
  - Aggro is triggered when the entity enters the player's illuminated field-of-view radius.
  - Pursues the player across the dungeon grid using A* pathfinding.
  - Executes close-range melee strikes on a regular attack interval (e.g. every 1.5 seconds) when directly adjacent.
- **Shadow Cultist (Ranged / Caster Archetype):**
  - Maintains a tactical standoff distance (e.g. 3 to 4 tiles away from the player).
  - Channels and launches straight-line shadow bolt projectiles aimed directly at the player.
- **Tactile Death Loot Drops:**
  - Defeated monsters spawn their dropped loot (potions, equipment, currency, arrows) directly onto their death floor tile stack (`tile.items`) in the game world.

*(Note: Pathfinding heuristic tuning, monster stats, drop tables, and projectile speeds are owned by Stage 3 briefs.)*
