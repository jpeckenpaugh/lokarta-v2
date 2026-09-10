# Feature Brief: 04 — Modular Action Slots and Multi-Modal Activation

## Purpose

Provides a flexible 10-slot action bar mapped to hotkeys `1` through `0` that supports modular equipment/spell assignment and dynamic multi-modal input triggers (Tap, Hold/Charge, Double-Tap).

## Expected Behavior

1. **10 Dedicated Action Slots:**
   - The HUD features an action bar with 10 slots bound to numeric hotkeys: `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `0`.
   - Players can drag and drop weapons, spells, tools, relics, and consumables into any slot to customize their active loadout.
2. **Multi-Modal Activation Mechanics:**
   - **Tap (Release < 250ms):** Executes the standard, immediate primary action (e.g., standard melee swing, regular wand spark, quick bow shot, or drinking a potion).
   - **Hold / Charge (Held ≥ 250ms):** Engages a visual charge gauge over the slot. Releasing the key or mouse button discharges a powered-up variant of the ability (e.g., an overcharged magic blast, heavy power strike, penetrating volley, or fortified guard stance). Releasing before reaching the minimum charge threshold defaults to a normal tap action.
   - **Double-Tap (Two presses within 300ms):** Triggers a specialized secondary technique or rapid combo (e.g., rapid double-cast, quick sidestep/dash strike, or instant consumable drink).
3. **Cooldown & State Management:**
   - Actions subject to cooldowns display a radial or vertical shaded cooldown overlay on the slot icon.
   - While an ability is on cooldown or charging, conflicting input activations are buffered or ignored to prevent desync.
4. **Pointer & Touch/Click Support:**
   - Each action slot can also be activated directly by clicking/holding with the mouse pointer on the HUD button, executing the exact same Tap, Hold, and Double-Click mechanics.

## Inputs / Outputs

- **Inputs:**
  - Keyboard hotkeys `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `0` with timing metrics (keydown timestamp, keyup timestamp, consecutive press interval).
  - Mouse clicks, holds, and double-clicks on HUD action bar buttons.
  - Drag-and-drop inventory item assignment into action slots.
- **Outputs:**
  - Triggered ability execution events dispatched to the combat engine.
  - Real-time charge level indicators rendered on the action bar.
  - Cooldown timer updates and active slot highlights.

## User-Visible Behavior

- The 10 action slots are clearly numbered 1 through 0 along the bottom of the screen.
- Holding down a hotkey causes the slot icon to glow and fill with an energetic charge meter that peaks upon reaching max charge.
- Tapping a hotkey fires the primary spell/attack instantly with crisp responsiveness.
- Double-tapping triggers a swift secondary effect with distinct audio-visual feedback.
- Used abilities display translucent cooldown sweeps that count down until ready.

## Constraints

- Input classification thresholds:
  - Tap: `< 250ms` key hold.
  - Hold/Charge: `≥ 250ms` key hold up to maximum charge duration (e.g., 1.5s max charge).
  - Double-Tap: Second press occurs `< 300ms` after first release.
- An action cannot be activated while its slot is currently in an active cooldown state.
- Empty action slots do not trigger actions.

## Basic Acceptance Expectations

1. Items, weapons, and spells can be assigned into any of the 10 action slots.
2. Pressing keys `1`–`0` activates the respective action slot.
3. Quick tap (<250ms) fires the basic primary attack/spell.
4. Holding a key (≥250ms) visually builds up the charge meter, and releasing discharges the charged variant.
5. Rapidly pressing a key twice within 300ms executes the double-tap secondary technique.
6. Cooldown animations display accurately on used slots.
