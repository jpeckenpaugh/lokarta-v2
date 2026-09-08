# Feature Brief: Inventory, Equipment, and Ground Interaction

- **Feature ID:** `05-inventory-equipment-and-ground-interaction`
- **Related Capability:** `features/05-inventory-equipment-and-ground-interaction.md`

## 1. Purpose

Provides tactile inventory management, paperdoll equipment slots, ground item stack representation on floor tiles, and seamless pick-up, drop, and direct item consumption interactions.

## 2. Expected Behavior

1. **Storage Structure:**
   - **Backpack Container:** A 6-slot grid holding loose items, consumables, and ammunition stacks.
   - **Paperdoll Equipment Slots:** 3 dedicated wearable gear slots:
     - *Right Hand:* Weapon slot (e.g., Wand, Bow, Sword).
     - *Left Hand:* Offhand slot (e.g., Shield or Wooden Torch light source).
     - *Armor:* Body slot (e.g., Leather Armor, Robes) providing damage mitigation or stat bonuses.

2. **Tactile Floor Item Stacks:**
   - Every dungeon tile maintains an item list (`tile.items = [...]`).
   - Items dropped or spawned on the ground physically render on that tile, with the topmost item icon displayed.
   - Ground items are tangible world objects rather than abstract loot menus.

3. **Ground & Inventory Interactions:**
   - **Pick Up:** Clicking or triggering "Pick Up" transfers an item from the player's current ground tile stack into the first available backpack slot (or auto-stacks with existing arrows). If the backpack is full (6/6 slots), pickup is blocked with an inventory-full warning.
   - **Drop:** Dragging or dropping an item from the backpack or equipment paperdoll places it directly onto the player's current tile or a selected adjacent floor tile (`tile.items`).
   - **Equip / Unequip:** Clicking or dragging gear between backpack slots and compatible paperdoll slots equips or unequips the item, immediately updating player stats and visual appearance.
   - **Direct Consumption:**
     - Consumable items (Health Potion, Mana Potion) can be consumed directly from the backpack via click/double-click.
     - Consumables can also be consumed directly from the ground stack on the player's tile without needing to pick them up first.
     - Consuming an item restores the designated resource (e.g. +30 HP or +40 Mana) and removes the consumed item instance.

4. **Core Item Catalog:**
   - **Health Potion:** Instantly restores 30 Health points (up to maximum HP).
   - **Mana Potion:** Instantly restores 40 Mana points (up to maximum Mana).
   - **Wooden Torch:** When placed in Left Hand slot, emits a 5-tile radius light circle.
   - **Arrows:** Stackable physical ammunition required for Archer bow attacks.
   - **Basic Equipment:** Starter wands, bows, shields, and armors.

## 3. Inputs / Outputs

- **User Inputs:**
  - Mouse clicks / drags for moving items between Backpack, Paperdoll, and Floor tiles.
  - Interaction key / button for picking up ground items on the current tile.
  - Right-click / use action for consuming potions.
- **System Outputs:**
  - Updated inventory / equipment states.
  - Updated floor tile item stack arrays (`tile.items`).
  - Restored player HP/Mana pools upon potion consumption.
  - Equipment stat/lighting modifiers applied to the player entity.
  - Action notices in the message log (e.g., *"Picked up Wooden Torch."*, *"Drank Health Potion, restored 30 HP."*).

## 4. User-Visible Behavior

- Ground items render distinct 32×32 pixel icons directly on top of floor flagstones.
- The 6-slot backpack UI shows item icons, stack counts (for arrows), and empty slot outlines.
- The paperdoll panel clearly indicates equipped weapon, offhand (shield/torch), and armor.
- Dragging a torch to the Left Hand slot immediately turns the torch on and lights up the surrounding dark tiles.

## 5. Constraints

- **Backpack Capacity:** Strictly capped at 6 slots.
- **Paperdoll Structure:** Strictly 3 slots (Right Hand, Left Hand, Armor).
- **Physical Ground Stacks:** Items must exist on tile stacks (`tile.items`), not in modal menus.
- **Valid Equip Rules:** Weapons cannot be equipped into the Armor slot; shields/torches only fit Left Hand.

## 6. Basic Acceptance Expectations

1. Items on the floor appear as visible icons on their corresponding floor tiles.
2. Walking over a floor item and clicking "Pick Up" places it into the 6-slot backpack when space permits.
3. Picking up with a full 6-slot backpack displays an inventory full message and leaves the item on the floor.
4. Equipping a Wooden Torch into the Left Hand slot activates its 5-tile illumination.
5. Consuming a potion (from backpack or directly from the ground) increases the respective resource pool by the defined amount and removes the potion.
