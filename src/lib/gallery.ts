import type { ImageMetadata } from "astro";
import { galleryImages as localGalleryImages } from "../config/gallery";
import r2GalleryData from "../config/r2-gallery.json";
import type { GalleryItem } from "../types/gallery";

interface RawR2Item {
  src: string;
  title?: string;
  description?: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
}

export function getGalleryItems(): GalleryItem[] {
  // 1. Map local imported images
  const localItems: GalleryItem[] = localGalleryImages.map((img, idx) => ({
    id: `local-${idx}`,
    src: img.src,
    width: img.src.width,
    height: img.src.height,
    isLocal: true,
    title: img.alt || undefined,
    alt: img.alt || undefined,
  }));

  // 2. Map remote R2 images
  const rawR2 = r2GalleryData as RawR2Item[];
  const remoteItems: GalleryItem[] = rawR2.map((img, idx) => {
    const title = img.title ? img.title.trim() : undefined;
    const desc = img.description ? img.description.trim() : undefined;
    const alt = img.alt ? img.alt.trim() : title;

    return {
      id: `r2-${idx}`,
      src: img.src,
      width: img.width ?? 1200,
      height: img.height ?? 800,
      isLocal: false,
      title: title || undefined,
      description: desc || undefined,
      alt: alt || title || undefined,
    };
  });

  // Combine both lists (local items first, followed by remote items)
  return [...localItems, ...remoteItems];
}
