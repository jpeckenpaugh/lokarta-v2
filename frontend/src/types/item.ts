export type ItemType = 'weapon' | 'offhand' | 'armor' | 'relic' | 'spell' | 'consumable' | 'ammo' | 'tool';
export type LocationType = 'action_bar' | 'backpack' | 'paperdoll';
export type PaperdollSlotType = 'main_hand' | 'off_hand' | 'armor' | 'relic';

export interface Item {
  item_id: string;
  name: string;
  type: ItemType;
  quantity: number;
  stat_bonus: number;
  description?: string;
  manaCost?: number;
  cooldown?: number;
  hotkey?: string;
  icon?: string;
}

export interface PaperdollSlots {
  main_hand: Item | null;
  off_hand: Item | null;
  armor: Item | null;
  relic: Item | null;
}

export interface BackpackSlot {
  slot_index: number;
  item: Item | null;
}

export interface ActionSlot {
  slot_index: number;
  item: Item | null;
}
