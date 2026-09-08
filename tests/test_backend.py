import os
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from backend.main import app
from backend.database import init_db, get_db_path, DEFAULT_DB_PATH


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db(tmp_path, monkeypatch):
    test_db = tmp_path / "test_lokarta.db"
    monkeypatch.setenv("LOKARTA_DB_PATH", str(test_db))
    await init_db()
    yield
    if test_db.exists():
        test_db.unlink()


@pytest.mark.asyncio
async def test_health_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_root = await client.get("/")
        assert res_root.status_code == 200
        data_root = res_root.json()
        assert data_root["status"] == "healthy"

        res_health = await client.get("/api/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_get_dungeon_floor_1():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/dungeons/1")
        assert res.status_code == 200
        data = res.json()

        assert data["id"] == 1
        assert "Subterranean Crypt" in data["name"]
        assert data["width"] == 40
        assert data["height"] == 40
        assert data["entrance"] == {"x": 2, "y": 2}
        assert data["exit"] == {"x": 37, "y": 37}

        # Validate 40x40 matrix
        matrix = data["tile_matrix"]
        assert len(matrix) == 40
        for row in matrix:
            assert len(row) == 40

        # Entrance is floor (0), Exit is stairs (2)
        assert matrix[2][2] == 0
        assert matrix[37][37] == 2

        # Ambient lights, spawns, initial loot
        assert len(data["ambient_lights"]) >= 3
        assert len(data["spawns"]) >= 3
        assert len(data["initial_loot"]) >= 3

        spawn_types = [s["type"] for s in data["spawns"]]
        assert "crypt_skeleton" in spawn_types
        assert "shadow_cultist" in spawn_types


@pytest.mark.asyncio
async def test_get_nonexistent_dungeon_floor():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/dungeons/999")
        assert res.status_code == 404


@pytest.mark.asyncio
async def test_character_seeding_magician():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/characters/magician")
        assert res.status_code == 200
        data = res.json()

        assert data["id"] == "magician"
        assert data["vocation"] == "magician"
        assert data["hp"] == 60
        assert data["max_hp"] == 60
        assert data["mana"] == 120
        assert data["max_mana"] == 120
        assert data["position"] == {"x": 2, "y": 2}

        paperdoll = data["paperdoll"]
        assert paperdoll["right_hand"]["item_id"] == "apprentice_wand"
        assert paperdoll["left_hand"]["item_id"] == "torch"
        assert paperdoll["armor"]["item_id"] == "cloth_robe"

        backpack = data["backpack"]
        assert len(backpack) == 2
        bp_item_ids = [item["item_id"] for item in backpack]
        assert "mana_potion" in bp_item_ids
        assert "health_potion" in bp_item_ids


@pytest.mark.asyncio
async def test_character_seeding_archer():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/characters/archer")
        assert res.status_code == 200
        data = res.json()

        assert data["id"] == "archer"
        assert data["vocation"] == "archer"
        assert data["hp"] == 90
        assert data["max_hp"] == 90
        assert data["mana"] == 60
        assert data["max_mana"] == 60
        assert data["position"] == {"x": 2, "y": 2}

        paperdoll = data["paperdoll"]
        assert paperdoll["right_hand"]["item_id"] == "wooden_bow"
        assert paperdoll["left_hand"] is None
        assert paperdoll["armor"]["item_id"] == "leather_armor"

        backpack = data["backpack"]
        assert len(backpack) == 2
        bp_item_ids = [item["item_id"] for item in backpack]
        assert "arrows" in bp_item_ids
        assert "health_potion" in bp_item_ids


