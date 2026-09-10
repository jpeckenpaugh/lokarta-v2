# Feature: Dungeon Environment and Grid Exploration

## Capability Description

Provides a 2D tile-based subterranean dungeon crypt environment with grid-locked movement, discrete spatial navigation, and streamlined floor interaction.

## Key Capabilities & Authoritative Seed Rules

- **Subterranean Crypt Layout:** A 40×40 grid floor composed of impassable stone walls and walkable flagstones.
- **Oblique Top-Down Aesthetic:** Rendered on a rigid 32×32 pixel grid with flat floor tiles and upright vertical elements (walls, props, entities).
- **Navigation & Entry/Exit:** Discrete grid coordinates `(x, y)` supporting four-directional (WASD / Arrow keys) grid-locked movement, a designated starting entrance tile, and an illuminated exit stairway tile.
- **Grid-Locked Exploration:** Discrete step-based movement without continuous analog physics, diagonal mesh projections, or isometric diamond rendering.
- **Streamlined Floor Interaction:**
  - Walkover interaction automatically collects floor items into empty Action Slots or Backpack slots.
  - Direct mouse-click interaction on tiles and item stacks in the viewport.
  - Legacy `[E]` (pickup) and `[U]` (use floor) key requirements are completely removed in favor of seamless walkover and pointer interaction.

*(Note: Detailed movement rates, collision checks, and step mechanics are owned by Stage 3 briefs.)*
