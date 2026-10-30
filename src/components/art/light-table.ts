import type { GalleryEntry } from "../../types/gallery";
import { InertiaMotion } from "../../lib/inertia-motion";
import { scrollScene, entryProgress, ease } from "./scroll-scene";

/** A window onto the same collection as /gallery/, with only nearby media mounted. */
export function mountLightTable(root: HTMLElement): void {
  const stage = root.querySelector<HTMLElement>("[data-light-stage]");
  const track = root.querySelector<HTMLElement>("[data-light-track]");
  const template = root.querySelector<HTMLTemplateElement>("[data-light-template]");
  const previous = root.querySelector<HTMLButtonElement>("[data-light-prev]");
  const next = root.querySelector<HTMLButtonElement>("[data-light-next]");
  const status = root.querySelector<HTMLElement>("[data-light-position]");
  const data = root.querySelector<HTMLScriptElement>("[data-light-data]");
  if (!stage || !track || !template || !previous || !next || !status || !data) return;
  const entries: GalleryEntry[] = JSON.parse(data.textContent ?? "[]");
  if (!entries.length) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const mounted = new Map<number, HTMLAnchorElement>();
  let selected = Math.min(7, entries.length - 1);
  try {
    const saved = sessionStorage.getItem("selected-light-work");
    const index = entries.findIndex(item => item.id === saved);
    if (index >= 0) selected = index;
  } catch { /* The gallery remains usable without session storage. */ }
  const sizes = entries.map(entry => {
    const ratio = entry.width / entry.height;
    const height = Math.min(360, 440 / ratio);
    return { width: height * ratio, height };
  });
  const centers: number[] = [];
  sizes.forEach((size, index) => {
    centers.push(index === 0 ? 0 : centers[index - 1] + (sizes[index - 1].width + size.width) / 2 + 52);
  });
  const motion = new InertiaMotion({ position: centers[selected], scale: 420, bounds: [0, centers.at(-1)!] });
  const nearest = (position = motion.position) => {
    let closest = 0;
    for (let index = 1; index < centers.length; index++) {
      if (Math.abs(centers[index] - position) < Math.abs(centers[closest] - position)) closest = index;
    }
    return closest;
  };
  let visible = false;
  let frame = 0;
  let lastTime = 0;
  let gesture: { id: number; start: number; moved: boolean; caught: boolean } | undefined;
  let suppressClick = false;
  let clickTimer = 0;
  let entrance = 1;

  const announce = () => {
    selected = nearest();
    status.textContent = `${String(selected + 1).padStart(3,"0")} / ${entries.length} · ${entries[selected].title ?? entries[selected].alt}`;
    previous.disabled = selected === 0;
    next.disabled = selected === entries.length - 1;
    try { sessionStorage.setItem("selected-light-work", entries[selected].id); } catch { /* Storage is optional. */ }
  };

  const render = () => {
    if (!visible) return;
    const active = nearest();
    const range = stage.clientWidth / 2 + 450;
    entries.forEach((entry, index) => {
      const x = centers[index] - motion.position;
      const nearby = Math.abs(x) < range + sizes[index].width / 2;
      let link = mounted.get(index);
      if (!nearby) {
        if (link?.contains(document.activeElement)) stage.focus({ preventScroll: true });
        link?.remove();
        mounted.delete(index);
        return;
      }
      if (!link) {
        link = template.content.firstElementChild!.cloneNode(true) as HTMLAnchorElement;
        link.href = `/gallery/#work=${encodeURIComponent(entry.id)}`;
        link.dataset.lightWork = entry.id;
        const image = link.querySelector<HTMLImageElement>("img")!;
        image.alt = entry.alt;
        image.width = entry.width;
        image.height = entry.height;
        image.src = entry.kind === "video" ? (entry.poster ?? entry.src) : entry.src;
        const caption = link.querySelectorAll("figcaption > span");
        caption[0].textContent = String(index + 1).padStart(3,"0");
        caption[1].textContent = entry.title ?? entry.alt;
        if (entry.kind === "video") link.querySelector(".light-table__kind")!.textContent = "影像";
        link.addEventListener("click", (event) => {
          if (suppressClick) { event.preventDefault(); return; }
          if (index !== nearest() || motion.moving) {
            event.preventDefault();
            select(index);
          }
        });
        track.append(link);
        mounted.set(index, link);
      }
      const distance = Math.min(4, Math.abs(x) / 360);
      const show = stage.hasAttribute("data-scene-ready") ? entrance : 1;
      const delay = Math.min(.28, Math.abs(index - active) * .055);
      const arriving = ease((show - delay) / (.9 - delay));
      const focus = ease(1 - Math.min(1, distance / 1.15));
      link.style.setProperty("--work-width", `${sizes[index].width}px`);
      link.style.setProperty("--work-height", `${sizes[index].height}px`);
      link.style.setProperty("--work-x", `${x * .92 + (1 - arriving) * Math.sign(x || 1) * 240}px`);
      link.style.setProperty("--work-y", `${distance * 18 + (1 - arriving) * 100}px`);
      link.style.setProperty("--work-z", `${-distance * 145 - (1 - arriving) * 550}px`);
      link.style.setProperty("--work-scale", String((.78 + focus * .48) * (.6 + arriving * .4)));
      const angle = Math.max(-70, Math.min(70, -x / 7));
      link.style.setProperty("--work-angle", `${angle + (1 - arriving) * (index % 2 ? 82 : -82)}deg`);
      link.style.setProperty("--work-light", String(1 - Math.min(.36, distance * .13)));
      link.style.setProperty("--work-opacity", String(arriving));
      link.dataset.active = String(index === active);
      link.tabIndex = index === active ? 0 : -1;
      link.setAttribute("aria-label", `${index === active ? "在画廊查看" : "选择作品"}：${entry.alt}`);
      if (index === active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  const tick = (time: number) => {
    frame = 0;
    if (!visible || document.hidden) return;
    motion.step(time - lastTime);
    lastTime = time;
    render();
    if (motion.moving && visible) frame = requestAnimationFrame(tick);
    else { lastTime = 0; announce(); }
  };
  const animate = () => {
    if (!frame && visible && !document.hidden) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };
  const clearGesture = () => {
    const id = gesture?.id;
    gesture = undefined;
    root.classList.remove("is-dragging");
    if (id !== undefined && stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
  };
  const cancelGesture = () => {
    if (!gesture) return;
    motion.end(gesture.start, 0, true);
    clearGesture();
  };
  const select = (index: number) => {
    clearGesture();
    motion.select(centers[Math.max(0, Math.min(centers.length - 1, index))], reduced.matches);
    render();
    animate();
  };

  previous.addEventListener("click", () => select(nearest(motion.target) - 1));
  next.addEventListener("click", () => select(nearest(motion.target) + 1));
  stage.addEventListener("keydown", (event) => {
    const index = nearest(motion.target);
    const target = { ArrowLeft:index - 1, ArrowRight:index + 1, Home:0, End:entries.length - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    select(target);
  });
  stage.addEventListener("dragstart", event => event.preventDefault());
  stage.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    cancelAnimationFrame(frame);
    frame = 0;
    window.clearTimeout(clickTimer);
    suppressClick = false;
    gesture = { id:event.pointerId, start:event.clientX, moved:false, caught:motion.moving };
    motion.begin(event.clientX, event.timeStamp);
  });
  stage.addEventListener("pointermove", (event) => {
    if (!gesture || event.pointerId !== gesture.id) return;
    if (!gesture.moved && Math.abs(event.clientX - gesture.start) < 4) return;
    if (!gesture.moved) {
      stage.setPointerCapture(event.pointerId);
      root.classList.add("is-dragging");
      gesture.moved = true;
    }
    for (const sample of event.getCoalescedEvents?.() ?? []) motion.move(sample.clientX, sample.timeStamp);
    motion.move(event.clientX, event.timeStamp);
    render();
  });
  const release = (event: PointerEvent, cancelled = false) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const moved = gesture.moved || (!cancelled && Math.abs(gesture.start - event.clientX) >= 4);
    const caught = gesture.caught;
    motion.end(event.clientX, event.timeStamp, cancelled || !moved, reduced.matches);
    clearGesture();
    if (moved || caught) {
      suppressClick = true;
      clickTimer = window.setTimeout(() => { suppressClick = false; }, 0);
    }
    render();
    animate();
  };
  stage.addEventListener("pointerup", event => release(event));
  stage.addEventListener("pointercancel", event => release(event, true));
  stage.addEventListener("lostpointercapture", event => release(event, true));
  stage.addEventListener("pointerleave", event => { if (gesture && !gesture.moved) release(event, true); });
  reduced.addEventListener("change", () => { cancelGesture(); motion.stop(); render(); announce(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelGesture(); cancelAnimationFrame(frame); frame = 0; }
    else animate();
  });
  root.querySelector("[data-light-controls]")?.removeAttribute("hidden");
  root.querySelector("[data-light-hint]")!.textContent = "拖动浏览全部收藏 · 点击当前作品进入画廊";
  root.classList.add("is-ready");
  announce();
  scrollScene(stage, entryProgress, p => { entrance = ease((p - .03) / .72); render(); });
  new ResizeObserver(render).observe(stage);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) { render(); animate(); }
    else { cancelGesture(); cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  }, { rootMargin:"200px" }).observe(root);
}
