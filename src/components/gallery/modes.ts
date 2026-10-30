import { mountGallery } from "./browse";
import type { mountExhibition } from "./exhibition";

/** One viewer and one URL history serve both presentations of the collection. */
export function mountGalleryModes() {
  const browseRoot = document.querySelector<HTMLElement>("[data-gallery]")!;
  const browsePanel = document.querySelector<HTMLElement>("[data-gallery-browse-panel]")!;
  const exhibitionRoot = document.querySelector<HTMLElement>("[data-exhibition]")!;
  const collection = document.querySelector<HTMLElement>("#gallery-collection")!;
  const choices = document.querySelectorAll<HTMLInputElement>('input[name="gallery-mode"]');
  const initialMode = new URL(location.href).searchParams.get("mode") === "exhibition" ? "exhibition" : "browse";
  let mode: "browse" | "exhibition" = initialMode;
  let viewingIndex: number | null = null;
  let exhibition: ReturnType<typeof mountExhibition> | undefined;
  let loading: Promise<void> | undefined;
  // Restore presentation before the browser controller restores a history-linked work.
  window.addEventListener("popstate", () => {
    setMode(new URL(location.href).searchParams.get("mode") === "exhibition" ? "exhibition" : "browse");
  });
  const browse = mountGallery(browseRoot, {
    isBrowsing: () => mode === "browse",
    thumbnail: index => exhibition?.thumbnail(index) ?? null,
    onError(index) {
      const status = exhibitionRoot.querySelector<HTMLElement>("[data-exhibition-status]")!;
      const original = document.createElement("a");
      original.href = browse.items[index].src;
      original.target = "_blank";
      original.rel = "noopener noreferrer";
      original.textContent = "打开原文件 ↗";
      status.replaceChildren("查看器暂未载入，请刷新重试，或", original);
    },
    onViewing(index) {
      viewingIndex = index;
      if (index !== null) exhibitionRoot.querySelector("[data-exhibition-status]")!.textContent = "";
      exhibition?.setViewing(index !== null);
      if (index !== null && mode === "exhibition") exhibition?.select(index, true);
    },
  });

  function setMode(next: typeof mode) {
    mode = next;
    const url = new URL(location.href);
    if (mode === "exhibition") url.searchParams.set("mode", "exhibition");
    else url.searchParams.delete("mode");
    history.replaceState(history.state, "", url);
    document.body.dataset.galleryMode = mode;
    choices.forEach(choice => { choice.checked = choice.value === mode; });
    browsePanel.hidden = mode !== "browse";
    exhibitionRoot.hidden = mode !== "exhibition";
    const entryLabel = document.querySelector("[data-gallery-entry-label]");
    if (entryLabel) entryLabel.textContent = mode === "browse" ? "向下，随目光漫游" : "向下，走进光的回廊";
    exhibition?.activate(mode === "exhibition");
    if (mode === "exhibition" && !loading) {
      loading = import("./exhibition").then(({ mountExhibition }) => {
        exhibition = mountExhibition(exhibitionRoot, browse.items, {
          open: index => { void browse.open(index); },
          browse: index => { setMode("browse"); browse.reveal(index); },
        });
        if (viewingIndex !== null) { exhibition.select(viewingIndex, true); exhibition.setViewing(true); }
        exhibition.activate(mode === "exhibition");
      }).catch(() => {
        loading = undefined;
        setMode("browse");
        browseRoot.querySelector("[data-gallery-status]")!.textContent = "展厅暂未载入，请重试。";
      });
    }
  }
  choices.forEach(choice => choice.addEventListener("change", () => setMode(choice.value === "exhibition" ? "exhibition" : "browse")));
  document.querySelector("[data-gallery-enter-exhibition]")?.addEventListener("click", () => {
    setMode("exhibition");
    collection.scrollIntoView({ behavior: "instant" });
    exhibitionRoot.querySelector<HTMLElement>("[data-exhibition-stage]")!.focus({ preventScroll: true });
  });
  document.querySelector(".gallery-passage__continue")?.addEventListener("click", event => {
    event.preventDefault();
    collection.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    if (mode === "exhibition") exhibitionRoot.querySelector<HTMLElement>("[data-exhibition-stage]")!.focus({ preventScroll: true });
  });
  setMode(initialMode);
}
