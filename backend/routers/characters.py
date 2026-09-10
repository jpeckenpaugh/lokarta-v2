from fastapi import APIRouter, Path
from backend.models.character import (
    CharacterResponse,
    CharacterSaveRequest,
    CharacterSaveResponse,
)
from backend.services.character_service import CharacterService

router = APIRouter(tags=["Characters"])


@router.get("/api/characters/{character_id}", response_model=CharacterResponse)
async def get_character(
    character_id: str = Path(..., description="Character ID, or archetype 'magician' / 'archer' / 'fighter' / 'paladin'")
):
    """Retrieves a character profile and loadout, seeding zero-inventory baseline for vocations if not found."""
    return await CharacterService.get_or_create_character(character_id)


@router.post("/api/character/save", response_model=CharacterSaveResponse)
@router.post("/api/characters/save", response_model=CharacterSaveResponse, include_in_schema=False)
async def save_character(save_data: CharacterSaveRequest):
    """Persists character stats, coordinates, 10-slot action bar, 6-slot backpack, and 4-slot paperdoll."""
    return await CharacterService.save_character(save_data)
