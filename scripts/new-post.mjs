import { copyFile, mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const [catalogPath, coverInput] = args;
const pathSegmentPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const contentRoots = new Set([
  "notes",
  "papers",
  "engineering",
  "problems",
  "reflections",
  "projects",
]);
const supportedCoverExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

function fail(message) {
  console.error(`Error: ${message}`);
  console.error(
    "Usage: pnpm new:post <catalog-path> <cover-path>",
  );
  process.exit(1);
}

if (args.length !== 2 || !catalogPath || !coverInput) {
  fail("需要文章目录路径和封面路径。");
}

const catalogSegments = catalogPath.split("/");

if (
  catalogSegments.length < 2 ||
  !contentRoots.has(catalogSegments[0]) ||
  catalogSegments.some((segment) => !pathSegmentPattern.test(segment))
) {
  fail(
    "目录必须从固定类别开始，并全部使用小写 kebab-case，例如 notes/ai/reinforcement-learning/grpo。",
  );
}

const root = process.cwd();
const coverSource = path.resolve(coverInput);
const coverExtension = path.extname(coverSource).toLowerCase();
const postDirectory = path.join(
  root,
  "src",
  "content",
  "posts",
  ...catalogSegments,
);
const entryName = "index.mdx";
const coverName = `cover${coverExtension}`;

if (!supportedCoverExtensions.has(coverExtension)) {
  fail(`不支持封面格式 "${coverExtension || "(无扩展名)"}"。`);
}

try {
  const sourceStat = await stat(coverSource);
  if (!sourceStat.isFile()) fail("封面路径不是文件。");
} catch {
  fail(`找不到封面文件：${coverSource}`);
}

try {
  await stat(postDirectory);
  fail(`文章目录已经存在：${postDirectory}`);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const date = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const frontmatter = `---
title: "TODO: 文章标题"
description: "TODO: 用一两句话说明这篇文章解决什么问题。"
pubDate: ${date}
tags: []
cover: "./${coverName}"
coverAlt: "TODO: 描述封面内容"
draft: true
---

从这里开始写正文。正文不需要重复一级标题。
`;

await mkdir(postDirectory, { recursive: true });

try {
  await Promise.all([
    copyFile(coverSource, path.join(postDirectory, coverName)),
    writeFile(path.join(postDirectory, entryName), frontmatter, "utf8"),
  ]);
} catch (error) {
  await rm(postDirectory, { recursive: true, force: true });
  throw error;
}

console.log(`Created src/content/posts/${catalogPath}/${entryName}`);
console.log("Local development will show it as Draft; set draft: false to publish.");
