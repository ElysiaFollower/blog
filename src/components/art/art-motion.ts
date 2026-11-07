/** Smooth the scene rather than intercepting wheel events or moving the document. */
export function dampProgress(current: number, target: number, elapsed: number): number {
  const next = target + (current - target) * Math.exp(-elapsed / 90);
  return Math.abs(next - target) < .0002 ? target : next;
}
