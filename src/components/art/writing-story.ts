import { scrollScene, clamp01, ease } from "./scroll-scene";
import { writingPose } from "./writing-path";

export function mountWritingStory(root: HTMLElement): void {
  const pages = [...root.querySelectorAll<HTMLElement>("[data-writing-page]")];
  const indexes = [...root.querySelectorAll<HTMLElement>("[data-writing-index]")];
  const cue = root.querySelector<HTMLElement>("[data-writing-cue]");
  const stage = root.querySelector<HTMLElement>(".writing-story__stage")!;
  let travel = 1;
  let height = innerHeight;
  // Observe approach and departure too; the composition keeps changing across native pin boundaries.
  scrollScene(root, (rect, viewport, stageHeight) => {
    height = viewport;
    travel = Math.max(1, rect.height - stageHeight);
    return (viewport * 0.6 - rect.top + Math.min(0, viewport - stageHeight)) / (travel + viewport * 1.2);
  }, progress => {
    const pose = writingPose(progress * (travel + height * 1.2) - height * 0.6, pages.length, travel, height);
    // The incoming sheet is already in front before the midpoint; its visible links must work.
    const current = Math.max(0, Math.min(pages.length - 1, Math.floor(pose.cursor + 0.75)));
    root.style.setProperty("--writing-x", `${pose.x}px`);
    root.style.setProperty("--writing-y", `${pose.y}px`);
    root.style.setProperty("--writing-angle", `${pose.angle}deg`);
    root.style.setProperty("--writing-scale", String(pose.scale));
    if (cue) cue.textContent = current === pages.length - 1 ? "继续，走进回廊" : "向下翻页";
    pages.forEach((page, index) => {
      const offset = index - pose.cursor;
      const distance = Math.abs(offset);
      const incoming = clamp01(offset);
      const outgoing = clamp01(-offset);
      const gathering = pose.arrival + pose.departure;
      const opacity = offset < 0
        ? 1 - ease((distance - 0.55) / 0.3)
        : 1 - ease((distance - 0.7) / 0.3);
      page.style.setProperty("--page-opacity", String(opacity));
      page.style.setProperty("--page-x", `${incoming * 230 - outgoing * 180}px`);
      page.style.setProperty("--page-y", `${incoming * 70 - outgoing * 35}px`);
      page.style.setProperty("--page-z", `${-distance * 160}px`);
      page.style.setProperty("--page-angle", `${incoming * -17 + outgoing * 9}deg`);
      page.style.setProperty("--art-x", `${pose.arrival * 80 + pose.departure * 120}px`);
      page.style.setProperty("--art-tilt", `${incoming * 6 - outgoing * 5 - gathering * 6}deg`);
      page.style.setProperty("--art-scale", String(1 - incoming * 0.1 - gathering * 0.035));
      page.style.setProperty("--art-clip", `${incoming * 20}%`);
      page.style.setProperty("--image-scale", String(1 + incoming * 0.15));
      page.style.setProperty("--paper-x", `${-gathering * 60}px`);
      page.style.setProperty("--paper-y", `${incoming * 38 + outgoing * 45 + gathering * 35}px`);
      const ink = offset > 0
        ? ease((1 - incoming - 0.06) / 0.2)
        : 1 - ease((outgoing - 0.12) / 0.2);
      page.style.setProperty("--paper-ink", String(ink));
      page.style.zIndex = String(index + 1);
      page.toggleAttribute("data-current", index === current);
      page.inert = index !== current;
      page.setAttribute("aria-hidden", String(index !== current));
    });
    indexes.forEach((link, index) => {
      if (index === current) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
      link.style.setProperty("--index-progress", String(clamp01(pose.cursor - index + 1)));
    });
  }, stage);
}
