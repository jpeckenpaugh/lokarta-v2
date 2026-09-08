from fastapi import APIRouter, Path
from backend.models.dungeon import (
    DungeonFloorResponse,
    DungeonSyncRequest,
    DungeonSyncResponse,
)
from backend.services.dungeon_service import DungeonService

router = APIRouter(tags=["Dungeons"])


@router.get("/api/dungeons/{floor_id}", response_model=DungeonFloorResponse)
async def get_dungeon_floor(
    floor_id: int = Path(..., description="Floor identifier (e.g. 1 for Subterranean Crypt)")
):
    """Retrieves the 40x40 dungeon matrix, ambient lights, monster spawns, and initial loot."""
    return await DungeonService.get_dungeon_floor(floor_id)


@router.post("/api/dungeon/sync", response_model=DungeonSyncResponse)
@router.post("/api/dungeons/sync", response_model=DungeonSyncResponse, include_in_schema=False)
async def sync_dungeon_progress(sync_data: DungeonSyncRequest):
    """Commits floor completion state and character progression snapshot to the persistence store."""
    return await DungeonService.sync_dungeon_progress(sync_data)
