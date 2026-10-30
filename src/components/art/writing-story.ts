import { scrollScene, pinnedProgress, clamp01, ease } from "./scroll-scene";

export function mountWritingStory(root: HTMLElement): void {
  const pages = [...root.querySelectorAll<HTMLElement>("[data-writing-page]")];
  const indexes = [...root.querySelectorAll<HTMLElement>("[data-writing-index]")];
  scrollScene(root, pinnedProgress, progress => {
    const raw = progress * Math.max(0, pages.length - 1);
    const segment = Math.floor(raw);
    const cursor = Math.min(pages.length - 1, segment + ease((raw - segment - .3) / .5));
    const current = Math.min(pages.length - 1, Math.floor(cursor + .5));
    const cue = root.querySelector<HTMLElement>("[data-writing-cue]");
    if (cue) cue.textContent = current === pages.length - 1 ? "继续，走进回廊" : "向下翻页";
    pages.forEach((page,index) => {
      const offset = index - cursor;
      const distance = Math.abs(offset);
      const incoming = clamp01(offset);
      const outgoing = clamp01(-offset);
      const opacity = 1 - ease((distance - .7) / .3);
      page.style.setProperty("--page-opacity", String(opacity));
      page.style.setProperty("--page-x", `${incoming * 230 - outgoing * 180}px`);
      page.style.setProperty("--page-y", `${incoming * 70 - outgoing * 35}px`);
      page.style.setProperty("--page-z", `${-distance * 160}px`);
      page.style.setProperty("--page-angle", `${incoming * -17 + outgoing * 9}deg`);
      page.style.setProperty("--art-tilt", `${incoming * 6 - outgoing * 5}deg`);
      page.style.setProperty("--art-scale", String(1 - incoming * .1));
      page.style.setProperty("--art-clip", `${incoming * 20}%`);
      page.style.setProperty("--image-scale", String(1 + incoming * .15));
      page.style.setProperty("--paper-y", `${incoming * 38 + outgoing * 45}px`);
      const ink = offset > 0 ? ease((1 - incoming - .2) / .5) : 1 - ease(outgoing / .38);
      page.style.setProperty("--paper-ink", String(ink));
      page.style.zIndex = String(index + 1);
      page.toggleAttribute("data-current", index === current);
      page.inert = index !== current;
      page.setAttribute("aria-hidden", String(index !== current));
    });
    indexes.forEach((link,index) => {
      if (index === current) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
      link.style.setProperty("--index-progress", String(clamp01(cursor - index + 1)));
    });
  });
}
