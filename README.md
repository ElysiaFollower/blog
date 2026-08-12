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

## 分支与部署机制

### 🌿 分支规范
- **`dev` 分支**：日常写作、草稿撰写与功能开发分支。在 `dev` 分支上的 Commit 与 Push 不会触发线上部署，安全无负担。
- **`main` 分支**：正式发布与生产分支。代码合并或推送到 `main` 分支后，会自动触发 GitHub Actions 编译部署。

### 🚀 自动化跨仓库部署
项目采用 **源码与部署分离（Multi-Repo Architecture）**：
- **源码仓库 (`blog`)**：存放 Astro 源码与 MDX 文章，站点根路径保持标准的 `/`（避免子路径 404 困扰，且方便未来无缝绑定自定义独立域名）。
- **部署仓库 (`ElysiaFollower.github.io`)**：托管打包编译后的静态网页。
- `.github/workflows/deploy-pages.yml` 监听到 `main` 分支更新后，自动运行 `pnpm build`；
- 编译产物 `dist/` 会通过 GitHub Action 自动推送并全量覆盖至 `ElysiaFollower/ElysiaFollower.github.io` 的 `main` 分支，直接在顶级域名 `https://elysiafollower.github.io/` 上渲染上线。
- `public/README.md` 会在构建时自动带入产物根目录，确保目标仓库的 `README.md` 不会丢失。
- **权限要求**：需在 `blog` 仓库的 `Settings -> Secrets and variables -> Actions` 中配置名为 `GH_PAT` 的 Personal Access Token。

## 进一步维护

- [`docs/design-brief.md`](docs/design-brief.md)：页面职责与设计边界。
- [`docs/voice.md`](docs/voice.md)：公开文案的语气与禁区。

图片、音乐与文章内容按各自来源和许可使用；主题代码的许可不会自动覆盖这些
内容资产。
