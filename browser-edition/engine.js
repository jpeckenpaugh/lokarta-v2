/**
 * Lokarta Browser Edition - Core Engine
 * Standalone vanilla ES Module containing:
 * - GridMap
 * - LightingSystem
 * - ProgressionSystem
 * - CombatSystem
 * - EntityAI
 * - InventorySystem
 */

export const TILE_TYPES = {
  FLOOR: 0,
  WALL: 1,
  STAIRS: 2,
  DOOR: 3,
};

export const CONFIG = {
  GRID_SIZE: 32, // pixels per tile
  MAP_WIDTH: 40,
  MAP_HEIGHT: 40,
  TICK_INTERVAL_MS: 100, // 10 Hz fixed simulation tick

  // Lighting
  BASE_LIGHT_RADIUS: 3,
  TORCH_LIGHT_RADIUS: 7,
  LIGHT_SPELL_RADIUS: 6,
  LIGHT_SPELL_DURATION_SEC: 30,
  AMBIENT_LIGHT_RADIUS: 4,

  // Abilities & Combat
  MAGICIAN_SPARK_DAMAGE_MIN: 12,
  MAGICIAN_SPARK_DAMAGE_MAX: 16,
  MAGICIAN_SPARK_RANGE: 5,
  MAGICIAN_SPARK_COOLDOWN_SEC: 1.0,

  MAGICIAN_LIGHT_MANA_COST: 15,
  MAGICIAN_LIGHT_COOLDOWN_SEC: 5.0,

  MAGICIAN_BEAM_MANA_COST: 30,
  MAGICIAN_BEAM_DAMAGE_MIN: 30,
  MAGICIAN_BEAM_DAMAGE_MAX: 40,
  MAGICIAN_BEAM_RANGE: 4,
  MAGICIAN_BEAM_COOLDOWN_SEC: 3.0,

  ARCHER_BOW_DAMAGE_MIN: 14,
  ARCHER_BOW_DAMAGE_MAX: 18,
  ARCHER_BOW_RANGE: 6,
  ARCHER_BOW_COOLDOWN_SEC: 1.0,

  ARCHER_POWER_SHOT_DAMAGE_MIN: 32,
  ARCHER_POWER_SHOT_DAMAGE_MAX: 42,
  ARCHER_POWER_SHOT_RANGE: 6,
  ARCHER_POWER_SHOT_COOLDOWN_SEC: 4.0,

  // Monster Balance & Cadence
  RAT_MOVE_CADENCE_SEC: 0.6,
  RAT_ATTACK_CADENCE_SEC: 1.2,
  RAT_DAMAGE_MIN: 4,
  RAT_DAMAGE_MAX: 8,

  SKELETON_MOVE_CADENCE_SEC: 0.8,
  SKELETON_ATTACK_CADENCE_SEC: 1.5,
  SKELETON_DAMAGE_MIN: 8,
  SKELETON_DAMAGE_MAX: 14,

  CULTIST_MOVE_CADENCE_SEC: 1.0,
  CULTIST_ATTACK_CADENCE_SEC: 2.0,
  CULTIST_DAMAGE_MIN: 10,
  CULTIST_DAMAGE_MAX: 16,
  CULTIST_STANDOFF_MIN: 3,
  CULTIST_STANDOFF_MAX: 4,

  BOSS_MOVE_CADENCE_SEC: 0.7,
  BOSS_ATTACK_CADENCE_SEC: 1.4,
  BOSS_DAMAGE_MIN: 16,
  BOSS_DAMAGE_MAX: 24,

  // Consumables
  HEALTH_POTION_HEAL: 30,
  MANA_POTION_RESTORE: 40,
};

export const DEFAULT_ARCHETYPES = {
  magician: {
    id: 'magician',
    vocation: 'magician',
    hp: 60,
    max_hp: 60,
    mana: 120,
    max_mana: 120,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    current_floor: 1,
    x: 2,
    y: 2,
    facing: 'right',
    lightSpellTimer: 0,
    cooldowns: {
      wand_spark: 0,
      light: 0,
      energy_beam: 0,
    },
    skillBoosts: {
      damageMultiplier: 1.0,
      bonusRange: 0,
      bonusRegen: 0,
    },
    paperdoll: {
      right_hand: {
        item_id: 'apprentice_wand',
        name: 'Apprentice Wand',
        type: 'weapon',
        quantity: 1,
        stat_bonus: 12,
      },
      left_hand: {
        item_id: 'torch',
        name: 'Wooden Torch',
        type: 'offhand',
        quantity: 1,
        stat_bonus: 5,
      },
      armor: {
        item_id: 'cloth_robe',
        name: 'Cloth Robe',
        type: 'armor',
        quantity: 1,
        stat_bonus: 2,
      },
    },
    backpack: [
      {
        item_id: 'mana_potion',
        name: 'Mana Potion',
        type: 'consumable',
        quantity: 2,
        stat_bonus: 40,
      },
      {
        item_id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        quantity: 1,
        stat_bonus: 30,
      },
      null,
      null,
      null,
      null,
    ],
  },
  archer: {
    id: 'archer',
    vocation: 'archer',
    hp: 90,
    max_hp: 90,
    mana: 60,
    max_mana: 60,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    current_floor: 1,
    x: 2,
    y: 2,
    facing: 'right',
    lightSpellTimer: 0,
    cooldowns: {
      bow_shot: 0,
      power_shot: 0,
    },
    skillBoosts: {
      damageMultiplier: 1.0,
      bonusRange: 0,
      bonusRegen: 0,
    },
    paperdoll: {
      right_hand: {
        item_id: 'wooden_bow',
        name: 'Wooden Bow',
        type: 'weapon',
        quantity: 1,
        stat_bonus: 14,
      },
      left_hand: null,
      armor: {
        item_id: 'leather_armor',
        name: 'Leather Armor',
        type: 'armor',
        quantity: 1,
        stat_bonus: 4,
      },
    },
    backpack: [
      {
        item_id: 'arrows',
        name: 'Arrows',
        type: 'ammo',
        quantity: 15,
        stat_bonus: 0,
      },
      {
        item_id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        quantity: 1,
        stat_bonus: 30,
      },
      null,
      null,
      null,
      null,
    ],
  },
};

