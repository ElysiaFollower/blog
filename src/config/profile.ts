export const profileConfig = {
  handle: "ElysiaFollower",
  alias: "prometheus",
  education: "Zhejiang University · CS '27",
  nextStage: "Incoming PhD · Audio & Speech",
  introduction:
    "目前主要研究音频对话系统，也持续关注生成媒体与情绪感知 AI。",
  research: [
    {
      index: "01",
      title: "Audio Dialogue Systems",
      description:
        "我关心语音里的语义、节奏与情绪，以及对话如何在多轮交互中保持连贯。",
    },
    {
      index: "02",
      title: "Generative Media",
      description:
        "图像、视频与音频生成都很吸引我，尤其关心模型如何进入真实的创作流程。",
    },
    {
      index: "03",
      title: "Emotionally Aware AI",
      description:
        "希望模型不只识别一时的情绪，也能在长期交互中理解语境与关系。",
    },
  ],
  curiosities: [
    {
      title: "Image Generation",
      note: "生成模型、可控生成，以及它们在视觉创作中的用法",
    },
    {
      title: "Reinforcement Learning",
      note: "机器人训练、策略优化与奖励设计",
    },
    {
      title: "Robotics",
      note: "智能体如何感知真实环境，并在其中行动",
    },
    {
      title: "Natural Language Processing",
      note: "语言模型与语言智能的基础方法",
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
