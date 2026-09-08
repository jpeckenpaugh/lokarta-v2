/**
 * Lokarta Browser Edition - Main Application & Game Controller
 * Connects GameClient, GridMap, LightingSystem, CombatSystem, EntityAI,
 * InventorySystem, ProgressionSystem, and AudioSystem into a full game loop.
 */

import { GameClient } from './game-client.js';
import {
  CONFIG,
  TILE_TYPES,
  GridMap,
  LightingSystem,
  ProgressionSystem,
  CombatSystem,
  EntityAI,
  InventorySystem,
  createPlayer,
} from './engine.js';
import { AudioSystem, soundFX } from './audio.js';

// ============================================================================
// Sprite & Canvas Rendering System
// ============================================================================

class SpriteRenderer {
  static drawTile(ctx, type, screenX, screenY, size = CONFIG.GRID_SIZE) {
    if (type === TILE_TYPES.WALL) {
      // Wall stone block
      ctx.fillStyle = '#2a2f3b';
      ctx.fillRect(screenX, screenY, size, size);

      // Top highlight
      ctx.fillStyle = '#444d61';
      ctx.fillRect(screenX, screenY, size, 4);

      // Brick pattern accents
      ctx.strokeStyle = '#1a1d24';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY + size / 2);
      ctx.lineTo(screenX + size, screenY + size / 2);
      ctx.moveTo(screenX + size / 2, screenY);
      ctx.lineTo(screenX + size / 2, screenY + size / 2);
      ctx.moveTo(screenX + size / 4, screenY + size / 2);
      ctx.lineTo(screenX + size / 4, screenY + size);
      ctx.moveTo(screenX + (3 * size) / 4, screenY + size / 2);
      ctx.lineTo(screenX + (3 * size) / 4, screenY + size);
      ctx.stroke();

      ctx.strokeStyle = '#0d0f14';
      ctx.strokeRect(screenX + 0.5, screenY + 0.5, size - 1, size - 1);
    } else if (type === TILE_TYPES.STAIRS) {
      // Radiant exit stairway
      ctx.fillStyle = '#152b3c';
      ctx.fillRect(screenX, screenY, size, size);

      for (let i = 0; i < 4; i++) {
        const inset = i * 3;
        ctx.fillStyle = i % 2 === 0 ? '#3878a8' : '#254e70';
        ctx.fillRect(screenX + inset, screenY + inset, size - inset * 2, size - inset * 2);
      }

      // Exit rune portal center
      ctx.fillStyle = '#88eeff';
      ctx.beginPath();
      ctx.arc(screenX + size / 2, screenY + size / 2, 5, 0, Math.PI * 2);
      ctx.fill();

      // Glowing border
      ctx.strokeStyle = '#66ccff';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX + 2, screenY + 2, size - 4, size - 4);
    } else if (type === TILE_TYPES.DOOR) {
      // Wooden door threshold
      ctx.fillStyle = '#4a2f1b';
      ctx.fillRect(screenX, screenY, size, size);
      ctx.strokeStyle = '#2d1c10';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX + 2, screenY + 2, size - 4, size - 4);
    } else {
      // Walkable flagstone floor
      ctx.fillStyle = '#1a1c23';
      ctx.fillRect(screenX, screenY, size, size);

      ctx.strokeStyle = '#12141a';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX, screenY, size, size);

      // Subtle stone speckles
      ctx.fillStyle = '#222530';
      ctx.fillRect(screenX + 4, screenY + 4, 6, 6);
      ctx.fillRect(screenX + size - 10, screenY + size - 10, 6, 6);
    }
  }

  static drawItem(ctx, item, screenX, screenY, size = CONFIG.GRID_SIZE) {
    const cx = screenX + size / 2;
    const cy = screenY + size / 2;

    if (item.item_id === 'health_potion') {
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f1faee';
      ctx.fillRect(cx - 3, cy - 8, 6, 4);
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(cx - 4, cy - 10, 8, 3);
    } else if (item.item_id === 'mana_potion') {
      ctx.fillStyle = '#3a86ff';
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f1faee';
      ctx.fillRect(cx - 3, cy - 8, 6, 4);
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(cx - 4, cy - 10, 8, 3);
    } else if (item.item_id === 'torch') {
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(cx - 3, cy - 4, 6, 14);

      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.arc(cx, cy - 5, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.item_id === 'arrows') {
      ctx.strokeStyle = '#d4a373';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + 6);
      ctx.lineTo(cx + 6, cy - 6);
      ctx.moveTo(cx - 4, cy + 8);
      ctx.lineTo(cx + 8, cy - 4);
      ctx.stroke();

      ctx.fillStyle = '#e9d8a6';
      ctx.fillRect(cx - 8, cy + 5, 4, 4);
    } else if (item.type === 'weapon') {
      if (item.item_id.includes('bow')) {
        ctx.strokeStyle = '#c68b59';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 9, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy - 8);
        ctx.lineTo(cx + 5, cy + 8);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#a370f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy + 6);
        ctx.lineTo(cx + 6, cy - 6);
        ctx.stroke();

        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(cx + 6, cy - 6, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#e0a96d';
      ctx.fillRect(cx - 5, cy - 5, 10, 10);
    }

    if (item.quantity > 1) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX + size - 14, screenY + size - 12, 14, 12);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${item.quantity}`, screenX + size - 2, screenY + size - 3);
    }
  }

  static drawPlayer(ctx, player, screenX, screenY, size = CONFIG.GRID_SIZE) {
    const cx = screenX + size / 2;
    const cy = screenY + size / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size / 3, size / 3, size / 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (player.vocation === 'magician') {
      // Magician Robe
      ctx.fillStyle = '#5c2d91';
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 12);
      ctx.lineTo(cx + 8, cy + 12);
      ctx.lineTo(cx + 5, cy - 4);
      ctx.lineTo(cx - 5, cy - 4);
      ctx.closePath();
      ctx.fill();

      // Gold Trim
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Hood
      ctx.fillStyle = '#7a3cb8';
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 6, 0, Math.PI * 2);
      ctx.fill();

      // Face & eyes
      SpriteRenderer.drawFacingEyes(ctx, cx, cy - 6, player.facing, '#44ccff');

      // Wand
      const wandOffset = SpriteRenderer.getFacingOffset(player.facing);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + wandOffset.x * 6, cy + wandOffset.y * 6);
      ctx.lineTo(cx + wandOffset.x * 12, cy + wandOffset.y * 12);
      ctx.stroke();

      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(cx + wandOffset.x * 12, cy + wandOffset.y * 12, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Archer Tunic
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy + 12);
      ctx.lineTo(cx + 7, cy + 12);
      ctx.lineTo(cx + 6, cy - 4);
      ctx.lineTo(cx - 6, cy - 4);
      ctx.closePath();
      ctx.fill();

      // Leather sash
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 4);
      ctx.lineTo(cx + 6, cy + 10);
      ctx.stroke();

      // Cap
      ctx.fillStyle = '#40916c';
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 6, 0, Math.PI * 2);
      ctx.fill();

      // Red feather
      ctx.fillStyle = '#e63946';
      ctx.fillRect(cx - 2, cy - 12, 3, 5);

      // Face & eyes
      SpriteRenderer.drawFacingEyes(ctx, cx, cy - 6, player.facing, '#2b2b2b');

      // Bow
      const bowOffset = SpriteRenderer.getFacingOffset(player.facing);
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx + bowOffset.x * 8, cy + bowOffset.y * 8, 6, 0, Math.PI);
      ctx.stroke();
    }
  }

  static drawMonster(ctx, monster, screenX, screenY, size = CONFIG.GRID_SIZE) {
    const cx = screenX + size / 2;
    const cy = screenY + size / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size / 3, size / 3, size / 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const isAggro = monster.isAggroed;

    if (monster.type === 'giant_rat') {
      // Giant Rat: Brown rodent body, snout, ears, red eyes
      ctx.fillStyle = '#5c4033';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head & snout
      const offset = SpriteRenderer.getFacingOffset(monster.facing);
      ctx.fillStyle = '#7a5542';
      ctx.beginPath();
      ctx.arc(cx + offset.x * 7, cy + offset.y * 4, 5, 0, Math.PI * 2);
      ctx.fill();

      // Beady red eyes
      SpriteRenderer.drawFacingEyes(ctx, cx + offset.x * 4, cy + offset.y * 2, monster.facing, isAggro ? '#ff0000' : '#882222');

      // Tail
      ctx.strokeStyle = '#a67c52';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - offset.x * 7, cy + 2);
      ctx.lineTo(cx - offset.x * 12, cy + 6);
      ctx.stroke();
    } else if (monster.type === 'crypt_skeleton') {
      // Skeleton: Ribcage & skull
      ctx.fillStyle = '#d6d6d6';
      ctx.fillRect(cx - 4, cy - 2, 8, 12);

      // Rib lines
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 2);
      ctx.lineTo(cx + 4, cy + 2);
      ctx.moveTo(cx - 4, cy + 6);
      ctx.lineTo(cx + 4, cy + 6);
      ctx.stroke();

      // Skull
      ctx.fillStyle = '#e8e8e8';
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 6, 0, Math.PI * 2);
      ctx.fill();

      SpriteRenderer.drawFacingEyes(ctx, cx, cy - 6, monster.facing, isAggro ? '#ff2222' : '#555555');

      // Rusted blade
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy + 8);
      ctx.lineTo(cx + 12, cy - 2);
      ctx.stroke();
    } else if (monster.type === 'abyssal_overlord' || monster.isBoss) {
      // Abyssal Overlord Boss: Large horned demon with flaming red aura
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2 + 4, 0, Math.PI * 2);
      ctx.fill();

      // Dark obsidian torso
      ctx.fillStyle = '#1c050a';
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 14);
      ctx.lineTo(cx + 10, cy + 14);
      ctx.lineTo(cx + 8, cy - 6);
      ctx.lineTo(cx - 8, cy - 6);
      ctx.closePath();
      ctx.fill();

      // Demonic head
      ctx.fillStyle = '#3d0c15';
      ctx.beginPath();
      ctx.arc(cx, cy - 8, 8, 0, Math.PI * 2);
      ctx.fill();

      // Horns
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 12);
      ctx.lineTo(cx - 11, cy - 18);
      ctx.moveTo(cx + 6, cy - 12);
      ctx.lineTo(cx + 11, cy - 18);
      ctx.stroke();

      // Blazing hellfire eyes
      SpriteRenderer.drawFacingEyes(ctx, cx, cy - 8, monster.facing, '#ffea00');

      // Boss crown/emblem
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(cx - 3, cy - 16, 6, 3);
    } else {
      // Shadow / Elite Cultist
      const isElite = monster.type === 'elite_cultist';
      ctx.fillStyle = isElite ? '#380e28' : '#1c1124';
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 12);
      ctx.lineTo(cx + 8, cy + 12);
      ctx.lineTo(cx + 6, cy - 4);
      ctx.lineTo(cx - 6, cy - 4);
      ctx.closePath();
      ctx.fill();

      // Hood
      ctx.fillStyle = isElite ? '#50173b' : '#2b1b38';
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 7, 0, Math.PI * 2);
      ctx.fill();

      // Face void
      ctx.fillStyle = '#0a050f';
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 4, 0, Math.PI * 2);
      ctx.fill();

      // Purple / Magenta glowing eyes
      const eyeColor = isAggro ? (isElite ? '#ff00aa' : '#bf40bf') : '#3d1c5a';
      SpriteRenderer.drawFacingEyes(ctx, cx, cy - 6, monster.facing, eyeColor);

      // Shadow orb in hands
      ctx.fillStyle = isElite ? '#ec4899' : '#a855f7';
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Health Bar
    const barWidth = size - 6;
    const barHeight = 4;
    const hpRatio = Math.max(0, monster.hp / (monster.max_hp || 1));

    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(screenX + 3, screenY - 7, barWidth, barHeight);

    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(screenX + 3, screenY - 7, barWidth * hpRatio, barHeight);
  }

  static getFacingOffset(facing) {
    switch (facing) {
      case 'left': return { x: -1, y: 0 };
      case 'right': return { x: 1, y: 0 };
      case 'up': return { x: 0, y: -1 };
      case 'down': default: return { x: 0, y: 1 };
    }
  }

  static drawFacingEyes(ctx, cx, cy, facing, color) {
    ctx.fillStyle = color;
    if (facing === 'left') {
      ctx.fillRect(cx - 4, cy - 1, 2, 2);
    } else if (facing === 'right') {
      ctx.fillRect(cx + 2, cy - 1, 2, 2);
    } else if (facing === 'up') {
      ctx.fillRect(cx - 3, cy - 3, 2, 2);
      ctx.fillRect(cx + 1, cy - 3, 2, 2);
    } else {
      ctx.fillRect(cx - 3, cy - 1, 2, 2);
      ctx.fillRect(cx + 1, cy - 1, 2, 2);
    }
  }
}

// ============================================================================
// Canvas Renderer (Tilemap, Entities, Lighting Mask, VFX)
// ============================================================================

class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cameraX = 0;
    this.cameraY = 0;
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  render(gridMap, player, monsters, ambientLights, projectiles, floatingTexts, selectedMonsterId) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Center camera on player
    const targetCamX = player.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - width / 2;
    const targetCamY = player.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - height / 2;

    const maxCamX = Math.max(0, gridMap.width * CONFIG.GRID_SIZE - width);
    const maxCamY = Math.max(0, gridMap.height * CONFIG.GRID_SIZE - height);

    this.cameraX = Math.max(0, Math.min(maxCamX, targetCamX));
    this.cameraY = Math.max(0, Math.min(maxCamY, targetCamY));

    // Clear background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    const startTileX = Math.max(0, Math.floor(this.cameraX / CONFIG.GRID_SIZE));
    const endTileX = Math.min(gridMap.width - 1, Math.ceil((this.cameraX + width) / CONFIG.GRID_SIZE));
    const startTileY = Math.max(0, Math.floor(this.cameraY / CONFIG.GRID_SIZE));
    const endTileY = Math.min(gridMap.height - 1, Math.ceil((this.cameraY + height) / CONFIG.GRID_SIZE));

    // 1. Tilemap Layer
    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const tile = gridMap.tiles[y][x];
        const screenX = x * CONFIG.GRID_SIZE - this.cameraX;
        const screenY = y * CONFIG.GRID_SIZE - this.cameraY;
        SpriteRenderer.drawTile(ctx, tile.type, screenX, screenY);
      }
    }

    // 2. Ground Items Layer
    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const tile = gridMap.tiles[y][x];
        if (tile.items.length > 0) {
          const screenX = x * CONFIG.GRID_SIZE - this.cameraX;
          const screenY = y * CONFIG.GRID_SIZE - this.cameraY;
          const topItem = tile.items[tile.items.length - 1];
          SpriteRenderer.drawItem(ctx, topItem, screenX, screenY);
        }
      }
    }

    // 3. Monster Entities Layer (only lit / visible monsters)
    for (const monster of monsters) {
      if (monster.visible && monster.hp > 0) {
        const screenX = monster.x * CONFIG.GRID_SIZE - this.cameraX;
        const screenY = monster.y * CONFIG.GRID_SIZE - this.cameraY;
        SpriteRenderer.drawMonster(ctx, monster, screenX, screenY);

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

    // 4. Player Entity Layer
    const playerScreenX = player.x * CONFIG.GRID_SIZE - this.cameraX;
    const playerScreenY = player.y * CONFIG.GRID_SIZE - this.cameraY;
    SpriteRenderer.drawPlayer(ctx, player, playerScreenX, playerScreenY);

    // 5. Projectiles & Energy Beam VFX
    this.renderProjectiles(ctx, projectiles);

    // 6. Dynamic Darkness & Lighting Mask
    this.renderLightMask(ctx, gridMap, player, ambientLights, width, height);

    // 7. Floating Combat Damage & XP Numbers
    this.renderFloatingTexts(ctx, floatingTexts);
  }

  renderProjectiles(ctx, projectiles) {
    for (const p of projectiles) {
      if (p.type === 'energy_beam' && p.piercingTiles) {
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

        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startPixelX, startPixelY);
        ctx.lineTo(curX, curY);
        ctx.stroke();
      }
    }
  }

  renderLightMask(ctx, gridMap, player, ambientLights, viewportWidth, viewportHeight) {
    ctx.save();

    const startTileX = Math.max(0, Math.floor(this.cameraX / CONFIG.GRID_SIZE));
    const endTileX = Math.min(gridMap.width - 1, Math.ceil((this.cameraX + viewportWidth) / CONFIG.GRID_SIZE));
    const startTileY = Math.max(0, Math.floor(this.cameraY / CONFIG.GRID_SIZE));
    const endTileY = Math.min(gridMap.height - 1, Math.ceil((this.cameraY + viewportHeight) / CONFIG.GRID_SIZE));

    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const tile = gridMap.tiles[y][x];
        const screenX = x * CONFIG.GRID_SIZE - this.cameraX;
        const screenY = y * CONFIG.GRID_SIZE - this.cameraY;

        if (!tile.isLit) {
          ctx.fillStyle = '#050608';
          ctx.fillRect(screenX, screenY, CONFIG.GRID_SIZE, CONFIG.GRID_SIZE);
        } else {
          const darknessAlpha = Math.max(0, Math.min(0.85, 1.0 - tile.lightIntensity));
          if (darknessAlpha > 0.05) {
            ctx.fillStyle = `rgba(5, 6, 8, ${darknessAlpha.toFixed(2)})`;
            ctx.fillRect(screenX, screenY, CONFIG.GRID_SIZE, CONFIG.GRID_SIZE);
          }
        }
      }
    }

    // Radial aura glow around player
    const playerRadius = LightingSystem.computePlayerRadius(player);
    const playerScreenX = player.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - this.cameraX;
    const playerScreenY = player.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - this.cameraY;

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

    // Ambient light halos
    for (const emitter of ambientLights) {
      const eScreenX = emitter.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - this.cameraX;
      const eScreenY = emitter.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2 - this.cameraY;
      const eRadius = (emitter.radius || CONFIG.AMBIENT_LIGHT_RADIUS) * CONFIG.GRID_SIZE;

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

  renderFloatingTexts(ctx, texts) {
    ctx.save();
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';

    for (const t of texts) {
      const screenX = t.x - this.cameraX;
      const screenY = t.y - this.cameraY;

      ctx.fillStyle = '#000000';
      ctx.fillText(t.text, screenX + 1, screenY + 1);

      ctx.fillStyle = t.color;
      ctx.fillText(t.text, screenX, screenY);
    }
    ctx.restore();
  }

  screenToGrid(screenX, screenY) {
    const worldX = screenX + this.cameraX;
    const worldY = screenY + this.cameraY;
    return {
      x: Math.floor(worldX / CONFIG.GRID_SIZE),
      y: Math.floor(worldY / CONFIG.GRID_SIZE),
    };
  }
}

// ============================================================================
// Main Game Engine Controller
// ============================================================================

export class LokartaApp {
  constructor() {
    this.gameClient = new GameClient('./game-worker.js');
    this.gridMap = new GridMap();
    this.player = createPlayer('magician');
    this.monsters = [];
    this.ambientLights = [];
    this.projectiles = [];
    this.floatingTexts = [];

    this.selectedMonsterId = null;
    this.isRunning = false;
    this.isFloorCleared = false;
    this.isGameOver = false;
    this.currentFloorName = 'Subterranean Crypt';

    this.tickTimer = null;
    this.animFrameId = null;
    this.lastAnimTime = 0;
    this.regenAccumulator = 0;
    this.keysDown = new Set();

    // DOM References
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new CanvasRenderer(this.canvas);
    this.statusBarsEl = document.getElementById('status-bars-container');
    this.paperdollEl = document.getElementById('paperdoll-container');
    this.backpackEl = document.getElementById('backpack-container');
    this.hotbarEl = document.getElementById('hotbar-container');
    this.combatLogScrollEl = document.getElementById('log-entries-container');
    this.modalOverlayEl = document.getElementById('modal-overlay');

    this.initWindow();
    this.bindInputs();
    this.showTitleScreen();
  }

  initWindow() {
    const resizeHandler = () => {
      const wrapper = document.getElementById('viewport-panel');
      if (wrapper && this.canvas) {
        this.renderer.resize(wrapper.clientWidth, wrapper.clientHeight);
      }
    };
    window.addEventListener('resize', resizeHandler);
    setTimeout(resizeHandler, 50);

    // Sound toggle in top header
    const topAudioBtn = document.getElementById('audio-toggle-btn');
    if (topAudioBtn) {
      topAudioBtn.addEventListener('click', () => {
        soundFX.init();
        const isMuted = soundFX.toggleMute();
        soundFX.playClick();
        this.gameClient.setSoundEnabled(!isMuted).catch(() => {});
        this.updateAudioButtonState();
      });
      this.updateAudioButtonState();
    }

    // Guide button in header
    const headerGuideBtn = document.getElementById('header-guide-btn');
    if (headerGuideBtn) {
      headerGuideBtn.addEventListener('click', () => {
        soundFX.init();
        soundFX.playClick();
        this.showHowToPlayModal(true);
      });
    }
  }

  updateAudioButtonState() {
    const isMuted = soundFX.getMuted();
    const topAudioBtn = document.getElementById('audio-toggle-btn');
    if (topAudioBtn) {
      topAudioBtn.textContent = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
      if (isMuted) topAudioBtn.classList.add('muted');
      else topAudioBtn.classList.remove('muted');
    }
  }

  // ==========================================================================
  // Title Screen & Lifecycle
  // ==========================================================================

  async showTitleScreen() {
    this.modalOverlayEl.classList.remove('hidden');

    let savedSummaryHtml = '';
    let hasSavedGame = false;
    let savedCharacter = null;

    try {
      const bootstrapData = await this.gameClient.bootstrap();
      if (bootstrapData?.profile) {
        soundFX.setMuted(!bootstrapData.profile.soundEnabled);
        this.updateAudioButtonState();
      }

      if (bootstrapData?.player) {
        savedCharacter = bootstrapData.player;
        hasSavedGame = true;
        savedSummaryHtml = `
          <div class="continue-summary-card">
            <div class="save-tag">💾 Active Saved Quest</div>
            <div class="save-details">
              <strong>${(savedCharacter.vocation || 'magician').toUpperCase()}</strong> • Level ${savedCharacter.level || 1} • Floor ${savedCharacter.current_floor || 1}/20
            </div>
            <div class="save-stats">HP: ${savedCharacter.hp}/${savedCharacter.max_hp} | MP: ${savedCharacter.mana}/${savedCharacter.max_mana}</div>
          </div>
        `;
      }
    } catch (err) {
      console.warn('Bootstrap read error:', err);
    }

    this.modalOverlayEl.innerHTML = `
      <div class="title-screen-modal">
        <div class="torch-flicker-container">
          <span class="title-torch left-torch">🔥</span>
          <span class="title-torch right-torch">🔥</span>
        </div>

        <div class="title-header">
          <div class="title-emblem">🕯️</div>
          <h1 class="title-main">LOKARTA</h1>
          <p class="title-subtitle">COME INTO THE LIGHT</p>
          <div class="title-tagline">A 20-Floor Subterranean Descent</div>
        </div>

        ${savedSummaryHtml}

        <div class="title-menu-actions">
          ${
            hasSavedGame
              ? `<button class="title-btn continue-btn" id="btn-title-continue">
                  <span class="btn-icon">📜</span> Continue Quest (Floor ${savedCharacter?.current_floor || 1})
                </button>`
              : ''
          }
          <button class="title-btn new-game-btn" id="btn-title-new-game">
            <span class="btn-icon">⚔️</span> ${hasSavedGame ? 'New Game / Choose Vocation' : 'New Game'}
          </button>
          <button class="title-btn guide-btn" id="btn-title-guide">
            <span class="btn-icon">📖</span> How to Play & Controls
          </button>
          <button class="title-btn audio-title-btn" id="btn-title-audio">
            <span class="btn-icon">${soundFX.getMuted() ? '🔇' : '🔊'}</span> Sound FX: ${soundFX.getMuted() ? 'OFF' : 'ON'}
          </button>
        </div>

        <div class="title-footer">
          <span>Browser Edition • 20 Floors • IndexedDB Save Sync • Procedural Audio</span>
        </div>
      </div>
    `;

    document.getElementById('btn-title-continue')?.addEventListener('click', () => {
      soundFX.init();
      soundFX.playClick();
      this.modalOverlayEl.classList.add('hidden');
      this.modalOverlayEl.innerHTML = '';
      this.startSession(savedCharacter?.vocation || 'magician', true);
    });

    document.getElementById('btn-title-new-game')?.addEventListener('click', () => {
      soundFX.init();
      soundFX.playClick();
      this.showCharacterSelect();
    });

    document.getElementById('btn-title-guide')?.addEventListener('click', () => {
      soundFX.init();
      soundFX.playClick();
      this.showHowToPlayModal(false);
    });

    document.getElementById('btn-title-audio')?.addEventListener('click', () => {
      soundFX.init();
      const isMuted = soundFX.toggleMute();
      soundFX.playClick();
      this.gameClient.setSoundEnabled(!isMuted).catch(() => {});
      this.updateAudioButtonState();
      const btn = document.getElementById('btn-title-audio');
      if (btn) {
        btn.innerHTML = `<span class="btn-icon">${isMuted ? '🔇' : '🔊'}</span> Sound FX: ${isMuted ? 'OFF' : 'ON'}`;
      }
    });
  }

  showCharacterSelect() {
    this.modalOverlayEl.innerHTML = `
      <div class="character-select-modal">
        <div class="modal-header">
          <h2>CHOOSE YOUR VOCATION</h2>
          <p class="subtitle">DESCEND INTO FLOOR 1 OF 20</p>
        </div>
        <p class="prompt">Select your class to begin your descent into the dark labyrinth:</p>
        <div class="vocation-cards">
          <div class="vocation-card" data-vocation="magician">
            <div class="card-icon magician-icon">🧙</div>
            <h3>Magician</h3>
            <div class="stats-preview">
              <div class="stat-row"><span class="stat-label">Health:</span> <span class="stat-val hp">60 HP (+8/lv)</span></div>
              <div class="stat-row"><span class="stat-label">Mana:</span> <span class="stat-val mp">120 MP (+16/lv)</span></div>
              <div class="stat-row"><span class="stat-label">Passive:</span> <span class="stat-val mp">+2 MP / 5s</span></div>
            </div>
            <p class="desc">Master of radiant illumination and piercing energy beams. Powers scale with +10% magic damage per level.</p>
            <ul class="skills-list">
              <li><strong>[1] Wand Spark:</strong> 12–16 Magic Dmg (0 Mana)</li>
              <li><strong>[2] Light Spell:</strong> 7-tile aura for 30s (15 Mana)</li>
              <li><strong>[3] Energy Beam:</strong> 30–40 Piercing Dmg (30 Mana)</li>
            </ul>
            <button class="select-btn" data-vocation="magician">Select Magician</button>
          </div>

          <div class="vocation-card" data-vocation="archer">
            <div class="card-icon archer-icon">🏹</div>
            <h3>Archer</h3>
            <div class="stats-preview">
              <div class="stat-row"><span class="stat-label">Health:</span> <span class="stat-val hp">90 HP (+14/lv)</span></div>
              <div class="stat-row"><span class="stat-label">Mana:</span> <span class="stat-val mp">60 MP (+8/lv)</span></div>
              <div class="stat-row"><span class="stat-label">Passive:</span> <span class="stat-val hp">+2 HP / 5s</span></div>
            </div>
            <p class="desc">Deadly ranged scout with high physical stamina. Damage scales with +12% physical power and range per level.</p>
            <ul class="skills-list">
              <li><strong>[1] Bow Shot:</strong> 14–18 Physical Dmg (1 Arrow)</li>
              <li><strong>[2] Power Shot:</strong> 32–42 Heavy Burst (1 Arrow, 4s CD)</li>
            </ul>
            <button class="select-btn" data-vocation="archer">Select Archer</button>
          </div>
        </div>
        <div class="modal-back-action">
          <button class="action-btn back-btn" id="btn-back-to-title">Back to Title</button>
        </div>
      </div>
    `;

    document.getElementById('btn-back-to-title')?.addEventListener('click', () => {
      soundFX.playClick();
      this.showTitleScreen();
    });

    const buttons = this.modalOverlayEl.querySelectorAll('.select-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', e => {
        const vocation = e.currentTarget.getAttribute('data-vocation');
        if (vocation) {
          soundFX.playClick();
          this.modalOverlayEl.classList.add('hidden');
          this.modalOverlayEl.innerHTML = '';
          this.startSession(vocation, false);
        }
      });
    });
  }

  showHowToPlayModal(fromGame = false) {
    this.modalOverlayEl.classList.remove('hidden');
    this.modalOverlayEl.innerHTML = `
      <div class="guide-modal">
        <div class="modal-header">
          <h2>HOW TO PLAY LOKARTA</h2>
          <p class="subtitle">SURVIVAL & EXPLORATION GUIDE</p>
        </div>
        <div class="guide-content">
          <div class="guide-section">
            <h3>🕯️ Darkness & Dynamic Light</h3>
            <p>Subterranean floors are shrouded in pitch darkness. You only see tiles illuminated by equipped <strong>torches</strong>, ambient sconces, or class <strong>Light spells</strong>. Lurking monsters are hidden in shadows until illuminated!</p>
          </div>

          <div class="guide-section">
            <h3>🎮 Controls & Hotkeys</h3>
            <ul class="guide-list">
              <li><strong>Movement:</strong> <code>W / A / S / D</code> or <code>Arrow Keys</code> (Discrete grid steps)</li>
              <li><strong>Combat Abilities:</strong> Keys <code>[1]</code>, <code>[2]</code>, <code>[3]</code> (or click hotbar buttons)</li>
              <li><strong>Backpack Direct Triggers:</strong> Keys <code>[4]</code> through <code>[9]</code> (Drinks potions / equips torches)</li>
              <li><strong>Interact / Pick Up:</strong> Key <code>[E]</code> or <code>[Space]</code> to pick up floor items</li>
              <li><strong>Direct Floor Use:</strong> Key <code>[U]</code> to drink potion directly from floor</li>
              <li><strong>Auto-Pickup:</strong> Walk onto any floor item to instantly pick it up / stack it</li>
              <li><strong>Targeting:</strong> Click any visible enemy on canvas to lock target reticle</li>
            </ul>
          </div>

          <div class="guide-section">
            <h3>⭐ Leveling & 20 Dungeon Floors</h3>
            <p>Defeat monsters to earn <strong>XP</strong> and level up from Level 1 to 20! Leveling up restores all HP/MP and unlocks permanent <strong>Skill Boosts</strong> (+Damage %, +Max HP, +Max MP, +Range). Step on the illuminated stairs to descend deeper!</p>
          </div>
        </div>
        <div class="modal-back-action">
          <button class="action-btn" id="btn-guide-back">${fromGame ? 'Resume Game' : 'Return to Title'}</button>
        </div>
      </div>
    `;

    document.getElementById('btn-guide-back')?.addEventListener('click', () => {
      soundFX.playClick();
      if (fromGame) {
        this.modalOverlayEl.classList.add('hidden');
        this.modalOverlayEl.innerHTML = '';
      } else {
        this.showTitleScreen();
      }
    });
  }

  // ==========================================================================
  // Game Session Initialization
  // ==========================================================================

  async startSession(vocation = 'magician', isContinue = false) {
    this.clearCombatLog();
    this.logCombat('Welcome to Lokarta: Come Into The Light.', 'system');
    this.isFloorCleared = false;
    this.isGameOver = false;

    try {
      let sessionData;
      if (isContinue) {
        this.logCombat(`Restoring saved quest from IndexedDB...`, 'system');
        sessionData = await this.gameClient.bootstrap();
        if (!sessionData?.player) {
          sessionData = await this.gameClient.newGame(vocation);
        }
      } else {
        this.logCombat(`Initializing new quest as ${vocation.toUpperCase()}...`, 'system');
        sessionData = await this.gameClient.newGame(vocation);
      }

      this.player = sessionData.player;
      if (!this.player.skillBoosts) {
        this.player.skillBoosts = ProgressionSystem.computeSkillBoosts(this.player.vocation, this.player.level || 1);
      }

      const targetFloorNum = this.player.current_floor || 1;
      const floorData = sessionData.activeFloor || sessionData.floor || (await this.gameClient.getFloor(targetFloorNum));
      this.applyDungeonData(floorData);

      LightingSystem.updateLighting(this.gridMap, this.player, this.ambientLights, this.monsters);

      this.logCombat(`Entered ${this.currentFloorName} (Floor ${targetFloorNum}/20) at (${this.player.x}, ${this.player.y}).`, 'system');
      if (this.player.paperdoll?.left_hand?.item_id === 'torch' || this.player.paperdoll?.right_hand?.item_id === 'torch') {
        this.logCombat('Equipped Wooden Torch casts a warm glow (7 tiles radius).', 'spell');
      }

      this.startGameLoop();
    } catch (err) {
      console.error('Session initialization error:', err);
      this.logCombat(`Storage / Worker initialization error: ${err.message}`, 'warning');
    }
  }

  applyDungeonData(data) {
    this.currentFloorName = data.name || `Floor ${data.floor_number || 1}`;
    this.gridMap.loadFromMatrix(data.tile_matrix || data.tiles);

    if (data.spawn_coords) {
      this.player.x = data.spawn_coords.x;
      this.player.y = data.spawn_coords.y;
    }

    this.ambientLights = (data.ambient_lights || []).map(l => ({
      x: l.x,
      y: l.y,
      radius: l.radius || CONFIG.AMBIENT_LIGHT_RADIUS,
      color: l.color || '#ffaa44',
    }));

    // Populate initial floor loot
    const lootList = data.initial_loot || data.items || [];
    for (const loot of lootList) {
      this.gridMap.addItem(loot.x, loot.y, {
        item_id: loot.item_id,
        name: loot.name,
        type: loot.type,
        quantity: loot.quantity || 1,
        stat_bonus: loot.stat_bonus || 0,
      });
    }

    // Populate monsters
    const spawnList = data.spawns || data.monsters || [];
    this.monsters = spawnList.map(s => ({
      id: s.id || `m_${Math.random()}`,
      type: s.type || 'crypt_skeleton',
      name: s.name || (s.type === 'giant_rat' ? 'Giant Rat' : s.type === 'crypt_skeleton' ? 'Crypt Skeleton' : 'Shadow Cultist'),
      x: s.x,
      y: s.y,
      hp: s.hp || 30,
      max_hp: s.max_hp || s.hp || 30,
      facing: 'down',
      isAggroed: false,
      isBoss: Boolean(s.isBoss || s.id?.includes('boss')),
      moveCooldown: Math.random() * 0.5,
      moveCadence: s.moveCadence || (s.type === 'giant_rat' ? CONFIG.RAT_MOVE_CADENCE_SEC : s.type === 'crypt_skeleton' ? CONFIG.SKELETON_MOVE_CADENCE_SEC : CONFIG.CULTIST_MOVE_CADENCE_SEC),
      attackCooldown: 0,
      attackCadence: s.attackCadence || (s.type === 'giant_rat' ? CONFIG.RAT_ATTACK_CADENCE_SEC : s.type === 'crypt_skeleton' ? CONFIG.SKELETON_ATTACK_CADENCE_SEC : CONFIG.CULTIST_ATTACK_CADENCE_SEC),
      visible: false,
    }));
  }

  // ==========================================================================
  // Game Loop (10Hz Tick + 60 FPS Render)
  // ==========================================================================

  startGameLoop() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isGameOver = false;
    this.isFloorCleared = false;

    // 10 Hz fixed simulation tick
    this.tickTimer = window.setInterval(() => this.tick(), CONFIG.TICK_INTERVAL_MS);

    // 60 FPS animation loop
    this.lastAnimTime = performance.now();
    const renderFrame = (time) => {
      const dt = time - this.lastAnimTime;
      this.lastAnimTime = time;
      this.updateAnimations(dt);
      this.render();

      if (this.isRunning) {
        this.animFrameId = requestAnimationFrame(renderFrame);
      }
    };
    this.animFrameId = requestAnimationFrame(renderFrame);
    this.updateHUD();
  }

  stopGameLoop() {
    this.isRunning = false;
    if (this.tickTimer !== null) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  tick() {
    if (!this.isRunning || this.isGameOver) return;
    const deltaSec = CONFIG.TICK_INTERVAL_MS / 1000;

    // 1. Process continuous keyboard movement
    this.processMovementInput();

    // 2. Decrement cooldowns & spell timers
    CombatSystem.decrementCooldowns(this.player, deltaSec);
    CombatSystem.decrementSpellTimers(this.player, deltaSec);

    // Passive regeneration (every 5 seconds)
    const bonusRegen = this.player.skillBoosts?.bonusRegen || 0;
    this.regenAccumulator += deltaSec;
    if (this.regenAccumulator >= 5.0) {
      this.regenAccumulator -= 5.0;
      if (this.player.vocation === 'magician' && this.player.mana < this.player.max_mana) {
        const amt = 2 + bonusRegen;
        this.player.mana = Math.min(this.player.max_mana, this.player.mana + amt);
        this.addFloatingText(`+${amt} MP`, this.player.x, this.player.y, '#3b82f6');
      } else if (this.player.vocation === 'archer' && this.player.hp < this.player.max_hp) {
        const amt = 2 + bonusRegen;
        this.player.hp = Math.min(this.player.max_hp, this.player.hp + amt);
        this.addFloatingText(`+${amt} HP`, this.player.x, this.player.y, '#22c55e');
      }
    }

    // 3. Update lighting
    LightingSystem.updateLighting(this.gridMap, this.player, this.ambientLights, this.monsters);

    // 4. Update monster AI
    const aiResults = EntityAI.updateMonsters(this.monsters, this.player, this.gridMap, deltaSec);
    for (const res of aiResults) {
      if (res.message) {
        this.logCombat(res.message, 'combat');
      }
      if (res.projectiles) {
        this.projectiles.push(...res.projectiles);
      }
      if (res.damageToPlayer && res.damageToPlayer > 0) {
        soundFX.playMonsterAttack();
        soundFX.playPlayerHurt();
        this.addFloatingText(`-${res.damageToPlayer}`, this.player.x, this.player.y, '#ef4444');
      }
    }

    // 5. Check defeat
    if (this.player.hp <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      this.logCombat('You have fallen in the crypt! Darkness consumes you...', 'warning');
      this.showGameOverModal();
    }

    // 6. Check exit stairway floor clearance
    if (!this.isFloorCleared && this.gridMap.isStairs(this.player.x, this.player.y)) {
      this.handleFloorClear();
    }

    // 7. Update HUD
    this.updateHUD();
  }

  updateAnimations(dtMs) {
    // Advance projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.elapsedMs += dtMs;
      if (p.elapsedMs >= p.durationMs) {
        this.projectiles.splice(i, 1);
      }
    }

    // Advance floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.elapsedMs += dtMs;
      t.y -= (dtMs / 1000) * 20;
      if (t.elapsedMs >= t.durationMs) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render() {
    this.renderer.render(
      this.gridMap,
      this.player,
      this.monsters,
      this.ambientLights,
      this.projectiles,
      this.floatingTexts,
      this.selectedMonsterId
    );
  }

  // ==========================================================================
  // Movement & Input Handling
  // ==========================================================================

  processMovementInput() {
    let dx = 0;
    let dy = 0;
    let newFacing = this.player.facing;

    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) {
      dy -= 1;
      newFacing = 'up';
    } else if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) {
      dy += 1;
      newFacing = 'down';
    } else if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) {
      dx -= 1;
      newFacing = 'left';
    } else if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) {
      dx += 1;
      newFacing = 'right';
    }

    if (dx !== 0 || dy !== 0) {
      this.player.facing = newFacing;
      const targetX = this.player.x + dx;
      const targetY = this.player.y + dy;

      if (this.gridMap.isWalkable(targetX, targetY)) {
        const monsterAtTarget = this.monsters.find(m => m.x === targetX && m.y === targetY && m.hp > 0);
        if (monsterAtTarget) {
          this.selectedMonsterId = monsterAtTarget.id;
          this.logCombat(`Target locked on ${monsterAtTarget.name} (${monsterAtTarget.hp}/${monsterAtTarget.max_hp} HP).`, 'system');
        } else {
          this.player.x = targetX;
          this.player.y = targetY;
          soundFX.playFootstep();

          // Auto-pickup items on entered tile
          const items = this.gridMap.getItems(this.player.x, this.player.y);
          if (items.length > 0) {
            this.handlePickUp();
          }
        }
      }
    }
  }

  bindInputs() {
    window.addEventListener('keydown', e => {
      this.keysDown.add(e.code);

      // Hotkey triggers
      if (e.code === 'Digit1' || e.code === 'Numpad1') {
        e.preventDefault();
        const abilities = this.getAbilitiesForVocation(this.player);
        if (abilities[0]) this.handleTriggerAbility(abilities[0].id);
      } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
        e.preventDefault();
        const abilities = this.getAbilitiesForVocation(this.player);
        if (abilities[1]) this.handleTriggerAbility(abilities[1].id);
      } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
        e.preventDefault();
        const abilities = this.getAbilitiesForVocation(this.player);
        if (abilities[2]) this.handleTriggerAbility(abilities[2].id);
      } else if (e.code === 'Digit4' || e.code === 'Numpad4') {
        e.preventDefault();
        this.handleUseBackpackItem(0);
      } else if (e.code === 'Digit5' || e.code === 'Numpad5') {
        e.preventDefault();
        this.handleUseBackpackItem(1);
      } else if (e.code === 'Digit6' || e.code === 'Numpad6') {
        e.preventDefault();
        this.handleUseBackpackItem(2);
      } else if (e.code === 'Digit7' || e.code === 'Numpad7') {
        e.preventDefault();
        this.handleUseBackpackItem(3);
      } else if (e.code === 'Digit8' || e.code === 'Numpad8') {
        e.preventDefault();
        this.handleUseBackpackItem(4);
      } else if (e.code === 'Digit9' || e.code === 'Numpad9') {
        e.preventDefault();
        this.handleUseBackpackItem(5);
      } else if (e.code === 'KeyE' || e.code === 'Space') {
        e.preventDefault();
        this.handlePickUp();
      } else if (e.code === 'KeyU') {
        e.preventDefault();
        this.handleUseGround();
      }
    });

    window.addEventListener('keyup', e => {
      this.keysDown.delete(e.code);
    });

    // Canvas click targeting
    this.canvas.addEventListener('click', e => {
      soundFX.init();
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const gridPos = this.renderer.screenToGrid(clickX, clickY);

      const clickedMonster = this.monsters.find(
        m => m.x === gridPos.x && m.y === gridPos.y && m.visible && m.hp > 0
      );
      if (clickedMonster) {
        this.selectedMonsterId = clickedMonster.id;
        this.logCombat(`Targeted ${clickedMonster.name} (${clickedMonster.hp}/${clickedMonster.max_hp} HP).`, 'system');
      } else {
        this.selectedMonsterId = null;
      }
    });

    // Touch D-Pad buttons
    const touchBtns = document.querySelectorAll('.touch-btn');
    touchBtns.forEach(btn => {
      const key = btn.getAttribute('data-key');
      btn.addEventListener('touchstart', e => {
        e.preventDefault();
        soundFX.init();
        if (key === 'KeyE') {
          this.handlePickUp();
        } else {
          this.keysDown.add(key);
        }
      });
      btn.addEventListener('touchend', e => {
        e.preventDefault();
        if (key !== 'KeyE') {
          this.keysDown.delete(key);
        }
      });
    });
  }

  // ==========================================================================
  // Abilities & Combat Actions
  // ==========================================================================

  getAbilitiesForVocation(player) {
    if (player.vocation === 'magician') {
      return [
        {
          id: 'wand_spark',
          name: 'Wand Spark',
          hotkey: '1',
          icon: '✨',
          costText: '0 MP',
          description: '12–16 Magic Dmg to targeted enemy (LOS <= 5)',
        },
        {
          id: 'light',
          name: 'Light',
          hotkey: '2',
          icon: '💡',
          costText: '15 MP',
          description: 'Expands vision to 7 tiles for 30s (5s CD)',
        },
        {
          id: 'energy_beam',
          name: 'Energy Beam',
          hotkey: '3',
          icon: '⚡',
          costText: '30 MP',
          description: '30–40 Piercing Dmg in 4-tile line (3s CD)',
        },
      ];
    } else {
      return [
        {
          id: 'bow_shot',
          name: 'Bow Shot',
          hotkey: '1',
          icon: '🏹',
          costText: '1 Arrow',
          description: '14–18 Physical Dmg to targeted enemy (LOS <= 6)',
        },
        {
          id: 'power_shot',
          name: 'Power Shot',
          hotkey: '2',
          icon: '🎯',
          costText: '1 Arrow',
          description: '32–42 Heavy Burst Dmg (4s CD)',
        },
      ];
    }
  }

  handleTriggerAbility(abilityId) {
    if (this.isGameOver) return;
    soundFX.init();

    if (abilityId === 'wand_spark') {
      const target = this.getTargetMonster(CONFIG.MAGICIAN_SPARK_RANGE);
      if (!target) {
        this.logCombat('No visible enemy in range for Wand Spark (click enemy to target).', 'warning');
        return;
      }
      soundFX.playWandSpark();
      const res = CombatSystem.executeWandSpark(this.player, target, this.gridMap);
      this.handleCombatResult(res, target.x, target.y);
    } else if (abilityId === 'light') {
      const res = CombatSystem.executeLightSpell(this.player);
      if (res.success) {
        soundFX.playLightSpell();
        this.logCombat(res.message, 'spell');
        this.addFloatingText('Light Aura!', this.player.x, this.player.y, '#ffd700');
        LightingSystem.updateLighting(this.gridMap, this.player, this.ambientLights, this.monsters);
      } else {
        this.logCombat(res.message, 'warning');
      }
    } else if (abilityId === 'energy_beam') {
      const res = CombatSystem.executeEnergyBeam(this.player, this.player.facing, this.gridMap, this.monsters);
      if (res.success) {
        soundFX.playEnergyBeam();
        this.handleCombatResult(res, this.player.x, this.player.y);
      } else {
        this.logCombat(res.message, 'warning');
      }
    } else if (abilityId === 'bow_shot') {
      const target = this.getTargetMonster(CONFIG.ARCHER_BOW_RANGE);
      if (!target) {
        this.logCombat('No visible enemy in range for Bow Shot (click enemy to target).', 'warning');
        return;
      }
      soundFX.playBowShot();
      const res = CombatSystem.executeBowShot(this.player, target, this.gridMap);
      this.handleCombatResult(res, target.x, target.y);
    } else if (abilityId === 'power_shot') {
      const target = this.getTargetMonster(CONFIG.ARCHER_POWER_SHOT_RANGE);
      if (!target) {
        this.logCombat('No visible enemy in range for Power Shot (click enemy to target).', 'warning');
        return;
      }
      soundFX.playPowerShot();
      const res = CombatSystem.executePowerShot(this.player, target, this.gridMap);
      this.handleCombatResult(res, target.x, target.y);
    }

    this.updateHUD();
  }

  getTargetMonster(maxRange) {
    const bonusRng = this.player.skillBoosts?.bonusRange || 0;
    const effectiveRange = maxRange + bonusRng;

    // Check selected target
    if (this.selectedMonsterId) {
      const monster = this.monsters.find(m => m.id === this.selectedMonsterId && m.hp > 0);
      if (monster && monster.visible) {
        const d = Math.hypot(monster.x - this.player.x, monster.y - this.player.y);
        if (d <= effectiveRange + 0.5) return monster;
      }
    }

    // Auto-target closest visible monster within range and LOS
    let closest = null;
    let minDist = effectiveRange + 1;

    for (const m of this.monsters) {
      if (m.hp <= 0 || !m.visible) continue;
      const d = Math.hypot(m.x - this.player.x, m.y - this.player.y);
      if (d <= effectiveRange + 0.5 && d < minDist) {
        if (LightingSystem.hasLineOfSight(this.gridMap, this.player.x, this.player.y, m.x, m.y)) {
          minDist = d;
          closest = m;
        }
      }
    }

    if (closest) {
      this.selectedMonsterId = closest.id;
    }
    return closest;
  }

  handleCombatResult(res, targetX, targetY) {
    if (!res.success) {
      if (res.message) this.logCombat(res.message, 'warning');
      return;
    }

    if (res.message) {
      this.logCombat(res.message, 'combat');
    }

    if (res.damageDealt) {
      soundFX.playHit();
      this.addFloatingText(`-${res.damageDealt}`, targetX, targetY, '#ffdd44');
    }

    if (res.projectiles) {
      this.projectiles.push(...res.projectiles);
    }

    if (res.defeatedMonsterId) {
      soundFX.playMonsterDeath();
      const index = this.monsters.findIndex(m => m.id === res.defeatedMonsterId);
      if (index !== -1) {
        const deadMonster = this.monsters[index];
        if (res.droppedLoot && res.droppedLoot.length > 0) {
          for (const item of res.droppedLoot) {
            this.gridMap.addItem(deadMonster.x, deadMonster.y, item);
            this.logCombat(`${deadMonster.name} dropped ${item.name}.`, 'loot');
          }
        }

        // Calculate and award XP
        const isBoss = deadMonster.isBoss || deadMonster.id.includes('boss') || deadMonster.max_hp >= 200;
        const xpEarned = ProgressionSystem.getMonsterXp(deadMonster.type, this.player.current_floor || 1, isBoss);
        const lvlRes = ProgressionSystem.awardXP(this.player, xpEarned);

        this.logCombat(`Gained +${xpEarned} XP from defeating ${deadMonster.name}.`, 'loot');
        this.addFloatingText(`+${xpEarned} XP`, deadMonster.x, deadMonster.y, '#fbbf24');

        if (lvlRes.leveledUp) {
          soundFX.playLevelUp();
          this.logCombat(
            `⭐ LEVEL UP! You reached Level ${lvlRes.newLevel}! (+${lvlRes.hpGained} Max HP, +${lvlRes.manaGained} Max MP, +${lvlRes.damagePercentGained}% Damage)`,
            'spell'
          );
          this.addFloatingText(`⭐ LEVEL UP! [Lv. ${lvlRes.newLevel}]`, this.player.x, this.player.y, '#ffd700');
          this.persistSave();
        }

        this.monsters.splice(index, 1);
        if (this.selectedMonsterId === res.defeatedMonsterId) {
          this.selectedMonsterId = null;
        }

        // Check if Floor 20 Boss was slain
        if (isBoss && (this.player.current_floor >= 20)) {
          setTimeout(() => {
            this.handleFloorClear();
          }, 600);
        }
      }
    }
  }

  // ==========================================================================
  // Inventory & Ground Actions
  // ==========================================================================

  async handlePickUp() {
    soundFX.init();
    const res = InventorySystem.pickUpItem(this.player, this.gridMap);
    if (res.success) {
      soundFX.playItemPickup();
      this.logCombat(res.message, 'loot');
      this.addFloatingText(`+${res.item?.name}`, this.player.x, this.player.y, '#22c55e');
      this.updateHUD();
      await this.persistSave();
    } else {
      this.logCombat(res.message, 'warning');
    }
  }

  async handleDropBackpackItem(slotIndex) {
    soundFX.init();
    const res = InventorySystem.dropItem(this.player, slotIndex, this.gridMap);
    if (res.success) {
      soundFX.playUnequip();
      this.logCombat(res.message, 'system');
      this.updateHUD();
      await this.persistSave();
    } else {
      this.logCombat(res.message, 'warning');
    }
  }

  async handleUseBackpackItem(slotIndex) {
    soundFX.init();
    const res = InventorySystem.useBackpackItem(this.player, slotIndex);
    if (res.success) {
      this.logCombat(res.message, 'loot');
      if (res.item?.item_id.includes('potion')) {
        soundFX.playPotionDrink();
        this.addFloatingText(`Used ${res.item.name}!`, this.player.x, this.player.y, '#38bdf8');
      } else {
        soundFX.playEquip();
      }
      LightingSystem.updateLighting(this.gridMap, this.player, this.ambientLights, this.monsters);
      this.updateHUD();
      await this.persistSave();
    } else {
      this.logCombat(res.message, 'warning');
    }
  }

  async handleUnequip(slotName) {
    soundFX.init();
    const res = InventorySystem.unequipItem(this.player, slotName);
    if (res.success) {
      soundFX.playUnequip();
      this.logCombat(res.message, 'system');
      LightingSystem.updateLighting(this.gridMap, this.player, this.ambientLights, this.monsters);
      this.updateHUD();
      await this.persistSave();
    } else {
      this.logCombat(res.message, 'warning');
    }
  }

  async handleUseGround() {
    soundFX.init();
    const res = InventorySystem.useGroundItem(this.player, this.gridMap);
    if (res.success) {
      this.logCombat(res.message, 'loot');
      if (res.item?.item_id.includes('potion')) {
        soundFX.playPotionDrink();
        this.addFloatingText(`Used ${res.item.name}!`, this.player.x, this.player.y, '#38bdf8');
      } else {
        soundFX.playEquip();
      }
      this.updateHUD();
      await this.persistSave();
    } else {
      this.logCombat(res.message, 'warning');
    }
  }

  async persistSave() {
    try {
      await this.gameClient.saveCharacter(this.player);
    } catch (err) {
      console.warn('Auto-save error:', err);
    }
  }

  // ==========================================================================
  // Floor Clear & Transitions
  // ==========================================================================

  async handleFloorClear() {
    if (this.player.current_floor < 20) {
      const nextFloor = this.player.current_floor + 1;
      const floorBonusXp = 50 * this.player.current_floor;
      const lvlRes = ProgressionSystem.awardXP(this.player, floorBonusXp);

      soundFX.playStairs();
      this.logCombat(
        `Stepped on stairway! Descended to Floor ${nextFloor}/20 (+${floorBonusXp} Floor Clear XP)!`,
        'victory'
      );
      this.addFloatingText(`FLOOR ${nextFloor}`, this.player.x, this.player.y, '#38bdf8');

      if (lvlRes.leveledUp) {
        soundFX.playLevelUp();
        this.logCombat(
          `⭐ LEVEL UP! You reached Level ${lvlRes.newLevel}! (+${lvlRes.hpGained} Max HP, +${lvlRes.manaGained} Max MP)`,
          'spell'
        );
      }

      try {
        const transition = await this.gameClient.advanceFloor(this.player, nextFloor);
        this.player = transition.player;
        this.applyDungeonData(transition.floor);
        this.isFloorCleared = false;
        LightingSystem.updateLighting(this.gridMap, this.player, this.ambientLights, this.monsters);
        this.updateHUD();
        await this.persistSave();
      } catch (err) {
        console.error('Floor transition error:', err);
      }
    } else {
      // Floor 20 Final Clear!
      this.isFloorCleared = true;
      soundFX.playVictory();
      this.logCombat('🎉 YOU CONQUERED THE ABYSSAL SANCTUM! ALL 20 FLOORS CLEARED!', 'victory');
      this.addFloatingText('CAMPAIGN COMPLETED!', this.player.x, this.player.y, '#ffd700');

      this.showVictoryModal();
    }
  }

  addFloatingText(text, gridX, gridY, color) {
    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      text,
      x: gridX * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
      y: gridY * CONFIG.GRID_SIZE,
      color,
      durationMs: 1200,
      elapsedMs: 0,
    });
  }

  // ==========================================================================
  // HUD UI Rendering
  // ==========================================================================

  updateHUD() {
    this.renderStatusBars();
    this.renderPaperdoll();
    this.renderBackpack();
    this.renderHotbar();
  }

  renderStatusBars() {
    if (!this.statusBarsEl) return;
    const hpPercent = Math.max(0, Math.min(100, (this.player.hp / this.player.max_hp) * 100));
    const mpPercent = Math.max(0, Math.min(100, (this.player.mana / this.player.max_mana) * 100));
    const xpPercent = this.player.level >= 20 ? 100 : Math.max(0, Math.min(100, (this.player.xp / (this.player.xpToNextLevel || 100)) * 100));
    const vocationDisplay = (this.player.vocation || 'magician').charAt(0).toUpperCase() + (this.player.vocation || 'magician').slice(1);
    const dmgBonusPct = Math.round(((this.player.skillBoosts?.damageMultiplier || 1.0) - 1.0) * 100);

    this.statusBarsEl.innerHTML = `
      <div class="panel-header">HERO STATUS & DUNGEON PROGRESS</div>
      <div class="status-panel-inner">
        <div class="status-header">
          <div class="vocation-tag"><span class="level-badge">Lv. ${this.player.level || 1}</span> <strong class="val">${vocationDisplay}</strong></div>
          <div class="floor-tag"><span class="label">Floor:</span> <strong class="val">${this.player.current_floor || 1}/20 (${this.currentFloorName})</strong></div>
        </div>

        <div class="meter-container hp-meter">
          <div class="meter-info">
            <span class="meter-label">HEALTH (HP)</span>
            <span class="meter-values">${this.player.hp} / ${this.player.max_hp}</span>
          </div>
          <div class="meter-bar-track">
            <div class="meter-bar-fill hp-fill" style="width: ${hpPercent}%;"></div>
          </div>
        </div>

        <div class="meter-container mp-meter">
          <div class="meter-info">
            <span class="meter-label">MANA (MP)</span>
            <span class="meter-values">${this.player.mana} / ${this.player.max_mana}</span>
          </div>
          <div class="meter-bar-track">
            <div class="meter-bar-fill mp-fill" style="width: ${mpPercent}%;"></div>
          </div>
        </div>

        <div class="meter-container xp-meter">
          <div class="meter-info">
            <span class="meter-label">EXP (XP)</span>
            <span class="meter-values">${this.player.level >= 20 ? 'MAX LEVEL' : `${this.player.xp || 0} / ${this.player.xpToNextLevel || 100}`}</span>
          </div>
          <div class="meter-bar-track">
            <div class="meter-bar-fill xp-fill" style="width: ${xpPercent}%;"></div>
          </div>
        </div>

        ${
          dmgBonusPct > 0 || this.player.skillBoosts?.bonusRange || this.player.skillBoosts?.bonusRegen
            ? `<div class="skill-boosts-summary">
                <span>⚡ +${dmgBonusPct}% Damage</span>
                ${this.player.skillBoosts?.bonusRange ? `<span>🏹 +${this.player.skillBoosts.bonusRange} Range</span>` : ''}
                ${this.player.skillBoosts?.bonusRegen ? `<span>❤️ +${this.player.skillBoosts.bonusRegen} Regen</span>` : ''}
              </div>`
            : ''
        }

        ${
          this.player.lightSpellTimer > 0
            ? `<div class="active-buff-badge">
                <span class="buff-icon">✨</span>
                <span class="buff-text">Light Aura: <strong>${Math.ceil(this.player.lightSpellTimer)}s</strong> (6 tiles)</span>
              </div>`
            : ''
        }
      </div>
    `;
  }

  renderPaperdoll() {
    if (!this.paperdollEl) return;
    const paperdoll = this.player.paperdoll || {};
    const slots = [
      { key: 'right_hand', label: 'Right Hand', iconPlaceholder: '⚔️' },
      { key: 'armor', label: 'Armor', iconPlaceholder: '🛡️' },
      { key: 'left_hand', label: 'Left Hand', iconPlaceholder: '🕯️' },
    ];

    let html = `
      <div class="panel-header">EQUIPMENT (PAPERDOLL)</div>
      <div class="paperdoll-slots-grid">
    `;

    for (const slot of slots) {
      const item = paperdoll[slot.key];
      const hasItem = Boolean(item);
      const itemName = hasItem ? item.name : 'Empty';
      const statBonus = hasItem && item.stat_bonus > 0 ? ` (+${item.stat_bonus})` : '';

      html += `
        <div class="paperdoll-slot ${hasItem ? 'occupied' : 'empty'}" data-slot="${slot.key}" title="${slot.label}: ${itemName}${statBonus}">
          <div class="slot-label">${slot.key.replace('_', ' ').toUpperCase()}</div>
          <div class="slot-content">
            ${hasItem ? this.renderItemIcon(item) : `<span class="empty-icon">${slot.iconPlaceholder}</span>`}
          </div>
          <div class="slot-item-name">${itemName}</div>
          ${hasItem ? `<button class="unequip-btn" data-slot="${slot.key}" title="Unequip to backpack">✕</button>` : ''}
        </div>
      `;
    }

    html += `</div>`;
    this.paperdollEl.innerHTML = html;

    const unequipButtons = this.paperdollEl.querySelectorAll('.unequip-btn');
    unequipButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const slotKey = e.currentTarget.getAttribute('data-slot');
        if (slotKey) this.handleUnequip(slotKey);
      });
    });
  }

  renderBackpack() {
    if (!this.backpackEl) return;
    const backpack = this.player.backpack || [null, null, null, null, null, null];
    const occupiedCount = backpack.filter(Boolean).length;

    let html = `
      <div class="panel-header">
        <span>BACKPACK (6 SLOTS)</span>
        <span class="slot-count">${occupiedCount}/6</span>
      </div>
      <div class="backpack-slots-grid">
    `;

    for (let i = 0; i < 6; i++) {
      const item = backpack[i] || null;
      const isOccupied = item !== null;
      const hotkey = i + 4;
      const tooltip = isOccupied
        ? `${item.name} (${item.type})${item.quantity > 1 ? ` x${item.quantity}` : ''}${item.stat_bonus > 0 ? ` [Stat: +${item.stat_bonus}]` : ''} [${hotkey}]`
        : `Slot [${hotkey}] (Empty)`;

      html += `
        <div class="backpack-slot ${isOccupied ? 'occupied' : 'empty'}" data-index="${i}" title="${tooltip}">
          <div class="slot-num"><span class="slot-hotkey">[${hotkey}]</span></div>
          <div class="slot-content">
            ${isOccupied ? this.renderItemIcon(item) : ''}
          </div>
          ${isOccupied && item.quantity > 1 ? `<div class="item-qty">x${item.quantity}</div>` : ''}
          <div class="slot-item-name">${isOccupied ? item.name : 'Empty'}</div>
          ${
            isOccupied
              ? `<div class="slot-actions">
                  <button class="use-btn" data-index="${i}" title="Use / Equip">Use</button>
                  <button class="drop-btn" data-index="${i}" title="Drop to ground">Drop</button>
                </div>`
              : ''
          }
        </div>
      `;
    }

    html += `</div>`;
    this.backpackEl.innerHTML = html;

    const useBtns = this.backpackEl.querySelectorAll('.use-btn');
    useBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(e.currentTarget.getAttribute('data-index') || '-1', 10);
        if (idx >= 0) this.handleUseBackpackItem(idx);
      });
    });

    const dropBtns = this.backpackEl.querySelectorAll('.drop-btn');
    dropBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(e.currentTarget.getAttribute('data-index') || '-1', 10);
        if (idx >= 0) this.handleDropBackpackItem(idx);
      });
    });

    const slots = this.backpackEl.querySelectorAll('.backpack-slot.occupied');
    slots.forEach(slot => {
      slot.addEventListener('click', e => {
        if (e.target.classList.contains('drop-btn')) return;
        const idx = parseInt(e.currentTarget.getAttribute('data-index') || '-1', 10);
        if (idx >= 0) this.handleUseBackpackItem(idx);
      });
    });
  }

  renderHotbar() {
    if (!this.hotbarEl) return;
    const abilities = this.getAbilitiesForVocation(this.player);
    const groundItems = this.gridMap.getItems(this.player.x, this.player.y);

    let html = `
      <div class="panel-header">ACTIONS & ABILITY HOTBAR</div>
      <div class="hotbar-buttons-container">
        <div class="ability-buttons-group">
    `;

    for (const ability of abilities) {
      const cd = this.player.cooldowns?.[ability.id] || 0;
      const isOnCooldown = cd > 0;

      html += `
        <button class="hotbar-btn ability-btn ${isOnCooldown ? 'on-cooldown' : ''}" data-ability="${ability.id}" title="${ability.name} [${ability.hotkey}]: ${ability.description} (${ability.costText})">
          <div class="hotkey-badge">[${ability.hotkey}]</div>
          <div class="btn-icon">${ability.icon}</div>
          <div class="btn-name">${ability.name}</div>
          <div class="btn-cost">${ability.costText}</div>
          ${isOnCooldown ? `<div class="cooldown-overlay">${cd.toFixed(1)}s</div>` : ''}
        </button>
      `;
    }

    html += `
        </div>
        <div class="ground-actions-group">
          <button class="hotbar-btn ground-btn" id="btn-pickup" title="Pick up top item from floor [E] / [Space]">
            <div class="hotkey-badge">[E]</div>
            <div class="btn-icon">📥</div>
            <div class="btn-name">Pick Up</div>
            <div class="btn-cost">${groundItems.length > 0 ? `${groundItems.length} on floor` : 'Empty'}</div>
          </button>
          <button class="hotbar-btn ground-btn" id="btn-use-ground" title="Directly drink potion from current floor tile [U]">
            <div class="hotkey-badge">[U]</div>
            <div class="btn-icon">🧪</div>
            <div class="btn-name">Use Floor</div>
            <div class="btn-cost">Potion</div>
          </button>
        </div>
      </div>
    `;

    this.hotbarEl.innerHTML = html;

    const abilityBtns = this.hotbarEl.querySelectorAll('.ability-btn');
    abilityBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        const abilityId = e.currentTarget.getAttribute('data-ability');
        if (abilityId) this.handleTriggerAbility(abilityId);
      });
    });

    document.getElementById('btn-pickup')?.addEventListener('click', () => this.handlePickUp());
    document.getElementById('btn-use-ground')?.addEventListener('click', () => this.handleUseGround());
  }

  renderItemIcon(item) {
    if (item.item_id === 'health_potion') return '🧪';
    if (item.item_id === 'mana_potion') return '⚗️';
    if (item.item_id === 'torch') return '🔥';
    if (item.item_id === 'arrows') return '🏹';
    if (item.item_id.includes('wand')) return '🪄';
    if (item.item_id.includes('robe')) return '🥋';
    if (item.item_id.includes('armor')) return '🦺';
    if (item.item_id.includes('bow')) return '🏹';
    return '📦';
  }

  // ==========================================================================
  // Combat & Event Log UI
  // ==========================================================================

  logCombat(message, category = 'system') {
    if (!this.combatLogScrollEl) return;
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];

    const line = document.createElement('div');
    line.className = `log-line log-${category}`;
    line.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-msg">${this.escapeHtml(message)}</span>`;

    this.combatLogScrollEl.appendChild(line);
    this.combatLogScrollEl.scrollTop = this.combatLogScrollEl.scrollHeight;
  }

  clearCombatLog() {
    if (this.combatLogScrollEl) {
      this.combatLogScrollEl.innerHTML = '';
    }
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ==========================================================================
  // Victory & Defeat Modals
  // ==========================================================================

  showVictoryModal() {
    this.modalOverlayEl.classList.remove('hidden');
    this.modalOverlayEl.innerHTML = `
      <div class="result-modal victory-modal">
        <h2>🏆 ULTIMATE VICTORY!</h2>
        <p class="result-subtitle">Lokarta Subterranean Campaign - All 20 Floors Cleared</p>
        <p>You have illuminated the darkest depths of the subterranean abyss and vanquished the Void Core!</p>
        <div class="character-summary">
          <p><strong>Vocation:</strong> ${(this.player.vocation || 'magician').toUpperCase()}</p>
          <p><strong>Final Level:</strong> Level ${this.player.level || 1}</p>
          <p><strong>Damage Boost:</strong> +${Math.round(((this.player.skillBoosts?.damageMultiplier || 1) - 1) * 100)}%</p>
          <p><strong>Remaining HP:</strong> ${this.player.hp} / ${this.player.max_hp}</p>
          <p><strong>Remaining MP:</strong> ${this.player.mana} / ${this.player.max_mana}</p>
          <p><strong>Backpack Items:</strong> ${(this.player.backpack || []).filter(Boolean).length} / 6 slots</p>
        </div>
        <button class="action-btn" id="btn-restart">Play Again</button>
      </div>
    `;

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      soundFX.playClick();
      this.modalOverlayEl.classList.add('hidden');
      this.modalOverlayEl.innerHTML = '';
      window.location.reload();
    });
  }

  showGameOverModal() {
    soundFX.playDefeat();
    this.modalOverlayEl.classList.remove('hidden');
    this.modalOverlayEl.innerHTML = `
      <div class="result-modal defeat-modal">
        <h2>💀 YOU HAVE PERISHED</h2>
        <p class="result-subtitle">Floor ${this.player.current_floor || 1}/20 Claims Another Soul</p>
        <p>Your light has been extinguished in the subterranean shadows.</p>
        <button class="action-btn" id="btn-retry">Try Again</button>
      </div>
    `;

    document.getElementById('btn-retry')?.addEventListener('click', () => {
      soundFX.playClick();
      this.modalOverlayEl.classList.add('hidden');
      this.modalOverlayEl.innerHTML = '';
      window.location.reload();
    });
  }
}

// Auto-bootstrap app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.lokarta = new LokartaApp();
});
