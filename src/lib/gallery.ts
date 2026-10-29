import type { ImageMetadata } from "astro";
import { createHash } from "node:crypto";
import path from "node:path";
import { galleryImages } from "../config/gallery";
import { galleryVideos } from "../config/gallery-videos";
import r2GalleryData from "../config/r2-gallery.json";
import type { GalleryEntry } from "../types/gallery";

function validateDimensions(width: unknown, height: unknown, source: string): void {
  if (![width, height].every((size) => typeof size === "number" && Number.isInteger(size) && size > 0)) {
    throw new Error(`Gallery media requires positive integer width and height: ${source}`);
  }
}

function validateSource(source: string): void {
  if (source.startsWith("/") && !source.startsWith("//")) return;
  try {
    if (["http:", "https:"].includes(new URL(source).protocol)) return;
  } catch { /* Report the invalid configuration with its source below. */ }
  throw new Error(`Gallery media needs a public-root path or HTTP(S) URL: ${source}`);
}

function sourceId(source: string): string {
  return `image-${createHash("sha256").update(source).digest("hex").slice(0, 24)}`;
}

function localSource(image: ImageMetadata): string {
  // Astro's emitted asset URL changes between dev and build; the repository path does not.
  const fsPath = (image as ImageMetadata & { fsPath?: string }).fsPath;
  if (!fsPath) throw new Error(`Missing original path for gallery image: ${image.src}`);
  return path.relative(process.cwd(), fsPath).split(path.sep).join("/");
}

export async function getGalleryEntries(): Promise<GalleryEntry[]> {
  const localImages: GalleryEntry[] = galleryImages.map((image) => {
    validateDimensions(image.src.width, image.src.height, image.src.src);
    return {
      id: sourceId(localSource(image.src)),
      kind: "image",
      src: image.src.src,
      thumbnail: image.src.src,
      width: image.src.width,
      height: image.src.height,
      title: image.alt || undefined,
      alt: image.alt || "相册图片",
    };
  });
  const configuredImages: GalleryEntry[] = r2GalleryData.map((image) => {
    validateDimensions(image.width, image.height, image.src);
    validateSource(image.src);
    const title = image.title?.trim() || undefined;
    return {
      id: sourceId(image.src),
      kind: "image",
      src: image.src,
      thumbnail: image.src,
      width: image.width,
      height: image.height,
      title,
      description: image.description?.trim() || undefined,
      alt: image.alt?.trim() || title || "相册图片",
    };
  });
  const videos: GalleryEntry[] = galleryVideos.map((video) => {
    const id = video.id.trim();
    if (!id) throw new Error(`Gallery video requires a stable, nonempty id: ${video.src}`);
    validateDimensions(video.width, video.height, video.src);
    validateSource(video.src);
    validateSource(video.poster);
    const title = video.title?.trim() || undefined;
    return {
      id,
      kind: "video",
      src: video.src,
      poster: video.poster,
      thumbnail: video.poster,
      width: video.width,
      height: video.height,
      title,
      description: video.description?.trim() || undefined,
      alt: video.alt?.trim() || title || "相册视频",
    };
  });
  const entries = [...localImages, ...configuredImages, ...videos];
  const ids = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id)) throw new Error(`Duplicate gallery media id: ${entry.id}`);
    ids.add(entry.id);
  }
  return entries;
}