/**
 * Creates a cloned player instance from archetype.
 * @param {'magician'|'archer'} [vocation='magician']
 * @param {string} [id]
 * @returns {object}
 */
export function createPlayer(vocation = 'magician', id = null) {
  const normVoc = (vocation || 'magician').toLowerCase();
  const archetype = DEFAULT_ARCHETYPES[normVoc] || DEFAULT_ARCHETYPES.magician;
  const clone = JSON.parse(JSON.stringify(archetype));
  if (id) {
    clone.id = id;
  }
  return clone;
}

// ============================================================================
// 1. GridMap
// ============================================================================

export class GridMap {
  /**
   * @param {number} [width=40]
   * @param {number} [height=40]
   */
  constructor(width = CONFIG.MAP_WIDTH, height = CONFIG.MAP_HEIGHT) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.initEmptyGrid();
  }

  initEmptyGrid() {
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        row.push({
          x,
          y,
          type: TILE_TYPES.WALL,
          items: [],
          isLit: false,
          lightIntensity: 0,
        });
      }
      this.tiles.push(row);
    }
  }

  /**
   * Loads the grid tile types from a 2D matrix of numbers.
   * @param {number[][]} matrix
   */
  loadFromMatrix(matrix) {
    if (!matrix || !matrix.length) return;
    this.height = matrix.length;
    this.width = matrix[0]?.length || CONFIG.MAP_WIDTH;
    this.tiles = [];

    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        const typeCode = matrix[y][x];
        let tileType = TILE_TYPES.FLOOR;
        if (typeCode === 1) tileType = TILE_TYPES.WALL;
        else if (typeCode === 2) tileType = TILE_TYPES.STAIRS;
        else if (typeCode === 3) tileType = TILE_TYPES.DOOR;

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

  isInBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  isWalkable(x, y) {
    if (!this.isInBounds(x, y)) return false;
    return this.tiles[y][x].type !== TILE_TYPES.WALL;
  }

  isWall(x, y) {
    if (!this.isInBounds(x, y)) return true;
    return this.tiles[y][x].type === TILE_TYPES.WALL;
  }

  isStairs(x, y) {
    if (!this.isInBounds(x, y)) return false;
    return this.tiles[y][x].type === TILE_TYPES.STAIRS;
  }

  isDoor(x, y) {
    if (!this.isInBounds(x, y)) return false;
    return this.tiles[y][x].type === TILE_TYPES.DOOR;
  }

  getTile(x, y) {
    if (!this.isInBounds(x, y)) return null;
    return this.tiles[y][x];
  }

  addItem(x, y, item) {
    const tile = this.getTile(x, y);
    if (tile && item) {
      tile.items.push(item);
    }
  }

  popTopItem(x, y) {
    const tile = this.getTile(x, y);
    if (tile && tile.items.length > 0) {
      return tile.items.pop() || null;
    }
    return null;
  }

  removeItem(x, y, itemIndex) {
    const tile = this.getTile(x, y);
    if (tile && itemIndex >= 0 && itemIndex < tile.items.length) {
      const removed = tile.items.splice(itemIndex, 1);
      return removed[0] || null;
    }
    return null;
  }

  getItems(x, y) {
    const tile = this.getTile(x, y);
    return tile ? tile.items : [];
  }
}

// ============================================================================
// 2. LightingSystem
// ============================================================================

export class LightingSystem {
  /**
   * Computes the player's active field of view radius.
   * Base vision: 3 tiles, Torch: 7 tiles, Light Spell: 6 tiles.
   * @param {object} player
   * @returns {number}
   */
  static computePlayerRadius(player) {
    if (player.lightSpellTimer > 0) {
      return CONFIG.LIGHT_SPELL_RADIUS;
    }
    const leftHand = player.paperdoll?.left_hand;
    const rightHand = player.paperdoll?.right_hand;
    if ((leftHand && leftHand.item_id === 'torch') || (rightHand && rightHand.item_id === 'torch')) {
      return CONFIG.TORCH_LIGHT_RADIUS;
    }
    return CONFIG.BASE_LIGHT_RADIUS;
  }

  /**
   * Recalculates lighting map and entity visibility across the dungeon.
   * @param {GridMap} gridMap
   * @param {object} player
   * @param {Array<object>} ambientLights
   * @param {Array<object>} monsters
   */
  static updateLighting(gridMap, player, ambientLights = [], monsters = []) {
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
      LightingSystem.castLightCircle(gridMap, emitter.x, emitter.y, emitter.radius || CONFIG.AMBIENT_LIGHT_RADIUS);
    }

    // 3. Cast light from player
    const playerRadius = LightingSystem.computePlayerRadius(player);
    LightingSystem.castLightCircle(gridMap, player.x, player.y, playerRadius);

