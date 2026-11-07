import { dampProgress } from "./art-motion.ts";

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const ease = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
// An oversized sticky stage first scrolls to its bottom edge, then advances the same timeline.
export const pinnedProgress = (rect: DOMRect, viewport: number, stage = viewport) =>
  (-rect.top + Math.min(0, viewport - stage)) / Math.max(1, rect.height - stage);
export const entryProgress = (rect: DOMRect, viewport: number) => (viewport - rect.top) / Math.min(viewport, rect.height + viewport * .35);

/** A scene owns its key poses; this clock only maps native scroll to a reversible timeline. */
export function scrollScene(
  root: HTMLElement,
  position: (rect: DOMRect, viewport: number, stage: number) => number,
  draw: (progress: number) => void,
  stage?: HTMLElement,
): void {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let enabled = false;
  let visible = true;
  let value = 0;
  let frame = 0;
  let previous = 0;
  const measure = () => { if (stage) root.style.setProperty("--scene-height", `${stage.offsetHeight}px`); };
  const target = () => clamp01(position(root.getBoundingClientRect(), innerHeight, stage?.offsetHeight ?? innerHeight));
  const paint = (time: number) => {
    frame = 0;
    if (!enabled || !visible) return;
    const goal = target();
    value = dampProgress(value, goal, previous ? Math.min(48, time - previous) : 16);
    previous = time;
    draw(value);
    if (value !== goal) frame = requestAnimationFrame(paint);
  };
  const request = () => {
    if (!frame && enabled && visible) {
      previous = 0;
      frame = requestAnimationFrame(paint);
    }
  };
  const configure = () => {
    enabled = !reduce.matches;
    root.toggleAttribute("data-scene-ready", enabled);
    measure();
    cancelAnimationFrame(frame);
    frame = 0;
    if (enabled) { value = target(); draw(value); request(); }
    else {
      draw(1);
      root.querySelectorAll<HTMLElement>("[data-scene-content]").forEach(item => {
        item.inert = false;
        item.removeAttribute("aria-hidden");
      });
    }
  };
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; request(); }, { rootMargin: "100px" }).observe(root);
  addEventListener("scroll", request, { passive:true });
  const resize = () => { measure(); request(); };
  new ResizeObserver(resize).observe(stage ?? root);
  addEventListener("resize", resize, { passive:true });
  addEventListener("pageshow", configure);
  reduce.addEventListener("change", configure);
  configure();
}
