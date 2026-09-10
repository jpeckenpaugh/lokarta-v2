import { PlayerEntity, SkillBoosts } from '../types/entity';
import { VocationType } from '../types/api';

export interface LevelUpResult {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  hpGained: number;
  manaGained: number;
  damagePercentGained: number;
}

export class ProgressionSystem {
  public static readonly MAX_LEVEL = 20;

  /**
   * Calculate XP required to advance from current level to next.
   */
  public static getXpForLevel(level: number): number {
    return level * 100;
  }

  /**
   * Determine XP rewarded for defeating an enemy at given floor depth.
   */
  public static getMonsterXp(monsterType: string, floor: number, isBoss = false): number {
    if (isBoss) {
      return 500;
    }
    if (monsterType === 'crypt_skeleton') {
      return 35 + (floor - 1) * 8;
    }
    if (monsterType === 'shadow_cultist') {
      return 45 + (floor - 1) * 10;
    }
    return 30 + floor * 5;
  }

  /**
   * Calculates active skill and stat boosts for a character at a given level.
   */
  public static computeSkillBoosts(vocation: VocationType, level: number): SkillBoosts {
    const levelDelta = Math.max(0, level - 1);
    let damageStep = 0.10;
    if (vocation === 'archer') damageStep = 0.12;
    if (vocation === 'fighter') damageStep = 0.14;
    if (vocation === 'paladin') damageStep = 0.12;

    return {
      damageMultiplier: 1.0 + levelDelta * damageStep,
      bonusRange: (vocation === 'archer' || vocation === 'magician') ? Math.floor(levelDelta / 4) : 0,
      bonusRegen: Math.floor(levelDelta / 3),
    };
  }

  /**
   * Initial default skill boosts for fresh level 1 player.
   */
  public static getDefaultSkillBoosts(): SkillBoosts {
    return {
      damageMultiplier: 1.0,
      bonusRange: 0,
      bonusRegen: 0,
    };
  }

  /**
   * Awards XP to the player, handling multiple level-ups and stat enhancements.
   */
  public static awardXP(player: PlayerEntity, amount: number): LevelUpResult {
    const oldLevel = player.level;
    let hpGained = 0;
    let manaGained = 0;

    if (player.level >= ProgressionSystem.MAX_LEVEL) {
      player.xp = player.xpToNextLevel;
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

      // Stat Boosts per level based on vocation
      let hpInc = 10;
      let manaInc = 10;

      if (player.vocation === 'magician') {
        hpInc = 8;
        manaInc = 16;
      } else if (player.vocation === 'archer') {
        hpInc = 14;
        manaInc = 8;
      } else if (player.vocation === 'fighter') {
        hpInc = 18;
        manaInc = 4;
      } else if (player.vocation === 'paladin') {
        hpInc = 15;
        manaInc = 10;
      }

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
    const oldBoost = ProgressionSystem.computeSkillBoosts(player.vocation, oldLevel);
    const newDmg = player.skillBoosts.damageMultiplier;
    const damagePercentGained = Math.round((newDmg - oldBoost.damageMultiplier) * 100);

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
