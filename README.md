# 阿巴怪的实验室

个人博客站，基于 [Fuyukawa Kagari](https://github.com/Yuimi-chaya/Yuimi-chaya.github.io) 主题改造而来。

线上地址：<https://am1ya-114514.github.io/>

## 这是什么

一个混合二次元审美与技术开发记录的个人站点：手账风格的首页、笔记存档、课后游戏室、灵感工坊和个人资料页。全部静态输出，构建后不依赖任何运行时服务。

## 两条日常通道

### ① 写笔记：站内写作台 `/admin/`

打开 <https://am1ya-114514.github.io/admin/>，登录后就能在浏览器里新建、编辑、发布 Markdown 文章。点「发布」= 向 `main` 提交一次 commit，GitHub Actions 会自动重新构建并部署，大约 1～2 分钟后线上生效。

第一次使用只需要做一次登录：

1. 点「**使用访问令牌登录**」；
2. 弹窗里有一个去 GitHub 生成 Token 的链接，点开、按提示生成（经典 Token 勾 `repo` 即可；细粒度 Token 的话给这个仓库 `Contents: Read and write`）；
3. 把生成的 Token 粘进弹窗。

Token 只存在你自己浏览器的 localStorage 里，**不会**被写进仓库。换电脑或清空浏览器数据后需要重新粘贴一次。用完记得在 GitHub 的 [Tokens 页面](https://github.com/settings/tokens) 撤销。

写作台本身由 `public/admin/` 提供：`index.html` 是宿主页，`config.yml` 描述「哪些文件能被编辑」，`sveltia-cms.js` 是内置的 [Sveltia CMS](https://sveltiacms.app/)（MIT），`admin-theme.css` 把它的配色与字体调成和主站一致。`/admin/` 已经被排除在站点地图和站内搜索索引之外，并带上 `noindex`。

`admin-theme.css` 的换肤方式是**只覆盖 Sveltia 自己的 `--sui-*` 设计变量**（用 `:root:root` 提高特异性），不去改它的类名，所以升级 CMS 时最不容易崩。想调色就改那个文件——它顶部的注释里写明了每个色值取自主站的哪个变量。改完 `npm run build` 会连样式一起带进 `dist/`。

### ② 换头像：双击 `tools/change-avatar.cmd`

双击后：

1. 弹出系统文件选择框，选一张图；
2. 自动裁成正方形，生成 `profile.webp` 与 `profile.jpg`（默认 1024×1024，自动识别画面主体）；
3. 提交并推送到 GitHub，触发重新部署。

也可以手动跑：

```bash
node tools/change-avatar.mjs                                  # 打开选择框
node tools/change-avatar.mjs --image="D:\图片\头像.png"        # 直接指定
node tools/change-avatar.mjs --position=top --size=800         # 从顶部取景
node tools/change-avatar.mjs --dry-run                         # 只生成，不提交
```

站点引用头像的地方一共 3 处（`src/lib/site.ts`、`src/themes/fuyukawa-kagari/assets.ts`、`src/themes/fuyukawa-kagari/layouts/BaseLayout.astro`），都指向同一个文件名，所以换图不需要改代码。

### ③ 加歌：把音频丢进 `MUSIC/`

首页右下角「阿巴怪电台」的歌单来自仓库根目录的 **`MUSIC/`**：

```
F:\Github\Am1ya-114514.github.io\MUSIC\
```

把 `.mp3`（也支持 `.flac` `.wav` `.ogg` `.m4a`）放进去，再 `npm run build` 就会自动复制到
`public/themes/fuyukawa-kagari/music/` 并重写 `manifest.json`（构建产物，别手改），
push 之后线上生效。

文件名开头的序号同时决定顺序和显示名：`01-最后一页.mp3` → 显示「最后一页」、排第 1。
想自己定顺序或带歌手名，就在 `MUSIC/` 里放一个 `playlist.json`。细节见
[`MUSIC/README.md`](MUSIC/README.md)。

打开任意一页会自动续播；浏览器要求「先有用户操作才出声」，所以第一次访问若被拦下，
播放器会在你**第一次点击 / 滚动 / 按键**时自动开始。右键（手机长按）→「♫ 进站续播」可以关掉。

## 技术栈

| 用途 | 选择 |
| --- | --- |
| 站点框架 | [Astro](https://astro.build/) 7（`output: "static"`） |
| 内容 | Content Collections + Markdown |
| 代码高亮 | astro-expressive-code |
| 图标 | astro-icon（tabler + simple-icons，本地图标包） |
| 全文搜索 | [Pagefind](https://pagefind.app/)（构建后逐页索引，`/admin/` 除外） |
| 站点地图 | @astrojs/sitemap |
| 图像处理 | sharp |
| 写作台 | [Sveltia CMS](https://sveltiacms.app/)（内置在 `public/admin/`） |
| 部署 | GitHub Pages（GitHub Actions） |

## 本地开发

```bash
npm ci          # 安装依赖
npm run dev     # 开发服务器
npm run build   # 完整生产构建
npm run preview # 预览 dist/
npm test        # 运行测试
```

`.npmrc` 指向 `registry.npmmirror.com`，在国内网络下更快。写作台在本地也能打开（<http://localhost:4321/admin/>），`config.yml` 里的仓库地址不会因为本地预览而改变。

## 写一篇笔记

用写作台写（推荐），或者在 `src/content/blog/` 新建 `.md` 文件：

```yaml
---
title: "标题"
slug: "my-first-note"           # 决定网址 /blog/my-first-note/，只能用小写英文、数字、连字符
description: "摘要"
pubDate: 2026-10-12
updatedDate: 2026-10-12          # 可选
cover: "/blog-assets/cover.webp" # 可选
tags: ["Astro", "Frontend"]
category: "tech"                 # tech | anime | life
draft: false                     # 可选，true 时不参与构建
---
```

`category` 只有 `tech`、`anime`、`life` 三个取值，写错会在构建时直接报错。`slug` 只被写作台用来命名文件——路由始终由文件名决定，所以两者要一致（`tests/admin-panel.test.ts` 会检查这一点）。

正文里插图片时，写作台会把文件放进 `public/blog-assets/`，页面上对应 `/blog-assets/`。

## 构建流水线

`npm run build` 依次执行：

1. `generate:assets` — 同步 `MUSIC/`（若存在）生成播放列表清单；
2. `prepare:covers` — 用 sharp 从 `public/blog-covers/` 生成 320/640/960 的 WebP 响应式封面（无封面时安全跳过）；
3. `astro build` — 生成静态页面、站点地图与 Pagefind 索引（逐页喂给 Pagefind，`/admin/` 与静态资源前缀 `/themes/` 都排除在外）；
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
tools/                            # 本地工具（换头像）
MUSIC/                            # 电台歌单源文件（构建时复制进 public/）
public/admin/                     # 站内写作台
public/blog-assets/               # 写作台上传的正文图片
public/themes/fuyukawa-kagari/    # 静态资源：图片、漫画、字体字标、电台音频
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

**仓库内的插画、漫画等第三方美术资源不在上述授权范围内**，详见 [第三方素材与复用边界](THIRD_PARTY_ASSETS.md)。
