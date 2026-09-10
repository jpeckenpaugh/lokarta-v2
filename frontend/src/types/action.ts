import { Item } from './item';

export type GestureType = 'tap' | 'hold' | 'double_tap';

export interface ActionSlotState {
  slotIndex: number;
  hotkey: string;
  item: Item | null;
  cooldownRemaining: number;
  maxCooldown: number;
  chargeProgress: number; // 0.0 to 1.0
  isCharging: boolean;
}

export interface GestureEvent {
  slotIndex: number;
  gesture: GestureType;
  chargeDurationMs: number;
  chargeRatio: number; // 0.0 to 1.0
}
