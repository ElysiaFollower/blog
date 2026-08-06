# 迁移到 GitHub Pages

正式站点使用 GitHub 用户名仓库
`ElysiaFollower/ElysiaFollower.github.io`。推荐保留该仓库的 Git 历史与
Pages 设置，只替换工作树内容，不提交 `dist/`。

## 1. 验证主题仓库

在 `Homepage/Blog` 中运行：

```bash
pnpm install --frozen-lockfile
pnpm verify
```

`verify` 会依次执行 Astro 检查、生产构建和发布产物验证。迁移前应保证工作树
中的改动已经过人工审核并提交。

## 2. 保留旧站快照

在 `Homepage/ElysiaFollower.github.io` 中同步远端，然后为旧 Hexo 产物建立
只读标签：

```bash
git pull --ff-only
git tag legacy-hexo-2025
git push origin legacy-hexo-2025
```

标签只需创建一次。它保留旧站源码快照，也让主分支可以干净地切换到 Astro。

## 3. 替换仓库内容

从 `Homepage/Blog` 同步可维护源码，同时保留发布仓库自己的 `.git/`：

```bash
rsync -a --delete \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='dist/' \
  --exclude='.astro/' \
  --exclude='harness/' \
  Homepage/Blog/ Homepage/ElysiaFollower.github.io/
```

命令中的两个路径应从 `/Users/ely/workspace/blog/` 执行。`--delete` 会删除旧
Hexo 产物，因此运行前必须确认当前目录和标签已经正确。

同步后在发布仓库重新验证：

```bash
pnpm install --frozen-lockfile
pnpm verify
git status
```

## 4. 启用 Actions 部署

在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中，把 Source
设为 **GitHub Actions**。随后提交并推送：

```bash
git add -A
git commit -m "feat: rebuild blog with Astro"
git push origin main
```

`.github/workflows/deploy-pages.yml` 会检查源码、构建 `dist/`、验证站内链接，
再部署到 GitHub Pages。

## 5. 上线后检查

- 首页、文章、知识目录、相册、About 与友链均可访问。
- `/Academic/` 仍由 Academic 项目仓库的 Pages 站点提供。
- 旧 `/2025/.../`、`/archives/`、`/categories/` 与 `/tags/` 地址会跳转到新页面。
- `rss.xml`、`sitemap-index.xml` 与全文搜索可以访问。
- GitHub Actions 的 `github-pages` environment 显示本次部署成功。

若只修改文章，后续工作流就是编辑 `src/content/posts/`、运行 `pnpm verify`、
提交并推送 `main`。
