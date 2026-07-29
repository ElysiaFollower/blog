import rss from "@astrojs/rss";
import { siteConfig } from "../config/site";
import { getPublishedPosts } from "../lib/posts";

export async function GET(context: { site?: URL }) {
  const posts = await getPublishedPosts();

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site ?? new URL("https://elysiafollower.github.io"),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/posts/${post.id}/`,
      categories: [...new Set([post.data.category, ...post.data.tags])],
    })),
    customData: "<language>zh-CN</language>",
  });
}
