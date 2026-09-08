import { ItemType } from './item';

export type VocationType = 'magician' | 'archer';

export interface PositionDTO {
  x: int;
  y: int;
}

type int = number;

export interface PaperdollDTO {
  right_hand?: ItemDTO | null;
  left_hand?: ItemDTO | null;
  armor?: ItemDTO | null;
}

export interface ItemDTO {
  item_id: string;
  name: string;
  type: ItemType;
  quantity: number;
  stat_bonus: number;
}

export interface BackpackSlotDTO {
  slot_index: number;
  item_id: string;
  name: string;
  type: ItemType;
  quantity: number;
  stat_bonus: number;
}

export interface CharacterResponse {
  id: string;
  vocation: VocationType;
  hp: number;
  max_hp: number;
  mana: number;
  max_mana: number;
  current_floor: number;
  position: PositionDTO;
  paperdoll: PaperdollDTO;
  backpack: BackpackSlotDTO[];
}

export interface CharacterSaveRequest {
  id: string;
  vocation: VocationType;
  hp: number;
  max_hp: number;
  mana: number;
  max_mana: number;
  current_floor: number;
  position: PositionDTO;
  paperdoll: PaperdollDTO;
  backpack: BackpackSlotDTO[];
}

export interface CharacterSaveResponse {
  status: string;
  character_id: string;
  timestamp: string;
}

export interface LightEmitterDTO {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface SpawnPointDTO {
  id: string;
  type: string;
  x: number;
  y: number;
  hp: number;
  max_hp: number;
}

export interface GroundLootItemDTO {
  item_id: string;
  name: string;
  type: ItemType;
  x: number;
  y: number;
  quantity: number;
  stat_bonus: number;
}

export interface DungeonFloorResponse {
  id: number;
  name: string;
  width: number;
  height: number;
  entrance: PositionDTO;
  exit: PositionDTO;
  tile_matrix: number[][];
  ambient_lights: LightEmitterDTO[];
  spawns: SpawnPointDTO[];
  initial_loot: GroundLootItemDTO[];
}

export interface DungeonSyncRequest {
  character_id: string;
  floor_id: number;
  is_cleared: boolean;
  character_state?: {
    hp: number;
    max_hp: number;
    mana: number;
    max_mana: number;
    current_floor: number;
    position: PositionDTO;
  } | null;
}

export interface DungeonSyncResponse {
  status: string;
  character_id: string;
  floor_id: number;
  cleared: boolean;
  message: string;
}
