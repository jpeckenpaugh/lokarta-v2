# Feature Brief: 08 — Modular Desktop Interface

## Purpose

Provides a structured, classic PC-RPG desktop interface framing a centered dungeon viewport with modular HUD panels for resource pools, action slots, containers, paperdoll, combat logs, and modal card drafts.

## Expected Behavior

1. **Centered Dungeon Viewport Canvas:**
   - A central 2D rendering canvas displaying the active 40×40 dungeon grid, animated character/monster sprites, dynamic lighting mask, spell effects, and ground items.
2. **10-Slot Modular Action Bar:**
   - Centered prominently beneath the viewport, featuring 10 individual slot buttons labeled `1` through `0`.
   - Each slot displays the assigned item/spell icon, hotkey badge, radial cooldown sweep overlay, and energetic charge build-up gauge during hold inputs.
3. **Modular Framing Panels:**
   - **Resource Status Bars:** Prominently displays player Health (red bar), Mana (blue bar), and an XP progression bar alongside the character name, current level, and vocation badge.
   - **Backpack Container Panel:** A compact 2×3 or 1×6 modular grid holding 6 storage slots with item count badges and drag-and-drop handles.
   - **Equipment Paperdoll Panel:** A classic silhouette panel displaying equipped gear (Main Hand, Off-Hand/Torch, Body Armor, Relic).
   - **Combat & Exploration Message Log:** A scrolling textual log window recording combat damage numbers, status effects, XP gains, level-ups, and item pick-up messages with color-coded typography.
4. **Interactive Fate Grant Modal Overlay:**
   - A dedicated modal dialog that dims the background viewport when triggered (at Level 1 and on Level-Up).
   - Renders 5 distinct cards with title headers, rarity border colors (Common, Rare, Epic, Legendary), item/spell icons, effect descriptions, and selectable toggle states.
   - Includes a "Confirm Fate" button that activates when 1 or 2 cards are selected.

## Inputs / Outputs

- **Inputs:**
  - Mouse clicks on UI panels, slots, items, and modal cards.
  - Drag-and-drop pointer events between backpack, action bar, paperdoll, and viewport.
  - Game state updates from the engine (health changes, mana consumption, XP gains, cooldown ticks).
- **Outputs:**
  - Visual updates across all DOM/Canvas interface elements.
  - Tooltip information boxes on hovering over items, spells, and status icons.
  - Dispatch of UI interaction commands to the underlying game engine.

## User-Visible Behavior

- A clean, dark-themed fantasy desktop shell reminiscent of classic PC exploration RPGs (e.g., *Tibia*, *Ultima*).
- Status bars smoothly deplete and regenerate in real-time as damage is taken or potions are consumed.
- The combat log streams real-time narrative feedback (e.g., *"You strike Crypt Skeleton for 18 damage."*, *"Gained 45 XP."*).
- Action slots provide instant visual feedback on keypress, hold charging, and cooldown expiration.

## Constraints

- The interface must fit comfortably within standard desktop browser resolutions (1280×720 minimum, 1920×1080 recommended).
- The central viewport rendering must maintain 60 FPS performance without layout thrashing.
- Modal dialogs (such as Fate Grant) must prevent game world input propagation while open.

## Basic Acceptance Expectations

1. The desktop interface cleanly displays the central canvas, action bar, status pools, backpack, paperdoll, and message log.
2. Dragging an item between the backpack, action bar, and paperdoll updates their respective slots visually.
3. Health, Mana, and XP meters reflect exact player values in real time.
4. Hotkey activations on keys `1`–`0` trigger visual activation states on the corresponding action bar slots.
5. Opening the Fate Grant modal presents 5 interactive cards with working 1–2 selection toggles and a confirm button.
