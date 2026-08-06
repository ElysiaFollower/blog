import { quotesList } from "./quotes";

export const siteConfig = {
  title: "17号的航行日志",
  shortTitle: "LOG 17",
  description:
    "ElysiaFollower 的个人博客：研究笔记、工程记录、生成媒体，以及偶尔写远的念头。",
  author: "ElysiaFollower",
  email: "prometheus0017#qq.com",
  navigation: [
    { label: "首页", href: "/" },
    { label: "文章", href: "/posts/" },
    { label: "相册", href: "/gallery/" },
    { label: "关于", href: "/about/" },
    { label: "友链", href: "/friends/" },
  ],
  quotes: quotesList,
} as const;

export type SiteConfig = typeof siteConfig;
