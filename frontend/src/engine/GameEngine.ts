import { GridMap } from './GridMap';
import { LightingSystem } from './LightingSystem';
import { CombatSystem, CombatResult } from './CombatSystem';
import { EntityAI } from './EntityAI';
import { InventorySystem } from './InventorySystem';
import { SyncManager } from './SyncManager';
import { ProgressionSystem } from './ProgressionSystem';
import { GestureEngine } from './GestureEngine';
import { FateGrantSystem } from './FateGrantSystem';
import { CanvasRenderer } from '../render/CanvasRenderer';
import { PaperdollUI } from '../ui/PaperdollUI';
import { BackpackUI } from '../ui/BackpackUI';
import { StatusBarsUI } from '../ui/StatusBarsUI';
import { HotbarUI } from '../ui/HotbarUI';
import { CombatLogUI } from '../ui/CombatLogUI';
import { FateGrantModal } from '../ui/FateGrantModal';
import {
  PlayerEntity,
  MonsterEntity,
  Projectile,
  FloatingText,
  Direction,
} from '../types/entity';
import { LightEmitter } from '../types/world';
import { Item, PaperdollSlotType } from '../types/item';
import { GestureEvent, GestureType } from '../types/action';
import { FateCard } from '../types/fate';
import { VocationType, CharacterResponse, DungeonFloorResponse } from '../types/api';
import { CONFIG } from '../config';
import { soundFX } from '../audio/AudioSystem';

export class GameEngine {
  public gridMap: GridMap;
  public player: PlayerEntity;
  public monsters: MonsterEntity[] = [];
  public ambientLights: LightEmitter[] = [];
  public projectiles: Projectile[] = [];
  public floatingTexts: FloatingText[] = [];

  public selectedMonsterId: string | null = null;
  public isRunning = false;
  public isFloorCleared = false;
  public isGameOver = false;
  public isDrafting = false;
  public currentFloorName = 'Subterranean Crypt';

  private tickTimer: number | null = null;
  private animFrameId: number | null = null;
  private lastAnimTime = 0;

  // Render & UI components
  private renderer: CanvasRenderer;
  private paperdollUI: PaperdollUI;
  private backpackUI: BackpackUI;
  private statusBarsUI: StatusBarsUI;
  private hotbarUI: HotbarUI;
  private combatLogUI: CombatLogUI;
  private fateGrantModal: FateGrantModal;
  private gestureEngine: GestureEngine;

  // Key state tracking for movement (discrete 10 Hz steps)
  private keysDown = new Set<string>();

  // Passive regen timer
  private regenAccumulator = 0;

  constructor(
    canvas: HTMLCanvasElement,
    paperdollContainerId: string,
    backpackContainerId: string,
    statusBarsContainerId: string,
    hotbarContainerId: string,
    combatLogContainerId: string,
    modalOverlayId = 'modal-overlay'
  ) {
    this.gridMap = new GridMap();
    this.player = this.createDefaultPlayer('magician');

    this.renderer = new CanvasRenderer(canvas);
    this.combatLogUI = new CombatLogUI(combatLogContainerId);

    this.paperdollUI = new PaperdollUI(paperdollContainerId, slotName => {
      this.handleUnequip(slotName);
    });

    this.backpackUI = new BackpackUI(
      backpackContainerId,
      slotIndex => this.handleUseBackpackItem(slotIndex),
      slotIndex => this.handleDropBackpackItem(slotIndex)
    );

    this.statusBarsUI = new StatusBarsUI(statusBarsContainerId);

    this.hotbarUI = new HotbarUI(
      hotbarContainerId,
      slotIdx => this.gestureEngine.handleInputDown(slotIdx),
      slotIdx => this.gestureEngine.handleInputUp(slotIdx),
      (fromSlot, toSlot) => this.handleSwapActionSlots(fromSlot, toSlot)
    );

    this.fateGrantModal = new FateGrantModal(modalOverlayId, selectedCards => {
      this.handleDraftConfirmed(selectedCards);
    });

    this.gestureEngine = new GestureEngine(
      event => this.handleActionSlotGesture(event),
      (slotIndex, ratio) => this.hotbarUI.setChargeRatio(slotIndex, ratio)
    );

    this.bindInputs(canvas);
  }

