import { TileType, GroundTile } from '../types/world';
import { Item } from '../types/item';
import { CONFIG } from '../config';

export class GridMap {
  public width: number;
  public height: number;
  public tiles: GroundTile[][];

  constructor(width = CONFIG.MAP_WIDTH, height = CONFIG.MAP_HEIGHT) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.initEmptyGrid();
  }

  private initEmptyGrid(): void {
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      const row: GroundTile[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push({
          x,
          y,
          type: TileType.WALL,
          items: [],
          isLit: false,
          lightIntensity: 0,
        });
      }
      this.tiles.push(row);
    }
  }

  public loadFromMatrix(matrix: number[][]): void {
    this.height = matrix.length;
    this.width = matrix[0]?.length || CONFIG.MAP_WIDTH;
    this.tiles = [];

    for (let y = 0; y < this.height; y++) {
      const row: GroundTile[] = [];
      for (let x = 0; x < this.width; x++) {
        const typeCode = matrix[y][x];
        const tileType = typeCode === 1 ? TileType.WALL : typeCode === 2 ? TileType.STAIRS : TileType.FLOOR;
        row.push({
          x,
          y,
          type: tileType,
          items: [],
          isLit: false,
          lightIntensity: 0,
        });
      }
      this.tiles.push(row);
    }
  }

  public isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  public isWalkable(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return false;
    return this.tiles[y][x].type !== TileType.WALL;
  }

  public isWall(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return true;
    return this.tiles[y][x].type === TileType.WALL;
  }

  public isStairs(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return false;
    return this.tiles[y][x].type === TileType.STAIRS;
  }

  public getTile(x: number, y: number): GroundTile | null {
    if (!this.isInBounds(x, y)) return null;
    return this.tiles[y][x];
  }

  public addItem(x: number, y: number, item: Item): void {
    const tile = this.getTile(x, y);
    if (tile) {
      tile.items.push(item);
    }
  }

  public popTopItem(x: number, y: number): Item | null {
    const tile = this.getTile(x, y);
    if (tile && tile.items.length > 0) {
      return tile.items.pop() || null;
    }
    return null;
  }

  public removeItem(x: number, y: number, itemIndex: number): Item | null {
    const tile = this.getTile(x, y);
    if (tile && itemIndex >= 0 && itemIndex < tile.items.length) {
      const removed = tile.items.splice(itemIndex, 1);
      return removed[0] || null;
    }
    return null;
  }

  public getItems(x: number, y: number): Item[] {
    const tile = this.getTile(x, y);
    return tile ? tile.items : [];
  }
}
