import { dampProgress } from "./art-motion";

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const ease = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
export const pinnedProgress = (rect: DOMRect, viewport: number) => -rect.top / Math.max(1, rect.height - viewport);
export const entryProgress = (rect: DOMRect, viewport: number) => (viewport - rect.top) / Math.min(viewport, rect.height + viewport * .35);

/** A scene owns its key poses; this clock only maps native scroll to a reversible timeline. */
export function scrollScene(
  root: HTMLElement,
  position: (rect: DOMRect, viewport: number) => number,
  draw: (progress: number) => void,
): void {
  const desktop = matchMedia("(min-width: 1024px) and (min-height: 650px)");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let enabled = false;
  let visible = true;
  let value = 0;
  let frame = 0;
  let previous = 0;
  const target = () => clamp01(position(root.getBoundingClientRect(), innerHeight));
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
    enabled = desktop.matches && !reduce.matches;
    root.toggleAttribute("data-scene-ready", enabled);
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
  addEventListener("resize", request, { passive:true });
  addEventListener("pageshow", configure);
  desktop.addEventListener("change", configure);
  reduce.addEventListener("change", configure);
  configure();
}
