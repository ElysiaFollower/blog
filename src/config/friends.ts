import type { ImageMetadata } from "astro";

export interface FriendLink {
  title: string;
  description: string;
  href: string;
  label: string;
  avatar?: ImageMetadata;
}

export const friendLinks: readonly FriendLink[] = [
  {
    title: "ffy",
    description: "魔女教大德司教勤勉担当",
    href: "https://ffy6511.github.io/",
    label: "PERSONAL BLOG",
  },
] as const;
