import { getCollection, type CollectionEntry } from "astro:content";

export type PublishedPost = CollectionEntry<"posts">;
export type TaxonomyKind = "categories" | "tags";

export interface TaxonomyEntry {
  name: string;
  slug: string;
  posts: PublishedPost[];
}

const taxonomyCollator = new Intl.Collator("zh-CN", {
  numeric: true,
  sensitivity: "base",
});

export async function getPublishedPosts() {
  return (await getCollection("posts", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

export function taxonomySlug(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/['’]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function taxonomyHref(kind: TaxonomyKind, value: string) {
  return `/${kind}/${taxonomySlug(value)}/`;
}

export function getTaxonomy(
  posts: PublishedPost[],
  kind: TaxonomyKind,
): TaxonomyEntry[] {
  const entries = new Map<string, TaxonomyEntry>();

  posts.forEach((post) => {
    const values =
      kind === "categories" ? [post.data.category] : post.data.tags;

    values.forEach((name) => {
      const slug = taxonomySlug(name);
      const existing = entries.get(slug);

      if (existing) {
        existing.posts.push(post);
        return;
      }

      entries.set(slug, { name, slug, posts: [post] });
    });
  });

  return [...entries.values()].sort(
    (a, b) =>
      b.posts.length - a.posts.length ||
      taxonomyCollator.compare(a.name, b.name),
  );
}

export function groupPostsByYear(posts: PublishedPost[]) {
  const groups = new Map<number, PublishedPost[]>();

  posts.forEach((post) => {
    const year = post.data.pubDate.getFullYear();
    const group = groups.get(year);

    if (group) {
      group.push(post);
    } else {
      groups.set(year, [post]);
    }
  });

  return [...groups.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, yearPosts]) => ({ year, posts: yearPosts }));
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
