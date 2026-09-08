import random
from typing import Dict, Any, List


def generate_dungeon_floor(floor_id: int) -> Dict[str, Any]:
    """
    Generates a deterministic, fully-connected 40x40 dungeon floor for floors 1 to 20.
    """
    rng = random.Random(1337 + floor_id * 42)

    width = 40
    height = 40

    # Determine Biome Theme
    if floor_id <= 5:
        biome = "Subterranean Crypt"
        light_color = "#ff8800"
    elif floor_id <= 10:
        biome = "Catacombs of Whispers"
        light_color = "#00d4ff"
    elif floor_id <= 15:
        biome = "Shadow Vaults"
        light_color = "#a855f7"
    else:
        biome = "Abyssal Sanctum"
        light_color = "#ef4444"

    name = f"{biome} - Floor {floor_id}"
    if floor_id == 20:
        name = "Abyssal Sanctum - The Void Core (Final Floor)"

    # Initialize all walls (1)
    matrix = [[1 for _ in range(width)] for _ in range(height)]

    # Define structured rooms across 3x3 macro grid to guarantee connectivity
    rooms = [
        # (x1, y1, x2, y2)
        (2, 2, 8, 8),      # Top-Left (Entrance)
        (13, 2, 22, 9),    # Top-Center
        (28, 2, 37, 9),    # Top-Right
        (2, 14, 10, 24),   # Mid-Left
        (15, 14, 26, 25),  # Center Hall
        (30, 14, 37, 24),  # Mid-Right
        (2, 29, 11, 37),   # Bot-Left
        (16, 29, 26, 37),  # Bot-Center
        (30, 29, 37, 37),  # Bot-Right (Exit Sanctum)
    ]

    # Carve rooms into floor (0)
    for (x1, y1, x2, y2) in rooms:
        for y in range(y1, y2 + 1):
            for x in range(x1, x2 + 1):
                matrix[y][x] = 0

    # Carve horizontal and vertical connecting corridors
    def carve_h(x_start: int, x_end: int, y: int):
        for x in range(min(x_start, x_end), max(x_start, x_end) + 1):
            matrix[y][x] = 0
            if y + 1 < height - 1:
                matrix[y + 1][x] = 0

    def carve_v(y_start: int, y_end: int, x: int):
        for y in range(min(y_start, y_end), max(y_start, y_end) + 1):
            matrix[y][x] = 0
            if x + 1 < width - 1:
                matrix[y][x + 1] = 0

    # Connect adjacent rooms
    # Row 1
    carve_h(8, 13, 5)
    carve_h(22, 28, 5)
    # Row 2
    carve_h(10, 15, 19)
    carve_h(26, 30, 19)
    # Row 3
    carve_h(11, 16, 33)
    carve_h(26, 30, 33)

    # Column connections
    carve_v(8, 14, 5)
    carve_v(24, 29, 5)
    carve_v(9, 14, 20)
    carve_v(25, 29, 20)
    carve_v(9, 14, 34)
    carve_v(24, 29, 34)

    # Entrance is at (2, 2)
    # Exit Stairs (tile code 2) placed in Bot-Right room at (35, 35)
    exit_x, exit_y = 35, 35
    matrix[exit_y][exit_x] = 2

    # Ambient Lights (Torches on walls / centers of rooms)
    ambient_lights = [
        {"x": 2, "y": 2, "radius": 4, "color": light_color},
        {"x": 17, "y": 5, "radius": 4, "color": light_color},
        {"x": 33, "y": 5, "radius": 4, "color": light_color},
        {"x": 6, "y": 19, "radius": 4, "color": light_color},
        {"x": 20, "y": 19, "radius": 6, "color": light_color},
        {"x": 34, "y": 19, "radius": 4, "color": light_color},
        {"x": 6, "y": 33, "radius": 4, "color": light_color},
        {"x": 21, "y": 33, "radius": 4, "color": light_color},
        {"x": exit_x, "y": exit_y, "radius": 5, "color": "#38bdf8" if floor_id < 20 else "#ffd700"},
    ]

    # Monster Scaling
    skel_hp = 40 + (floor_id - 1) * 6
    cult_hp = 30 + (floor_id - 1) * 5

    spawns: List[Dict[str, Any]] = []
    spawn_id = 1

    # Populate monsters across non-entrance rooms
    monster_rooms = rooms[1:]
    for idx, (rx1, ry1, rx2, ry2) in enumerate(monster_rooms):
        cx = (rx1 + rx2) // 2
        cy = (ry1 + ry2) // 2

        # 1-2 monsters per room on low floors, 2-3 on higher floors
        monsters_to_spawn = 1 + (1 if floor_id >= 4 else 0) + (1 if floor_id >= 10 and rng.random() > 0.4 else 0)

        for m_i in range(monsters_to_spawn):
            m_type = "crypt_skeleton" if (idx + m_i) % 2 == 0 else "shadow_cultist"
            m_hp = skel_hp if m_type == "crypt_skeleton" else cult_hp
            offset_x = (m_i - 1) * 2 if rx1 + 2 <= cx + (m_i - 1) * 2 <= rx2 - 2 else 0
            offset_y = (m_i % 2) * 2 if ry1 + 2 <= cy + (m_i % 2) * 2 <= ry2 - 2 else 0

            spawns.append({
                "id": f"f{floor_id}_m_{spawn_id}",
                "type": m_type,
                "x": cx + offset_x,
                "y": cy + offset_y,
                "hp": m_hp,
                "max_hp": m_hp,
            })
            spawn_id += 1

    # Floor 20 Final Boss
    if floor_id == 20:
        spawns.append({
            "id": "f20_boss_overlord",
            "type": "shadow_cultist",
            "x": 33,
            "y": 33,
            "hp": 300,
            "max_hp": 300,
        })

    # Loot Spawns
    initial_loot: List[Dict[str, Any]] = [
        {"x": 6, "y": 6, "item_id": "torch", "name": "Wooden Torch", "type": "offhand", "quantity": 1 + floor_id // 5, "stat_bonus": 5},
        {"x": 17, "y": 7, "item_id": "health_potion", "name": "Health Potion", "type": "consumable", "quantity": 2, "stat_bonus": 30},
        {"x": 20, "y": 21, "item_id": "mana_potion", "name": "Mana Potion", "type": "consumable", "quantity": 2, "stat_bonus": 40},
        {"x": 33, "y": 20, "item_id": "arrows", "name": "Arrows", "type": "ammo", "quantity": 20 + floor_id * 2, "stat_bonus": 0},
        {"x": 8, "y": 33, "item_id": "health_potion", "name": "Health Potion", "type": "consumable", "quantity": 2, "stat_bonus": 30},
    ]

    if floor_id % 5 == 0:
        initial_loot.append({
            "x": 22,
            "y": 22,
            "item_id": "mana_potion",
            "name": "Greater Mana Potion",
            "type": "consumable",
            "quantity": 3,
            "stat_bonus": 60,
        })

    return {
        "id": floor_id,
        "name": name,
        "width": width,
        "height": height,
        "tile_matrix": matrix,
        "ambient_lights": ambient_lights,
        "spawns": spawns,
        "initial_loot": initial_loot,
    }
