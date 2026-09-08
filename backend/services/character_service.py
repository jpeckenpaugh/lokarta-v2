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
    BackpackSlotDTO,
)

DEFAULT_ARCHETYPES: Dict[str, Dict[str, Any]] = {
    "magician": {
        "id": "magician",
        "vocation": "magician",
        "hp": 60,
        "max_hp": 60,
        "mana": 120,
        "max_mana": 120,
        "current_floor": 1,
        "position": {"x": 2, "y": 2},
        "paperdoll": {
            "right_hand": {
                "item_id": "apprentice_wand",
                "name": "Apprentice Wand",
                "type": "weapon",
                "quantity": 1,
                "stat_bonus": 12,
            },
            "left_hand": {
                "item_id": "torch",
                "name": "Wooden Torch",
                "type": "offhand",
                "quantity": 1,
                "stat_bonus": 5,
            },
            "armor": {
                "item_id": "cloth_robe",
                "name": "Cloth Robe",
                "type": "armor",
                "quantity": 1,
                "stat_bonus": 2,
            },
        },
        "backpack": [
            {
                "slot_index": 0,
                "item_id": "mana_potion",
                "name": "Mana Potion",
                "type": "consumable",
                "quantity": 2,
                "stat_bonus": 40,
            },
            {
                "slot_index": 1,
                "item_id": "health_potion",
                "name": "Health Potion",
                "type": "consumable",
                "quantity": 1,
                "stat_bonus": 30,
            },
        ],
    },
    "archer": {
        "id": "archer",
        "vocation": "archer",
        "hp": 90,
        "max_hp": 90,
        "mana": 60,
        "max_mana": 60,
        "current_floor": 1,
        "position": {"x": 2, "y": 2},
        "paperdoll": {
            "right_hand": {
                "item_id": "wooden_bow",
                "name": "Wooden Bow",
                "type": "weapon",
                "quantity": 1,
                "stat_bonus": 14,
            },
            "left_hand": None,
            "armor": {
                "item_id": "leather_armor",
                "name": "Leather Armor",
                "type": "armor",
                "quantity": 1,
                "stat_bonus": 4,
            },
        },
        "backpack": [
            {
                "slot_index": 0,
                "item_id": "arrows",
                "name": "Arrows",
                "type": "ammo",
                "quantity": 15,
                "stat_bonus": 0,
            },
            {
                "slot_index": 1,
                "item_id": "health_potion",
                "name": "Health Potion",
                "type": "consumable",
                "quantity": 1,
                "stat_bonus": 30,
            },
        ],
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
                    # Seed archetype
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
                "right_hand": None,
                "left_hand": None,
                "armor": None,
            }
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
                elif loc == "backpack":
                    # slot_name is "slot_0".."slot_5" or integer
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

            return CharacterResponse(
                id=char_row["id"],
                vocation=char_row["vocation"],
                hp=char_row["hp"],
                max_hp=char_row["max_hp"],
                mana=char_row["mana"],
                max_mana=char_row["max_mana"],
                current_floor=char_row["current_floor"],
                position=Position(x=char_row["x_pos"], y=char_row["y_pos"]),
                paperdoll=PaperdollDTO(**paperdoll_data),
                backpack=backpack_items,
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
                INSERT INTO characters (id, vocation, hp, max_hp, mana, max_mana, current_floor, x_pos, y_pos, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    vocation = excluded.vocation,
                    hp = excluded.hp,
                    max_hp = excluded.max_hp,
                    mana = excluded.mana,
                    max_mana = excluded.max_mana,
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
                ("right_hand", paperdoll.right_hand),
                ("left_hand", paperdoll.left_hand),
                ("armor", paperdoll.armor),
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
