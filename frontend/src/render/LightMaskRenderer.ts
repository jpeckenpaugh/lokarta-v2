import { GridMap } from '../engine/GridMap';
import { PlayerEntity } from '../types/entity';
import { LightEmitter } from '../types/world';
import { CONFIG } from '../config';

export class LightMaskRenderer {
  public static renderLightMask(
    ctx: CanvasRenderingContext2D,
    gridMap: GridMap,
    player: PlayerEntity,
    ambientLights: LightEmitter[],
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    // Create an offscreen or directly composite dark overlay
    ctx.save();

    // 1. Render black darkness tiles over non-lit tiles (removing block darkness)
    const startTileX = Math.max(0, Math.floor(cameraX / CONFIG.GRID_SIZE));
    const endTileX = Math.min(gridMap.width - 1, Math.ceil((cameraX + viewportWidth) / CONFIG.GRID_SIZE));
    const startTileY = Math.max(0, Math.floor(cameraY / CONFIG.GRID_SIZE));
    const endTileY = Math.min(gridMap.height - 1, Math.ceil((cameraY + viewportHeight) / CONFIG.GRID_SIZE));

    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const tile = gridMap.tiles[y][x];
        const screenX = x * CONFIG.GRID_SIZE - cameraX;
        const screenY = y * CONFIG.GRID_SIZE - cameraY;

        if (!tile.isLit) {
          ctx.fillStyle = '#050608';
          ctx.fillRect(screenX, screenY, CONFIG.GRID_SIZE, CONFIG.GRID_SIZE);
        } else if (tile.lightIntensity < 0.12) {
          // Soft transition only at the extreme outer perimeter edge
          const edgeAlpha = Math.min(0.75, (0.12 - tile.lightIntensity) / 0.12);
          ctx.fillStyle = `rgba(5, 6, 8, ${edgeAlpha.toFixed(2)})`;
          ctx.fillRect(screenX, screenY, CONFIG.GRID_SIZE, CONFIG.GRID_SIZE);
        }
      }
    }

    // 2. Render localized glowing auras for magical items, active spells, and torches
    const playerScreenX = player.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - cameraX;
    const playerScreenY = player.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - cameraY;

    // Check for active spell or glowing weapon/torch
    const hasActiveSpell = player.lightSpellTimer > 0;
    const hasTorch = player.paperdoll.main_hand?.item_id === 'torch' ||
                     player.paperdoll.off_hand?.item_id === 'torch' ||
                     player.action_bar.some(i => i?.item_id === 'torch');
    const hasMagicItem = player.action_bar.some(i => i?.type === 'spell' || (i?.item_id && (i.item_id.includes('wand') || i.item_id.includes('scepter') || i.item_id.includes('orb'))));

    if (hasActiveSpell || hasTorch || hasMagicItem) {
      const auraRadius = hasActiveSpell ? 2.5 * CONFIG.GRID_SIZE : 1.5 * CONFIG.GRID_SIZE;
      const auraColor = hasActiveSpell
        ? 'rgba(56, 189, 248, 0.25)'
        : hasTorch
        ? 'rgba(251, 191, 36, 0.20)'
        : 'rgba(168, 85, 247, 0.15)';

      const grad = ctx.createRadialGradient(
        playerScreenX,
        playerScreenY,
        4,
        playerScreenX,
        playerScreenY,
        auraRadius
      );
      grad.addColorStop(0, auraColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY, auraRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ambient sconces localized flame glow
    for (const emitter of ambientLights) {
      const eScreenX = emitter.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - cameraX;
      const eScreenY = emitter.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - cameraY;
      const eRadius = 2.0 * CONFIG.GRID_SIZE;

      const eGrad = ctx.createRadialGradient(
        eScreenX,
        eScreenY,
        4,
        eScreenX,
        eScreenY,
        eRadius
      );
      eGrad.addColorStop(0, emitter.color === '#88eeff' ? 'rgba(136, 238, 255, 0.25)' : 'rgba(251, 191, 36, 0.22)');
      eGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = eGrad;
      ctx.beginPath();
      ctx.arc(eScreenX, eScreenY, eRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
