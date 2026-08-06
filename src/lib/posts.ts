import { getCollection, type CollectionEntry } from "astro:content";
import {
  contentRootIds,
  contentRootLabel,
  type ContentRootId,
} from "../config/content";

export type PublishedPost = CollectionEntry<"posts">;
export type PostSort =
  | "date-desc"
  | "date-asc"
  | "title-asc"
  | "title-desc";

export interface CatalogBreadcrumb {
  label: string;
  path: string;
}

export interface CatalogNode {
  type: "directory" | "article";
  segment: string;
  label: string;
  path: string;
  count: number;
  children: CatalogNode[];
  post?: PublishedPost;
}

export interface TagEntry {
  name: string;
  count: number;
  posts: PublishedPost[];
}

const catalogCollator = new Intl.Collator("zh-CN", {
  numeric: true,
  sensitivity: "base",
});

const acronymLabels = new Map([
  ["ai", "AI"],
  ["aigc", "AIGC"],
  ["api", "API"],
  ["git", "Git"],
  ["grpo", "GRPO"],
  ["jpeg", "JPEG"],
  ["llm", "LLM"],
  ["mmd", "MMD"],
  ["nlp", "NLP"],
  ["png", "PNG"],
  ["rl", "RL"],
  ["ue", "UE"],
]);

export function formatCatalogSegment(segment: string) {
  return segment
    .split("-")
    .map((part) => {
      const acronym = acronymLabels.get(part);
      if (acronym) return acronym;
      return part ? `${part[0].toLocaleUpperCase("en-US")}${part.slice(1)}` : "";
    })
    .join(" ");
}

export function sortPosts(posts: PublishedPost[], sort: PostSort) {
  return [...posts].sort((a, b) => {
    if (sort === "date-desc") {
      return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
    }

    if (sort === "date-asc") {
      return a.data.pubDate.valueOf() - b.data.pubDate.valueOf();
    }

    const comparison = catalogCollator.compare(a.data.title, b.data.title);
    return sort === "title-desc" ? -comparison : comparison;
  });
}

export async function getPublishedPosts() {
  return sortPosts(
    await getCollection("posts", ({ data }) => !data.draft),
    "date-desc",
  );
}

export async function getVisiblePosts() {
  return sortPosts(
    await getCollection(
      "posts",
      ({ data }) => import.meta.env.DEV || !data.draft,
    ),
    "date-desc",
  );
}

function encodeCatalogPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function postHref(post: PublishedPost | string) {
  const id = typeof post === "string" ? post : post.id;
  return `/posts/${encodeCatalogPath(id)}/`;
}

export function catalogHref(path = "") {
  return path
    ? `/posts/catalog/?path=${encodeURIComponent(path)}`
    : "/posts/catalog/";
}

export function tagHref(tag: string) {
  return `/posts/catalog/?tag=${encodeURIComponent(tag)}`;
}

export function getCatalogSegments(post: PublishedPost | string) {
  const id = typeof post === "string" ? post : post.id;
  return id.split("/");
}

export function getContentRoot(post: PublishedPost | string) {
  return getCatalogSegments(post)[0] as ContentRootId;
}

export function getParentCatalogPath(post: PublishedPost | string) {
  return getCatalogSegments(post).slice(0, -1).join("/");
}

export function getCatalogAncestors(post: PublishedPost | string) {
  const segments = getCatalogSegments(post).slice(0, -1);
  return segments.map((_, index) => segments.slice(0, index + 1).join("/"));
}

export function getCatalogBreadcrumbs(
  post: PublishedPost,
  includeArticle = true,
): CatalogBreadcrumb[] {
  const segments = getCatalogSegments(post);
  const finalIndex = includeArticle ? segments.length : segments.length - 1;

  return segments.slice(0, finalIndex).map((segment, index) => ({
    label:
      index === 0
        ? contentRootLabel(segment as ContentRootId)
        : index === segments.length - 1
          ? post.data.title
          : formatCatalogSegment(segment),
    path: segments.slice(0, index + 1).join("/"),
  }));
}

export function getSourcePath(post: PublishedPost) {
  return `src/content/posts/${post.id}/index.mdx`;
}

export function buildCatalogTree(posts: PublishedPost[]): CatalogNode[] {
  const roots = contentRootIds.map<CatalogNode>((root) => ({
    type: "directory",
    segment: root,
    label: contentRootLabel(root),
    path: root,
    count: 0,
    children: [],
  }));
  const rootMap = new Map(roots.map((root) => [root.segment, root]));

  posts.forEach((post) => {
    const segments = getCatalogSegments(post);
    let directory = rootMap.get(segments[0]);
    if (!directory) return;

    directory.count += 1;

    segments.slice(1, -1).forEach((segment, index) => {
      const path = segments.slice(0, index + 2).join("/");
      let child = directory?.children.find(
        (candidate) =>
          candidate.type === "directory" && candidate.segment === segment,
      );

      if (!child) {
        child = {
          type: "directory",
          segment,
          label: formatCatalogSegment(segment),
          path,
          count: 0,
          children: [],
        };
        directory?.children.push(child);
      }

      child.count += 1;
      directory = child;
    });

    directory.children.push({
      type: "article",
      segment: segments.at(-1) ?? post.id,
      label: post.data.title,
      path: post.id,
      count: 1,
      children: [],
      post,
    });
  });

  const sortChildren = (node: CatalogNode) => {
    node.children.sort(
      (a, b) =>
        Number(a.type === "article") - Number(b.type === "article") ||
        catalogCollator.compare(a.label, b.label),
    );
    node.children.forEach(sortChildren);
  };

  roots.forEach(sortChildren);
  return roots;
}

export function getTagEntries(posts: PublishedPost[]): TagEntry[] {
  const tags = new Map<string, TagEntry>();

  posts.forEach((post) => {
    post.data.tags.forEach((name) => {
      const key = name.normalize("NFKC").toLocaleLowerCase("en-US");
      const existing = tags.get(key);

      if (existing) {
        existing.count += 1;
        existing.posts.push(post);
      } else {
        tags.set(key, { name, count: 1, posts: [post] });
      }
    });
  });

  return [...tags.values()].sort(
    (a, b) =>
      b.count - a.count || catalogCollator.compare(a.name, b.name),
  );
}

export function estimateReadingMinutes(post: PublishedPost) {
  const body = (post.body ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/<[^>]+>/g, " ");
  const cjkCharacters = body.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const latinWords =
    body
      .replace(/[\u3400-\u9fff]/g, " ")
      .match(/[\p{Letter}\p{Number}]+/gu)?.length ?? 0;

  return Math.max(1, Math.ceil(cjkCharacters / 300 + latinWords / 220));
}
