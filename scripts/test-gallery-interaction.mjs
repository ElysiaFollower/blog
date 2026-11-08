import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Always launch a separate profile; never attach to a personal or connector browser.
const profile = await mkdtemp(path.join(tmpdir(), "blog-gallery-test-"));
const chrome = spawn(process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "about:blank",
], { stdio: "ignore" });
let launchError;
chrome.on("error", error => { launchError = error; });
let socket;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const until = async (check, description) => {
  for (let i = 0; i < 100; i++) {
    if (launchError) throw launchError;
    const result = await check();
    if (result) return result;
    await wait(100);
  }
  throw new Error(`Timed out: ${description}`);
};

try {
  const port = await until(async () => {
    try { return (await readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]; }
    catch { return null; }
  }, "isolated Chrome startup");
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  const exceptions = [];
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    clearTimeout(request.timeout);
    if (message.error) request.reject(new Error(JSON.stringify(message.error)));
    else request.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const state = () => evaluate(`(() => {
    const root = document.querySelector('[data-exhibition]');
    const work = root.querySelector('.exhibition__work[data-active="true"]');
    return {
      observing: root.hasAttribute('data-observing'),
      depth: parseFloat(root.querySelector('[data-exhibition-camera]').style.getPropertyValue('--ex-camera-depth')) || 0,
      enabled: root.querySelector('[data-exhibition-wander]').getAttribute('aria-pressed') === 'true',
      index: Number(work?.dataset.exhibitionIndex), transform: work?.style.transform,
    };
  })()`);
  const click = async (selector, touch = false) => {
    const point = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      const r = element.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
      return { x, y, hit: element.contains(document.elementFromPoint(x, y)),
        actual: document.elementFromPoint(x, y)?.outerHTML.slice(0, 240), scrollY, viewport: [innerWidth, innerHeight] };
    })()`);
    assert.equal(point.hit, true, `${selector} must receive the real hit: ${JSON.stringify(point)}`);
    const { x, y } = point;
    if (touch) {
      await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } else {
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    }
  };
  const key = async (key, duration = 300) => {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key });
    await wait(duration);
    await send("Input.dispatchKeyEvent", { type: "keyUp", key });
  };
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  const url = new URL(process.env.GALLERY_TEST_URL || "http://localhost:4321/gallery/");
  url.searchParams.set("mode", "exhibition");
  await send("Page.navigate", { url: url.href });
  await until(() => evaluate(`document.querySelector('[data-exhibition-wander]')?.getAttribute('aria-pressed') === 'true'`), "gallery initialization");
  await evaluate(`document.querySelector('#gallery-collection').scrollIntoView({behavior:'instant'})`);
  await wait(1400);
  assert.equal((await state()).enabled, true);
  const drag = await evaluate(`(() => {
    const r = document.querySelector('.exhibition__work[data-active="true"]').getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...drag, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: drag.x - 80, y: drag.y, button: "left", buttons: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: drag.x - 80, y: drag.y, button: "left", clickCount: 1 });
  await wait(200);
  assert.equal((await state()).observing, false, "a real drag must not enter observation");
  assert.equal((await state()).enabled, true, "dragging preserves the wander preference");
  await click('.exhibition__work[data-active="true"]');
  await wait(1800);
  let current = await state();
  assert.equal(current.observing, true);
  assert.ok(current.depth > 100, "camera approaches after centering");
  await wait(400);
  assert.equal((await state()).transform, current.transform, "observation suspends cruise");
  await key("w"); await wait(500);
  const closer = (await state()).depth;
  assert.ok(closer > current.depth + 60, "W moves forward");
  await key("s"); await wait(500);
  assert.ok((await state()).depth < closer - 60, "S moves back");
  const beforeTurn = (await state()).transform;
  await key("d", 500);
  assert.notEqual((await state()).transform, beforeTurn, "D rotates");
  const afterTurn = (await state()).transform;
  await key("a", 500);
  assert.notEqual((await state()).transform, afterTurn, "A rotates the other way");
  await click('[data-exhibition-detail]');
  await until(() => evaluate(`!!document.querySelector('.pswp--open')`), "original viewer");
  await wait(500);
  const whileViewing = await state();
  await wait(300);
  assert.equal((await state()).transform, whileViewing.transform, "the original viewer suspends the scene");
  await key("Escape", 0);
  await until(() => evaluate(`!document.querySelector('.pswp--open')`), "original viewer closes");
  assert.equal((await state()).observing, true, "closing the original viewer returns to observation");
  await wait(1200);
  await click('[data-exhibition-observation-close]'); await wait(1800);
  current = await state();
  assert.equal(current.observing, false); assert.equal(current.enabled, true); assert.equal(current.depth, 0);
  await wait(400);
  assert.notEqual((await state()).transform, current.transform, "exit resumes enabled cruise");
  await click('[data-exhibition-wander]');
  const next = ((await state()).index + 1) % Number(await evaluate(`document.querySelector('[data-exhibition-scrub]').max`));
  await click(`[data-exhibition-index="${next}"]`); await wait(1800);
  assert.equal((await state()).index, next, "a side work rotates to center");
  assert.equal((await state()).observing, true);
  assert.ok((await state()).depth > 0);
  await key("Escape", 0); await wait(1800);
  current = await state();
  assert.equal(current.observing, false); assert.equal(current.enabled, false);
  await wait(400);
  assert.equal((await state()).transform, current.transform, "manual pause persists after observation");

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true });
  // A fresh navigation avoids restoring the desktop page's scroll offset on mobile.
  await send("Page.navigate", { url: "about:blank" });
  await until(() => evaluate(`location.href === 'about:blank'`), "fresh mobile navigation");
  await send("Page.navigate", { url: url.href });
  await until(() => evaluate(`document.querySelector('[data-exhibition-wander]')?.getAttribute('aria-pressed') === 'true'`), "mobile gallery");
  await evaluate(`document.querySelector('#gallery-collection').scrollIntoView({behavior:'instant'})`); await wait(1200);
  await click('.exhibition__work[data-active="true"]', true); await wait(1800);
  assert.equal((await state()).observing, true, "touch tap enters observation");
  await click('[data-exhibition-zoom-in]', true); await wait(600);
  assert.ok((await state()).depth > 0, "touch zoom control works");
  await click('[data-exhibition-observation-close]', true); await wait(1800);
  assert.equal((await state()).observing, false, "touch can exit observation");
  assert.equal((await state()).enabled, true);
  assert.deepEqual(exceptions, [], "no uncaught browser errors");
  console.log("Gallery browser checks passed: real hit testing, mouse/touch observation, side-work focus, WASD camera, pause and resume.");
} finally {
  socket?.close();
  chrome.kill("SIGTERM");
  if (chrome.exitCode === null && !launchError) await Promise.race([new Promise(resolve => chrome.once("exit", resolve)), wait(3000)]);
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
