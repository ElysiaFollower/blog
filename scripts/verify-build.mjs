import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse } from "parse5";

const root = process.cwd();
const dist = path.join(root, "dist");
const siteOrigin = "https://elysiafollower.github.io";
const requiredArtifacts = [
  "index.html",
  "404.html",
  "rss.xml",
  "robots.txt",
  "sitemap-index.xml",
  "pagefind/pagefind.js",
];
const failures = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(absolute) : absolute;
    }),
  );

  return files.flat();
}

function visit(node, callback) {
  callback(node);
  node.childNodes?.forEach((child) => visit(child, callback));
}

function attributes(node) {
  return Object.fromEntries(
    (node.attrs ?? []).map(({ name, value }) => [name, value]),
  );
}

function textContent(node) {
  if (node.nodeName === "#text") return node.value ?? "";
  return (node.childNodes ?? []).map(textContent).join("");
}

function hasAccessibleName(node, attrs) {
  if (attrs["aria-hidden"] === "true") return true;
  if (attrs["aria-label"]?.trim() || attrs.title?.trim()) return true;
  if (textContent(node).trim()) return true;

  let hasNamedImage = false;
  visit(node, (descendant) => {
    if (descendant.tagName !== "img") return;
    const imageAttrs = attributes(descendant);
    if (imageAttrs.alt?.trim()) hasNamedImage = true;
  });

  return hasNamedImage;
}

function routeFromHtml(file) {
  const relative = path.relative(dist, file).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) {
    return `/${relative.slice(0, -"index.html".length)}`;
  }
  return `/${relative}`;
}

function candidateFiles(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\/+/, "");

  if (!relative || decoded.endsWith("/")) {
    return [path.join(dist, relative, "index.html")];
  }

  if (path.extname(relative)) return [path.join(dist, relative)];

  return [
    path.join(dist, relative),
    path.join(dist, `${relative}.html`),
    path.join(dist, relative, "index.html"),
  ];
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function localReference(raw, pageRoute) {
  if (
    !raw ||
    raw.startsWith("data:") ||
    raw.startsWith("mailto:") ||
    raw.startsWith("tel:") ||
    raw.startsWith("javascript:") ||
    raw.startsWith("//") ||
    /^[a-z][a-z\d+.-]*:/i.test(raw)
  ) {
    return undefined;
  }

  return new URL(raw, `${siteOrigin}${pageRoute}`);
}

for (const artifact of requiredArtifacts) {
  if (!(await exists(path.join(dist, artifact)))) {
    failures.push(`缺少发布产物：dist/${artifact}`);
  }
}

const files = await walk(dist);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const documents = new Map();

for (const file of htmlFiles) {
  const route = routeFromHtml(file);
  const source = await readFile(file, "utf8");
  const document = parse(source);
  const ids = new Set();
  const references = [];
  let canonical;
  let isRedirect = false;
  let noIndex = false;
  let language;
  let titleText;
  let description;
  let ogTitle;
  let ogDescription;
  let ogImage;
  let headingCount = 0;
  let mainCount = 0;

  visit(document, (node) => {
    const attrs = attributes(node);
    if (attrs.id) {
      if (ids.has(attrs.id)) {
        failures.push(`${route} 中存在重复 id：${attrs.id}`);
      }
      ids.add(attrs.id);
    }

    if (node.tagName === "html") language = attrs.lang;
    if (node.tagName === "title") titleText = textContent(node).trim();
    if (node.tagName === "h1") headingCount += 1;
    if (node.tagName === "main") mainCount += 1;

    if (node.tagName === "img" && !Object.hasOwn(attrs, "alt")) {
      failures.push(`${route} 中存在缺少 alt 属性的图片`);
    }

    if (
      node.tagName === "button" &&
      !hasAccessibleName(node, attrs)
    ) {
      failures.push(`${route} 中存在没有可访问名称的按钮`);
    }

    if (node.tagName === "a" && !hasAccessibleName(node, attrs)) {
      failures.push(`${route} 中存在没有可访问名称的链接`);
    }

    if (node.tagName === "link" && attrs.rel === "canonical") {
      canonical = attrs.href;
    }

    if (node.tagName === "meta" && attrs.name === "description") {
      description = attrs.content;
    }

    if (node.tagName === "meta" && attrs.property === "og:title") {
      ogTitle = attrs.content;
    }

    if (node.tagName === "meta" && attrs.property === "og:description") {
      ogDescription = attrs.content;
    }

    if (node.tagName === "meta" && attrs.property === "og:image") {
      ogImage = attrs.content;
    }

    if (
      node.tagName === "meta" &&
      attrs["http-equiv"]?.toLowerCase() === "refresh"
    ) {
      isRedirect = true;
    }

    if (
      node.tagName === "meta" &&
      attrs.name === "robots" &&
      attrs.content?.toLowerCase().includes("noindex")
    ) {
      noIndex = true;
    }

    for (const name of ["href", "src", "poster"]) {
      if (attrs[name]) references.push(attrs[name]);
    }

    if (attrs.srcset) {
      references.push(
        ...attrs.srcset
          .split(",")
          .map((candidate) => candidate.trim().split(/\s+/)[0])
          .filter(Boolean),
      );
    }
  });

  documents.set(route, { file, ids, references });

  if (!isRedirect && language !== "zh-CN") {
    failures.push(`${route} 的文档语言不是 zh-CN`);
  }

  if (!isRedirect && !titleText) {
    failures.push(`${route} 缺少页面标题`);
  }

  if (!isRedirect && !description) {
    failures.push(`${route} 缺少 meta description`);
  }

  if (!isRedirect && headingCount !== 1) {
    failures.push(`${route} 应包含一个 h1，当前为 ${headingCount} 个`);
  }

  if (!isRedirect && mainCount !== 1) {
    failures.push(`${route} 应包含一个 main，当前为 ${mainCount} 个`);
  }

  if (!isRedirect && !noIndex && (!ogTitle || !ogDescription || !ogImage)) {
    failures.push(`${route} 的 Open Graph 元数据不完整`);
  }

  if (!canonical && !noIndex) {
    failures.push(`${route} 缺少 canonical URL`);
  } else if (canonical && !isRedirect) {
    const canonicalUrl = new URL(canonical, siteOrigin);
    if (canonicalUrl.origin !== siteOrigin || canonicalUrl.pathname !== route) {
      failures.push(`${route} 的 canonical 指向 ${canonical}`);
    }
  }

  if (!isRedirect && /TODO:|TODO：/.test(source)) {
    failures.push(`${route} 仍包含 TODO 文案`);
  }
}

for (const [route, document] of documents) {
  for (const raw of document.references) {
    const reference = localReference(raw, route);
    if (!reference) continue;

    const targets = candidateFiles(reference.pathname);
    const targetExists = (await Promise.all(targets.map(exists))).some(Boolean);
    if (!targetExists) {
      failures.push(`${route} 引用了不存在的站内资源：${raw}`);
      continue;
    }

    if (reference.hash && reference.pathname.endsWith("/")) {
      const targetRoute = reference.pathname;
      const targetDocument = documents.get(targetRoute);
      const fragment = decodeURIComponent(reference.hash.slice(1));
      if (targetDocument && fragment && !targetDocument.ids.has(fragment)) {
        failures.push(`${route} 引用了不存在的锚点：${raw}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Production verification failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Verified ${htmlFiles.length} HTML pages and ${files.length} build artifacts.`,
);
