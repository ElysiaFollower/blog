import type { ImageMetadata } from "astro";
import niuniuAvatar from "../assets/friends/牛牛.jpg";
import hetaAvatar from "../assets/friends/小黑塔-啾咪.jpg";

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
    avatar: niuniuAvatar, 
    //avatar: hetaAvatar,
  },
] as const;
