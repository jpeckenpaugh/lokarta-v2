import { Item } from './item';
import { VocationType } from './api';

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface FateCard {
  id: string;
  name: string;
  rarity: CardRarity;
  icon: string;
  description: string;
  statBonusText: string;
  item: Item;
  vocationAffinity?: VocationType;
}

export interface DraftOffer {
  cards: FateCard[];
  requiredSelections: { min: number; max: number };
}
