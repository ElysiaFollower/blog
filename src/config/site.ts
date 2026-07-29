export const siteConfig = {
  title: "17号的航行日志",
  shortTitle: "LOG 17",
  description:
    "分享技术路上的所学所思，也拾掇些钟情角色的记忆碎片。",
  author: "ElysiaFollower",
  email: "prometheus0017#qq.com",
  navigation: [
    { label: "首页", href: "/" },
    { label: "文章", href: "/posts/" },
    { label: "相册", href: "/gallery/" },
    { label: "友链", href: "/friends/" },
  ],
  quotes: [
    "鸟为什么会飞？因为它们必须飞向天际。",
    "铭记过去，是为了开拓更好的未来。",
    "愿你前行的道路有群星闪耀。",
    "以自我的意志，竭尽全力活过作为主角的一生。",
  ],
} as const;

export type SiteConfig = typeof siteConfig;
