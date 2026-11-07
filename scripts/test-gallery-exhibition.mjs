import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapIndex, nearestOrbitPosition, orbitPose } from '../src/components/gallery/exhibition-motion.ts';

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
