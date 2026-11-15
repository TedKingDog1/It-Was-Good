export const PROJECT_DURATION_SECONDS = 7 * 60 + 24;

/**
 * Deterministic master clock for the complete 7:24 visual sequence.
 * Environments calculate their pose from an absolute timestamp, which
 * makes pause, resume, restart, and seeking predictable.
 */
export class MasterTimeline {
  private positionSeconds = 0;
  private runningSinceMs = 0;
  private playing = false;

  getCurrentTime(nowMs: number = performance.now()): number {
    const elapsedWhilePlaying = this.playing
      ? Math.max(0, (nowMs - this.runningSinceMs) / 1000)
      : 0;

    return Math.min(PROJECT_DURATION_SECONDS, this.positionSeconds + elapsedWhilePlaying);
  }

  isPlaying(): boolean {
    return this.playing;
  }

  play(nowMs: number = performance.now()): void {
    if (this.playing) return;

    if (this.positionSeconds >= PROJECT_DURATION_SECONDS) {
      this.positionSeconds = 0;
    }

    this.runningSinceMs = nowMs;
    this.playing = true;
  }

  pause(nowMs: number = performance.now()): void {
    if (!this.playing) return;

    this.positionSeconds = this.getCurrentTime(nowMs);
    this.playing = false;
  }

  seek(seconds: number, nowMs: number = performance.now()): void {
    const wasPlaying = this.playing;

    this.positionSeconds = Math.min(
      PROJECT_DURATION_SECONDS,
      Math.max(0, Number.isFinite(seconds) ? seconds : 0)
    );

    if (this.positionSeconds >= PROJECT_DURATION_SECONDS) {
      this.playing = false;
    } else if (wasPlaying) {
      this.runningSinceMs = nowMs;
    }
  }

  restart(): void {
    this.positionSeconds = 0;
    this.runningSinceMs = 0;
    this.playing = false;
  }
}
