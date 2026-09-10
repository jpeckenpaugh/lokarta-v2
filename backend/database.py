import json
import os
from pathlib import Path
from typing import AsyncGenerator
import aiosqlite
from backend.seed_data.crypt_floor_1 import CRYPT_FLOOR_1_DATA

# Database location defaults to backend/lokarta.db
DEFAULT_DB_PATH = Path(__file__).resolve().parent / "lokarta.db"
DB_PATH = os.environ.get("LOKARTA_DB_PATH", str(DEFAULT_DB_PATH))


def get_db_path() -> str:
    return os.environ.get("LOKARTA_DB_PATH", str(DEFAULT_DB_PATH))


async def get_db_connection() -> aiosqlite.Connection:
    conn = await aiosqlite.connect(get_db_path())
    conn.row_factory = aiosqlite.Row
    await conn.execute("PRAGMA foreign_keys = ON;")
    return conn


async def init_db():
    """Initializes SQLite tables and seeds floor 1 if not present."""
    db_file = Path(get_db_path())
    db_file.parent.mkdir(parents=True, exist_ok=True)

    async with aiosqlite.connect(get_db_path()) as db:
        await db.execute("PRAGMA foreign_keys = ON;")

        # 1. Characters table
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS characters (
                id TEXT PRIMARY KEY,
                vocation TEXT NOT NULL CHECK(vocation IN ('magician', 'archer', 'fighter', 'paladin')),
                hp INTEGER NOT NULL,
                max_hp INTEGER NOT NULL,
                mana INTEGER NOT NULL,
                max_mana INTEGER NOT NULL,
                level INTEGER NOT NULL DEFAULT 1,
                xp INTEGER NOT NULL DEFAULT 0,
                xp_to_next_level INTEGER NOT NULL DEFAULT 100,
                current_floor INTEGER NOT NULL DEFAULT 1,
                x_pos INTEGER NOT NULL,
                y_pos INTEGER NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )

        # Migration helper for existing databases
        cursor = await db.execute("PRAGMA table_info(characters);")
        columns = [row[1] for row in await cursor.fetchall()]
        if "level" not in columns:
            await db.execute("ALTER TABLE characters ADD COLUMN level INTEGER NOT NULL DEFAULT 1;")
        if "xp" not in columns:
            await db.execute("ALTER TABLE characters ADD COLUMN xp INTEGER NOT NULL DEFAULT 0;")
        if "xp_to_next_level" not in columns:
            await db.execute("ALTER TABLE characters ADD COLUMN xp_to_next_level INTEGER NOT NULL DEFAULT 100;")

        # 2. Inventory Items table
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS inventory_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                character_id TEXT NOT NULL,
                location_type TEXT NOT NULL CHECK(location_type IN ('action_bar', 'backpack', 'paperdoll')),
                slot_name TEXT NOT NULL,
                item_id TEXT NOT NULL,
                item_name TEXT NOT NULL,
                item_type TEXT NOT NULL CHECK(item_type IN ('weapon', 'offhand', 'armor', 'relic', 'spell', 'consumable', 'ammo', 'tool')),
                quantity INTEGER NOT NULL DEFAULT 1,
                stat_bonus INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE
            );
            """
        )

        # 3. Dungeon Floors table
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS dungeon_floors (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                width INTEGER NOT NULL DEFAULT 40,
                height INTEGER NOT NULL DEFAULT 40,
                tile_matrix TEXT NOT NULL,
                ambient_lights TEXT NOT NULL,
                initial_spawns TEXT NOT NULL,
                initial_loot TEXT NOT NULL
            );
            """
        )

        # 4. World Progress table
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS world_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                character_id TEXT NOT NULL,
                floor_id INTEGER NOT NULL,
                is_cleared INTEGER NOT NULL DEFAULT 0,
                cleared_at TEXT,
                FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE,
                FOREIGN KEY(floor_id) REFERENCES dungeon_floors(id)
            );
            """
        )

        # Indices
        await db.execute("CREATE INDEX IF NOT EXISTS idx_inventory_char ON inventory_items(character_id);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_progress_char ON world_progress(character_id);")

        # Seed floor 1 if not exists
        cursor = await db.execute("SELECT id FROM dungeon_floors WHERE id = ?", (CRYPT_FLOOR_1_DATA["id"],))
        existing_floor = await cursor.fetchone()
        if not existing_floor:
            await db.execute(
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

        await db.commit()
