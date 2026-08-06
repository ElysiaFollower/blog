# 文章写作

文章使用 Astro Content Collections 管理。文件系统就是知识目录：你在本地如何
整理文章，网站就如何展示它。

```text
src/content/posts/
├── notes/                       # 系统知识笔记
│   ├── ai/
│   │   └── neural-networks/
│   │       └── backpropagation/
│   │           ├── index.mdx
│   │           ├── cover.png
│   │           └── computation-graph.png
│   └── mathematics/
├── papers/                      # 论文阅读与研究脉络
├── engineering/                 # 工程记录
├── problems/                    # 算法题解
├── reflections/                 # 随想
└── projects/                    # 游戏、MMD 与项目记录
```

最外层六个目录是稳定的内容类型；里面的领域和子领域可以按知识结构自由嵌套。
一篇文章必须使用独立目录和 `index.mdx`，文章专属素材放在同一目录。

文章路径同时决定三个东西：

- 本地位置：`src/content/posts/notes/ai/neural-networks/backpropagation/index.mdx`
- 网站目录：`笔记 / AI / Neural Networks`
- URL：`/posts/notes/ai/neural-networks/backpropagation/`

因此不需要再填写分类或 `slug`。移动目录就是重新分类，也会改变 URL；已经公开
并被外部引用的文章应谨慎移动。确实需要移动时，在
`src/config/legacy-routes.ts` 中保留旧路径到新路径的映射；构建过程会生成
`noindex` 的静态重定向页，并把这些兼容页面排除在站点地图之外。

## 新建文章

准备一张封面后运行：

```bash
pnpm new:post notes/ai/neural-networks/backpropagation ~/Desktop/cover.png
```

路径必须从六个固定根目录之一开始，每一段使用小写 kebab-case。脚手架会创建
目录、复制封面，并生成默认处于草稿状态的正文。

本地开发会显示 Draft 标记；生产构建、RSS 和站点地图不包含草稿。写完后把
`draft` 改为 `false` 即可发布。

## Frontmatter

```yaml
---
title: "反向传播：从计算图到梯度"
description: "从局部导数和链式法则出发，理解反向传播如何复用中间结果。"
pubDate: 2026-07-30
updatedDate: 2026-08-02
tags: ["Deep Learning", "Autograd", "Optimization"]
cover: "./cover.png"
coverAlt: "计算图中沿边反向传播的梯度"
coverPosition: "50% 38%"
draft: true
---
```

作者通常只需要填写标题、摘要、发布日期、Tags、封面及替代文本。

- `tags`：跨目录关系，例如 `GRPO`、`Information Theory`、`AIGC`。同一篇文章
  可以有多个 Tag。
- `updatedDate`：内容有实质修改时记录；可以省略。
- `coverPosition`：封面裁切焦点；默认 `50% 50%`。
- `draft`：是否为草稿；默认 `false`，脚手架生成时设为 `true`。

没有 `aliases`、手工排序或系列序号。需要被搜索到的术语自然写进标题、摘要、
小节、正文或 Tags；日期和标题排序由文章页上的控件完成。

## 正文格式

所有文章统一使用 `index.mdx`。MDX 兼容普通 Markdown，不使用特殊组件时就按
Markdown 写：

- 标题、列表、引用、链接、图片与代码块
- GFM 表格、任务列表、删除线、自动链接与脚注
- Shiki 代码高亮
- KaTeX 行内公式 `$E = mc^2$` 与块级公式 `$$...$$`

文章图片使用相对路径，Astro 会在构建时校验并优化：

```markdown
![计算图](./computation-graph.png)
```

需要旁注、提示框、视频或交互解释器时，直接在同一个文件中插入已注册组件，
不需要更换文件格式：

```mdx
import diagram from "./computation-graph.png";

<Callout title="边界">
  这里放需要强调的内容。
</Callout>

<Sidenote label="设计动机">
  这里放不会打断正文的补充说明。
</Sidenote>

<Figure
  src={diagram}
  alt="反向传播计算图"
  caption="梯度沿计算图反向累积。"
/>

<Video
  src="/media/backpropagation.webm"
  title="反向传播过程"
  caption="视频默认只预载元数据。"
/>

<BackpropExplorer preset="xor" />
```

大型图示或需要改变阅读节奏的内容使用 `Stage`：

```mdx
<Stage>
  这一段进入舞台时，左右目录与批注会退场。

  <BackpropExplorer preset="xor" />
</Stage>
```

舞台可以包含正文、图片、视频和交互组件。普通文字仍保持舒适行宽，媒体和交互
工具可以使用完整三栏宽度。舞台内部不使用 `Sidenote`；补充说明改用正文、图注
或 `Callout`。完整组件接口与性能边界见
[`interactive-articles.md`](interactive-articles.md)。

`Figure` 使用 Astro 图片优化，因此本地图片需要先导入。普通 Markdown 图片仍
直接写相对路径。视频可以放在 `public/media/` 后使用站点绝对路径；文章内视频
则使用 `import clip from "./clip.webm?url"`。

## 整理与找回

`/posts/` 按发布时间从新到旧展示全部公开文章。
`/posts/catalog/` 是知识检索工作台，提供三种互补入口：

1. **目录**：大概知道文章在哪时，沿文件树逐层展开。文章列表和阅读页都会显示
   对应的本地源文件路径。
2. **Tags**：从跨领域概念进入，例如同时找出笔记、论文和工程记录中的
   `Reinforcement Learning`。
3. **搜索**：搜索标题、摘要、正文和小节；可以与当前目录或 Tag 范围组合使用。

文章列表可以按发布日期或标题排序。排序只改变当前视图，不要求作者维护顺序。
全文搜索使用构建期静态索引，不需要服务器或数据库；开发服务器不生成索引，
验证真实搜索行为时运行：

```bash
pnpm build
pnpm preview
```

## 检查与发布

```bash
pnpm verify
```

`pnpm verify` 检查 frontmatter、目录约束、MDX 与组件用法，生成生产路由、
图片、公式和全文搜索索引，并验证站内链接、资源、canonical、RSS、sitemap
与旧地址跳转。仓库启用 GitHub Pages 的 Actions Source 后，推送 `main`
就会触发 `.github/workflows/deploy-pages.yml`。

首次替换旧发布仓库时，按 [`migration.md`](migration.md) 操作。
