# Feature Brief: 03 — Playable Vocations and Combat Archetypes

## Purpose

Defines the four distinct playable character vocations with specialized combat archetypes, attribute profiles, resource management (Health and Mana), and tactical ability kits.

## Expected Behavior

1. **Vocation Selection at Character Creation:** The player selects one of four distinct vocations during game initialization:
   - **Magician:**
     - *Profile:* Fragile health pool (e.g., 60 HP baseline), high mana pool (e.g., 150 Mana baseline).
     - *Kit & Archetype:* Ranged wand attacks (e.g., Wand Spark), tactical utility (e.g., *Light* spell expanding illuminated FOV radius for 30 seconds), and devastating linear piercing magic (e.g., *Energy Beam* striking all enemies in a 4-tile linear path).
   - **Archer:**
     - *Profile:* Balanced health pool (e.g., 90 HP baseline) and mana/focus pool (e.g., 80 Mana baseline).
     - *Kit & Archetype:* Long-range physical marksmanship with standard bow attacks requiring line-of-sight and ammunition (Arrows), and high-impact single-target burst abilities (e.g., *Power Shot* on a tactical cooldown).
   - **Fighter:**
     - *Profile:* High health pool (e.g., 140 HP baseline), heavy armor scaling, low mana reliance (e.g., 30 Mana baseline).
     - *Kit & Archetype:* Close-quarters melee combat mastery, sweeping sword strikes, multi-target frontal cleaves, and defensive physical mitigations.
   - **Paladin:**
     - *Profile:* Durable hybrid warrior (e.g., 120 HP baseline, 90 Mana baseline).
     - *Kit & Archetype:* Hybrid holy combatant utilizing crushing melee warhammer attacks, self/area healing prayers, and defensive holy protection auras/barriers.
2. **Combat Execution & Targeting:**
   - Melee attacks resolve against adjacent occupied monster tiles in cardinal or diagonal contact.
   - Ranged attacks and spells trace straight-line projectile paths to the target, verifying unobstructed line-of-sight.
3. **Resource Consumption:**
   - Casting spells consumes Mana from the player's mana pool.
   - Firing bow abilities consumes ammunition (Arrows) or stamina/mana.
   - Taking enemy damage reduces the player's Health pool; reaching 0 HP results in character defeat.

## Inputs / Outputs

- **Inputs:**
  - Vocation selection event during character initialization.
  - Ability/attack activation events from Action Slots (Hotkeys 1–0 / Mouse clicks).
  - Target grid tile coordinates or direction of attack.
- **Outputs:**
  - Initial character stat profile (Max HP, Max Mana, base attack, defense).
  - Combat damage rolls and projectile trajectories rendered on the grid.
  - Health/Mana deduction and status log entries.
  - Monster damage and defeat events.

## User-Visible Behavior

- Character sprite visually reflects chosen vocation identity.
- HUD resource meters (red Health bar, blue Mana bar) initialize to the chosen vocation's maximum pool capacities.
- Attacking triggers distinctive visual effects (spark projectiles for Magician, flying arrows for Archer, slashing arcs for Fighter, glowing golden hammer impacts for Paladin).
- Floating damage numbers and combat log entries record hits, misses, damage amounts, and resource expenditures.

## Constraints

- Characters cannot cast spells without sufficient Mana.
- Ranged attacks cannot penetrate opaque stone walls.
- Magician's *Energy Beam* penetrates enemies in a 4-tile line but stops if it collides with a solid wall.
- Vocation choice is locked for the duration of the run.

## Basic Acceptance Expectations

1. Player can select any of the 4 vocations (Magician, Archer, Fighter, Paladin) at character creation.
2. Character spawns with the corresponding baseline HP, Mana, and stat profile.
3. Magician casting *Energy Beam* damages multiple aligned enemies across 4 tiles in the target direction.
4. Archer firing a bow consumes arrows and damages distant enemies within line-of-sight.
5. Fighter executes melee cleaves against adjacent enemies.
6. Paladin can cast healing prayers to restore lost Health points and strike with holy melee attacks.
