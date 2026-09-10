# Summary: Architect (Stage 05)

- **Date:** 2026-09-10
- **Author / Executor:** Architect Agent
- **Instruction file:** `instructions/build/05-architecture.md`
- **Commit:** `stage 05: update architecture specification for 10 action slots, 4 vocations, and fate grants`

## Work Completed

Translated all updated product requirements, feature briefs (`features/briefs/01-*.md` through `09-*.md`), and system environment definitions into an authoritative, complete technical architecture specification in `docs/architecture.md`. 

Ratified the decoupled client-authoritative SPA engine alongside the asynchronous FastAPI + SQLite persistence backend. Fully specified data models, SQLite table DDLs with indexing, Pydantic v2 schemas, REST API contracts, the 10-slot Action Bar with multi-modal gesture classification (Tap, Hold/Charge, Double-Tap), zero-inventory start, 5-card Fate Grant roguelike drafting, 4 playable vocations, frictionless floor interactions with walkover auto-loot, and the complete session persistence lifecycle.

## Outputs Produced

- `docs/architecture.md` — Authoritative technical specification for Lokarta: Come Into The Light.
- `summaries/05-architecture.md` — Stage 5 summary record.

## Key Decisions

1. **4 Playable Vocations:** Magician (60 HP, 150 MP), Archer (90 HP, 80 MP), Fighter (140 HP, 30 MP), and Paladin (120 HP, 90 MP), each with distinct stat baselines, level scaling, and ability kits.
2. **10 Modular Action Slots (Keys 1–0):** Replaced legacy 3-slot hotbar with 10 dedicated hotkey slots (`1`–`0`), complemented by a 6-slot Backpack and 4 Paperdoll equipment slots (`main_hand`, `off_hand`, `armor`, `relic`).
3. **Multi-Modal Activation Engine:** Formalized input classification thresholds for hotkeys and mouse buttons:
   - *Tap:* Release `< 250ms` (primary action / standard attack / quick spell).
   - *Hold / Charge:* Held `≥ 250ms` up to `1500ms` (charge gauge visual build-up, discharges overcharged / powered-up variant upon release).
   - *Double-Tap:* Second press `< 300ms` after first release (secondary combo / rapid burst / double-drink).
4. **Zero-Inventory Baseline & Fate Grant Roguelike Drafts:** Characters start with empty equipment and container slots. Level 1 triggers a 5-card draft with weighted starter items (choose 1–2). Every subsequent level up triggers a 5-card draft across rarity tiers (Common, Rare, Epic, Legendary). Drafted cards route to lowest empty Action Slot (1–10), then Backpack (1–6), then drop to `tile.items` if full.
5. **Frictionless Floor Interaction:** Walkover auto-loot automatically routes items on `tile.items` into Action Slots (1–10) then Backpack (1–6); direct pointer left-clicks interact with ground items; legacy `[E]` and `[U]` keys removed.
6. **SQLite Schema & REST API Contracts:** Defined schemas for `characters` (4 vocations, level, XP, stats), `inventory_items` (`action_bar`, `backpack`, `paperdoll`), `dungeon_floors` (40×40 crypt matrix, sconces, spawns, initial loot), and `world_progress`. Documented contracts for `GET /api/dungeons/{id}`, `GET /api/characters/{id}`, `POST /api/character/save`, and `POST /api/dungeon/sync`.

## Open Questions & Concerns

None. The technical specification is comprehensive, fully resolved, and provides unambiguous contracts for Stage 6 (Backend Engineer) and Stage 7 (Frontend Engineer).

## Status

- [x] Complete
- [ ] Needs review
