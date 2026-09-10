import { GridMap } from './GridMap';
import { LightEmitter } from '../types/world';
import { PlayerEntity, MonsterEntity } from '../types/entity';
import { CONFIG } from '../config';

export class LightingSystem {
  public static computePlayerRadius(player: PlayerEntity): number {
    if (player.lightSpellTimer > 0) {
      return CONFIG.LIGHT_SPELL_RADIUS;
    }
    const offHand = player.paperdoll.off_hand;
    const mainHand = player.paperdoll.main_hand;
    if ((offHand && offHand.item_id === 'torch') || (mainHand && mainHand.item_id === 'torch')) {
      return CONFIG.TORCH_LIGHT_RADIUS;
    }
    return CONFIG.BASE_LIGHT_RADIUS;
  }

  public static updateLighting(
    gridMap: GridMap,
    player: PlayerEntity,
    ambientLights: LightEmitter[],
    monsters: MonsterEntity[]
  ): void {
    // 1. Reset all tiles
    for (let y = 0; y < gridMap.height; y++) {
      for (let x = 0; x < gridMap.width; x++) {
        const tile = gridMap.tiles[y][x];
        tile.isLit = false;
        tile.lightIntensity = 0;
      }
    }

    // 2. Cast light from ambient emitters
    for (const emitter of ambientLights) {
      LightingSystem.castLightCircle(gridMap, emitter.x, emitter.y, emitter.radius);
    }

    // 3. Cast light from player
    const playerRadius = LightingSystem.computePlayerRadius(player);
    LightingSystem.castLightCircle(gridMap, player.x, player.y, playerRadius);

    // 4. Update monster visibility and light-triggered aggro
    for (const monster of monsters) {
      const tile = gridMap.getTile(monster.x, monster.y);
      if (tile && tile.isLit) {
        monster.visible = true;
        // If monster is illuminated and has line of sight to player, trigger aggro
        if (!monster.isAggroed) {
          if (LightingSystem.hasLineOfSight(gridMap, monster.x, monster.y, player.x, player.y)) {
            monster.isAggroed = true;
          }
        }
      } else {
        monster.visible = false;
      }
    }
  }

  public static castLightCircle(gridMap: GridMap, originX: number, originY: number, radius: number): void {
    const minX = Math.max(0, originX - radius);
    const maxX = Math.min(gridMap.width - 1, originX + radius);
    const minY = Math.max(0, originY - radius);
    const maxY = Math.min(gridMap.height - 1, originY + radius);

    // Light the origin tile directly
    const originTile = gridMap.getTile(originX, originY);
    if (originTile) {
      originTile.isLit = true;
      originTile.lightIntensity = Math.max(originTile.lightIntensity, 1.0);
    }

    // Cast rays to perimeter of the bounding square
    for (let x = minX; x <= maxX; x++) {
      LightingSystem.castRay(gridMap, originX, originY, x, minY, radius);
      LightingSystem.castRay(gridMap, originX, originY, x, maxY, radius);
    }
    for (let y = minY; y <= maxY; y++) {
      LightingSystem.castRay(gridMap, originX, originY, minX, y, radius);
      LightingSystem.castRay(gridMap, originX, originY, maxX, y, radius);
    }
  }

  private static castRay(
    gridMap: GridMap,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    maxRadius: number
  ): void {
    const points = LightingSystem.getBresenhamLine(x0, y0, x1, y1);

    for (const pt of points) {
      const dist = Math.hypot(pt.x - x0, pt.y - y0);
      if (dist > maxRadius + 0.5) break;

      const tile = gridMap.getTile(pt.x, pt.y);
      if (!tile) break;

      tile.isLit = true;
      const intensity = Math.max(0, 1 - dist / (maxRadius + 1));
      tile.lightIntensity = Math.max(tile.lightIntensity, intensity);

      // If this tile is a solid wall, it is illuminated, but ray cannot penetrate further
      if (gridMap.isWall(pt.x, pt.y) && (pt.x !== x0 || pt.y !== y0)) {
        break;
      }
    }
  }

  public static hasLineOfSight(
    gridMap: GridMap,
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): boolean {
    const points = LightingSystem.getBresenhamLine(x0, y0, x1, y1);
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      // Starting and ending points don't block their own LOS check unless internal wall
      if (i > 0 && i < points.length - 1) {
        if (gridMap.isWall(pt.x, pt.y)) {
          return false;
        }
      }
    }
    return true;
  }

  public static getBresenhamLine(x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let currX = x0;
    let currY = y0;

    while (true) {
      points.push({ x: currX, y: currY });
      if (currX === x1 && currY === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        currX += sx;
      }
      if (e2 < dx) {
        err += dx;
        currY += sy;
      }
    }

    return points;
  }
}
