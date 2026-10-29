import type { GalleryEntry } from "../../types/gallery";
import { galleryGeometry } from "./layout";
import type { createGalleryViewer } from "./viewer";
import { manageVideoPlayback } from "./video-playback";

export function mountGallery(root: HTMLElement) {
    const items = JSON.parse(root.querySelector("[data-gallery-data]")!.textContent!) as GalleryEntry[];
    const canvas = root.querySelector<HTMLElement>("[data-gallery-canvas]")!;
    const more = root.querySelector<HTMLButtonElement>("[data-gallery-more]")!;
    const status = root.querySelector<HTMLElement>("[data-gallery-status]")!;
    const sentinel = root.querySelector<HTMLElement>("[data-gallery-sentinel]")!;
    let count = canvas.children.length;
    let activeIndex: number | null = null;
    let pushed = history.state?.galleryViewer === true;
    let closingFromHistory = false;
    let viewer: Awaited<ReturnType<typeof createGalleryViewer>> | undefined;
    let viewerPromise: Promise<void> | undefined;
    const thumbnail = (index: number) => canvas.querySelector<HTMLElement>(`[data-gallery-index="${index}"]`);
    const readIndex = () => items.findIndex(item => item.id === new URLSearchParams(location.hash.slice(1)).get("work"));
    const writeURL = (index: number | null, push = false) => {
        const url = new URL(location.href);
        url.hash = index === null ? "" : new URLSearchParams({ work: items[index].id }).toString();
        const state = { ...history.state, galleryViewer: index !== null && (push || pushed) };
        history[push ? "pushState" : "replaceState"](state, "", url);
    };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const playback = new WeakMap<HTMLVideoElement, ReturnType<typeof manageVideoPlayback>>();
    function updateVideo(video: HTMLVideoElement) {
        playback.get(video)?.update();
    }
    const videoObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
            const video = entry.target as HTMLVideoElement;
            if (entry.isIntersecting)
                updateVideo(video);
            else
                playback.get(video)?.pause();
        }
    });
    // Keep full-quality sources near the viewport. Releasing distant sources also
    // stops GIF decoding; their layout and native links remain available.
    const resourceObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
            const card = entry.target as HTMLElement;
            const item = items[Number(card.dataset.galleryIndex)];
            const media = card.querySelector<HTMLImageElement | HTMLVideoElement>("img, video")!;
            if (entry.isIntersecting || card.contains(document.activeElement)) {
                if (!media.hasAttribute("src"))
                    media.src = item.src;
                if (media instanceof HTMLVideoElement)
                    updateVideo(media);
            }
            else {
                if (media instanceof HTMLVideoElement)
                    playback.get(media)?.release();
                else if (media.hasAttribute("src")) {
                    media.removeAttribute("src");
                }
            }
        }
    }, { rootMargin: "1000px 0px" });
    function prepareMedia(card: HTMLElement) {
        const media = card.querySelector<HTMLImageElement | HTMLVideoElement>("img, video")!;
        media.addEventListener("error", () => { card.dataset.failed = ""; });
        media.addEventListener("load", () => { delete card.dataset.failed; });
        media.addEventListener("loadeddata", () => { delete card.dataset.failed; });
        card.addEventListener("focusin", () => {
            if (!media.hasAttribute("src"))
                media.src = items[Number(card.dataset.galleryIndex)].src;
            if (media instanceof HTMLVideoElement) updateVideo(media);
        });
        if (media instanceof HTMLImageElement && media.hasAttribute("src") && media.complete && !media.naturalWidth)
            card.dataset.failed = "";
        if (media instanceof HTMLVideoElement) {
            playback.set(media, manageVideoPlayback(media, () => {
                const rect = media.getBoundingClientRect();
                return activeIndex === null && !document.hidden && rect.bottom > 0 && rect.top < innerHeight;
            }, () => reduceMotion.matches));
            videoObserver.observe(media);
        }
        resourceObserver.observe(card);
    }
    canvas.querySelectorAll<HTMLElement>(".gallery-card").forEach(prepareMedia);
    document.addEventListener("visibilitychange", () => canvas.querySelectorAll("video").forEach(updateVideo));
    reduceMotion.addEventListener("change", () => canvas.querySelectorAll("video").forEach(updateVideo));
    function updateStatus() {
        more.hidden = count >= items.length;
        status.textContent = count >= items.length ? "已看遍这份收藏" : "";
    }
    function appendUntil(target: number) {
        const end = Math.min(items.length, target);
        if (end <= count)
            return;
        const geometry = galleryGeometry(items.slice(0, end));
        const fragment = document.createDocumentFragment();
        for (let index = count; index < end; index++) {
            const item = items[index];
            const card = document.createElement(item.kind === "video" ? "div" : "a");
            card.className = "gallery-card";
            if (card instanceof HTMLAnchorElement)
                card.href = item.src;
            card.dataset.galleryIndex = String(index);
            card.dataset.id = item.id;
            card.setAttribute("aria-label", `查看：${item.title || item.alt}`);
            card.style.cssText = geometry.cards[index];
            if (item.kind === "video") {
                const video = document.createElement("video");
                video.poster = item.poster!;
                video.width = item.width;
                video.height = item.height;
                video.muted = true;
                video.loop = true;
                video.playsInline = true;
                video.controls = true;
                video.preload = "none";
                video.setAttribute("aria-label", item.title || item.alt);
                const expand = document.createElement("button");
                expand.type = "button";
                expand.className = "gallery-card__open";
                expand.dataset.galleryOpen = String(index);
                expand.textContent = "↗";
                expand.setAttribute("aria-label", `放大观看：${item.title || item.alt}`);
                card.append(video, expand);
            }
            else {
                const img = document.createElement("img");
                img.className = "gallery-card__image";
                img.width = item.width;
                img.height = item.height;
                img.alt = item.alt;
                img.loading = "lazy";
                img.decoding = "async";
                card.append(img);
            }
            prepareMedia(card);
            const caption = document.createElement("span");
            caption.className = "gallery-card__caption";
            const title = document.createElement("span");
            title.textContent = item.title || item.alt;
            const arrow = document.createElement("span");
            arrow.textContent = "↗";
            arrow.setAttribute("aria-hidden", "true");
            caption.append(title, arrow);
            const error = document.createElement("span");
            error.className = "gallery-card__error";
            error.textContent = item.kind === "video" ? "视频暂不可用 · 可在查看器打开原片 ↗" : "图片暂不可用 · 打开原图 ↗";
            card.append(caption, error);
            fragment.append(card);
        }
        canvas.append(fragment);
        canvas.style.cssText = geometry.canvas;
        count = end;
        updateStatus();
    }
    async function open(index: number, fromClick = false) {
        if (index < 0 || index >= items.length)
            return;
        activeIndex = index;
        canvas.querySelectorAll("video").forEach(video => playback.get(video)?.pause());
        if (fromClick && readIndex() < 0) {
            writeURL(index, true);
            pushed = true;
        }
        if (!viewerPromise) {
            viewerPromise = import("./viewer").then(async ({ createGalleryViewer }) => {
                viewer = await createGalleryViewer(items, {
                    getThumbnail: thumbnail,
                    onChange(index) { activeIndex = index; writeURL(index); },
                    onClose() {
                        const index = activeIndex;
                        activeIndex = null;
                        if (index !== null) {
                            appendUntil(Math.ceil((index + 1) / 24) * 24);
                            const card = thumbnail(index);
                            const rect = card?.getBoundingClientRect();
                            if (rect && (rect.bottom < 0 || rect.top > innerHeight))
                                card?.scrollIntoView({ block: "center", behavior: "instant" });
                        }
                        if (!closingFromHistory) {
                            if (pushed)
                                history.back();
                            else
                                writeURL(null);
                        }
                        pushed = false;
                        closingFromHistory = false;
                        canvas.querySelectorAll("video").forEach(updateVideo);
                    },
                });
            }).catch(() => {
                viewerPromise = undefined;
                activeIndex = null;
                status.textContent = "查看器暂不可用，可通过作品链接打开原图。";
                if (pushed)
                    history.back();
                else
                    writeURL(null);
                pushed = false;
            });
        }
        await viewerPromise;
        if (activeIndex !== null)
            viewer?.open(activeIndex);
    }
    canvas.addEventListener("click", (event) => {
        const card = (event.target as Element).closest<HTMLAnchorElement>("[data-gallery-index]");
        if (!card || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0)
            return;
        const index = Number(card.dataset.galleryIndex);
        if (card.hasAttribute("data-failed") && items[index].kind === "image")
            return;
        if (items[index].kind === "video" && !(event.target as Element).closest("[data-gallery-open]"))
            return;
        event.preventDefault();
        void open(index, true);
    });
    more.addEventListener("click", () => {
        const firstNew = count;
        appendUntil(count + 24);
        const card = thumbnail(firstNew);
        (card?.querySelector<HTMLElement>("[data-gallery-open]") ?? card)?.focus({ preventScroll: true });
    });
    const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting))
            appendUntil(count + 24);
        if (count === items.length)
            observer.disconnect();
    }, { rootMargin: "900px 0px" });
    observer.observe(sentinel);
    window.addEventListener("popstate", () => {
        pushed = history.state?.galleryViewer === true;
        const index = readIndex();
        if (index >= 0)
            void open(index);
        else if (activeIndex !== null) {
            closingFromHistory = true;
            if (viewer)
                viewer.close();
            else {
                activeIndex = null;
                pushed = false;
                closingFromHistory = false;
            }
        }
    });
    updateStatus();
    const initialIndex = readIndex();
    if (initialIndex >= 0)
        void open(initialIndex);
}
