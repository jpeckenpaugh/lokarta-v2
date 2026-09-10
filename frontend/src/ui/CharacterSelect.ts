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
          <!-- Magician -->
          <div class="vocation-card" data-vocation="magician">
            <div class="card-icon magician-icon">🧙</div>
            <h3>Magician</h3>
            <div class="stats-preview">
              <div class="stat-row"><span class="stat-label">Health:</span> <span class="stat-val hp">60 HP</span></div>
              <div class="stat-row"><span class="stat-label">Mana:</span> <span class="stat-val mp">150 MP</span></div>
            </div>
            <p class="desc">Master of radiant light and piercing arcane energy. Uses mana for spells and basic wand spark attacks.</p>
            <ul class="skills-list">
              <li><strong>Wand Spark:</strong> 12–16 Magic Dmg (0 MP)</li>
              <li><strong>Light Spell:</strong> 7-tile vision for 30s (15 MP)</li>
              <li><strong>Energy Beam:</strong> 30–40 Piercing Dmg (30 MP)</li>
            </ul>
            <button class="select-btn" data-vocation="magician">Play Magician</button>
          </div>

          <!-- Archer -->
          <div class="vocation-card" data-vocation="archer">
            <div class="card-icon archer-icon">🏹</div>
            <h3>Archer</h3>
            <div class="stats-preview">
              <div class="stat-row"><span class="stat-label">Health:</span> <span class="stat-val hp">90 HP</span></div>
              <div class="stat-row"><span class="stat-label">Mana:</span> <span class="stat-val mp">80 MP</span></div>
            </div>
            <p class="desc">Disciplined dungeon scout and deadly marksman. Employs physical arrows and precision burst shots.</p>
            <ul class="skills-list">
              <li><strong>Bow Shot:</strong> 14–18 Physical Dmg (1 Arrow)</li>
              <li><strong>Power Shot:</strong> 32–42 Burst Dmg (1 Arrow, 4s CD)</li>
            </ul>
            <button class="select-btn" data-vocation="archer">Play Archer</button>
          </div>

          <!-- Fighter -->
          <div class="vocation-card" data-vocation="fighter">
            <div class="card-icon fighter-icon">⚔️</div>
            <h3>Fighter</h3>
            <div class="stats-preview">
              <div class="stat-row"><span class="stat-label">Health:</span> <span class="stat-val hp">140 HP</span></div>
              <div class="stat-row"><span class="stat-label">Mana:</span> <span class="stat-val mp">30 MP</span></div>
            </div>
            <p class="desc">Heavy-armored frontline juggernaut. Cleaves multiple adjacent foes and shrugs off lethal damage.</p>
            <ul class="skills-list">
              <li><strong>Sword Slash:</strong> 16–22 Melee Dmg</li>
              <li><strong>Sweeping Cleave:</strong> 24–34 Multi-Target Dmg (10 MP)</li>
              <li><strong>Fortify:</strong> -50% Damage Taken for 10s (15 MP)</li>
            </ul>
            <button class="select-btn" data-vocation="fighter">Play Fighter</button>
          </div>

          <!-- Paladin -->
          <div class="vocation-card" data-vocation="paladin">
            <div class="card-icon paladin-icon">🛡️</div>
            <h3>Paladin</h3>
            <div class="stats-preview">
              <div class="stat-row"><span class="stat-label">Health:</span> <span class="stat-val hp">120 HP</span></div>
              <div class="stat-row"><span class="stat-label">Mana:</span> <span class="stat-val mp">90 MP</span></div>
            </div>
            <p class="desc">Holy crusader wielding divine light. Smites foes with holy warhammer and channels restorative healing prayers.</p>
            <ul class="skills-list">
              <li><strong>Holy Strike:</strong> 18–26 Holy Dmg (10 MP)</li>
              <li><strong>Healing Prayer:</strong> Restores 35–50 HP (25 MP)</li>
              <li><strong>Holy Radiance:</strong> 20–30 Area Smite (30 MP)</li>
            </ul>
            <button class="select-btn" data-vocation="paladin">Play Paladin</button>
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
