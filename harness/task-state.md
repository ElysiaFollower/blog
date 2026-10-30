# 任务状态快照

分支 `dev-art`，本轮基线 `b33e5dd`。作者认为稍有改善，当前要求 PC 滚动叙事：
文章顺序展开、回廊中心放大/侧面倾角/入场、About 浏览故事、文章/画廊页头与内容衔接。
研究方向的三幅图已否定；先设计，不能再把性能诊断当主任务。其他媒体端仍暂缓。

实现：WritingChapter 的最近三篇纸页；首页改用与文章页相同的 getVisiblePosts（开发草稿
显示规则同步）；回廊错位旋转入场与更强层次；About 方向改纯文字、兴趣全画面收至左右分幅；
文章页移除封面堆叠并连到时间线；GalleryPassage 入场，作品深链跳过入场。
ResearchSketch 已删除。艺术逻辑仍集中在 components/art，滚动未被接管。

当前为待作者评价的 PC 设计稿。已在 Chrome 1440×900 检查主要关键帧、实际滚动与反向恢复，确认作品深链跳过入场并打开查看器。
`pnpm verify` 通过；最后标题排版调整后重跑 check、build、verify:build 通过。现有 hetaAvatar 未使用提示保留。
截图：`/Users/ely/.codex/visualizations/2026/10/30/dev-art-story/`。
开发预览 `http://localhost:4321/`。未推送部署；完整性能、触屏及其他媒体端验收未完成。
