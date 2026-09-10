# Feature: Modular Desktop Interface

## Capability Description

Provides a structured desktop shell interface framing a centered dungeon viewport with classic modular panels for status, containers, paperdoll, action bars, combat logs, and interactive draft modals.

## Key Capabilities & Authoritative Seed Rules

- **Centered Viewport Canvas:**
  - Dedicated central rendering viewport displaying the tile grid, entity sprites, ground items, lighting overlays, and projectile animations.
- **10-Slot Modular Action Bar:**
  - Visual hotkey indicators (`1` through `0`), active item icons, cooldown spinners, and hold/charge visual progression gauges.
- **Modular HUD Panels:**
  - **Equipment Paperdoll Panel:** Displays equipped body gear (Armor, Off-hand/Shield/Torch, Relics).
  - **Backpack Container Panel:** Visual 6-slot inventory container grid.
  - **Resource Status Pools:** Real-time visual meters/indicators for player Health and Mana pools, as well as level/XP progress.
  - **Combat & Event Message Log:** Scrolling chronological log displaying combat rolls, damage events, status changes, and item interactions.
- **Interactive Fate Grant Modal:**
  - Clean card-draft overlay interface triggered at Level 1 and upon Level-Up, presenting 5 cards with rarity borders, descriptions, and 1-2 selection pick buttons.

*(Note: Responsive layout breakpoints, color palettes, and UI event bindings are owned by Stage 3 briefs.)*
