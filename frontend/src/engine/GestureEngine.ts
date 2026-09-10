import { GestureEvent } from '../types/action';
import { CONFIG } from '../config';

interface SlotInputTracker {
  isDown: boolean;
  pressTimestamp: number;
  lastReleaseTimestamp: number;
  chargeTimer: number | null;
  chargeRatio: number;
}

export class GestureEngine {
  private trackers: Map<number, SlotInputTracker> = new Map();
  private onGestureCallback: (event: GestureEvent) => void;
  private onChargeUpdateCallback: (slotIndex: number, ratio: number) => void;
  private animationFrameId: number | null = null;

  constructor(
    onGesture: (event: GestureEvent) => void,
    onChargeUpdate: (slotIndex: number, ratio: number) => void
  ) {
    this.onGestureCallback = onGesture;
    this.onChargeUpdateCallback = onChargeUpdate;

    for (let i = 0; i < CONFIG.ACTION_BAR_SLOTS; i++) {
      this.trackers.set(i, {
        isDown: false,
        pressTimestamp: 0,
        lastReleaseTimestamp: 0,
        chargeTimer: null,
        chargeRatio: 0,
      });
    }

    this.startChargeLoop();
  }

  public static keyToSlotIndex(key: string): number | null {
    if (key >= '1' && key <= '9') {
      return parseInt(key, 10) - 1; // '1' -> 0, ..., '9' -> 8
    }
    if (key === '0') {
      return 9; // '0' -> 9
    }
    return null;
  }

  public static slotIndexToHotkey(slotIndex: number): string {
    if (slotIndex >= 0 && slotIndex <= 8) {
      return `${slotIndex + 1}`;
    }
    if (slotIndex === 9) {
      return '0';
    }
    return '';
  }

  public handleInputDown(slotIndex: number): void {
    const tracker = this.trackers.get(slotIndex);
    if (!tracker) return;

    if (tracker.isDown) return; // Prevent key repeat oscillation

    const now = performance.now();
    tracker.isDown = true;
    tracker.pressTimestamp = now;
    tracker.chargeRatio = 0;
  }

  public handleInputUp(slotIndex: number): void {
    const tracker = this.trackers.get(slotIndex);
    if (!tracker || !tracker.isDown) return;

    const now = performance.now();
    const duration = now - tracker.pressTimestamp;
    tracker.isDown = false;
    const previousRelease = tracker.lastReleaseTimestamp;
    tracker.lastReleaseTimestamp = now;

    // Reset charge visual
    tracker.chargeRatio = 0;
    this.onChargeUpdateCallback(slotIndex, 0);

    // Double-tap check: if this press is a quick tap AND previous release was within DOUBLE_TAP_MAX_MS
    if (duration < CONFIG.TAP_MAX_MS && previousRelease > 0 && (now - previousRelease) <= CONFIG.DOUBLE_TAP_MAX_MS) {
      // Trigger Double-Tap
      this.onGestureCallback({
        slotIndex,
        gesture: 'double_tap',
        chargeDurationMs: duration,
        chargeRatio: 1.0,
      });
      // Reset lastReleaseTimestamp so 3rd tap isn't immediately double tap
      tracker.lastReleaseTimestamp = 0;
      return;
    }

    // Hold / Charge check: held >= HOLD_MIN_MS
    if (duration >= CONFIG.HOLD_MIN_MS) {
      const chargeRatio = Math.min(
        1.0,
        Math.max(0.1, (duration - CONFIG.HOLD_MIN_MS) / (CONFIG.HOLD_MAX_MS - CONFIG.HOLD_MIN_MS))
      );
      this.onGestureCallback({
        slotIndex,
        gesture: 'hold',
        chargeDurationMs: duration,
        chargeRatio,
      });
      return;
    }

    // Standard Tap
    this.onGestureCallback({
      slotIndex,
      gesture: 'tap',
      chargeDurationMs: duration,
      chargeRatio: 0,
    });
  }

  private startChargeLoop(): void {
    const update = () => {
      const now = performance.now();
      for (const [slotIndex, tracker] of this.trackers.entries()) {
        if (tracker.isDown) {
          const duration = now - tracker.pressTimestamp;
          if (duration >= CONFIG.HOLD_MIN_MS) {
            const ratio = Math.min(
              1.0,
              (duration - CONFIG.HOLD_MIN_MS) / (CONFIG.HOLD_MAX_MS - CONFIG.HOLD_MIN_MS)
            );
            if (Math.abs(tracker.chargeRatio - ratio) > 0.01) {
              tracker.chargeRatio = ratio;
              this.onChargeUpdateCallback(slotIndex, ratio);
            }
          }
        }
      }
      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
