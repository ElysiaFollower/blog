import { scrollScene, clamp01 } from "./scroll-scene";
import { writingPose } from "./writing-path";

export function mountWritingStory(root: HTMLElement): void {
  const pages = [...root.querySelectorAll<HTMLElement>("[data-writing-page]")];
  const indexes = [...root.querySelectorAll<HTMLElement>("[data-writing-index]")];
  const cue = root.querySelector<HTMLElement>("[data-writing-cue]");
  let travel = 1;
  // Native-synced progress lets the frame meet sticky release at the same position and speed.
  scrollScene(root, (rect, viewport) => {
    travel = Math.max(1, rect.height - viewport);
    return -rect.top / travel;
  }, progress => {
    const pose = writingPose(progress, pages.length, travel);
    const current = Math.max(0, Math.min(pages.length - 1, Math.floor(pose.cursor + 0.5)));
    root.style.setProperty("--writing-y", `${pose.y}px`);
    root.style.setProperty("--writing-scale", String(pose.scale));
    root.style.setProperty("--writing-bridge", `${pose.bridge}px`);
    root.style.setProperty("--writing-progress", String(progress));
    if (cue) cue.textContent = current === pages.length - 1 ? "继续，走进回廊" : "向下翻页";
    pages.forEach((page, index) => {
      const offset = index - pose.cursor;
      const distance = Math.abs(offset);
      const depth = Math.min(1, distance) ** 2;
      page.style.setProperty("--page-opacity", distance < 1.05 ? "1" : "0");
      page.style.setProperty("--page-x", `${offset * 110}%`);
      page.style.setProperty("--page-z", `${-depth * 80}px`);
      page.style.setProperty("--page-angle", `${Math.max(-1, Math.min(1, -offset)) * 6}deg`);
      page.style.setProperty("--image-scale", String(1 + depth * 0.025));
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
  }, { smoothing: false });
}
