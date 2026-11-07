/** Serializable media data shared by the gallery browser and viewer. */
export interface GalleryEntry {
  id: string;
  kind: "image" | "video";
  src: string;
  width: number;
  height: number;
  poster?: string;
  alt: string;
  title?: string;
  description?: string;
}
