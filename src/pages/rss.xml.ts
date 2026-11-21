import rss from "@astrojs/rss";
import { siteConfig } from "../config/site";
import { getPostDescription } from "../lib/post-description";
import { getPublishedPosts, isEditorialPost, postHref } from "../lib/posts";

export async function GET(context: { site?: URL }) {
  const posts = (await getPublishedPosts()).filter(isEditorialPost);

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site ?? new URL("https://elysiafollower.github.io"),
    items: posts.map((post) => ({
      title: post.data.title,
      description: getPostDescription(post),
      pubDate: post.data.pubDate,
      link: postHref(post),
      categories: post.data.tags,
    })),
    customData: "<language>zh-CN</language>",
  });
}
