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
    "Usage: pnpm new:post <catalog-path> [cover-path-or-url]",
  );
  process.exit(1);
}

if (args.length > 2 || !catalogPath || coverInput === "") {
  fail("需要文章目录路径，可选填封面路径或 URL。");
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
const postDirectory = path.join(
  root,
  "src",
  "content",
  "posts",
  ...catalogSegments,
);
const entryName = "index.mdx";

let cover;
let localCover;
if (coverInput && /^https?:\/\//i.test(coverInput)) {
  const url = URL.parse(coverInput);
  if (!url) fail("封面 URL 无效。");
  cover = url.href;
} else if (coverInput) {
  const source = path.resolve(coverInput);
  const extension = path.extname(source).toLowerCase();
  if (!supportedCoverExtensions.has(extension)) {
    fail(`不支持封面格式 "${extension || "(无扩展名)"}"。`);
  }

  try {
    const sourceStat = await stat(source);
    if (!sourceStat.isFile()) fail("封面路径不是文件。");
  } catch {
    fail(`找不到封面文件：${source}`);
  }

  const name = `cover${extension}`;
  cover = `./${name}`;
  localCover = { source, name };
}

await mkdir(path.dirname(postDirectory), { recursive: true });
try {
  await mkdir(postDirectory);
} catch (error) {
  if (error?.code === "EEXIST") fail(`文章目录已经存在：${postDirectory}`);
  throw error;
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
updatedDate: auto
tags: []
${cover ? `cover: ${JSON.stringify(cover)}\ncoverAlt: "TODO: 描述封面内容"\n` : ""}draft: true
---

从这里开始写正文。正文不需要重复一级标题。
`;

try {
  if (localCover) {
    await copyFile(localCover.source, path.join(postDirectory, localCover.name));
  }
  await writeFile(path.join(postDirectory, entryName), frontmatter, "utf8");
} catch (error) {
  await rm(postDirectory, { recursive: true, force: true });
  throw error;
}

console.log(`Created src/content/posts/${catalogPath}/${entryName}`);
console.log("Local development will show it as Draft; set draft: false to publish.");
