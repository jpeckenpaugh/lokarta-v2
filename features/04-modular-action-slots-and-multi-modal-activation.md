# Feature: Modular Action Slots and Multi-Modal Activation

## Capability Description

Provides a modular 10-slot action and ability system enabling flexible assignment of weapons, spells, tools, and relics with dynamic multi-modal input triggers.

## Key Capabilities & Authoritative Seed Rules

- **10 Modular Action Slots:**
  - Dedicated action bar mapped directly to numeric hotkeys: `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `0`.
  - Items, weapons, wands, bows, warhammers, orbs, relics, consumables, and grimoire spells can be assigned/dragged into any action slot to bind their hotkey activation.
- **Multi-Modal Activation Mechanics:**
  - Each equipped action slot supports three distinct input trigger modalities:
    - **Tap:** Executes the standard, immediate primary attack, cast, or item use.
    - **Hold / Charge:** Charges a powered-up variant of the ability or attack, releasing a high-impact, extended-range, or wide-area effect upon key release.
    - **Double-Tap:** Triggers a quick secondary technique, burst sequence, defensive stance, or rapid double-cast.
- **Visual Feedback & State Indication:**
  - Real-time cooldown indicators, charge progress meters, and active slot states displayed directly on the HUD action bar.

*(Note: Input timing thresholds for tap vs. hold vs. double-tap and per-item charge curves are owned by Stage 3 briefs.)*