  public createDefaultPlayer(vocation: VocationType): PlayerEntity {
    let baseHp = CONFIG.MAGICIAN_BASE_HP;
    let baseMana = CONFIG.MAGICIAN_BASE_MANA;

    if (vocation === 'archer') {
      baseHp = CONFIG.ARCHER_BASE_HP;
      baseMana = CONFIG.ARCHER_BASE_MANA;
    } else if (vocation === 'fighter') {
      baseHp = CONFIG.FIGHTER_BASE_HP;
      baseMana = CONFIG.FIGHTER_BASE_MANA;
    } else if (vocation === 'paladin') {
      baseHp = CONFIG.PALADIN_BASE_HP;
      baseMana = CONFIG.PALADIN_BASE_MANA;
    }

    return {
      id: vocation,
      vocation,
      x: 2,
      y: 2,
      facing: 'down',
      hp: baseHp,
      max_hp: baseHp,
      mana: baseMana,
      max_mana: baseMana,
      level: 1,
      xp: 0,
      xpToNextLevel: ProgressionSystem.getXpForLevel(1),
      skillBoosts: ProgressionSystem.getDefaultSkillBoosts(),
      current_floor: 1,
      paperdoll: { main_hand: null, off_hand: null, armor: null, relic: null },
      action_bar: new Array(CONFIG.ACTION_BAR_SLOTS).fill(null),
      backpack: new Array(CONFIG.BACKPACK_SLOTS).fill(null),
      lightSpellTimer: 0,
      fortifyTimer: 0,
      holyRadianceTimer: 0,
      cooldowns: {},
    };
  }

  public async initializeSession(vocation: VocationType, isContinue = false): Promise<void> {
    this.combatLogUI.clear();
    this.combatLogUI.log('Welcome to Lokarta: Come Into The Light.', 'system');
    this.isFloorCleared = false;
    this.isGameOver = false;
    this.isDrafting = false;

    try {
      // 1. Fetch character profile from backend
      this.combatLogUI.log(`Loading ${vocation} profile from backend...`, 'system');
      const charData = await SyncManager.fetchCharacter(vocation);

      if (!isContinue) {
        // Zero-inventory baseline initialization for new run
        this.player = this.createDefaultPlayer(vocation);
      } else {
        this.applyCharacterData(charData);
      }

      const targetFloor = isContinue ? (charData.current_floor || 1) : 1;
      this.player.current_floor = targetFloor;

      // 2. Fetch dungeon floor layout
      this.combatLogUI.log(`Fetching Floor ${targetFloor}/20 layout...`, 'system');
      const floorData = await SyncManager.fetchDungeonFloor(targetFloor);
      this.applyDungeonData(floorData);

      // 3. Initial lighting calculation
      LightingSystem.updateLighting(this.gridMap, this.player, this.ambientLights, this.monsters);

      this.combatLogUI.log(`Entered ${this.currentFloorName} at (${this.player.x}, ${this.player.y}).`, 'system');

      // 4. Start engine loops
      this.start();

      // 5. Trigger Level 1 Fate Grant for fresh runs
      if (!isContinue && this.player.level === 1) {
        this.triggerFateDraft(false);
      }
    } catch (err) {
      console.error('Session initialization error:', err);
      this.combatLogUI.log(`Error connecting to backend: ${(err as Error).message}`, 'warning');
    }
  }

  private triggerFateDraft(isLevelUp: boolean): void {
    this.isDrafting = true;
    const offer = FateGrantSystem.generateDraftOffer(this.player.vocation, this.player.level);
    this.fateGrantModal.show(offer, isLevelUp, this.player.level);
  }

  private handleDraftConfirmed(selectedCards: FateCard[]): void {
    this.isDrafting = false;
    const result = FateGrantSystem.applyDraftedCards(this.player, selectedCards, this.gridMap);

    if (result.addedToHotbar.length > 0) {
      this.combatLogUI.log(`Granted: ${result.addedToHotbar.join(', ')}.`, 'loot');
    }
    if (result.addedToBackpack.length > 0) {
      this.combatLogUI.log(`Stored in backpack: ${result.addedToBackpack.join(', ')}.`, 'loot');
    }
    if (result.droppedOnFloor.length > 0) {
      this.combatLogUI.log(`Inventory full! Dropped on floor: ${result.droppedOnFloor.join(', ')}.`, 'warning');
    }

    this.updateHUD();
    this.persistSave();
  }

