import { TileType } from '../types/world';
import { PlayerEntity, MonsterEntity, Direction } from '../types/entity';
import { Item } from '../types/item';
import { CONFIG } from '../config';

export class SpriteManager {
  public static drawTile(
    ctx: CanvasRenderingContext2D,
    type: TileType,
    screenX: number,
    screenY: number,
    size = CONFIG.GRID_SIZE
  ): void {
    if (type === TileType.WALL) {
      // Upright stone wall
      ctx.fillStyle = '#2a2f3b';
      ctx.fillRect(screenX, screenY, size, size);

      // Top highlight
      ctx.fillStyle = '#444d61';
      ctx.fillRect(screenX, screenY, size, 4);

      // Brick line accents
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

      // Border outline
      ctx.strokeStyle = '#0d0f14';
      ctx.strokeRect(screenX + 0.5, screenY + 0.5, size - 1, size - 1);
    } else if (type === TileType.STAIRS) {
      // Exit stairs with radiant glow
      ctx.fillStyle = '#152b3c';
      ctx.fillRect(screenX, screenY, size, size);

      // Stair step tiers
      for (let i = 0; i < 4; i++) {
        const inset = i * 3;
        ctx.fillStyle = i % 2 === 0 ? '#3878a8' : '#254e70';
        ctx.fillRect(screenX + inset, screenY + inset, size - inset * 2, size - inset * 2);
      }

      // Exit rune portal center
      ctx.fillStyle = '#88eeff';
      ctx.beginPath();
      ctx.arc(screenX + size / 2, screenY + size / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Golden frame
      ctx.strokeStyle = '#66ccff';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX + 2, screenY + 2, size - 4, size - 4);
    } else {
      // Walkable flagstone floor
      ctx.fillStyle = '#1a1c23';
      ctx.fillRect(screenX, screenY, size, size);

      // Flagstone grid texture
      ctx.strokeStyle = '#12141a';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX, screenY, size, size);

      // Subdued stone speckle
      ctx.fillStyle = '#222530';
      ctx.fillRect(screenX + 4, screenY + 4, 6, 6);
      ctx.fillRect(screenX + size - 10, screenY + size - 10, 6, 6);
    }
  }

  public static drawItem(
    ctx: CanvasRenderingContext2D,
    item: Item,
    screenX: number,
    screenY: number,
    size = CONFIG.GRID_SIZE
  ): void {
    const cx = screenX + size / 2;
    const cy = screenY + size / 2;

    if (item.item_id === 'health_potion') {
      // Red potion bottle
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f1faee';
      ctx.fillRect(cx - 3, cy - 8, 6, 4); // neck
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(cx - 4, cy - 10, 8, 3); // cork
    } else if (item.item_id === 'mana_potion') {
      // Blue potion bottle
      ctx.fillStyle = '#3a86ff';
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f1faee';
      ctx.fillRect(cx - 3, cy - 8, 6, 4);
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(cx - 4, cy - 10, 8, 3);
    } else if (item.item_id === 'torch') {
      // Wooden torch with burning flame
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(cx - 3, cy - 4, 6, 14);

      // Flame
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.arc(cx, cy - 5, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.item_id === 'arrows') {
      // Bundle of arrows
      ctx.strokeStyle = '#d4a373';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + 6);
      ctx.lineTo(cx + 6, cy - 6);
      ctx.moveTo(cx - 4, cy + 8);
      ctx.lineTo(cx + 8, cy - 4);
      ctx.stroke();

      // Feather fletching
      ctx.fillStyle = '#e9d8a6';
      ctx.fillRect(cx - 8, cy + 5, 4, 4);
    } else if (item.type === 'weapon') {
      // Wand or Bow
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
        // Wand
        ctx.strokeStyle = '#a370f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy + 6);
        ctx.lineTo(cx + 6, cy - 6);
        ctx.stroke();

        // Glowing crystal tip
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(cx + 6, cy - 6, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Generic item fallback
      ctx.fillStyle = '#e0a96d';
      ctx.fillRect(cx - 5, cy - 5, 10, 10);
    }

    // Stack quantity badge if > 1
    if (item.quantity > 1) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX + size - 14, screenY + size - 12, 14, 12);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${item.quantity}`, screenX + size - 2, screenY + size - 3);
    }
  }

  public static drawPlayer(
    ctx: CanvasRenderingContext2D,
    player: PlayerEntity,
    screenX: number,
    screenY: number,
    size = CONFIG.GRID_SIZE
  ): void {
    const cx = screenX + size / 2;
    const cy = screenY + size / 2;

    // Outer shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size / 3, size / 3, size / 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (player.vocation === 'magician') {
      // Magician Robe (Purple/Violet)
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

      // Head / Hood
      ctx.fillStyle = '#7a3cb8';
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 6, 0, Math.PI * 2);
      ctx.fill();

      // Face opening & eyes
      ctx.fillStyle = '#ffdbac';
      SpriteManager.drawFacingEyes(ctx, cx, cy - 6, player.facing, '#44ccff');

      // Wand in hand
      const wandOffset = SpriteManager.getFacingOffset(player.facing);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + wandOffset.x * 6, cy + wandOffset.y * 6);
      ctx.lineTo(cx + wandOffset.x * 12, cy + wandOffset.y * 12);
      ctx.stroke();

      // Glowing wand tip
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(cx + wandOffset.x * 12, cy + wandOffset.y * 12, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Archer Tunic (Green/Leather)
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

      // Head / Cap
      ctx.fillStyle = '#40916c';
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 6, 0, Math.PI * 2);
      ctx.fill();

      // Feather on cap
      ctx.fillStyle = '#e63946';
      ctx.fillRect(cx - 2, cy - 12, 3, 5);

      // Face & eyes
      ctx.fillStyle = '#ffdbac';
      SpriteManager.drawFacingEyes(ctx, cx, cy - 6, player.facing, '#2b2b2b');

      // Bow in hand
      const bowOffset = SpriteManager.getFacingOffset(player.facing);
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx + bowOffset.x * 8, cy + bowOffset.y * 8, 6, 0, Math.PI);
      ctx.stroke();
    }
  }

  public static drawMonster(
    ctx: CanvasRenderingContext2D,
    monster: MonsterEntity,
    screenX: number,
    screenY: number,
    size = CONFIG.GRID_SIZE
  ): void {
    const cx = screenX + size / 2;
    const cy = screenY + size / 2;

    // Monster shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size / 3, size / 3, size / 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (monster.type === 'crypt_skeleton') {
      // Bone ribcage & limbs
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

      // Glowing red aggro eyes
      const eyeColor = monster.isAggroed ? '#ff2222' : '#555555';
      SpriteManager.drawFacingEyes(ctx, cx, cy - 6, monster.facing, eyeColor);

      // Rusted blade
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy + 8);
      ctx.lineTo(cx + 12, cy - 2);
      ctx.stroke();
    } else {
      // Shadow Cultist (Dark hooded robe)
      ctx.fillStyle = '#1c1124';
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 12);
      ctx.lineTo(cx + 8, cy + 12);
      ctx.lineTo(cx + 6, cy - 4);
      ctx.lineTo(cx - 6, cy - 4);
      ctx.closePath();
      ctx.fill();

      // Deep hood
      ctx.fillStyle = '#2b1b38';
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 7, 0, Math.PI * 2);
      ctx.fill();

      // Dark face void
      ctx.fillStyle = '#0a050f';
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 4, 0, Math.PI * 2);
      ctx.fill();

      // Glowing purple eyes
      const eyeColor = monster.isAggroed ? '#bf40bf' : '#3d1c5a';
      SpriteManager.drawFacingEyes(ctx, cx, cy - 6, monster.facing, eyeColor);

      // Shadow orb in hands
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Health Bar above monster
    const barWidth = size - 8;
    const barHeight = 3;
    const hpRatio = Math.max(0, monster.hp / monster.max_hp);

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(screenX + 4, screenY - 6, barWidth, barHeight);

    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(screenX + 4, screenY - 6, barWidth * hpRatio, barHeight);
  }

  private static getFacingOffset(facing: Direction): { x: number; y: number } {
    switch (facing) {
      case 'left': return { x: -1, y: 0 };
      case 'right': return { x: 1, y: 0 };
      case 'up': return { x: 0, y: -1 };
      case 'down': default: return { x: 0, y: 1 };
    }
  }

  private static drawFacingEyes(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    facing: Direction,
    color: string
  ): void {
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
