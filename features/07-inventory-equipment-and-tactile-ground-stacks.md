# Feature: Inventory, Equipment, and Tactile Ground Stacks

## Capability Description

Provides a tactile item management system uniting container storage grids, action slots, paperdoll equipment slots, and physical world item stacks on dungeon tiles.

## Key Capabilities & Authoritative Seed Rules

- **Unified Storage Architecture:**
  - 10-slot Action Bar for quick-draw combat abilities, tools, and weapons.
  - 6-slot backpack storage grid for excess loot and reserve consumables.
  - Paperdoll equipment slots for dedicated body wear (e.g. Armor, Off-hand / Shield / Light source, Relics).
- **Tactile Floor Item Stacks:**
  - All items, potions, arrows, and equipment physically render on the ground tile stack (`tile.items`) in the game world rather than residing behind abstract loot windows.
- **Ground & Container Interactions:**
  - Walkover auto-collection into empty Action Slots or Backpack slots.
  - Direct mouse-click looting and interaction with ground tile stacks.
  - Dropping items from inventory/action slots onto adjacent floor tile coordinates.
  - Direct consumption of potions and consumables from the backpack, action slots, or directly off the ground.
- **Core Item Catalog:**
  - Health Potions, Mana Potions, Wooden Torches, Arrows, Starter/Advanced Weapons (Swords, Bows, Wands, Warhammers), Shields, Armor, and Spells/Relics.

*(Note: Stacking limits, drag-and-drop interaction flows, and equip validation rules are owned by Stage 3 briefs.)*
