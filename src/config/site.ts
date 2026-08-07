import { quotesList } from "./quotes";

export const siteConfig = {
  title: "17号的航行日志",
  shortTitle: "LOG 17",
  description:
    "Prometheus 的个人博客。漫步星海，记录研究思考、日常折腾与记忆回响。",
  author: "Prometheus",
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
