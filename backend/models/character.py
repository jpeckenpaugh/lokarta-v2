from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from backend.models.inventory import PaperdollDTO, BackpackSlotDTO, ActionSlotDTO

VocationType = Literal["magician", "archer", "fighter", "paladin"]


class Position(BaseModel):
    x: int = Field(..., ge=0, description="X coordinate on 40x40 dungeon grid")
    y: int = Field(..., ge=0, description="Y coordinate on 40x40 dungeon grid")


class CharacterStats(BaseModel):
    hp: int = Field(..., ge=0, description="Current health points")
    max_hp: int = Field(..., gt=0, description="Maximum health points")
    mana: int = Field(..., ge=0, description="Current mana points")
    max_mana: int = Field(..., gt=0, description="Maximum mana points")
    level: int = Field(default=1, ge=1, le=20, description="Character level (1-20)")
    xp: int = Field(default=0, ge=0, description="Current experience points")
    xp_to_next_level: int = Field(default=100, gt=0, description="XP required for next level")
    current_floor: int = Field(default=1, ge=1, description="Current floor index")
    position: Position = Field(..., description="Grid position")


class CharacterResponse(BaseModel):
    id: str = Field(..., description="Character identifier (e.g. magician, archer, fighter, paladin, or player ID)")
    vocation: VocationType = Field(..., description="Class vocation")
    hp: int = Field(..., ge=0, description="Current health points")
    max_hp: int = Field(..., gt=0, description="Maximum health points")
    mana: int = Field(..., ge=0, description="Current mana points")
    max_mana: int = Field(..., gt=0, description="Maximum mana points")
    level: int = Field(default=1, ge=1, le=20, description="Character level (1-20)")
    xp: int = Field(default=0, ge=0, description="Current experience points")
    xp_to_next_level: int = Field(default=100, gt=0, description="XP required for next level")
    current_floor: int = Field(default=1, ge=1, description="Current floor index")
    position: Position = Field(..., description="Current coordinates on grid")
    action_bar: List[ActionSlotDTO] = Field(default_factory=list, description="Items and abilities in 10-slot action bar")
    backpack: List[BackpackSlotDTO] = Field(default_factory=list, description="Items in 6-slot backpack")
    paperdoll: PaperdollDTO = Field(default_factory=PaperdollDTO, description="Equipped items across 4 paperdoll slots")


class CharacterSaveRequest(BaseModel):
    id: str = Field(..., description="Character identifier")
    vocation: VocationType = Field(..., description="Class vocation")
    hp: int = Field(..., ge=0, description="Current health points")
    max_hp: int = Field(..., gt=0, description="Maximum health points")
    mana: int = Field(..., ge=0, description="Current mana points")
    max_mana: int = Field(..., gt=0, description="Maximum mana points")
    level: int = Field(default=1, ge=1, le=20, description="Character level (1-20)")
    xp: int = Field(default=0, ge=0, description="Current experience points")
    xp_to_next_level: int = Field(default=100, gt=0, description="XP required for next level")
    current_floor: int = Field(default=1, ge=1, description="Current floor index")
    position: Position = Field(..., description="Current coordinates on grid")
    action_bar: List[ActionSlotDTO] = Field(default_factory=list, description="Items and abilities in 10-slot action bar")
    backpack: List[BackpackSlotDTO] = Field(default_factory=list, description="Items in 6-slot backpack")
    paperdoll: PaperdollDTO = Field(default_factory=PaperdollDTO, description="Equipped items across 4 paperdoll slots")


class CharacterSaveResponse(BaseModel):
    status: str = Field(default="saved", description="Save status string")
    character_id: str = Field(..., description="Saved character ID")
    timestamp: str = Field(..., description="ISO 8601 timestamp of save")
