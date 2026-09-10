import { PlayerEntity } from '../types/entity';
import { Item } from '../types/item';
import { CONFIG } from '../config';

export class HotbarUI {
  private container: HTMLElement;
  private onSlotMouseDownCallback: (slotIndex: number) => void;
  private onSlotMouseUpCallback: (slotIndex: number) => void;
  private onSlotDragDropCallback: (fromSlot: number, toSlot: number) => void;
  private chargeRatios: number[] = new Array(CONFIG.ACTION_BAR_SLOTS).fill(0);

  constructor(
    containerId: string,
    onSlotMouseDown: (slotIndex: number) => void,
    onSlotMouseUp: (slotIndex: number) => void,
    onSlotDragDrop: (fromSlot: number, toSlot: number) => void
  ) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`Hotbar container #${containerId} not found.`);
    }
    this.container = el;
    this.onSlotMouseDownCallback = onSlotMouseDown;
    this.onSlotMouseUpCallback = onSlotMouseUp;
    this.onSlotDragDropCallback = onSlotDragDrop;
  }

  public setChargeRatio(slotIndex: number, ratio: number): void {
    this.chargeRatios[slotIndex] = ratio;
    const chargeBar = this.container.querySelector(`.action-slot-btn[data-slot="${slotIndex}"] .slot-charge-fill`) as HTMLElement;
    const slotBtn = this.container.querySelector(`.action-slot-btn[data-slot="${slotIndex}"]`) as HTMLElement;
    if (chargeBar) {
      chargeBar.style.width = `${Math.round(ratio * 100)}%`;
    }
    if (slotBtn) {
      if (ratio > 0) {
        slotBtn.classList.add('charging');
      } else {
        slotBtn.classList.remove('charging');
      }
    }
  }

  public update(player: PlayerEntity): void {
    let html = `
      <div class="panel-header">MODULAR ACTION SLOTS (KEYS 1–0)</div>
      <div class="action-slots-bar">
    `;

    for (let i = 0; i < CONFIG.ACTION_BAR_SLOTS; i++) {
      const item = player.action_bar[i];
      const hotkeyLabel = i === 9 ? '0' : `${i + 1}`;
      const hasItem = item !== null;
      const itemName = hasItem ? item.name : 'Empty';
      const icon = hasItem ? (item.icon || this.getItemIcon(item)) : '·';
      const costText = hasItem ? this.getItemCostText(item) : '';
      const cdKey = item ? this.getCooldownKey(item) : '';
      const cdRemaining = (cdKey && player.cooldowns[cdKey]) ? player.cooldowns[cdKey] : 0;
      const isOnCooldown = cdRemaining > 0;
      const charge = this.chargeRatios[i] || 0;

      html += `
        <button class="action-slot-btn ${hasItem ? 'occupied' : 'empty'} ${isOnCooldown ? 'on-cooldown' : ''} ${charge > 0 ? 'charging' : ''}"
                data-slot="${i}"
                draggable="${hasItem}"
                title="[${hotkeyLabel}] ${itemName} ${costText ? `(${costText})` : ''} — Tap: Standard, Hold: Overcharge, Double-Tap: Combo">
          <div class="slot-hotkey-badge">[${hotkeyLabel}]</div>
          <div class="slot-icon">${icon}</div>
          <div class="slot-name">${itemName}</div>
          <div class="slot-cost">${costText}</div>
          ${isOnCooldown ? `<div class="cooldown-overlay">${cdRemaining.toFixed(1)}s</div>` : ''}
          <div class="slot-charge-gauge">
            <div class="slot-charge-fill" style="width: ${Math.round(charge * 100)}%;"></div>
          </div>
        </button>
      `;
    }

    html += `</div>`;
    this.container.innerHTML = html;

    // Attach listeners
    const slotButtons = this.container.querySelectorAll('.action-slot-btn');
    slotButtons.forEach(btn => {
      const slotIdx = parseInt((btn as HTMLElement).getAttribute('data-slot') || '0', 10);

      // Mouse press / release events
      btn.addEventListener('mousedown', (e) => {
        if ((e as MouseEvent).button === 0) {
          this.onSlotMouseDownCallback(slotIdx);
        }
      });
      btn.addEventListener('mouseup', (e) => {
        if ((e as MouseEvent).button === 0) {
          this.onSlotMouseUpCallback(slotIdx);
        }
      });
      btn.addEventListener('mouseleave', () => {
        this.onSlotMouseUpCallback(slotIdx);
      });

      // Drag and Drop
      btn.addEventListener('dragstart', (e) => {
        (e as DragEvent).dataTransfer?.setData('text/plain', JSON.stringify({ type: 'action_bar', index: slotIdx }));
      });
      btn.addEventListener('dragover', (e) => {
        e.preventDefault();
        (btn as HTMLElement).classList.add('drag-hover');
      });
      btn.addEventListener('dragleave', () => {
        (btn as HTMLElement).classList.remove('drag-hover');
      });
      btn.addEventListener('drop', (e) => {
        e.preventDefault();
        (btn as HTMLElement).classList.remove('drag-hover');
        const dataStr = (e as DragEvent).dataTransfer?.getData('text/plain');
        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);
            if (data.type === 'action_bar' && data.index !== slotIdx) {
              this.onSlotDragDropCallback(data.index, slotIdx);
            }
          } catch {
            // Ignored
          }
        }
      });
    });
  }

  private getItemIcon(item: Item): string {
    if (item.item_id === 'torch') return '🔥';
    if (item.item_id === 'health_potion') return '🧪';
    if (item.item_id === 'mana_potion') return '🔷';
    if (item.item_id === 'arrows') return '🏹';
    if (item.item_id.includes('wand')) return '🪄';
    if (item.item_id.includes('bow')) return '🏹';
    if (item.item_id.includes('warhammer') || item.item_id.includes('hammer')) return '🔨';
    if (item.item_id.includes('sword') || item.item_id.includes('slash')) return '⚔️';
    if (item.item_id.includes('cleave')) return '🌪️';
    if (item.item_id.includes('fortify')) return '🛡️';
    if (item.item_id.includes('heal') || item.item_id.includes('prayer')) return '💖';
    if (item.item_id.includes('radiance')) return '☀️';
    if (item.item_id.includes('spark')) return '✨';
    if (item.item_id.includes('light')) return '💡';
    if (item.item_id.includes('beam')) return '⚡';
    if (item.type === 'armor') return '🦺';
    if (item.type === 'relic') return '👑';
    return '📦';
  }

  private getItemCostText(item: Item): string {
    if (item.type === 'spell') {
      if (item.manaCost && item.manaCost > 0) return `${item.manaCost} MP`;
      if (item.item_id === 'spell_bow_shot' || item.item_id === 'spell_power_shot') return '1 Arrow';
      return '0 MP';
    }
    if (item.quantity > 1) {
      return `x${item.quantity}`;
    }
    if (item.stat_bonus > 0) {
      return `+${item.stat_bonus}`;
    }
    return '';
  }

  private getCooldownKey(item: Item): string {
    if (item.item_id === 'spell_wand_spark' || item.item_id === 'wand_spark') return 'wand_spark';
    if (item.item_id === 'spell_light' || item.item_id === 'light') return 'light';
    if (item.item_id === 'spell_energy_beam' || item.item_id === 'energy_beam') return 'energy_beam';
    if (item.item_id === 'spell_bow_shot' || item.item_id === 'bow_shot') return 'bow_shot';
    if (item.item_id === 'spell_power_shot' || item.item_id === 'power_shot') return 'power_shot';
    if (item.item_id === 'spell_slash' || item.item_id === 'slash') return 'slash';
    if (item.item_id === 'spell_cleave' || item.item_id === 'cleave') return 'cleave';
    if (item.item_id === 'spell_fortify' || item.item_id === 'fortify') return 'fortify';
    if (item.item_id === 'spell_holy_strike' || item.item_id === 'holy_strike') return 'holy_strike';
    if (item.item_id === 'spell_healing_prayer' || item.item_id === 'healing_prayer') return 'healing_prayer';
    if (item.item_id === 'spell_holy_radiance' || item.item_id === 'holy_radiance') return 'holy_radiance';
    return item.item_id;
  }
}
