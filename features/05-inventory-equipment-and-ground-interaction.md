# Feature: Inventory, Equipment, and Ground Interaction

## Capability Description

Provides a tactile item management system combining container grids, paperdoll equipment slots, and direct physical world item stacks on dungeon tiles.

## Key Capabilities & Authoritative Seed Rules

- **Container & Equipment Storage:**
  - 6-slot backpack storage grid.
  - 3 paperdoll equipment slots: Right Hand (Weapon), Left Hand (Shield or Light source), and Armor body slot.
- **Tactile Floor Item Stacks:**
  - Items, potions, and equipment dropped or spawned physically render on the ground tile stack (`tile.items`) in the game world rather than residing behind abstract loot windows.
- **Ground & Container Interactions:**
  - Picking up items from the player's current floor tile into backpack or equipment slots.
  - Dropping items from inventory onto adjacent floor tile coordinates.
  - Direct consumption of consumable items (e.g. potions) from either the backpack or directly from the ground tile stack.
- **Core Item Catalog:**
  - Health Potion, Mana Potion, Wooden Torch, Arrows, and Basic Equipment.

*(Note: Stacking limits, drag/click interaction flows, and equip validation rules are owned by Stage 3 briefs.)*
