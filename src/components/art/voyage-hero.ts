const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
/** The picture window opens into its own image; all states derive from native scroll position. */
export function mountVoyage(root: HTMLElement): void {
  const stage = root.querySelector<HTMLElement>(".voyage__stage");
  if (!stage)
    return;
  const shadow = root.querySelector<SVGPathElement>("[data-window-shadow]");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const short = matchMedia("(max-height: 600px)");
  const narrow = matchMedia("(max-width: 760px)");
  let visible = true;
  let frame = 0;
  const paint = () => {
    frame = 0;
    if (!visible || !root.hasAttribute("data-enhanced"))
      return;
    const travel = root.offsetHeight - stage.offsetHeight;
    const p = Math.max(0, Math.min(1, -root.getBoundingClientRect().top / Math.max(1, travel)));
    const opening = smooth((p - .08) / .84);
    const initial = narrow.matches ? [16, -12, 18, 56] : [13, 6, 15, 55];
    for (const [index, edge] of ["top", "right", "bottom", "left"].entries()) {
      stage.style.setProperty(`--window-${edge}`, `${initial[index] * (1 - opening)}%`);
    }
    stage.style.setProperty("--window-radius", `${(narrow.matches ? 160 : 280) * (1 - opening)}px`);
    stage.style.setProperty("--image-scale", String(1.06 - opening * .06));
    stage.style.setProperty("--image-shift-progress", String(1 - opening));
    const width = stage.clientWidth;
    const height = stage.clientHeight;
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
  };
  const request = () => {
    if (!frame && visible && !motion.matches)
      frame = requestAnimationFrame(paint);
  };
  const configure = () => {
    root.toggleAttribute("data-enhanced", !motion.matches && !short.matches);
    if (motion.matches || short.matches) {
      stage.removeAttribute("style");
      root.removeAttribute("data-progressed");
      root.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => { link.inert = false; });
    }
    else
      request();
  };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; request(); }).observe(root);
  }
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request, { passive: true });
  window.addEventListener("pageshow", request);
  motion.addEventListener("change", configure);
  short.addEventListener("change", configure);
  configure();
}
