# Feature Brief: Modular Desktop Interface

- **Feature ID:** `06-modular-desktop-interface`
- **Related Capability:** `features/06-modular-desktop-interface.md`

## 1. Purpose

Provides a structured, classic PC RPG desktop shell interface framing a centered 2D dungeon viewport alongside modular panels for equipment paperdoll, backpack inventory, health/mana status meters, ability hotbars, and a scrolling combat log.

## 2. Expected Behavior

1. **Centered Dungeon Viewport:**
   - A dedicated central rendering canvas displaying the visible 32×32 pixel dungeon tiles, player sprite, monsters, ground items, and the dynamic lighting fog-of-war overlay.
   - The camera centers smoothly or directly locks onto the player character as they explore.

2. **Equipment Paperdoll Panel:**
   - A dedicated visual equipment frame showing 3 slots: Right Hand (Weapon), Left Hand (Shield/Torch), and Armor (Body).
   - Shows equipped item icons, tooltips on hover with item stats/details, and allows click/drag unequip actions.

3. **Backpack Container Panel:**
   - A distinct 6-slot inventory grid widget displaying stored items, stack counts (for arrows), and empty slot placeholders.
   - Supports drag-and-drop item reorganization, equipping to paperdoll, dropping to floor, and double-click usage.

4. **Resource Status Meters:**
   - Real-time visual progress bars and numerical readouts for:
     - **Health (HP):** Current HP / Maximum HP (red bar).
     - **Mana (MP):** Current Mana / Maximum Mana (blue bar).
   - Dynamically updates as damage is received, spells are cast, or potions are consumed.

5. **Scrolling Combat & Event Message Log:**
   - A persistent, scrolling chronological text log at the bottom or side panel.
   - Formats distinct message types (combat damage dealt/taken, loot pickups, spell casting, warnings/errors).
   - Automatically auto-scrolls to the newest message.

6. **Ability / Action Hotbar:**
   - Quick-action buttons corresponding to class abilities (e.g. Wand Spark, Light, Energy Beam, Bow Shot, Power Shot) with hotkey indicators (`1`, `2`) and visual cooldown sweeps.

## 3. Inputs / Outputs

- **User Inputs:**
  - Mouse clicks on HUD buttons, hotbar icons, and inventory slots.
  - Hovering over items and abilities for tooltips.
  - Hotkey keypresses for quick casting.
- **System Outputs:**
  - Synchronized visual updates across all HUD panels and meters.
  - Formatted text appended to the scrolling combat log.
  - Cooldown overlay timers on ability icons.

## 4. User-Visible Behavior

- Classic desktop RPG framing with crisp panel borders, dark aesthetic styling, and nostalgic layout.
- Health and Mana bars deplete and fill smoothly in response to gameplay actions.
- The scrolling log provides immediate textual confirmation for every player action and monster hit.
- Clear tooltips provide context on item names and ability costs.

## 5. Constraints

- **Fixed Desktop Framing:** Modular layout designed for standard desktop browser viewports without viewport overlap.
- **Panel Parity:** Exactly mirrors the 6-slot backpack and 3 paperdoll slots specified in the core inventory design.
- **Real-Time Responsiveness:** HUD elements update without delay during the 10 Hz game tick cycle.

## 6. Basic Acceptance Expectations

1. The central viewport renders the active dungeon canvas surrounded by modular HUD panels.
2. The Health and Mana meters accurately display the player's current numerical and percentage resource values.
3. The 6-slot backpack and 3-slot paperdoll accurately reflect all inventory and equipped items.
4. Player actions, attacks, damage taken, and item pickups output timestamped/formatted entries in the scrolling message log.
5. Ability hotbar buttons display icons, hotkeys, and show visual cooldown sweeps when triggered.
