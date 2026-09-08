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
      const hotkey = i + 4;
      const tooltip = isOccupied
        ? `${item.name} (${item.type})${item.quantity > 1 ? ` x${item.quantity}` : ''}${item.stat_bonus > 0 ? ` [Stat: +${item.stat_bonus}]` : ''} [Key ${hotkey}] - Click or press ${hotkey} to Use/Equip, [Drop] to place on ground`
        : `Slot ${i + 1} [Key ${hotkey}] (Empty)`;

      html += `
        <div class="backpack-slot ${isOccupied ? 'occupied' : 'empty'}" data-index="${i}" title="${tooltip}">
          <div class="slot-num">${i + 1} <span class="slot-hotkey">[${hotkey}]</span></div>
          <div class="slot-content">
            ${isOccupied ? this.renderItemIcon(item) : ''}
          </div>
          ${isOccupied && item.quantity > 1 ? `<div class="item-qty">x${item.quantity}</div>` : ''}
          <div class="slot-item-name">${isOccupied ? item.name : 'Empty'}</div>
          ${
            isOccupied
              ? `<div class="slot-actions">
                  <button class="use-btn" data-index="${i}" title="Use / Equip">Use</button>
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

    // Direct click / double click slot
    const slotElements = this.container.querySelectorAll('.backpack-slot.occupied');
    slotElements.forEach(el => {
      el.addEventListener('click', e => {
        // If not clicking drop button, trigger use
        if ((e.target as HTMLElement).classList.contains('drop-btn')) return;
        const index = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') || '-1', 10);
        if (index >= 0) {
          this.onUseCallback(index);
        }
      });
    });
  }

  private renderItemIcon(item: Item): string {
    if (item.item_id === 'health_potion') return '🧪';
    if (item.item_id === 'mana_potion') return '⚗️';
    if (item.item_id === 'torch') return '🔥';
    if (item.item_id === 'arrows') return '🏹';
    if (item.item_id.includes('wand')) return '🪄';
    if (item.item_id.includes('robe')) return '🥋';
    if (item.item_id.includes('bow')) return '🏹';
    return '📦';
  }
}
