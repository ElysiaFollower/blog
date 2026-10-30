import { scrollScene, pinnedProgress, entryProgress, clamp01, ease } from "./scroll-scene";

export function mountAboutStory(): void {
  const play = document.querySelector<HTMLElement>("[data-about-play]");
  if (play) scrollScene(play, pinnedProgress, progress => {
    const p = ease(progress);
    const details = ease((progress - .18) / .48);
    play.style.setProperty("--play-clip", `${p * 51}%`);
    play.style.setProperty("--play-image-x", `${p * -100}px`);
    play.style.setProperty("--play-image-scale", String(1.08 - p * .08));
    play.style.setProperty("--play-copy-y", `${(1 - p) * 135}px`);
    play.style.setProperty("--play-title-scale", String(1.1 - p * .1));
    play.style.setProperty("--play-details", String(details));
    play.style.setProperty("--play-details-x", `${(1 - details) * 65}px`);
    play.style.setProperty("--play-shade", String(1 - p * .5));
    const cue = play.querySelector<HTMLElement>(".about-play__cue");
    if (cue) cue.textContent = progress > .82 ? "继续，在别处找到我 ↓" : "向下，跟着好奇心走走 ↓";
  });
  const contact = document.querySelector<HTMLElement>("[data-about-contact]");
  if (contact) scrollScene(contact, entryProgress, p => {
    const entered = ease(clamp01((p - .05) / .45));
    contact.style.setProperty("--contact-y", `${(1 - entered) * 85}px`);
    contact.style.setProperty("--contact-opacity", String(entered));
  });
}
