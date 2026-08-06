# 17号的航行日志

ElysiaFollower 的个人博客，也是一个强主见的 Astro 博客主题。

站点遵循以下设计原则：

- 展示页面具有明确的个人表达和经过设计的交互。
- 阅读与其他功能页面保持安静、清晰、快速。
- 能自然解耦的内容与站点信息使用配置表达。
- 构图、节奏和气质等独特设计保持强主见，不为通用性牺牲协调性。

## 本地开发

需要 Node.js 22.12 或更高版本，以及 pnpm 9。

```bash
pnpm install
pnpm dev
```

提交前运行完整验证：

```bash
pnpm verify
```

该命令依次执行 Astro 检查、生产构建和发布产物验证。构建结果位于 `dist/`，
不进入版本控制。

## 内容与路由

每篇文章是 `src/content/posts/` 下的独立目录，正文、封面与文章专属图片放在一起：

```text
src/content/posts/
└── notes/
    └── ai/
        └── neural-networks/
            └── backpropagation/
                ├── index.mdx
                ├── cover.png
                └── figure.png
```

目录结构就是网站的知识目录和文章 URL，不再额外维护分类或
`slug`。使用 `pnpm new:post <catalog-path> <cover-path>` 新建文章。所有正文
统一使用 `index.mdx`：平时直接写普通 Markdown，需要旁注、视频或交互解释器
时再插入已注册组件。`/posts/` 按时间展示全部公开文章，
`/posts/catalog/` 统一承载目录树、Tags、全文搜索与排序；RSS 与同目录导航也
由构建过程生成。已经公开过的旧地址集中记录在
`src/config/legacy-routes.ts`，构建时生成静态重定向页。

完整写作约定、frontmatter 字段与语法示例见 [`docs/writing.md`](docs/writing.md)。
交互组件见 [`docs/interactive-articles.md`](docs/interactive-articles.md)。

## 配置边界

- `src/config/site.ts`：站点名称、描述、导航与引语。
- `src/config/profile.ts`：About 页面使用的个人资料与外部入口。
- `src/config/friends.ts`：友链数据。
- `src/config/gallery.ts`：相册图片、替代文本与展示顺序。
- `src/config/content.ts`：文章目录的固定根节点及显示名称。
- `src/content.config.ts`：文章 frontmatter 的类型与约束。

页面构图、字体关系和交互节奏属于主题本身，不作为通用配置开放。

## 部署

`.github/workflows/deploy-pages.yml` 会在 `main` 分支更新后安装依赖、执行检查
与生产构建、验证发布产物，并把 `dist/` 部署到 GitHub Pages。仓库的 Pages
Source 需要选择 **GitHub Actions**。

`astro.config.mjs` 当前以 `https://elysiafollower.github.io` 为正式站点地址。
若把主题部署到其他账号或项目仓库，需要同时调整 `site`，项目站点还需要设置
对应的 `base`。

替换旧发布仓库的完整步骤见 [`docs/migration.md`](docs/migration.md)。

## 进一步维护

- [`docs/design-brief.md`](docs/design-brief.md)：页面职责与设计边界。
- [`docs/voice.md`](docs/voice.md)：公开文案的语气与禁区。

图片、音乐与文章内容按各自来源和许可使用；主题代码的许可不会自动覆盖这些
内容资产。
