export const profileConfig = {
  handle: "ElysiaFollower",
  alias: "prometheus",
  education: "Zhejiang University · CS '27",
  nextStage: "Incoming PhD · Audio & Speech",
  introduction:
    "从音频对话出发，探索生成媒体与能够感知情绪的 AI。其余时间，我会顺着任何有趣的问题继续往下挖。",
  research: [
    {
      index: "01",
      title: "Audio Dialogue Systems",
      description:
        "把语音视为承载节奏、情绪与关系的交互媒介，而不只是转写成文字之前的输入格式。",
    },
    {
      index: "02",
      title: "Generative Media",
      description:
        "关注图像、视频、音频等生成系统，也关心它们如何真正进入人的创作流程。",
    },
    {
      index: "03",
      title: "Emotionally Aware AI",
      description:
        "希望 AI 能理解人的状态与互动上下文，并选择更合适、更连续的回应方式。",
    },
  ],
  curiosities: [
    {
      title: "Image Generation",
      note: "从模型能力到创作工作流",
    },
    {
      title: "Reinforcement Learning",
      note: "策略、反馈与偶然出现的强结果",
    },
    {
      title: "Robotics",
      note: "让学习系统真正进入物理世界",
    },
    {
      title: "Natural Language Processing",
      note: "语言、推理与人机协作",
    },
  ],
  play: [
    "Game prototypes",
    "Computer graphics",
    "MMD",
    "Anime & Honkai",
  ],
  links: {
    github: "https://github.com/ElysiaFollower",
    academic: "https://elysiafollower.github.io/Academic/",
    email: "prometheus0017#qq.com",
  },
} as const;

export type ProfileConfig = typeof profileConfig;
