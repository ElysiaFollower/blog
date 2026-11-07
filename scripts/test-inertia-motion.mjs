import test from 'node:test';
import assert from 'node:assert/strict';
import { InertiaMotion } from '../src/lib/inertia-motion.ts';

function throwWork(distance, duration, samples = 4) {
  const motion = new InertiaMotion();
  motion.begin(600, 0, 420);
  for (let i = 1; i <= samples; i++) motion.move(600 - distance * i / samples, duration * i / samples);
  motion.end(600 - distance, duration);
  return motion;
}

function settle(motion, frame = 16) {
  for (let time = 0; motion.moving && time < 6000; time += frame) motion.step(frame);
  assert.ok(!motion.moving, 'motion must finish rather than keep a RAF alive');
}

test('a short fast flick keeps its direction and can coast across several works', () => {
  const tiny = throwWork(20, 20, 2);
  const release = tiny.position;
  tiny.step(16);
  assert.ok(tiny.position > release, 'short displacement must not pull a fast flick backwards');
  const fast = throwWork(100, 40);
  const slow = throwWork(100, 400);
  settle(fast);
  settle(slow);
  assert.ok(fast.position >= 3, 'speed must carry a short flick through several works');
  assert.ok(slow.position <= 1, 'the same slow drag must remain precise');
});

test('release consumes the final pointer segment without discarding its velocity', () => {
  const motion = new InertiaMotion();
  motion.begin(600, 0, 420);
  motion.move(590, 10);
  motion.end(500, 40);
  assert.ok(Math.abs(motion.position - 100 / 420) < 1e-9);
  const releaseSpeed = motion.velocity;
  motion.step(1);
  assert.ok(motion.velocity > releaseSpeed * .99);
  settle(motion);
  assert.ok(motion.position >= 3);
});

test('input and animation cadence do not change the throw', () => {
  const sparse = throwWork(100, 100, 5);
  const dense = throwWork(100, 100, 25);
  assert.ok(Math.abs(sparse.velocity - dense.velocity) < 1e-8);
  const frames = [8, 16, 40].map(() => throwWork(100, 40));
  [8, 16, 40].forEach((frame, i) => {
    for (let elapsed = 0; elapsed < 2000; elapsed += frame) frames[i].step(frame);
  });
  assert.ok(Math.max(...frames.map(m => m.position)) - Math.min(...frames.map(m => m.position)) < .001);
});

test('a fling only slows down and never snaps back', () => {
  for (const distance of [-250, -100, -20, 20, 100, 250]) {
    const motion = throwWork(distance, 40);
    let previousSpeed = Math.abs(motion.velocity);
    let previousPosition = motion.position;
    for (let elapsed = 0; motion.moving && elapsed < 6000; elapsed += 16) {
      motion.step(16);
      assert.ok(Math.abs(motion.velocity) <= previousSpeed + 1e-9, 'alignment must not accelerate the orbit again');
      assert.ok((motion.position - previousPosition) * distance >= -1e-9, 'alignment must not reverse the fling');
      previousSpeed = Math.abs(motion.velocity);
      previousPosition = motion.position;
    }
    assert.ok(!motion.moving);
  }
});

test('the final coast frame never jumps to the theoretical resting position', () => {
  for (const scale of [1, 420]) {
    for (const frame of [8, 16, 40]) {
      for (const direction of [-1, 1]) {
        const motion = new InertiaMotion({ scale });
        motion.begin(600, 0, 420 / scale);
        motion.end(600 - direction * 100, 40);
        for (let time = 0; motion.moving && time < 6000; time += frame) {
          const previous = motion.position;
          const speed = Math.abs(motion.velocity);
          motion.step(frame);
          assert.ok(Math.abs(motion.position - previous) <= speed * frame / 1000 + 1e-9,
            'every frame, including the last, must respect the remaining speed');
        }
        assert.ok(!motion.moving);
      }
    }
  }
});

test('holding, cancelling and reduced motion do not retain a stale throw', () => {
  for (const kind of ['hold', 'cancel', 'reduced']) {
    const motion = new InertiaMotion();
    motion.begin(600, 0, 420);
    motion.move(500, 40);
    motion.end(500, kind === 'hold' ? 200 : 40, kind === 'cancel', kind === 'reduced');
    assert.equal(motion.velocity, 0);
    if (kind === 'reduced') assert.ok(!motion.moving);
    settle(motion);
    assert.equal(motion.position, 100 / 420);
  }
});

test('grabbing a moving orbit stops it at the visible position and permits reversal', () => {
  const motion = throwWork(100, 40);
  motion.step(200);
  const visible = motion.position;
  motion.begin(500, 240, 420);
  assert.equal(motion.position, visible);
  motion.move(550, 260);
  assert.ok(Math.abs(motion.position - visible + 50 / 420) < 1e-9);
  motion.end(600, 280);
  assert.ok(motion.velocity < 0);
  const released = motion.position;
  motion.step(16);
  assert.ok(motion.position < released);
  settle(motion);
});

