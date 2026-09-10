import { GridMap } from './GridMap';
import { LightingSystem } from './LightingSystem';
import { PlayerEntity, MonsterEntity, Projectile, Coordinates, Direction } from '../types/entity';
import { Item } from '../types/item';
import { GestureType } from '../types/action';
import { CONFIG } from '../config';

export interface CombatResult {
  success: boolean;
  message?: string;
  damageDealt?: number;
  healAmount?: number;
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
    if (player.fortifyTimer && player.fortifyTimer > 0) {
      player.fortifyTimer = Math.max(0, player.fortifyTimer - deltaSec);
    }
    if (player.holyRadianceTimer && player.holyRadianceTimer > 0) {
      player.holyRadianceTimer = Math.max(0, player.holyRadianceTimer - deltaSec);
    }
  }

  private static randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  public static findArrowItem(player: PlayerEntity): { inBackpack: boolean; inActionBar: boolean; index: number; item: Item } | null {
    // Check Action Bar
    for (let i = 0; i < player.action_bar.length; i++) {
      const item = player.action_bar[i];
      if (item && item.item_id === 'arrows' && item.quantity > 0) {
        return { inBackpack: false, inActionBar: true, index: i, item };
      }
    }
    // Check backpack
    for (let i = 0; i < player.backpack.length; i++) {
      const item = player.backpack[i];
      if (item && item.item_id === 'arrows' && item.quantity > 0) {
        return { inBackpack: true, inActionBar: false, index: i, item };
      }
    }
    return null;
  }

  public static consumeArrow(player: PlayerEntity, count = 1): boolean {
    let remaining = count;
    while (remaining > 0) {
      const arrowSlot = CombatSystem.findArrowItem(player);
      if (!arrowSlot) return false;

      const take = Math.min(remaining, arrowSlot.item.quantity);
      arrowSlot.item.quantity -= take;
      remaining -= take;

      if (arrowSlot.item.quantity <= 0) {
        if (arrowSlot.inActionBar) {
          player.action_bar[arrowSlot.index] = null;
        } else {
          player.backpack[arrowSlot.index] = null;
        }
      }
    }
    return true;
  }

  // --- MAGICIAN ABILITIES ---

  public static executeWandSpark(
    player: PlayerEntity,
    target: MonsterEntity,
    gridMap: GridMap,
    gesture: GestureType = 'tap'
  ): CombatResult {
    const cdKey = 'wand_spark';
    if ((player.cooldowns[cdKey] || 0) > 0) {
      return { success: false, message: 'Wand Spark is on cooldown.' };
    }

    const mult = player.skillBoosts?.damageMultiplier || 1.0;
    const bonusRng = player.skillBoosts?.bonusRange || 0;
    const chargeMult = gesture === 'hold' ? 1.5 : gesture === 'double_tap' ? 1.3 : 1.0;

    const dist = Math.hypot(target.x - player.x, target.y - player.y);
    if (dist > (CONFIG.MAGICIAN_SPARK_RANGE + bonusRng) + 0.5) {
      return { success: false, message: 'Target is out of range for Wand Spark.' };
    }

    if (!LightingSystem.hasLineOfSight(gridMap, player.x, player.y, target.x, target.y)) {
      return { success: false, message: 'Line of sight to target is blocked.' };
    }

    player.cooldowns[cdKey] = CONFIG.MAGICIAN_SPARK_COOLDOWN_SEC;
    const baseDmg = CombatSystem.randomBetween(CONFIG.MAGICIAN_SPARK_DAMAGE_MIN, CONFIG.MAGICIAN_SPARK_DAMAGE_MAX);
    const damage = Math.round(baseDmg * mult * chargeMult);
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
      color: gesture === 'hold' ? '#ffdd44' : '#44ccff',
    };

    let defeatedMonsterId: string | undefined;
    let droppedLoot: Item[] | undefined;
    const prefix = gesture === 'hold' ? 'Overcharged Wand Spark' : gesture === 'double_tap' ? 'Rapid Twin Spark' : 'Wand Spark';
    let message = `You hit ${target.name} with ${prefix} for ${damage} magic damage.`;

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
    if ((player.cooldowns['light'] || 0) > 0) {
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
    monsters: MonsterEntity[],
    gesture: GestureType = 'tap'
  ): CombatResult {
    if ((player.cooldowns['energy_beam'] || 0) > 0) {
      return { success: false, message: 'Energy Beam is on cooldown.' };
    }

    if (player.mana < CONFIG.MAGICIAN_BEAM_MANA_COST) {
      return { success: false, message: 'Not enough Mana to cast Energy Beam.' };
    }

    player.mana -= CONFIG.MAGICIAN_BEAM_MANA_COST;
    player.cooldowns['energy_beam'] = CONFIG.MAGICIAN_BEAM_COOLDOWN_SEC;

    const mult = player.skillBoosts?.damageMultiplier || 1.0;
    const bonusRng = player.skillBoosts?.bonusRange || 0;
    const chargeMult = gesture === 'hold' ? 1.4 : 1.0;
    const beamRange = CONFIG.MAGICIAN_BEAM_RANGE + bonusRng + (gesture === 'hold' ? 1 : 0);

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
        const damage = Math.round(baseDmg * mult * chargeMult);
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
      color: gesture === 'hold' ? '#ff5500' : '#ff00aa',
      direction: facing,
      piercingTiles: beamTiles,
    };

    let msg = `You unleashed ${gesture === 'hold' ? 'Overcharged ' : ''}Energy Beam!`;
    if (hits > 0) {
      msg += ` Pierced ${hits} enemy(s) for ${totalDamage} total damage.`;
    }

    return {
      success: true,
      message: msg,
      damageDealt: totalDamage,
      projectiles: [projectile],
      defeatedMonsterId: defeatedIds[0],
      droppedLoot: allLoot,
    };
  }

  // --- ARCHER ABILITIES ---

  public static executeBowShot(
    player: PlayerEntity,
    target: MonsterEntity,
    gridMap: GridMap,
    gesture: GestureType = 'tap'
  ): CombatResult {
    if ((player.cooldowns['bow_shot'] || 0) > 0) {
      return { success: false, message: 'Bow Shot is on cooldown.' };
    }

    const mult = player.skillBoosts?.damageMultiplier || 1.0;
    const bonusRng = player.skillBoosts?.bonusRange || 0;
    const chargeMult = gesture === 'hold' ? 1.5 : gesture === 'double_tap' ? 1.3 : 1.0;

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
    const damage = Math.round(baseDmg * mult * chargeMult);
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
      color: gesture === 'hold' ? '#ffcc00' : '#ddaa44',
    };

    let defeatedMonsterId: string | undefined;
    let droppedLoot: Item[] | undefined;
    const prefix = gesture === 'hold' ? 'Charged Volley Shot' : gesture === 'double_tap' ? 'Rapid Twin Shot' : 'Bow Shot';
    let message = `You fired a ${prefix} at ${target.name} for ${damage} damage.`;

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
    if ((player.cooldowns['power_shot'] || 0) > 0) {
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

  // --- FIGHTER ABILITIES ---

  public static executeFighterSlash(
    player: PlayerEntity,
    target: MonsterEntity,
    gesture: GestureType = 'tap'
  ): CombatResult {
    const cdKey = 'slash';
    if ((player.cooldowns[cdKey] || 0) > 0) {
      return { success: false, message: 'Sword Slash is on cooldown.' };
    }

    const dist = Math.hypot(target.x - player.x, target.y - player.y);
    if (dist > 1.5) {
      return { success: false, message: 'Target is too far for melee strike (must be adjacent).' };
    }

    const mult = player.skillBoosts?.damageMultiplier || 1.0;
    const chargeMult = gesture === 'hold' ? 1.5 : gesture === 'double_tap' ? 1.3 : 1.0;

    player.cooldowns[cdKey] = CONFIG.FIGHTER_SLASH_COOLDOWN_SEC;
    const baseDmg = CombatSystem.randomBetween(CONFIG.FIGHTER_SLASH_DAMAGE_MIN, CONFIG.FIGHTER_SLASH_DAMAGE_MAX);
    const damage = Math.round(baseDmg * mult * chargeMult);
    target.hp -= damage;

    const projectile: Projectile = {
      id: `proj_slash_${Date.now()}`,
      type: 'fighter_cleave',
      sourceX: player.x,
      sourceY: player.y,
      targetX: target.x,
      targetY: target.y,
      currentX: target.x * CONFIG.GRID_SIZE,
      currentY: target.y * CONFIG.GRID_SIZE,
      durationMs: 200,
      elapsedMs: 0,
      color: '#ffffff',
    };

    let defeatedMonsterId: string | undefined;
    let droppedLoot: Item[] | undefined;
    const prefix = gesture === 'hold' ? 'Heavy Power Strike' : gesture === 'double_tap' ? 'Swift Twin Slash' : 'Sword Slash';
    let message = `You struck ${target.name} with ${prefix} for ${damage} physical damage.`;

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

  public static executeFighterCleave(
    player: PlayerEntity,
    monsters: MonsterEntity[]
  ): CombatResult {
    if ((player.cooldowns['cleave'] || 0) > 0) {
      return { success: false, message: 'Cleave is on cooldown.' };
    }

    if (player.mana < CONFIG.FIGHTER_CLEAVE_MANA_COST) {
      return { success: false, message: 'Not enough Stamina/Mana for Cleave.' };
    }

    player.mana -= CONFIG.FIGHTER_CLEAVE_MANA_COST;
    player.cooldowns['cleave'] = CONFIG.FIGHTER_CLEAVE_COOLDOWN_SEC;

    const mult = player.skillBoosts?.damageMultiplier || 1.0;
    let totalDamage = 0;
    let hits = 0;
    const defeatedIds: string[] = [];
    const allLoot: Item[] = [];

    for (const monster of monsters) {
      const dist = Math.hypot(monster.x - player.x, monster.y - player.y);
      if (dist <= 1.5) {
        const baseDmg = CombatSystem.randomBetween(CONFIG.FIGHTER_CLEAVE_DAMAGE_MIN, CONFIG.FIGHTER_CLEAVE_DAMAGE_MAX);
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

    let msg = 'You unleashed a Sweeping Cleave!';
    if (hits > 0) {
      msg += ` Struck ${hits} adjacent foes for ${totalDamage} physical damage.`;
    } else {
      msg += ' No enemies in adjacent range.';
    }

    return {
      success: true,
      message: msg,
      damageDealt: totalDamage,
      defeatedMonsterId: defeatedIds[0],
      droppedLoot: allLoot,
    };
  }

  public static executeFighterFortify(player: PlayerEntity): CombatResult {
    if ((player.cooldowns['fortify'] || 0) > 0) {
      return { success: false, message: 'Fortify Stance is on cooldown.' };
    }

    if (player.mana < CONFIG.FIGHTER_FORTIFY_MANA_COST) {
      return { success: false, message: 'Not enough Stamina/Mana for Fortify.' };
    }

    player.mana -= CONFIG.FIGHTER_FORTIFY_MANA_COST;
    player.cooldowns['fortify'] = CONFIG.FIGHTER_FORTIFY_COOLDOWN_SEC;
    player.fortifyTimer = CONFIG.FIGHTER_FORTIFY_DURATION_SEC;

    return {
      success: true,
      message: 'You assume Fortify Stance! Incoming damage reduced by 50% for 10s.',
    };
  }

  // --- PALADIN ABILITIES ---

  public static executePaladinHolyStrike(
    player: PlayerEntity,
    target: MonsterEntity,
    gesture: GestureType = 'tap'
  ): CombatResult {
    const cdKey = 'holy_strike';
    if ((player.cooldowns[cdKey] || 0) > 0) {
      return { success: false, message: 'Holy Strike is on cooldown.' };
    }

    if (player.mana < CONFIG.PALADIN_HOLY_STRIKE_MANA_COST) {
      return { success: false, message: 'Not enough Mana for Holy Strike.' };
    }

    const dist = Math.hypot(target.x - player.x, target.y - player.y);
    if (dist > 1.5) {
      return { success: false, message: 'Target is too far for melee strike (must be adjacent).' };
    }

    player.mana -= CONFIG.PALADIN_HOLY_STRIKE_MANA_COST;
    player.cooldowns[cdKey] = CONFIG.PALADIN_HOLY_STRIKE_COOLDOWN_SEC;

    const mult = player.skillBoosts?.damageMultiplier || 1.0;
    const chargeMult = gesture === 'hold' ? 1.5 : gesture === 'double_tap' ? 1.3 : 1.0;

    const baseDmg = CombatSystem.randomBetween(CONFIG.PALADIN_HOLY_STRIKE_DAMAGE_MIN, CONFIG.PALADIN_HOLY_STRIKE_DAMAGE_MAX);
    const damage = Math.round(baseDmg * mult * chargeMult);
    target.hp -= damage;

    const projectile: Projectile = {
      id: `proj_hammer_${Date.now()}`,
      type: 'paladin_hammer',
      sourceX: player.x,
      sourceY: player.y,
      targetX: target.x,
      targetY: target.y,
      currentX: target.x * CONFIG.GRID_SIZE,
      currentY: target.y * CONFIG.GRID_SIZE,
      durationMs: 250,
      elapsedMs: 0,
      color: '#ffd700',
    };

    let defeatedMonsterId: string | undefined;
    let droppedLoot: Item[] | undefined;
    const prefix = gesture === 'hold' ? 'Consecrated Holy Smite' : gesture === 'double_tap' ? 'Swift Twin Smite' : 'Holy Strike';
    let message = `You smote ${target.name} with ${prefix} for ${damage} holy damage.`;

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

  public static executePaladinHeal(player: PlayerEntity): CombatResult {
    if ((player.cooldowns['healing_prayer'] || 0) > 0) {
      return { success: false, message: 'Healing Prayer is on cooldown.' };
    }

    if (player.mana < CONFIG.PALADIN_HEAL_MANA_COST) {
      return { success: false, message: 'Not enough Mana for Healing Prayer.' };
    }

    player.mana -= CONFIG.PALADIN_HEAL_MANA_COST;
    player.cooldowns['healing_prayer'] = CONFIG.PALADIN_HEAL_COOLDOWN_SEC;

    const healAmount = CombatSystem.randomBetween(CONFIG.PALADIN_HEAL_AMOUNT_MIN, CONFIG.PALADIN_HEAL_AMOUNT_MAX);
    const prevHp = player.hp;
    player.hp = Math.min(player.max_hp, player.hp + healAmount);
    const actualHealed = player.hp - prevHp;

    return {
      success: true,
      message: `You cast Healing Prayer and restored ${actualHealed} Health!`,
      healAmount: actualHealed,
    };
  }

  public static executePaladinRadiance(
    player: PlayerEntity,
    monsters: MonsterEntity[]
  ): CombatResult {
    if ((player.cooldowns['holy_radiance'] || 0) > 0) {
      return { success: false, message: 'Holy Radiance is on cooldown.' };
    }

    if (player.mana < CONFIG.PALADIN_RADIANCE_MANA_COST) {
      return { success: false, message: 'Not enough Mana for Holy Radiance.' };
    }

    player.mana -= CONFIG.PALADIN_RADIANCE_MANA_COST;
    player.cooldowns['holy_radiance'] = CONFIG.PALADIN_RADIANCE_COOLDOWN_SEC;

    const mult = player.skillBoosts?.damageMultiplier || 1.0;
    let totalDamage = 0;
    let hits = 0;
    const defeatedIds: string[] = [];
    const allLoot: Item[] = [];

    for (const monster of monsters) {
      const dist = Math.hypot(monster.x - player.x, monster.y - player.y);
      if (dist <= 2.5) {
        const baseDmg = CombatSystem.randomBetween(CONFIG.PALADIN_RADIANCE_DAMAGE_MIN, CONFIG.PALADIN_RADIANCE_DAMAGE_MAX);
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

    let msg = 'You unleashed Holy Radiance!';
    if (hits > 0) {
      msg += ` Smote ${hits} nearby enemies for ${totalDamage} holy damage.`;
    }

    return {
      success: true,
      message: msg,
      damageDealt: totalDamage,
      defeatedMonsterId: defeatedIds[0],
      droppedLoot: allLoot,
    };
  }

  // --- LOOT GENERATION ---

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
