# 任务状态快照

- 对应任务：`harness/active-task.md`
- 更新时间：2026-07-31

## 当前状态

博客的视觉方向、内容模型和主要交互已经完成收口。首页、About、友链、相册、
文章时间线、知识目录与阅读页使用同一套视觉语言；10 篇公开文章包含 9 篇旧博客
内容和 1 篇交互式教学文章。

## 已落地的架构

- 文章位于
  `src/content/posts/<root>/<domain...>/<article>/index.mdx`，正文、封面与
  专属素材放在同一个内容包中。
- 六个固定根目录是 `notes`、`papers`、`engineering`、`problems`、
  `reflections`、`projects`；根目录以下可以按知识结构自由嵌套。
- 文章 ID、URL、目录面包屑和本地源文件路径都来自相对目录，没有手工 `slug`。
- `/posts/` 按时间呈现全部公开文章；`/posts/catalog/` 提供目录树、Tags、
  Pagefind 全文搜索及日期/标题排序。
- 全部文章使用 MDX。普通 Markdown、GFM、脚注、Shiki、KaTeX 与文章图片可直接
  使用；特殊内容通过集中注册的组件插入。
- `Stage` 是改变阅读节奏的布局作用域。进入舞台时目录与外侧批注退场，舞台内
  不放边栏 `Sidenote`。
- 相册缩略图由 Astro 生成响应式 WebP，并使用保留原始宽高比的占位图按需加载；
  PhotoSwipe 负责缩放、拖拽、切图与手势。
- 9 篇旧 Hexo 文章已经迁移，12 个旧归档/分类/文章路径通过
  `src/config/legacy-routes.ts` 生成静态重定向页。
- `BaseLayout` 统一生成 canonical、Open Graph、Twitter Card 与文章
  BlogPosting JSON-LD；RSS、robots 和 sitemap 随构建生成。
- `.github/workflows/deploy-pages.yml` 在 `main` 更新后执行检查、构建并部署
  `dist/`。
- `scripts/verify-build.mjs` 在部署前解析生成的 HTML，验证站内资源、锚点、
  canonical、Open Graph、页面标题、图片替代文本及必要发布产物。
- 公开文案按展示页、个人页和功能页分别约束，具体边界记录在
  `docs/voice.md`；写作与迁移流程分别记录在 `docs/writing.md` 和
  `docs/migration.md`。

## 最近验证

- `pnpm verify`：46 个文件无诊断；29 个静态页面和 615 个发布产物通过校验。
- `pnpm build`：Pagefind 索引 10 篇文章、3491 个词、2 类过滤
  字段和 2 个排序字段。
- `pnpm audit --prod`：没有已知漏洞。
- RSS 包含 10 篇文章；站点地图包含 16 个正式页面，不包含兼容重定向页。
- 桌面端、390px 和 320px 窄屏关键路由均无页面级横向溢出。
- 全文搜索、目录范围、Tag、排序和 URL 状态恢复已通过真实浏览器验证。
- 代码复制、脚注往返、主题持久化、开屏最短展示、舞台进出与交互示例均可用。
- 相册首屏不再请求全部 48 张图片；滚动到底后全部加载成功，布局高度保持稳定；
  灯箱缩放、拖拽、切图和键盘关闭均可用。
- 12 个旧 URL 已逐一通过浏览器验证，均跳转到对应新文章或检索页面。
- 首页首屏只请求当前昼夜主题的背景图；另一张背景不会被提前下载。
- README 与 5 份维护文档中的本地链接均可解析。

## 上线边界

- 当前仓库没有配置 Git 远端，尚未执行生产部署。
- `astro.config.mjs` 已按用户名站点
  `https://elysiafollower.github.io` 配置；仓库 Pages Source 需选择
  GitHub Actions。
- Demo 图片、旧文章中的网络图片和 HOYO-MiX 音乐仍需由用户确认公开使用与
  再分发边界。工程检查无法替代素材授权审计。

## 工作树注意事项

- 当前工作树包含本轮主题开发、历史内容迁移、图片格式转换与部署配置的完整
  未提交改动。
- 不要在未审核素材和远端目标前自动提交、推送或公开仓库。
