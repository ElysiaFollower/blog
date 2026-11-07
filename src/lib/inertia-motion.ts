interface MotionOptions {
  position?: number;
  /** Typical item span in model coordinates: 1 for an orbit, e.g. 420 for a pixel rail. */
  scale?: number;
  bounds?: readonly [number, number];
}

const FRICTION = 1.7;
const VELOCITY_WINDOW = 60;
const ALIGN_FREQUENCY = 10;
const CRUISE_RESPONSE = 4;

/** One-dimensional motion without DOM, frame scheduling, or item selection policy.
 * Free movement preserves fractional positions; only select() aligns to a destination.
 * The caller advances elapsed visible time, so suspending a scene does not skip ahead. */
export class InertiaMotion {
  position: number;
  target: number;
  velocity = 0;
  private readonly scale: number;
  private readonly bounds?: readonly [number, number];
  private phase: "idle" | "drag" | "coast" | "align" | "cruise" = "idle";
  private cruiseSpeed = 0;
  private gesture?: { x: number; origin: number; pixelsPerUnit: number; samples: { x: number; time: number }[] };

  constructor({ position = 0, scale = 1, bounds }: MotionOptions = {}) {
    this.scale = scale;
    this.bounds = bounds;
    this.position = this.target = this.bound(position);
  }

  get moving() { return this.phase === "coast" || this.phase === "align" || this.phase === "cruise"; }

  private bound(value: number) {
    return this.bounds ? Math.max(this.bounds[0], Math.min(this.bounds[1], value)) : value;
  }

  stop() {
    this.gesture = undefined;
    this.phase = "idle";
    this.velocity = 0;
    this.target = this.position;
  }

  begin(x: number, time: number, pixelsPerUnit = 1) {
    this.stop();
    this.gesture = { x, origin: this.position, pixelsPerUnit, samples: [{ x, time }] };
    this.phase = "drag";
  }

  move(x: number, time: number) {
    const gesture = this.gesture;
    if (!gesture) return;
    const samples = gesture.samples;
    if (time < samples[samples.length - 1].time) return;
    if (time === samples[samples.length - 1].time) samples[samples.length - 1] = { x, time };
    else samples.push({ x, time });
    // Time-based sampling keeps high-rate pointers from losing their release speed.
    // Retain one sample before the window so its starting position can be interpolated.
    const cutoff = time - VELOCITY_WINDOW;
    while (samples.length > 2 && samples[1].time <= cutoff) samples.shift();
    const first = samples[0];
    const second = samples[1];
    const startTime = Math.max(cutoff, first.time);
    const startX = second && first.time < cutoff
      ? first.x + (second.x - first.x) * (cutoff - first.time) / (second.time - first.time)
      : first.x;
    const speed = time > startTime ? (startX - x) / gesture.pixelsPerUnit * 1000 / (time - startTime) : 0;
    this.velocity = Math.max(-14 * this.scale, Math.min(14 * this.scale, speed));
    this.position = this.bound(gesture.origin + (gesture.x - x) / gesture.pixelsPerUnit);
    this.target = this.position;
  }

  end(x: number, time: number, cancelled = false, reducedMotion = false) {
    if (!this.gesture) return;
    if (!cancelled) this.move(x, time);
    this.gesture = undefined;
    if (cancelled || reducedMotion || Math.abs(this.velocity) < .006 * this.scale) this.stop();
    else this.phase = "coast";
  }

  select(position: number, immediate = false) {
    this.stop();
    this.target = this.bound(position);
    if (immediate) this.position = this.target;
    else if (this.position !== this.target) this.phase = "align";
  }

  startCruise(speed: number) {
    this.gesture = undefined;
    this.cruiseSpeed = speed;
    this.phase = "cruise";
    this.target = this.position;
  }

  step(elapsed: number) {
    if (!this.moving || elapsed <= 0) return;
    const seconds = elapsed / 1000;
    if (this.phase === "coast") {
      // End on the decay curve itself. Adding its infinite tail here would turn
      // the last almost-still frame into a visible position jump.
      const untilRest = Math.max(0, Math.log(Math.abs(this.velocity) / (.006 * this.scale)) / FRICTION);
      const decay = Math.exp(-FRICTION * Math.min(seconds, untilRest));
      this.position += this.velocity * (1 - decay) / FRICTION;
      this.velocity *= decay;
      if (seconds >= untilRest) this.stop();
    } else if (this.phase === "cruise") {
      // Ease into a constant speed without assigning a sequence of item-sized targets.
      const decay = Math.exp(-CRUISE_RESPONSE * seconds);
      const difference = this.velocity - this.cruiseSpeed;
      this.position += this.cruiseSpeed * seconds + difference * (1 - decay) / CRUISE_RESPONSE;
      this.velocity = this.cruiseSpeed + difference * decay;
    } else {
      const displacement = this.position - this.target;
      const impulse = this.velocity + ALIGN_FREQUENCY * displacement;
      const decay = Math.exp(-ALIGN_FREQUENCY * seconds);
      this.position = this.target + (displacement + impulse * seconds) * decay;
      this.velocity = (this.velocity - ALIGN_FREQUENCY * impulse * seconds) * decay;
      if (Math.abs(this.position - this.target) < .001 * this.scale && Math.abs(this.velocity) < .01 * this.scale) {
        this.position = this.target;
        this.stop();
      }
    }
    const bounded = this.bound(this.position);
    if (bounded !== this.position) { this.position = bounded; this.stop(); }
    if (this.phase !== "align") this.target = this.position;
  }
}
