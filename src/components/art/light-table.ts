/** Five selected works share the gallery's stable links; the full collection stays in its browser. */
export function mountLightTable(root: HTMLElement): void {
  const stage = root.querySelector<HTMLElement>("[data-light-stage]");
  const works = Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-light-work]"));
  const previous = root.querySelector<HTMLButtonElement>("[data-light-prev]");
  const next = root.querySelector<HTMLButtonElement>("[data-light-next]");
  const status = root.querySelector<HTMLElement>("[data-light-position]");
  if (!stage || !previous || !next || !status || !works.length)
    return;
  works.forEach((work) => {
    if (work.dataset.galleryHref) work.href = work.dataset.galleryHref;
  });
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let current = Math.floor(works.length / 2);
  try {
    const saved = Number(sessionStorage.getItem("selected-light"));
    if (sessionStorage.getItem("selected-light") !== null && Number.isInteger(saved) && saved >= 0 && saved < works.length)
      current = saved;
  }
  catch { /* Browsing remains available when storage is blocked. */ }
  let position = current;
  let center = 0;
  let centers: number[] = [];
  let gesture: {
    id: number;
    start: number;
    last: number;
    time: number;
    velocity: number;
    moved: boolean;
  } | undefined;
  let suppressClick = false;
  let clickTimer = 0;

  const paint = () => works.forEach((work, index) => {
    const offset = index - position;
    work.style.setProperty("--work-x", `${(centers[index] ?? 0) - center}px`);
    work.style.setProperty("--offset", String(Math.max(-3, Math.min(3, offset))));
    work.style.setProperty("--distance", String(Math.abs(offset)));
    work.dataset.active = String(index === current);
    work.tabIndex = index === current ? 0 : -1;
    work.setAttribute("aria-current", String(index === current));
    const title = work.querySelector("img")?.alt ?? "";
    work.setAttribute("aria-label", `${index === current ? "在画廊查看" : "选择作品"}：${title}`);
  });

  const select = (index: number) => {
    current = Math.max(0, Math.min(works.length - 1, index));
    position = current;
    center = centers[current] ?? 0;
    paint();
    previous.disabled = current === 0;
    next.disabled = current === works.length - 1;
    status.textContent = `${String(current + 1).padStart(2, "0")} / ${String(works.length).padStart(2, "0")} · ${works[current].querySelector("img")?.alt ?? ""}`;
    try {
      sessionStorage.setItem("selected-light", String(current));
    }
    catch { /* Returning falls back to the middle work. */ }
  };

  previous.addEventListener("click", () => select(current - 1));
  next.addEventListener("click", () => select(current + 1));
  stage.addEventListener("keydown", (event) => {
    let target = current;
    if (event.key === "ArrowLeft")
      target--;
    else if (event.key === "ArrowRight")
      target++;
    else if (event.key === "Home")
      target = 0;
    else if (event.key === "End")
      target = works.length - 1;
    else
      return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    select(target);
  });
  works.forEach((work, index) => work.addEventListener("click", (event) => {
    if (suppressClick) {
      event.preventDefault();
      return;
    }
    if (index !== current) {
      event.preventDefault();
      select(index);
    }
  }));
  stage.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0)
      return;
    window.clearTimeout(clickTimer);
    suppressClick = false;
    gesture = { id: event.pointerId, start: event.clientX, last: event.clientX, time: event.timeStamp, velocity: 0, moved: false };
  });
  stage.addEventListener("pointermove", (event) => {
    if (!gesture || gesture.id !== event.pointerId)
      return;
    const distance = event.clientX - gesture.start;
    if (!gesture.moved && Math.abs(distance) < 7)
      return;
    if (!gesture.moved) {
      stage.setPointerCapture(event.pointerId);
      root.classList.add("is-dragging");
    }
    gesture.moved = true;
    const elapsed = Math.max(1, event.timeStamp - gesture.time);
    gesture.velocity = (event.clientX - gesture.last) / elapsed;
    gesture.last = event.clientX;
    gesture.time = event.timeStamp;
    center = Math.max(-40, Math.min((centers.at(-1) ?? 0) + 40, (centers[current] ?? 0) - distance));
    let left = 0;
    while (left < centers.length - 2 && centers[left + 1] < center)
      left++;
    position = left + (center - centers[left]) / Math.max(1, centers[left + 1] - centers[left]);
    paint();
  });
  const release = (event: PointerEvent, cancelled = false) => {
    if (!gesture || gesture.id !== event.pointerId)
      return;
    const moved = gesture.moved;
    const velocity = motion.matches || cancelled || event.timeStamp - gesture.time > 100 ? 0 : gesture.velocity;
    gesture = undefined;
    root.classList.remove("is-dragging");
    if (stage.hasPointerCapture(event.pointerId))
      stage.releasePointerCapture(event.pointerId);
    if (moved) {
      suppressClick = true;
      clickTimer = window.setTimeout(() => { suppressClick = false; }, 0);
      select(cancelled ? current : Math.round(position - Math.max(-.7, Math.min(.7, velocity * .3))));
    }
  };
  stage.addEventListener("pointerup", (event) => release(event));
  stage.addEventListener("pointercancel", (event) => release(event, true));
  stage.addEventListener("lostpointercapture", (event) => release(event, true));

  root.querySelector<HTMLElement>("[data-light-controls]")?.removeAttribute("hidden");
  const hint = root.querySelector<HTMLElement>(".light-table__hint");
  if (hint)
    hint.textContent = "拖动浏览 · 点开看大图";
  root.classList.add("is-ready");
  const measure = () => {
    const gap = stage.clientWidth < 760 ? 48 : 90;
    centers = works.map((work, index) => index === 0 ? 0 : (works[index - 1].offsetWidth + work.offsetWidth) / 2 + gap);
    for (let index = 1; index < centers.length; index++)
      centers[index] += centers[index - 1];
    select(current);
  };
  if (typeof ResizeObserver !== "undefined")
    new ResizeObserver(measure).observe(stage);
  else
    window.addEventListener("resize", measure);
  measure();
}
