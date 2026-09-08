import {
  CharacterResponse,
  CharacterSaveRequest,
  CharacterSaveResponse,
  DungeonFloorResponse,
  DungeonSyncRequest,
  DungeonSyncResponse,
  BackpackSlotDTO,
} from '../types/api';
import { PlayerEntity } from '../types/entity';
import { CONFIG } from '../config';

export class SyncManager {
  private static baseUrl = CONFIG.API_BASE_URL;

  public static async fetchCharacter(characterId: string): Promise<CharacterResponse> {
    const res = await fetch(`${SyncManager.baseUrl}/characters/${characterId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch character: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as CharacterResponse;
  }

  public static async fetchDungeonFloor(floorId: number): Promise<DungeonFloorResponse> {
    const res = await fetch(`${SyncManager.baseUrl}/dungeons/${floorId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch dungeon floor: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as DungeonFloorResponse;
  }

  public static async saveCharacter(player: PlayerEntity): Promise<CharacterSaveResponse> {
    const backpackDTOs: BackpackSlotDTO[] = [];
    for (let i = 0; i < player.backpack.length; i++) {
      const item = player.backpack[i];
      if (item) {
        backpackDTOs.push({
          slot_index: i,
          item_id: item.item_id,
          name: item.name,
          type: item.type,
          quantity: item.quantity,
          stat_bonus: item.stat_bonus,
        });
      }
    }

    const payload: CharacterSaveRequest = {
      id: player.id,
      vocation: player.vocation,
      hp: player.hp,
      max_hp: player.max_hp,
      mana: player.mana,
      max_mana: player.max_mana,
      current_floor: player.current_floor,
      position: { x: player.x, y: player.y },
      paperdoll: {
        right_hand: player.paperdoll.right_hand ? { ...player.paperdoll.right_hand } : null,
        left_hand: player.paperdoll.left_hand ? { ...player.paperdoll.left_hand } : null,
        armor: player.paperdoll.armor ? { ...player.paperdoll.armor } : null,
      },
      backpack: backpackDTOs,
    };

    const res = await fetch(`${SyncManager.baseUrl}/character/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to save character: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as CharacterSaveResponse;
  }

  public static async syncDungeonProgress(player: PlayerEntity, floorId: number): Promise<DungeonSyncResponse> {
    const payload: DungeonSyncRequest = {
      character_id: player.id,
      floor_id: floorId,
      is_cleared: true,
      character_state: {
        hp: player.hp,
        max_hp: player.max_hp,
        mana: player.mana,
        max_mana: player.max_mana,
        current_floor: player.current_floor,
        position: { x: player.x, y: player.y },
      },
    };

    const res = await fetch(`${SyncManager.baseUrl}/dungeon/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to sync dungeon progress: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as DungeonSyncResponse;
  }
}
