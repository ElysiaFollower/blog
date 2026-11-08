import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapIndex, nearestOrbitPosition, orbitPose, projectedWorkMatrix } from '../src/components/gallery/exhibition-motion.ts';

test('the orbit crosses both ends without repeating or dropping a nearby work', () => {
  for (const count of [1, 2, 8, 9, 173]) {
    for (const position of [-347, -1, 0, 172, 173, 519]) {
      const nearby = new Set(Array.from({ length: 9 }, (_, i) => wrapIndex(position + i - 4, count)));
      assert.equal(nearby.size, Math.min(count, 9));
      assert.ok([...nearby].every(index => index >= 0 && index < count));
    }
  }
  assert.equal(wrapIndex(-1, 173), 172);
  assert.equal(wrapIndex(173, 173), 0);
});

test('selecting a work chooses its nearest revolution, including a reverse crossing', () => {
  assert.equal(nearestOrbitPosition(172, 0, 173), -1);
  assert.equal(nearestOrbitPosition(0, 172, 173), 173);
  for (const position of [-346.8, -.8, 0, 85, 172.8, 520]) {
    for (let index = 0; index < 173; index++) {
      const destination = nearestOrbitPosition(index, position, 173);
      assert.equal(wrapIndex(destination, 173), index);
      assert.ok(Math.abs(destination - position) <= 173 / 2);
    }
  }
});

test('focused works face forward; the two arcs recede symmetrically at every breakpoint', () => {
  for (const width of [320, 390, 768, 1280, 1920]) {
    const center = orbitPose(0, width);
    assert.equal(center.x, 0);
    assert.equal(center.z, 0);
    assert.equal(Math.abs(center.angle), 0);
    assert.equal(center.opacity, 1);
    for (const distance of [.1, .5, 1, 2, 3, 4]) {
      const left = orbitPose(-distance, width);
      const right = orbitPose(distance, width);
      assert.equal(left.x, -right.x);
      assert.equal(left.z, right.z);
      assert.equal(left.angle, -right.angle);
      assert.ok(right.z < 0);
      assert.ok(right.opacity >= 0 && right.opacity <= 1);
      assert.ok(Object.values(right).every(Number.isFinite));
    }
  }
});

test('direct work projection preserves the former camera geometry, including mobile offset and depth', () => {
  for (const width of [320, 390, 768, 1440]) {
    const perspective = width < 700 ? 1000 : 1400;
    const offset = width < 700 ? -16.88 : 0;
    for (const depth of [0, perspective * .3, perspective * .72]) {
      for (const distance of [-4, -1.5, -.4999, 0, .4999, 1.5, 4]) {
        const pose = orbitPose(distance, width);
        const matrix = projectedWorkMatrix(pose, perspective, depth, offset);
        const angle = pose.angle * Math.PI / 180;
        // Include the reflection, which shares the work's flat plane.
        for (const [u, v] of [[-290, -227], [290, -227], [-290, 227], [290, 227], [0, 700]]) {
          const z = pose.z + depth - Math.sin(angle) * u;
          const zoom = perspective / (perspective - z);
          const expected = [
            (pose.x + Math.cos(angle) * u) * zoom,
            (pose.y + offset + v) * zoom - offset,
            z * zoom,
          ];
          const w = matrix[3] * u + matrix[7] * v + matrix[15];
          const actual = [0, 1, 2].map(i => (matrix[i] * u + matrix[4 + i] * v + matrix[12 + i]) / w);
          actual.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 1e-8));
        }
      }
    }
  }
});

test('a centered work has an affine enlargement with no unused perspective component', () => {
  for (const depth of [0, 450, 900, 1008]) {
    const matrix = projectedWorkMatrix(orbitPose(0, 1440), 1400, depth);
    assert.ok(Math.abs(matrix[3]) === 0);
    assert.deepEqual(matrix.slice(7, 12), [0, 0, 0, 1, 0]);
    assert.equal(matrix[15], 1);
    assert.equal(matrix[0], 1400 / (1400 - depth));
    assert.equal(matrix[5], matrix[0]);
  }
});
