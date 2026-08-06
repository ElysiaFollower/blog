export const contentRootIds = [
  "notes",
  "papers",
  "engineering",
  "problems",
  "reflections",
  "projects",
] as const;

export type ContentRootId = (typeof contentRootIds)[number];

export const contentRoots: Record<
  ContentRootId,
  { label: string; description: string }
> = {
  notes: {
    label: "笔记",
    description: "课程、教材和成体系的知识笔记。",
  },
  papers: {
    label: "论文",
    description: "论文阅读和研究进展。",
  },
  engineering: {
    label: "工程",
    description: "实现、排错和工程经验。",
  },
  problems: {
    label: "题解",
    description: "算法题、复杂度和解题记录。",
  },
  reflections: {
    label: "随想",
    description: "尚未定型的观察、判断与随笔。",
  },
  projects: {
    label: "作品",
    description: "游戏、MMD 与其他个人创作。",
  },
};

export function isContentRoot(value: string): value is ContentRootId {
  return contentRootIds.includes(value as ContentRootId);
}

export function contentRootLabel(root: ContentRootId) {
  return contentRoots[root].label;
}
