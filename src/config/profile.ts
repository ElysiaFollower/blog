//About页面配置， 具体文件见 src/pages/about/index.astro
export const profileConfig = {
  handle: "ElysiaFollower",
  alias: "prometheus0017",
  education: "Zhejiang University · CS '27",
  nextStage: "Incoming PhD · Audio & Speech",
  introduction:
    "目前主要研究语音对话模型，同时也对各种有趣的新技术充满好奇，略有涉猎",
  research: [
    {
      index: "01",
      title: "Full-Duplex Speech Systems",
      description:
        "关注全双工语音交互，希望模型能像人类交流一样，在听与说的同时实现自然的打断与连续对答。",
    },
    {
      index: "02",
      title: "Emotionally Aware AI",
      description:
        "希望模型不仅能听懂话语里的语义，也能感知那些未说出口的情绪。在长久的陪伴与交流中，给予真诚的理解与共鸣。",
    },
    {
      index: "03",
      title: "Audio & Music Generation",
      description:
        "对音频与音乐生成充满兴趣，关注生成模型如何捕捉旋律与氛围，为多媒体创作带来更多可能。",
    },
  ],
  curiosities: [
    "Multimedia Generation",
    "Natural Language Processing",
    "Reinforcement Learning",
    "Robotics",
    "Computer Graphics",
    "Game Development",
    "MMD Animation",
    "Anime & Honkai Universe",
  ],
  links: {
    github: "https://github.com/ElysiaFollower",
    academic: "https://elysiafollower.github.io/Academic/",
    bilibili: "https://space.bilibili.com/86672293",
    email: "prometheus0017@qq.com",
  },
} as const;

export type ProfileConfig = typeof profileConfig;
