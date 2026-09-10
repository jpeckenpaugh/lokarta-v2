import { GridMap } from './GridMap';
import { PlayerEntity } from '../types/entity';
import { Item, PaperdollSlotType } from '../types/item';
import { CONFIG } from '../config';

export interface InventoryResult {
  success: boolean;
  message: string;
  item?: Item;
}

export class InventorySystem {
  public static getMaxStack(itemId: string): number {
    if (itemId === 'health_potion' || itemId === 'mana_potion' || itemId === 'torch') {
      return 9;
    }
    if (itemId === 'arrows') {
      return 99;
    }
    return 1;
  }

  /**
   * Automatically loot all items on the current player tile into lowest available Action Slot, then Backpack.
   */
  public static autoLootTile(player: PlayerEntity, gridMap: GridMap): InventoryResult {
    const tileItems = gridMap.getItems(player.x, player.y);
    if (tileItems.length === 0) {
      return { success: false, message: '' };
    }

    const pickedUpNames: string[] = [];

    // Process from top to bottom
    while (tileItems.length > 0) {
      const topItem = tileItems[tileItems.length - 1];
      const maxStack = InventorySystem.getMaxStack(topItem.item_id);
      let itemLootedAmount = 0;

      // 1. If stackable, try merging into existing action_bar slots
      if (maxStack > 1) {
        for (let i = 0; i < player.action_bar.length; i++) {
          const slotItem = player.action_bar[i];
          if (slotItem && slotItem.item_id === topItem.item_id && slotItem.quantity < maxStack) {
            const space = maxStack - slotItem.quantity;
            const toAdd = Math.min(space, topItem.quantity);
            slotItem.quantity += toAdd;
            topItem.quantity -= toAdd;
            itemLootedAmount += toAdd;
            if (topItem.quantity <= 0) break;
          }
        }
      }

      // 2. If stackable and remainder exists, try merging into existing backpack slots
      if (maxStack > 1 && topItem.quantity > 0) {
        for (let i = 0; i < player.backpack.length; i++) {
          const slotItem = player.backpack[i];
          if (slotItem && slotItem.item_id === topItem.item_id && slotItem.quantity < maxStack) {
            const space = maxStack - slotItem.quantity;
            const toAdd = Math.min(space, topItem.quantity);
            slotItem.quantity += toAdd;
            topItem.quantity -= toAdd;
            itemLootedAmount += toAdd;
            if (topItem.quantity <= 0) break;
          }
        }
      }

      // 3. Try placing into lowest empty Action Slot (0..9)
      if (topItem.quantity > 0) {
        const emptyActionBarIdx = player.action_bar.findIndex(s => s === null);
        if (emptyActionBarIdx !== -1) {
          const toMove = Math.min(maxStack, topItem.quantity);
          topItem.quantity -= toMove;
          itemLootedAmount += toMove;
          player.action_bar[emptyActionBarIdx] = {
            ...topItem,
            quantity: toMove,
          };
        }
      }

      // 4. Try placing into lowest empty Backpack Slot (0..5)
      if (topItem.quantity > 0) {
        const emptyBackpackIdx = player.backpack.findIndex(s => s === null);
        if (emptyBackpackIdx !== -1) {
          const toMove = Math.min(maxStack, topItem.quantity);
          topItem.quantity -= toMove;
          itemLootedAmount += toMove;
          player.backpack[emptyBackpackIdx] = {
            ...topItem,
            quantity: toMove,
          };
        }
      }

      if (topItem.quantity <= 0) {
        gridMap.popTopItem(player.x, player.y);
      }

      if (itemLootedAmount > 0) {
        pickedUpNames.push(`${topItem.name}${itemLootedAmount > 1 ? ` (x${itemLootedAmount})` : ''}`);
      }

      // If we couldn't loot any of this top item, inventory is full; break loop
      if (itemLootedAmount === 0 && topItem.quantity > 0) {
        break;
      }
    }

    if (pickedUpNames.length === 0) {
      return { success: false, message: 'Inventory is full! Remaining items stay on floor.' };
    }

    return {
      success: true,
      message: `Auto-looted: ${pickedUpNames.join(', ')}.`,
    };
  }

  public static pickUpItem(player: PlayerEntity, gridMap: GridMap): InventoryResult {
    return InventorySystem.autoLootTile(player, gridMap);
  }

