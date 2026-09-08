import { describe, it, expect, beforeEach } from 'vitest';
import { GridMap } from '../src/engine/GridMap';
import { LightingSystem } from '../src/engine/LightingSystem';
import { CombatSystem } from '../src/engine/CombatSystem';
import { EntityAI } from '../src/engine/EntityAI';
import { InventorySystem } from '../src/engine/InventorySystem';
import { PlayerEntity, MonsterEntity } from '../src/types/entity';
import { TileType } from '../src/types/world';
import { CONFIG } from '../src/config';

describe('Frontend Engine Test Suite', () => {
  let gridMap: GridMap;
  let player: PlayerEntity;

  beforeEach(() => {
    gridMap = new GridMap(10, 10);
    // Initialize 10x10 walkable room surrounded by walls
    const matrix: number[][] = [];
    for (let y = 0; y < 10; y++) {
      const row: number[] = [];
      for (let x = 0; x < 10; x++) {
        if (x === 0 || x === 9 || y === 0 || y === 9) {
          row.push(1); // Wall
        } else if (x === 8 && y === 8) {
          row.push(2); // Stairs
        } else {
          row.push(0); // Floor
        }
      }
      matrix.push(row);
    }
    gridMap.loadFromMatrix(matrix);

    player = {
      id: 'magician',
      vocation: 'magician',
      x: 2,
      y: 2,
      facing: 'down',
      hp: 60,
      max_hp: 60,
      mana: 120,
      max_mana: 120,
      current_floor: 1,
      paperdoll: { right_hand: null, left_hand: null, armor: null },
      backpack: [null, null, null, null, null, null],
      lightSpellTimer: 0,
      cooldowns: {},
    };
  });

  describe('GridMap & Collision', () => {
    it('correctly reports walkable floor and blocking walls', () => {
      expect(gridMap.isWalkable(2, 2)).toBe(true);
      expect(gridMap.isWall(0, 0)).toBe(true);
      expect(gridMap.isWalkable(0, 0)).toBe(false);
      expect(gridMap.isStairs(8, 8)).toBe(true);
    });

    it('handles floor item stacking and popping', () => {
      gridMap.addItem(2, 2, {
        item_id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        quantity: 1,
        stat_bonus: 30,
      });
      gridMap.addItem(2, 2, {
        item_id: 'torch',
        name: 'Wooden Torch',
        type: 'offhand',
        quantity: 1,
        stat_bonus: 5,
      });

      expect(gridMap.getItems(2, 2).length).toBe(2);
      const popped = gridMap.popTopItem(2, 2);
      expect(popped?.item_id).toBe('torch');
      expect(gridMap.getItems(2, 2).length).toBe(1);
    });
  });

  describe('LightingSystem & Line of Sight', () => {
    it('computes correct light radii for base, torch, and spell aura', () => {
      expect(LightingSystem.computePlayerRadius(player)).toBe(CONFIG.BASE_LIGHT_RADIUS);

      player.paperdoll.left_hand = {
        item_id: 'torch',
        name: 'Wooden Torch',
        type: 'offhand',
        quantity: 1,
        stat_bonus: 5,
      };
      expect(LightingSystem.computePlayerRadius(player)).toBe(CONFIG.TORCH_LIGHT_RADIUS);

      player.lightSpellTimer = 30;
      expect(LightingSystem.computePlayerRadius(player)).toBe(CONFIG.LIGHT_SPELL_RADIUS);
    });

    it('occludes line-of-sight behind solid walls', () => {
      // Put a solid wall at (3, 2)
      gridMap.tiles[2][3].type = TileType.WALL;

      // LOS from (2, 2) to (4, 2) should be blocked by wall at (3, 2)
      expect(LightingSystem.hasLineOfSight(gridMap, 2, 2, 4, 2)).toBe(false);
      // LOS from (2, 2) to (2, 4) should be clear
      expect(LightingSystem.hasLineOfSight(gridMap, 2, 2, 2, 4)).toBe(true);
    });
  });

  describe('CombatSystem & Abilities', () => {
    it('executes Magician Light spell and checks mana cost and cooldown', () => {
      const res = CombatSystem.executeLightSpell(player);
      expect(res.success).toBe(true);
      expect(player.mana).toBe(120 - CONFIG.MAGICIAN_LIGHT_MANA_COST);
      expect(player.lightSpellTimer).toBe(CONFIG.LIGHT_SPELL_DURATION_SEC);
      expect(player.cooldowns['light']).toBe(CONFIG.MAGICIAN_LIGHT_COOLDOWN_SEC);

      // Attempting again while on cooldown fails
      const res2 = CombatSystem.executeLightSpell(player);
      expect(res2.success).toBe(false);
    });

    it('executes Archer Bow Shot, decrements arrows, and checks empty ammo guard', () => {
      const archerPlayer: PlayerEntity = {
        ...player,
        vocation: 'archer',
        backpack: [
          {
            item_id: 'arrows',
            name: 'Arrows',
            type: 'ammo',
            quantity: 2,
            stat_bonus: 0,
          },
          null, null, null, null, null,
        ],
      };

      const monster: MonsterEntity = {
        id: 'skel_1',
        type: 'crypt_skeleton',
        name: 'Crypt Skeleton',
        x: 4,
        y: 2,
        hp: 40,
        max_hp: 40,
        facing: 'left',
        isAggroed: true,
        attackCooldown: 0,
        attackCadence: 1.5,
        visible: true,
      };

      const shot1 = CombatSystem.executeBowShot(archerPlayer, monster, gridMap);
      expect(shot1.success).toBe(true);
      expect(archerPlayer.backpack[0]?.quantity).toBe(1);

      // Reset cooldown for test
      archerPlayer.cooldowns['bow_shot'] = 0;
      const shot2 = CombatSystem.executeBowShot(archerPlayer, monster, gridMap);
      expect(shot2.success).toBe(true);
      expect(archerPlayer.backpack[0]).toBeNull(); // arrows depleted

      archerPlayer.cooldowns['bow_shot'] = 0;
      const shot3 = CombatSystem.executeBowShot(archerPlayer, monster, gridMap);
      expect(shot3.success).toBe(false);
      expect(shot3.message).toContain('Out of arrows');
    });

    it('executes Magician Energy Beam along 4-tile direction piercing multiple enemies', () => {
      const m1: MonsterEntity = {
        id: 'skel_1',
        type: 'crypt_skeleton',
        name: 'Crypt Skeleton',
        x: 2,
        y: 3,
        hp: 40,
        max_hp: 40,
        facing: 'up',
        isAggroed: true,
        attackCooldown: 0,
        attackCadence: 1.5,
        visible: true,
      };
      const m2: MonsterEntity = {
        id: 'cult_1',
        type: 'shadow_cultist',
        name: 'Shadow Cultist',
        x: 2,
        y: 5,
        hp: 30,
        max_hp: 30,
        facing: 'up',
        isAggroed: true,
        attackCooldown: 0,
        attackCadence: 2.0,
        visible: true,
      };

      const res = CombatSystem.executeEnergyBeam(player, 'down', gridMap, [m1, m2]);
      expect(res.success).toBe(true);
      expect(m1.hp).toBeLessThan(40);
      expect(m2.hp).toBeLessThan(30);
      expect(player.mana).toBe(120 - CONFIG.MAGICIAN_BEAM_MANA_COST);
    });
  });

  describe('EntityAI Tactical Archetypes', () => {
    it('Skeleton moves towards player and attacks when adjacent', () => {
      const skeleton: MonsterEntity = {
        id: 'skel_1',
        type: 'crypt_skeleton',
        name: 'Crypt Skeleton',
        x: 4,
        y: 2,
        hp: 40,
        max_hp: 40,
        facing: 'left',
        isAggroed: true,
        moveCooldown: 0,
        moveCadence: 0.8,
        attackCooldown: 0,
        attackCadence: 1.5,
        visible: true,
      };

      // Tick 1: moves from (4, 2) to (3, 2)
      EntityAI.updateMonsters([skeleton], player, gridMap, 0.1);
      expect(skeleton.x).toBe(3);
      expect(skeleton.y).toBe(2);

      // Tick 2: now adjacent to player at (2, 2) -> executes melee attack
      const actions = EntityAI.updateMonsters([skeleton], player, gridMap, 0.1);
      expect(actions.length).toBe(1);
      expect(player.hp).toBeLessThan(60);
      expect(skeleton.attackCooldown).toBe(1.5);
    });

    it('Cultist maintains standoff distance and casts shadow bolt', () => {
      const cultist: MonsterEntity = {
        id: 'cult_1',
        type: 'shadow_cultist',
        name: 'Shadow Cultist',
        x: 5,
        y: 2, // distance = 3 tiles
        hp: 30,
        max_hp: 30,
        facing: 'left',
        isAggroed: true,
        moveCooldown: 0,
        moveCadence: 1.0,
        attackCooldown: 0,
        attackCadence: 2.0,
        visible: true,
      };

      const actions = EntityAI.updateMonsters([cultist], player, gridMap, 0.1);
      expect(actions.length).toBe(1);
      expect(actions[0].message).toContain('Shadow Bolt');
      expect(player.hp).toBeLessThan(60);
      expect(cultist.attackCooldown).toBe(2.0);
    });
  });

  describe('InventorySystem & Consumables', () => {
    it('picks up items into backpack with 6-slot capacity enforcement', () => {
      for (let i = 0; i < 6; i++) {
        player.backpack[i] = {
          item_id: `item_${i}`,
          name: `Item ${i}`,
          type: 'consumable',
          quantity: 1,
          stat_bonus: 0,
        };
      }

      gridMap.addItem(player.x, player.y, {
        item_id: 'torch',
        name: 'Wooden Torch',
        type: 'offhand',
        quantity: 1,
        stat_bonus: 5,
      });

      const res = InventorySystem.pickUpItem(player, gridMap);
      expect(res.success).toBe(false);
      expect(res.message).toContain('Backpack is full');
    });

    it('equips and unequips items to paperdoll slots', () => {
      player.backpack[0] = {
        item_id: 'torch',
        name: 'Wooden Torch',
        type: 'offhand',
        quantity: 1,
        stat_bonus: 5,
      };

      const equipRes = InventorySystem.equipItem(player, 0);
      expect(equipRes.success).toBe(true);
      expect(player.paperdoll.left_hand?.item_id).toBe('torch');
      expect(player.backpack[0]).toBeNull();

      const unequipRes = InventorySystem.unequipItem(player, 'left_hand');
      expect(unequipRes.success).toBe(true);
      expect(player.paperdoll.left_hand).toBeNull();
      expect(player.backpack[0]?.item_id).toBe('torch');
    });

    it('consumes health potion from backpack and restores HP', () => {
      player.hp = 20;
      player.backpack[0] = {
        item_id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        quantity: 1,
        stat_bonus: 30,
      };

      const res = InventorySystem.useBackpackItem(player, 0);
      expect(res.success).toBe(true);
      expect(player.hp).toBe(50);
      expect(player.backpack[0]).toBeNull();
    });

    it('consumes potion directly from ground tile without picking up', () => {
      player.mana = 40;
      gridMap.addItem(player.x, player.y, {
        item_id: 'mana_potion',
        name: 'Mana Potion',
        type: 'consumable',
        quantity: 1,
        stat_bonus: 40,
      });

      const res = InventorySystem.useGroundItem(player, gridMap);
      expect(res.success).toBe(true);
      expect(player.mana).toBe(80);
      expect(gridMap.getItems(player.x, player.y).length).toBe(0);
    });

    it('stacks potions and torches up to 9 per slot', () => {
      // Add health potion x5
      player.backpack[0] = {
        item_id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        quantity: 5,
        stat_bonus: 30,
      };

      // Pick up health potion x3 -> should merge into slot 0 with quantity 8
      gridMap.addItem(player.x, player.y, {
        item_id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        quantity: 3,
        stat_bonus: 30,
      });
      const res1 = InventorySystem.pickUpItem(player, gridMap);
      expect(res1.success).toBe(true);
      expect(player.backpack[0]?.quantity).toBe(8);
      expect(player.backpack[1]).toBeNull();

      // Pick up health potion x3 -> should cap slot 0 at 9 and put remainder 2 in slot 1
      gridMap.addItem(player.x, player.y, {
        item_id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        quantity: 3,
        stat_bonus: 30,
      });
      const res2 = InventorySystem.pickUpItem(player, gridMap);
      expect(res2.success).toBe(true);
      expect(player.backpack[0]?.quantity).toBe(9);
      expect(player.backpack[1]?.quantity).toBe(2);
    });

    it('equips 1 torch from a stack and merges torch on unequip', () => {
      player.backpack[0] = {
        item_id: 'torch',
        name: 'Wooden Torch',
        type: 'offhand',
        quantity: 3,
        stat_bonus: 5,
      };

      const equipRes = InventorySystem.equipItem(player, 0);
      expect(equipRes.success).toBe(true);
      expect(player.paperdoll.left_hand?.item_id).toBe('torch');
      expect(player.paperdoll.left_hand?.quantity).toBe(1);
      expect(player.backpack[0]?.quantity).toBe(2);

      const unequipRes = InventorySystem.unequipItem(player, 'left_hand');
      expect(unequipRes.success).toBe(true);
      expect(player.paperdoll.left_hand).toBeNull();
      expect(player.backpack[0]?.quantity).toBe(3);
    });
  });

  describe('AudioSystem & Sound Effects', () => {
    it('initializes safely and toggles mute state without errors', async () => {
      const { soundFX, AudioSystem } = await import('../src/audio/AudioSystem');
      expect(soundFX).toBeDefined();
      expect(AudioSystem.getInstance()).toBe(soundFX);

      const initialMute = soundFX.getMuted();
      const toggledMute = soundFX.toggleMute();
      expect(toggledMute).toBe(!initialMute);
      expect(soundFX.getMuted()).toBe(!initialMute);

      // Restore mute state
      soundFX.toggleMute();
      expect(soundFX.getMuted()).toBe(initialMute);

      // Verify safe execution of all sound triggers in headless environment
      expect(() => soundFX.playFootstep()).not.toThrow();
      expect(() => soundFX.playWandSpark()).not.toThrow();
      expect(() => soundFX.playLightSpell()).not.toThrow();
      expect(() => soundFX.playEnergyBeam()).not.toThrow();
      expect(() => soundFX.playBowShot()).not.toThrow();
      expect(() => soundFX.playPowerShot()).not.toThrow();
      expect(() => soundFX.playHit()).not.toThrow();
      expect(() => soundFX.playMonsterAttack()).not.toThrow();
      expect(() => soundFX.playMonsterDeath()).not.toThrow();
      expect(() => soundFX.playPlayerHurt()).not.toThrow();
      expect(() => soundFX.playItemPickup()).not.toThrow();
      expect(() => soundFX.playPotionDrink()).not.toThrow();
      expect(() => soundFX.playEquip()).not.toThrow();
      expect(() => soundFX.playUnequip()).not.toThrow();
      expect(() => soundFX.playStairs()).not.toThrow();
      expect(() => soundFX.playVictory()).not.toThrow();
      expect(() => soundFX.playDefeat()).not.toThrow();
      expect(() => soundFX.playClick()).not.toThrow();
    });
  });
});
