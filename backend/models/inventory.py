from typing import Optional, Literal
from pydantic import BaseModel, Field

ItemType = Literal["weapon", "offhand", "armor", "consumable", "ammo"]
LocationType = Literal["paperdoll", "backpack"]


class ItemDTO(BaseModel):
    item_id: str = Field(..., description="Unique identifier for item archetype (e.g. apprentice_wand)")
    name: str = Field(..., description="Display name of the item")
    type: ItemType = Field(..., description="Classification category of the item")
    quantity: int = Field(default=1, ge=1, description="Stack quantity")
    stat_bonus: int = Field(default=0, description="Damage, armor, or light radius bonus")


class PaperdollDTO(BaseModel):
    right_hand: Optional[ItemDTO] = Field(default=None, description="Equipped weapon in right hand")
    left_hand: Optional[ItemDTO] = Field(default=None, description="Equipped offhand/shield/torch in left hand")
    armor: Optional[ItemDTO] = Field(default=None, description="Equipped body armor")


class BackpackSlotDTO(BaseModel):
    slot_index: int = Field(..., ge=0, le=5, description="Backpack slot index 0..5")
    item_id: str = Field(..., description="Unique identifier for item archetype")
    name: str = Field(..., description="Display name of the item")
    type: ItemType = Field(..., description="Classification category of the item")
    quantity: int = Field(default=1, ge=1, description="Stack quantity")
    stat_bonus: int = Field(default=0, description="Damage, armor, or light radius bonus")
