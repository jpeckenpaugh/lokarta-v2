from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from backend.models.inventory import PaperdollDTO, BackpackSlotDTO

VocationType = Literal["magician", "archer"]


class Position(BaseModel):
    x: int = Field(..., ge=0, description="X coordinate on 40x40 dungeon grid")
    y: int = Field(..., ge=0, description="Y coordinate on 40x40 dungeon grid")


class CharacterStats(BaseModel):
    hp: int = Field(..., ge=0, description="Current health points")
    max_hp: int = Field(..., gt=0, description="Maximum health points")
    mana: int = Field(..., ge=0, description="Current mana points")
    max_mana: int = Field(..., gt=0, description="Maximum mana points")
    current_floor: int = Field(default=1, ge=1, description="Current floor index")
    position: Position = Field(..., description="Grid position")


class CharacterResponse(BaseModel):
    id: str = Field(..., description="Character identifier (e.g. magician, archer, or player ID)")
    vocation: VocationType = Field(..., description="Class vocation")
    hp: int = Field(..., ge=0, description="Current health points")
    max_hp: int = Field(..., gt=0, description="Maximum health points")
    mana: int = Field(..., ge=0, description="Current mana points")
    max_mana: int = Field(..., gt=0, description="Maximum mana points")
    current_floor: int = Field(default=1, ge=1, description="Current floor index")
    position: Position = Field(..., description="Current coordinates on grid")
    paperdoll: PaperdollDTO = Field(default_factory=PaperdollDTO, description="Equipped items")
    backpack: List[BackpackSlotDTO] = Field(default_factory=list, description="Items in 6-slot backpack")


class CharacterSaveRequest(BaseModel):
    id: str = Field(..., description="Character identifier")
    vocation: VocationType = Field(..., description="Class vocation")
    hp: int = Field(..., ge=0, description="Current health points")
    max_hp: int = Field(..., gt=0, description="Maximum health points")
    mana: int = Field(..., ge=0, description="Current mana points")
    max_mana: int = Field(..., gt=0, description="Maximum mana points")
    current_floor: int = Field(default=1, ge=1, description="Current floor index")
    position: Position = Field(..., description="Current coordinates on grid")
    paperdoll: PaperdollDTO = Field(default_factory=PaperdollDTO, description="Equipped items")
    backpack: List[BackpackSlotDTO] = Field(default_factory=list, description="Items in 6-slot backpack")


class CharacterSaveResponse(BaseModel):
    status: str = Field(default="saved", description="Save status string")
    character_id: str = Field(..., description="Saved character ID")
    timestamp: str = Field(..., description="ISO 8601 timestamp of save")
