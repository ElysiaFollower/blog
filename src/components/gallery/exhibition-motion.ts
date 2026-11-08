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

/** Project each flat work directly. Omitting unused local-Z perspective lets
 * front-facing images raster at their enlarged scale instead of stretching a
 * smaller texture, while retaining the same perspective and depth ordering. */
export function projectedWorkMatrix(pose: ReturnType<typeof orbitPose>, perspective: number, depth: number, originOffsetY = 0) {
  const angle = pose.angle * Math.PI / 180;
  const scale = perspective / (perspective - depth - pose.z);
  const sin = Math.sin(angle);
  const tilt = scale * sin / perspective;
  return [
    scale * Math.cos(angle), -originOffsetY * tilt, -scale * sin, tilt,
    0, scale, 0, 0,
    0, 0, 1, 0,
    scale * pose.x, scale * pose.y + originOffsetY * (scale - 1), scale * (pose.z + depth), 1,
  ];
}
