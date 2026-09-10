from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import aiosqlite
from fastapi import HTTPException
from backend.database import get_db_connection
from backend.models.character import (
    CharacterResponse,
    CharacterSaveRequest,
    CharacterSaveResponse,
    Position,
)
from backend.models.inventory import (
    ItemDTO,
    PaperdollDTO,
    ActionSlotDTO,
    BackpackSlotDTO,
)

DEFAULT_ARCHETYPES: Dict[str, Dict[str, Any]] = {
    "magician": {
        "id": "magician",
        "vocation": "magician",
        "hp": 60,
        "max_hp": 60,
        "mana": 150,
        "max_mana": 150,
        "level": 1,
        "xp": 0,
        "xp_to_next_level": 100,
        "current_floor": 1,
        "position": {"x": 2, "y": 2},
        "action_bar": [],
        "backpack": [],
        "paperdoll": {
            "main_hand": None,
            "off_hand": None,
            "armor": None,
            "relic": None,
        },
    },
    "archer": {
        "id": "archer",
        "vocation": "archer",
        "hp": 90,
        "max_hp": 90,
        "mana": 80,
        "max_mana": 80,
        "level": 1,
        "xp": 0,
        "xp_to_next_level": 100,
        "current_floor": 1,
        "position": {"x": 2, "y": 2},
        "action_bar": [],
        "backpack": [],
        "paperdoll": {
            "main_hand": None,
            "off_hand": None,
            "armor": None,
            "relic": None,
        },
    },
    "fighter": {
        "id": "fighter",
        "vocation": "fighter",
        "hp": 140,
        "max_hp": 140,
        "mana": 30,
        "max_mana": 30,
        "level": 1,
        "xp": 0,
        "xp_to_next_level": 100,
        "current_floor": 1,
        "position": {"x": 2, "y": 2},
        "action_bar": [],
        "backpack": [],
        "paperdoll": {
            "main_hand": None,
            "off_hand": None,
            "armor": None,
            "relic": None,
        },
    },
    "paladin": {
        "id": "paladin",
        "vocation": "paladin",
        "hp": 120,
        "max_hp": 120,
        "mana": 90,
        "max_mana": 90,
        "level": 1,
        "xp": 0,
        "xp_to_next_level": 100,
        "current_floor": 1,
        "position": {"x": 2, "y": 2},
        "action_bar": [],
        "backpack": [],
        "paperdoll": {
            "main_hand": None,
            "off_hand": None,
            "armor": None,
            "relic": None,
        },
    },
}


