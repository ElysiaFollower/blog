import { scrollScene, ease } from "./scroll-scene";

export function mountJournalEntry(root: HTMLElement): void {
  scrollScene(root, rect => -rect.top / (rect.height * .9), progress => {
    const p = ease(progress);
    root.style.setProperty("--journal-title-y", `${-p * 32}px`);
    root.style.setProperty("--journal-copy-y", `${p * 22}px`);
    root.style.setProperty("--journal-image-y", `${-20 - p * 30}px`);
    root.style.setProperty("--journal-line", String(1));
    root.style.setProperty("--journal-wash", String(1 - p * .5));
  });
}
