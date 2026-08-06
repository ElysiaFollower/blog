import type { ImageMetadata } from "astro";

export interface GalleryItem {
  id: string;
  src: string | ImageMetadata;
  width: number;
  height: number;
  isLocal: boolean;
  title?: string;
  description?: string;
  alt?: string;
}
