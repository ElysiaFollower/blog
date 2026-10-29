import assert from "node:assert/strict";
import test from "node:test";
import { manageVideoPlayback } from "../src/components/gallery/video-playback.ts";

const settle = () => new Promise(resolve => setImmediate(resolve));

// Media events are queued after state changes, including programmatic play/pause.
class Video extends EventTarget {
    paused = true;
    currentTime = 0;
    duration = 120;
    readyState = 1;
    src = "video.mp4";
    preload = "none";
    plays = 0;
    rejectPlay = false;
    hasAttribute(name) { return name === "src" && Boolean(this.src); }
    removeAttribute(name) { if (name === "src") this.src = ""; }
    play() {
        this.plays++;
        if (this.rejectPlay) return Promise.reject(new Error("Autoplay blocked"));
        if (this.paused) {
            this.paused = false;
            queueMicrotask(() => this.dispatchEvent(new Event("play")));
        }
        return Promise.resolve();
    }
    pause() {
        if (!this.paused) {
            this.paused = true;
            queueMicrotask(() => this.dispatchEvent(new Event("pause")));
        }
    }
    load() { this.currentTime = 0; this.readyState = 0; }
    metadata() {
        this.readyState = 1;
        this.dispatchEvent(new Event("loadedmetadata"));
    }
}

function setup() {
    const video = new Video();
    const environment = { visible: true, reducedMotion: false };
    const playback = manageVideoPlayback(video, () => environment.visible, () => environment.reducedMotion);
    return { video, environment, playback };
}

test("manual pause survives hidden tabs, an open viewer, and subsequent visibility", async () => {
    const { video, environment, playback } = setup();
    playback.update();
    await settle();
    video.pause();
    await settle();
    environment.visible = false;
    playback.update();
    playback.pause();
    environment.visible = true;
    playback.update();
    await settle();
    assert.equal(video.paused, true);
    assert.equal(video.plays, 1);
});

test("environmental pauses resume playback without becoming a user pause", async () => {
    const { video, environment, playback } = setup();
    playback.update();
    await settle();
    environment.visible = false;
    playback.update();
    await settle();
    environment.visible = true;
    playback.update();
    await settle();
    assert.equal(video.paused, false);
    assert.equal(video.plays, 2);
});

test("reduced motion blocks default autoplay but preserves manual play and resume", async () => {
    const { video, environment, playback } = setup();
    environment.reducedMotion = true;
    playback.update();
    assert.equal(video.plays, 0);
    await video.play();
    await settle();
    playback.update();
    assert.equal(video.paused, false);
    environment.visible = false;
    playback.update();
    await settle();
    environment.visible = true;
    playback.update();
    await settle();
    assert.equal(video.paused, false);
    assert.equal(video.plays, 2);
});

test("a rejected autoplay request does not consume the next manual play event", async () => {
    const { video, environment, playback } = setup();
    video.rejectPlay = true;
    playback.update();
    await settle();
    video.rejectPlay = false;
    await video.play();
    await settle();
    environment.reducedMotion = true;
    playback.update();
    assert.equal(video.paused, false);
});

test("releasing a distant source restores position before resuming playback", async () => {
    const { video, playback } = setup();
    playback.update();
    await settle();
    video.currentTime = 42;
    playback.release();
    playback.release();
    await settle();
    assert.equal(video.hasAttribute("src"), false);
    assert.equal(video.currentTime, 0);
    video.src = "video.mp4";
    playback.update();
    assert.equal(video.plays, 1);
    assert.equal(video.preload, "metadata", "Restoration must request metadata without waiting on play()");
    video.metadata();
    await settle();
    assert.equal(video.currentTime, 42);
    assert.equal(video.paused, false);
    assert.equal(video.plays, 2);
});

test("releasing a manually paused video restores its position without playing", async () => {
    const { video, playback } = setup();
    playback.update();
    await settle();
    video.currentTime = 37;
    video.pause();
    await settle();
    playback.release();
    video.src = "video.mp4";
    playback.update();
    assert.equal(video.preload, "metadata", "A paused video must request metadata to restore its frame");
    assert.equal(video.paused, true);
    assert.equal(video.plays, 1);
    video.metadata();
    await settle();
    assert.equal(video.currentTime, 37);
    assert.equal(video.paused, true);
    assert.equal(video.plays, 1);
});

test("user pause during an outstanding autoplay event still wins", async () => {
    const { video, environment, playback } = setup();
    playback.update();
    video.pause();
    await settle();
    environment.visible = false;
    playback.update();
    environment.visible = true;
    playback.update();
    assert.equal(video.paused, true);
    assert.equal(video.plays, 1);
});
