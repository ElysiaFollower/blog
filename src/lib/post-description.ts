import { createProcessor } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { PublishedPost } from "./posts";

const parser = createProcessor({ remarkPlugins: [remarkGfm, remarkMath] });
const excerptLength = 150;
const proseContainers = new Set(["root", "blockquote", "list", "listItem", "mdxJsxFlowElement"]);

interface ExcerptNode {
  type: string;
  value?: string;
  children?: ExcerptNode[];
}

function inlineText(node: ExcerptNode): string {
  if (node.type === "text" || node.type === "inlineCode") return node.value ?? "";
  if (node.type === "break") return " ";
  return node.children?.map(inlineText).join("") ?? "";
}

function firstParagraph(node: ExcerptNode): string | undefined {
  if (node.type === "paragraph") {
    return inlineText(node).replace(/\s+/g, " ").trim() || undefined;
  }
  if (!proseContainers.has(node.type)) return;
  for (const child of node.children ?? []) {
    const paragraph = firstParagraph(child);
    if (paragraph) return paragraph;
  }
}

export function getPostDescription({ data, body }: PublishedPost): string {
  if (data.description?.trim()) return data.description;
  const paragraph = body && firstParagraph(parser.parse(body));
  if (!paragraph) return data.title;

  const characters = Array.from(paragraph);
  return characters.length > excerptLength
    ? `${characters.slice(0, excerptLength - 1).join("").trimEnd()}…`
    : paragraph;
}
