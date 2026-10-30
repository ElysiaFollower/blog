import { scrollScene, pinnedProgress, entryProgress, ease } from "./scroll-scene";

/** The portrait is the visual anchor while identity gives way to the research notes beside it. */
export function mountPortraitStory(root: HTMLElement): void {
  scrollScene(root,pinnedProgress,progress => {
    const p=ease(progress);
    root.style.setProperty("--portrait-radius",`${230*(1-p)}px`);
    root.style.setProperty("--portrait-scale",String(1+p*.055));
    root.style.setProperty("--portrait-cut",`${ease((progress-.4)/.55)*260}px`);
  });
  root.querySelectorAll<HTMLElement>("[data-portrait-direction]").forEach(row => {
    scrollScene(row,entryProgress,progress => {
      const p=ease(progress);
      row.style.setProperty("--direction-y",`${(1-p)*22}px`);
      row.style.setProperty("--direction-line",String(.15+p*.85));
    });
  });
}
