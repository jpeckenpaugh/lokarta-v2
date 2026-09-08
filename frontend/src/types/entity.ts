import { VocationType } from './api';
import { PaperdollSlots, Item } from './item';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Coordinates {
  x: number;
  y: number;
}

export interface SkillBoosts {
  damageMultiplier: number;
  bonusRange: number;
  bonusRegen: number;
}

export interface PlayerEntity {
  id: string;
  vocation: VocationType;
  x: number;
  y: number;
  facing: Direction;
  hp: number;
  max_hp: number;
  mana: number;
  max_mana: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  skillBoosts: SkillBoosts;
  current_floor: number;
  paperdoll: PaperdollSlots;
  backpack: (Item | null)[];
  lightSpellTimer: number; // remaining duration in seconds
  cooldowns: Record<string, number>; // abilityId -> remaining cooldown in seconds
}

export type MonsterType = 'crypt_skeleton' | 'shadow_cultist';

export interface MonsterEntity {
  id: string;
  type: MonsterType;
  name: string;
  x: number;
  y: number;
  hp: number;
  max_hp: number;
  facing: Direction;
  isAggroed: boolean;
  moveCooldown?: number; // in seconds
  moveCadence?: number; // movement delay between steps (e.g. 0.8s)
  attackCooldown: number; // in seconds
  attackCadence: number; // 1.5s for skeleton, 2.0s for cultist
  visible: boolean; // computed by light mask
}

export type ProjectileType = 'wand_spark' | 'energy_beam' | 'bow_shot' | 'power_shot' | 'shadow_bolt';

export interface Projectile {
  id: string;
  type: ProjectileType;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  currentX: number; // pixel coords
  currentY: number;
  durationMs: number;
  elapsedMs: number;
  color: string;
  direction?: Direction;
  piercingTiles?: Coordinates[];
}

export interface FloatingText {
  id: string;
  text: string;
  x: number; // pixel coords
  y: number;
  color: string;
  durationMs: number;
  elapsedMs: number;
}