  private applyCharacterData(data: CharacterResponse): void {
    this.player.id = data.id;
    this.player.vocation = data.vocation;
    this.player.hp = data.hp;
    this.player.max_hp = data.max_hp;
    this.player.mana = data.mana;
    this.player.max_mana = data.max_mana;
    this.player.level = data.level || 1;
    this.player.xp = data.xp || 0;
    this.player.xpToNextLevel = data.xp_to_next_level || ProgressionSystem.getXpForLevel(this.player.level);
    this.player.skillBoosts = ProgressionSystem.computeSkillBoosts(this.player.vocation, this.player.level);
    this.player.current_floor = data.current_floor || 1;
    this.player.x = data.position?.x ?? 2;
    this.player.y = data.position?.y ?? 2;

    this.player.paperdoll = {
      main_hand: data.paperdoll?.main_hand || null,
      off_hand: data.paperdoll?.off_hand || null,
      armor: data.paperdoll?.armor || null,
      relic: data.paperdoll?.relic || null,
    };

    this.player.action_bar = new Array(CONFIG.ACTION_BAR_SLOTS).fill(null);
    if (data.action_bar) {
      for (const a of data.action_bar) {
        if (a.slot_index >= 0 && a.slot_index < CONFIG.ACTION_BAR_SLOTS) {
          this.player.action_bar[a.slot_index] = {
            item_id: a.item_id,
            name: a.name,
            type: a.type,
            quantity: a.quantity,
            stat_bonus: a.stat_bonus,
          };
        }
      }
    }

    this.player.backpack = new Array(CONFIG.BACKPACK_SLOTS).fill(null);
    if (data.backpack) {
      for (const b of data.backpack) {
        if (b.slot_index >= 0 && b.slot_index < CONFIG.BACKPACK_SLOTS) {
          this.player.backpack[b.slot_index] = {
            item_id: b.item_id,
            name: b.name,
            type: b.type,
            quantity: b.quantity,
            stat_bonus: b.stat_bonus,
          };
        }
      }
    }
  }

  private applyDungeonData(data: DungeonFloorResponse): void {
    this.currentFloorName = data.name;
    this.gridMap.loadFromMatrix(data.tile_matrix);

    if (data.entrance) {
      this.player.x = data.entrance.x;
      this.player.y = data.entrance.y;
    } else {
      this.player.x = 2;
      this.player.y = 2;
    }

    this.ambientLights = data.ambient_lights.map(l => ({
      x: l.x,
      y: l.y,
      radius: l.radius,
      color: l.color,
    }));

    for (const loot of data.initial_loot) {
      this.gridMap.addItem(loot.x, loot.y, {
        item_id: loot.item_id,
        name: loot.name,
        type: loot.type,
        quantity: loot.quantity,
        stat_bonus: loot.stat_bonus,
      });
    }

    this.monsters = data.spawns.map(s => ({
      id: s.id,
      type: s.type as any,
      name: s.id.includes('boss')
        ? 'Abyssal Overlord (Boss)'
        : s.type === 'crypt_skeleton'
        ? 'Crypt Skeleton'
        : 'Shadow Cultist',
      x: s.x,
      y: s.y,
      hp: s.hp,
      max_hp: s.max_hp,
      facing: 'down',
      isAggroed: false,
      moveCooldown: Math.random() * 0.5,
      moveCadence: s.type === 'crypt_skeleton' ? CONFIG.SKELETON_MOVE_CADENCE_SEC : CONFIG.CULTIST_MOVE_CADENCE_SEC,
      attackCooldown: 0,
      attackCadence: s.type === 'crypt_skeleton' ? CONFIG.SKELETON_ATTACK_CADENCE_SEC : CONFIG.CULTIST_ATTACK_CADENCE_SEC,
      visible: false,
    }));
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isGameOver = false;
    this.isFloorCleared = false;

    // 10 Hz fixed tick loop (100ms)
    this.tickTimer = window.setInterval(() => this.tick(), CONFIG.TICK_INTERVAL_MS);

    // 60 FPS animation loop
    this.lastAnimTime = performance.now();
    const renderLoop = (time: number) => {
      const dt = time - this.lastAnimTime;
      this.lastAnimTime = time;
      this.updateAnimations(dt);
      this.render();

      if (this.isRunning) {
        this.animFrameId = requestAnimationFrame(renderLoop);
      }
    };
    this.animFrameId = requestAnimationFrame(renderLoop);
    this.updateHUD();
  }

  public stop(): void {
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

  private tick(): void {
    if (!this.isRunning || this.isGameOver || this.isDrafting) return;
    const deltaSec = CONFIG.TICK_INTERVAL_MS / 1000;

    // 1. Process continuous keyboard movement
    this.processMovementInput();

    // 2. Decrement cooldowns and spell timers
    CombatSystem.decrementCooldowns(this.player, deltaSec);
    CombatSystem.decrementSpellTimers(this.player, deltaSec);

    // Passive regeneration
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
        this.combatLogUI.log(res.message, 'combat');
      }
      if (res.projectiles) {
        this.projectiles.push(...res.projectiles);
      }
      if (res.damageToPlayer && res.damageToPlayer > 0) {
        let finalDamage = res.damageToPlayer;
        if (this.player.fortifyTimer && this.player.fortifyTimer > 0) {
          finalDamage = Math.max(1, Math.round(finalDamage * 0.5));
        }
        soundFX.playMonsterAttack();
        soundFX.playPlayerHurt();
        this.addFloatingText(`-${finalDamage}`, this.player.x, this.player.y, '#ef4444');
      }
    }

