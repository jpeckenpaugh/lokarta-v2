import json
from datetime import datetime, timezone
from typing import Dict, Any
import aiosqlite
from fastapi import HTTPException
from backend.database import get_db_connection
from backend.models.dungeon import (
    DungeonFloorResponse,
    Coordinates,
    LightEmitter,
    SpawnPoint,
    GroundLootItem,
    DungeonSyncRequest,
    DungeonSyncResponse,
)
from backend.seed_data.crypt_floor_1 import CRYPT_FLOOR_1_DATA


class DungeonService:
    @staticmethod
    async def get_dungeon_floor(floor_id: int) -> DungeonFloorResponse:
        conn = await get_db_connection()
        try:
            cursor = await conn.execute("SELECT * FROM dungeon_floors WHERE id = ?", (floor_id,))
            floor_row = await cursor.fetchone()

            if not floor_row:
                if floor_id == 1:
                    # Insert floor 1 seed
                    await conn.execute(
                        """
                        INSERT INTO dungeon_floors (id, name, width, height, tile_matrix, ambient_lights, initial_spawns, initial_loot)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            CRYPT_FLOOR_1_DATA["id"],
                            CRYPT_FLOOR_1_DATA["name"],
                            CRYPT_FLOOR_1_DATA["width"],
                            CRYPT_FLOOR_1_DATA["height"],
                            json.dumps(CRYPT_FLOOR_1_DATA["tile_matrix"]),
                            json.dumps(CRYPT_FLOOR_1_DATA["ambient_lights"]),
                            json.dumps(CRYPT_FLOOR_1_DATA["spawns"]),
                            json.dumps(CRYPT_FLOOR_1_DATA["initial_loot"]),
                        ),
                    )
                    await conn.commit()
                    cursor = await conn.execute("SELECT * FROM dungeon_floors WHERE id = ?", (floor_id,))
                    floor_row = await cursor.fetchone()
                else:
                    raise HTTPException(status_code=404, detail=f"Dungeon floor {floor_id} not found.")

            tile_matrix = json.loads(floor_row["tile_matrix"])
            ambient_lights_raw = json.loads(floor_row["ambient_lights"])
            spawns_raw = json.loads(floor_row["initial_spawns"])
            loot_raw = json.loads(floor_row["initial_loot"])

            # Find stairs coordinate (tile code 2) or default to (37, 37)
            exit_coord = Coordinates(x=37, y=37)
            for y_idx, row in enumerate(tile_matrix):
                for x_idx, val in enumerate(row):
                    if val == 2:
                        exit_coord = Coordinates(x=x_idx, y=y_idx)
                        break

            return DungeonFloorResponse(
                id=floor_row["id"],
                name=floor_row["name"],
                width=floor_row["width"],
                height=floor_row["height"],
                entrance=Coordinates(x=2, y=2),
                exit=exit_coord,
                tile_matrix=tile_matrix,
                ambient_lights=[LightEmitter(**light) for light in ambient_lights_raw],
                spawns=[SpawnPoint(**sp) for sp in spawns_raw],
                initial_loot=[GroundLootItem(**item) for item in loot_raw],
            )
        finally:
            await conn.close()

    @staticmethod
    async def sync_dungeon_progress(sync_data: DungeonSyncRequest) -> DungeonSyncResponse:
        conn = await get_db_connection()
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            is_cleared_int = 1 if sync_data.is_cleared else 0

            # Record world progress
            cursor = await conn.execute(
                "SELECT id FROM world_progress WHERE character_id = ? AND floor_id = ?",
                (sync_data.character_id, sync_data.floor_id),
            )
            existing_progress = await cursor.fetchone()

            if existing_progress:
                await conn.execute(
                    """
                    UPDATE world_progress
                    SET is_cleared = ?, cleared_at = ?
                    WHERE id = ?
                    """,
                    (is_cleared_int, now_iso, existing_progress["id"]),
                )
            else:
                await conn.execute(
                    """
                    INSERT INTO world_progress (character_id, floor_id, is_cleared, cleared_at)
                    VALUES (?, ?, ?, ?)
                    """,
                    (sync_data.character_id, sync_data.floor_id, is_cleared_int, now_iso),
                )

            # If character state snapshot is provided, update character record
            if sync_data.character_state:
                st = sync_data.character_state
                await conn.execute(
                    """
                    UPDATE characters
                    SET hp = ?, max_hp = ?, mana = ?, max_mana = ?, current_floor = ?, x_pos = ?, y_pos = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (st.hp, st.max_hp, st.mana, st.max_mana, st.current_floor, st.position.x, st.position.y, now_iso, sync_data.character_id),
                )

            await conn.commit()

            return DungeonSyncResponse(
                status="floor_cleared",
                character_id=sync_data.character_id,
                floor_id=sync_data.floor_id,
                cleared=sync_data.is_cleared,
                message=f"Floor {sync_data.floor_id} cleared successfully.",
            )
        finally:
            await conn.close()
