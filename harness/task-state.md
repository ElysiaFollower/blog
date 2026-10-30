# 任务状态快照

分支 `dev-art`。作者明确否定 `3c0be70` 的视觉与新滚动驱动；本轮以未提交 revert
撤回该版本，在 `cc39a0b` 的保留项上重新设计。不可将被否定版本的数学测试称为体验改善。
用户的重点仍是视觉编排；性能可以之后做。PC 先行，其他媒体端继续后置。

当前实现：JournalBooks 恢复并重新编排最近三篇书册；AuthorPortrait 删除上轮的新增
措辞和覆盖文字纸条；AboutPortraitStory 用同一幅留驻肖像串起身份与研究，内部画窗
逐渐收拢，固定布局占位不随动画变化。After Hours、画廊开屏与首屏恢复基线。
移除已废弃的 journal-entry 脚本，没有引入新依赖或新生成图。

已在 Chrome 1470×970 检查真实开发预览（包括草稿顺序）与生产稿：书册中文断行、
首页末章、About 起始/研究/衔接，并正反向滚动。画窗变化中章节高度和 sticky 占位保持
固定。`pnpm verify` 通过，仅保留既有 friends 配置未使用导入提示。当前待作者评价 PC 稿。
截图：`/Users/ely/.codex/visualizations/2026/10/30/dev-art-redesign/`。
开发预览 `http://localhost:4321/`，未推送部署。完整性能、触屏和其他媒体端未验收。
