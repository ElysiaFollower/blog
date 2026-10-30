import type { GalleryEntry } from "../../types/gallery";
import { InertiaMotion } from "../../lib/inertia-motion";
import { nearestOrbitPosition, orbitPose, wrapIndex } from "./exhibition-motion";
import { manageVideoPlayback } from "./video-playback";

interface ExhibitionOptions {
  open: (index: number) => void;
  browse: (index: number) => void;
}

export function mountExhibition(root: HTMLElement, entries: GalleryEntry[], options: ExhibitionOptions) {
  const stage = root.querySelector<HTMLElement>("[data-exhibition-stage]")!;
  const orbit = root.querySelector<HTMLElement>("[data-exhibition-orbit]")!;
  const title = root.querySelector<HTMLElement>("[data-exhibition-title]")!;
  const number = root.querySelector<HTMLElement>("[data-exhibition-number]")!;
  const count = root.querySelector<HTMLElement>("[data-exhibition-count]")!;
  const progress = root.querySelector<HTMLElement>("[data-exhibition-progress]")!;
  const scrub = root.querySelector<HTMLInputElement>("[data-exhibition-scrub]")!;
  const wander = root.querySelector<HTMLButtonElement>("[data-exhibition-wander]")!;
  const wanderState = root.querySelector<HTMLElement>("[data-exhibition-wander-state]")!;
  const speedControl = root.querySelector<HTMLInputElement>("[data-exhibition-speed]")!;
  const speedOutput = root.querySelector<HTMLOutputElement>("[data-exhibition-speed-value]")!;
  scrub.max = String(entries.length);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const mounted = new Map<number, { link: HTMLAnchorElement; release: () => void; update: () => void }>();
  const motion = new InertiaMotion();
  let wandering = false;
  let cruiseSpeed = .1;
  let active = false;
  let visible = false;
  let viewing = false;
  let frame = 0;
  let lastTime = 0;
  let announced = -1;
  let gesture: { id: number; x: number; moved: boolean; caught: boolean } | undefined;
  let suppressClick = false;
  const selected = () => wrapIndex(motion.position, entries.length);
  const canRender = () => active && visible && !document.hidden;
  const canAnimate = () => canRender() && !viewing;
  const updateMedia = () => mounted.forEach(card => card.update());

  function makeCard(index: number) {
    const item = entries[index];
    const link = document.createElement("a");
    link.className = "exhibition__work";
    link.href = item.src;
    link.dataset.exhibitionIndex = String(index);
    link.draggable = false;
    const mount = document.createElement("span");
    mount.className = "exhibition__mount";
    const media = document.createElement(item.kind === "video" ? "video" : "img");
    media.width = item.width;
    media.height = item.height;
    let playback: ReturnType<typeof manageVideoPlayback> | undefined;
    if (media instanceof HTMLVideoElement) {
      media.muted = true;
      media.loop = true;
      media.playsInline = true;
      media.poster = item.poster ?? "";
      media.preload = "metadata";
      playback = manageVideoPlayback(media, () => canRender() && !viewing && selected() === index, () => reduced.matches);
    } else {
      media.alt = item.alt;
      media.draggable = false;
      media.decoding = "async";
    }
    media.addEventListener("error", () => { link.dataset.failed = ""; });
    media.addEventListener("load", () => { delete link.dataset.failed; });
    media.addEventListener("loadeddata", () => { delete link.dataset.failed; });
    media.src = item.src;
    const reflection = document.createElement("img");
    reflection.className = "exhibition__reflection";
    reflection.src = item.poster ?? item.src;
    reflection.alt = "";
    reflection.draggable = false;
    reflection.setAttribute("aria-hidden", "true");
    const tag = document.createElement("span");
    tag.className = "exhibition__tag";
    tag.textContent = String(index + 1).padStart(3, "0");
    tag.setAttribute("aria-hidden", "true");
    const error = document.createElement("span");
    error.className = "exhibition__error";
    error.textContent = "作品暂不可用 · 打开原文件 ↗";
    mount.append(media, error);
    link.append(mount, reflection, tag);
    link.addEventListener("click", event => {
      if (suppressClick) { event.preventDefault(); return; }
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.button !== 0) return;
      if (link.hasAttribute("data-failed")) return;
      event.preventDefault();
      if (index === selected() && !motion.moving) options.open(index);
      else select(index);
    });
    orbit.append(link);
    return {
      link,
      update: () => playback?.update(),
      release: () => {
        playback?.release();
        media.removeAttribute("src");
        reflection.removeAttribute("src");
        if (link.contains(document.activeElement)) stage.focus({ preventScroll: true });
        link.remove();
      },
    };
  }

  function render() {
    if (!canRender() || !entries.length) return;
    const nearest = Math.round(motion.position);
    const current = selected();
    const wanted = new Set<number>();
    // Nine physical planes represent the nearby arc; original media stays intact.
    for (let offset = -4; offset <= 4; offset++) {
      const index = wrapIndex(nearest + offset, entries.length);
      if (wanted.has(index)) continue;
      wanted.add(index);
      let card = mounted.get(index);
      if (!card) { card = makeCard(index); mounted.set(index, card); }
      const distance = nearestOrbitPosition(index, motion.position, entries.length) - motion.position;
      const pose = orbitPose(distance, stage.clientWidth);
      const item = entries[index];
      const maxHeight = Math.min(440, root.clientHeight * .44);
      const maxWidth = Math.min(580, stage.clientWidth * (stage.clientWidth < 700 ? .82 : .4));
      const height = Math.min(maxHeight, maxWidth / (item.width / item.height));
      const width = height * item.width / item.height;
      card.link.style.width = `${width + 14}px`;
      card.link.style.height = `${height + 14}px`;
      card.link.style.transform = `translate(-50%, -50%) translate3d(${pose.x}px, ${pose.y}px, ${pose.z}px) rotateY(${pose.angle}deg)`;
      card.link.style.opacity = String(pose.opacity);
      card.link.style.filter = `brightness(${1 - Math.min(.32, Math.abs(distance) * .07)})`;
      card.link.dataset.active = String(index === current);
      card.link.tabIndex = index === current ? 0 : -1;
      card.link.setAttribute("aria-label", `${index === current ? "放大查看" : "移近观看"}：${item.title || item.alt}`);
      card.link.setAttribute("aria-current", String(index === current));
    }
    mounted.forEach((card, index) => {
      if (!wanted.has(index)) { card.release(); mounted.delete(index); }
    });
    if (announced !== current) {
      announced = current;
      title.textContent = entries[current].title || entries[current].alt;
      number.textContent = String(current + 1).padStart(3, "0");
      progress.style.width = `${(current + 1) / entries.length * 100}%`;
      announce();
      updateMedia();
    }
  }

  function announce() {
    scrub.value = String(selected() + 1);
    scrub.setAttribute("aria-valuetext", `${selected() + 1} / ${entries.length}，${entries[selected()].title || entries[selected()].alt}`);
    count.textContent = `${String(selected() + 1).padStart(3, "0")} / ${String(entries.length).padStart(3, "0")}`; }
  function tick(time: number) {
    frame = 0;
    if (!canAnimate()) return;
    const elapsed = time - lastTime;
    lastTime = time;
    motion.step(elapsed);
    render();
    if (motion.moving) frame = requestAnimationFrame(tick);
    else { lastTime = 0; announce(); }
  }
  function animate() {
    if (!frame && canAnimate()) { lastTime = performance.now(); frame = requestAnimationFrame(tick); }
  }
  function select(index: number, immediate = false) {
    stopWandering();
    clearGesture();
    motion.select(nearestOrbitPosition(index, motion.position, entries.length), immediate || reduced.matches);
    render();
    updateMedia();
    animate();
  }
  function step(delta: number) { select(wrapIndex(motion.target + delta, entries.length)); }
  function releaseCards() { mounted.forEach(card => card.release()); mounted.clear(); }

  function stopWandering() {
    if (!wandering) return;
    wandering = false;
    motion.stop();
    wander.setAttribute("aria-pressed", "false");
    wanderState.textContent = "开启";
    count.setAttribute("aria-live", "polite");
  }

  function updateSpeed() {
    const multiplier = Number(speedControl.value);
    cruiseSpeed = .1 * multiplier;
    speedOutput.value = `${multiplier}×`;
    speedControl.setAttribute("aria-valuetext", `${multiplier} 倍，约每 ${Number((10 / multiplier).toFixed(1))} 秒经过一幅`);
    const progress = (multiplier - Number(speedControl.min)) / (Number(speedControl.max) - Number(speedControl.min));
    speedControl.style.setProperty("--speed-progress", `${progress * 100}%`);
    if (wandering) { motion.startCruise(cruiseSpeed); animate(); }
  }

  try {
    const saved = Number(localStorage.getItem("gallery-wander-speed"));
    if (Number.isFinite(saved) && saved >= Number(speedControl.min) && saved <= Number(speedControl.max)) speedControl.value = String(saved);
  } catch { /* Speed controls remain usable when storage is unavailable. */ }
  updateSpeed();
  speedControl.addEventListener("input", updateSpeed);
  speedControl.addEventListener("change", () => {
    try { localStorage.setItem("gallery-wander-speed", speedControl.value); } catch { /* Persistence is optional. */ }
  });

  wander.addEventListener("click", () => {
    if (wandering) stopWandering();
    else {
      cancelGesture();
      wandering = true;
      wander.setAttribute("aria-pressed", "true");
      wanderState.textContent = "暂停";
      count.setAttribute("aria-live", "off");
      motion.startCruise(cruiseSpeed);
    }
    animate();
  });

  function clearGesture() {
    const id = gesture?.id;
    gesture = undefined;
    root.classList.remove("is-dragging");
    if (id !== undefined && stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
  }

  function cancelGesture() {
    if (!gesture) return;
    motion.end(gesture.x, 0, true, reduced.matches);
    clearGesture();
  }

  scrub.addEventListener("input", () => select(Number(scrub.value) - 1, true));
  root.querySelector("[data-exhibition-prev]")!.addEventListener("click", () => step(-1));
  root.querySelector("[data-exhibition-next]")!.addEventListener("click", () => step(1));
  root.querySelector("[data-exhibition-open]")!.addEventListener("click", () => options.open(selected()));
  root.querySelector("[data-exhibition-browse]")!.addEventListener("click", () => options.browse(selected()));
  stage.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault(); stage.focus({ preventScroll: true }); step(event.key === "ArrowLeft" ? -1 : 1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault(); select(event.key === "Home" ? 0 : entries.length - 1);
    } else if (event.key === "Enter" && event.target === stage) {
      event.preventDefault(); options.open(selected());
    }
  });
  stage.addEventListener("dragstart", event => event.preventDefault());
  stage.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;
    const caught = motion.moving;
    stopWandering();
    cancelAnimationFrame(frame); frame = 0;
    suppressClick = false;
    gesture = { id: event.pointerId, x: event.clientX, moved: false, caught };
    motion.begin(event.clientX, event.timeStamp, Math.min(420, stage.clientWidth * .7));
  });
  stage.addEventListener("pointermove", event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    if (!gesture.moved && Math.abs(gesture.x - event.clientX) < 4) return;
    if (!gesture.moved) { gesture.moved = true; stage.setPointerCapture(event.pointerId); root.classList.add("is-dragging"); }
    for (const sample of event.getCoalescedEvents?.() ?? []) motion.move(sample.clientX, sample.timeStamp);
    motion.move(event.clientX, event.timeStamp);
    render();
  });
  function release(event: PointerEvent, cancelled = false) {
    if (!gesture || gesture.id !== event.pointerId) return;
    if (!cancelled && Math.abs(gesture.x - event.clientX) >= 4) gesture.moved = true;
    motion.end(event.clientX, event.timeStamp, cancelled || !gesture.moved, reduced.matches);
    suppressClick = gesture.moved || gesture.caught;
    if (suppressClick) setTimeout(() => { suppressClick = false; }, 0);
    clearGesture();
    animate();
  }
  stage.addEventListener("pointerup", event => release(event));
  stage.addEventListener("pointercancel", event => release(event, true));
  stage.addEventListener("lostpointercapture", event => release(event, true));
  stage.addEventListener("pointerleave", event => { if (gesture && !gesture.moved) release(event, true); });
  reduced.addEventListener("change", () => { stopWandering(); cancelGesture(); motion.stop(); updateMedia(); animate(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelGesture(); cancelAnimationFrame(frame); frame = 0; }
    updateMedia();
    animate();
  });
  new ResizeObserver(render).observe(stage);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    root.classList.toggle("is-visible", visible);
    if (visible) { render(); updateMedia(); animate(); }
    else { cancelGesture(); cancelAnimationFrame(frame); frame = 0; updateMedia(); }
  }, { threshold: .15 }).observe(root);

  return {
    select,
    thumbnail: (index: number) => mounted.get(index)?.link ?? null,
    setViewing(value: boolean) {
      viewing = value;
      if (value) { stopWandering(); cancelGesture(); motion.stop(); cancelAnimationFrame(frame); frame = 0; }
      updateMedia();
    },
    activate(value: boolean) {
      active = value;
      if (active) { render(); updateMedia(); animate(); }
      else { stopWandering(); cancelGesture(); motion.stop(); cancelAnimationFrame(frame); frame = 0; releaseCards(); }
    },
  };
}
