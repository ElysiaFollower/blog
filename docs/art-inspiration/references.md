# 参考网站与证据

整理日期：2026-10-29。用于追溯本轮美术研究，不是待逐项复制的效果清单。
页面职责仍以 [站点设计说明](../design-brief.md) 为准。

“本站作者偏好”来自博客作者浏览后的反馈；“已知实现”来自参考网站的创作者或官方案例；未确认的算法不当作源码事实。
本轮没有完整审计这些站的源码，也没有取得可比较的性能记录。截图是收录时的版本，未必等于当前页面；静帧不能证明动效手感。

2026-10-29 已轻量复核八个主入口以及 Unseen、Samsy 的关键案例来源。Samsy 入口能取得正确标题，但正文依赖 JavaScript；这次链接复核不代表完成了实时画面、交互或所有截图链接的验证。

## 重点参考

### Unseen Studio：入场与空间画廊

- [原站](https://unseen.co/) · [探索空间](https://unseen.co/world/) · [收录截图](https://i0.wp.com/wordpress.org/showcase/files/2023/09/unseen.co_Screenshot-Tool.png?resize=2044%2C1150&ssl=1)
- **本站作者偏好**：特别喜欢进入后的切换、拖拽观看卡片的动效，以及整体设计感。可研究柔光空间、入场衔接和有惯性的内容操纵。
- **证据**：[WordPress 官方介绍](https://wordpress.org/showcase/unseen-studio/)确认柔和色彩、声景、平滑转场及 WordPress 基础；[工作室自述](https://unread.unseen.co/green-chameleon-has-evolved-db2861e11845)说明 Unseen World 承载实验与自由探索。
- **边界**：没有确认入口转场和拖拽画廊的具体算法。相机轨道、DOM/CSS 3D、纹理平面与惯性模型是我们的候选实现，不是原站源码结论。

### Samsy Ninja：城市的光色与空间可信度

- [原站](https://samsy.ninja/) · [作品截图](https://image1.commarts.com/images1/0/0/8/1/1/1180034_102_1160_MjEzMzkzMjM0NjEwMzE0NzI1MDA.jpg) · [图片出处](https://www.commarts.com/project/38349/samsy-ninja)
- **本站作者偏好**：赛博城市带来强烈印象，特别看重色彩、光影以及可多面观察的空间。可研究暗部层次、局部发光、湿街反射和近中远景。
- **已知实现**：[开发者访谈](https://www.commarts.com/webpicks/samsy-ninja)确认 Vue、Three.js/TSL、WebGPU/WebGL 路径、自定义辉光与反射后处理，以及 PartyKit/WebSocket 多人同步。
- **边界**：具体反射算法未公开，不能称为已确认的光追。城市光色、自由漫游、多人在线应分别评估；用户喜欢画面不等于要求后两者。

### Dennis Snellenberg：动态排版与操作手感

- [原站](https://dennissnellenberg.com/) · [收录截图](https://swipefile.design/_astro/full.XDvAZX92.webp) · [截图出处](https://swipefile.design/ref/personal-dennis-snellenberg/)
- **本站作者偏好**：认可动效，但实际访问时感觉卡顿。适合研究大尺度排版、作品入口反馈、按钮与页面转换的协调性。
- **证据**：[作者介绍](https://dennissnellenberg.com/about)明确以微动画、转场与交互为工作重点。截图出处标注于 2026-09-05 抓取。
- **边界**：没有性能记录，卡顿原因未知；不能归因于某个库、服务器或特定效果，也不能把它记为此类设计必然昂贵的证据。

### Lusion：滚动中的事件序列

- [原站](https://lusion.co/) · [收录截图](https://assets.awwwards.com/awards/element/2023/09/6509b2f202796074033359.png) · [截图出处](https://www.awwwards.com/sites/lusion-v3)
- **本站作者偏好**：认为它是给扁平滚动增加表现力的好例子。可研究视觉锚点、场景推进、章节衔接与高潮段落。
- **已知实现**：[工作室访谈](https://www.commarts.com/project/36283/lusion)说明实时 3D、宇航员穿过传送门、点击减速与反向滚动倒放。
- **边界**：借鉴事件与镜头的组织，不要求复制宇航员题材；历史案例不能证明当前所有章节仍采用相同实现。

### Lando Norris：个人母题与电影式滚动

- [原站](https://landonorris.com/) · [收录截图](https://cdn.lapa.ninja/assets/videos-poster/landonorris-poster.jpg) · [截图出处](https://www.lapa.ninja/video/post/landonorris/)
- **本站作者偏好**：与 Lusion 一样，重点在于滚动编排。可研究鲜明个人形象、尺度对比、速度感与一致的视觉母题。
- **已知实现**：[OFF+BRAND 制作案例](https://www.itsoffbrand.com/our-work/lando-norris)确认 WebGL、3D、Rive，以及速度导向动画、锐利转场和电影式滚动。
- **边界**：赛车、头盔和荧光色属于该站身份；本站应寻找自己的母题，不把“有速度感”固定为同一配色或图形。

### Immersive Garden：雕塑式艺术方向

- [原站](https://immersive-g.com/) · [收录截图](https://assets.awwwards.com/awards/element/2024/12/675b6314cb6bf976066794.jpg) · [截图出处](https://www.awwwards.com/sites/immersive-garden-website)
- **本站作者偏好**：喜欢艺术风格。可研究浅浮雕、材质、克制配色、空间留白及展览式构图。
- **证据**：[工作室设计复盘](https://www.awwwards.com/case-study-immersive-gardens-new-website.html)介绍浅浮雕视觉、罗马数字导航和 Backstage 内容组织。
- **边界**：艺术风格与罗马数字界面可以拆开；不要求把本站的文字与角色语境改造成奢侈品牌网站。

## 补充参考

以下两站在本轮反馈中没有被作者特别强调。这表示暂不作为主方向，不表示作者不喜欢，也不是否定其设计价值。

### Of the Oak：围绕一个对象组织内容

- [原站](https://oftheoak.co.uk/) · [创作方界面截图](https://marshmallowlaserfeast.com/app/uploads/2025/04/Screenshot-2025-07-02-at-14.14.56-2048x1047.jpg) · [图片出处](https://marshmallowlaserfeast.com/project/of-the-oak/)
- **借鉴目标**：让树等可探索对象同时承担视觉主体和知识组织功能；适合专题，而非默认替换博客目录。
- **已知实现**：[Lusion 制作介绍](https://lusion.co/projects/of_the_oak/)说明 Houdini 到 WebGL 的树结构与实例化处理。

### Maxime Heckel：把视觉实验写进文章

- [博客](https://blog.maximeheckel.com/) · [Painterly Shaders 文章与视觉示例](https://blog.maximeheckel.com/posts/on-crafting-painterly-shaders/)
- **借鉴目标**：把可调图形实验、效果对比与推导放在同一篇文章里。作为内容表达参考，不当作已经选定的全站画风。
- **证据与截图边界**：原文提供滤镜解释与交互控件。本轮只取得会话内的文章首屏截图，未归档到仓库；这里保留原文作为持久视觉入口，不引用机器专属的会话文件路径。

## 如何继续收录

- 新参考应说明它新增了什么可借鉴的手法；与已有条目重复时，补充原条目即可。
- 更新偏好时记录作者的具体反馈，不把 Agent 的推荐升级为作者已选定的方案。
- 原站改版或失效时保留必要的案例出处并注明状态；无法复核的细节留为未知，不用新猜测填补。
- 收录链接与截图只用于研究，不授予本站使用其图片、模型、音乐、字体或其他素材的权利。