test('a last-moment reversal uses recent velocity rather than the whole drag distance', () => {
  const motion = new InertiaMotion();
  motion.begin(600, 0, 420);
  motion.move(400, 40);
  motion.move(380, 60);
  motion.move(420, 100);
  motion.end(470, 120);
  assert.ok(motion.position > 0, 'net drag still points forward');
  assert.ok(motion.velocity < 0, 'the release points backward');
  const released = motion.position;
  motion.step(16);
  assert.ok(motion.position < released);
  settle(motion);
});

test('only explicit selection aligns to a destination', () => {
  const motion = throwWork(-100, 40);
  settle(motion);
  assert.ok(motion.position <= -3);
  motion.select(172);
  motion.select(173);
  settle(motion);
  assert.equal(motion.position, 173);
  motion.select(-1, true);
  assert.equal(motion.position, -1);
  assert.equal(motion.velocity, 0);
});

test('gentle movement and a held release retain positions between items', () => {
  const motion = throwWork(20, 400);
  const release = motion.position;
  let previous = release;
  for (let time = 0; motion.moving && time < 6000; time += 16) {
    motion.step(16);
    assert.ok(motion.position >= previous, 'a light drag must not spring back');
    previous = motion.position;
  }
  assert.ok(motion.position > release && motion.position < 1);
  assert.ok(!motion.moving);
  motion.begin(500, 1000, 420);
  motion.move(480, 1100);
  const held = motion.position;
  motion.end(480, 1300);
  motion.step(1000);
  assert.equal(motion.position, held);
});

test('the home pixel rail and gallery orbit use the same physical trajectory', () => {
  const orbit = new InertiaMotion();
  const rail = new InertiaMotion({ scale: 420, bounds: [0, 10000] });
  orbit.begin(600, 0, 420);
  rail.begin(600, 0);
  for (const time of [10, 20, 30, 40]) {
    orbit.move(600 - time * 2.5, time);
    rail.move(600 - time * 2.5, time);
  }
  orbit.end(500, 40);
  rail.end(500, 40);
  for (let time = 0; time < 6000; time += 16) {
    orbit.step(16);
    rail.step(16);
    assert.ok(Math.abs(rail.position - orbit.position * 420) < 1e-8);
  }
});

test('the bounded home rail stops at either end and can immediately reverse', () => {
  for (const sign of [-1, 1]) {
    const rail = new InertiaMotion({ position: 300, scale: 420, bounds: [0, 600] });
    rail.begin(500, 0);
    rail.end(500 - sign * 200, 40);
    settle(rail);
    assert.equal(rail.position, sign > 0 ? 600 : 0);
    const endpoint = rail.position;
    rail.begin(500, 2000);
    rail.move(500 + sign * 40, 2040);
    assert.equal(rail.position, endpoint - sign * 40);
    rail.end(500 + sign * 40, 2100);
    assert.equal(rail.velocity, 0);
  }
});

test('automatic wandering reaches a constant speed, independent of frame cadence', () => {
  const positions = [];
  for (const frame of [8, 16, 40]) {
    const motion = new InertiaMotion({ position: .37 });
    motion.startCruise(.1);
    for (let time = 0; time < 10000; time += frame) motion.step(frame);
    positions.push(motion.position);
    assert.ok(Math.abs(motion.velocity - .1) < 1e-10);
    const previous = motion.position;
    motion.step(10000);
    assert.ok(Math.abs(motion.position - previous - 1) < 1e-10, 'one work per ten seconds, without item-sized snaps');
    assert.ok(motion.moving);
  }
  assert.ok(Math.max(...positions) - Math.min(...positions) < 1e-10);
});

test('changing cruise speed preserves position and velocity, then eases to the new rate', () => {
  const motion = new InertiaMotion();
  motion.startCruise(.1);
  motion.step(3000);
  for (const speed of [.3, .025, .1]) {
    const position = motion.position;
    const previousSpeed = motion.velocity;
    motion.startCruise(speed);
    assert.equal(motion.position, position);
    assert.equal(motion.velocity, previousSpeed);
    motion.step(100);
    assert.ok(motion.velocity > Math.min(speed, previousSpeed));
    assert.ok(motion.velocity < Math.max(speed, previousSpeed));
    motion.step(3000);
    assert.ok(Math.abs(motion.velocity - speed) < .00001);
  }
});

test('pausing and grabbing automatic motion preserve the exact visible position', () => {
  const motion = new InertiaMotion();
  motion.startCruise(.1);
  motion.step(1700);
  const paused = motion.position;
  motion.stop();
  motion.step(60000);
  assert.equal(motion.position, paused);
  assert.ok(!motion.moving);
  motion.startCruise(.1);
  motion.step(1000);
  assert.ok(motion.position > paused);
  const caught = motion.position;
  motion.begin(500, 2000, 420);
  assert.equal(motion.position, caught);
  motion.move(520, 2100);
  motion.end(520, 2300);
  motion.step(10000);
  assert.equal(motion.position, caught - 20 / 420);
  assert.ok(!motion.moving, 'manual interaction must not silently restart cruise');
});

