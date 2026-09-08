# Feature Brief: Dynamic Lighting and Line of Sight

- **Feature ID:** `02-dynamic-lighting-and-line-of-sight`
- **Related Capability:** `features/02-dynamic-lighting-and-line-of-sight.md`

## 1. Purpose

Simulates subterranean pitch darkness, raycasted line-of-sight (LOS) occlusion, and dynamic light emission sources to reveal terrain, monsters, and floor items within an atmospheric fog-of-war overlay.

## 2. Expected Behavior

1. **Subterranean Pitch Darkness Baseline:**
   - Dungeon chambers are naturally engulfed in total pitch darkness.
   - Any tile outside active illumination and line-of-sight is fully masked by a black fog-of-war layer.
   - Unlit terrain hazards, items, and lurking monsters remain hidden from view until brought within an illuminated radius.
   - In unlit conditions without equipment, the player has a minimal baseline visibility of 1 tile immediately adjacent in all cardinal/diagonal directions.

2. **Dynamic Light Sources & Radii:**
   - **Equipped Wooden Torch:** When equipped in an equipment slot (Left Hand), emits a warm circular illumination with a radius of **5 tiles** centered on the player.
   - **Magician Light Spell Aura:** When cast, expands the player's active illumination aura to a **7-tile radius** for **30 seconds**, overriding or extending torchlight.
   - **Ambient Sconces & Exit Stairway:** Stationary light sources (such as wall sconces and the exit stairway) continuously cast an ambient stationary light radius of **3 tiles** around their fixed coordinates.

3. **Raycasted Line-of-Sight Occlusion:**
   - Visibility is computed from the light source center using discrete raycasting across the grid.
   - Solid stone wall tiles block light rays and occlude line-of-sight.
   - Tiles, monsters, and items situated behind solid walls remain masked in darkness, preventing "see-through-wall" exploits even if they fall within the Euclidean distance of a light source.

4. **Dynamic Mask Updates:**
   - The illumination mask dynamically recalculates whenever the player moves, equips/unequips a light source, casts a lighting spell, or when a spell aura timer expires.

## 3. Inputs / Outputs

- **System Inputs:**
  - Player grid coordinates `(x, y)`.
  - Player equipment state (Torch equipped in Left Hand).
  - Active spell buff states (Magician Light aura remaining duration).
  - Stationary ambient emitter coordinates (exit stairway, wall sconces).
  - Map collision and wall matrix.
- **System Outputs:**
  - Dynamic 2D light-mask / alpha overlay rendered on the visual canvas.
  - Entity visibility status flags (monsters, items, and tiles marked visible or hidden).

## 4. User-Visible Behavior

- The game canvas renders a dark subterranean atmosphere where the player can clearly see illuminated tiles and edges fading into impenetrable darkness.
- Walking through corridors smoothly reveals rooms as line-of-sight opens up around wall corners.
- Equipping a torch immediately expands the visible area; casting the Light spell dramatically brightens a wide room for 30 seconds before gently reverting.
- Lurking monsters emerge from the dark mask into full view as the player's light radius reaches them.

## 5. Constraints

- **Occlusion Rule:** Solid stone walls strictly block light rays; light cannot leak through closed walls.
- **Spell Duration:** Magician's Light spell aura lasts exactly 30 seconds before expiring.
- **Hidden Entities:** Monsters and ground items in pitch darkness must not render sprites on the screen.

## 6. Basic Acceptance Expectations

1. Without a torch or active spell, only the player's immediate 1-tile adjacent radius is visible in unlit areas.
2. Equipping a Wooden Torch increases the visible light radius to 5 tiles around the player.
3. Casting the Magician's Light spell increases the light radius to 7 tiles, and automatically reverts after 30 seconds.
4. Moving near a corner blocks view into adjacent rooms until the player passes the wall edge, confirming raycasted line-of-sight occlusion.
5. Sconces and the exit stairway remain illuminated with a 3-tile radius regardless of player position.
