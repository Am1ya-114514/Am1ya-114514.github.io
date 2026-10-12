export const profileIdentity = {
  displayName: "阿巴怪",
  handle: "Am1ya-114514",
  siteName: "阿巴怪的实验室",
  bio: "山有木兮木有枝，心悦君兮君不知。",
  github: "https://github.com/Am1ya-114514",
  bilibili: "https://space.bilibili.com/1136721542"
} as const;

export const profileStatus = [
  "在折腾 BetterGI 脚本与自动化",
  "慢慢把这个博客当成自己的小房间",
  "猫娘浓度持续超标"
] as const;

export const profileTech = [
  { key: "genshin", name: "BetterGI / 原神", note: "自动化脚本与工具链折腾" },
  { key: "javascript", name: "JavaScript", note: "脚本、小工具与页面机关" },
  { key: "astro", name: "Astro", note: "这间实验室本身" },
  { key: "css", name: "HTML / CSS", note: "手写页面与动效" },
  { key: "git", name: "Git / GitHub", note: "版本管理与折腾存档" }
] as const;

/**
 * 「喜欢看的番剧」货架。留空时关于页会自动收起这一栏。
 * 想加回来时，把主题自带封面按 id 填进来即可（封面在
 * public/themes/fuyukawa-kagari/assets/about/<key>.webp），例如：
 * { key: "engage-kiss", title: "契约之吻", subtitle: "Engage Kiss" }
 */
export const animeFavorites: readonly { key: string; title: string; subtitle: string }[] = [];

export const xpFavorites = [
  { key: "catgirl", title: "猫娘", subtitle: "catgirl signal" },
  { key: "pink-hair", title: "粉毛", subtitle: "pink hair bias" },
  { key: "yandere", title: "病娇", subtitle: "sweet danger" },
  { key: "heavy-love", title: "重女", subtitle: "heavy love" }
] as const;

/**
 * 「喜欢的游戏」货架。同样留空即自动收起。
 */
export const favoriteGames: readonly { key: string; title: string; subtitle: string }[] = [];

export const currentSignals = [
  { label: "正在折腾", text: "BetterGI 相关的脚本与自动化，把重复劳动交给机器。" },
  { label: "慢慢在做", text: "这间「实验室」——把它从模板改造成真正属于我的小房间。" },
  { label: "今日电波", text: "技术可以严谨一点，呈现方式可以更像玩具一点。" }
] as const;
