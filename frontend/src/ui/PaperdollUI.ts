import { PaperdollSlots, PaperdollSlotType, Item } from '../types/item';

export class PaperdollUI {
  private container: HTMLElement;
  private onUnequipCallback: (slotName: PaperdollSlotType) => void;

  constructor(containerId: string, onUnequip: (slotName: PaperdollSlotType) => void) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`Paperdoll container #${containerId} not found.`);
    }
    this.container = el;
    this.onUnequipCallback = onUnequip;
  }

  public update(paperdoll: PaperdollSlots): void {
    const slots: { key: PaperdollSlotType; label: string; iconPlaceholder: string }[] = [
      { key: 'main_hand', label: 'Main Hand (Weapon)', iconPlaceholder: '⚔️' },
      { key: 'off_hand', label: 'Off-Hand (Shield/Torch)', iconPlaceholder: '🛡️' },
      { key: 'armor', label: 'Body Armor', iconPlaceholder: '🦺' },
      { key: 'relic', label: 'Relic / Accessory', iconPlaceholder: '👑' },
    ];

    let html = `
      <div class="panel-header">EQUIPMENT (4-SLOT PAPERDOLL)</div>
      <div class="paperdoll-slots-grid">
    `;

    for (const slot of slots) {
      const item = paperdoll[slot.key];
      const hasItem = item !== null && item !== undefined;
      const itemName = hasItem ? item.name : 'Empty';
      const statBonus = hasItem && item.stat_bonus > 0 ? ` (+${item.stat_bonus})` : '';

      html += `
        <div class="paperdoll-slot ${hasItem ? 'occupied' : 'empty'}" data-slot="${slot.key}" title="${slot.label}: ${itemName}${statBonus}">
          <div class="slot-label">${slot.key.replace('_', ' ').toUpperCase()}</div>
          <div class="slot-content">
            ${hasItem ? this.renderItemIcon(item) : `<span class="empty-icon">${slot.iconPlaceholder}</span>`}
          </div>
          <div class="slot-item-name">${itemName}</div>
          ${hasItem ? `<button class="unequip-btn" data-slot="${slot.key}" title="Unequip to inventory">✕</button>` : ''}
        </div>
      `;
    }

    html += `</div>`;
    this.container.innerHTML = html;

    // Attach click events for unequip
    const unequipButtons = this.container.querySelectorAll('.unequip-btn');
    unequipButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const slotKey = (e.currentTarget as HTMLElement).getAttribute('data-slot') as PaperdollSlotType;
        if (slotKey) {
          this.onUnequipCallback(slotKey);
        }
      });
    });

    // Double click slot to unequip
    const slotElements = this.container.querySelectorAll('.paperdoll-slot.occupied');
    slotElements.forEach(el => {
      el.addEventListener('dblclick', e => {
        const slotKey = (e.currentTarget as HTMLElement).getAttribute('data-slot') as PaperdollSlotType;
        if (slotKey) {
          this.onUnequipCallback(slotKey);
        }
      });
    });
  }

  private renderItemIcon(item: Item): string {
    if (item.item_id === 'torch') return '🔥';
    if (item.item_id.includes('wand')) return '🪄';
    if (item.item_id.includes('bow')) return '🏹';
    if (item.item_id.includes('sword') || item.item_id.includes('blade')) return '⚔️';
    if (item.item_id.includes('warhammer') || item.item_id.includes('hammer')) return '🔨';
    if (item.item_id.includes('robe')) return '🥋';
    if (item.item_id.includes('armor') || item.item_id.includes('cuirass')) return '🦺';
    if (item.item_id.includes('shield') || item.item_id.includes('buckler')) return '🛡️';
    if (item.type === 'relic') return '👑';
    return '📦';
  }
}
