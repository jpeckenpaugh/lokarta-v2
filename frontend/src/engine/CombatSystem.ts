import { GridMap } from './GridMap';
import { LightingSystem } from './LightingSystem';
import { PlayerEntity, MonsterEntity, Projectile, Coordinates, Direction } from '../types/entity';
import { Item } from '../types/item';
import { CONFIG } from '../config';

export interface CombatResult {
  success: boolean;
  message?: string;
  damageDealt?: number;
  projectiles?: Projectile[];
  defeatedMonsterId?: string;
  droppedLoot?: Item[];
}

export class CombatSystem {
  public static decrementCooldowns(player: PlayerEntity, deltaSec: number): void {
    for (const key of Object.keys(player.cooldowns)) {
      if (player.cooldowns[key] > 0) {
        player.cooldowns[key] = Math.max(0, player.cooldowns[key] - deltaSec);
      }
    }
  }

  public static decrementSpellTimers(player: PlayerEntity, deltaSec: number): void {
    if (player.lightSpellTimer > 0) {
      player.lightSpellTimer = Math.max(0, player.lightSpellTimer - deltaSec);
    }
  }

  private static randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  public static findArrowItem(player: PlayerEntity): { inBackpack: boolean; index: number; item: Item } | null {
    // Check backpack
    for (let i = 0; i < player.backpack.length; i++) {
      const item = player.backpack[i];
      if (item && item.item_id === 'arrows' && item.quantity > 0) {
        return { inBackpack: true, index: i, item };
      }
    }
    return null;
  }

  public static consumeArrow(player: PlayerEntity): boolean {
    const arrowSlot = CombatSystem.findArrowItem(player);
    if (!arrowSlot) return false;

    arrowSlot.item.quantity -= 1;
    if (arrowSlot.item.quantity <= 0) {
      player.backpack[arrowSlot.index] = null;
    }
    return true;
  }

  public static executeWandSpark(
    player: PlayerEntity,
    target: MonsterEntity,
    gridMap: GridMap
  ): CombatResult {
    if (player.cooldowns['wand_spark'] > 0) {
      return { success: false, message: 'Wand Spark is on cooldown.' };
    }

    const mult = player.skillBoosts?.damageMultiplier || 1.0;
    const bonusRng = player.skillBoosts?.bonusRange || 0;

    const dist = Math.hypot(target.x - player.x, target.y - player.y);
    if (dist > (CONFIG.MAGICIAN_SPARK_RANGE + bonusRng) + 0.5) {
      return { success: false, message: 'Target is out of range for Wand Spark.' };
    }

    if (!LightingSystem.hasLineOfSight(gridMap, player.x, player.y, target.x, target.y)) {
      return { success: false, message: 'Line of sight to target is blocked.' };
    }

    player.cooldowns['wand_spark'] = CONFIG.MAGICIAN_SPARK_COOLDOWN_SEC;
    const baseDmg = CombatSystem.randomBetween(CONFIG.MAGICIAN_SPARK_DAMAGE_MIN, CONFIG.MAGICIAN_SPARK_DAMAGE_MAX);
    const damage = Math.round(baseDmg * mult);
    target.hp -= damage;

    const projectile: Projectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      type: 'wand_spark',
      sourceX: player.x,
      sourceY: player.y,
      targetX: target.x,
      targetY: target.y,
      currentX: player.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
      currentY: player.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
      durationMs: 250,
      elapsedMs: 0,
      color: '#44ccff',
    };

    let defeatedMonsterId: string | undefined;
    let droppedLoot: Item[] | undefined;
    let message = `You hit ${target.name} with Wand Spark for ${damage} magic damage.`;

    if (target.hp <= 0) {
      defeatedMonsterId = target.id;
      droppedLoot = CombatSystem.generateMonsterLoot(target);
      message += ` ${target.name} was slain!`;
    }

