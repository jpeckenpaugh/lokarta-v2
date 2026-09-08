import { PlayerEntity } from '../types/entity';

export interface AbilityDefinition {
  id: string;
  name: string;
  hotkey: string;
  icon: string;
  costText: string;
  description: string;
}

export class HotbarUI {
  private container: HTMLElement;
  private onTriggerAbilityCallback: (abilityId: string) => void;
  private onPickUpCallback: () => void;
  private onUseGroundCallback: () => void;

  constructor(
    containerId: string,
    onTriggerAbility: (abilityId: string) => void,
    onPickUp: () => void,
    onUseGround: () => void
  ) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`Hotbar container #${containerId} not found.`);
    }
    this.container = el;
    this.onTriggerAbilityCallback = onTriggerAbility;
    this.onPickUpCallback = onPickUp;
    this.onUseGroundCallback = onUseGround;
  }

  public getAbilitiesForVocation(player: PlayerEntity): AbilityDefinition[] {
    if (player.vocation === 'magician') {
      return [
        {
          id: 'wand_spark',
          name: 'Wand Spark',
          hotkey: '1',
          icon: '✨',
          costText: '0 MP',
          description: '12–16 Magic Dmg to targeted enemy (LOS <= 5)',
        },
        {
          id: 'light',
          name: 'Light',
          hotkey: '2',
          icon: '💡',
          costText: '15 MP',
          description: 'Expands vision to 7 tiles for 30s (5s CD)',
        },
        {
          id: 'energy_beam',
          name: 'Energy Beam',
          hotkey: '3',
          icon: '⚡',
          costText: '30 MP',
          description: '30–40 Piercing Dmg in 4-tile line (3s CD)',
        },
      ];
    } else {
      return [
        {
          id: 'bow_shot',
          name: 'Bow Shot',
          hotkey: '1',
          icon: '🏹',
          costText: '1 Arrow',
          description: '14–18 Physical Dmg to targeted enemy (LOS <= 6)',
        },
        {
          id: 'power_shot',
          name: 'Power Shot',
          hotkey: '2',
          icon: '🎯',
          costText: '1 Arrow',
          description: '32–42 Heavy Burst Dmg (4s CD)',
        },
      ];
    }
  }

  public update(player: PlayerEntity, groundItemCount = 0): void {
    const abilities = this.getAbilitiesForVocation(player);

    let html = `
      <div class="panel-header">ACTIONS & ABILITY HOTBAR</div>
      <div class="hotbar-buttons-container">
        <div class="ability-buttons-group">
    `;

    for (const ability of abilities) {
      const cd = player.cooldowns[ability.id] || 0;
      const isOnCooldown = cd > 0;

      html += `
        <button class="hotbar-btn ability-btn ${isOnCooldown ? 'on-cooldown' : ''}" data-ability="${ability.id}" title="${ability.name} [${ability.hotkey}]: ${ability.description} (${ability.costText})">
          <div class="hotkey-badge">[${ability.hotkey}]</div>
          <div class="btn-icon">${ability.icon}</div>
          <div class="btn-name">${ability.name}</div>
          <div class="btn-cost">${ability.costText}</div>
          ${isOnCooldown ? `<div class="cooldown-overlay">${cd.toFixed(1)}s</div>` : ''}
        </button>
      `;
    }

    html += `
        </div>
        <div class="ground-actions-group">
          <button class="hotbar-btn ground-btn" id="btn-pickup" title="Pick up top item from floor [E] / [Space]">
            <div class="hotkey-badge">[E]</div>
            <div class="btn-icon">📥</div>
            <div class="btn-name">Pick Up</div>
            <div class="btn-cost">${groundItemCount > 0 ? `${groundItemCount} on floor` : 'Empty'}</div>
          </button>
          <button class="hotbar-btn ground-btn" id="btn-use-ground" title="Directly drink potion from current floor tile [U]">
            <div class="hotkey-badge">[U]</div>
            <div class="btn-icon">🧪</div>
            <div class="btn-name">Use Floor</div>
            <div class="btn-cost">Potion</div>
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    // Attach listeners
    const abilityBtns = this.container.querySelectorAll('.ability-btn');
    abilityBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        const abilityId = (e.currentTarget as HTMLElement).getAttribute('data-ability');
        if (abilityId) {
          this.onTriggerAbilityCallback(abilityId);
        }
      });
    });

    const pickupBtn = this.container.querySelector('#btn-pickup');
    if (pickupBtn) {
      pickupBtn.addEventListener('click', () => this.onPickUpCallback());
    }

    const useGroundBtn = this.container.querySelector('#btn-use-ground');
    if (useGroundBtn) {
      useGroundBtn.addEventListener('click', () => this.onUseGroundCallback());
    }
  }
}
