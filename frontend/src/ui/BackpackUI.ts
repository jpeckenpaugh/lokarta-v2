import { Item } from '../types/item';

export class BackpackUI {
  private container: HTMLElement;
  private onUseCallback: (slotIndex: number) => void;
  private onDropCallback: (slotIndex: number) => void;

  constructor(
    containerId: string,
    onUse: (slotIndex: number) => void,
    onDrop: (slotIndex: number) => void
  ) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`Backpack container #${containerId} not found.`);
    }
    this.container = el;
    this.onUseCallback = onUse;
    this.onDropCallback = onDrop;
  }

  public update(backpack: (Item | null)[]): void {
    let html = `
      <div class="panel-header">
        <span>BACKPACK (6 SLOTS)</span>
        <span class="slot-count">${backpack.filter(Boolean).length}/6</span>
      </div>
      <div class="backpack-slots-grid">
    `;

    for (let i = 0; i < 6; i++) {
      const item = backpack[i] || null;
      const isOccupied = item !== null;
      const tooltip = isOccupied
        ? `${item.name} (${item.type})${item.quantity > 1 ? ` x${item.quantity}` : ''}${item.stat_bonus > 0 ? ` [Stat: +${item.stat_bonus}]` : ''} - Click to Use/Equip, [Drop] to place on ground`
        : `Slot ${i + 1} (Empty)`;

      html += `
        <div class="backpack-slot ${isOccupied ? 'occupied' : 'empty'}" data-index="${i}" title="${tooltip}">
          <div class="slot-num"><span class="slot-hotkey">#${i + 1}</span></div>
          <div class="slot-content">
            ${isOccupied ? this.renderItemIcon(item) : ''}
          </div>
          ${isOccupied && item.quantity > 1 ? `<div class="item-qty">x${item.quantity}</div>` : ''}
          <div class="slot-item-name">${isOccupied ? item.name : 'Empty'}</div>
          ${
            isOccupied
              ? `<div class="slot-actions">
                  <button class="use-btn" data-index="${i}" title="Use / Equip">Equip/Use</button>
                  <button class="drop-btn" data-index="${i}" title="Drop to ground">Drop</button>
                </div>`
              : ''
          }
        </div>
      `;
    }

    html += `</div>`;
    this.container.innerHTML = html;

    // Use buttons
    const useBtns = this.container.querySelectorAll('.use-btn');
    useBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const index = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') || '-1', 10);
        if (index >= 0) {
          this.onUseCallback(index);
        }
      });
    });

    // Drop buttons
    const dropBtns = this.container.querySelectorAll('.drop-btn');
    dropBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const index = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') || '-1', 10);
        if (index >= 0) {
          this.onDropCallback(index);
        }
      });
    });

    // Direct click slot
    const slotElements = this.container.querySelectorAll('.backpack-slot.occupied');
    slotElements.forEach(el => {
      el.addEventListener('click', e => {
        if ((e.target as HTMLElement).classList.contains('drop-btn') || (e.target as HTMLElement).classList.contains('use-btn')) return;
        const index = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') || '-1', 10);
        if (index >= 0) {
          this.onUseCallback(index);
        }
      });
    });
  }

  private renderItemIcon(item: Item): string {
    if (item.item_id === 'health_potion') return '🧪';
    if (item.item_id === 'mana_potion') return '🔷';
    if (item.item_id === 'torch') return '🔥';
    if (item.item_id === 'arrows') return '🏹';
    if (item.item_id.includes('wand')) return '🪄';
    if (item.item_id.includes('bow')) return '🏹';
    if (item.item_id.includes('sword') || item.item_id.includes('blade')) return '⚔️';
    if (item.item_id.includes('warhammer') || item.item_id.includes('hammer')) return '🔨';
    if (item.item_id.includes('robe')) return '🥋';
    if (item.item_id.includes('armor') || item.item_id.includes('plate') || item.item_id.includes('cuirass')) return '🦺';
    if (item.item_id.includes('shield') || item.item_id.includes('buckler')) return '🛡️';
    if (item.type === 'relic') return '👑';
    return '📦';
  }
}
