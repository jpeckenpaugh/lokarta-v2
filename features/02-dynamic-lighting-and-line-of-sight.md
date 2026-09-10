# Feature: Dynamic Lighting and Line-of-Sight

## Capability Description

Provides a dynamic illumination and field-of-view visibility masking system simulating atmospheric light-versus-darkness in pitch-black dungeon environments.

## Key Capabilities & Authoritative Seed Rules

- **Pitch-Black Dungeon Chambers:** Subterranean dungeon areas naturally exist in complete darkness, masking unseen terrain, lurking monsters, and floor hazards.
- **Raycasted Field-of-View:** Real-time line-of-sight and illumination radius calculation projecting from light-emitting sources and the player entity.
- **Dynamic Light Sources:**
  - Equipped light sources (e.g. Wooden Torch held in equipment / off-hand slot or action slot) casting active visibility radii.
  - Ambient environment light emitters (e.g. wall sconces, glowing crypt runes, exit stairway beacons).
  - Active class spell illumination (e.g. Magician's temporary illumination aura spell extending FOV radius).
- **Darkness Overlay & Fog-of-War Masking:** Canvas/PixiJS darkness layer rendering unlit tiles in deep shadow and revealing tiles within active light circles.

*(Note: Exact raycasting step resolution, light falloff gradients, and aura durations are owned by Stage 3 briefs.)*
