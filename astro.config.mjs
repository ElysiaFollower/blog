// @ts-check
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { legacyRoutes } from "./src/config/legacy-routes";
import { rehypeContentImages } from "./src/lib/rehype-content-images.mjs";
import { remarkReferenceLabels, rehypeReferences } from "./src/lib/markdown-references.mjs";

const legacyPathnames = new Set(
  legacyRoutes.map(({ source }) => `/${source}/`),
);

export default defineConfig({
  site: "https://elysiafollower.github.io",
  output: "static",
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !legacyPathnames.has(decodeURIComponent(new URL(page).pathname)),
    }),
  ],
  markdown: {
    processor: unified({
      smartypants: { ellipses: false },
      remarkPlugins: [remarkMath, remarkReferenceLabels],
      rehypePlugins: [
        [rehypeKatex, { strict: "warn" }],
        rehypeContentImages,
        rehypeReferences,
      ],
      remarkRehype: {
        footnoteLabel: "References",
        footnoteBackLabel: "返回正文",
      },
    }),
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      wrap: true,
    },
  },
});
