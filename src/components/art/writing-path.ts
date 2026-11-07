const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

/** Framing continues on both sides of the pinned scene, while the spreads turn in place. */
export function writingPose(scroll: number, count: number, travel: number, viewport: number) {
  const arrival = 1 - ease((scroll / viewport + 0.6) / 0.75);
  const departure = ease(((scroll - travel) / viewport + 0.25) / 0.8);
  return {
    arrival,
    departure,
    cursor: clamp(scroll / Math.max(1, travel)) * Math.max(0, count - 1),
    x: arrival * 120 - departure * 180,
    y: arrival * 55 - departure * 80,
    angle: arrival * 4 - departure * 6,
    scale: 1 - arrival * 0.1 - departure * 0.08,
  };
}

export const writingPageProgress = (index: number, count: number) =>
  count < 2 ? 0 : clamp(index / (count - 1));
