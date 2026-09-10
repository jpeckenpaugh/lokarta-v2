# Feature Brief: 07 — Inventory, Equipment, and Tactile Ground Stacks

## Purpose

Provides a tactile item management system integrating a 10-slot Action Bar, a 6-slot Backpack grid, Paperdoll equipment slots, and physical ground item stacks on dungeon tiles.

## Expected Behavior

1. **Unified Multi-Container Inventory System:**
   - **Action Bar (10 Slots):** Quick-access bar (keys 1–0) for active combat weapons, spells, tools, and consumables.
   - **Backpack (6 Slots):** Secondary container grid for reserve items, excess potions, and backup equipment.
   - **Equipment Paperdoll:** Dedicated equipment slots (e.g., Main Hand / Weapon, Off-Hand / Shield / Light Source, Armor Body, Relic / Accessory).
2. **Tactile Ground Stacks (`tile.items`):**
   - Dropped items and spawned monster loot exist physically on the dungeon floor tile stack.
   - Multiple items on a single tile render stacked or with top-item priority.
3. **Frictionless Collection & Ground Interactions:**
   - **Walkover Auto-Collection:** Walking over a tile with ground items automatically transfers them into the lowest available Action Slot (1–10). If all action slots are occupied, items transfer into the lowest available Backpack slot (1–6). If all slots are full, items remain on the floor.
   - **Direct Pointer Clicks:** Clicking an adjacent or occupied ground tile stack loots or interacts with the item.
   - **Dropping Items:** Players can drag items from Action Slots or the Backpack and drop them onto adjacent walkable floor tiles, returning them to the physical game world.
   - **Direct Consumable Use:** Potions (Health, Mana) and consumables can be consumed directly from the Action Bar, the Backpack, or by right-clicking / interacting with them on the ground.
4. **Core Item Catalog:**
   - *Consumables:* Health Potion (restores HP), Mana Potion (restores Mana).
   - *Tools & Ammunition:* Wooden Torch (held light source), Arrows (quiver ammunition for bows).
   - *Weapons & Implements:* Shortswords, Longswords, Hunting Bows, Magic Wands, Holy Warhammers, Spell Grimoires.
   - *Defensive Gear:* Wooden Bucklers, Iron Shields, Leather Tunic, Iron Plate Armor, Mystical Relics.

## Inputs / Outputs

- **Inputs:**
  - Player movement onto tiles containing ground items.
  - Mouse left-click / drag-and-drop actions across Action Slots, Backpack, Paperdoll, and floor tiles.
  - Hotkey / mouse triggers to consume potions or swap equipment.
- **Outputs:**
  - Inventory slot state updates (Action Slots, Backpack, Paperdoll).
  - Ground tile item array (`tile.items`) mutations.
  - Player stat adjustments from equipped armor/weapons.
  - Item use and loot collection messages logged to the HUD event log.

## User-Visible Behavior

- Ground items render as crisp 32×32 pixel icons on the dungeon floor.
- Walking across ground items smoothly picks them up into the HUD action slots or backpack without opening modal dialogs.
- Dragging an item from the backpack or action bar and dropping it onto the dungeon canvas physically drops the item onto the target floor tile.
- Equipping armor or a shield visibly updates the character paperdoll panel and boosts defensive stats.

## Constraints

- Total backpack capacity is strictly 6 slots.
- Action Bar capacity is strictly 10 slots.
- Dropping an item can only occur on walkable, non-wall tiles within player proximity.
- Items cannot be picked up if all 10 Action Slots and all 6 Backpack slots are full.

## Basic Acceptance Expectations

1. Items on the floor render visibly on their respective tiles.
2. Walking over an item automatically moves it to the lowest empty Action Slot (1–10) or Backpack slot (1–6).
3. Dragging an item from inventory to the ground drops it onto the target tile.
4. Equipping a Wooden Torch into the off-hand slot activates its illumination radius.
5. Drinking a Health or Mana Potion restores the corresponding pool and removes the consumed item.
