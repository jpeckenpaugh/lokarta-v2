import { VocationType } from '../types/api';

export class CharacterSelect {
  private container: HTMLElement;
  private onSelectCallback: (vocation: VocationType) => void;

  constructor(containerId: string, onSelect: (vocation: VocationType) => void) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`CharacterSelect container #${containerId} not found.`);
    }
    this.container = el;
    this.onSelectCallback = onSelect;
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.container.innerHTML = `
      <div class="character-select-modal">
        <div class="modal-header">
          <h2>LOKARTA</h2>
          <p class="subtitle">COME INTO THE LIGHT</p>
        </div>
        <p class="prompt">Choose your vocation to enter the subterranean crypt:</p>
        <div class="vocation-cards">
          <div class="vocation-card" data-vocation="magician">
            <div class="card-icon magician-icon">🧙</div>
            <h3>Magician</h3>
            <div class="stats-preview">
              <div class="stat-row"><span class="stat-label">Health:</span> <span class="stat-val hp">60 HP</span></div>
              <div class="stat-row"><span class="stat-label">Mana:</span> <span class="stat-val mp">120 MP</span></div>
            </div>
            <p class="desc">Master of radiant light and piercing arcane energy. Uses mana for spells and basic wand spark attacks.</p>
            <ul class="skills-list">
              <li><strong>[1] Wand Spark:</strong> 12–16 Magic Dmg (0 Mana)</li>
              <li><strong>[2] Light:</strong> 7-tile vision for 30s (15 Mana)</li>
              <li><strong>[3] Energy Beam:</strong> 30–40 Piercing Dmg (30 Mana)</li>
            </ul>
            <button class="select-btn" data-vocation="magician">Play Magician</button>
          </div>

          <div class="vocation-card" data-vocation="archer">
            <div class="card-icon archer-icon">🏹</div>
            <h3>Archer</h3>
            <div class="stats-preview">
              <div class="stat-row"><span class="stat-label">Health:</span> <span class="stat-val hp">90 HP</span></div>
              <div class="stat-row"><span class="stat-label">Mana:</span> <span class="stat-val mp">60 MP</span></div>
            </div>
            <p class="desc">Disciplined dungeon scout and deadly marksman. Employs physical arrows and precision burst shots.</p>
            <ul class="skills-list">
              <li><strong>[1] Bow Shot:</strong> 14–18 Physical Dmg (1 Arrow)</li>
              <li><strong>[2] Power Shot:</strong> 32–42 Burst Dmg (1 Arrow, 4s CD)</li>
            </ul>
            <button class="select-btn" data-vocation="archer">Play Archer</button>
          </div>
        </div>
      </div>
    `;

    const buttons = this.container.querySelectorAll('.select-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', e => {
        const vocation = (e.currentTarget as HTMLElement).getAttribute('data-vocation') as VocationType;
        if (vocation) {
          this.hide();
          this.onSelectCallback(vocation);
        }
      });
    });
  }

  public hide(): void {
    this.container.classList.add('hidden');
    this.container.innerHTML = '';
  }
}
