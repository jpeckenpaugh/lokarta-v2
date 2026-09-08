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
    const damageStep = vocation === 'magician' ? 0.10 : 0.12;

    return {
      damageMultiplier: 1.0 + levelDelta * damageStep,
      bonusRange: Math.floor(levelDelta / 4), // +1 tile range every 4 levels
      bonusRegen: Math.floor(levelDelta / 3), // +1 passive regen bonus every 3 levels
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

      // Stat Boosts per level
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
