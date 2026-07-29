---
title: "为什么长方体上的三个点不能唯一确定一个长方体？"
description: "从自由度、约束和反例出发，重新理解一个看似直观的几何问题。"
pubDate: 2025-09-16
category: "Algorithm"
tags: ["Math", "Linear Algebra", "Course Note"]
cover: "../../assets/demo/cover-geometry.jpeg"
coverAlt: "纵向构图的几何主题插画"
coverPosition: "50% 34%"
featured: false
---

三个点能够确定一个平面，却未必能够唯一确定一个长方体。问题的关键不是点的数量，而是这些点提供了哪些独立约束。

## 先数自由度

尺寸、姿态和位置共同构成长方体的状态。只有约束数量与形式都足够时，解才可能唯一。

## 反例比直觉可靠

固定三个点后，仍然可以构造满足条件但尺度或朝向不同的长方体。这说明问题缺少决定性信息。
