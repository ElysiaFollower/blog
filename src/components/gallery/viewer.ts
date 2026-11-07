import type PhotoSwipe from "photoswipe";
import type { PhotoSwipeEventsMap } from "photoswipe";
import type { GalleryEntry } from "../../types/gallery";

interface GalleryViewerOptions {
  getThumbnail: (index: number) => HTMLElement | null;
  onChange?: (index: number) => void;
  onClose?: () => void;
}

export interface GalleryViewer {
  open: (index: number) => void;
  close: () => void;
  destroy: () => void;
}

/** The collection owns navigation state; this viewer owns the focused work. */
export async function createGalleryViewer(
  items: GalleryEntry[],
  options: GalleryViewerOptions,
): Promise<GalleryViewer> {
  const { default: PhotoSwipeCore } = await import("photoswipe");
  let active: PhotoSwipe | undefined;
  let disposed = false;
  let closeRequested = false;
  let pendingIndex: number | undefined;

  const requestClose = () => {
    pendingIndex = undefined;
    closeRequested = true;
    if (active && !active.opener.isOpening) active.close();
  };

  const visibleThumbnail = (index: number) => {
    const element = options.getThumbnail(index);
    const image = element?.matches("img")
      ? element
      : element?.querySelector<HTMLElement>("img, video");
    if (!image) return undefined;
    const bounds = image.getBoundingClientRect();
    return bounds.width > 0 &&
      bounds.height > 0 &&
      bounds.bottom > 0 &&
      bounds.top < window.innerHeight &&
      bounds.right > 0 &&
      bounds.left < window.innerWidth
      ? image
      : undefined;
  };

  const open = (index: number) => {
    if (disposed || !Number.isInteger(index) || !items[index]) return;
    if (active) {
      if (active.isDestroying) {
        pendingIndex = index;
      } else {
        closeRequested = false;
        active.goTo(index);
      }
      return;
    }
    closeRequested = false;

    const previousFocus = document.activeElement;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const viewer = new PhotoSwipeCore({
      dataSource: items,
      index,
      mainClass: "gallery-viewer",
      bgOpacity: 1,
      initialZoomLevel: "fit",
      secondaryZoomLevel: 1,
      maxZoomLevel: (zoomLevel) => Math.max(2, zoomLevel.fit * 5),
      wheelToZoom: true,
      imageClickAction: "zoom",
      returnFocus: false,
      counter: false,
      showAnimationDuration: reduceMotion ? 0 : 260,
      hideAnimationDuration: reduceMotion ? 0 : 220,
      zoomAnimationDuration: reduceMotion ? 0 : 240,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      preload: [1, 2],
      errorMsg: "图片暂时无法加载，可尝试打开原图。",
      closeTitle: "关闭查看器",
      zoomTitle: "切换缩放",
      arrowPrevTitle: "上一张",
      arrowNextTitle: "下一张",
      paddingFn: (viewport) =>
        viewport.x <= 620
          ? { top: 62, bottom: 80, left: 10, right: 10 }
          : { top: 72, bottom: 88, left: 78, right: 78 },
    });
    active = viewer;

    viewer.addFilter("itemData", (data, itemIndex) => ({
      ...data,
      type: items[itemIndex].kind,
      msrc: items[itemIndex].poster || items[itemIndex].src,
      element: visibleThumbnail(itemIndex),
    }));

    registerVideoContent(viewer, items);
    viewer.on("uiRegister", () => registerInformation(viewer, items));
    viewer.on("uiElementCreate", ({ data }) => {
      if (data.name === "close") data.onClick = requestClose;
    });
    viewer.on("change", () => options.onChange?.(viewer.currIndex));
    viewer.on("afterInit", () => {
      viewer.element?.setAttribute("aria-label", "作品查看器");
      viewer.element?.setAttribute("aria-modal", "true");
    });
    // PhotoSwipe binds its keyboard handler only after the opening transition.
    const openingEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !viewer.opener.isOpening) return;
      event.preventDefault();
      event.stopPropagation();
      requestClose();
    };
    document.addEventListener("keydown", openingEscape, true);
    viewer.on("openingAnimationEnd", () => {
      document.removeEventListener("keydown", openingEscape, true);
      if (closeRequested) viewer.close();
    });
    viewer.on("close", () => {
      // The browser may have appended or rearranged thumbnails while viewing.
      if (viewer.currSlide) {
        viewer.currSlide.data.element = visibleThumbnail(viewer.currIndex);
      }
    });
    viewer.on("destroy", () => {
      document.removeEventListener("keydown", openingEscape, true);
      active = undefined;
      if (disposed) return;
      if (pendingIndex !== undefined) {
        const next = pendingIndex;
        pendingIndex = undefined;
        queueMicrotask(() => open(next));
        return;
      }
      options.onClose?.();
      queueMicrotask(() => {
        if (disposed || active) return;
        const thumbnail = options.getThumbnail(viewer.currIndex);
        const target = thumbnail?.closest<HTMLElement>("a, button")
          ?? thumbnail?.querySelector<HTMLElement>("[data-gallery-open]")
          ?? thumbnail;
        const fallback = previousFocus instanceof HTMLElement ? previousFocus : null;
        (target?.isConnected ? target : fallback)?.focus({ preventScroll: true });
      });
    });

    viewer.init();
  };

  return {
    open,
    close: requestClose,
    destroy() {
      disposed = true;
      pendingIndex = undefined;
      const viewer = active;
      if (!viewer) return;
      // PhotoSwipe cannot reverse its opening transition; dispose as it completes.
      if (viewer.opener.isOpening) {
        viewer.on("openingAnimationEnd", () => viewer.destroy());
      } else {
        viewer.destroy();
      }
    },
  };
}

