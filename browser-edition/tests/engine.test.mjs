/**
 * Lokarta Browser Edition - Comprehensive Test Suite
 * Native Node.js test runner suite covering:
 * 1. Floor Generator (1-20)
 * 2. GridMap & Tile Bounds
 * 3. LightingSystem & LOS
 * 4. ProgressionSystem & Leveling
 * 5. CombatSystem & Abilities
 * 6. InventorySystem & Stacking
 * 7. GameClient & Worker Protocol
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateFloor,
  createPRNG,
  getBiomeForFloor,
  TILE_TYPES as GEN_TILE_TYPES,
  BIOMES,
} from '../floor-generator.js';

import {
  CONFIG,
  TILE_TYPES,
  DEFAULT_ARCHETYPES,
  createPlayer,
  GridMap,
  LightingSystem,
  ProgressionSystem,
  CombatSystem,
  EntityAI,
  InventorySystem,
} from '../engine.js';

import { GameClient } from '../game-client.js';

// ============================================================================
// 1. Floor Generator (1-20)
// ============================================================================

describe('Floor Generator (1-20)', () => {
  it('generates deterministic floors given the same seed', () => {
    const floorA = generateFloor(1, 4242);
    const floorB = generateFloor(1, 4242);

    assert.deepEqual(floorA.tiles, floorB.tiles, 'Tiles matrix should be identical');
    assert.deepEqual(floorA.spawn_coords, floorB.spawn_coords, 'Spawn coords should match');
    assert.deepEqual(floorA.stairs_down_coords, floorB.stairs_down_coords, 'Stairs coords should match');
    assert.equal(floorA.monsters.length, floorB.monsters.length, 'Monster counts should match');
    assert.deepEqual(floorA.items, floorB.items, 'Items should match');
  });

  it('enforces 40x40 matrix boundaries on all floors 1 to 20', () => {
    for (let f = 1; f <= 20; f++) {
      const floor = generateFloor(f);
      assert.equal(floor.width, 40, `Floor ${f} width must be 40`);
      assert.equal(floor.height, 40, `Floor ${f} height must be 40`);
      assert.equal(floor.tiles.length, 40, `Floor ${f} must have 40 tile rows`);
      for (let y = 0; y < 40; y++) {
        assert.equal(floor.tiles[y].length, 40, `Floor ${f} row ${y} must have 40 tile columns`);
      }
    }
  });

  it('places player spawn at (2,2) on a walkable floor tile across all floors', () => {
    for (let f = 1; f <= 20; f++) {
      const floor = generateFloor(f);
      assert.deepEqual(floor.spawn_coords, { x: 2, y: 2 }, `Floor ${f} spawn coords must be (2,2)`);
      assert.equal(floor.tiles[2][2], TILE_TYPES.FLOOR, `Floor ${f} tile at (2,2) must be FLOOR (0)`);
    }
  });

  it('places exit stairs at (35,35) on a stairs tile across all floors', () => {
    for (let f = 1; f <= 20; f++) {
      const floor = generateFloor(f);
      assert.deepEqual(floor.stairs_down_coords, { x: 35, y: 35 }, `Floor ${f} stairs coords must be (35,35)`);
      assert.equal(floor.tiles[35][35], TILE_TYPES.STAIRS, `Floor ${f} tile at (35,35) must be STAIRS (2)`);
    }
  });

  it('guarantees connectivity between spawn (2,2) and stairs (35,35) on all floors', () => {
    for (let f = 1; f <= 20; f++) {
      const floor = generateFloor(f);
      const grid = new GridMap(40, 40);
      grid.loadFromMatrix(floor.tiles);

      // BFS flood fill from (2,2)
      const visited = new Set();
      const queue = [{ x: 2, y: 2 }];
      visited.add('2,2');
      let reachedStairs = false;

      while (queue.length > 0) {
        const { x, y } = queue.shift();
        if (x === 35 && y === 35) {
          reachedStairs = true;
          break;
        }

        const neighbors = [
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 },
        ];

        for (const n of neighbors) {
          const key = `${n.x},${n.y}`;
          if (!visited.has(key) && grid.isWalkable(n.x, n.y)) {
            visited.add(key);
            queue.push(n);
          }
        }
      }

      assert.ok(reachedStairs, `Floor ${f} must have a walkable path from spawn (2,2) to stairs (35,35)`);
    }
  });

  it('assigns correct biomes for floors 1 to 20', () => {
    for (let f = 1; f <= 5; f++) {
      const biome = getBiomeForFloor(f);
      assert.equal(biome.name, BIOMES.CRYPT.name);
    }
    for (let f = 6; f <= 10; f++) {
      const biome = getBiomeForFloor(f);
      assert.equal(biome.name, BIOMES.CATACOMBS.name);
    }
    for (let f = 11; f <= 15; f++) {
      const biome = getBiomeForFloor(f);
      assert.equal(biome.name, BIOMES.SHADOW_VAULTS.name);
    }
    for (let f = 16; f <= 20; f++) {
      const biome = getBiomeForFloor(f);
      assert.equal(biome.name, BIOMES.ABYSSAL_SANCTUM.name);
    }
  });

  it('scales monster types and stats according to floor depth', () => {
    // Floors 1-5: Giant Rats, Crypt Skeletons
    const floor1 = generateFloor(1);
    const rat = floor1.monsters.find(m => m.type === 'giant_rat');
    assert.ok(rat, 'Floor 1 should contain Giant Rats');
    assert.equal(rat.hp, 22, 'Floor 1 Giant Rat HP should be 22');
    assert.equal(rat.attack, 7, 'Floor 1 Giant Rat ATK should be 7');

    // Floors 6-10: Skeletons, Shadow Cultists
    const floor6 = generateFloor(6);
    const cultist = floor6.monsters.find(m => m.type === 'shadow_cultist');
    assert.ok(cultist, 'Floor 6 should contain Shadow Cultists');

    // Floors 11-19: Elite Cultists, Skeletons
    const floor15 = generateFloor(15);
    const elite = floor15.monsters.find(m => m.type === 'elite_cultist');
    assert.ok(elite, 'Floor 15 should contain Elite Shadow Cultists');
    assert.ok(elite.hp > 100, 'Elite Cultist on floor 15 should have scaled HP (>100)');
  });

  it('spawns the Abyssal Overlord boss on Floor 20 with exact stats (600 HP, 20 ATK, 6 DEF)', () => {
    const floor20 = generateFloor(20);
    const boss = floor20.monsters.find(m => m.type === 'abyssal_overlord');

    assert.ok(boss, 'Floor 20 must spawn Abyssal Overlord');
    assert.equal(boss.id, 'f20_boss_overlord');
    assert.equal(boss.hp, 600, 'Abyssal Overlord must have 600 HP');
    assert.equal(boss.max_hp, 600, 'Abyssal Overlord max_hp must be 600');
    assert.equal(boss.attack, 20, 'Abyssal Overlord attack must be 20');
    assert.equal(boss.defense, 6, 'Abyssal Overlord defense must be 6');
    assert.equal(boss.isBoss, true, 'Abyssal Overlord isBoss flag must be true');
    assert.equal(boss.x, 33);
    assert.equal(boss.y, 33);
  });

  it('spawns initial items including potions, torches, and arrows', () => {
    const floor1 = generateFloor(1);
    assert.ok(floor1.items.length >= 5, 'Floor 1 should contain at least 5 item stacks');

    const torch = floor1.items.find(i => i.item_id === 'torch');
    const healthPot = floor1.items.find(i => i.item_id === 'health_potion');
    const manaPot = floor1.items.find(i => i.item_id === 'mana_potion');
    const arrows = floor1.items.find(i => i.item_id === 'arrows');

    assert.ok(torch, 'Floor 1 contains a torch');
    assert.ok(healthPot, 'Floor 1 contains health potions');
    assert.ok(manaPot, 'Floor 1 contains mana potions');
    assert.ok(arrows, 'Floor 1 contains arrows');
    assert.ok(arrows.quantity >= 20, 'Floor 1 arrows quantity >= 20');

    // Milestone floor 5 contains bonus greater potions
    const floor5 = generateFloor(5);
    const bonusPots = floor5.items.filter(i => i.name.includes('Greater'));
    assert.equal(bonusPots.length, 2, 'Floor 5 milestone contains Greater Potions');
  });
});

// ============================================================================
// 2. GridMap & Tile Bounds
// ============================================================================

describe('GridMap & Tile Bounds', () => {
  it('initializes an empty grid with specified dimensions filled with WALL tiles', () => {
    const grid = new GridMap(10, 15);
    assert.equal(grid.width, 10);
    assert.equal(grid.height, 15);
    assert.equal(grid.tiles.length, 15);
    assert.equal(grid.tiles[0].length, 10);
    assert.equal(grid.tiles[0][0].type, TILE_TYPES.WALL);
  });

  it('loads matrix data into grid tiles and assigns correct tile types', () => {
    const matrix = [
      [1, 0, 2, 3],
      [0, 1, 0, 1],
    ];
    const grid = new GridMap(4, 2);
    grid.loadFromMatrix(matrix);

    assert.equal(grid.tiles[0][0].type, TILE_TYPES.WALL);
    assert.equal(grid.tiles[0][1].type, TILE_TYPES.FLOOR);
    assert.equal(grid.tiles[0][2].type, TILE_TYPES.STAIRS);
    assert.equal(grid.tiles[0][3].type, TILE_TYPES.DOOR);
    assert.equal(grid.tiles[1][0].type, TILE_TYPES.FLOOR);
  });

  it('correctly reports boundary checks with isInBounds', () => {
    const grid = new GridMap(40, 40);

    assert.equal(grid.isInBounds(0, 0), true);
    assert.equal(grid.isInBounds(39, 39), true);
    assert.equal(grid.isInBounds(20, 20), true);
    assert.equal(grid.isInBounds(-1, 0), false);
    assert.equal(grid.isInBounds(0, -1), false);
    assert.equal(grid.isInBounds(40, 0), false);
    assert.equal(grid.isInBounds(0, 40), false);
    assert.equal(grid.isInBounds(100, 100), false);
  });

  it('identifies walkable, wall, stairs, and door tiles accurately', () => {
    const matrix = [
      [1, 0, 2, 3],
    ];
    const grid = new GridMap(4, 1);
    grid.loadFromMatrix(matrix);

    // Wall (0,0)
    assert.equal(grid.isWall(0, 0), true);
    assert.equal(grid.isWalkable(0, 0), false);
    assert.equal(grid.isStairs(0, 0), false);
    assert.equal(grid.isDoor(0, 0), false);

    // Floor (1,0)
    assert.equal(grid.isWall(1, 0), false);
    assert.equal(grid.isWalkable(1, 0), true);
    assert.equal(grid.isStairs(1, 0), false);
    assert.equal(grid.isDoor(1, 0), false);

    // Stairs (2,0)
    assert.equal(grid.isWall(2, 0), false);
    assert.equal(grid.isWalkable(2, 0), true);
    assert.equal(grid.isStairs(2, 0), true);
    assert.equal(grid.isDoor(2, 0), false);

    // Door (3,0)
    assert.equal(grid.isWall(3, 0), false);
    assert.equal(grid.isWalkable(3, 0), true);
    assert.equal(grid.isStairs(3, 0), false);
    assert.equal(grid.isDoor(3, 0), true);

    // Out of bounds
    assert.equal(grid.isWall(-1, 0), true);
    assert.equal(grid.isWalkable(-1, 0), false);
    assert.equal(grid.isStairs(10, 0), false);
    assert.equal(grid.isDoor(10, 0), false);
  });

  it('manages tile items (add, get, pop, remove)', () => {
    const grid = new GridMap(10, 10);
    const item1 = { item_id: 'torch', name: 'Torch', quantity: 1 };
    const item2 = { item_id: 'potion', name: 'Potion', quantity: 2 };

    grid.addItem(3, 3, item1);
    grid.addItem(3, 3, item2);

    assert.equal(grid.getItems(3, 3).length, 2);
    assert.deepEqual(grid.getItems(3, 3)[0], item1);
    assert.deepEqual(grid.getItems(3, 3)[1], item2);

    const popped = grid.popTopItem(3, 3);
    assert.deepEqual(popped, item2);
    assert.equal(grid.getItems(3, 3).length, 1);

    const removed = grid.removeItem(3, 3, 0);
    assert.deepEqual(removed, item1);
    assert.equal(grid.getItems(3, 3).length, 0);
    assert.equal(grid.popTopItem(3, 3), null);
    assert.equal(grid.removeItem(3, 3, 0), null);
  });
});

// ============================================================================
// 3. LightingSystem & LOS
// ============================================================================

describe('LightingSystem & LOS', () => {
  it('computes player vision radius correctly (base: 3, torch: 7, light spell: 6)', () => {
    const player = createPlayer('magician');

    // 1. Base vision (no torch equipped)
    player.paperdoll.left_hand = null;
    player.paperdoll.right_hand = null;
    player.lightSpellTimer = 0;
    assert.equal(LightingSystem.computePlayerRadius(player), CONFIG.BASE_LIGHT_RADIUS); // 3

    // 2. Torch equipped in left_hand
    player.paperdoll.left_hand = { item_id: 'torch' };
    assert.equal(LightingSystem.computePlayerRadius(player), CONFIG.TORCH_LIGHT_RADIUS); // 7

    // 3. Torch equipped in right_hand
    player.paperdoll.left_hand = null;
    player.paperdoll.right_hand = { item_id: 'torch' };
    assert.equal(LightingSystem.computePlayerRadius(player), CONFIG.TORCH_LIGHT_RADIUS); // 7

    // 4. Light spell active (timer > 0) overrides torch / base
    player.lightSpellTimer = 15;
    assert.equal(LightingSystem.computePlayerRadius(player), CONFIG.LIGHT_SPELL_RADIUS); // 6
  });

  it('generates accurate Bresenham lines between coordinates', () => {
    const horizontalLine = LightingSystem.getBresenhamLine(2, 2, 5, 2);
    assert.deepEqual(horizontalLine, [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 5, y: 2 },
    ]);

    const verticalLine = LightingSystem.getBresenhamLine(2, 2, 2, 5);
    assert.deepEqual(verticalLine, [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
      { x: 2, y: 5 },
    ]);

    const diagonalLine = LightingSystem.getBresenhamLine(1, 1, 3, 3);
    assert.deepEqual(diagonalLine, [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]);
  });

  it('detects unblocked vs wall-occluded line of sight', () => {
    const matrix = [
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0], // Wall at (2,1)
      [0, 0, 0, 0, 0],
    ];
    const grid = new GridMap(5, 3);
    grid.loadFromMatrix(matrix);

    // Unblocked horizontal line on row 0: (0,0) to (4,0)
    assert.equal(LightingSystem.hasLineOfSight(grid, 0, 0, 4, 0), true);

    // Blocked line passing through wall at (2,1): (0,1) to (4,1)
    assert.equal(LightingSystem.hasLineOfSight(grid, 0, 1, 4, 1), false);

    // Line terminating on the wall itself: (0,1) to (2,1) is valid LOS to the wall
    assert.equal(LightingSystem.hasLineOfSight(grid, 0, 1, 2, 1), true);
  });

  it('casts light circle and stops ray propagation past walls', () => {
    const matrix = [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0], // Wall at (3,2)
      [0, 0, 0, 0, 0, 0, 0],
    ];
    const grid = new GridMap(7, 4);
    grid.loadFromMatrix(matrix);

    // Cast light from (1,2) with radius 5
    LightingSystem.castLightCircle(grid, 1, 2, 5);

    // Origin is lit
    assert.equal(grid.getTile(1, 2).isLit, true);
    // Tile before wall is lit
    assert.equal(grid.getTile(2, 2).isLit, true);
    // Wall tile itself is illuminated
    assert.equal(grid.getTile(3, 2).isLit, true);
    // Tile directly behind wall along horizontal ray should NOT be lit
    assert.equal(grid.getTile(4, 2).isLit, false);
    assert.equal(grid.getTile(5, 2).isLit, false);
  });

  it('updates lighting, ambient emitters, and light-triggered aggro on monsters', () => {
    const grid = new GridMap(20, 20);
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        grid.tiles[y][x].type = TILE_TYPES.FLOOR;
      }
    }

    const player = createPlayer('magician');
    player.x = 5;
    player.y = 5;
    player.paperdoll.left_hand = null;
    player.paperdoll.right_hand = null;
    player.lightSpellTimer = 0; // Base vision: 3 tiles

    const monsterNear = { id: 'm1', x: 6, y: 5, visible: false, isAggroed: false };
    const monsterFar = { id: 'm2', x: 15, y: 15, visible: false, isAggroed: false };
    const ambientLights = [{ x: 15, y: 15, radius: 2, color: '#ff8800' }];

    LightingSystem.updateLighting(grid, player, ambientLights, [monsterNear, monsterFar]);

    // Near monster is lit by player and aggroed
    assert.equal(monsterNear.visible, true);
    assert.equal(monsterNear.isAggroed, true);

    // Far monster is lit by ambient light emitter
    assert.equal(monsterFar.visible, true);
  });
});

// ============================================================================
// 4. ProgressionSystem & Leveling
// ============================================================================

describe('ProgressionSystem & Leveling', () => {
  it('calculates XP thresholds for Levels 1 to 20 as level * 100', () => {
    for (let lvl = 1; lvl <= 20; lvl++) {
      assert.equal(ProgressionSystem.getXpForLevel(lvl), lvl * 100, `Level ${lvl} XP should be ${lvl * 100}`);
    }
  });

  it('calculates correct monster XP formulas across enemy types and floors', () => {
    // Giant Rat: 20 + floor * 4
    assert.equal(ProgressionSystem.getMonsterXp('giant_rat', 1), 24);
    assert.equal(ProgressionSystem.getMonsterXp('giant_rat', 5), 40);

    // Crypt Skeleton: 35 + (floor - 1) * 8
    assert.equal(ProgressionSystem.getMonsterXp('crypt_skeleton', 1), 35);
    assert.equal(ProgressionSystem.getMonsterXp('crypt_skeleton', 6), 75);

    // Shadow Cultist: 45 + (floor - 1) * 10
    assert.equal(ProgressionSystem.getMonsterXp('shadow_cultist', 6), 95);

    // Elite Cultist: 65 + (floor - 1) * 12
    assert.equal(ProgressionSystem.getMonsterXp('elite_cultist', 11), 185);

    // Abyssal Overlord Boss: 500
    assert.equal(ProgressionSystem.getMonsterXp('abyssal_overlord', 20, true), 500);
    assert.equal(ProgressionSystem.getMonsterXp('boss_overlord', 20), 500);
  });

  it('computes skill boosts for Magician and Archer based on level', () => {
    // Magician Lv 1
    const magBoost1 = ProgressionSystem.computeSkillBoosts('magician', 1);
    assert.equal(magBoost1.damageMultiplier, 1.0);
    assert.equal(magBoost1.bonusRange, 0);
    assert.equal(magBoost1.bonusRegen, 0);

    // Magician Lv 5 (levelDelta = 4) -> mult: 1.0 + 4 * 0.10 = 1.4, bonusRange: 1, bonusRegen: 1
    const magBoost5 = ProgressionSystem.computeSkillBoosts('magician', 5);
    assert.equal(magBoost5.damageMultiplier, 1.4);
    assert.equal(magBoost5.bonusRange, 1);
    assert.equal(magBoost5.bonusRegen, 1);

    // Archer Lv 1
    const archBoost1 = ProgressionSystem.computeSkillBoosts('archer', 1);
    assert.equal(archBoost1.damageMultiplier, 1.0);
    assert.equal(archBoost1.bonusRange, 0);
    assert.equal(archBoost1.bonusRegen, 0);

    // Archer Lv 5 (levelDelta = 4) -> mult: 1.0 + 4 * 0.12 = 1.48
    const archBoost5 = ProgressionSystem.computeSkillBoosts('archer', 5);
    assert.equal(archBoost5.damageMultiplier, 1.48);
    assert.equal(archBoost5.bonusRange, 1);
    assert.equal(archBoost5.bonusRegen, 1);
  });

  it('awards XP, triggers level-up, increases Magician stats (+8 HP, +16 Mana), and restores vitals', () => {
    const player = createPlayer('magician');
    player.hp = 20; // Damaged
    player.mana = 10;

    assert.equal(player.level, 1);
    assert.equal(player.max_hp, 60);
    assert.equal(player.max_mana, 120);

    const result = ProgressionSystem.awardXP(player, 100);

    assert.equal(result.leveledUp, true);
    assert.equal(result.oldLevel, 1);
    assert.equal(result.newLevel, 2);
    assert.equal(result.hpGained, 8);
    assert.equal(result.manaGained, 16);

    assert.equal(player.level, 2);
    assert.equal(player.max_hp, 68);
    assert.equal(player.max_mana, 136);
    // Full restorative surge
    assert.equal(player.hp, 68);
    assert.equal(player.mana, 136);
    assert.equal(player.xp, 0);
    assert.equal(player.xpToNextLevel, 200);
  });

  it('awards XP, triggers level-up, and increases Archer stats (+14 HP, +8 Mana)', () => {
    const player = createPlayer('archer');
    assert.equal(player.level, 1);
    assert.equal(player.max_hp, 90);
    assert.equal(player.max_mana, 60);

    const result = ProgressionSystem.awardXP(player, 100);

    assert.equal(result.leveledUp, true);
    assert.equal(result.newLevel, 2);
    assert.equal(result.hpGained, 14);
    assert.equal(result.manaGained, 8);

    assert.equal(player.max_hp, 104);
    assert.equal(player.max_mana, 68);
    assert.equal(player.hp, 104);
    assert.equal(player.mana, 68);
  });

  it('handles multi-level progression when large XP amounts are awarded', () => {
    const player = createPlayer('magician');
    // Lv 1 needs 100 (total 100), Lv 2 needs 200 (total 300), Lv 3 needs 300.
    // Awarding 350 XP -> reaches Lv 3 with 50 XP remainder.
    const result = ProgressionSystem.awardXP(player, 350);

    assert.equal(result.leveledUp, true);
    assert.equal(result.oldLevel, 1);
    assert.equal(result.newLevel, 3);
    assert.equal(player.level, 3);
    assert.equal(player.xp, 50);
    assert.equal(player.xpToNextLevel, 300);
    assert.equal(player.max_hp, 60 + 8 * 2);
    assert.equal(player.max_mana, 120 + 16 * 2);
  });

  it('respects MAX_LEVEL cap of 20 and prevents exceeding it', () => {
    const player = createPlayer('magician');
    ProgressionSystem.awardXP(player, 100000); // Huge XP

    assert.equal(player.level, 20);
    const resultAfterCap = ProgressionSystem.awardXP(player, 500);
    assert.equal(resultAfterCap.leveledUp, false);
    assert.equal(player.level, 20);
  });
});

// ============================================================================
// 5. CombatSystem & Abilities
// ============================================================================

describe('CombatSystem & Abilities', () => {
  let grid;

  beforeEach(() => {
    grid = new GridMap(20, 20);
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        grid.tiles[y][x].type = TILE_TYPES.FLOOR;
      }
    }
  });

  it('decrements player cooldowns and spell timers properly', () => {
    const player = createPlayer('magician');
    player.cooldowns.wand_spark = 1.0;
    player.cooldowns.light = 5.0;
    player.lightSpellTimer = 30.0;

    CombatSystem.decrementCooldowns(player, 0.4);
    CombatSystem.decrementSpellTimers(player, 5.0);

    assert.equal(Number(player.cooldowns.wand_spark.toFixed(1)), 0.6);
    assert.equal(Number(player.cooldowns.light.toFixed(1)), 4.6);
    assert.equal(player.lightSpellTimer, 25.0);

    CombatSystem.decrementCooldowns(player, 2.0);
    assert.equal(player.cooldowns.wand_spark, 0);
  });

  it('handles arrow consumption and depletion for Archer', () => {
    const player = createPlayer('archer');
    const arrowSlot = CombatSystem.findArrowItem(player);
    assert.ok(arrowSlot);
    assert.equal(arrowSlot.item.quantity, 15);

    const consumed = CombatSystem.consumeArrow(player);
    assert.equal(consumed, true);
    assert.equal(player.backpack[0].quantity, 14);

    // Set arrows to 1 and consume -> slot should clear to null
    player.backpack[0].quantity = 1;
    const consumedLast = CombatSystem.consumeArrow(player);
    assert.equal(consumedLast, true);
    assert.equal(player.backpack[0], null);

    // Consume when out of arrows -> returns false
    const consumedEmpty = CombatSystem.consumeArrow(player);
    assert.equal(consumedEmpty, false);
  });

  it('executes Magician Wand Spark (range, cooldown, damage, target kill & loot)', () => {
    const player = createPlayer('magician');
    player.x = 2;
    player.y = 2;

    const monster = {
      id: 'm1',
      name: 'Crypt Skeleton',
      type: 'crypt_skeleton',
      x: 4,
      y: 2,
      hp: 10,
      max_hp: 40,
    };

    // 1. Success execution
    const res = CombatSystem.executeWandSpark(player, monster, grid);
    assert.equal(res.success, true);
    assert.ok(res.damageDealt >= CONFIG.MAGICIAN_SPARK_DAMAGE_MIN);
    assert.equal(player.cooldowns.wand_spark, CONFIG.MAGICIAN_SPARK_COOLDOWN_SEC);
    assert.equal(res.defeatedMonsterId, 'm1');
    assert.ok(Array.isArray(res.droppedLoot));

    // 2. Cooldown rejection
    const cdRes = CombatSystem.executeWandSpark(player, monster, grid);
    assert.equal(cdRes.success, false);
    assert.ok(cdRes.message.includes('cooldown'));

    // 3. Range rejection
    player.cooldowns.wand_spark = 0;
    const farMonster = { id: 'm2', x: 15, y: 15, hp: 50 };
    const rangeRes = CombatSystem.executeWandSpark(player, farMonster, grid);
    assert.equal(rangeRes.success, false);
    assert.ok(rangeRes.message.includes('range'));

    // 4. LOS blocked rejection
    const targetAcrossWall = { id: 'm3', x: 5, y: 2, hp: 50 };
    grid.tiles[2][3].type = TILE_TYPES.WALL; // Place wall between (2,2) and (5,2)
    const losRes = CombatSystem.executeWandSpark(player, targetAcrossWall, grid);
    assert.equal(losRes.success, false);
    assert.ok(losRes.message.includes('sight'));
  });

  it('executes Magician Light Spell (mana cost, duration, cooldown)', () => {
    const player = createPlayer('magician');
    player.mana = 100;

    const res = CombatSystem.executeLightSpell(player);
    assert.equal(res.success, true);
    assert.equal(player.mana, 100 - CONFIG.MAGICIAN_LIGHT_MANA_COST);
    assert.equal(player.lightSpellTimer, CONFIG.LIGHT_SPELL_DURATION_SEC);
    assert.equal(player.cooldowns.light, CONFIG.MAGICIAN_LIGHT_COOLDOWN_SEC);

    // Cooldown check
    const cdRes = CombatSystem.executeLightSpell(player);
    assert.equal(cdRes.success, false);

    // Mana check
    player.cooldowns.light = 0;
    player.mana = 5;
    const manaRes = CombatSystem.executeLightSpell(player);
    assert.equal(manaRes.success, false);
    assert.ok(manaRes.message.includes('Mana'));
  });

  it('executes Magician Energy Beam piercing ability across lined-up enemies', () => {
    const player = createPlayer('magician');
    player.x = 2;
    player.y = 5;
    player.facing = 'right';
    player.mana = 100;

    const monster1 = { id: 'm1', name: 'Skeleton 1', type: 'crypt_skeleton', x: 3, y: 5, hp: 50 };
    const monster2 = { id: 'm2', name: 'Skeleton 2', type: 'crypt_skeleton', x: 4, y: 5, hp: 50 };
    const monster3 = { id: 'm3', name: 'Off-Axis Monster', type: 'crypt_skeleton', x: 4, y: 6, hp: 50 };

    const res = CombatSystem.executeEnergyBeam(player, 'right', grid, [monster1, monster2, monster3]);

    assert.equal(res.success, true);
    assert.equal(player.mana, 100 - CONFIG.MAGICIAN_BEAM_MANA_COST);
    assert.ok(monster1.hp < 50, 'Monster 1 on beam path must take damage');
    assert.ok(monster2.hp < 50, 'Monster 2 on beam path must take damage');
    assert.equal(monster3.hp, 50, 'Monster off beam path takes no damage');
    assert.equal(player.cooldowns.energy_beam, CONFIG.MAGICIAN_BEAM_COOLDOWN_SEC);
  });

  it('executes Archer Bow Shot (arrow consumption, cooldown, damage)', () => {
    const player = createPlayer('archer');
    player.x = 2;
    player.y = 2;

    const monster = {
      id: 'm1',
      name: 'Giant Rat',
      type: 'giant_rat',
      x: 5,
      y: 2,
      hp: 30,
      max_hp: 30,
    };

    const initialArrows = player.backpack[0].quantity;
    const res = CombatSystem.executeBowShot(player, monster, grid);

    assert.equal(res.success, true);
    assert.ok(res.damageDealt >= CONFIG.ARCHER_BOW_DAMAGE_MIN);
    assert.equal(player.backpack[0].quantity, initialArrows - 1);
    assert.equal(player.cooldowns.bow_shot, CONFIG.ARCHER_BOW_COOLDOWN_SEC);

    // Rejection without arrows
    player.cooldowns.bow_shot = 0;
    player.backpack[0] = null;
    const noArrowRes = CombatSystem.executeBowShot(player, monster, grid);
    assert.equal(noArrowRes.success, false);
    assert.ok(noArrowRes.message.includes('arrows'));
  });

  it('executes Archer Power Shot (heavy damage, 4s cooldown)', () => {
    const player = createPlayer('archer');
    player.x = 2;
    player.y = 2;

    const monster = {
      id: 'm1',
      name: 'Crypt Skeleton',
      type: 'crypt_skeleton',
      x: 5,
      y: 2,
      hp: 50,
      max_hp: 50,
    };

    const res = CombatSystem.executePowerShot(player, monster, grid);

    assert.equal(res.success, true);
    assert.ok(res.damageDealt >= CONFIG.ARCHER_POWER_SHOT_DAMAGE_MIN);
    assert.equal(player.cooldowns.power_shot, CONFIG.ARCHER_POWER_SHOT_COOLDOWN_SEC);
  });

  it('generates appropriate monster loot drops', () => {
    const ratLoot = CombatSystem.generateMonsterLoot({ type: 'giant_rat' });
    assert.ok(Array.isArray(ratLoot));

    const bossLoot = CombatSystem.generateMonsterLoot({ type: 'abyssal_overlord' });
    assert.equal(bossLoot.length, 2);
    assert.ok(bossLoot.some(i => i.item_id === 'mana_potion'));
    assert.ok(bossLoot.some(i => i.item_id === 'health_potion'));
  });
});

// ============================================================================
// 6. InventorySystem & Stacking
// ============================================================================

describe('InventorySystem & Stacking', () => {
  let grid;

  beforeEach(() => {
    grid = new GridMap(10, 10);
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        grid.tiles[y][x].type = TILE_TYPES.FLOOR;
      }
    }
  });

  it('defines max stack limits (Potions/Torches: 9, Arrows: 99, Equipment: 1)', () => {
    assert.equal(InventorySystem.getMaxStack('health_potion'), 9);
    assert.equal(InventorySystem.getMaxStack('mana_potion'), 9);
    assert.equal(InventorySystem.getMaxStack('torch'), 9);
    assert.equal(InventorySystem.getMaxStack('arrows'), 99);
    assert.equal(InventorySystem.getMaxStack('wooden_bow'), 1);
    assert.equal(InventorySystem.getMaxStack('leather_armor'), 1);
  });

  it('picks up items into 6-slot backpack and enforces max capacity', () => {
    const player = createPlayer('magician');
    // Clear backpack completely
    player.backpack = [null, null, null, null, null, null];
    player.x = 2;
    player.y = 2;

    const pot = { item_id: 'health_potion', name: 'Health Potion', type: 'consumable', quantity: 3, stat_bonus: 30 };
    grid.addItem(2, 2, pot);

    const res = InventorySystem.pickUpItem(player, grid);
    assert.equal(res.success, true);
    assert.equal(player.backpack[0].quantity, 3);
    assert.equal(grid.getItems(2, 2).length, 0);

    // Fill all 6 slots
    for (let i = 1; i < 6; i++) {
      player.backpack[i] = { item_id: `item_${i}`, name: `Item ${i}`, type: 'misc', quantity: 1 };
    }

    // Try picking up another distinct item when full
    const extraItem = { item_id: 'sword', name: 'Sword', type: 'weapon', quantity: 1 };
    grid.addItem(2, 2, extraItem);

    const fullRes = InventorySystem.pickUpItem(player, grid);
    assert.equal(fullRes.success, false);
    assert.ok(fullRes.message.includes('full'));
  });

  it('stacks stackable items (potions, torches) up to stack limit of 9', () => {
    const player = createPlayer('magician');
    player.backpack = [
      { item_id: 'health_potion', name: 'Health Potion', type: 'consumable', quantity: 7, stat_bonus: 30 },
      null, null, null, null, null,
    ];
    player.x = 2;
    player.y = 2;

    // Add 5 health potions to ground -> 2 merge into slot 0 (reaching 9), 3 go to slot 1
    const groundPots = { item_id: 'health_potion', name: 'Health Potion', type: 'consumable', quantity: 5, stat_bonus: 30 };
    grid.addItem(2, 2, groundPots);

    const res = InventorySystem.pickUpItem(player, grid);
    assert.equal(res.success, true);
    assert.equal(player.backpack[0].quantity, 9);
    assert.equal(player.backpack[1].quantity, 3);
    assert.equal(grid.getItems(2, 2).length, 0);
  });

  it('drops items from backpack onto dungeon floor', () => {
    const player = createPlayer('magician');
    player.x = 4;
    player.y = 4;
    const itemToDrop = player.backpack[0];

    const res = InventorySystem.dropItem(player, 0, grid);
    assert.equal(res.success, true);
    assert.equal(player.backpack[0], null);
    assert.deepEqual(grid.getItems(4, 4)[0], itemToDrop);
  });

  it('equips items to paperdoll slots (weapons -> right_hand, torch/offhand -> left_hand, armor -> armor) and handles swapping', () => {
    const player = createPlayer('magician');
    player.paperdoll = { right_hand: null, left_hand: null, armor: null };
    player.backpack = [
      { item_id: 'wooden_bow', name: 'Wooden Bow', type: 'weapon', quantity: 1 },
      { item_id: 'torch', name: 'Wooden Torch', type: 'offhand', quantity: 1 },
      { item_id: 'leather_armor', name: 'Leather Armor', type: 'armor', quantity: 1 },
      null, null, null,
    ];

    // 1. Equip weapon -> right_hand
    const eqWeapon = InventorySystem.equipItem(player, 0);
    assert.equal(eqWeapon.success, true);
    assert.equal(player.paperdoll.right_hand.item_id, 'wooden_bow');
    assert.equal(player.backpack[0], null);

    // 2. Equip torch -> left_hand
    const eqTorch = InventorySystem.equipItem(player, 1);
    assert.equal(eqTorch.success, true);
    assert.equal(player.paperdoll.left_hand.item_id, 'torch');
    assert.equal(player.backpack[1], null);

    // 3. Equip armor -> armor
    const eqArmor = InventorySystem.equipItem(player, 2);
    assert.equal(eqArmor.success, true);
    assert.equal(player.paperdoll.armor.item_id, 'leather_armor');
    assert.equal(player.backpack[2], null);

    // 4. Swap weapon
    player.backpack[0] = { item_id: 'magic_staff', name: 'Magic Staff', type: 'weapon', quantity: 1 };
    const swapWeapon = InventorySystem.equipItem(player, 0);
    assert.equal(swapWeapon.success, true);
    assert.equal(player.paperdoll.right_hand.item_id, 'magic_staff');
    assert.equal(player.backpack[0].item_id, 'wooden_bow');
  });

  it('unequips items from paperdoll into backpack', () => {
    const player = createPlayer('magician');
    player.paperdoll.right_hand = { item_id: 'apprentice_wand', name: 'Apprentice Wand', type: 'weapon', quantity: 1 };
    player.backpack = [null, null, null, null, null, null];

    const res = InventorySystem.unequipItem(player, 'right_hand');
    assert.equal(res.success, true);
    assert.equal(player.paperdoll.right_hand, null);
    assert.equal(player.backpack[0].item_id, 'apprentice_wand');

    // Fails when backpack is full
    player.paperdoll.right_hand = { item_id: 'apprentice_wand', name: 'Apprentice Wand', type: 'weapon', quantity: 1 };
    player.backpack = [1, 2, 3, 4, 5, 6].map(i => ({ item_id: `item_${i}`, quantity: 1 }));
    const fullRes = InventorySystem.unequipItem(player, 'right_hand');
    assert.equal(fullRes.success, false);
    assert.ok(fullRes.message.includes('full'));
  });

  it('consumes health and mana potions from backpack, restores vitals, and updates quantity', () => {
    const player = createPlayer('magician');
    player.hp = 30; // Max 60
    player.mana = 50; // Max 120
    player.backpack = [
      { item_id: 'health_potion', name: 'Health Potion', type: 'consumable', quantity: 2, stat_bonus: 30 },
      { item_id: 'mana_potion', name: 'Mana Potion', type: 'consumable', quantity: 1, stat_bonus: 40 },
      null, null, null, null,
    ];

    // Drink health potion (+30 HP)
    const hpRes = InventorySystem.useBackpackItem(player, 0);
    assert.equal(hpRes.success, true);
    assert.equal(player.hp, 60);
    assert.equal(player.backpack[0].quantity, 1);

    // Drink health potion when full -> fails
    const fullHpRes = InventorySystem.useBackpackItem(player, 0);
    assert.equal(fullHpRes.success, false);
    assert.ok(fullHpRes.message.includes('full'));

    // Drink mana potion (+40 MP) -> clears slot
    const mpRes = InventorySystem.useBackpackItem(player, 1);
    assert.equal(mpRes.success, true);
    assert.equal(player.mana, 90);
    assert.equal(player.backpack[1], null);
  });
});

// ============================================================================
// 7. GameClient & Worker Protocol
// ============================================================================

describe('GameClient & Worker Protocol', () => {
  class MockWorker {
    constructor() {
      this.onmessage = null;
      this.onerror = null;
      this.sentMessages = [];
      this.isTerminated = false;
    }

    postMessage(msg) {
      this.sentMessages.push(msg);
      const { id, command, payload } = msg;

      // Handle simulated responses asynchronously
      queueMicrotask(() => {
        if (this.isTerminated) return;

        if (command === 'bootstrap') {
          this.onmessage?.({
            data: {
              id,
              ok: true,
              data: {
                player: createPlayer('magician'),
                profile: { id: 'default_profile', soundEnabled: true },
                activeFloor: generateFloor(1),
              },
            },
          });
        } else if (command === 'newGame') {
          this.onmessage?.({
            data: {
              id,
              ok: true,
              data: {
                player: createPlayer(payload.vocation || 'magician'),
                floor: generateFloor(1),
              },
            },
          });
        } else if (command === 'saveCharacter') {
          this.onmessage?.({
            data: {
              id,
              ok: true,
              data: { success: true, savedAt: new Date().toISOString() },
            },
          });
        } else if (command === 'getFloor') {
          this.onmessage?.({
            data: {
              id,
              ok: true,
              data: generateFloor(payload.floorNumber || 1),
            },
          });
        } else if (command === 'advanceFloor') {
          const fn = (payload.player?.current_floor || 1) + 1;
          const updatedPlayer = { ...payload.player, current_floor: fn };
          this.onmessage?.({
            data: {
              id,
              ok: true,
              data: { player: updatedPlayer, floor: generateFloor(fn) },
            },
          });
        } else if (command === 'setSoundEnabled') {
          this.onmessage?.({
            data: {
              id,
              ok: true,
              data: { soundEnabled: payload.soundEnabled },
            },
          });
        } else if (command === 'resetProgress') {
          this.onmessage?.({
            data: {
              id,
              ok: true,
              data: { success: true },
            },
          });
        } else if (command === 'errorCommand') {
          this.onmessage?.({
            data: {
              id,
              ok: false,
              error: 'Simulated worker failure.',
            },
          });
        } else if (command === 'ignoreCommand') {
          // Do nothing to test timeout
        }
      });
    }

    terminate() {
      this.isTerminated = true;
    }
  }

  it('serializes requests and deserializes successful RPC responses', async () => {
    const mockWorker = new MockWorker();
    const client = new GameClient(mockWorker);

    const bootstrapData = await client.bootstrap();
    assert.ok(bootstrapData.player);
    assert.ok(bootstrapData.profile);
    assert.ok(bootstrapData.activeFloor);

    const newGameData = await client.newGame('archer');
    assert.equal(newGameData.player.vocation, 'archer');
    assert.equal(newGameData.floor.floor_number, 1);

    const saveData = await client.saveCharacter(newGameData.player);
    assert.equal(saveData.success, true);

    const floor3 = await client.getFloor(3);
    assert.equal(floor3.floor_number, 3);

    const advanceData = await client.advanceFloor(newGameData.player, 2);
    assert.equal(advanceData.player.current_floor, 2);
    assert.equal(advanceData.floor.floor_number, 2);

    const soundData = await client.setSoundEnabled(false);
    assert.equal(soundData.soundEnabled, false);

    const resetData = await client.resetProgress();
    assert.equal(resetData.success, true);

    client.terminate();
  });

  it('handles worker error responses gracefully', async () => {
    const mockWorker = new MockWorker();
    const client = new GameClient(mockWorker);

    await assert.rejects(
      async () => {
        await client.request('errorCommand');
      },
      {
        name: 'Error',
        message: 'Simulated worker failure.',
      }
    );

    client.terminate();
  });

  it('handles worker request timeout', async () => {
    const mockWorker = new MockWorker();
    const client = new GameClient(mockWorker, { timeout: 50 });

    await assert.rejects(
      async () => {
        await client.request('ignoreCommand', {}, 50);
      },
      /timed out after 50ms/
    );

    client.terminate();
  });

  it('handles unhandled worker runtime onerror events', async () => {
    const mockWorker = new MockWorker();
    const client = new GameClient(mockWorker);

    const pendingPromise = client.request('ignoreCommand', {}, 5000);

    // Trigger runtime worker error
    mockWorker.onerror?.({ message: 'Fatal syntax error in worker script.' });

    await assert.rejects(
      async () => {
        await pendingPromise;
      },
      /Fatal syntax error/
    );

    client.terminate();
  });

  it('terminates client and rejects all pending promises cleanly', async () => {
    const mockWorker = new MockWorker();
    const client = new GameClient(mockWorker);

    const pendingPromise = client.request('ignoreCommand', {}, 5000);
    client.terminate();

    await assert.rejects(
      async () => {
        await pendingPromise;
      },
      /GameClient was terminated/
    );
  });
});
