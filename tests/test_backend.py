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
async def test_character_seeding_all_four_vocations_zero_inventory():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        vocation_expectations = {
            "magician": {"hp": 60, "max_hp": 60, "mana": 150, "max_mana": 150},
            "archer": {"hp": 90, "max_hp": 90, "mana": 80, "max_mana": 80},
            "fighter": {"hp": 140, "max_hp": 140, "mana": 30, "max_mana": 30},
            "paladin": {"hp": 120, "max_hp": 120, "mana": 90, "max_mana": 90},
        }

        for voc_id, expected_stats in vocation_expectations.items():
            res = await client.get(f"/api/characters/{voc_id}")
            assert res.status_code == 200, f"Failed to seed vocation {voc_id}"
            data = res.json()

            assert data["id"] == voc_id
            assert data["vocation"] == voc_id
            assert data["hp"] == expected_stats["hp"]
            assert data["max_hp"] == expected_stats["max_hp"]
            assert data["mana"] == expected_stats["mana"]
            assert data["max_mana"] == expected_stats["max_mana"]
            assert data["level"] == 1
            assert data["xp"] == 0
            assert data["xp_to_next_level"] == 100
            assert data["current_floor"] == 1
            assert data["position"] == {"x": 2, "y": 2}

            # Zero-inventory baseline assertions
            assert data["action_bar"] == []
            assert data["backpack"] == []
            assert data["paperdoll"] == {
                "main_hand": None,
                "off_hand": None,
                "armor": None,
                "relic": None,
            }


@pytest.mark.asyncio
async def test_character_save_and_persistence_with_10_action_slots_and_paperdoll():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First ensure character is initialized
        await client.get("/api/characters/magician")

        # Save mutated state with 10 action slots, 6 backpack slots, and 4 paperdoll slots
        action_bar_payload = [
            {
                "slot_index": i,
                "item_id": f"spell_slot_{i}",
                "name": f"Spell {i}",
                "type": "spell" if i % 2 == 0 else "weapon",
                "quantity": 1,
                "stat_bonus": 10 + i,
            }
            for i in range(10)
        ]

        backpack_payload = [
            {
                "slot_index": i,
                "item_id": f"item_bp_{i}",
                "name": f"Backpack Item {i}",
                "type": "consumable",
                "quantity": i + 1,
                "stat_bonus": 20 + i,
            }
            for i in range(6)
        ]

        save_payload = {
            "id": "magician",
            "vocation": "magician",
            "hp": 45,
            "max_hp": 60,
            "mana": 85,
            "max_mana": 150,
            "level": 2,
            "xp": 120,
            "xp_to_next_level": 200,
            "current_floor": 1,
            "position": {"x": 14, "y": 18},
            "paperdoll": {
                "main_hand": {
                    "item_id": "apprentice_wand",
                    "name": "Apprentice Wand",
                    "type": "weapon",
                    "quantity": 1,
                    "stat_bonus": 12,
                },
                "off_hand": {
                    "item_id": "torch",
                    "name": "Wooden Torch",
                    "type": "tool",
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
                "relic": {
                    "item_id": "ancient_amulet",
                    "name": "Ancient Amulet",
                    "type": "relic",
                    "quantity": 1,
                    "stat_bonus": 15,
                },
            },
            "action_bar": action_bar_payload,
            "backpack": backpack_payload,
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
        assert fetched["level"] == 2
        assert fetched["xp"] == 120
        assert fetched["xp_to_next_level"] == 200
        assert fetched["position"] == {"x": 14, "y": 18}

        # Validate paperdoll slots
        assert fetched["paperdoll"]["main_hand"]["item_id"] == "apprentice_wand"
        assert fetched["paperdoll"]["off_hand"]["item_id"] == "torch"
        assert fetched["paperdoll"]["armor"]["item_id"] == "cloth_robe"
        assert fetched["paperdoll"]["relic"]["item_id"] == "ancient_amulet"

        # Validate all 10 action slots
        assert len(fetched["action_bar"]) == 10
        for i in range(10):
            assert fetched["action_bar"][i]["slot_index"] == i
            assert fetched["action_bar"][i]["item_id"] == f"spell_slot_{i}"

        # Validate all 6 backpack slots
        assert len(fetched["backpack"]) == 6
        for i in range(6):
            assert fetched["backpack"][i]["slot_index"] == i
            assert fetched["backpack"][i]["item_id"] == f"item_bp_{i}"


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
                "max_mana": 80,
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
        assert char_data["mana"] == 45
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
        await client.get("/api/characters/fighter")

        save_payload = {
            "id": "fighter",
            "vocation": "fighter",
            "hp": 165,
            "max_hp": 165,
            "mana": 35,
            "max_mana": 35,
            "level": 3,
            "xp": 140,
            "xp_to_next_level": 300,
            "current_floor": 2,
            "position": {"x": 2, "y": 2},
            "paperdoll": {},
            "action_bar": [],
            "backpack": [],
        }

        save_res = await client.post("/api/character/save", json=save_payload)
        assert save_res.status_code == 200

        fetch_res = await client.get("/api/characters/fighter")
        assert fetch_res.status_code == 200
        fetched = fetch_res.json()
        assert fetched["level"] == 3
        assert fetched["xp"] == 140
        assert fetched["xp_to_next_level"] == 300
        assert fetched["current_floor"] == 2
        assert fetched["hp"] == 165
        assert fetched["max_hp"] == 165
        assert fetched["mana"] == 35
        assert fetched["max_mana"] == 35