@pytest.mark.asyncio
async def test_character_save_and_persistence():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First ensure character is initialized
        await client.get("/api/characters/magician")

        # Save mutated state (e.g. took damage, spent mana, moved, picked up loot)
        save_payload = {
            "id": "magician",
            "vocation": "magician",
            "hp": 45,
            "max_hp": 60,
            "mana": 85,
            "max_mana": 120,
            "current_floor": 1,
            "position": {"x": 12, "y": 14},
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
                    "quantity": 3,
                    "stat_bonus": 40,
                },
                {
                    "slot_index": 1,
                    "item_id": "health_potion",
                    "name": "Health Potion",
                    "type": "consumable",
                    "quantity": 2,
                    "stat_bonus": 30,
                },
                {
                    "slot_index": 2,
                    "item_id": "arrows",
                    "name": "Arrows",
                    "type": "ammo",
                    "quantity": 10,
                    "stat_bonus": 0,
                },
            ],
        }

        save_res = await client.post("/api/character/save", json=save_payload)
        assert save_res.status_code == 200
        save_data = save_res.json()
        assert save_data["status"] == "saved"
        assert save_data["character_id"] == "magician"
        assert "timestamp" in save_data

        # Fetch character again and verify persistent changes
        fetch_res = await client.get("/api/characters/magician")
        assert fetch_res.status_code == 200
        fetched = fetch_res.json()
        assert fetched["hp"] == 45
        assert fetched["mana"] == 85
        assert fetched["position"] == {"x": 12, "y": 14}
        assert len(fetched["backpack"]) == 3
        slot_2 = next(item for item in fetched["backpack"] if item["slot_index"] == 2)
        assert slot_2["item_id"] == "arrows"
        assert slot_2["quantity"] == 10


@pytest.mark.asyncio
async def test_dungeon_sync():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Initialize character
        await client.get("/api/characters/archer")

        sync_payload = {
            "character_id": "archer",
            "floor_id": 1,
            "is_cleared": True,
            "character_state": {
                "hp": 75,
                "max_hp": 90,
                "mana": 45,
                "max_mana": 60,
                "current_floor": 1,
                "position": {"x": 37, "y": 37},
            },
        }

        sync_res = await client.post("/api/dungeon/sync", json=sync_payload)
        assert sync_res.status_code == 200
        sync_data = sync_res.json()
        assert sync_data["status"] == "floor_cleared"
        assert sync_data["character_id"] == "archer"
        assert sync_data["floor_id"] == 1
        assert sync_data["cleared"] is True

        # Verify character stats updated
        char_res = await client.get("/api/characters/archer")
        assert char_res.status_code == 200
        char_data = char_res.json()
        assert char_data["hp"] == 75
        assert char_data["position"] == {"x": 37, "y": 37}


@pytest.mark.asyncio
async def test_get_multiple_dungeon_floors_and_boss_floor_20():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Check Floor 5 (Crypts)
        res5 = await client.get("/api/dungeons/5")
        assert res5.status_code == 200
        data5 = res5.json()
        assert data5["id"] == 5
        assert "Subterranean Crypt" in data5["name"]
        assert len(data5["spawns"]) > 0

        # Check Floor 10 (Catacombs)
        res10 = await client.get("/api/dungeons/10")
        assert res10.status_code == 200
        data10 = res10.json()
        assert data10["id"] == 10
        assert "Catacombs" in data10["name"]

        # Check Floor 20 (Final Boss Floor)
        res20 = await client.get("/api/dungeons/20")
        assert res20.status_code == 200
        data20 = res20.json()
        assert data20["id"] == 20
        assert "Abyssal Sanctum" in data20["name"]
        boss_spawn = next((s for s in data20["spawns"] if "boss" in s["id"]), None)
        assert boss_spawn is not None
        assert boss_spawn["hp"] >= 250

        # Check Floor 21 (Out of bounds -> 404)
        res21 = await client.get("/api/dungeons/21")
        assert res21.status_code == 404


@pytest.mark.asyncio
async def test_character_level_and_xp_persistence():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.get("/api/characters/magician")

        save_payload = {
            "id": "magician",
            "vocation": "magician",
            "hp": 76,
            "max_hp": 76,
            "mana": 152,
            "max_mana": 152,
            "level": 3,
            "xp": 140,
            "xp_to_next_level": 300,
            "current_floor": 2,
            "position": {"x": 2, "y": 2},
            "paperdoll": {},
            "backpack": [],
        }

        save_res = await client.post("/api/character/save", json=save_payload)
        assert save_res.status_code == 200

        fetch_res = await client.get("/api/characters/magician")
        assert fetch_res.status_code == 200
        fetched = fetch_res.json()
        assert fetched["level"] == 3
        assert fetched["xp"] == 140
        assert fetched["xp_to_next_level"] == 300
        assert fetched["current_floor"] == 2

