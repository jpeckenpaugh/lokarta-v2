"""Seed definition for Subterranean Crypt Floor 1."""
from typing import List, Dict, Any


def generate_crypt_matrix() -> List[List[int]]:
    """Generates a 40x40 matrix of tile codes (0=floor, 1=wall, 2=exit stairs)."""
    # Initialize full 40x40 grid as solid stone walls (1)
    grid = [[1 for _ in range(40)] for _ in range(40)]

    def carve_room(x1: int, y1: int, x2: int, y2: int):
        for y in range(max(1, y1), min(39, y2 + 1)):
            for x in range(max(1, x1), min(39, x2 + 1)):
                grid[y][x] = 0

    def carve_h_corridor(x1: int, x2: int, y: int):
        for x in range(min(x1, x2), max(x1, x2) + 1):
            if 1 <= x <= 38 and 1 <= y <= 38:
                grid[y][x] = 0

    def carve_v_corridor(y1: int, y2: int, x: int):
        for y in range(min(y1, y2), max(y1, y2) + 1):
            if 1 <= x <= 38 and 1 <= y <= 38:
                grid[y][x] = 0

    # Room 1: Entrance Crypt (Northwest)
    carve_room(2, 2, 6, 6)

    # Corridor Room 1 -> Room 2
    carve_h_corridor(6, 10, 4)
    carve_v_corridor(4, 8, 10)

    # Room 2: Pillars Hall (North-Central)
    carve_room(8, 8, 16, 16)
    # Add internal pillars in Pillars Hall
    grid[10][10] = 1
    grid[10][14] = 1
    grid[14][10] = 1
    grid[14][14] = 1

    # Corridor Room 2 -> Room 3
    carve_h_corridor(16, 22, 12)
    carve_v_corridor(12, 10, 22)

    # Room 3: Scribe's Archive (Northeast)
    carve_room(22, 6, 32, 14)

    # Corridor Room 2 -> Room 4
    carve_v_corridor(16, 22, 12)
    carve_h_corridor(12, 8, 22)

    # Room 4: Burial Catacombs (Southwest)
    carve_room(6, 22, 16, 34)
    grid[26][10] = 1
    grid[26][12] = 1
    grid[30][10] = 1
    grid[30][12] = 1

    # Corridor Room 3 -> Room 5
    carve_v_corridor(14, 20, 28)
    carve_h_corridor(28, 24, 20)

    # Room 5: Ritual Circle (Central-East)
    carve_room(22, 18, 30, 26)

    # Corridor Room 4 -> Room 6
    carve_h_corridor(16, 24, 28)
    carve_v_corridor(28, 30, 24)

    # Corridor Room 5 -> Room 6
    carve_v_corridor(26, 30, 28)

    # Room 6: Sanctum of the Stairway (Southeast)
    carve_room(24, 28, 38, 38)

    # Place Exit Stairs at (37, 37)
    grid[37][37] = 2

    # Verify Entrance at (2, 2) is floor (0)
    grid[2][2] = 0

    return grid


CRYPT_FLOOR_1_MATRIX = generate_crypt_matrix()

CRYPT_FLOOR_1_DATA: Dict[str, Any] = {
    "id": 1,
    "name": "Subterranean Crypt - Floor 1",
    "width": 40,
    "height": 40,
    "entrance": {"x": 2, "y": 2},
    "exit": {"x": 37, "y": 37},
    "tile_matrix": CRYPT_FLOOR_1_MATRIX,
    "ambient_lights": [
        {"x": 10, "y": 10, "radius": 3, "color": "#ffaa44"},
        {"x": 25, "y": 18, "radius": 3, "color": "#ffaa44"},
        {"x": 37, "y": 37, "radius": 3, "color": "#88eeff"},
        {"x": 4, "y": 4, "radius": 2, "color": "#ffaa44"},
        {"x": 12, "y": 28, "radius": 3, "color": "#ffaa44"},
    ],
    "spawns": [
        {"id": "skel_1", "type": "crypt_skeleton", "x": 8, "y": 12, "hp": 40, "max_hp": 40},
        {"id": "skel_2", "type": "crypt_skeleton", "x": 19, "y": 14, "hp": 40, "max_hp": 40},
        {"id": "cult_1", "type": "shadow_cultist", "x": 28, "y": 24, "hp": 30, "max_hp": 30},
        {"id": "skel_3", "type": "crypt_skeleton", "x": 14, "y": 28, "hp": 40, "max_hp": 40},
        {"id": "cult_2", "type": "shadow_cultist", "x": 32, "y": 32, "hp": 30, "max_hp": 30},
    ],
    "initial_loot": [
        {"item_id": "health_potion", "name": "Health Potion", "type": "consumable", "x": 5, "y": 4, "quantity": 1, "stat_bonus": 30},
        {"item_id": "torch", "name": "Wooden Torch", "type": "offhand", "x": 2, "y": 4, "quantity": 1, "stat_bonus": 5},
        {"item_id": "arrows", "name": "Arrows", "type": "ammo", "x": 12, "y": 8, "quantity": 15, "stat_bonus": 0},
        {"item_id": "mana_potion", "name": "Mana Potion", "type": "consumable", "x": 24, "y": 8, "quantity": 1, "stat_bonus": 40},
        {"item_id": "health_potion", "name": "Health Potion", "type": "consumable", "x": 10, "y": 32, "quantity": 1, "stat_bonus": 30},
        {"item_id": "arrows", "name": "Arrows", "type": "ammo", "x": 28, "y": 20, "quantity": 20, "stat_bonus": 0},
    ],
}
