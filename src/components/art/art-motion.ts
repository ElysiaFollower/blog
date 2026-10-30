const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Smooth the scene rather than intercepting wheel events or moving the document. */
export function dampProgress(current: number, target: number, elapsed: number): number {
  const next = target + (current - target) * Math.exp(-elapsed / 90);
  return Math.abs(next - target) < .0002 ? target : next;
}

/** One position owns both direct manipulation and the interruptible settling animation. */
export class RailMotion {
  position: number;
  target: number;
  velocity = 0;
  readonly centers: number[];
  private gesture?: { startX: number; origin: number; lastX: number; time: number };

  constructor(centers: number[], selected = 0) {
    this.centers = centers;
    this.position = this.target = centers[selected] ?? 0;
  }

  get nearest(): number {
    return this.closest(this.position);
  }

  get moving(): boolean {
    return !this.gesture && (Math.abs(this.position - this.target) > .1 || Math.abs(this.velocity) > 1);
  }

  private bound(value: number): number {
    return clamp(value, 0, this.centers.at(-1) ?? 0);
  }

  private closest(value: number): number {
    let closest = 0;
    for (let i = 1; i < this.centers.length; i++) {
      if (Math.abs(this.centers[i] - value) < Math.abs(this.centers[closest] - value)) closest = i;
    }
    return closest;
  }

  select(index: number): void {
    this.target = this.centers[clamp(index, 0, this.centers.length - 1)] ?? 0;
  }

  begin(x: number, time: number): void {
    this.gesture = { startX: x, origin: this.position, lastX: x, time };
    this.target = this.position;
    this.velocity = 0;
  }

  move(x: number, time: number): void {
    const gesture = this.gesture;
    if (!gesture) return;
    const delta = gesture.lastX - x;
    if (delta !== 0) {
      const sample = delta / Math.max(8, time - gesture.time) * 1000;
      this.velocity = clamp(this.velocity * .35 + sample * .65, -6000, 6000);
      gesture.lastX = x;
      gesture.time = time;
    }
    this.position = this.bound(gesture.origin + gesture.startX - x);
  }

  end(x: number, time: number, cancelled = false, reducedMotion = false): void {
    const gesture = this.gesture;
    if (!gesture) return;
    this.move(x, time);
    if (cancelled || reducedMotion || time - gesture.time > 90) this.velocity = 0;
    this.gesture = undefined;
    const projection = this.bound(this.position + clamp(this.velocity * .16, -1200, 1200));
    this.target = this.centers[this.closest(projection)] ?? 0;
    if (reducedMotion) this.position = this.target;
  }

  step(elapsed: number): void {
    if (this.gesture) return;
    // Analytic critical damping keeps the same trajectory at different frame cadences.
    const seconds = elapsed / 1000;
    const frequency = 18;
    const displacement = this.position - this.target;
    const impulse = this.velocity + frequency * displacement;
    const decay = Math.exp(-frequency * seconds);
    this.position = this.bound(this.target + (displacement + impulse * seconds) * decay);
    this.velocity = (this.velocity - frequency * impulse * seconds) * decay;
    if (!this.moving) {
      this.position = this.target;
      this.velocity = 0;
    }
  }
}
