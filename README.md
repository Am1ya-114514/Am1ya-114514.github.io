# 阿巴怪的实验室

个人博客站，基于 [Fuyukawa Kagari](https://github.com/Yuimi-chaya/Yuimi-chaya.github.io) 主题改造而来。

线上地址：<https://am1ya-114514.github.io/>

## 这是什么

一个混合二次元审美与技术开发记录的个人站点：手账风格的首页、笔记存档、课后游戏室、灵感工坊和个人资料页。全部静态输出，构建后不依赖任何运行时服务。

## 技术栈

| 用途 | 选择 |
| --- | --- |
| 站点框架 | [Astro](https://astro.build/) 7（`output: "static"`） |
| 内容 | Content Collections + Markdown |
| 代码高亮 | astro-expressive-code |
| 图标 | astro-icon（tabler + simple-icons，本地图标包） |
| 全文搜索 | [Pagefind](https://pagefind.app/)（构建后索引 `dist/**/*.html`） |
| 站点地图 | @astrojs/sitemap |
| 图像处理 | sharp |
| 部署 | GitHub Pages（GitHub Actions） |

## 本地开发

```bash
npm ci          # 安装依赖
npm run dev     # 开发服务器
npm run build   # 完整生产构建
npm run preview # 预览 dist/
npm test        # 运行测试
```

`.npmrc` 指向 `registry.npmmirror.com`，在国内网络下更快。

## 写一篇笔记

在 `src/content/blog/` 新建 `.md` 文件：

```yaml
---
title: "标题"
description: "摘要"
pubDate: 2026-10-12
updatedDate: 2026-10-12        # 可选
cover: "/blog-covers/cover-01.webp"  # 可选
tags: ["Astro", "Frontend"]
category: "tech"               # tech | anime | life
draft: false                   # 可选，true 时不参与构建
---
```

`category` 只有 `tech`、`anime`、`life` 三个取值，写错会在构建时直接报错。

## 构建流水线

`npm run build` 依次执行：

1. `generate:assets` — 同步 `MUSIC/`（若存在）生成播放列表清单；
2. `prepare:covers` — 用 sharp 从 `public/blog-covers/` 生成 320/640/960 的 WebP 响应式封面（无封面时安全跳过）；
3. `astro build` — 生成静态页面、站点地图与 Pagefind 索引；
4. `prune:media` — 按 `scripts/lib/media-publish-policy.mjs` 的排除清单清理 `dist`；
5. `check:modules` — 用 `node:vm` 校验产物 JS 的静态导入可解析；
6. `check:performance` — 校验各页面 HTML/样式体积、脚本总量与单块上限，并检查首页手写字标的 `viewBox` 宽高比与 CSS 一致。

## 目录结构

```
src/
├── content/blog/                 # 笔记（Markdown）
├── core/                         # 跨主题共享：站点信息、数据、SEO、内容读取
├── lib/site.ts                   # 站点名、导航、站点地图等全局配置
├── pages/                        # 路由薄壳，转发到主题页面
└── themes/fuyukawa-kagari/       # 主题实现（页面、布局、组件、样式、脚本）
scripts/                          # 构建期脚本
tests/                            # node:test 测试
public/themes/fuyukawa-kagari/    # 静态资源：图片、Live2D、漫画、字体字标
```

`src/core/themes/registry.ts` 只声明一套主题，且不带 `routePrefix`，因此主题直接挂在站点根路径——没有 `/themes/...` 形式的子路径。

## 手写标题字标

首页的 `Am1ya Lab` 是现场生成的 SVG 字标，由 `src/themes/fuyukawa-kagari/tools/prepare-title-lettering.py` 从 `C:\Windows\Fonts\segoeprb.ttf` 烘焙：

```bash
python -m pip install --target <dir> fonttools
PYTHONPATH=<dir> python src/themes/fuyukawa-kagari/tools/prepare-title-lettering.py --force
```

脚本用 `fontTools` 取每个字形的轮廓作为描边笔迹，并按墨迹包围盒计算 `viewBox`，因此改 `TITLE` 常量即可换成任意文案。改完之后要同步 `src/themes/fuyukawa-kagari/styles/refresh.css` 里 `.hero h1` 的 `aspect-ratio`，`npm run check:performance` 会校验两者一致。

## 授权

代码与样式依 [MIT 许可证](LICENSE) 授权。文章内容依 [CC BY-NC-SA 4.0](CONTENT_LICENSE.md) 授权。

**仓库内的插画、漫画、Live2D 模型等第三方美术资源不在上述授权范围内**，详见 [第三方素材与复用边界](THIRD_PARTY_ASSETS.md)。
