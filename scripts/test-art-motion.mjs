import test from 'node:test';
import assert from 'node:assert/strict';
import { RailMotion } from '../src/components/art/art-motion.ts';
import { ScrollProgress, pinnedOffset } from '../src/components/art/scroll-progress.ts';

test('wheel steps accelerate, preserve velocity on new input, and settle', () => {
  const motion = new ScrollProgress(0);
  motion.step(300, 8);
  const first = motion.position;
  motion.step(300, 8);
  assert.ok(motion.position - first > first);
  const velocity = motion.velocity;
  motion.step(550, 0);
  assert.equal(motion.velocity, velocity);
  for (let i=0; i<90; i++) motion.step(550, 16);
  assert.equal(motion.position, 550);
  assert.equal(motion.velocity, 0);
  assert.ok(!motion.moving);
});

test('the same physical duration gives the same pose at different frame cadences', () => {
  const slow = new ScrollProgress(100), fast = new ScrollProgress(100);
  for (let i=0; i<10; i++) slow.step(800, 16);
  for (let i=0; i<20; i++) fast.step(800, 8);
  assert.ok(Math.abs(slow.position-fast.position) < 1e-8);
  assert.ok(Math.abs(slow.velocity-fast.velocity) < 1e-8);
  slow.step(800, 1000);
  assert.equal(slow.position,800);
  assert.ok(!slow.moving);
});

test('a scene boundary does not consume overflow or reset the shared velocity', () => {
  const motion = new ScrollProgress(550);
  motion.step(850, 16);
  const before = motion.position;
  for (let i=0; i<60; i++) motion.step(850,16);
  assert.ok(before < 600);
  assert.equal(motion.position,850);
  assert.equal((motion.position-600)/500,.5);
});

test('a released sticky stage stays on its final approach until the artwork reaches the boundary', () => {
  const height=1494, viewport=900, native=713, rendered=550;
  const top=-native;
  const nativeStageTop=height-viewport-native;
  const offset=pinnedOffset(top,height,viewport,native-rendered);
  assert.equal(nativeStageTop+offset,0);
  const later=650;
  assert.equal(nativeStageTop+pinnedOffset(top,height,viewport,native-later),594-later);
  assert.equal(pinnedOffset(-550,height,viewport,-80),-36);
  assert.equal(pinnedOffset(-300,height,viewport,100),0);
  assert.equal(pinnedOffset(50,height,viewport,100),100);
});

test('reverse input, page bounds, resize and restored positions remain finite and terminate', () => {
  const motion=new ScrollProgress(400);
  motion.step(900,64,1000);
  for (let i=0;i<100;i++) { motion.step(-500,16,1000); assert.ok(motion.position>=0 && motion.position<=1000); }
  assert.equal(motion.position,0);
  for (let i=0;i<100;i++) motion.step(2000,16,750);
  assert.equal(motion.position,750);
  motion.step(750,16,500);
  assert.equal(motion.position,500);
  motion.reset(150);
  assert.equal(motion.velocity,0);
  assert.ok(!motion.moving);
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
