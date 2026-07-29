# Blog

一个具有鲜明个人视觉风格的 Astro 博客主题及其演示站。

它首先服务于一套完整、自洽的个人博客设计，开源复用只是自然产生的副产品。站点的核心原则是：

- 展示页面具有明确的个人表达和经过设计的交互。
- 阅读与其他功能页面保持安静、清晰、快速。
- 能自然解耦的内容与站点信息使用配置表达。
- 构图、节奏和气质等独特设计保持强主见，不为通用性牺牲协调性。

主题完成后，个人博客可以从稳定版本一次性派生并独立维护。

## 本地开发

需要 Node.js 22.12 或更高版本，以及 pnpm 9。

```bash
pnpm install
pnpm dev
```

提交前运行静态检查与生产构建：

```bash
pnpm check
pnpm build
```

构建结果位于 `dist/`，不进入版本控制。

## 内容与路由

文章放在 `src/content/posts/`，支持 Markdown 与 MDX。每篇文章通过 frontmatter 提供标题、摘要、日期、分类、标签和封面：

```yaml
---
title: "文章标题"
description: "用于列表与搜索结果的简短摘要。"
pubDate: 2026-01-17
updatedDate: 2026-01-20
category: "AI"
tags: ["Audio", "Dialogue"]
cover: "../../assets/demo/example.png"
coverAlt: "封面内容说明"
---
```

分类、标签、年份归档、RSS 与相邻文章导航均由内容集合自动生成。新增文章后不需要手工维护索引页。

## 配置边界

- `src/config/site.ts`：站点名称、描述、导航与引语。
- `src/config/profile.ts`：About 页面使用的个人资料与外部入口。
- `src/config/friends.ts`：友链数据。
- `src/content.config.ts`：文章 frontmatter 的类型与约束。

页面构图、字体关系和交互节奏属于主题本身，不作为通用配置开放。

## 当前边界

仓库仍处于私有设计阶段，演示图片与音乐沿用旧博客素材。公开主题仓库或正式部署前，需要完成素材授权审计或替换。
