from typing import List, Optional
from pydantic import BaseModel, Field
from backend.models.character import CharacterStats


class Coordinates(BaseModel):
    x: int = Field(..., description="X coordinate")
    y: int = Field(..., description="Y coordinate")


class LightEmitter(BaseModel):
    x: int = Field(..., description="X coordinate of the light source")
    y: int = Field(..., description="Y coordinate of the light source")
    radius: int = Field(..., ge=1, description="Illumination radius in tiles")
    color: str = Field(default="#ffaa44", description="Hex color or styling string for light aura")


class SpawnPoint(BaseModel):
    id: str = Field(..., description="Unique entity spawn identifier")
    type: str = Field(..., description="Entity archetype (e.g. crypt_skeleton, shadow_cultist)")
    x: int = Field(..., description="Spawn X coordinate")
    y: int = Field(..., description="Spawn Y coordinate")
    hp: int = Field(..., gt=0, description="Initial health points")
    max_hp: int = Field(..., gt=0, description="Max health points")


class GroundLootItem(BaseModel):
    item_id: str = Field(..., description="Item archetype identifier")
    name: str = Field(..., description="Display name")
    type: str = Field(..., description="Item category (weapon, offhand, armor, consumable, ammo)")
    x: int = Field(..., description="Floor tile X coordinate")
    y: int = Field(..., description="Floor tile Y coordinate")
    quantity: int = Field(default=1, ge=1, description="Stack count")
    stat_bonus: int = Field(default=0, description="Stat bonus or modifier")


class DungeonFloorResponse(BaseModel):
    id: int = Field(..., description="Floor identifier")
    name: str = Field(..., description="Floor display name")
    width: int = Field(default=40, description="Map width in tiles")
    height: int = Field(default=40, description="Map height in tiles")
    entrance: Coordinates = Field(..., description="Player spawn entrance coordinates")
    exit: Coordinates = Field(..., description="Floor exit stairway coordinates")
    tile_matrix: List[List[int]] = Field(..., description="40x40 matrix of tile codes (0=floor, 1=wall, 2=stairs)")
    ambient_lights: List[LightEmitter] = Field(default_factory=list, description="Static torch/sconce emitters")
    spawns: List[SpawnPoint] = Field(default_factory=list, description="Initial monster spawns")
    initial_loot: List[GroundLootItem] = Field(default_factory=list, description="Initial floor ground items")


class DungeonSyncRequest(BaseModel):
    character_id: str = Field(..., description="Character identifier")
    floor_id: int = Field(..., description="Cleared floor ID")
    is_cleared: bool = Field(default=True, description="Whether the floor was completed")
    character_state: Optional[CharacterStats] = Field(default=None, description="Optional snapshot of character stats")


class DungeonSyncResponse(BaseModel):
    status: str = Field(default="floor_cleared", description="Status indicator")
    character_id: str = Field(..., description="Character identifier")
    floor_id: int = Field(..., description="Floor ID")
    cleared: bool = Field(default=True, description="Floor clearance status")
    message: str = Field(default="Floor cleared successfully.", description="Descriptive status message")
