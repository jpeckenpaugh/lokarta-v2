# Feature Brief: Playable Vocations and Combat Abilities

- **Feature ID:** `03-playable-vocations-and-combat-abilities`
- **Related Capability:** `features/03-playable-vocations-and-combat-abilities.md`

## 1. Purpose

Provides distinct playable character classes (Magician and Archer) featuring specialized stat allocations, basic attacks, resource costs (mana and physical ammunition), and active combat spells/abilities.

## 2. Expected Behavior

1. **Vocation Archetypes & Baseline Profiles:**
   - **Magician:**
     - *Profile:* Fragile health pool (baseline 60 HP), expansive mana pool (baseline 120 Mana).
     - *Basic Attack (Wand Spark):* Casts a fast ranged magical spark at a targeted enemy within line-of-sight (range: up to 5 tiles), dealing moderate magic damage. Consumes no ammunition or minimal mana.
     - *Spell 1 (Light):* Casts an illumination aura that increases the player's field-of-view radius to 7 tiles for 30 seconds. Consumes 15 Mana; 5-second cooldown.
     - *Spell 2 (Energy Beam):* Casts a high-damage piercing beam extending in a straight 4-tile line in the chosen cardinal/facing direction. Hits and damages all enemies aligned in the 4-tile path. Consumes 30 Mana; 3-second cooldown.
   - **Archer:**
     - *Profile:* Balanced health pool (baseline 90 HP), moderate mana pool (baseline 60 Mana).
     - *Basic Attack (Bow Shot):* Fires an arrow at a targeted enemy within line-of-sight (range: up to 6 tiles). Requires and consumes **1 physical Arrow** from the inventory per shot.
     - *Ability (Power Shot):* Unleashes a heavy single-target physical burst shot dealing heavy piercing damage. Operates on an independent 4-second cooldown; consumes 1 Arrow.

2. **Line of Sight & Targeting Checks:**
   - Ranged attacks and targeted abilities require an unobstructed line-of-sight between the player and target; solid stone walls intercept and block projectiles.
   - If line of sight is obstructed or the target is out of range, the attack is cancelled and feedback is logged.

3. **Resource Validation & Cooldowns:**
   - Attempting to cast spells with insufficient mana fails and logs a notice.
   - Attempting to fire a bow without arrows in inventory fails and alerts the player to restock ammunition.
   - Abilities on active cooldown cannot be re-triggered until their cooldown timers expire.

## 3. Inputs / Outputs

- **User Inputs:**
  - Mouse click or hotkey selection for targeting enemies.
  - Ability hotkeys (`1`, `2`, or clicking action buttons on the HUD) to trigger class spells/abilities.
  - Directional aim for linear directional abilities (*Energy Beam*).
- **System Outputs:**
  - Damage calculation and deduction from target monster HP.
  - Visual projectile / beam animations on the canvas.
  - Updated player Mana pool and Arrow inventory count.
  - Real-time entries in the combat message log (e.g., *"You hit Crypt Skeleton for 18 damage."*, *"Energy Beam pierces 2 enemies for 35 damage."*).

## 4. User-Visible Behavior

- Character selection screen displays vocation portraits, stat summaries, and starting skill sets.
- In-game ability bar shows available abilities, mana costs, and animated cooldown overlays.
- Casting *Light* instantly expands the vision circle with a radiant visual flash.
- Casting *Energy Beam* projects a vibrant 4-tile piercing energy stripe across the dungeon floor.
- Attacking without mana or arrows shows instant floating feedback text and combat log warnings.

## 5. Constraints

- **Light Duration:** Magician's *Light* spell lasts exactly 30 seconds.
- **Energy Beam Geometry:** Fixed 4-tile linear reach; pierces through all entities along those 4 tiles.
- **Archer Ammunition:** Archer bow attacks strictly consume physical *Arrow* items; cannot attack without ammunition.
- **Line-of-Sight:** No ranged attack can pass through solid walls.

## 6. Basic Acceptance Expectations

1. Playing as Magician allows casting *Wand Spark* at visible enemies, casting *Light* to expand the light mask for 30s, and casting *Energy Beam* to damage multiple enemies in a 4-tile line.
2. Playing as Archer allows firing *Bow Shot* when arrows are present, decrementing arrow count by 1 per shot.
3. Attempting Archer attacks with 0 arrows halts the attack with appropriate warning feedback.
4. *Power Shot* triggers its high burst damage and activates its separate cooldown timer before allowing reuse.
5. All damage dealt and resources consumed are accurately reflected in the player HUD meters and combat log.
