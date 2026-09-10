# Feature Brief: 05 — Fate Grant and Level Progression

## Purpose

Provides a roguelike card-draft progression system replacing static starting inventories with dynamic, randomized card drafts upon character creation (Level 1) and at every subsequent level-up milestone.

## Expected Behavior

1. **Zero-Inventory Baseline:**
   - Newly created characters start the dungeon run with completely empty Action Slots (1–10), an empty 6-slot Backpack, and empty equipment slots.
2. **Initial Level 1 Fate Grant Sequence:**
   - Immediately upon selecting a vocation and spawning onto the entrance tile at Level 1, the game pauses exploration and presents the interactive Fate Grant modal overlay.
   - The system generates a curated random draw of 5 cards/items, with weighted probabilities ensuring at least 2 vocation-aligned core tools/weapons/spells (e.g., Starter Wand & Wand Spark for Magician, Hunting Bow & Arrows for Archer, Shortsword for Fighter, Warhammer & Holy Prayer for Paladin).
   - The player selects 1 or 2 cards from the 5 offered options and clicks "Confirm Selection".
   - The drafted items are automatically placed into the player's lowest available Action Slots (1–10).
3. **Experience Points (XP) & Leveling Milestones:**
   - Defeating dungeon enemies and clearing exploration objectives awards XP points.
   - Accumulating required threshold XP advances the character to the next level (Level 2, Level 3, etc.), increasing base stats (Max HP and Max Mana).
4. **Level-Up Fate Grant Drafts:**
   - Upon reaching each level-up milestone, the game automatically pauses and opens a new Fate Grant modal.
   - The player receives a fresh 5-card draw featuring upgraded tiers (e.g., Common, Rare, Epic, Legendary), including advanced spells, enchanted weapons, defensive relics, and potent consumables.
   - The player selects 1 or 2 cards from the draw to expand their build.
   - Selected items populate the next empty Action Slots (1–10), then overflow into the 6-slot Backpack. If all inventory spaces are full, excess items drop safely onto the player's current floor tile.

## Inputs / Outputs

- **Inputs:**
  - Card selection clicks (choosing 1 or 2 cards in the modal).
  - "Confirm Fate" button click to finalize selection.
  - Monster defeat events generating XP gains.
- **Outputs:**
  - Active Fate Grant modal interface.
  - Character level and XP meter increments.
  - Selected spells, weapons, and items transferred to action slots/backpack.
  - Resumed dungeon gameplay upon draft completion.

## User-Visible Behavior

- A mystical card draft overlay appears over the center of the screen displaying 5 cards with distinctive art icons, rarity color borders, and concise stat/ability descriptions.
- Clicking a card highlights it with a glowing border and selection badge (1 of 2 selected).
- The "Confirm Fate" button activates once at least 1 card is selected and allows up to 2 selections.
- Completing the draft smoothly transitions back to exploration, populating the HUD action bar with the new abilities.
- Levelling up triggers a radiant level-up animation banner, sound effect, and immediate Fate Grant prompt.

## Constraints

- Players must select at least 1 card and at most 2 cards per Fate Grant draft.
- Exploration, monster movement, and combat timers are paused while the Fate Grant modal is open.
- The 5 offered cards in a single draft must be distinct (no duplicate identical cards in the same draw).

## Basic Acceptance Expectations

1. Spawning at Level 1 immediately triggers the Fate Grant overlay with 5 cards.
2. The Level 1 draw contains relevant starter equipment/spells for the chosen vocation.
3. Player can select 1 or 2 cards and confirm the draft.
4. Confirmed cards appear directly in Action Slots 1 and 2.
5. Defeating enemies awards XP, and filling the XP bar triggers a level-up event.
6. Levelling up opens a new 5-card Fate Grant draft with upgraded choices.
