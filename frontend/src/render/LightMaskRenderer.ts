import { GridMap } from '../engine/GridMap';
import { PlayerEntity } from '../types/entity';
import { LightEmitter } from '../types/world';
import { CONFIG } from '../config';

export class LightMaskRenderer {
  public static renderLightMask(
    ctx: CanvasRenderingContext2D,
    gridMap: GridMap,
    player: PlayerEntity,
    _ambientLights: LightEmitter[],
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    // Create an offscreen or directly composite dark overlay
    ctx.save();

    // 1. Render black darkness tiles over unlit / occluded tiles
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
        }
      }
    }

    // 2. Render smooth continuous radial darkness dissolve over the player's field of view
    // (0% darkness in core vision, smooth gradual shadow falloff toward outer 10-tile boundary)
    const playerRadius = player.lightSpellTimer > 0
      ? CONFIG.LIGHT_SPELL_RADIUS
      : (player.paperdoll.main_hand?.item_id === 'torch' || player.paperdoll.off_hand?.item_id === 'torch' || player.action_bar.some(i => i?.item_id === 'torch'))
      ? CONFIG.TORCH_LIGHT_RADIUS
      : CONFIG.BASE_LIGHT_RADIUS;

    const playerScreenX = player.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - cameraX;
    const playerScreenY = player.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - cameraY;
    const maxRadiusPx = (playerRadius + 0.5) * CONFIG.GRID_SIZE;
    const innerClearRadiusPx = (playerRadius * 0.58) * CONFIG.GRID_SIZE;

    const darkGrad = ctx.createRadialGradient(
      playerScreenX,
      playerScreenY,
      innerClearRadiusPx,
      playerScreenX,
      playerScreenY,
      maxRadiusPx
    );
    darkGrad.addColorStop(0, 'rgba(5, 6, 8, 0.0)');
    darkGrad.addColorStop(0.35, 'rgba(5, 6, 8, 0.18)');
    darkGrad.addColorStop(0.70, 'rgba(5, 6, 8, 0.55)');
    darkGrad.addColorStop(0.95, 'rgba(5, 6, 8, 0.90)');
    darkGrad.addColorStop(1.0, 'rgba(5, 6, 8, 1.0)');

    ctx.fillStyle = darkGrad;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, maxRadiusPx, 0, Math.PI * 2);
    ctx.fill();

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

    // Ambient sconces localized flame glow (Disabled for testing player-only lighting)
    // for (const emitter of ambientLights) {
    //   ...
    // }

    ctx.restore();
  }
}