  public static dropActionBarItem(player: PlayerEntity, slotIndex: number, gridMap: GridMap): InventoryResult {
    if (slotIndex < 0 || slotIndex >= player.action_bar.length) {
      return { success: false, message: 'Invalid action slot.' };
    }

    const item = player.action_bar[slotIndex];
    if (!item) {
      return { success: false, message: 'Action slot is empty.' };
    }

    // Spells cannot be dropped on the floor
    if (item.type === 'spell') {
      player.action_bar[slotIndex] = null;
      return { success: true, message: `Removed spell ${item.name} from action bar.` };
    }

    player.action_bar[slotIndex] = null;
    gridMap.addItem(player.x, player.y, item);

    return {
      success: true,
      message: `Dropped ${item.name} on the floor.`,
      item,
    };
  }

  public static dropBackpackItem(player: PlayerEntity, slotIndex: number, gridMap: GridMap): InventoryResult {
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

  public static equipItemFromBackpack(player: PlayerEntity, backpackSlotIndex: number): InventoryResult {
    if (backpackSlotIndex < 0 || backpackSlotIndex >= player.backpack.length) {
      return { success: false, message: 'Invalid backpack slot.' };
    }

    const item = player.backpack[backpackSlotIndex];
    if (!item) {
      return { success: false, message: 'No item in selected slot.' };
    }

    const targetSlot = InventorySystem.getTargetPaperdollSlot(item);
    if (!targetSlot) {
      return { success: false, message: `${item.name} cannot be equipped to paperdoll.` };
    }

    const currentlyEquipped = player.paperdoll[targetSlot];

    // If equipping 1 from a stack > 1 (e.g. torches)
    if (item.quantity > 1) {
      item.quantity -= 1;
      player.paperdoll[targetSlot] = {
        ...item,
        quantity: 1,
      };
      if (currentlyEquipped) {
        const emptyIdx = player.backpack.findIndex(s => s === null);
        if (emptyIdx !== -1) {
          player.backpack[emptyIdx] = currentlyEquipped;
        } else {
          item.quantity += 1;
          player.paperdoll[targetSlot] = currentlyEquipped;
          return { success: false, message: 'Cannot swap: Backpack is full!' };
        }
      }
    } else {
      player.paperdoll[targetSlot] = item;
      player.backpack[backpackSlotIndex] = currentlyEquipped;
    }

    const equipMsg = item.item_id === 'torch'
      ? `Lit and equipped Wooden Torch in ${targetSlot.replace('_', ' ')}! Illuminating surrounding area.`
      : `Equipped ${item.name} in ${targetSlot.replace('_', ' ')}.`;

    return {
      success: true,
      message: equipMsg,
      item: player.paperdoll[targetSlot] || item,
    };
  }

  public static equipItemFromActionBar(player: PlayerEntity, actionSlotIndex: number): InventoryResult {
    if (actionSlotIndex < 0 || actionSlotIndex >= player.action_bar.length) {
      return { success: false, message: 'Invalid action slot.' };
    }

    const item = player.action_bar[actionSlotIndex];
    if (!item) {
      return { success: false, message: 'No item in selected slot.' };
    }

    const targetSlot = InventorySystem.getTargetPaperdollSlot(item);
    if (!targetSlot) {
      return { success: false, message: `${item.name} cannot be equipped to paperdoll.` };
    }

    const currentlyEquipped = player.paperdoll[targetSlot];

    if (item.quantity > 1) {
      item.quantity -= 1;
      player.paperdoll[targetSlot] = {
        ...item,
        quantity: 1,
      };
      if (currentlyEquipped) {
        const emptyIdx = player.backpack.findIndex(s => s === null);
        if (emptyIdx !== -1) {
          player.backpack[emptyIdx] = currentlyEquipped;
        } else {
          item.quantity += 1;
          player.paperdoll[targetSlot] = currentlyEquipped;
          return { success: false, message: 'Cannot swap: Backpack is full!' };
        }
      }
    } else {
      player.paperdoll[targetSlot] = item;
      player.action_bar[actionSlotIndex] = currentlyEquipped;
    }

    return {
      success: true,
      message: `Equipped ${item.name} in ${targetSlot.replace('_', ' ')}.`,
      item: player.paperdoll[targetSlot] || item,
    };
  }

  public static unequipItem(player: PlayerEntity, slotName: PaperdollSlotType): InventoryResult {
    const item = player.paperdoll[slotName];
    if (!item) {
      return { success: false, message: `No item equipped in ${slotName.replace('_', ' ')}.` };
    }

    const maxStack = InventorySystem.getMaxStack(item.item_id);

    // 1. Try merging into existing stack in action bar or backpack
    if (maxStack > 1) {
      for (let i = 0; i < player.action_bar.length; i++) {
        const slotItem = player.action_bar[i];
        if (slotItem && slotItem.item_id === item.item_id && slotItem.quantity < maxStack) {
          const space = maxStack - slotItem.quantity;
          const toAdd = Math.min(space, item.quantity);
          slotItem.quantity += toAdd;
          player.paperdoll[slotName] = null;
          return {
            success: true,
            message: `Unequipped ${item.name} and merged into action bar stack.`,
            item: slotItem,
          };
        }
      }
      for (let i = 0; i < player.backpack.length; i++) {
        const slotItem = player.backpack[i];
        if (slotItem && slotItem.item_id === item.item_id && slotItem.quantity < maxStack) {
          const space = maxStack - slotItem.quantity;
          const toAdd = Math.min(space, item.quantity);
          slotItem.quantity += toAdd;
          player.paperdoll[slotName] = null;
          return {
            success: true,
            message: `Unequipped ${item.name} and merged into backpack stack.`,
            item: slotItem,
          };
        }
      }
    }

    // 2. Put into lowest empty action slot or backpack slot
    const emptyActionIdx = player.action_bar.findIndex(s => s === null);
    if (emptyActionIdx !== -1) {
      player.paperdoll[slotName] = null;
      player.action_bar[emptyActionIdx] = item;
      return {
        success: true,
        message: `Unequipped ${item.name} into Action Slot ${emptyActionIdx + 1}.`,
        item,
      };
    }

    const emptyBackpackIdx = player.backpack.findIndex(s => s === null);
    if (emptyBackpackIdx !== -1) {
      player.paperdoll[slotName] = null;
      player.backpack[emptyBackpackIdx] = item;
      return {
        success: true,
        message: `Unequipped ${item.name} into Backpack slot ${emptyBackpackIdx + 1}.`,
        item,
      };
    }

    return { success: false, message: 'Cannot unequip: All Action Slots and Backpack slots are full!' };
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

    if (item.type === 'weapon' || item.type === 'offhand' || item.type === 'armor' || item.type === 'relic' || item.item_id === 'torch') {
      return InventorySystem.equipItemFromBackpack(player, slotIndex);
    }

    return { success: false, message: `Cannot use ${item.name}.` };
  }

  public static useActionBarItem(player: PlayerEntity, slotIndex: number): InventoryResult {
    if (slotIndex < 0 || slotIndex >= player.action_bar.length) {
      return { success: false, message: 'Invalid action slot.' };
    }

    const item = player.action_bar[slotIndex];
    if (!item) {
      return { success: false, message: 'Slot is empty.' };
    }

    if (item.type === 'consumable') {
      return InventorySystem.consumeItem(player, item, () => {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          player.action_bar[slotIndex] = null;
        }
      });
    }

    if (item.type === 'weapon' || item.type === 'offhand' || item.type === 'armor' || item.type === 'relic' || item.item_id === 'torch') {
      return InventorySystem.equipItemFromActionBar(player, slotIndex);
    }

    return { success: false, message: `Used ${item.name}.` };
  }

  public static getTargetPaperdollSlot(item: Item): PaperdollSlotType | null {
    if (item.type === 'weapon') return 'main_hand';
    if (item.type === 'offhand' || item.item_id === 'torch' || item.item_id.includes('shield') || item.item_id.includes('buckler')) return 'off_hand';
    if (item.type === 'armor') return 'armor';
    if (item.type === 'relic') return 'relic';
    return null;
  }

  public static moveItem(
    player: PlayerEntity,
    fromContainer: 'action_bar' | 'backpack',
    fromIndex: number,
    toContainer: 'action_bar' | 'backpack',
    toIndex: number
  ): boolean {
    const fromList = fromContainer === 'action_bar' ? player.action_bar : player.backpack;
    const toList = toContainer === 'action_bar' ? player.action_bar : player.backpack;

    if (fromIndex < 0 || fromIndex >= fromList.length || toIndex < 0 || toIndex >= toList.length) {
      return false;
    }

    const temp = fromList[fromIndex];
    fromList[fromIndex] = toList[toIndex];
    toList[toIndex] = temp;
    return true;
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
