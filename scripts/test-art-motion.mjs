import test from 'node:test';
import assert from 'node:assert/strict';
import { dampProgress } from '../src/components/art/art-motion.ts';
import { writingPose, writingPageProgress } from '../src/components/art/writing-path.ts';
import { scrollScene, pinnedProgress } from '../src/components/art/scroll-scene.ts';

function sceneHarness(run, reduced = false) {
  const keys = ['matchMedia', 'innerHeight', 'requestAnimationFrame', 'cancelAnimationFrame', 'addEventListener', 'IntersectionObserver', 'ResizeObserver'];
  const saved = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  const frames = new Map(), listeners = {}, attributes = new Set(), properties = new Map();
  let id = 0;
  const rect = { top: 0, height: 1500 };
  const media = { matches: reduced, addEventListener() {} };
  const root = {
    toggleAttribute(name, on) { if (on) attributes.add(name); else attributes.delete(name); },
    getBoundingClientRect: () => rect,
    querySelectorAll: () => [],
    style: { setProperty: (name, value) => properties.set(name, value) },
  };
  Object.assign(globalThis, {
    matchMedia: query => query.includes('prefers-reduced-motion') ? media : { matches: false, addEventListener() {} },
    innerHeight: 675,
    requestAnimationFrame: callback => { frames.set(++id, callback); return id; },
    cancelAnimationFrame: frame => frames.delete(frame),
    addEventListener: (name, callback) => { listeners[name] = callback; },
    IntersectionObserver: class { observe() {} },
    ResizeObserver: class { observe() {} },
  });
  const flush = () => {
    for (let time = 16; frames.size && time < 5000; time += 16) {
      const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(time));
    }
    assert.equal(frames.size, 0, 'scene should settle');
  };
  try { run({ root, rect, attributes, properties, listeners, flush }); }
  finally { for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } }
}

test('narrow scenes retain reversible scroll motion', () => sceneHarness(({ root, rect, attributes, listeners, flush }) => {
  let progress;
  scrollScene(root, pinnedProgress, value => { progress = value; });
  assert.ok(attributes.has('data-scene-ready'));
  rect.top = -300; listeners.scroll(); flush();
  assert.ok(progress > .3 && progress < .4);
  rect.top = -100; listeners.scroll(); flush();
  assert.ok(progress > .1 && progress < .2);
}));

test('reduced motion is the explicit static scene path', () => sceneHarness(({ root, attributes }) => {
  let progress;
  scrollScene(root, pinnedProgress, value => { progress = value; });
  assert.ok(!attributes.has('data-scene-ready'));
  assert.equal(progress, 1);
}, true));

test('live scene resizing uses its measured stage height for layout and progress', () => sceneHarness(({ root, rect, properties, listeners, flush }) => {
  const stage = { offsetHeight: 900 };
  rect.top = -225;
  let progress;
  scrollScene(root, pinnedProgress, value => { progress = value; }, stage);
  assert.equal(properties.get('--scene-height'), '900px');
  assert.equal(progress, 0);
  rect.top = -525; listeners.scroll(); flush();
  assert.equal(progress, .5);
  stage.offsetHeight = 1000; listeners.resize(); flush();
  assert.equal(properties.get('--scene-height'), '1000px');
  assert.equal(progress, .4);
}));

test('oversized sticky stages scroll into view before their timeline advances', () => {
  assert.equal(pinnedProgress({ top: -200, height: 1400 }, 600, 800), 0);
  assert.equal(pinnedProgress({ top: -500, height: 1400 }, 600, 800), .5);
  assert.equal(pinnedProgress({ top: -800, height: 1400 }, 600, 800), 1);
  assert.equal(pinnedProgress({ top: -300, height: 1500 }, 900, 900), .5);
});

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
