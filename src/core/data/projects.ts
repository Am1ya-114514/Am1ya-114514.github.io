export const projectTechLines = [
  { key: "genshin", label: "BetterGI", note: "自动化脚本 / 工具链" },
  { key: "javascript", label: "JavaScript", note: "脚本 / 小工具" },
  { key: "astro", label: "Astro", note: "本站 / 静态站点" },
  { key: "css", label: "HTML+CSS", note: "页面 / 动效" },
  { key: "git", label: "Git", note: "版本管理 / 存档" }
] as const;

export const projectEntries = [
  {
    id: "am1ya-blog",
    title: "阿巴怪的实验室",
    type: "Web Lab",
    line: "astro",
    status: "持续追加",
    summary: "你现在看到的这个站点。二次元手账风的外壳，加上樱花、电台、看板娘和一些可爱的小机关。",
    details: ["Astro 静态站", "手账风视觉", "轻交互机关"]
  },
  {
    id: "bettergi-scripts",
    title: "BetterGI 脚本清单",
    type: "Fork / Scripts",
    line: "genshin",
    status: "存档中",
    summary: "上游 BetterGI 的脚本仓库副本。主要用来读脚本、试脚本，把自己常用的自动化整理清楚。",
    details: ["原神自动化", "脚本阅读", "配置整理"]
  },
  {
    id: "better-genshin-impact",
    title: "BetterGI 主仓库",
    type: "Fork / Toolchain",
    line: "genshin",
    status: "跟进上游",
    summary: "跟踪上游的 BetterGI 项目：一个让原神日常更省心的开源工具箱。放在这里方便随时对照源码和版本。",
    details: ["开源工具链", "跟进上游", "源码对照"]
  },
  {
    id: "js-toys",
    title: "JS 小玩具",
    type: "Toy Box",
    line: "javascript",
    status: "计划中",
    summary: "写一些放进博客就能玩的小东西：小计算器、字符小游戏、随手做的小演示，随时想加就加。",
    details: ["原生 JS", "零依赖", "随时可玩"]
  },
  {
    id: "page-motion",
    title: "页面动效练习",
    type: "Front-end Study",
    line: "css",
    status: "计划中",
    summary: "练 CSS 与少量 JS 的动效：樱花、滚动叙事、悬停反应，尽量在低性能设备上也不卡。",
    details: ["CSS 动画", "滚动叙事", "性能优先"]
  },
  {
    id: "dev-notes",
    title: "折腾笔记",
    type: "Notes",
    line: "git",
    status: "计划中",
    summary: "把踩过的坑、用过的命令、想明白的原理记下来，顺便当作这个博客的文章来源。",
    details: ["踩坑记录", "命令备忘", "博客稿源"]
  }
] as const;
