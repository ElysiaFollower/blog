import { scrollScene, pinnedProgress, entryProgress, ease } from "./scroll-scene";

export function mountAboutStory(): void {
  const intro = document.querySelector<HTMLElement>("[data-about-intro]");
  if (intro) scrollScene(intro, rect => -rect.top / (rect.height * .9), p => {
    intro.style.setProperty("--intro-copy-y", `${-p * 34}px`);
    intro.style.setProperty("--intro-image-x", `${p * -40}px`);
    intro.style.setProperty("--intro-image-angle", `${-p * 2}deg`);
    intro.style.setProperty("--intro-image-scale", String(1 + p * .05));
  });
  const research = document.querySelector<HTMLElement>("[data-about-research]");
  if (research) {
    const rows = [...research.querySelectorAll<HTMLElement>("[data-direction]")];
    const current = research.querySelector<HTMLElement>("[data-direction-current]");
    const list = research.querySelector<HTMLElement>(".about-research__list")!;
    scrollScene(research, (rect, viewport) => (viewport * .3 - rect.top - list.offsetTop) / Math.max(1,list.offsetHeight), p => {
      research.style.setProperty("--research-progress", String(p));
      if (current) current.textContent = String(Math.min(rows.length,Math.floor(p * rows.length) + 1)).padStart(2,"0");
    });
    rows.forEach(row => scrollScene(row, (rect, viewport) => (viewport * .88 - rect.top) / (viewport * .65), progress => {
      const p = ease(progress);
      row.style.setProperty("--direction-opacity", String(.75 + p * .25));
      row.style.setProperty("--direction-x", `${(1 - p) * 28}px`);
      row.style.setProperty("--direction-emphasis", String(p));
    }));
  }
  const play = document.querySelector<HTMLElement>("[data-about-play]");
  if (play) scrollScene(play, pinnedProgress, progress => {
    const p = ease(progress / .8);
    const details = ease((progress - .58) / .24);
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
  }, { pinned: true });
  const contact = document.querySelector<HTMLElement>("[data-about-contact]");
  if (contact) scrollScene(contact, entryProgress, p => {
    const entered = ease((p - .05) / .45);
    contact.style.setProperty("--contact-y", `${(1 - entered) * 55}px`);
    contact.style.setProperty("--contact-opacity", String(.7 + entered * .3));
  });
}
