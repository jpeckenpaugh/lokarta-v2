import { GridMap } from './GridMap';
import { PlayerEntity } from '../types/entity';
import { Item, PaperdollSlots } from '../types/item';
import { CONFIG } from '../config';

export interface InventoryResult {
  success: boolean;
  message: string;
  item?: Item;
}

export class InventorySystem {
  public static pickUpItem(player: PlayerEntity, gridMap: GridMap): InventoryResult {
    const tileItems = gridMap.getItems(player.x, player.y);
    if (tileItems.length === 0) {
      return { success: false, message: 'There is nothing here to pick up.' };
    }

    const groundItem = tileItems[tileItems.length - 1]; // top item

    // If it's arrows, check if we can merge into existing arrows in backpack
    if (groundItem.item_id === 'arrows') {
      for (let i = 0; i < player.backpack.length; i++) {
        const slotItem = player.backpack[i];
        if (slotItem && slotItem.item_id === 'arrows') {
          slotItem.quantity += groundItem.quantity;
          gridMap.popTopItem(player.x, player.y);
          return {
            success: true,
            message: `Added ${groundItem.quantity} arrows to quiver (total ${slotItem.quantity}).`,
            item: slotItem,
          };
        }
      }
    }

    // Find first empty backpack slot
    const emptyIndex = player.backpack.findIndex(slot => slot === null);
    if (emptyIndex === -1) {
      return { success: false, message: 'Backpack is full (6/6 slots)!' };
    }

    // Move item to backpack
    gridMap.popTopItem(player.x, player.y);
    player.backpack[emptyIndex] = groundItem;

    return {
      success: true,
      message: `Picked up ${groundItem.name}.`,
      item: groundItem,
    };
  }

  public static dropItem(player: PlayerEntity, slotIndex: number, gridMap: GridMap): InventoryResult {
    if (slotIndex < 0 || slotIndex >= player.backpack.length) {
      return { success: false, message: 'Invalid backpack slot.' };
    }

    const item = player.backpack[slotIndex];
    if (!item) {
      return { success: false, message: 'Slot is empty.' };
    }

    player.backpack[slotIndex] = null;
    gridMap.addItem(player.x, player.y, item);

    return {
      success: true,
      message: `Dropped ${item.name} on the floor.`,
      item,
    };
  }

  public static equipItem(player: PlayerEntity, backpackSlotIndex: number): InventoryResult {
    if (backpackSlotIndex < 0 || backpackSlotIndex >= player.backpack.length) {
      return { success: false, message: 'Invalid backpack slot.' };
    }

    const item = player.backpack[backpackSlotIndex];
    if (!item) {
      return { success: false, message: 'No item in selected slot.' };
    }

    let targetSlot: keyof PaperdollSlots | null = null;
    if (item.type === 'weapon') {
      targetSlot = 'right_hand';
    } else if (item.type === 'offhand') {
      targetSlot = 'left_hand';
    } else if (item.type === 'armor') {
      targetSlot = 'armor';
    } else {
      return { success: false, message: `${item.name} cannot be equipped.` };
    }

    const currentlyEquipped = player.paperdoll[targetSlot];
    player.paperdoll[targetSlot] = item;
    player.backpack[backpackSlotIndex] = currentlyEquipped; // swap or null

    const equipMsg = item.item_id === 'torch'
      ? `Lit and equipped Wooden Torch in ${targetSlot.replace('_', ' ')}! Illuminating surrounding area.`
      : `Equipped ${item.name} in ${targetSlot.replace('_', ' ')}.`;

    return {
      success: true,
      message: equipMsg,
      item,
    };
  }

  public static unequipItem(player: PlayerEntity, slotName: keyof PaperdollSlots): InventoryResult {
    const item = player.paperdoll[slotName];
    if (!item) {
      return { success: false, message: `No item equipped in ${slotName.replace('_', ' ')}.` };
    }

    const emptyIndex = player.backpack.findIndex(slot => slot === null);
    if (emptyIndex === -1) {
      return { success: false, message: 'Cannot unequip: Backpack is full!' };
    }

    player.paperdoll[slotName] = null;
    player.backpack[emptyIndex] = item;

    return {
      success: true,
      message: `Unequipped ${item.name}.`,
      item,
    };
  }

  public static useBackpackItem(player: PlayerEntity, slotIndex: number): InventoryResult {
    if (slotIndex < 0 || slotIndex >= player.backpack.length) {
      return { success: false, message: 'Invalid backpack slot.' };
    }

    const item = player.backpack[slotIndex];
    if (!item) {
      return { success: false, message: 'Slot is empty.' };
    }

    if (item.type === 'consumable') {
      return InventorySystem.consumeItem(player, item, () => {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          player.backpack[slotIndex] = null;
        }
      });
    }

    // If equipment or torch, equip
    if (item.type === 'weapon' || item.type === 'offhand' || item.type === 'armor' || item.item_id === 'torch') {
      return InventorySystem.equipItem(player, slotIndex);
    }

    return { success: false, message: `Cannot use ${item.name}.` };
  }

  public static useGroundItem(player: PlayerEntity, gridMap: GridMap, itemIndex?: number): InventoryResult {
    const tile = gridMap.getTile(player.x, player.y);
    if (!tile || tile.items.length === 0) {
      return { success: false, message: 'No item on ground to use.' };
    }

    const idx = itemIndex !== undefined ? itemIndex : tile.items.length - 1;
    const item = tile.items[idx];
    if (!item) {
      return { success: false, message: 'Item not found on floor.' };
    }

    if (item.type === 'consumable') {
      return InventorySystem.consumeItem(player, item, () => {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          gridMap.removeItem(player.x, player.y, idx);
        }
      });
    }

    // If torch on ground, direct equip
    if (item.item_id === 'torch') {
      const prevLeft = player.paperdoll.left_hand;
      player.paperdoll.left_hand = item;
      gridMap.removeItem(player.x, player.y, idx);
      if (prevLeft) {
        gridMap.addItem(player.x, player.y, prevLeft);
      }
      return {
        success: true,
        message: 'Lit and equipped Wooden Torch from floor! (6 tiles light radius).',
        item,
      };
    }

    return { success: false, message: `Cannot use ${item.name} directly from ground. Pick it up first [E].` };
  }

  private static consumeItem(player: PlayerEntity, item: Item, removeCallback: () => void): InventoryResult {
    if (item.item_id === 'health_potion') {
      if (player.hp >= player.max_hp) {
        return { success: false, message: 'Health is already full!' };
      }
      const restored = Math.min(CONFIG.HEALTH_POTION_HEAL, player.max_hp - player.hp);
      player.hp = Math.min(player.max_hp, player.hp + CONFIG.HEALTH_POTION_HEAL);
      removeCallback();
      return {
        success: true,
        message: `Drank Health Potion. Restored +${restored} HP (${player.hp}/${player.max_hp}).`,
        item,
      };
    } else if (item.item_id === 'mana_potion') {
      if (player.mana >= player.max_mana) {
        return { success: false, message: 'Mana is already full!' };
      }
      const restored = Math.min(CONFIG.MANA_POTION_RESTORE, player.max_mana - player.mana);
      player.mana = Math.min(player.max_mana, player.mana + CONFIG.MANA_POTION_RESTORE);
      removeCallback();
      return {
        success: true,
        message: `Drank Mana Potion. Restored +${restored} MP (${player.mana}/${player.max_mana}).`,
        item,
      };
    }

    return { success: false, message: `Unknown consumable item: ${item.name}` };
  }
}
