import test from 'node:test';
import assert from 'node:assert/strict';
import { dampProgress, RailMotion } from '../src/components/art/art-motion.ts';
import { writingPose, writingPageProgress } from '../src/components/art/writing-path.ts';

test('a wheel-sized step is spread over frames and settles without an endless loop', () => {
  let value = dampProgress(0, .3, 16);
  assert.ok(value > 0 && value < .15);
  for (let i = 0; i < 45; i++) value = dampProgress(value, .3, 16);
  assert.equal(value, .3);
});

test('scroll progress follows reverse input and is independent of frame cadence', () => {
  let slow = 0, fast = 0;
  for (let i = 0; i < 30; i++) slow = dampProgress(slow, .8, 16);
  for (let i = 0; i < 60; i++) fast = dampProgress(fast, .8, 8);
  assert.ok(Math.abs(slow-fast) < .001);
  assert.ok(dampProgress(slow, .1, 16) < slow);
});

test('grabbing during a snap continues from the visible position, including rapid reversals', () => {
  const rail = new RailMotion([0, 350, 760, 1300, 1800], 1);
  rail.select(4);
  rail.step(32);
  const visible = rail.position;
  rail.begin(700, 100);
  assert.equal(rail.position, visible);
  rail.move(625, 116);
  assert.ok(Math.abs(rail.position - visible - 75) < .00001);
  rail.end(625, 120);
  rail.step(16);
  const second = rail.position;
  rail.begin(700, 140);
  rail.move(775, 156);
  assert.ok(Math.abs(rail.position - second + 75) < .00001);
});

test('release consumes the final pointer position and a fast throw can pass several works', () => {
  const rail = new RailMotion([0, 300, 600, 900, 1200, 1500, 1800], 1);
  rail.begin(700, 0);
  rail.move(690, 16);
  rail.end(350, 32);
  assert.ok(rail.target >= 900);
  for (let i = 0; i < 90; i++) rail.step(16);
  assert.equal(rail.position, rail.target);
  assert.ok(!rail.moving);
});

test('a held release has no stale flick, boundaries and cancellation stay finite', () => {
  const rail = new RailMotion([0, 300, 600], 1);
  rail.begin(500, 0);
  rail.move(460, 16);
  rail.end(460, 300);
  assert.equal(rail.target, 300);
  rail.begin(0, 400);
  rail.move(3000, 416);
  rail.end(3000, 430, true);
  for (let i = 0; i < 90; i++) rail.step(16);
  assert.ok(Number.isFinite(rail.position));
  assert.ok(rail.position >= 0 && rail.position <= 600);
});


test('writing advances throughout each page instead of inserting inactive scroll zones', () => {
  const travel = 1300;
  for (let pixel = 0; pixel < travel; pixel++) {
    const a = writingPose(pixel, 3, travel, 970);
    const b = writingPose(pixel + 1, 3, travel, 970);
    assert.ok(b.cursor > a.cursor, `no page response at ${pixel}`);
  }
});

test('writing framing remains active on both sides of pin entry and release', () => {
  const travel = 1300, viewport = 970;
  for (const boundary of [0, travel]) {
    for (const scroll of [boundary - 80, boundary, boundary + 80]) {
      const a = writingPose(scroll, 3, travel, viewport);
      const b = writingPose(scroll + 1, 3, travel, viewport);
      assert.ok(Math.abs(b.x - a.x) > 0.01);
      assert.ok(Math.abs(b.scale - a.scale) > 0.00001);
    }
  }
});

test('writing anchors select complete spreads and edge cases stay bounded', () => {
  for (let count = 1; count <= 5; count++) {
    for (let index = 0; index < count; index++) {
      const scroll = writingPageProgress(index, count) * 1300;
      assert.ok(Math.abs(writingPose(scroll, count, 1300, 970).cursor - index) < 1e-7);
    }
    for (const scroll of [-1000, 0, 500, 1300, 2500]) {
      const pose = writingPose(scroll, count, 1300, 970);
      assert.ok(Object.values(pose).every(Number.isFinite));
      assert.ok(pose.cursor >= 0 && pose.cursor <= count - 1);
      assert.ok(pose.scale > 0 && pose.scale <= 1);
    }
  }
});
