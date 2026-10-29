/** Serializable media data shared by the gallery browser and viewer. */
export interface GalleryEntry {
  id: string;
  kind: "image" | "video";
  src: string;
  width: number;
  height: number;
  thumbnail: string;
  poster?: string;
  srcset?: string;
  alt: string;
  title?: string;
  description?: string;
}