    // 4. Update monster visibility & light-triggered aggro
    for (const monster of monsters) {
      const tile = gridMap.getTile(monster.x, monster.y);
      if (tile && tile.isLit) {
        monster.visible = true;
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

  /**
   * Casts FOV rays in a circle from origin (originX, originY).
   * @param {GridMap} gridMap
   * @param {number} originX
   * @param {number} originY
   * @param {number} radius
   */
  static castLightCircle(gridMap, originX, originY, radius) {
    const minX = Math.max(0, originX - radius);
    const maxX = Math.min(gridMap.width - 1, originX + radius);
    const minY = Math.max(0, originY - radius);
    const maxY = Math.min(gridMap.height - 1, originY + radius);

    // Light origin tile
    const originTile = gridMap.getTile(originX, originY);
    if (originTile) {
      originTile.isLit = true;
      originTile.lightIntensity = Math.max(originTile.lightIntensity, 1.0);
    }

    // Cast rays to the bounding box perimeter
    for (let x = minX; x <= maxX; x++) {
      LightingSystem.castRay(gridMap, originX, originY, x, minY, radius);
      LightingSystem.castRay(gridMap, originX, originY, x, maxY, radius);
    }
    for (let y = minY; y <= maxY; y++) {
      LightingSystem.castRay(gridMap, originX, originY, minX, y, radius);
      LightingSystem.castRay(gridMap, originX, originY, maxX, y, radius);
    }
  }

  /**
   * Casts a single ray using Bresenham line algorithm with wall occlusion.
   */
  static castRay(gridMap, x0, y0, x1, y1, maxRadius) {
    const points = LightingSystem.getBresenhamLine(x0, y0, x1, y1);

    for (const pt of points) {
      const dist = Math.hypot(pt.x - x0, pt.y - y0);
      if (dist > maxRadius + 0.5) break;

      const tile = gridMap.getTile(pt.x, pt.y);
      if (!tile) break;

      tile.isLit = true;
      const intensity = Math.max(0, 1 - dist / (maxRadius + 1));
      tile.lightIntensity = Math.max(tile.lightIntensity, intensity);

      // Wall occlusion: illuminates the wall tile, but blocks further ray penetration
      if (gridMap.isWall(pt.x, pt.y) && (pt.x !== x0 || pt.y !== y0)) {
        break;
      }
    }
  }

  /**
   * Checks if an unblocked line of sight exists between two coordinates.
   * @param {GridMap} gridMap
   * @param {number} x0
   * @param {number} y0
   * @param {number} x1
   * @param {number} y1
   * @returns {boolean}
   */
  static hasLineOfSight(gridMap, x0, y0, x1, y1) {
    const points = LightingSystem.getBresenhamLine(x0, y0, x1, y1);
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      if (i > 0 && i < points.length - 1) {
        if (gridMap.isWall(pt.x, pt.y)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Returns list of integer coordinates connecting (x0, y0) to (x1, y1).
   * @param {number} x0
   * @param {number} y0
   * @param {number} x1
   * @param {number} y1
   * @returns {Array<{ x: number, y: number }>}
   */
  static getBresenhamLine(x0, y0, x1, y1) {
    const points = [];
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

// ============================================================================
// 3. ProgressionSystem
// ============================================================================

export class ProgressionSystem {
  static MAX_LEVEL = 20;

  /**
   * Calculates XP required to advance from current level to next (Level 1-20: level * 100).
   * @param {number} level
   * @returns {number}
   */
  static getXpForLevel(level) {
    return Math.max(1, level) * 100;
  }

  /**
   * Determine XP rewarded for defeating an enemy at given floor depth.
   * @param {string} monsterType
   * @param {number} floor
   * @param {boolean} [isBoss=false]
   * @returns {number}
   */
  static getMonsterXp(monsterType, floor = 1, isBoss = false) {
    if (isBoss || monsterType === 'abyssal_overlord' || monsterType === 'boss_overlord') {
      return 500;
    }
    if (monsterType === 'giant_rat') {
      return 20 + floor * 4;
    }
    if (monsterType === 'crypt_skeleton') {
      return 35 + (floor - 1) * 8;
    }
    if (monsterType === 'shadow_cultist') {
      return 45 + (floor - 1) * 10;
    }
    if (monsterType === 'elite_cultist') {
      return 65 + (floor - 1) * 12;
    }
    return 30 + floor * 5;
  }

  /**
   * Computes active skill boosts and stat modifiers for a given vocation and level.
   * @param {'magician'|'archer'} vocation
   * @param {number} level
   * @returns {{ damageMultiplier: number, bonusRange: number, bonusRegen: number }}
   */
  static computeSkillBoosts(vocation, level) {
    const levelDelta = Math.max(0, level - 1);
    const damageStep = vocation === 'magician' ? 0.10 : 0.12;

    return {
      damageMultiplier: Number((1.0 + levelDelta * damageStep).toFixed(2)),
      bonusRange: Math.floor(levelDelta / 4), // +1 tile range every 4 levels
      bonusRegen: Math.floor(levelDelta / 3), // +1 passive regen bonus every 3 levels
    };
  }

  /**
   * Returns default skill boosts for level 1 character.
   */
  static getDefaultSkillBoosts() {
    return {
      damageMultiplier: 1.0,
      bonusRange: 0,
      bonusRegen: 0,
    };
  }

  /**
   * Awards XP to the player, handling multiple level-ups and stat enhancements.
   * @param {object} player
   * @param {number} amount
   * @returns {{
   *   leveledUp: boolean,
   *   oldLevel: number,
   *   newLevel: number,
   *   hpGained: number,
   *   manaGained: number,
   *   damagePercentGained: number
   * }}
   */
  static awardXP(player, amount) {
    const oldLevel = player.level;
    let hpGained = 0;
    let manaGained = 0;

    if (player.level >= ProgressionSystem.MAX_LEVEL) {
      player.xp = player.xpToNextLevel || ProgressionSystem.getXpForLevel(player.level);
      return {
        leveledUp: false,
        oldLevel,
        newLevel: oldLevel,
        hpGained: 0,
        manaGained: 0,
        damagePercentGained: 0,
      };
    }

    let remainingXp = amount;

    while (player.level < ProgressionSystem.MAX_LEVEL && (player.xp + remainingXp) >= player.xpToNextLevel) {
      const neededForNext = player.xpToNextLevel - player.xp;
      remainingXp -= neededForNext;
      player.level += 1;
      player.xp = 0;
      player.xpToNextLevel = ProgressionSystem.getXpForLevel(player.level);

      // Stat growth per level
      const hpInc = player.vocation === 'magician' ? 8 : 14;
      const manaInc = player.vocation === 'magician' ? 16 : 8;

      player.max_hp += hpInc;
      player.max_mana += manaInc;
      hpGained += hpInc;
      manaGained += manaInc;

      // Full restorative surge on level up
      player.hp = player.max_hp;
      player.mana = player.max_mana;
    }

    if (player.level < ProgressionSystem.MAX_LEVEL) {
      player.xp += remainingXp;
    } else {
      player.xp = player.xpToNextLevel;
    }

    // Refresh skill boosts
    player.skillBoosts = ProgressionSystem.computeSkillBoosts(player.vocation, player.level);

    const leveledUp = player.level > oldLevel;
    const oldDmg = 1.0 + (oldLevel - 1) * (player.vocation === 'magician' ? 0.10 : 0.12);
    const newDmg = player.skillBoosts.damageMultiplier;
    const damagePercentGained = Math.round((newDmg - oldDmg) * 100);

    return {
      leveledUp,
      oldLevel,
      newLevel: player.level,
      hpGained,
      manaGained,
      damagePercentGained,
    };
  }
}

// ============================================================================
// 4. CombatSystem
// ============================================================================

export class CombatSystem {
  static decrementCooldowns(player, deltaSec) {
    if (!player.cooldowns) return;
    for (const key of Object.keys(player.cooldowns)) {
      if (player.cooldowns[key] > 0) {
        player.cooldowns[key] = Math.max(0, player.cooldowns[key] - deltaSec);
      }
    }
  }

  static decrementSpellTimers(player, deltaSec) {
    if (player.lightSpellTimer > 0) {
      player.lightSpellTimer = Math.max(0, player.lightSpellTimer - deltaSec);
    }
  }

  static randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static findArrowItem(player) {
    for (let i = 0; i < player.backpack.length; i++) {
      const item = player.backpack[i];
      if (item && item.item_id === 'arrows' && item.quantity > 0) {
        return { inBackpack: true, index: i, item };
      }
    }
    return null;
  }

  static consumeArrow(player) {
    const arrowSlot = CombatSystem.findArrowItem(player);
    if (!arrowSlot) return false;

    arrowSlot.item.quantity -= 1;
    if (arrowSlot.item.quantity <= 0) {
      player.backpack[arrowSlot.index] = null;
    }
    return true;
  }

  /**
   * Executes Magician Wand Spark ability.
   */
  static executeWandSpark(player, target, gridMap) {
    if (player.cooldowns?.wand_spark > 0) {
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

    if (!player.cooldowns) player.cooldowns = {};
    player.cooldowns.wand_spark = CONFIG.MAGICIAN_SPARK_COOLDOWN_SEC;

    const baseDmg = CombatSystem.randomBetween(CONFIG.MAGICIAN_SPARK_DAMAGE_MIN, CONFIG.MAGICIAN_SPARK_DAMAGE_MAX);
    const damage = Math.round(baseDmg * mult);
    target.hp -= damage;

    const projectile = {
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

    let defeatedMonsterId;
    let droppedLoot;
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

  /**
   * Executes Magician Light Spell ability.
   */
  static executeLightSpell(player) {
    if (player.cooldowns?.light > 0) {
      return { success: false, message: 'Light spell is on cooldown.' };
    }

    if (player.mana < CONFIG.MAGICIAN_LIGHT_MANA_COST) {
      return { success: false, message: 'Not enough Mana to cast Light.' };
    }

    player.mana -= CONFIG.MAGICIAN_LIGHT_MANA_COST;
    if (!player.cooldowns) player.cooldowns = {};
    player.cooldowns.light = CONFIG.MAGICIAN_LIGHT_COOLDOWN_SEC;
    player.lightSpellTimer = CONFIG.LIGHT_SPELL_DURATION_SEC;

    return {
      success: true,
      message: 'You cast Light! Darkness recedes for 30 seconds.',
    };
  }

  /**
   * Executes Magician Energy Beam piercing ability.
   */
  static executeEnergyBeam(player, facing = 'right', gridMap, monsters = []) {
    if (player.cooldowns?.energy_beam > 0) {
      return { success: false, message: 'Energy Beam is on cooldown.' };
    }

    if (player.mana < CONFIG.MAGICIAN_BEAM_MANA_COST) {
      return { success: false, message: 'Not enough Mana to cast Energy Beam.' };
    }

    player.mana -= CONFIG.MAGICIAN_BEAM_MANA_COST;
    if (!player.cooldowns) player.cooldowns = {};
    player.cooldowns.energy_beam = CONFIG.MAGICIAN_BEAM_COOLDOWN_SEC;

    const mult = player.skillBoosts?.damageMultiplier || 1.0;
    const bonusRng = player.skillBoosts?.bonusRange || 0;
    const beamRange = CONFIG.MAGICIAN_BEAM_RANGE + bonusRng;

    const dx = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;
    const dy = facing === 'up' ? -1 : facing === 'down' ? 1 : 0;

    const beamTiles = [];
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
    const defeatedIds = [];
    const allLoot = [];

    for (const monster of monsters) {
      const hit = beamTiles.some(t => t.x === monster.x && t.y === monster.y);
      if (hit && monster.hp > 0) {
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

    const projectile = {
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

    let msg = 'You unleashed Energy Beam!';
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

  /**
   * Executes Archer Bow Shot ability.
   */
  static executeBowShot(player, target, gridMap) {
    if (player.cooldowns?.bow_shot > 0) {
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

    if (!player.cooldowns) player.cooldowns = {};
    player.cooldowns.bow_shot = CONFIG.ARCHER_BOW_COOLDOWN_SEC;

    const baseDmg = CombatSystem.randomBetween(CONFIG.ARCHER_BOW_DAMAGE_MIN, CONFIG.ARCHER_BOW_DAMAGE_MAX);
    const damage = Math.round(baseDmg * mult);
    target.hp -= damage;

    const projectile = {
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

    let defeatedMonsterId;
    let droppedLoot;
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

  /**
   * Executes Archer Power Shot ability.
   */
  static executePowerShot(player, target, gridMap) {
    if (player.cooldowns?.power_shot > 0) {
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

    if (!player.cooldowns) player.cooldowns = {};
    player.cooldowns.power_shot = CONFIG.ARCHER_POWER_SHOT_COOLDOWN_SEC;

    const baseDmg = CombatSystem.randomBetween(CONFIG.ARCHER_POWER_SHOT_DAMAGE_MIN, CONFIG.ARCHER_POWER_SHOT_DAMAGE_MAX);
    const damage = Math.round(baseDmg * mult);
    target.hp -= damage;

    const projectile = {
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

    let defeatedMonsterId;
    let droppedLoot;
    let message = `Power Shot strikes ${target.name} for ${damage} heavy damage!`;

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

  /**
   * Generates loot dropped upon monster defeat.
   */
  static generateMonsterLoot(monster) {
    const loot = [];
    const roll = Math.random();

    if (monster.type === 'giant_rat') {
      if (roll < 0.4) {
        loot.push({
          item_id: 'health_potion',
          name: 'Health Potion',
          type: 'consumable',
          quantity: 1,
          stat_bonus: CONFIG.HEALTH_POTION_HEAL,
        });
      }
    } else if (monster.type === 'crypt_skeleton') {
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
    } else if (monster.type === 'shadow_cultist' || monster.type === 'elite_cultist') {
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
    } else if (monster.type === 'abyssal_overlord') {
      loot.push({
        item_id: 'mana_potion',
        name: 'Greater Mana Potion',
        type: 'consumable',
        quantity: 3,
        stat_bonus: 60,
      });
      loot.push({
        item_id: 'health_potion',
        name: 'Greater Health Potion',
        type: 'consumable',
        quantity: 3,
        stat_bonus: 50,
      });
    }

    return loot;
  }
}

// ============================================================================
// 5. EntityAI
// ============================================================================

export class EntityAI {
  /**
   * Updates all active monsters in the dungeon on a game simulation tick.
   * @param {Array<object>} monsters
   * @param {object} player
   * @param {GridMap} gridMap
   * @param {number} deltaSec
   * @returns {Array<object>}
   */
  static updateMonsters(monsters, player, gridMap, deltaSec) {
    const results = [];

    for (const monster of monsters) {
      if (monster.hp <= 0) continue;

      if (monster.attackCooldown > 0) {
        monster.attackCooldown = Math.max(0, monster.attackCooldown - deltaSec);
      }
      monster.moveCooldown = Math.max(0, (monster.moveCooldown || 0) - deltaSec);

      // If not yet aggroed, wander idly in darkness
      if (!monster.isAggroed) {
        if ((monster.moveCooldown || 0) <= 0) {
          monster.moveCooldown = 3.0 + Math.random() * 2.5;
          EntityAI.idleWander(monster, gridMap, monsters);
        }
        continue;
      }

      // Melee monsters: Giant Rat, Crypt Skeleton, Abyssal Overlord Boss
      if (monster.type === 'giant_rat') {
        const action = EntityAI.updateMeleeMonster(monster, player, gridMap, monsters, CONFIG.RAT_DAMAGE_MIN, CONFIG.RAT_DAMAGE_MAX, CONFIG.RAT_MOVE_CADENCE_SEC);
        if (action) results.push(action);
      } else if (monster.type === 'crypt_skeleton') {
        const action = EntityAI.updateMeleeMonster(monster, player, gridMap, monsters, CONFIG.SKELETON_DAMAGE_MIN, CONFIG.SKELETON_DAMAGE_MAX, CONFIG.SKELETON_MOVE_CADENCE_SEC);
        if (action) results.push(action);
      } else if (monster.type === 'abyssal_overlord' || monster.isBoss) {
        const action = EntityAI.updateMeleeMonster(monster, player, gridMap, monsters, CONFIG.BOSS_DAMAGE_MIN, CONFIG.BOSS_DAMAGE_MAX, CONFIG.BOSS_MOVE_CADENCE_SEC);
        if (action) results.push(action);
      }
      // Ranged monsters: Shadow Cultist, Elite Cultist
      else if (monster.type === 'shadow_cultist' || monster.type === 'elite_cultist') {
        const action = EntityAI.updateCultist(monster, player, gridMap, monsters);
        if (action) results.push(action);
      }
    }

    return results;
  }

  static idleWander(monster, gridMap, allMonsters) {
    if (Math.random() < 0.4) return;
    const directions = [
      { x: 0, y: -1, dir: 'up' },
      { x: 0, y: 1, dir: 'down' },
      { x: -1, y: 0, dir: 'left' },
      { x: 1, y: 0, dir: 'right' },
    ];
    const choice = directions[Math.floor(Math.random() * directions.length)];
    const nx = monster.x + choice.x;
    const ny = monster.y + choice.y;

    if (gridMap.isWalkable(nx, ny) && !allMonsters.some(m => m.id !== monster.id && m.hp > 0 && m.x === nx && m.y === ny)) {
      monster.facing = choice.dir;
      monster.x = nx;
      monster.y = ny;
    }
  }

  static updateMeleeMonster(monster, player, gridMap, allMonsters, minDmg, maxDmg, defaultMoveCadence) {
    const distManhattan = Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y);

    // Adjacent -> Attack
    if (distManhattan === 1) {
      monster.facing = EntityAI.getFacing(monster.x, monster.y, player.x, player.y);
      if (monster.attackCooldown <= 0) {
        monster.attackCooldown = monster.attackCadence || 1.5;
        const damage = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
        player.hp = Math.max(0, player.hp - damage);
        return {
          damageToPlayer: damage,
          message: `${monster.name} attacks you for ${damage} physical damage!`,
        };
      }
      return null;
    }

    // Move towards player via A*
    if ((monster.moveCooldown || 0) <= 0) {
      monster.moveCooldown = (monster.moveCadence || defaultMoveCadence) + (Math.random() * 0.2 - 0.1);

      const nextStep = EntityAI.findNextStepAStar(
        { x: monster.x, y: monster.y },
        { x: player.x, y: player.y },
        gridMap,
        allMonsters.filter(m => m.id !== monster.id && m.hp > 0)
      );

      if (nextStep && (nextStep.x !== player.x || nextStep.y !== player.y)) {
        monster.facing = EntityAI.getFacing(monster.x, monster.y, nextStep.x, nextStep.y);
        monster.x = nextStep.x;
        monster.y = nextStep.y;
      }
    }

    return null;
  }

  static updateCultist(cultist, player, gridMap, allMonsters) {
    const dist = Math.hypot(cultist.x - player.x, cultist.y - player.y);
    const hasLOS = LightingSystem.hasLineOfSight(gridMap, cultist.x, cultist.y, player.x, player.y);

    cultist.facing = EntityAI.getFacing(cultist.x, cultist.y, player.x, player.y);

    // 1. Attack if in range (<= 5) with LOS
    if (dist <= 5 && hasLOS && cultist.attackCooldown <= 0) {
      cultist.attackCooldown = cultist.attackCadence || 2.0;
      const minDmg = cultist.type === 'elite_cultist' ? 14 : CONFIG.CULTIST_DAMAGE_MIN;
      const maxDmg = cultist.type === 'elite_cultist' ? 22 : CONFIG.CULTIST_DAMAGE_MAX;
      const damage = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
      player.hp = Math.max(0, player.hp - damage);

      const projectile = {
        id: `proj_shadow_${Date.now()}_${Math.random()}`,
        type: 'shadow_bolt',
        sourceX: cultist.x,
        sourceY: cultist.y,
        targetX: player.x,
        targetY: player.y,
        currentX: cultist.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
        currentY: cultist.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
        durationMs: 300,
        elapsedMs: 0,
        color: '#9933ff',
      };

      return {
        damageToPlayer: damage,
        message: `${cultist.name} casts Shadow Bolt at you for ${damage} dark damage!`,
        projectiles: [projectile],
      };
    }

    // 2. Reposition / Standoff management
    if ((cultist.moveCooldown || 0) <= 0) {
      cultist.moveCooldown = (cultist.moveCadence || CONFIG.CULTIST_MOVE_CADENCE_SEC) + (Math.random() * 0.3 - 0.1);

      if (dist < CONFIG.CULTIST_STANDOFF_MIN) {
        const retreatStep = EntityAI.findRetreatStep(cultist, player, gridMap, allMonsters);
        if (retreatStep) {
          cultist.facing = EntityAI.getFacing(cultist.x, cultist.y, retreatStep.x, retreatStep.y);
          cultist.x = retreatStep.x;
          cultist.y = retreatStep.y;
        }
      } else if (dist > CONFIG.CULTIST_STANDOFF_MAX) {
        const nextStep = EntityAI.findNextStepAStar(
          { x: cultist.x, y: cultist.y },
          { x: player.x, y: player.y },
          gridMap,
          allMonsters.filter(m => m.id !== cultist.id && m.hp > 0)
        );
        if (nextStep && (nextStep.x !== player.x || nextStep.y !== player.y)) {
          cultist.facing = EntityAI.getFacing(cultist.x, cultist.y, nextStep.x, nextStep.y);
          cultist.x = nextStep.x;
          cultist.y = nextStep.y;
        }
      }
    }

    return null;
  }

  static findRetreatStep(monster, player, gridMap, allMonsters) {
    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    let bestStep = null;
    let maxDist = Math.hypot(monster.x - player.x, monster.y - player.y);

    for (const dir of directions) {
      const nx = monster.x + dir.x;
      const ny = monster.y + dir.y;

      if (!gridMap.isWalkable(nx, ny)) continue;
      if (nx === player.x && ny === player.y) continue;
      if (allMonsters.some(m => m.id !== monster.id && m.hp > 0 && m.x === nx && m.y === ny)) continue;

      const d = Math.hypot(nx - player.x, ny - player.y);
      if (d > maxDist) {
        maxDist = d;
        bestStep = { x: nx, y: ny };
      }
    }

    return bestStep;
  }

  static findNextStepAStar(start, goal, gridMap, otherMonsters = []) {
    const openSet = [];
    const closedSet = new Set();

    const startNode = {
      x: start.x,
      y: start.y,
      g: 0,
      h: Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y),
      f: Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y),
      parent: null,
    };
    openSet.push(startNode);

    const isBlocked = (x, y) => {
      if (!gridMap.isWalkable(x, y)) return true;
      if (otherMonsters.some(m => m.x === x && m.y === y)) return true;
      return false;
    };

    while (openSet.length > 0) {
      let lowestIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIndex].f) {
          lowestIndex = i;
        }
      }
      const current = openSet.splice(lowestIndex, 1)[0];
      const key = `${current.x},${current.y}`;
      closedSet.add(key);

      if (current.x === goal.x && current.y === goal.y) {
        return EntityAI.reconstructFirstStep(current);
      }

      const neighbors = [
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 },
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
      ];

      for (const neighbor of neighbors) {
        if (!gridMap.isInBounds(neighbor.x, neighbor.y)) continue;
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(neighborKey)) continue;

        if (neighbor.x !== goal.x || neighbor.y !== goal.y) {
          if (isBlocked(neighbor.x, neighbor.y)) continue;
        }

        const gScore = current.g + 1;
        let neighborNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);

        if (!neighborNode) {
          const hScore = Math.abs(neighbor.x - goal.x) + Math.abs(neighbor.y - goal.y);
          neighborNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: gScore,
            h: hScore,
            f: gScore + hScore,
            parent: current,
          };
          openSet.push(neighborNode);
        } else if (gScore < neighborNode.g) {
          neighborNode.g = gScore;
          neighborNode.f = gScore + neighborNode.h;
          neighborNode.parent = current;
        }
      }
    }

    return null;
  }

  static reconstructFirstStep(node) {
    let curr = node;
    while (curr.parent && curr.parent.parent) {
      curr = curr.parent;
    }
    return { x: curr.x, y: curr.y };
  }

  static getFacing(fromX, fromY, toX, toY) {
    if (toX > fromX) return 'right';
    if (toX < fromX) return 'left';
    if (toY > fromY) return 'down';
    return 'up';
  }
}

// ============================================================================
// 6. InventorySystem
// ============================================================================

export class InventorySystem {
  static getMaxStack(itemId) {
    if (itemId === 'health_potion' || itemId === 'mana_potion' || itemId === 'torch') {
      return 9;
    }
    if (itemId === 'arrows') {
      return 99;
    }
    return 1;
  }

  /**
   * Picks up top item on player's current tile into 6-slot backpack.
   */
  static pickUpItem(player, gridMap) {
    const tileItems = gridMap.getItems(player.x, player.y);
    if (tileItems.length === 0) {
      return { success: false, message: 'There is nothing here to pick up.' };
    }

    const groundItem = tileItems[tileItems.length - 1];
    const maxStack = InventorySystem.getMaxStack(groundItem.item_id);
    let totalPickedUp = 0;

    // 1. If stackable, try merging into existing backpack slots
    if (maxStack > 1) {
      for (let i = 0; i < player.backpack.length; i++) {
        const slotItem = player.backpack[i];
        if (slotItem && slotItem.item_id === groundItem.item_id && slotItem.quantity < maxStack) {
          const space = maxStack - slotItem.quantity;
          const toAdd = Math.min(space, groundItem.quantity);
          slotItem.quantity += toAdd;
          groundItem.quantity -= toAdd;
          totalPickedUp += toAdd;

          if (groundItem.quantity <= 0) break;
        }
      }
    }

    // 2. If remainder exists, place into empty backpack slots
    while (groundItem.quantity > 0) {
      const emptyIndex = player.backpack.findIndex(slot => slot === null);
      if (emptyIndex === -1) break;

      const toMove = Math.min(maxStack, groundItem.quantity);
      groundItem.quantity -= toMove;
      totalPickedUp += toMove;

      player.backpack[emptyIndex] = {
        ...groundItem,
        quantity: toMove,
      };
    }

    if (groundItem.quantity <= 0) {
      gridMap.popTopItem(player.x, player.y);
    }

    if (totalPickedUp === 0) {
      return { success: false, message: 'Backpack is full!' };
    }

    return {
      success: true,
      message: `Picked up ${groundItem.name}${totalPickedUp > 1 ? ` (x${totalPickedUp})` : ''}.`,
      item: groundItem,
    };
  }

  /**
   * Drops an item from the backpack onto the dungeon floor.
   */
  static dropItem(player, slotIndex, gridMap) {
    if (slotIndex < 0 || slotIndex >= player.backpack.length) {
      return { success: false, message: 'Invalid backpack slot.' };
    }

    const item = player.backpack[slotIndex];
    if (!item) {
      return { success: false, message: 'Slot is empty.' };
    }

    player.backpack[slotIndex] = null;
    gridMap.addItem(player.x, player.y, item);

    return {
      success: true,
      message: `Dropped ${item.name} on the floor.`,
      item,
    };
  }

  /**
   * Equips an item from a backpack slot into the matching paperdoll slot.
   */
  static equipItem(player, backpackSlotIndex) {
    if (backpackSlotIndex < 0 || backpackSlotIndex >= player.backpack.length) {
      return { success: false, message: 'Invalid backpack slot.' };
    }

    const item = player.backpack[backpackSlotIndex];
    if (!item) {
      return { success: false, message: 'No item in selected slot.' };
    }

    let targetSlot = null;
    if (item.type === 'weapon') {
      targetSlot = 'right_hand';
    } else if (item.type === 'offhand' || item.item_id === 'torch') {
      targetSlot = 'left_hand';
    } else if (item.type === 'armor') {
      targetSlot = 'armor';
    } else {
      return { success: false, message: `${item.name} cannot be equipped.` };
    }

    if (!player.paperdoll) {
      player.paperdoll = { right_hand: null, left_hand: null, armor: null };
    }

    const currentlyEquipped = player.paperdoll[targetSlot];

    // If equipping from stack > 1
    if (item.quantity > 1) {
      item.quantity -= 1;
      player.paperdoll[targetSlot] = {
        ...item,
        quantity: 1,
      };
      if (currentlyEquipped) {
        const emptyIdx = player.backpack.findIndex(s => s === null);
        if (emptyIdx !== -1) {
          player.backpack[emptyIdx] = currentlyEquipped;
        } else {
          item.quantity += 1;
          player.paperdoll[targetSlot] = currentlyEquipped;
          return { success: false, message: 'Cannot swap: Backpack is full!' };
        }
      }
    } else {
      player.paperdoll[targetSlot] = item;
      player.backpack[backpackSlotIndex] = currentlyEquipped;
    }

    const equipMsg = item.item_id === 'torch'
      ? `Lit and equipped Wooden Torch in ${targetSlot.replace('_', ' ')}!`
      : `Equipped ${item.name} in ${targetSlot.replace('_', ' ')}.`;

    return {
      success: true,
      message: equipMsg,
      item: player.paperdoll[targetSlot],
    };
  }

  /**
   * Unequips an item from the paperdoll into the backpack.
   */
  static unequipItem(player, slotName) {
    if (!player.paperdoll || !player.paperdoll[slotName]) {
      return { success: false, message: `No item equipped in ${slotName.replace('_', ' ')}.` };
    }

    const item = player.paperdoll[slotName];
    const maxStack = InventorySystem.getMaxStack(item.item_id);

    if (maxStack > 1) {
      for (let i = 0; i < player.backpack.length; i++) {
        const slotItem = player.backpack[i];
        if (slotItem && slotItem.item_id === item.item_id && slotItem.quantity < maxStack) {
          const space = maxStack - slotItem.quantity;
          const toAdd = Math.min(space, item.quantity);
          slotItem.quantity += toAdd;
          player.paperdoll[slotName] = null;
          return {
            success: true,
            message: `Unequipped ${item.name} and merged into backpack (total: ${slotItem.quantity}).`,
            item: slotItem,
          };
        }
      }
    }

    const emptyIndex = player.backpack.findIndex(slot => slot === null);
    if (emptyIndex === -1) {
      return { success: false, message: 'Cannot unequip: Backpack is full!' };
    }

    player.paperdoll[slotName] = null;
    player.backpack[emptyIndex] = item;

    return {
      success: true,
      message: `Unequipped ${item.name}.`,
      item,
    };
  }

  /**
   * Uses or consumes an item from the backpack slot.
   */
  static useBackpackItem(player, slotIndex) {
    if (slotIndex < 0 || slotIndex >= player.backpack.length) {
      return { success: false, message: 'Invalid backpack slot.' };
    }

    const item = player.backpack[slotIndex];
    if (!item) {
      return { success: false, message: 'Slot is empty.' };
    }

    if (item.type === 'consumable') {
      return InventorySystem.consumeItem(player, item, () => {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          player.backpack[slotIndex] = null;
        }
      });
    }

    if (item.type === 'weapon' || item.type === 'offhand' || item.type === 'armor' || item.item_id === 'torch') {
      return InventorySystem.equipItem(player, slotIndex);
    }

    return { success: false, message: `Cannot use ${item.name}.` };
  }

  /**
   * Uses an item directly from the dungeon floor tile.
   */
  static useGroundItem(player, gridMap, itemIndex = null) {
    const tile = gridMap.getTile(player.x, player.y);
    if (!tile || tile.items.length === 0) {
      return { success: false, message: 'No item on ground to use.' };
    }

    const idx = itemIndex !== null && itemIndex !== undefined ? itemIndex : tile.items.length - 1;
    const item = tile.items[idx];
    if (!item) {
      return { success: false, message: 'Item not found on floor.' };
    }

    if (item.type === 'consumable') {
      return InventorySystem.consumeItem(player, item, () => {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          gridMap.removeItem(player.x, player.y, idx);
        }
      });
    }

    if (item.item_id === 'torch') {
      const prevLeft = player.paperdoll?.left_hand;
      if (!player.paperdoll) player.paperdoll = { right_hand: null, left_hand: null, armor: null };
      player.paperdoll.left_hand = item;
      gridMap.removeItem(player.x, player.y, idx);
      if (prevLeft) {
        gridMap.addItem(player.x, player.y, prevLeft);
      }
      return {
        success: true,
        message: 'Lit and equipped Wooden Torch from floor!',
        item,
      };
    }

    return { success: false, message: `Cannot use ${item.name} directly from floor. Pick it up first.` };
  }

  static consumeItem(player, item, removeCallback) {
    if (item.item_id === 'health_potion') {
      if (player.hp >= player.max_hp) {
        return { success: false, message: 'Health is already full!' };
      }
      const healAmount = item.stat_bonus || CONFIG.HEALTH_POTION_HEAL;
      const restored = Math.min(healAmount, player.max_hp - player.hp);
      player.hp = Math.min(player.max_hp, player.hp + healAmount);
      removeCallback();
      return {
        success: true,
        message: `Drank Health Potion. Restored +${restored} HP (${player.hp}/${player.max_hp}).`,
        item,
      };
    }

    if (item.item_id === 'mana_potion') {
      if (player.mana >= player.max_mana) {
        return { success: false, message: 'Mana is already full!' };
      }
      const restoreAmount = item.stat_bonus || CONFIG.MANA_POTION_RESTORE;
      const restored = Math.min(restoreAmount, player.max_mana - player.mana);
      player.mana = Math.min(player.max_mana, player.mana + restoreAmount);
      removeCallback();
      return {
        success: true,
        message: `Drank Mana Potion. Restored +${restored} MP (${player.mana}/${player.max_mana}).`,
        item,
      };
    }

    return { success: false, message: `Unknown consumable item: ${item.name}` };
  }
}
