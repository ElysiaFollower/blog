import { quotesList } from "./quotes";

export const siteConfig = {
  title: "17号的航行日志",
  shortTitle: "LOG 0017",
  description:
    "Prometheus 的个人博客。漫步星海，记录研究思考、日常折腾与宝贵回忆。",
  author: "Prometheus0017",
  email: "prometheus0017#qq.com",
  license: "CC BY-NC-SA 4.0",
  navigation: [
    { label: "首页", href: "/" },
    { label: "文章", href: "/posts/" },
    { label: "画廊", href: "/gallery/" },
    { label: "关于", href: "/about/" },
    { label: "友链", href: "/friends/" },
  ],
  quotes: quotesList,
} as const;

export type SiteConfig = typeof siteConfig;
