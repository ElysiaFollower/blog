export const WRITING_ENTRY = 0.12;
export const WRITING_EXIT = 0.22;
const area = 1 - (WRITING_ENTRY + WRITING_EXIT) / 2;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
// Integrating the speed curve keeps position and velocity continuous at native sticky boundaries.
const integral = (t: number) => t ** 3 - 0.5 * t ** 4;

/** The horizontal and vertical components trade speed; neither introduces a waiting interval. */
export function writingPose(progress: number, count: number, travel: number) {
  const p = clamp(progress);
  let horizontal: number;
  let y = 0;
  let scale = 1;
  if (p < WRITING_ENTRY) {
    const u = p / WRITING_ENTRY;
    horizontal = WRITING_ENTRY * integral(u) / area;
    y = travel * WRITING_ENTRY * (0.5 - u + integral(u));
    scale = 0.97 + 0.03 * smooth(u);
  } else if (p > 1 - WRITING_EXIT) {
    const u = (p - 1 + WRITING_EXIT) / WRITING_EXIT;
    horizontal = 1 - WRITING_EXIT * integral(1 - u) / area;
    y = -travel * WRITING_EXIT * integral(u);
    scale = 1 - 0.025 * smooth(u);
  } else {
    horizontal = (p - WRITING_ENTRY / 2) / area;
  }
  return {
    cursor: horizontal * Math.max(0, count - 1),
    y,
    scale,
    bridge: travel * WRITING_EXIT / 2,
  };
}

export function writingPageProgress(index: number, count: number): number {
  if (count < 2) return 0;
  const destination = Math.max(0, Math.min(count - 1, index));
  let left = 0, right = 1;
  for (let i = 0; i < 30; i++) {
    const middle = (left + right) / 2;
    if (writingPose(middle, count, 1).cursor < destination) left = middle;
    else right = middle;
  }
  return (left + right) / 2;
}
