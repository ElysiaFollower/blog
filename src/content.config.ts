import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { isContentRoot } from "./config/content";

const pathSegmentPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const posts = defineCollection({
  loader: glob({
    base: "./src/content/posts",
    pattern: "**/index.mdx",
    generateId: ({ entry }) => {
      const normalizedEntry = entry.replaceAll("\\", "/");

      if (!normalizedEntry.endsWith("/index.mdx")) {
        throw new Error(
          `Post "${entry}" must use the directory format <catalog-path>/<article>/index.mdx.`,
        );
      }

      const id = normalizedEntry.slice(0, -"/index.mdx".length);
      const segments = id.split("/");
      const [root] = segments;

      if (!root || !isContentRoot(root)) {
        throw new Error(
          `Post "${entry}" must live under one of the configured content roots.`,
        );
      }

      if (
        segments.length < 2 ||
        segments.some((segment) => !pathSegmentPattern.test(segment))
      ) {
        throw new Error(
          `Post "${entry}" must use lowercase kebab-case directory names and include an article directory.`,
        );
      }

      return id;
    },
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.union([z.literal("auto"), z.coerce.date()]).optional(),
        tags: z.array(z.string()).default([]),
        cover: z.union([
          z.url({ protocol: /^https?$/ }),
          z.preprocess((source, context) => {
            if (
              typeof source === "string" &&
              /^(?:[a-z][a-z\d+.-]*:|[/\\]{2})/i.test(source.trim())
            ) {
              context.addIssue({
                code: "custom",
                message: "Cover must be a local image path or an HTTP(S) URL.",
              });
              return z.NEVER;
            }
            return source;
          }, image()),
        ]).optional(),
        coverAlt: z.string().optional(),
        coverPosition: z.string().default("50% 50%"),
        draft: z.boolean().default(false),
      }),
});

export const collections = { posts };
