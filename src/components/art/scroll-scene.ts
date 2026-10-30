import { ScrollProgress, pinnedOffset } from "./scroll-progress";

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const ease = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
export const pinnedProgress = (rect: DOMRect, viewport: number) => -rect.top / Math.max(1, rect.height - viewport);
export const entryProgress = (rect: DOMRect, viewport: number) => (viewport - rect.top) / Math.min(viewport, rect.height + viewport * .35);

type Scene = {
  root: HTMLElement;
  position: (rect: DOMRect, viewport: number) => number;
  draw: (progress: number) => void;
  media: MediaQueryList;
  pinned: boolean;
  enabled: boolean;
  progress?: number;
};
const scenes = new Set<Scene>();
let clock: ScrollProgress;
let frame = 0;
let previous = 0;
let reduced: MediaQueryList;

function request(): void {
  if (!frame && !document.hidden) frame = requestAnimationFrame(paint);
}

function paint(time: number): void {
  frame = 0;
  const native = scrollY;
  const viewport = innerHeight;
  const maximum = Math.max(0, document.documentElement.scrollHeight - viewport);
  if (Math.abs(native - clock.target) > viewport * 4) clock.reset(native);
  clock.step(native, previous ? time - previous : 16, maximum);
  previous = time;
  const lag = native - clock.position;
  // Read all geometry before any scene writes. Art callbacks consume the projected rectangle.
  const visible = [...scenes].filter(scene => scene.enabled && scene.root.isConnected)
    .map(scene => ({ scene, rect: scene.root.getBoundingClientRect() }))
    .filter(({ rect }) => rect.bottom + lag > -viewport && rect.top + lag < viewport * 2);
  const poses = visible.map(({ scene, rect }) => {
    const projected = new DOMRect(rect.x, rect.y + lag, rect.width, rect.height);
    return { scene, progress: clamp01(scene.position(projected, viewport)), offset: scene.pinned ? pinnedOffset(rect.top, rect.height, viewport, lag) : 0 };
  });
  poses.forEach(({ scene, progress, offset }) => {
    scene.root.style.setProperty("--scene-offset", `${offset}px`);
    if (scene.pinned) scene.root.style.setProperty("--scene-layer", offset === 0 ? "auto" : "4");
    if (scene.progress !== progress) {
      scene.progress = progress;
      scene.draw(progress);
    }
  });
  if (clock.moving) request();
  else previous = 0;
}

function reset(): void {
  clock.reset(scrollY);
  previous = 0;
  scenes.forEach(scene => { scene.progress = undefined; });
  request();
}

function configure(scene: Scene): void {
  scene.enabled = scene.media.matches && !reduced.matches;
  scene.root.toggleAttribute("data-scene-ready", scene.enabled);
  scene.root.style.setProperty("--scene-offset", "0px");
  scene.root.style.setProperty("--scene-layer", "auto");
  scene.progress = undefined;
  if (!scene.enabled) {
    scene.draw(1);
    scene.root.querySelectorAll<HTMLElement>("[data-scene-content]").forEach(item => {
      item.inert = false;
      item.removeAttribute("aria-hidden");
    });
  }
  request();
}

/** One shared scroll clock; scenes define composition, never wheel handling or independent inertia. */
export function scrollScene(
  root: HTMLElement,
  position: Scene["position"],
  draw: Scene["draw"],
  options: { pinned?: boolean; media?: string } = {},
): void {
  if (!clock) {
    clock = new ScrollProgress(scrollY);
    reduced = matchMedia("(prefers-reduced-motion: reduce)");
    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", reset, { passive: true });
    addEventListener("pageshow", reset);
    addEventListener("hashchange", reset);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else reset();
    });
    reduced.addEventListener("change", () => { scenes.forEach(configure); reset(); });
  }
  const scene: Scene = { root, position, draw, media: matchMedia(options.media ?? "(min-width: 1024px) and (min-height: 650px)"), pinned: options.pinned ?? false, enabled: false };
  scenes.add(scene);
  scene.media.addEventListener("change", () => { configure(scene); reset(); });
  new ResizeObserver(() => { scene.progress = undefined; request(); }).observe(root);
  configure(scene);
}
