import { FateCard, DraftOffer } from '../types/fate';
import { soundFX } from '../audio/AudioSystem';

export class FateGrantModal {
  private container: HTMLElement;
  private onConfirmCallback: (selectedCards: FateCard[]) => void;
  private currentOffer: DraftOffer | null = null;
  private selectedIndices: Set<number> = new Set();

  constructor(containerId: string, onConfirm: (selectedCards: FateCard[]) => void) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`FateGrantModal container #${containerId} not found.`);
    }
    this.container = el;
    this.onConfirmCallback = onConfirm;
  }

  public show(offer: DraftOffer, isLevelUp = false, level = 1): void {
    this.currentOffer = offer;
    this.selectedIndices.clear();
    this.container.classList.remove('hidden');

    this.render(isLevelUp, level);
  }

  public hide(): void {
    this.container.classList.add('hidden');
    this.container.innerHTML = '';
    this.currentOffer = null;
    this.selectedIndices.clear();
  }

  private render(isLevelUp: boolean, level: number): void {
    if (!this.currentOffer) return;

    const cards = this.currentOffer.cards;
    const selectedCount = this.selectedIndices.size;
    const canConfirm = selectedCount >= 1 && selectedCount <= 2;

    const title = isLevelUp
      ? `⭐ LEVEL ${level} FATE GRANT`
      : '🌟 LEVEL 1: CHOOSE YOUR FATE';
    const subtitle = isLevelUp
      ? 'Your spirit ascends! Select 1 or 2 mystical gifts to augment your build:'
      : 'The ancient crypt tests your resolve. Choose 1 or 2 starting boons to descend into darkness:';

    let cardsHtml = '';
    cards.forEach((card, idx) => {
      const isSelected = this.selectedIndices.has(idx);
      cardsHtml += `
        <div class="fate-card rarity-${card.rarity} ${isSelected ? 'selected' : ''}" data-index="${idx}">
          <div class="card-selection-badge">${isSelected ? '✓ SELECTED' : 'CHOOSE'}</div>
          <div class="card-rarity-tag">${card.rarity.toUpperCase()}</div>
          <div class="card-icon-frame">
            <span class="card-icon">${card.icon}</span>
          </div>
          <h4 class="card-title">${card.name}</h4>
          <div class="card-bonus-tag">${card.statBonusText}</div>
          <p class="card-desc">${card.description}</p>
        </div>
      `;
    });

    this.container.innerHTML = `
      <div class="fate-grant-modal">
        <div class="modal-header">
          <h2>${title}</h2>
          <p class="subtitle">${subtitle}</p>
        </div>

        <div class="fate-cards-grid">
          ${cardsHtml}
        </div>

        <div class="fate-modal-footer">
          <div class="selection-counter">
            Selected: <strong>${selectedCount} / 2</strong> (Pick 1 or 2)
          </div>
          <button class="confirm-fate-btn ${canConfirm ? 'active' : 'disabled'}" id="btn-confirm-fate" ${canConfirm ? '' : 'disabled'}>
            Confirm Fate & Descend
          </button>
        </div>
      </div>
    `;

    // Bind card toggle clicks
    const cardEls = this.container.querySelectorAll('.fate-card');
    cardEls.forEach(el => {
      el.addEventListener('click', e => {
        const idxStr = (e.currentTarget as HTMLElement).getAttribute('data-index');
        if (idxStr !== null) {
          const idx = parseInt(idxStr, 10);
          soundFX.playClick();
          this.toggleCard(idx, isLevelUp, level);
        }
      });
    });

    // Bind confirm button
    const confirmBtn = this.container.querySelector('#btn-confirm-fate');
    if (confirmBtn && canConfirm) {
      confirmBtn.addEventListener('click', () => {
        soundFX.playLevelUp();
        const selected = Array.from(this.selectedIndices).map(i => cards[i]);
        this.hide();
        this.onConfirmCallback(selected);
      });
    }
  }

  private toggleCard(idx: number, isLevelUp: boolean, level: number): void {
    if (this.selectedIndices.has(idx)) {
      this.selectedIndices.delete(idx);
    } else {
      if (this.selectedIndices.size >= 2) {
        // Already at maximum 2 selections; replace the earliest selection or notify
        const first = this.selectedIndices.values().next().value;
        if (first !== undefined) {
          this.selectedIndices.delete(first);
        }
      }
      this.selectedIndices.add(idx);
    }
    this.render(isLevelUp, level);
  }
}
