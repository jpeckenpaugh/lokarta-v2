export type LogCategory = 'combat' | 'spell' | 'loot' | 'system' | 'warning' | 'victory';

export interface LogEntry {
  timestamp: string;
  message: string;
  category: LogCategory;
}

export class CombatLogUI {
  private container: HTMLElement;
  private entries: LogEntry[] = [];
  private maxEntries = 100;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`CombatLog container #${containerId} not found.`);
    }
    this.container = el;
    this.initStructure();
  }

  private initStructure(): void {
    this.container.innerHTML = `
      <div class="panel-header">COMBAT & EVENT LOG</div>
      <div class="log-entries-scroll" id="log-entries-container"></div>
    `;
  }

  public log(message: string, category: LogCategory = 'system'): void {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0]; // HH:MM:SS
    const entry: LogEntry = { timestamp, message, category };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    this.renderEntry(entry);
  }

  private renderEntry(entry: LogEntry): void {
    const scrollEl = this.container.querySelector('#log-entries-container');
    if (!scrollEl) return;

    const line = document.createElement('div');
    line.className = `log-line log-${entry.category}`;
    line.innerHTML = `<span class="log-time">[${entry.timestamp}]</span> <span class="log-msg">${this.escapeHtml(entry.message)}</span>`;

    scrollEl.appendChild(line);
    // Auto-scroll to bottom
    scrollEl.scrollTop = scrollEl.scrollHeight;
  }

  public clear(): void {
    this.entries = [];
    const scrollEl = this.container.querySelector('#log-entries-container');
    if (scrollEl) {
      scrollEl.innerHTML = '';
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
