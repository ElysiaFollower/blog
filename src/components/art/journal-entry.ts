import { scrollScene, ease, clamp01 } from "./scroll-scene";

export function mountJournalEntry(root: HTMLElement): void {
  const documentTop = root.getBoundingClientRect().top + scrollY;
  scrollScene(root, rect => (documentTop - rect.top) / (rect.height * .9), progress => {
    const p = ease(progress);
    root.style.setProperty("--journal-title-scale", String(1 - p * .22));
    root.style.setProperty("--journal-title-y", `${-p * 44}px`);
    root.style.setProperty("--journal-copy-y", `${-p * 20}px`);
    root.style.setProperty("--journal-line", String(clamp01(.3 + p * .7)));
    root.style.setProperty("--journal-wash", String(1 - p * .7));
  });
}
