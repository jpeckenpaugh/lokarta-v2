import { GridMap } from '../engine/GridMap';
import { PlayerEntity, MonsterEntity, Projectile, FloatingText } from '../types/entity';
import { LightEmitter } from '../types/world';
import { SpriteManager } from './SpriteManager';
import { LightMaskRenderer } from './LightMaskRenderer';
import { CONFIG } from '../config';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cameraX = 0;
  private cameraY = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D canvas rendering context.');
    }
    this.ctx = context;
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public render(
    gridMap: GridMap,
    player: PlayerEntity,
    monsters: MonsterEntity[],
    ambientLights: LightEmitter[],
    projectiles: Projectile[],
    floatingTexts: FloatingText[],
    selectedMonsterId?: string | null
  ): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 1. Update Camera Position (smooth target centering)
    const targetCamX = player.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - width / 2;
    const targetCamY = player.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - height / 2;

    const maxCamX = Math.max(0, gridMap.width * CONFIG.GRID_SIZE - width);
    const maxCamY = Math.max(0, gridMap.height * CONFIG.GRID_SIZE - height);

    this.cameraX = Math.max(0, Math.min(maxCamX, targetCamX));
    this.cameraY = Math.max(0, Math.min(maxCamY, targetCamY));

    // Clear background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    // Visible tile boundaries
    const startTileX = Math.max(0, Math.floor(this.cameraX / CONFIG.GRID_SIZE));
    const endTileX = Math.min(gridMap.width - 1, Math.ceil((this.cameraX + width) / CONFIG.GRID_SIZE));
    const startTileY = Math.max(0, Math.floor(this.cameraY / CONFIG.GRID_SIZE));
    const endTileY = Math.min(gridMap.height - 1, Math.ceil((this.cameraY + height) / CONFIG.GRID_SIZE));

    // 2. Render Tilemap Layer
    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const tile = gridMap.tiles[y][x];
        const screenX = x * CONFIG.GRID_SIZE - this.cameraX;
        const screenY = y * CONFIG.GRID_SIZE - this.cameraY;
        SpriteManager.drawTile(ctx, tile.type, screenX, screenY);
      }
    }

    // 3. Render Ground Items Layer
    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const tile = gridMap.tiles[y][x];
        if (tile.items.length > 0) {
          const screenX = x * CONFIG.GRID_SIZE - this.cameraX;
          const screenY = y * CONFIG.GRID_SIZE - this.cameraY;
          const topItem = tile.items[tile.items.length - 1];
          SpriteManager.drawItem(ctx, topItem, screenX, screenY);
        }
      }
    }

    // 4. Render Monster Entities Layer (only visible monsters)
    for (const monster of monsters) {
      if (monster.visible) {
        const screenX = monster.x * CONFIG.GRID_SIZE - this.cameraX;
        const screenY = monster.y * CONFIG.GRID_SIZE - this.cameraY;
        SpriteManager.drawMonster(ctx, monster, screenX, screenY);

        // Highlight selected target reticle
        if (selectedMonsterId === monster.id) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(
            screenX + CONFIG.GRID_SIZE / 2,
            screenY + CONFIG.GRID_SIZE / 2,
            CONFIG.GRID_SIZE / 2 + 3,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
      }
    }

    // 5. Render Player Entity Layer
    const playerScreenX = player.x * CONFIG.GRID_SIZE - this.cameraX;
    const playerScreenY = player.y * CONFIG.GRID_SIZE - this.cameraY;
    SpriteManager.drawPlayer(ctx, player, playerScreenX, playerScreenY);

    // 6. Render Projectiles & Energy Beams
    this.renderProjectiles(ctx, projectiles);

    // 7. Render Darkness & Light Mask Overlay
    LightMaskRenderer.renderLightMask(
      ctx,
      gridMap,
      player,
      ambientLights,
      this.cameraX,
      this.cameraY,
      width,
      height
    );

    // 8. Render Floating Combat Text
    this.renderFloatingTexts(ctx, floatingTexts);
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]): void {
    for (const p of projectiles) {
      if (p.type === 'energy_beam' && p.piercingTiles) {
        // Draw radiant energy beam stripe
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 170, 0.4)';
        ctx.strokeStyle = '#ff66dd';
        ctx.lineWidth = 3;

        for (const tile of p.piercingTiles) {
          const sx = tile.x * CONFIG.GRID_SIZE - this.cameraX;
          const sy = tile.y * CONFIG.GRID_SIZE - this.cameraY;
          ctx.fillRect(sx, sy, CONFIG.GRID_SIZE, CONFIG.GRID_SIZE);
          ctx.strokeRect(sx + 2, sy + 2, CONFIG.GRID_SIZE - 4, CONFIG.GRID_SIZE - 4);
        }
        ctx.restore();
      } else {
        const progress = Math.min(1.0, p.elapsedMs / p.durationMs);
        const startPixelX = p.sourceX * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - this.cameraX;
        const startPixelY = p.sourceY * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - this.cameraY;
        const targetPixelX = p.targetX * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - this.cameraX;
        const targetPixelY = p.targetY * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - this.cameraY;

        const curX = startPixelX + (targetPixelX - startPixelX) * progress;
        const curY = startPixelY + (targetPixelY - startPixelY) * progress;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(curX, curY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Trail glow
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startPixelX, startPixelY);
        ctx.lineTo(curX, curY);
        ctx.stroke();
      }
    }
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]): void {
    ctx.save();
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';

    for (const t of texts) {
      const screenX = t.x - this.cameraX;
      const screenY = t.y - this.cameraY;

      // Drop shadow
      ctx.fillStyle = '#000000';
      ctx.fillText(t.text, screenX + 1, screenY + 1);

      ctx.fillStyle = t.color;
      ctx.fillText(t.text, screenX, screenY);
    }
    ctx.restore();
  }

  public screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
    const worldX = screenX + this.cameraX;
    const worldY = screenY + this.cameraY;
    return {
      x: Math.floor(worldX / CONFIG.GRID_SIZE),
      y: Math.floor(worldY / CONFIG.GRID_SIZE),
    };
  }
}