class CharacterService:
    @staticmethod
    async def get_or_create_character(char_id: str) -> CharacterResponse:
        conn = await get_db_connection()
        try:
            cursor = await conn.execute("SELECT * FROM characters WHERE id = ?", (char_id,))
            char_row = await cursor.fetchone()

            if not char_row:
                normalized_id = char_id.lower()
                if normalized_id in DEFAULT_ARCHETYPES:
                    # Seed archetype with zero inventory baseline
                    archetype = DEFAULT_ARCHETYPES[normalized_id]
                    save_req = CharacterSaveRequest(**archetype)
                    await CharacterService.save_character(save_req)
                    # Re-fetch saved
                    cursor = await conn.execute("SELECT * FROM characters WHERE id = ?", (char_id,))
                    char_row = await cursor.fetchone()
                else:
                    raise HTTPException(status_code=404, detail=f"Character with id '{char_id}' not found.")

            # Load inventory items
            cursor = await conn.execute(
                "SELECT * FROM inventory_items WHERE character_id = ? ORDER BY id ASC",
                (char_id,),
            )
            items = await cursor.fetchall()

            paperdoll_data: Dict[str, Optional[ItemDTO]] = {
                "main_hand": None,
                "off_hand": None,
                "armor": None,
                "relic": None,
            }
            action_bar_items: List[ActionSlotDTO] = []
            backpack_items: List[BackpackSlotDTO] = []

            for item in items:
                loc = item["location_type"]
                slot = item["slot_name"]
                if loc == "paperdoll" and slot in paperdoll_data:
                    paperdoll_data[slot] = ItemDTO(
                        item_id=item["item_id"],
                        name=item["item_name"],
                        type=item["item_type"],
                        quantity=item["quantity"],
                        stat_bonus=item["stat_bonus"],
                    )
                elif loc == "action_bar":
                    try:
                        slot_idx = int(slot.replace("slot_", ""))
                    except ValueError:
                        slot_idx = 0
                    action_bar_items.append(
                        ActionSlotDTO(
                            slot_index=slot_idx,
                            item_id=item["item_id"],
                            name=item["item_name"],
                            type=item["item_type"],
                            quantity=item["quantity"],
                            stat_bonus=item["stat_bonus"],
                        )
                    )
                elif loc == "backpack":
                    try:
                        slot_idx = int(slot.replace("slot_", ""))
                    except ValueError:
                        slot_idx = 0
                    backpack_items.append(
                        BackpackSlotDTO(
                            slot_index=slot_idx,
                            item_id=item["item_id"],
                            name=item["item_name"],
                            type=item["item_type"],
                            quantity=item["quantity"],
                            stat_bonus=item["stat_bonus"],
                        )
                    )

            action_bar_items.sort(key=lambda x: x.slot_index)
            backpack_items.sort(key=lambda x: x.slot_index)

            level_val = char_row["level"] if "level" in char_row.keys() and char_row["level"] is not None else 1
            xp_val = char_row["xp"] if "xp" in char_row.keys() and char_row["xp"] is not None else 0
            xp_next_val = char_row["xp_to_next_level"] if "xp_to_next_level" in char_row.keys() and char_row["xp_to_next_level"] is not None else 100

            return CharacterResponse(
                id=char_row["id"],
                vocation=char_row["vocation"],
                hp=char_row["hp"],
                max_hp=char_row["max_hp"],
                mana=char_row["mana"],
                max_mana=char_row["max_mana"],
                level=level_val,
                xp=xp_val,
                xp_to_next_level=xp_next_val,
                current_floor=char_row["current_floor"],
                position=Position(x=char_row["x_pos"], y=char_row["y_pos"]),
                action_bar=action_bar_items,
                backpack=backpack_items,
                paperdoll=PaperdollDTO(**paperdoll_data),
            )
        finally:
            await conn.close()

    @staticmethod
    async def save_character(save_data: CharacterSaveRequest) -> CharacterSaveResponse:
        conn = await get_db_connection()
        try:
            now_iso = datetime.now(timezone.utc).isoformat()

            # Upsert character base record
            await conn.execute(
                """
                INSERT INTO characters (id, vocation, hp, max_hp, mana, max_mana, level, xp, xp_to_next_level, current_floor, x_pos, y_pos, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    vocation = excluded.vocation,
                    hp = excluded.hp,
                    max_hp = excluded.max_hp,
                    mana = excluded.mana,
                    max_mana = excluded.max_mana,
                    level = excluded.level,
                    xp = excluded.xp,
                    xp_to_next_level = excluded.xp_to_next_level,
                    current_floor = excluded.current_floor,
                    x_pos = excluded.x_pos,
                    y_pos = excluded.y_pos,
                    updated_at = excluded.updated_at
                """,
                (
                    save_data.id,
                    save_data.vocation,
                    save_data.hp,
                    save_data.max_hp,
                    save_data.mana,
                    save_data.max_mana,
                    save_data.level,
                    save_data.xp,
                    save_data.xp_to_next_level,
                    save_data.current_floor,
                    save_data.position.x,
                    save_data.position.y,
                    now_iso,
                ),
            )

            # Replace inventory items
            await conn.execute("DELETE FROM inventory_items WHERE character_id = ?", (save_data.id,))

            # Insert paperdoll slots
            paperdoll = save_data.paperdoll
            paperdoll_slots = [
                ("main_hand", paperdoll.main_hand),
                ("off_hand", paperdoll.off_hand),
                ("armor", paperdoll.armor),
                ("relic", paperdoll.relic),
            ]

            for slot_name, item in paperdoll_slots:
                if item is not None:
                    await conn.execute(
                        """
                        INSERT INTO inventory_items (character_id, location_type, slot_name, item_id, item_name, item_type, quantity, stat_bonus)
                        VALUES (?, 'paperdoll', ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            save_data.id,
                            slot_name,
                            item.item_id,
                            item.name,
                            item.type,
                            item.quantity,
                            item.stat_bonus,
                        ),
                    )

            # Insert action bar slots
            for ab_item in save_data.action_bar:
                slot_name = f"slot_{ab_item.slot_index}"
                await conn.execute(
                    """
                    INSERT INTO inventory_items (character_id, location_type, slot_name, item_id, item_name, item_type, quantity, stat_bonus)
                    VALUES (?, 'action_bar', ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        save_data.id,
                        slot_name,
                        ab_item.item_id,
                        ab_item.name,
                        ab_item.type,
                        ab_item.quantity,
                        ab_item.stat_bonus,
                    ),
                )

            # Insert backpack slots
            for bp_item in save_data.backpack:
                slot_name = f"slot_{bp_item.slot_index}"
                await conn.execute(
                    """
                    INSERT INTO inventory_items (character_id, location_type, slot_name, item_id, item_name, item_type, quantity, stat_bonus)
                    VALUES (?, 'backpack', ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        save_data.id,
                        slot_name,
                        bp_item.item_id,
                        bp_item.name,
                        bp_item.type,
                        bp_item.quantity,
                        bp_item.stat_bonus,
                    ),
                )

            await conn.commit()

            return CharacterSaveResponse(
                status="saved",
                character_id=save_data.id,
                timestamp=now_iso,
            )
        finally:
            await conn.close()
