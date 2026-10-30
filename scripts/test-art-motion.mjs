import test from 'node:test';
import assert from 'node:assert/strict';
import { dampProgress, RailMotion } from '../src/components/art/art-motion.ts';

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
