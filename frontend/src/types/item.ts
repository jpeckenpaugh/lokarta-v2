export type ItemType = 'weapon' | 'offhand' | 'armor' | 'consumable' | 'ammo';
export type LocationType = 'paperdoll' | 'backpack';

export interface Item {
  item_id: string;
  name: string;
  type: ItemType;
  quantity: number;
  stat_bonus: number;
}

export interface PaperdollSlots {
  right_hand: Item | null;
  left_hand: Item | null;
  armor: Item | null;
}

export interface BackpackSlot {
  slot_index: number;
  item: Item | null;
}
