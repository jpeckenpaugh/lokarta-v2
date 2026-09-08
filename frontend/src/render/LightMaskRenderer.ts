import { GridMap } from '../engine/GridMap';
import { PlayerEntity } from '../types/entity';
import { LightEmitter } from '../types/world';
import { LightingSystem } from '../engine/LightingSystem';
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

    // 1. Render black darkness tiles over all non-lit or partially lit tiles
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
        } else {
          // Semi-darkness based on light intensity
          const darknessAlpha = Math.max(0, Math.min(0.85, 1.0 - tile.lightIntensity));
          if (darknessAlpha > 0.05) {
            ctx.fillStyle = `rgba(5, 6, 8, ${darknessAlpha.toFixed(2)})`;
            ctx.fillRect(screenX, screenY, CONFIG.GRID_SIZE, CONFIG.GRID_SIZE);
          }
        }
      }
    }

    // 2. Add subtle radial glow halos on active light sources
    const playerRadius = LightingSystem.computePlayerRadius(player);
    const playerScreenX = player.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - cameraX;
    const playerScreenY = player.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - cameraY;

    // Torch / Spell warm/blue tint
    const auraColor = player.lightSpellTimer > 0 ? 'rgba(100, 220, 255, 0.15)' : 'rgba(255, 170, 68, 0.12)';
    const glowRadius = playerRadius * CONFIG.GRID_SIZE;

    const grad = ctx.createRadialGradient(
      playerScreenX,
      playerScreenY,
      CONFIG.GRID_SIZE / 2,
      playerScreenX,
      playerScreenY,
      glowRadius
    );
    grad.addColorStop(0, auraColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Ambient sconces glow
    for (const emitter of ambientLights) {
      const eScreenX = emitter.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - cameraX;
      const eScreenY = emitter.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - cameraY;
      const eRadius = emitter.radius * CONFIG.GRID_SIZE;

      const eGrad = ctx.createRadialGradient(
        eScreenX,
        eScreenY,
        4,
        eScreenX,
        eScreenY,
        eRadius
      );
      eGrad.addColorStop(0, emitter.color === '#88eeff' ? 'rgba(136, 238, 255, 0.18)' : 'rgba(255, 170, 68, 0.14)');
      eGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = eGrad;
      ctx.beginPath();
      ctx.arc(eScreenX, eScreenY, eRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
