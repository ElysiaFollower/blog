/** Keep a continuous orbit coordinate, wrapping only the collection lookup. */
export const wrapIndex = (position: number, count: number) => ((Math.round(position) % count) + count) % count;

export function orbitPose(distance: number, width: number) {
  const angle = distance * .56;
  const radius = Math.max(570, Math.min(1080, width * .82));
  return {
    x: Math.sin(angle) * radius,
    y: -Math.sin(Math.min(Math.PI, Math.abs(angle))) * 45,
    z: (Math.cos(angle) - 1) * radius * 1.1,
    angle: -distance * 19,
    opacity: Math.max(0, Math.min(1, (4.6 - Math.abs(distance)) / .8)),
  };
}

export function nearestOrbitPosition(index: number, position: number, count: number) {
  return index + Math.round((position - index) / count) * count;
}