    return {
      success: true,
      message,
      damageDealt: damage,
      projectiles: [projectile],
      defeatedMonsterId,
      droppedLoot,
    };
  }

  public static executeLightSpell(player: PlayerEntity): CombatResult {
    if (player.cooldowns['light'] > 0) {
      return { success: false, message: 'Light spell is on cooldown.' };
    }

    if (player.mana < CONFIG.MAGICIAN_LIGHT_MANA_COST) {
      return { success: false, message: 'Not enough Mana to cast Light.' };
    }

    player.mana -= CONFIG.MAGICIAN_LIGHT_MANA_COST;
    player.cooldowns['light'] = CONFIG.MAGICIAN_LIGHT_COOLDOWN_SEC;
    player.lightSpellTimer = CONFIG.LIGHT_SPELL_DURATION_SEC;

    return {
      success: true,
      message: 'You cast Light! The darkness recedes (7 tiles radius for 30s).',
    };
  }

  public static executeEnergyBeam(
    player: PlayerEntity,
    facing: Direction,
    gridMap: GridMap,
    monsters: MonsterEntity[]
  ): CombatResult {
    if (player.cooldowns['energy_beam'] > 0) {
      return { success: false, message: 'Energy Beam is on cooldown.' };
    }

    if (player.mana < CONFIG.MAGICIAN_BEAM_MANA_COST) {
      return { success: false, message: 'Not enough Mana to cast Energy Beam.' };
    }

    player.mana -= CONFIG.MAGICIAN_BEAM_MANA_COST;
    player.cooldowns['energy_beam'] = CONFIG.MAGICIAN_BEAM_COOLDOWN_SEC;

    const mult = player.skillBoosts?.damageMultiplier || 1.0;
    const bonusRng = player.skillBoosts?.bonusRange || 0;
    const beamRange = CONFIG.MAGICIAN_BEAM_RANGE + bonusRng;

    const dx = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;
    const dy = facing === 'up' ? -1 : facing === 'down' ? 1 : 0;

    const beamTiles: Coordinates[] = [];
    let currX = player.x;
    let currY = player.y;

    for (let i = 1; i <= beamRange; i++) {
      currX += dx;
      currY += dy;
      if (!gridMap.isInBounds(currX, currY)) break;
      beamTiles.push({ x: currX, y: currY });
      if (gridMap.isWall(currX, currY)) {
        break; // Beam stops at wall
      }
    }

    let totalDamage = 0;
    let hits = 0;
    const defeatedIds: string[] = [];
    const allLoot: Item[] = [];

    for (const monster of monsters) {
      const hit = beamTiles.some(t => t.x === monster.x && t.y === monster.y);
      if (hit) {
        const baseDmg = CombatSystem.randomBetween(CONFIG.MAGICIAN_BEAM_DAMAGE_MIN, CONFIG.MAGICIAN_BEAM_DAMAGE_MAX);
        const damage = Math.round(baseDmg * mult);
        monster.hp -= damage;
        totalDamage += damage;
        hits++;

        if (monster.hp <= 0) {
          defeatedIds.push(monster.id);
          const loot = CombatSystem.generateMonsterLoot(monster);
          allLoot.push(...loot);
        }
      }
    }

    const projectile: Projectile = {
      id: `proj_beam_${Date.now()}`,
      type: 'energy_beam',
      sourceX: player.x,
      sourceY: player.y,
      targetX: currX,
      targetY: currY,
      currentX: player.x * CONFIG.GRID_SIZE,
      currentY: player.y * CONFIG.GRID_SIZE,
      durationMs: 400,
      elapsedMs: 0,
      color: '#ff00aa',
      direction: facing,
      piercingTiles: beamTiles,
    };

    let msg = `You unleashed Energy Beam!`;
    if (hits > 0) {
      msg += ` Pierced ${hits} enemy(s) for ${totalDamage} total damage.`;
    }

    return {
      success: true,
      message: msg,
      damageDealt: totalDamage,
      projectiles: [projectile],
      defeatedMonsterId: defeatedIds[0], // primary
      droppedLoot: allLoot,
    };
  }

  public static executeBowShot(
    player: PlayerEntity,
    target: MonsterEntity,
    gridMap: GridMap
  ): CombatResult {
    if (player.cooldowns['bow_shot'] > 0) {
      return { success: false, message: 'Bow Shot is on cooldown.' };
    }

    const mult = player.skillBoosts?.damageMultiplier || 1.0;
    const bonusRng = player.skillBoosts?.bonusRange || 0;

    const dist = Math.hypot(target.x - player.x, target.y - player.y);
    if (dist > (CONFIG.ARCHER_BOW_RANGE + bonusRng) + 0.5) {
      return { success: false, message: 'Target is out of range for Bow Shot.' };
    }

    if (!LightingSystem.hasLineOfSight(gridMap, player.x, player.y, target.x, target.y)) {
      return { success: false, message: 'Line of sight to target is blocked.' };
    }

    if (!CombatSystem.consumeArrow(player)) {
      return { success: false, message: 'Out of arrows! Cannot fire bow.' };
    }

    player.cooldowns['bow_shot'] = CONFIG.ARCHER_BOW_COOLDOWN_SEC;
    const baseDmg = CombatSystem.randomBetween(CONFIG.ARCHER_BOW_DAMAGE_MIN, CONFIG.ARCHER_BOW_DAMAGE_MAX);
    const damage = Math.round(baseDmg * mult);
    target.hp -= damage;

    const projectile: Projectile = {
      id: `proj_arrow_${Date.now()}_${Math.random()}`,
      type: 'bow_shot',
      sourceX: player.x,
      sourceY: player.y,
      targetX: target.x,
      targetY: target.y,
      currentX: player.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
      currentY: player.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
      durationMs: 200,
      elapsedMs: 0,
      color: '#ddaa44',
    };

    let defeatedMonsterId: string | undefined;
    let droppedLoot: Item[] | undefined;
    let message = `You fired an arrow at ${target.name} for ${damage} damage.`;

    if (target.hp <= 0) {
      defeatedMonsterId = target.id;
      droppedLoot = CombatSystem.generateMonsterLoot(target);
      message += ` ${target.name} was slain!`;
    }

    return {
      success: true,
      message,
      damageDealt: damage,
      projectiles: [projectile],
      defeatedMonsterId,
      droppedLoot,
    };
  }

  public static executePowerShot(
    player: PlayerEntity,
    target: MonsterEntity,
    gridMap: GridMap
  ): CombatResult {
    if (player.cooldowns['power_shot'] > 0) {
      return { success: false, message: 'Power Shot is on cooldown.' };
    }

    const mult = player.skillBoosts?.damageMultiplier || 1.0;
    const bonusRng = player.skillBoosts?.bonusRange || 0;

    const dist = Math.hypot(target.x - player.x, target.y - player.y);
    if (dist > (CONFIG.ARCHER_POWER_SHOT_RANGE + bonusRng) + 0.5) {
      return { success: false, message: 'Target is out of range for Power Shot.' };
    }

    if (!LightingSystem.hasLineOfSight(gridMap, player.x, player.y, target.x, target.y)) {
      return { success: false, message: 'Line of sight to target is blocked.' };
    }

    if (!CombatSystem.consumeArrow(player)) {
      return { success: false, message: 'Out of arrows! Cannot fire Power Shot.' };
    }

    player.cooldowns['power_shot'] = CONFIG.ARCHER_POWER_SHOT_COOLDOWN_SEC;
    const baseDmg = CombatSystem.randomBetween(CONFIG.ARCHER_POWER_SHOT_DAMAGE_MIN, CONFIG.ARCHER_POWER_SHOT_DAMAGE_MAX);
    const damage = Math.round(baseDmg * mult);
    target.hp -= damage;

    const projectile: Projectile = {
      id: `proj_power_${Date.now()}_${Math.random()}`,
      type: 'power_shot',
      sourceX: player.x,
      sourceY: player.y,
      targetX: target.x,
      targetY: target.y,
      currentX: player.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
      currentY: player.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
      durationMs: 250,
      elapsedMs: 0,
      color: '#ff8800',
    };

    let defeatedMonsterId: string | undefined;
    let droppedLoot: Item[] | undefined;
    let message = `Power Shot strikes ${target.name} with heavy force for ${damage} damage!`;

    if (target.hp <= 0) {
      defeatedMonsterId = target.id;
      droppedLoot = CombatSystem.generateMonsterLoot(target);
      message += ` ${target.name} was slain!`;
    }

    return {
      success: true,
      message,
      damageDealt: damage,
      projectiles: [projectile],
      defeatedMonsterId,
      droppedLoot,
    };
  }

  public static generateMonsterLoot(monster: MonsterEntity): Item[] {
    const loot: Item[] = [];
    if (monster.type === 'crypt_skeleton') {
      const roll = Math.random();
      if (roll < 0.5) {
        loot.push({
          item_id: 'health_potion',
          name: 'Health Potion',
          type: 'consumable',
          quantity: 1,
          stat_bonus: CONFIG.HEALTH_POTION_HEAL,
        });
      } else {
        loot.push({
          item_id: 'arrows',
          name: 'Arrows',
          type: 'ammo',
          quantity: 10,
          stat_bonus: 0,
        });
      }
    } else if (monster.type === 'shadow_cultist') {
      const roll = Math.random();
      if (roll < 0.6) {
        loot.push({
          item_id: 'mana_potion',
          name: 'Mana Potion',
          type: 'consumable',
          quantity: 1,
          stat_bonus: CONFIG.MANA_POTION_RESTORE,
        });
      } else {
        loot.push({
          item_id: 'torch',
          name: 'Wooden Torch',
          type: 'offhand',
          quantity: 1,
          stat_bonus: CONFIG.TORCH_LIGHT_RADIUS,
        });
      }
    }
    return loot;
  }
}
