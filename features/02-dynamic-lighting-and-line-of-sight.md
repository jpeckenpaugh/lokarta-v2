# Feature: Dynamic Lighting and Line of Sight

## Capability Description

Provides a dynamic visibility and light-masking system that simulates subterranean pitch darkness, line-of-sight occlusion, and localized illumination.

## Key Capabilities & Authoritative Seed Rules

- **Pitch Darkness Baseline:** Subterranean dungeon chambers are naturally pitch black. Unlit tiles, terrain hazards, and lurking monsters remain masked by fog-of-war darkness until illuminated.
- **Illumination Sources:** Tiles are revealed and illuminated dynamically by:
  - Equipped wooden torches or light sources.
  - Ambient environment light sources (such as wall sconces and illuminated exit stairways).
  - Vocation spells (such as the Magician's Light spell aura).
- **Line-of-Sight Occlusion:** Raycasting-based line-of-sight visibility preventing vision through solid stone walls and revealing entities only within an unobstructed light radius.

*(Note: Exact radius metrics, raycasting steps, and decay curves are owned by Stage 3 briefs.)*