function registerVideoContent(viewer: PhotoSwipe, items: GalleryEntry[]) {
  type Content = PhotoSwipeEventsMap["contentLoad"]["content"];
  const videos = new Map<Content, HTMLVideoElement>();
  const release = (video: HTMLVideoElement) => {
    video.onloadedmetadata = null;
    video.onerror = null;
    video.pause();
    video.removeAttribute("src");
    video.load();
  };

  viewer.on("contentLoad", (event) => {
    const { content } = event;
    const item = items[content.index];
    if (item.kind !== "video") return;
    event.preventDefault();
    const previous = videos.get(content);
    if (previous) release(previous);

    const wrapper = document.createElement("div");
    wrapper.className = "pswp__content gallery-viewer__video";
    const video = document.createElement("video");
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.tabIndex = content.slide?.isActive ? 0 : -1;
    const poster = item.poster;
    if (poster) video.poster = poster;
    video.setAttribute("aria-label", item.title || item.alt || "视频");
    video.onloadedmetadata = () => content.onLoaded();
    video.onerror = () => {
      release(video);
      videos.delete(content);
      content.onError();
    };
    wrapper.append(video);
    content.element = wrapper;
    content.state = "loading";
    videos.set(content, video);
    video.src = item.src;
  });

  viewer.on("contentActivate", ({ content }) => {
    const video = videos.get(content);
    if (video) video.tabIndex = 0;
  });
  viewer.on("contentDeactivate", ({ content }) => {
    const video = videos.get(content);
    if (video) {
      video.tabIndex = -1;
      video.pause();
    }
  });
  viewer.on("contentRemove", ({ content }) => videos.get(content)?.pause());
  viewer.on("contentDestroy", ({ content }) => {
    const video = videos.get(content);
    if (video) release(video);
    videos.delete(content);
  });
  viewer.on("close", () => videos.forEach((video) => video.pause()));
  // PhotoSwipe clears content event handlers before its final cache cleanup.
  viewer.on("destroy", () => {
    videos.forEach(release);
    videos.clear();
  });
  viewer.on("pointerDown", (event) => {
    if ((event.originalEvent.target as Element).closest("video")) {
      event.preventDefault();
    }
  });
  viewer.on("keydown", (event) => {
    if (
      event.originalEvent.target instanceof HTMLVideoElement &&
      [" ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.originalEvent.key)
    ) {
      event.preventDefault();
    }
  });
  viewer.addFilter("contentErrorElement", (element, content) => {
    if (items[content.index].kind === "video") {
      element.textContent = "视频暂时无法播放，可尝试打开原片。";
    }
    return element;
  });
}

function registerInformation(viewer: PhotoSwipe, items: GalleryEntry[]) {
  let feedback: HTMLElement | undefined;
  let feedbackTimeout: ReturnType<typeof setTimeout> | undefined;
  viewer.on("destroy", () => clearTimeout(feedbackTimeout));
  viewer.on("change", () => {
    clearTimeout(feedbackTimeout);
    if (feedback) feedback.textContent = "";
  });

  viewer.ui?.registerElement({
    name: "gallery-feedback",
    appendTo: "root",
    onInit: (element) => {
      feedback = element;
      element.setAttribute("role", "status");
    },
  });

  viewer.ui?.registerElement({
    name: "gallery-position",
    className: "gallery-viewer__position",
    tagName: "p",
    order: 5,
    onInit: (element) => {
      element.setAttribute("aria-live", "polite");
      element.setAttribute("aria-atomic", "true");
      viewer.on("change", () => {
        element.textContent = `${String(viewer.currIndex + 1).padStart(2, "0")} / ${items.length}`;
      });
    },
  });

  viewer.ui?.registerElement({
    name: "gallery-copy",
    className: "gallery-viewer__copy",
    isButton: true,
    title: "复制作品链接",
    order: 8,
    html: '<svg class="gallery-viewer__copy-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m10 13 4-4m-6 5-1 1a4 4 0 0 0 6 6l4-4a4 4 0 0 0 0-6M16 10l1-1a4 4 0 0 0-6-6L7 7a4 4 0 0 0 0 6"/></svg><span class="gallery-viewer__copy-label">复制链接</span>',
    onClick: async () => {
      clearTimeout(feedbackTimeout);
      const copiedIndex = viewer.currIndex;
      let message = "链接已复制";
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(window.location.href);
      } catch {
        message = "未能复制，请从地址栏复制链接。";
      }
      if (viewer.isDestroying || viewer.currIndex !== copiedIndex || !feedback) return;
      feedback.textContent = message;
      feedbackTimeout = setTimeout(() => {
        if (feedback) feedback.textContent = "";
      }, 4000);
    },
  });

  viewer.ui?.registerElement({
    name: "gallery-original",
    className: "gallery-viewer__original",
    tagName: "a",
    order: 9,
    onInit: (element) => {
      const link = element as HTMLAnchorElement;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      viewer.on("change", () => {
        const item = items[viewer.currIndex];
        link.href = item.src;
        link.textContent = item.kind === "video" ? "原片 ↗" : "原图 ↗";
        link.setAttribute("aria-label", item.kind === "video"
          ? "打开原视频（新标签页）"
          : "打开原图（新标签页）");
      });
    },
  });

  viewer.ui?.registerElement({
    name: "gallery-caption",
    appendTo: "root",
    onInit: (element) => {
      const details = document.createElement("details");
      details.className = "gallery-viewer__details";
      const summary = document.createElement("summary");
      const titlePreview = document.createElement("span");
      titlePreview.className = "gallery-viewer__caption-title";
      const toggle = document.createElement("span");
      toggle.className = "gallery-viewer__caption-toggle";
      toggle.textContent = "信息";
      toggle.setAttribute("aria-hidden", "true");
      summary.append(titlePreview, toggle);

      const body = document.createElement("div");
      body.className = "gallery-viewer__caption-body";
      body.tabIndex = 0;
      body.setAttribute("role", "region");
      body.setAttribute("aria-label", "作品信息");
      const title = document.createElement("h2");
      const description = document.createElement("p");
      body.append(title, description);
      details.append(summary, body);
      element.append(details);

      // Keep native text scrolling independent of PhotoSwipe's wheel-to-zoom.
      element.addEventListener("wheel", (event) => event.stopPropagation(), {
        passive: true,
      });
      viewer.on("keydown", (event) => {
        const key = event.originalEvent.key;
        if (
          body.contains(event.originalEvent.target as Node) &&
          ["ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown", " "].includes(key)
        ) {
          event.preventDefault();
        }
      });
      viewer.on("change", () => {
        const item = items[viewer.currIndex];
        details.open = false;
        titlePreview.textContent = item.title || item.alt || "作品信息";
        title.textContent = item.title || item.alt || "";
        title.hidden = !title.textContent;
        description.textContent = item.description ?? "";
        description.hidden = !description.textContent;
        element.hidden = !title.textContent && !description.textContent;
      });
    },
  });
}
