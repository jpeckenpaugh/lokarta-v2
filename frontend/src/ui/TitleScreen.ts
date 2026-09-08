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
      // Check if saved character progress exists
      const savedMagician = await SyncManager.fetchCharacter('magician').catch(() => null);
      const savedArcher = await SyncManager.fetchCharacter('archer').catch(() => null);

      const activeSave = (savedMagician && savedMagician.current_floor > 1) ? savedMagician : (savedArcher && savedArcher.current_floor > 1) ? savedArcher : (savedMagician || savedArcher);
      if (activeSave && (activeSave.current_floor > 1 || (activeSave.level && activeSave.level > 1))) {
        hasSavedGame = true;
        savedVocation = activeSave.vocation;
        savedSummaryHtml = `
          <div class="continue-summary-card">
            <div class="save-tag">💾 Active Saved Quest</div>
            <div class="save-details">
              <strong>${activeSave.vocation.toUpperCase()}</strong> • Level ${activeSave.level || 1} • Floor ${activeSave.current_floor}/20
            </div>
            <div class="save-stats">HP: ${activeSave.hp}/${activeSave.max_hp} | MP: ${activeSave.mana}/${activeSave.max_mana}</div>
          </div>
        `;
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
                  <span class="btn-icon">📜</span> Continue Quest (Floor ${savedVocation ? 'Saved' : '1'})
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
          <span>v2.2 Campaign Edition • 20 Floors • Skill Scaling • Procedural Crypts</span>
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
          <div class="vocation-card" data-vocation="magician">
            <div class="card-icon magician-icon">🧙</div>
            <h3>Magician</h3>
            <div class="stats-preview">
              <div class="stat-row"><span class="stat-label">Health:</span> <span class="stat-val hp">60 HP (+8/lv)</span></div>
              <div class="stat-row"><span class="stat-label">Mana:</span> <span class="stat-val mp">120 MP (+16/lv)</span></div>
              <div class="stat-row"><span class="stat-label">Passive:</span> <span class="stat-val mp">+2 MP / 5s</span></div>
            </div>
            <p class="desc">Master of radiant illumination and piercing energy beams. Powers scale with +10% magic damage per level.</p>
            <ul class="skills-list">
              <li><strong>[1] Wand Spark:</strong> 12–16 Magic Dmg (0 Mana)</li>
              <li><strong>[2] Light Spell:</strong> 7-tile aura for 30s (15 Mana)</li>
              <li><strong>[3] Energy Beam:</strong> 30–40 Piercing Dmg (30 Mana)</li>
            </ul>
            <button class="select-btn" data-vocation="magician">Select Magician</button>
          </div>

          <div class="vocation-card" data-vocation="archer">
            <div class="card-icon archer-icon">🏹</div>
            <h3>Archer</h3>
            <div class="stats-preview">
              <div class="stat-row"><span class="stat-label">Health:</span> <span class="stat-val hp">90 HP (+14/lv)</span></div>
              <div class="stat-row"><span class="stat-label">Mana:</span> <span class="stat-val mp">60 MP (+8/lv)</span></div>
              <div class="stat-row"><span class="stat-label">Passive:</span> <span class="stat-val hp">+2 HP / 5s</span></div>
            </div>
            <p class="desc">Deadly ranged scout with high physical stamina. Damage scales with +12% physical power and range per level.</p>
            <ul class="skills-list">
              <li><strong>[1] Bow Shot:</strong> 14–18 Physical Dmg (1 Arrow)</li>
              <li><strong>[2] Power Shot:</strong> 32–42 Heavy Burst (1 Arrow, 4s CD)</li>
            </ul>
            <button class="select-btn" data-vocation="archer">Select Archer</button>
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
            <p>Subterranean floors are shrouded in pitch darkness. You only see tiles illuminated by equipped <strong>torches</strong>, ambient sconces, or class <strong>Light spells</strong>. Lurking monsters are hidden in the shadows until illuminated!</p>
          </div>

          <div class="guide-section">
            <h3>🎮 Controls & Hotkeys</h3>
            <ul class="guide-list">
              <li><strong>Movement:</strong> <code>W / A / S / D</code> or <code>Arrow Keys</code> (Discrete grid steps)</li>
              <li><strong>Combat Abilities:</strong> Keys <code>[1]</code>, <code>[2]</code>, <code>[3]</code></li>
              <li><strong>Backpack Direct Triggers:</strong> Keys <code>[4]</code> through <code>[9]</code> (Drinks potions / equips torches)</li>
              <li><strong>Auto-Pickup:</strong> Walk onto any floor item to instantly pick it up / stack it</li>
              <li><strong>Targeting:</strong> Click any visible enemy on canvas to lock onto them</li>
            </ul>
          </div>

          <div class="guide-section">
            <h3>⭐ Leveling & 20 Dungeon Floors</h3>
            <p>Defeat monsters to earn <strong>XP</strong> and level up from Level 1 to 20! Leveling up restores all HP/MP and unlocks permanent <strong>Skill Boosts</strong> (+Damage %, +Max HP, +Max MP, +Range). Step on the illuminated stairs to descend deeper!</p>
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
