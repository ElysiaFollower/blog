const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Native scroll is the destination. Position and velocity survive every scene boundary. */
export class ScrollProgress {
  position: number;
  velocity = 0;
  target: number;

  constructor(position = 0) { this.position = this.target = position; }

  get moving(): boolean {
    return Math.abs(this.position - this.target) > .05 || Math.abs(this.velocity) > .5;
  }

  reset(position: number): void {
    this.position = this.target = position;
    this.velocity = 0;
  }

  step(target: number, elapsed: number, maximum = Infinity): void {
    this.target = clamp(target, 0, maximum);
    // Exact solution of x'' = ω²(target − x) − 2ωx': acceleration without oscillation.
    const seconds = Math.max(0, elapsed) / 1000;
    const frequency = 30;
    const displacement = this.position - this.target;
    const impulse = this.velocity + frequency * displacement;
    const decay = Math.exp(-frequency * seconds);
    this.position = this.target + (displacement + impulse * seconds) * decay;
    this.velocity = (this.velocity - frequency * impulse * seconds) * decay;
    if (this.position < 0 || this.position > maximum) {
      this.position = clamp(this.position, 0, maximum);
      this.velocity = 0;
    }
    if (!this.moving) this.reset(this.target);
  }
}

/** Move a pinned stage with the same clock as its artwork, including its entry and release. */
export function pinnedOffset(top: number, height: number, viewport: number, lag: number): number {
  const stageTop = (y: number) => Math.min(Math.max(y, 0), y + height - viewport);
  return stageTop(top + lag) - stageTop(top);
}