    // 5. Check player defeat
    if (this.player.hp <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      this.combatLogUI.log('You have fallen in the crypt! Darkness consumes you...', 'warning');
      this.showGameOverModal();
    }

    // 6. Check exit stairway floor clearance
    if (!this.isFloorCleared && this.gridMap.isStairs(this.player.x, this.player.y)) {
      this.handleFloorClear();
    }

    // 7. Update UI HUD elements
    this.updateHUD();
  }

  private updateAnimations(dtMs: number): void {
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

  private render(): void {
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

  private updateHUD(): void {
    this.statusBarsUI.update(this.player, this.currentFloorName);
    this.paperdollUI.update(this.player.paperdoll);
    this.backpackUI.update(this.player.backpack);
    this.hotbarUI.update(this.player);
  }

  private processMovementInput(): void {
    let dx = 0;
    let dy = 0;
    let newFacing: Direction = this.player.facing;

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

      // Check wall collision
      if (this.gridMap.isWalkable(targetX, targetY)) {
        // Check monster collision
        const monsterAtTarget = this.monsters.find(m => m.x === targetX && m.y === targetY && m.hp > 0);
        if (monsterAtTarget) {
          this.selectedMonsterId = monsterAtTarget.id;
          this.combatLogUI.log(`Target locked on ${monsterAtTarget.name} (${monsterAtTarget.hp}/${monsterAtTarget.max_hp} HP).`, 'system');
        } else {
          // Move discrete step
          this.player.x = targetX;
          this.player.y = targetY;
          soundFX.playFootstep();

          // Frictionless walkover auto-loot on tile step
          const lootRes = InventorySystem.autoLootTile(this.player, this.gridMap);
          if (lootRes.success) {
            soundFX.playItemPickup();
            this.combatLogUI.log(lootRes.message, 'loot');
            this.addFloatingText('Looted Item!', this.player.x, this.player.y, '#22c55e');
            this.updateHUD();
            this.persistSave();
          }
        }
      }
    }
  }

  // --- Multi-Modal Action Slot Activation ---

  public handleActionSlotGesture(event: GestureEvent): void {
    if (this.isGameOver || this.isDrafting) return;

    const { slotIndex, gesture } = event;
    const item = this.player.action_bar[slotIndex];
    if (!item) {
      return; // Empty slot
    }

    if (item.type === 'spell') {
      this.executeSpellAbility(item.item_id, gesture);
    } else if (item.type === 'weapon') {
      this.executeWeaponAbility(item, gesture);
    } else if (item.type === 'offhand') {
      this.executeOffhandAbility(item, gesture, slotIndex);
    } else if (item.type === 'consumable') {
      this.handleUseActionBarItem(slotIndex);
    } else if (item.type === 'armor' || item.type === 'relic' || item.item_id === 'torch') {
      this.handleEquipFromActionBar(slotIndex);
    }
  }

  private executeWeaponAbility(item: Item, gesture: GestureType): void {
    const id = item.item_id.toLowerCase();
    if (id.includes('bow')) {
      if (gesture === 'hold') {
        this.executeSpellAbility('spell_power_shot', gesture);
      } else {
        this.executeSpellAbility('spell_bow_shot', gesture);
      }
    } else if (id.includes('sword') || id.includes('blade') || id.includes('dagger') || id.includes('axe')) {
      if (gesture === 'hold') {
        this.executeSpellAbility('spell_cleave', gesture);
      } else {
        this.executeSpellAbility('spell_slash', gesture);
      }
    } else if (id.includes('wand') || id.includes('scepter') || id.includes('staff')) {
      if (gesture === 'hold') {
        this.executeSpellAbility('spell_energy_beam', gesture);
      } else {
        this.executeSpellAbility('spell_wand_spark', gesture);
      }
    } else if (id.includes('hammer') || id.includes('mace')) {
      if (gesture === 'hold') {
        this.executeSpellAbility('spell_holy_radiance', gesture);
      } else {
        this.executeSpellAbility('spell_holy_strike', gesture);
      }
    } else {
      // Default melee slash
      this.executeSpellAbility('spell_slash', gesture);
    }
  }

  private executeOffhandAbility(item: Item, gesture: GestureType, slotIndex: number): void {
    const id = item.item_id.toLowerCase();
    if (id.includes('shield') || id.includes('aegis') || id.includes('buckler')) {
      this.executeSpellAbility('spell_fortify', gesture);
    } else if (id.includes('orb') || id.includes('tome') || id.includes('light')) {
      this.executeSpellAbility('spell_light', gesture);
    } else {
      this.handleEquipFromActionBar(slotIndex);
    }
  }

  private executeSpellAbility(spellId: string, gesture: GestureType): void {
    let res: CombatResult | null = null;

    if (spellId === 'spell_wand_spark' || spellId === 'wand_spark') {
      const target = this.getTargetMonster(CONFIG.MAGICIAN_SPARK_RANGE);
      if (!target) {
        this.combatLogUI.log('No visible enemy in range for Wand Spark (click enemy to target).', 'warning');
        return;
      }
      soundFX.playWandSpark();
      res = CombatSystem.executeWandSpark(this.player, target, this.gridMap, gesture);
      this.handleCombatResult(res, target.x, target.y);
    } else if (spellId === 'spell_light' || spellId === 'light') {
      res = CombatSystem.executeLightSpell(this.player);
      if (res.success) {
        soundFX.playLightSpell();
        this.combatLogUI.log(res.message!, 'spell');
        this.addFloatingText('Light Aura!', this.player.x, this.player.y, '#ffd700');
        LightingSystem.updateLighting(this.gridMap, this.player, this.ambientLights, this.monsters);
      } else {
        this.combatLogUI.log(res.message!, 'warning');
      }
    } else if (spellId === 'spell_energy_beam' || spellId === 'energy_beam') {
      res = CombatSystem.executeEnergyBeam(this.player, this.player.facing, this.gridMap, this.monsters, gesture);
      if (res.success) {
        soundFX.playEnergyBeam();
        this.handleCombatResult(res, this.player.x, this.player.y);
      } else {
        this.combatLogUI.log(res.message!, 'warning');
      }
    } else if (spellId === 'spell_bow_shot' || spellId === 'bow_shot') {
      const target = this.getTargetMonster(CONFIG.ARCHER_BOW_RANGE);
      if (!target) {
        this.combatLogUI.log('No visible enemy in range for Bow Shot (click enemy to target).', 'warning');
        return;
      }
      soundFX.playBowShot();
      res = CombatSystem.executeBowShot(this.player, target, this.gridMap, gesture);
      this.handleCombatResult(res, target.x, target.y);
    } else if (spellId === 'spell_power_shot' || spellId === 'power_shot') {
      const target = this.getTargetMonster(CONFIG.ARCHER_POWER_SHOT_RANGE);
      if (!target) {
        this.combatLogUI.log('No visible enemy in range for Power Shot (click enemy to target).', 'warning');
        return;
      }
      soundFX.playPowerShot();
      res = CombatSystem.executePowerShot(this.player, target, this.gridMap);
      this.handleCombatResult(res, target.x, target.y);
    } else if (spellId === 'spell_slash' || spellId === 'slash') {
      const target = this.getTargetMonster(1.5);
      if (!target) {
        this.combatLogUI.log('No adjacent enemy to strike with Sword Slash.', 'warning');
        return;
      }
      res = CombatSystem.executeFighterSlash(this.player, target, gesture);
      this.handleCombatResult(res, target.x, target.y);
    } else if (spellId === 'spell_cleave' || spellId === 'cleave') {
      res = CombatSystem.executeFighterCleave(this.player, this.monsters);
      this.handleCombatResult(res, this.player.x, this.player.y);
    } else if (spellId === 'spell_fortify' || spellId === 'fortify') {
      res = CombatSystem.executeFighterFortify(this.player);
      if (res.success) {
        soundFX.playEquip();
        this.combatLogUI.log(res.message!, 'spell');
        this.addFloatingText('Shield Wall!', this.player.x, this.player.y, '#60a5fa');
      } else {
        this.combatLogUI.log(res.message!, 'warning');
      }
    } else if (spellId === 'spell_holy_strike' || spellId === 'holy_strike') {
      const target = this.getTargetMonster(1.5);
      if (!target) {
        this.combatLogUI.log('No adjacent enemy to smite with Holy Strike.', 'warning');
        return;
      }
      res = CombatSystem.executePaladinHolyStrike(this.player, target, gesture);
      this.handleCombatResult(res, target.x, target.y);
    } else if (spellId === 'spell_healing_prayer' || spellId === 'healing_prayer') {
      res = CombatSystem.executePaladinHeal(this.player);
      if (res.success) {
        soundFX.playLightSpell();
        this.combatLogUI.log(res.message!, 'spell');
        this.addFloatingText(`+${res.healAmount} HP`, this.player.x, this.player.y, '#4ade80');
      } else {
        this.combatLogUI.log(res.message!, 'warning');
      }
    } else if (spellId === 'spell_holy_radiance' || spellId === 'holy_radiance') {
      res = CombatSystem.executePaladinRadiance(this.player, this.monsters);
      if (res.success) {
        soundFX.playLightSpell();
        this.handleCombatResult(res, this.player.x, this.player.y);
      } else {
        this.combatLogUI.log(res.message!, 'warning');
      }
    }

    this.updateHUD();
  }

  private getTargetMonster(maxRange: number): MonsterEntity | null {
    if (this.selectedMonsterId) {
      const monster = this.monsters.find(m => m.id === this.selectedMonsterId && m.hp > 0);
      if (monster && monster.visible) {
        const d = Math.hypot(monster.x - this.player.x, monster.y - this.player.y);
        if (d <= maxRange + 0.5) return monster;
      }
    }

    let closest: MonsterEntity | null = null;
    let minDist = maxRange + 1;

    for (const m of this.monsters) {
      if (m.hp <= 0 || !m.visible) continue;
      const d = Math.hypot(m.x - this.player.x, m.y - this.player.y);
      if (d <= maxRange + 0.5 && d < minDist) {
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

  private handleCombatResult(res: CombatResult, targetX: number, targetY: number): void {
    if (!res.success) {
      if (res.message) this.combatLogUI.log(res.message, 'warning');
      return;
    }

    if (res.message) {
      this.combatLogUI.log(res.message, 'combat');
    }

    if (res.damageDealt) {
      soundFX.playHit();
      this.addFloatingText(`-${res.damageDealt}`, targetX, targetY, '#ffdd44');
    }

    if (res.projectiles) {
      this.projectiles.push(...res.projectiles);
    }

    // Handle defeated monster & loot drop & XP progression
    if (res.defeatedMonsterId) {
      soundFX.playMonsterDeath();
      const index = this.monsters.findIndex(m => m.id === res.defeatedMonsterId);
      if (index !== -1) {
        const deadMonster = this.monsters[index];
        if (res.droppedLoot && res.droppedLoot.length > 0) {
          for (const item of res.droppedLoot) {
            this.gridMap.addItem(deadMonster.x, deadMonster.y, item);
            this.combatLogUI.log(`${deadMonster.name} dropped ${item.name}.`, 'loot');
          }
        }

        const isBoss = deadMonster.id.includes('boss') || deadMonster.max_hp >= 250;
        const xpEarned = ProgressionSystem.getMonsterXp(deadMonster.type, this.player.current_floor, isBoss);
        const lvlRes = ProgressionSystem.awardXP(this.player, xpEarned);

        this.combatLogUI.log(`Gained +${xpEarned} XP from defeating ${deadMonster.name}.`, 'loot');
        this.addFloatingText(`+${xpEarned} XP`, deadMonster.x, deadMonster.y, '#fbbf24');

        if (lvlRes.leveledUp) {
          soundFX.playLevelUp();
          this.combatLogUI.log(
            `⭐ LEVEL UP! You reached Level ${lvlRes.newLevel}! (+${lvlRes.hpGained} Max HP, +${lvlRes.manaGained} Max MP, +${lvlRes.damagePercentGained}% Damage)`,
            'spell'
          );
          this.addFloatingText(`⭐ LEVEL UP! [Lv. ${lvlRes.newLevel}]`, this.player.x, this.player.y, '#ffd700');
          this.updateHUD();
          this.persistSave();

          // Level-Up Fate Grant Draft
          this.triggerFateDraft(true);
        }

        this.monsters.splice(index, 1);
        if (this.selectedMonsterId === res.defeatedMonsterId) {
          this.selectedMonsterId = null;
        }
      }
    }
  }

  // --- Inventory & Action Bar Handlers ---

  public async handleUseActionBarItem(slotIndex: number): Promise<void> {
    const res = InventorySystem.useActionBarItem(this.player, slotIndex);
    if (res.success) {
      this.combatLogUI.log(res.message, 'loot');
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
      this.combatLogUI.log(res.message, 'warning');
    }
  }

  public async handleEquipFromActionBar(slotIndex: number): Promise<void> {
    const res = InventorySystem.equipItemFromActionBar(this.player, slotIndex);
    if (res.success) {
      soundFX.playEquip();
      this.combatLogUI.log(res.message, 'system');
      LightingSystem.updateLighting(this.gridMap, this.player, this.ambientLights, this.monsters);
      this.updateHUD();
      await this.persistSave();
    } else {
      this.combatLogUI.log(res.message, 'warning');
    }
  }

  public async handleUseBackpackItem(slotIndex: number): Promise<void> {
    const res = InventorySystem.useBackpackItem(this.player, slotIndex);
    if (res.success) {
      this.combatLogUI.log(res.message, 'loot');
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
      this.combatLogUI.log(res.message, 'warning');
    }
  }

  public async handleDropBackpackItem(slotIndex: number): Promise<void> {
    const res = InventorySystem.dropBackpackItem(this.player, slotIndex, this.gridMap);
    if (res.success) {
      soundFX.playUnequip();
      this.combatLogUI.log(res.message, 'system');
      this.updateHUD();
      await this.persistSave();
    } else {
      this.combatLogUI.log(res.message, 'warning');
    }
  }

  public async handleUnequip(slotName: PaperdollSlotType): Promise<void> {
    const res = InventorySystem.unequipItem(this.player, slotName);
    if (res.success) {
      soundFX.playUnequip();
      this.combatLogUI.log(res.message, 'system');
      LightingSystem.updateLighting(this.gridMap, this.player, this.ambientLights, this.monsters);
      this.updateHUD();
      await this.persistSave();
    } else {
      this.combatLogUI.log(res.message, 'warning');
    }
  }

  public handleSwapActionSlots(fromSlot: number, toSlot: number): void {
    InventorySystem.moveItem(this.player, 'action_bar', fromSlot, 'action_bar', toSlot);
    soundFX.playClick();
    this.updateHUD();
    this.persistSave();
  }

  private async persistSave(): Promise<void> {
    try {
      await SyncManager.saveCharacter(this.player);
      this.combatLogUI.log('Progress saved.', 'system');
    } catch (err) {
      console.warn('Auto-save error:', err);
    }
  }

  private async handleFloorClear(): Promise<void> {
    if (this.player.current_floor < 20) {
      const nextFloor = this.player.current_floor + 1;
      const floorBonusXp = 50 * this.player.current_floor;
      const lvlRes = ProgressionSystem.awardXP(this.player, floorBonusXp);

      soundFX.playStairs();
      this.combatLogUI.log(
        `Stepped on stairway! Descended to Floor ${nextFloor}/20 (+${floorBonusXp} Floor Clear XP)!`,
        'victory'
      );
      this.addFloatingText(`FLOOR ${nextFloor}`, this.player.x, this.player.y, '#38bdf8');

      if (lvlRes.leveledUp) {
        soundFX.playLevelUp();
        this.combatLogUI.log(
          `⭐ LEVEL UP! You reached Level ${lvlRes.newLevel}! (+${lvlRes.hpGained} Max HP, +${lvlRes.manaGained} Max MP)`,
          'spell'
        );
        this.triggerFateDraft(true);
      }

      try {
        await SyncManager.syncDungeonProgress(this.player, this.player.current_floor);
        const nextFloorData = await SyncManager.fetchDungeonFloor(nextFloor);
        this.player.current_floor = nextFloor;
        this.applyDungeonData(nextFloorData);
        this.isFloorCleared = false;
        LightingSystem.updateLighting(this.gridMap, this.player, this.ambientLights, this.monsters);
        this.updateHUD();
        await this.persistSave();
      } catch (err) {
        console.error('Floor transition error:', err);
      }
    } else {
      // Floor 20 Final Clear
      this.isFloorCleared = true;
      soundFX.playVictory();
      this.combatLogUI.log('🎉 YOU CONQUERED THE ABYSSAL SANCTUM! ALL 20 FLOORS CLEARED!', 'victory');
      this.addFloatingText('CAMPAIGN COMPLETED!', this.player.x, this.player.y, '#ffd700');

      try {
        await SyncManager.syncDungeonProgress(this.player, 20);
      } catch (err) {
        console.error('Floor 20 sync error:', err);
      }

      this.showVictoryModal();
    }
  }

  private addFloatingText(text: string, gridX: number, gridY: number, color: string): void {
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

  private bindInputs(canvas: HTMLCanvasElement): void {
    window.addEventListener('keydown', e => {
      this.keysDown.add(e.code);

      // Keys 1..9 and 0 for 10 Action Slots
      const slotIndex = GestureEngine.keyToSlotIndex(e.key);
      if (slotIndex !== null) {
        e.preventDefault();
        this.gestureEngine.handleInputDown(slotIndex);
      }
    });

    window.addEventListener('keyup', e => {
      this.keysDown.delete(e.code);

      const slotIndex = GestureEngine.keyToSlotIndex(e.key);
      if (slotIndex !== null) {
        e.preventDefault();
        this.gestureEngine.handleInputUp(slotIndex);
      }
    });

    // Canvas click: targeting or adjacent item floor looting
    canvas.addEventListener('click', e => {
      if (this.isGameOver || this.isDrafting) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const gridPos = this.renderer.screenToGrid(clickX, clickY);

      // 1. Check if clicked a visible monster
      const clickedMonster = this.monsters.find(
        m => m.x === gridPos.x && m.y === gridPos.y && m.visible && m.hp > 0
      );
      if (clickedMonster) {
        this.selectedMonsterId = clickedMonster.id;
        this.combatLogUI.log(
          `Targeted ${clickedMonster.name} (${clickedMonster.hp}/${clickedMonster.max_hp} HP).`,
          'system'
        );
        return;
      }

      // 2. Check if clicked a ground item on an adjacent or occupied tile
      const dist = Math.hypot(gridPos.x - this.player.x, gridPos.y - this.player.y);
      if (dist <= 1.5) {
        const itemsOnTile = this.gridMap.getItems(gridPos.x, gridPos.y);
        if (itemsOnTile.length > 0) {
          // If on same tile or adjacent, loot
          if (gridPos.x === this.player.x && gridPos.y === this.player.y) {
            const lootRes = InventorySystem.autoLootTile(this.player, this.gridMap);
            if (lootRes.success) {
              soundFX.playItemPickup();
              this.combatLogUI.log(lootRes.message, 'loot');
              this.addFloatingText('Looted Item!', this.player.x, this.player.y, '#22c55e');
              this.updateHUD();
              this.persistSave();
            }
          } else {
            // Adjacent tile pickup
            const topItem = this.gridMap.popTopItem(gridPos.x, gridPos.y);
            if (topItem) {
              // Add to player inventory
              const emptySlot = this.player.action_bar.findIndex(s => s === null);
              if (emptySlot !== -1) {
                this.player.action_bar[emptySlot] = topItem;
                this.combatLogUI.log(`Looted ${topItem.name} from floor into Slot ${emptySlot + 1}.`, 'loot');
              } else {
                const emptyBackpack = this.player.backpack.findIndex(s => s === null);
                if (emptyBackpack !== -1) {
                  this.player.backpack[emptyBackpack] = topItem;
                  this.combatLogUI.log(`Looted ${topItem.name} from floor into Backpack ${emptyBackpack + 1}.`, 'loot');
                } else {
                  this.gridMap.addItem(gridPos.x, gridPos.y, topItem);
                  this.combatLogUI.log('Inventory full! Cannot loot item.', 'warning');
                }
              }
              this.updateHUD();
              this.persistSave();
            }
          }
        }
      }

      this.selectedMonsterId = null;
    });
  }

  private showVictoryModal(): void {
    const modal = document.getElementById('modal-overlay');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="result-modal victory-modal">
        <h2>🏆 ULTIMATE VICTORY!</h2>
        <p class="result-subtitle">Lokarta Subterranean Campaign - All 20 Floors Cleared</p>
        <p>You have illuminated the darkest depths of the subterranean abyss and vanquished the Void Core!</p>
        <div class="character-summary">
          <p><strong>Vocation:</strong> ${this.player.vocation.toUpperCase()}</p>
          <p><strong>Final Level:</strong> Level ${this.player.level}</p>
          <p><strong>Damage Boost:</strong> +${Math.round(((this.player.skillBoosts?.damageMultiplier || 1) - 1) * 100)}%</p>
          <p><strong>Remaining HP:</strong> ${this.player.hp} / ${this.player.max_hp}</p>
          <p><strong>Remaining MP:</strong> ${this.player.mana} / ${this.player.max_mana}</p>
        </div>
        <button class="action-btn" id="btn-restart">Play Again</button>
      </div>
    `;

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      soundFX.playClick();
      modal.classList.add('hidden');
      modal.innerHTML = '';
      window.location.reload();
    });
  }

  private showGameOverModal(): void {
    const modal = document.getElementById('modal-overlay');
    if (!modal) return;
    soundFX.playDefeat();
    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="result-modal defeat-modal">
        <h2>💀 YOU HAVE PERISHED</h2>
        <p class="result-subtitle">Floor ${this.player.current_floor}/20 Claims Another Soul</p>
        <p>Your light has been extinguished in the subterranean shadows.</p>
        <button class="action-btn" id="btn-retry">Try Again</button>
      </div>
    `;

    document.getElementById('btn-retry')?.addEventListener('click', () => {
      soundFX.playClick();
      modal.classList.add('hidden');
      modal.innerHTML = '';
      window.location.reload();
    });
  }
}
