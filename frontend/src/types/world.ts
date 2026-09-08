import { Item } from './item';
import { Coordinates } from './entity';

export enum TileType {
  FLOOR = 0,
  WALL = 1,
  STAIRS = 2,
}

export interface GroundTile {
  x: number;
  y: number;
  type: TileType;
  items: Item[];
  isLit: boolean;
  lightIntensity: number; // 0.0 to 1.0
}

export interface LightEmitter {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface DungeonFloor {
  id: number;
  name: string;
  width: number;
  height: number;
  entrance: Coordinates;
  exit: Coordinates;
  tile_matrix: number[][];
  ambient_lights: LightEmitter[];
}
