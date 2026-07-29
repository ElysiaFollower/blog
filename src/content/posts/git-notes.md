---
title: "使用 Git 进行代码管理的经验谈"
description: "把提交历史当作可阅读的工程记录，而不只是文件备份。"
pubDate: 2025-08-30
category: "Tools"
tags: ["Git", "Code Management"]
cover: "../../assets/demo/cover-seele.png"
coverAlt: "希儿主题插画"
coverPosition: "50% 45%"
featured: false
---

Git 的价值并不止于“代码可以回退”。好的提交边界能够保留决策过程，使未来的维护者知道系统为什么变成现在的样子。

## 提交首先是一种叙事

一次提交应该表达一个能够独立理解和审查的变化。它不一定很小，但必须有清楚的因果边界。

## 分支不是文件夹

分支描述的是一条历史线。创建分支之前，先理解它需要承载什么协作关系。
