import { describe, it, expect, beforeEach } from 'vitest';
import { GridMap } from '../src/engine/GridMap';
import { LightingSystem } from '../src/engine/LightingSystem';
import { CombatSystem } from '../src/engine/CombatSystem';
import { EntityAI } from '../src/engine/EntityAI';
import { InventorySystem } from '../src/engine/InventorySystem';
import { ProgressionSystem } from '../src/engine/ProgressionSystem';
import { FateGrantSystem } from '../src/engine/FateGrantSystem';
import { GestureEngine } from '../src/engine/GestureEngine';
import { PlayerEntity, MonsterEntity } from '../src/types/entity';
import { TileType } from '../src/types/world';
import { CONFIG } from '../src/config';

describe('Frontend Engine Test Suite - Stage 07', () => {
  let gridMap: GridMap;
  let magicianPlayer: PlayerEntity;
  let archerPlayer: PlayerEntity;
  let fighterPlayer: PlayerEntity;
  let paladinPlayer: PlayerEntity;

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

    magicianPlayer = {
      id: 'magician',
      vocation: 'magician',
      x: 2,
      y: 2,
      facing: 'down',
      hp: 60,
      max_hp: 60,
      mana: 150,
      max_mana: 150,
      level: 1,
      xp: 0,
      xpToNextLevel: ProgressionSystem.getXpForLevel(1),
      skillBoosts: ProgressionSystem.getDefaultSkillBoosts(),
      current_floor: 1,
      paperdoll: { main_hand: null, off_hand: null, armor: null, relic: null },
      action_bar: new Array(10).fill(null),
      backpack: new Array(6).fill(null),
      lightSpellTimer: 0,
      fortifyTimer: 0,
      holyRadianceTimer: 0,
      cooldowns: {},
    };

    archerPlayer = {
      ...magicianPlayer,
      id: 'archer',
      vocation: 'archer',
      hp: 90,
      max_hp: 90,
      mana: 80,
      max_mana: 80,
      paperdoll: { main_hand: null, off_hand: null, armor: null, relic: null },
      action_bar: new Array(10).fill(null),
      backpack: new Array(6).fill(null),
    };

    fighterPlayer = {
      ...magicianPlayer,
      id: 'fighter',
      vocation: 'fighter',
      hp: 140,
      max_hp: 140,
      mana: 30,
      max_mana: 30,
      paperdoll: { main_hand: null, off_hand: null, armor: null, relic: null },
      action_bar: new Array(10).fill(null),
      backpack: new Array(6).fill(null),
    };

    paladinPlayer = {
      ...magicianPlayer,
      id: 'paladin',
      vocation: 'paladin',
      hp: 120,
      max_hp: 120,
      mana: 90,
      max_mana: 90,
      paperdoll: { main_hand: null, off_hand: null, armor: null, relic: null },
      action_bar: new Array(10).fill(null),
      backpack: new Array(6).fill(null),
    };
  });

  describe('1. 4 Playable Vocations Baseline & Profiles', () => {
    it('initializes all 4 vocations with correct baseline HP and Mana pools', () => {
      expect(magicianPlayer.hp).toBe(60);
      expect(magicianPlayer.mana).toBe(150);

      expect(archerPlayer.hp).toBe(90);
      expect(archerPlayer.mana).toBe(80);

      expect(fighterPlayer.hp).toBe(140);
      expect(fighterPlayer.mana).toBe(30);

      expect(paladinPlayer.hp).toBe(120);
      expect(paladinPlayer.mana).toBe(90);
    });

    it('executes Magician Wand Spark, Light Spell, and linear Energy Beam', () => {
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

      // Light Spell
      const lightRes = CombatSystem.executeLightSpell(magicianPlayer);
      expect(lightRes.success).toBe(true);
      expect(magicianPlayer.mana).toBe(150 - CONFIG.MAGICIAN_LIGHT_MANA_COST);
      expect(magicianPlayer.lightSpellTimer).toBe(CONFIG.LIGHT_SPELL_DURATION_SEC);

      // Energy Beam piercing multiple monsters in 4-tile line down
      const beamRes = CombatSystem.executeEnergyBeam(magicianPlayer, 'down', gridMap, [m1, m2]);
      expect(beamRes.success).toBe(true);
      expect(m1.hp).toBeLessThan(40);
      expect(m2.hp).toBeLessThan(30);
      expect(magicianPlayer.mana).toBe(150 - CONFIG.MAGICIAN_LIGHT_MANA_COST - CONFIG.MAGICIAN_BEAM_MANA_COST);
    });

    it('executes Archer Bow Shot, decrements arrows, and checks empty ammo guard', () => {
      archerPlayer.action_bar[0] = {
        item_id: 'arrows',
        name: 'Arrows',
        type: 'ammo',
        quantity: 2,
        stat_bonus: 0,
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
      expect(archerPlayer.action_bar[0]?.quantity).toBe(1);

      archerPlayer.cooldowns['bow_shot'] = 0;
      const shot2 = CombatSystem.executeBowShot(archerPlayer, monster, gridMap);
      expect(shot2.success).toBe(true);
      expect(archerPlayer.action_bar[0]).toBeNull(); // arrows depleted

      archerPlayer.cooldowns['bow_shot'] = 0;
      const shot3 = CombatSystem.executeBowShot(archerPlayer, monster, gridMap);
      expect(shot3.success).toBe(false);
      expect(shot3.message).toContain('Out of arrows');
    });

    it('executes Fighter melee Slash, Cleave, and Fortify', () => {
      const monster: MonsterEntity = {
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

      // 1. Slash
      const slashRes = CombatSystem.executeFighterSlash(fighterPlayer, monster, 'tap');
      expect(slashRes.success).toBe(true);
      expect(monster.hp).toBeLessThan(40);
      expect(fighterPlayer.cooldowns['slash']).toBe(CONFIG.FIGHTER_SLASH_COOLDOWN_SEC);

      // 2. Cleave
      const cleaveRes = CombatSystem.executeFighterCleave(fighterPlayer, [monster]);
      expect(cleaveRes.success).toBe(true);
      expect(fighterPlayer.mana).toBe(30 - CONFIG.FIGHTER_CLEAVE_MANA_COST);
      expect(fighterPlayer.cooldowns['cleave']).toBe(CONFIG.FIGHTER_CLEAVE_COOLDOWN_SEC);

      // 3. Fortify
      const fortifyRes = CombatSystem.executeFighterFortify(fighterPlayer);
      expect(fortifyRes.success).toBe(true);
      expect(fighterPlayer.fortifyTimer).toBe(CONFIG.FIGHTER_FORTIFY_DURATION_SEC);
      expect(fighterPlayer.mana).toBe(20 - CONFIG.FIGHTER_FORTIFY_MANA_COST);
    });

    it('executes Paladin Holy Strike, Healing Prayer, and Holy Radiance', () => {
      const monster: MonsterEntity = {
        id: 'cult_1',
        type: 'shadow_cultist',
        name: 'Shadow Cultist',
        x: 3,
        y: 2,
        hp: 30,
        max_hp: 30,
        facing: 'left',
        isAggroed: true,
        attackCooldown: 0,
        attackCadence: 2.0,
        visible: true,
      };

      // 1. Holy Strike
      const strikeRes = CombatSystem.executePaladinHolyStrike(paladinPlayer, monster, 'tap');
      expect(strikeRes.success).toBe(true);
      expect(monster.hp).toBeLessThan(30);
      expect(paladinPlayer.mana).toBe(90 - CONFIG.PALADIN_HOLY_STRIKE_MANA_COST);

      // 2. Healing Prayer
      paladinPlayer.hp = 50;
      const healRes = CombatSystem.executePaladinHeal(paladinPlayer);
      expect(healRes.success).toBe(true);
      expect(paladinPlayer.hp).toBeGreaterThan(50);
      expect(paladinPlayer.cooldowns['healing_prayer']).toBe(CONFIG.PALADIN_HEAL_COOLDOWN_SEC);

      // 3. Holy Radiance
      const radRes = CombatSystem.executePaladinRadiance(paladinPlayer, [monster]);
      expect(radRes.success).toBe(true);
      expect(paladinPlayer.cooldowns['holy_radiance']).toBe(CONFIG.PALADIN_RADIANCE_COOLDOWN_SEC);
    });
  });

  describe('2. 10 Modular Action Slots & Multi-Modal Gestures', () => {
    it('maps keyboard keys 1..9 and 0 to slot indices 0..9', () => {
      expect(GestureEngine.keyToSlotIndex('1')).toBe(0);
      expect(GestureEngine.keyToSlotIndex('5')).toBe(4);
      expect(GestureEngine.keyToSlotIndex('9')).toBe(8);
      expect(GestureEngine.keyToSlotIndex('0')).toBe(9);
      expect(GestureEngine.keyToSlotIndex('a')).toBeNull();

      expect(GestureEngine.slotIndexToHotkey(0)).toBe('1');
      expect(GestureEngine.slotIndexToHotkey(8)).toBe('9');
      expect(GestureEngine.slotIndexToHotkey(9)).toBe('0');
    });

    it('amplifies damage with hold/charge and double-tap gestures', () => {
      const monster: MonsterEntity = {
        id: 'skel_1',
        type: 'crypt_skeleton',
        name: 'Crypt Skeleton',
        x: 4,
        y: 2,
        hp: 100,
        max_hp: 100,
        facing: 'left',
        isAggroed: true,
        attackCooldown: 0,
        attackCadence: 1.5,
        visible: true,
      };

      // Standard tap
      magicianPlayer.cooldowns['wand_spark'] = 0;
      const tapRes = CombatSystem.executeWandSpark(magicianPlayer, monster, gridMap, 'tap');
      const tapDmg = tapRes.damageDealt || 0;

      // Reset CD & monster HP
      magicianPlayer.cooldowns['wand_spark'] = 0;
      monster.hp = 100;

      // Hold / Overcharged
      const holdRes = CombatSystem.executeWandSpark(magicianPlayer, monster, gridMap, 'hold');
      const holdDmg = holdRes.damageDealt || 0;

      expect(holdDmg).toBeGreaterThanOrEqual(tapDmg);
      expect(holdRes.message).toContain('Overcharged');
    });
  });

  describe('3. 4-Slot Paperdoll & 6-Slot Backpack', () => {
    it('equips items to main_hand, off_hand, armor, and relic paperdoll slots', () => {
      magicianPlayer.backpack[0] = { item_id: 'apprentice_wand', name: 'Apprentice Wand', type: 'weapon', quantity: 1, stat_bonus: 3 };
      magicianPlayer.backpack[1] = { item_id: 'torch', name: 'Wooden Torch', type: 'offhand', quantity: 1, stat_bonus: 6 };
      magicianPlayer.backpack[2] = { item_id: 'plate_armor', name: 'Plate Armor', type: 'armor', quantity: 1, stat_bonus: 8 };
      magicianPlayer.backpack[3] = { item_id: 'relic_amulet', name: 'Luminous Amulet', type: 'relic', quantity: 1, stat_bonus: 20 };

      // Equip all 4
      expect(InventorySystem.equipItemFromBackpack(magicianPlayer, 0).success).toBe(true);
      expect(magicianPlayer.paperdoll.main_hand?.item_id).toBe('apprentice_wand');

      expect(InventorySystem.equipItemFromBackpack(magicianPlayer, 1).success).toBe(true);
      expect(magicianPlayer.paperdoll.off_hand?.item_id).toBe('torch');

      expect(InventorySystem.equipItemFromBackpack(magicianPlayer, 2).success).toBe(true);
      expect(magicianPlayer.paperdoll.armor?.item_id).toBe('plate_armor');

      expect(InventorySystem.equipItemFromBackpack(magicianPlayer, 3).success).toBe(true);
      expect(magicianPlayer.paperdoll.relic?.item_id).toBe('relic_amulet');

      // Unequip relic
      const unequipRes = InventorySystem.unequipItem(magicianPlayer, 'relic');
      expect(unequipRes.success).toBe(true);
      expect(magicianPlayer.paperdoll.relic).toBeNull();
      expect(magicianPlayer.action_bar[0]?.item_id).toBe('relic_amulet');
    });

    it('swaps items between action bar slots', () => {
      magicianPlayer.action_bar[0] = { item_id: 'health_potion', name: 'Health Potion', type: 'consumable', quantity: 1, stat_bonus: 30 };
      magicianPlayer.action_bar[1] = { item_id: 'mana_potion', name: 'Mana Potion', type: 'consumable', quantity: 1, stat_bonus: 40 };

      InventorySystem.moveItem(magicianPlayer, 'action_bar', 0, 'action_bar', 1);
      expect(magicianPlayer.action_bar[0]?.item_id).toBe('mana_potion');
      expect(magicianPlayer.action_bar[1]?.item_id).toBe('health_potion');
    });

    it('consumes potions directly from Action Bar and restores resource pools', () => {
      magicianPlayer.hp = 20;
      magicianPlayer.action_bar[0] = { item_id: 'health_potion', name: 'Health Potion', type: 'consumable', quantity: 1, stat_bonus: 30 };

      const useRes = InventorySystem.useActionBarItem(magicianPlayer, 0);
      expect(useRes.success).toBe(true);
      expect(magicianPlayer.hp).toBe(50);
      expect(magicianPlayer.action_bar[0]).toBeNull();
    });
  });

  describe('4. Frictionless Floor Interaction & Walkover Auto-Loot', () => {
    it('automatically loots ground items into lowest action slot, then backpack', () => {
      gridMap.addItem(magicianPlayer.x, magicianPlayer.y, {
        item_id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        quantity: 2,
        stat_bonus: 30,
      });
      gridMap.addItem(magicianPlayer.x, magicianPlayer.y, {
        item_id: 'torch',
        name: 'Wooden Torch',
        type: 'offhand',
        quantity: 1,
        stat_bonus: 6,
      });

      const lootRes = InventorySystem.autoLootTile(magicianPlayer, gridMap);
      expect(lootRes.success).toBe(true);
      expect(gridMap.getItems(magicianPlayer.x, magicianPlayer.y).length).toBe(0);

      // Should populate Action Slots 0 and 1
      expect(magicianPlayer.action_bar[0]?.item_id).toBe('torch');
      expect(magicianPlayer.action_bar[1]?.item_id).toBe('health_potion');
    });

    it('merges ground potions into existing stacks up to 9 per slot', () => {
      magicianPlayer.action_bar[0] = {
        item_id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        quantity: 5,
        stat_bonus: 30,
      };

      gridMap.addItem(magicianPlayer.x, magicianPlayer.y, {
        item_id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        quantity: 3,
        stat_bonus: 30,
      });

      const lootRes = InventorySystem.autoLootTile(magicianPlayer, gridMap);
      expect(lootRes.success).toBe(true);
      expect(magicianPlayer.action_bar[0]?.quantity).toBe(8);
      expect(gridMap.getItems(magicianPlayer.x, magicianPlayer.y).length).toBe(0);
    });

    it('leaves items on ground when all action slots and backpack are full', () => {
      for (let i = 0; i < 10; i++) {
        magicianPlayer.action_bar[i] = { item_id: `sword_${i}`, name: `Sword ${i}`, type: 'weapon', quantity: 1, stat_bonus: 0 };
      }
      for (let i = 0; i < 6; i++) {
        magicianPlayer.backpack[i] = { item_id: `shield_${i}`, name: `Shield ${i}`, type: 'offhand', quantity: 1, stat_bonus: 0 };
      }

      gridMap.addItem(magicianPlayer.x, magicianPlayer.y, {
        item_id: 'ruby_ring',
        name: 'Ruby Ring',
        type: 'relic',
        quantity: 1,
        stat_bonus: 5,
      });

      const lootRes = InventorySystem.autoLootTile(magicianPlayer, gridMap);
      expect(lootRes.success).toBe(false);
      expect(gridMap.getItems(magicianPlayer.x, magicianPlayer.y).length).toBe(1);
    });
  });

  describe('5. Zero-Inventory Start & Fate Grant Roguelike Draft', () => {
    it('generates 5 distinct Fate Grant cards with vocation weighting at Level 1', () => {
      const draft = FateGrantSystem.generateDraftOffer('magician', 1);
      expect(draft.cards.length).toBe(5);

      const ids = new Set(draft.cards.map(c => c.id));
      expect(ids.size).toBe(5);

      const aligned = draft.cards.filter(c => c.vocationAffinity === 'magician');
      expect(aligned.length).toBeGreaterThanOrEqual(1);
    });

    it('applies drafted cards into lowest action slots and backpack', () => {
      const draft = FateGrantSystem.generateDraftOffer('fighter', 1);
      const selected = [draft.cards[0], draft.cards[1]];

      const applyRes = FateGrantSystem.applyDraftedCards(fighterPlayer, selected, gridMap);
      expect(applyRes.addedToHotbar.length).toBe(2);
      expect(fighterPlayer.action_bar[0]).not.toBeNull();
      expect(fighterPlayer.action_bar[1]).not.toBeNull();
    });
  });

  describe('6. GridMap & Lighting System', () => {
    it('correctly calculates dynamic illumination for Base, Torch, and Spell', () => {
      expect(LightingSystem.computePlayerRadius(magicianPlayer)).toBe(CONFIG.BASE_LIGHT_RADIUS);

      magicianPlayer.paperdoll.off_hand = {
        item_id: 'torch',
        name: 'Wooden Torch',
        type: 'offhand',
        quantity: 1,
        stat_bonus: 6,
      };
      expect(LightingSystem.computePlayerRadius(magicianPlayer)).toBe(CONFIG.TORCH_LIGHT_RADIUS);

      magicianPlayer.lightSpellTimer = 30;
      expect(LightingSystem.computePlayerRadius(magicianPlayer)).toBe(CONFIG.LIGHT_SPELL_RADIUS);
    });

    it('blocks raycasted line of sight through solid walls', () => {
      gridMap.tiles[2][3].type = TileType.WALL;
      expect(LightingSystem.hasLineOfSight(gridMap, 2, 2, 4, 2)).toBe(false);
      expect(LightingSystem.hasLineOfSight(gridMap, 2, 2, 2, 4)).toBe(true);
    });
  });

  describe('7. Tactical EntityAI & Progression Scaling', () => {
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

      // Step 1: moves closer
      EntityAI.updateMonsters([skeleton], fighterPlayer, gridMap, 0.1);
      expect(skeleton.x).toBe(3);
      expect(skeleton.y).toBe(2);

      // Step 2: adjacent to player -> attacks
      const actions = EntityAI.updateMonsters([skeleton], fighterPlayer, gridMap, 0.1);
      expect(actions.length).toBe(1);
      expect(fighterPlayer.hp).toBeLessThan(140);
    });

    it('levels up Fighter with +18 HP and +4 Mana scaling', () => {
      const lvlRes = ProgressionSystem.awardXP(fighterPlayer, 100);
      expect(lvlRes.leveledUp).toBe(true);
      expect(lvlRes.newLevel).toBe(2);
      expect(fighterPlayer.max_hp).toBe(158);
      expect(fighterPlayer.max_mana).toBe(34);
      expect(fighterPlayer.hp).toBe(158);
      expect(fighterPlayer.mana).toBe(34);
    });

    it('levels up Paladin with +15 HP and +10 Mana scaling', () => {
      const lvlRes = ProgressionSystem.awardXP(paladinPlayer, 100);
      expect(lvlRes.leveledUp).toBe(true);
      expect(lvlRes.newLevel).toBe(2);
      expect(paladinPlayer.max_hp).toBe(135);
      expect(paladinPlayer.max_mana).toBe(100);
    });
  });
});
