import { scrollScene, pinnedProgress } from "./scroll-scene";

const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
/** The picture window shares the page clock with every chapter that follows it. */
export function mountVoyage(root: HTMLElement): void {
  const stage = root.querySelector<HTMLElement>(".voyage__stage");
  if (!stage) return;
  const shadow = root.querySelector<SVGPathElement>("[data-window-shadow]");
  let width = stage.clientWidth;
  let height = stage.clientHeight;
  new ResizeObserver(([entry]) => { width = entry.contentRect.width; height = entry.contentRect.height; }).observe(stage);
  const narrow = matchMedia("(max-width: 760px)");
  scrollScene(root, pinnedProgress, progress => {
    const enabled = root.hasAttribute("data-scene-ready");
    if (!enabled) {
      stage.removeAttribute("style");
      root.removeAttribute("data-progressed");
      root.querySelectorAll<HTMLAnchorElement>("a").forEach(link => { link.inert = false; });
      return;
    }
    const p = progress;
    const opening = smooth((p - .08) / .84);
    const initial = narrow.matches ? [16, -12, 18, 56] : [13, 6, 15, 55];
    for (const [index, edge] of ["top", "right", "bottom", "left"].entries()) {
      stage.style.setProperty(`--window-${edge}`, `${initial[index] * (1 - opening)}%`);
    }
    stage.style.setProperty("--window-radius", `${(narrow.matches ? 160 : 280) * (1 - opening)}px`);
    stage.style.setProperty("--image-scale", String(1.06 - opening * .06));
    stage.style.setProperty("--image-shift-progress", String(1 - opening));
    const left = width * initial[3] / 100 * (1 - opening);
    const right = width * (1 - initial[1] / 100 * (1 - opening));
    const top = height * initial[0] / 100 * (1 - opening);
    const bottom = height * (1 - initial[2] / 100 * (1 - opening));
    const radius = Math.min((narrow.matches ? 160 : 280) * (1 - opening), (right - left) / 2);
    if (shadow)
      shadow.setAttribute("d", `M${left},${bottom} V${top + radius} A${radius},${radius} 0 0 1 ${left + radius},${top} H${right - radius} A${radius},${radius} 0 0 1 ${right},${top + radius} V${bottom} Z`);
    stage.style.setProperty("--copy-opacity", String(1 - smooth(p / .4)));
    stage.style.setProperty("--copy-y", `${-p * 60}px`);
    stage.style.setProperty("--statement-opacity", String(smooth((p - .48) / .32)));
    stage.style.setProperty("--statement-y", `${24 * (1 - smooth((p - .48) / .32))}px`);
    stage.style.setProperty("--veil", String(.06 + opening * .5));
    stage.style.setProperty("--voyage-progress", String(p));
    root.toggleAttribute("data-progressed", p > .6);
    // Invisible first-state links must not remain keyboard stops over the final composition.
    root.querySelectorAll<HTMLAnchorElement>(".voyage__copy a").forEach((link) => {
      link.inert = p >= .4;
    });
  }, { pinned: true, media: "(min-height: 700px)" });
}
