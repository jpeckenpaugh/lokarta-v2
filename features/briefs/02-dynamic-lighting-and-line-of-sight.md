# Feature Brief: 02 — Dynamic Lighting and Line-of-Sight

## Purpose

Provides a real-time dynamic illumination and line-of-sight visibility masking system that simulates subterranean darkness, fog-of-war concealment, and atmospheric light propagation.

## Expected Behavior

1. **Ambient Pitch Darkness:** Unlit dungeon tiles exist in complete darkness by default. Tiles outside of active light sources are hidden beneath a darkness mask, concealing walls, floors, floor items, and monsters.
2. **Raycasted Field-of-View Calculation:** The visibility engine calculates unobstructed line-of-sight rays from each active light source to surrounding tiles in real time, respecting opaque stone walls that block light propagation.
3. **Dynamic Light Sources:**
   - **Player Baseline / Equipped Torch:** A player holding an active light source (such as an equipped Wooden Torch in an off-hand/equipment slot or active action slot) illuminates a circular area around the player (e.g., radius of 5 to 6 tiles).
   - **Environment Emitters:** Stationary light sources (such as glowing wall sconces, mystical crypt runes, and the illuminated exit stairway) cast localized static light circles.
   - **Spell Illumination:** Activated class spells (e.g., Magician's *Light* aura spell) temporarily expand the player's illuminated radius (e.g., +3 tile radius for a 30-second duration).
4. **Entity & Hazard Concealment:** Monsters and floor items located in unlit or line-of-sight occluded tiles are completely invisible to the player until illuminated.
5. **Real-Time Light Updates:** As the player steps between tiles or light source durations expire, illuminated areas and entity visibilities update instantly.

## Inputs / Outputs

- **Inputs:**
  - Player position changes `(x, y)`.
  - Equipped light items (e.g., Wooden Torch).
  - Illumination spell trigger events (e.g., Magician Light spell cast).
  - Static light emitter coordinates from the dungeon manifest.
- **Outputs:**
  - Dynamic 2D light mask texture/overlay rendered over the dungeon grid.
  - Visible tile set and entity visibility flags.
  - Monster aggro eligibility based on illumination radius.

## User-Visible Behavior

- The viewport displays crisp illuminated circles surrounded by deep, atmospheric darkness.
- Moving forward reveals newly lit corridors while leaving unexplored or distant chambers shrouded in blackness.
- Equipping a torch or casting the Magician's *Light* spell visibly expands the illuminated radius, brightening previously hidden enemies and room features.
- Walls cast realistic shadow occlusions behind them, preventing sight into sealed rooms.

## Constraints

- Opaque stone walls block light rays and line-of-sight completely.
- Darkness overlay must render seamlessly at 60 FPS without frame drops during player locomotion.
- Unlit monsters must not render on screen and must not be targetable via direct clicks through the dark mask.

## Basic Acceptance Expectations

1. At dungeon start, only the area immediately illuminated by active light sources (starting sconce / equipped torch) is visible.
2. Tiles behind opaque stone walls remain dark and occluded even if within distance range.
3. Walking towards an unlit room progressively brings its floor tiles, walls, and monsters into view.
4. Casting the Magician's *Light* spell instantly increases the illuminated FOV radius for 30 seconds, reverting to normal upon expiration.
5. Monsters inside the dark mask are hidden and become visible the moment they enter illuminated tiles.
