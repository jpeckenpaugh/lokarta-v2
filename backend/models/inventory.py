from typing import Optional, Literal
from pydantic import BaseModel, Field

ItemType = Literal["weapon", "offhand", "armor", "relic", "spell", "consumable", "ammo", "tool"]
LocationType = Literal["action_bar", "backpack", "paperdoll"]


class ItemDTO(BaseModel):
    item_id: str = Field(..., description="Unique identifier for item archetype (e.g. apprentice_wand)")
    name: str = Field(..., description="Display name of the item")
    type: ItemType = Field(..., description="Classification category of the item")
    quantity: int = Field(default=1, ge=1, description="Stack quantity")
    stat_bonus: int = Field(default=0, description="Damage, armor, or light radius bonus")


class PaperdollDTO(BaseModel):
    main_hand: Optional[ItemDTO] = Field(default=None, description="Equipped weapon in main hand")
    off_hand: Optional[ItemDTO] = Field(default=None, description="Equipped offhand/shield/torch in off hand")
    armor: Optional[ItemDTO] = Field(default=None, description="Equipped body armor")
    relic: Optional[ItemDTO] = Field(default=None, description="Equipped relic or accessory")


class ActionSlotDTO(BaseModel):
    slot_index: int = Field(..., ge=0, le=9, description="Action slot index 0..9")
    item_id: str = Field(..., description="Unique identifier for item or spell archetype")
    name: str = Field(..., description="Display name of the item or spell")
    type: ItemType = Field(..., description="Classification category of the item")
    quantity: int = Field(default=1, ge=1, description="Stack quantity")
    stat_bonus: int = Field(default=0, description="Damage, armor, or light radius bonus")


class BackpackSlotDTO(BaseModel):
    slot_index: int = Field(..., ge=0, le=5, description="Backpack slot index 0..5")
    item_id: str = Field(..., description="Unique identifier for item archetype")
    name: str = Field(..., description="Display name of the item")
    type: ItemType = Field(..., description="Classification category of the item")
    quantity: int = Field(default=1, ge=1, description="Stack quantity")
    stat_bonus: int = Field(default=0, description="Damage, armor, or light radius bonus")
