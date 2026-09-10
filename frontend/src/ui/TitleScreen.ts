import { VocationType } from '../types/api';
import { SyncManager } from '../engine/SyncManager';
import { soundFX } from '../audio/AudioSystem';

export class TitleScreen {
  private container: HTMLElement;
  private onStartSession: (vocation: VocationType, isContinue?: boolean) => void;

  constructor(containerId: string, onStartSession: (vocation: VocationType, isContinue?: boolean) => void) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`TitleScreen container #${containerId} not found.`);
    }
    this.container = el;
    this.onStartSession = onStartSession;
  }

  public async show(): Promise<void> {
    this.container.classList.remove('hidden');

    let savedSummaryHtml = '';
    let hasSavedGame = false;
    let savedVocation: VocationType = 'magician';

    try {
      // Check if saved character progress exists across 4 vocations
      const vocations: VocationType[] = ['magician', 'archer', 'fighter', 'paladin'];
      for (const voc of vocations) {
        const saved = await SyncManager.fetchCharacter(voc).catch(() => null);
        if (saved && ((saved.current_floor && saved.current_floor > 1) || (saved.level && saved.level > 1))) {
          hasSavedGame = true;
          savedVocation = saved.vocation;
          savedSummaryHtml = `
            <div class="continue-summary-card">
              <div class="save-tag">💾 Active Saved Quest</div>
              <div class="save-details">
                <strong>${saved.vocation.toUpperCase()}</strong> • Level ${saved.level || 1} • Floor ${saved.current_floor || 1}/20
              </div>
              <div class="save-stats">HP: ${saved.hp}/${saved.max_hp} | MP: ${saved.mana}/${saved.max_mana}</div>
            </div>
          `;
          break;
        }
      }
    } catch {
      // Fallback
    }

    this.container.innerHTML = `
      <div class="title-screen-modal">
        <div class="torch-flicker-container">
          <span class="title-torch left-torch">🔥</span>
          <span class="title-torch right-torch">🔥</span>
        </div>

        <div class="title-header">
          <div class="title-emblem">🕯️</div>
          <h1 class="title-main">LOKARTA</h1>
          <p class="title-subtitle">COME INTO THE LIGHT</p>
          <div class="title-tagline">A 20-Floor Subterranean Descent</div>
        </div>

        ${savedSummaryHtml}

        <div class="title-menu-actions">
          ${
            hasSavedGame
              ? `<button class="title-btn continue-btn" id="btn-title-continue">
                  <span class="btn-icon">📜</span> Continue Quest (${savedVocation.toUpperCase()})
                </button>`
              : ''
          }
          <button class="title-btn new-game-btn" id="btn-title-new-game">
            <span class="btn-icon">⚔️</span> ${hasSavedGame ? 'New Game / Change Class' : 'New Game'}
          </button>
          <button class="title-btn guide-btn" id="btn-title-guide">
            <span class="btn-icon">📖</span> How to Play & Controls
          </button>
          <button class="title-btn audio-title-btn" id="btn-title-audio">
            <span class="btn-icon">${soundFX.getMuted() ? '🔇' : '🔊'}</span> Sound FX: ${soundFX.getMuted() ? 'OFF' : 'ON'}
          </button>
        </div>

        <div class="title-footer">
          <span>v2.2 Campaign Edition • 4 Vocations • 10 Action Slots • Fate Grant Roguelike Draft</span>
        </div>
      </div>
    `;

    // Bind Action Buttons
    document.getElementById('btn-title-new-game')?.addEventListener('click', () => {
      soundFX.playClick();
      this.showCharacterSelect();
    });

    document.getElementById('btn-title-continue')?.addEventListener('click', () => {
      soundFX.playClick();
      this.hide();
      this.onStartSession(savedVocation, true);
    });

    document.getElementById('btn-title-guide')?.addEventListener('click', () => {
      soundFX.playClick();
      this.showHowToPlayModal();
    });

    document.getElementById('btn-title-audio')?.addEventListener('click', () => {
      soundFX.init();
      const isMuted = soundFX.toggleMute();
      soundFX.playClick();
      const btn = document.getElementById('btn-title-audio');
      if (btn) {
        btn.innerHTML = `<span class="btn-icon">${isMuted ? '🔇' : '🔊'}</span> Sound FX: ${isMuted ? 'OFF' : 'ON'}`;
      }
      const topBtn = document.getElementById('audio-toggle-btn');
      if (topBtn) {
        topBtn.textContent = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
        if (isMuted) topBtn.classList.add('muted');
        else topBtn.classList.remove('muted');
      }
    });
  }

  public showCharacterSelect(): void {
    this.container.innerHTML = `
      <div class="character-select-modal">
        <div class="modal-header">
          <h2>CHOOSE YOUR VOCATION</h2>
          <p class="subtitle">DESCEND INTO FLOOR 1 OF 20</p>
        </div>
        <p class="prompt">Select your class to begin your descent into the dark labyrinth:</p>
        <div class="vocation-cards">
          <!-- Magician -->
          <div class="vocation-card" data-vocation="magician">
            <div class="card-icon magician-icon">🧙</div>
            <h3>Magician</h3>
            <div class="stats-preview">
              <div class="stat-row"><span class="stat-label">Health:</span> <span class="stat-val hp">60 HP (+8/lv)</span></div>
              <div class="stat-row"><span class="stat-label">Mana:</span> <span class="stat-val mp">150 MP (+16/lv)</span></div>
            </div>
            <p class="desc">Master of radiant illumination and piercing energy beams. Powers scale with +10% magic damage per level.</p>
            <ul class="skills-list">
              <li><strong>Wand Spark:</strong> 12–16 Magic Dmg (0 MP)</li>
              <li><strong>Light Spell:</strong> 7-tile aura for 30s (15 MP)</li>
              <li><strong>Energy Beam:</strong> 30–40 Piercing Dmg (30 MP)</li>
            </ul>
            <button class="select-btn" data-vocation="magician">Select Magician</button>
          </div>

          <!-- Archer -->
          <div class="vocation-card" data-vocation="archer">
            <div class="card-icon archer-icon">🏹</div>
            <h3>Archer</h3>
            <div class="stats-preview">
              <div class="stat-row"><span class="stat-label">Health:</span> <span class="stat-val hp">90 HP (+14/lv)</span></div>
              <div class="stat-row"><span class="stat-label">Mana:</span> <span class="stat-val mp">80 MP (+8/lv)</span></div>
            </div>
            <p class="desc">Deadly ranged scout with high physical stamina. Damage scales with +12% physical power and range per level.</p>
            <ul class="skills-list">
              <li><strong>Bow Shot:</strong> 14–18 Physical Dmg (1 Arrow)</li>
              <li><strong>Power Shot:</strong> 32–42 Heavy Burst (1 Arrow, 4s CD)</li>
            </ul>
            <button class="select-btn" data-vocation="archer">Select Archer</button>
          </div>

          <!-- Fighter -->
          <div class="vocation-card" data-vocation="fighter">
            <div class="card-icon fighter-icon">⚔️</div>
            <h3>Fighter</h3>
            <div class="stats-preview">
              <div class="stat-row"><span class="stat-label">Health:</span> <span class="stat-val hp">140 HP (+18/lv)</span></div>
              <div class="stat-row"><span class="stat-label">Mana:</span> <span class="stat-val mp">30 MP (+4/lv)</span></div>
            </div>
            <p class="desc">Heavy-armored frontline juggernaut. Cleaves multiple adjacent foes and shrugs off lethal damage with Fortify.</p>
            <ul class="skills-list">
              <li><strong>Sword Slash:</strong> 16–22 Melee Dmg</li>
              <li><strong>Sweeping Cleave:</strong> 24–34 Multi-Target (10 MP)</li>
              <li><strong>Fortify:</strong> -50% Damage Taken (15 MP)</li>
            </ul>
            <button class="select-btn" data-vocation="fighter">Select Fighter</button>
          </div>

          <!-- Paladin -->
          <div class="vocation-card" data-vocation="paladin">
            <div class="card-icon paladin-icon">🛡️</div>
            <h3>Paladin</h3>
            <div class="stats-preview">
              <div class="stat-row"><span class="stat-label">Health:</span> <span class="stat-val hp">120 HP (+15/lv)</span></div>
              <div class="stat-row"><span class="stat-label">Mana:</span> <span class="stat-val mp">90 MP (+10/lv)</span></div>
            </div>
            <p class="desc">Holy crusader wielding divine light. Smites foes with holy warhammer and channels restorative healing prayers.</p>
            <ul class="skills-list">
              <li><strong>Holy Strike:</strong> 18–26 Holy Dmg (10 MP)</li>
              <li><strong>Healing Prayer:</strong> Restores 35–50 HP (25 MP)</li>
              <li><strong>Holy Radiance:</strong> 20–30 Area Smite (30 MP)</li>
            </ul>
            <button class="select-btn" data-vocation="paladin">Select Paladin</button>
          </div>
        </div>
        <div class="modal-back-action">
          <button class="action-btn back-btn" id="btn-back-to-title">Back to Title</button>
        </div>
      </div>
    `;

    document.getElementById('btn-back-to-title')?.addEventListener('click', () => {
      soundFX.playClick();
      this.show();
    });

    const buttons = this.container.querySelectorAll('.select-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', e => {
        const vocation = (e.currentTarget as HTMLElement).getAttribute('data-vocation') as VocationType;
        if (vocation) {
          soundFX.playClick();
          this.hide();
          this.onStartSession(vocation, false);
        }
      });
    });
  }

  public showHowToPlayModal(): void {
    this.container.innerHTML = `
      <div class="guide-modal">
        <div class="modal-header">
          <h2>HOW TO PLAY LOKARTA</h2>
          <p class="subtitle">SURVIVAL & EXPLORATION GUIDE</p>
        </div>
        <div class="guide-content">
          <div class="guide-section">
            <h3>🕯️ Darkness & Dynamic Light</h3>
            <p>Subterranean floors are shrouded in pitch darkness. You only see tiles illuminated by equipped <strong>torches</strong> in your off-hand, ambient sconces, or class <strong>Light spells</strong>. Lurking monsters remain hidden in shadows!</p>
          </div>

          <div class="guide-section">
            <h3>🎮 10 Modular Action Slots & Gestures</h3>
            <ul class="guide-list">
              <li><strong>Movement:</strong> <code>W / A / S / D</code> or <code>Arrow Keys</code> (Discrete grid movement)</li>
              <li><strong>10 Action Slots:</strong> Keys <code>[1]</code> through <code>[9]</code>, and <code>[0]</code></li>
              <li><strong>Tap (&lt;250ms):</strong> Fast primary attack, spell, or potion consumption</li>
              <li><strong>Hold / Charge (≥250ms):</strong> Builds up a visual charge gauge on slot icon; releasing discharges an overcharged attack (+50% dmg)</li>
              <li><strong>Double-Tap (&lt;300ms):</strong> Executes swift twin combo or secondary technique</li>
              <li><strong>Walkover Auto-Loot:</strong> Step onto floor items to auto-loot into lowest action slot or backpack!</li>
              <li><strong>Targeting & Floor Interaction:</strong> Click any visible enemy to target, or click adjacent floor item to loot.</li>
            </ul>
          </div>

          <div class="guide-section">
            <h3>🌟 Fate Grant Roguelike Draft</h3>
            <p>Start with zero inventory! At Level 1 and at every level up, the Fate Grant presents 5 random cards tailored to your vocation. Select <strong>1 or 2 cards</strong> to build your loadout with weapons, spells, relics, and armor!</p>
          </div>
        </div>
        <div class="modal-back-action">
          <button class="action-btn" id="btn-guide-back">Return to Title</button>
        </div>
      </div>
    `;

    document.getElementById('btn-guide-back')?.addEventListener('click', () => {
      soundFX.playClick();
      this.show();
    });
  }

  public hide(): void {
    this.container.classList.add('hidden');
    this.container.innerHTML = '';
  }
}
