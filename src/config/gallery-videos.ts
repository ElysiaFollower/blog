export interface GalleryVideo {
  id: string;
  src: string;
  poster: string;
  width: number;
  height: number;
  title?: string;
  description?: string;
  alt?: string;
}

// Local sources use public-root paths; remote sources use complete HTTP(S) URLs.
export const galleryVideos: GalleryVideo[] = [];
