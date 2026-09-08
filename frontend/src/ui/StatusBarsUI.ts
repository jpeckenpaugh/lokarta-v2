import { PlayerEntity } from '../types/entity';

export class StatusBarsUI {
  private container: HTMLElement;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`StatusBars container #${containerId} not found.`);
    }
    this.container = el;
  }

  public update(player: PlayerEntity, floorName = 'Subterranean Crypt'): void {
    const hpPercent = Math.max(0, Math.min(100, (player.hp / player.max_hp) * 100));
    const mpPercent = Math.max(0, Math.min(100, (player.mana / player.max_mana) * 100));
    const xpPercent = player.level >= 20 ? 100 : Math.max(0, Math.min(100, (player.xp / (player.xpToNextLevel || 100)) * 100));
    const vocationDisplay = player.vocation.charAt(0).toUpperCase() + player.vocation.slice(1);
    const dmgBonusPct = Math.round(((player.skillBoosts?.damageMultiplier || 1.0) - 1.0) * 100);

    this.container.innerHTML = `
      <div class="status-header">
        <div class="vocation-tag"><span class="level-badge">Lv. ${player.level || 1}</span> <strong class="val">${vocationDisplay}</strong></div>
        <div class="floor-tag"><span class="label">Floor:</span> <strong class="val">${player.current_floor}/20 (${floorName})</strong></div>
      </div>

      <div class="meter-container hp-meter">
        <div class="meter-info">
          <span class="meter-label">HEALTH (HP)</span>
          <span class="meter-values">${player.hp} / ${player.max_hp}</span>
        </div>
        <div class="meter-bar-track">
          <div class="meter-bar-fill hp-fill" style="width: ${hpPercent}%;"></div>
        </div>
      </div>

      <div class="meter-container mp-meter">
        <div class="meter-info">
          <span class="meter-label">MANA (MP)</span>
          <span class="meter-values">${player.mana} / ${player.max_mana}</span>
        </div>
        <div class="meter-bar-track">
          <div class="meter-bar-fill mp-fill" style="width: ${mpPercent}%;"></div>
        </div>
      </div>

      <div class="meter-container xp-meter">
        <div class="meter-info">
          <span class="meter-label">EXP (XP)</span>
          <span class="meter-values">${player.level >= 20 ? 'MAX LEVEL' : `${player.xp || 0} / ${player.xpToNextLevel || 100}`}</span>
        </div>
        <div class="meter-bar-track">
          <div class="meter-bar-fill xp-fill" style="width: ${xpPercent}%;"></div>
        </div>
      </div>

      ${
        dmgBonusPct > 0
          ? `<div class="skill-boosts-summary">
              <span>⚡ Skill Boost: +${dmgBonusPct}% Damage</span>
              ${player.skillBoosts?.bonusRange ? `<span>🏹 +${player.skillBoosts.bonusRange} Range</span>` : ''}
              ${player.skillBoosts?.bonusRegen ? `<span>❤️ +${player.skillBoosts.bonusRegen} Regen</span>` : ''}
            </div>`
          : ''
      }

      ${
        player.lightSpellTimer > 0
          ? `<div class="active-buff-badge">
              <span class="buff-icon">✨</span>
              <span class="buff-text">Light Aura: <strong>${Math.ceil(player.lightSpellTimer)}s</strong> (7 tiles)</span>
            </div>`
          : ''
      }
    `;
  }
}
