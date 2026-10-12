import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import expressiveCode from "astro-expressive-code";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExpressiveCode from "rehype-expressive-code";
import * as pagefind from "pagefind";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The writing desk lives at /admin/ and must never show up in site search.
const pagefindExcludedPaths = ["admin/"];

const expressiveCodeOptions = {
  themes: ["github-dark"],
  defaultProps: {
    wrap: true,
    overridesByLang: {
      "bash,sh,zsh,powershell,ps1,bat,cmd": {
        frame: "terminal"
      }
    }
  },
  frames: {
    showCopyToClipboardButton: true,
    removeCommentsWhenCopyingTerminalFrames: false
  },
  styleOverrides: {
    borderRadius: "8px",
    codeFontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
    codeFontSize: "0.9rem",
    codeLineHeight: "1.72",
    codePaddingBlock: "1.1rem",
    codePaddingInline: "1.25rem",
    codeBackground: "#111827",
    uiFontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
    frames: {
      frameBoxShadowCssValue: "0 18px 38px rgba(12, 18, 31, 0.28)",
      editorActiveTabBackground: "#111827",
      terminalTitlebarBackground: "#fdf5f0",
      terminalTitlebarForeground: "#31425f",
      inlineButtonBackground: "#ffffff",
      inlineButtonForeground: "#31425f",
      inlineButtonBorder: "#f7b7c8"
    }
  }
};

const pagefindIntegration = () => ({
  name: "am1ya-pagefind",
  hooks: {
    "astro:build:done": async ({ dir, logger }) => {
      const { index, errors } = await pagefind.createIndex({
        forceLanguage: "zh",
        includeCharacters: "_-:"
      });

      if (!index) {
        logger.warn(`Pagefind index was not created: ${errors.join(", ")}`);
        return;
      }

      const distDir = fileURLToPath(dir);

      // Files are fed to Pagefind one by one instead of via addDirectory, so the
      // excluded routes can be filtered by path rather than by page markup.
      const htmlFiles = (await readdir(distDir, { recursive: true }))
        .map((entry) => entry.split(path.sep).join("/"))
        .filter((entry) => entry.endsWith(".html"))
        .filter((entry) => !pagefindExcludedPaths.some((prefix) => entry.startsWith(prefix)))
        .sort();

      let pageCount = 0;
      for (const relativePath of htmlFiles) {
        const content = await readFile(path.join(distDir, relativePath), "utf8");
        // Mirrors Pagefind's own URL derivation: only a trailing index.html is dropped.
        const url = `/${relativePath.endsWith("index.html")
          ? relativePath.slice(0, -"index.html".length)
          : relativePath}`;
        const fileResult = await index.addHTMLFile({ url, content });

        if (fileResult.errors.length) {
          logger.warn(`Pagefind skipped ${url}: ${fileResult.errors.join(", ")}`);
        } else {
          pageCount += 1;
        }
      }

      const writeResult = await index.writeFiles({
        outputPath: fileURLToPath(new URL("./pagefind", dir))
      });

      if (writeResult.errors.length) {
        logger.warn(`Pagefind write warnings: ${writeResult.errors.join(", ")}`);
      } else {
        logger.info(`Pagefind indexed ${pageCount} pages.`);
      }

      await pagefind.close();
    }
  }
});

export default defineConfig({
  site: "https://am1ya-114514.github.io",
  output: "static",
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "tap"
  },
  integrations: [
    expressiveCode(expressiveCodeOptions),
    sitemap({
      // /themes/ 只是历史遗留的静态资源前缀；/admin/ 是写作台，不该被搜索引擎收录。
      filter: (page) => {
        const { pathname } = new URL(page);
        return !pathname.startsWith("/themes/") && !pathname.startsWith("/admin/");
      }
    }),
    icon({
      include: {
        tabler: [
          "home-heart",
          "book-2",
          "device-gamepad-2",
          "code",
          "user-heart",
          "search",
          "brand-github",
          "brand-bilibili",
          "sparkles",
          "heart",
          "device-gamepad",
          "movie",
          "pin",
          "terminal-2",
          "flower",
          "mood-smile",
          "chevron-down",
          "palette",
          "x",
          "arrow-up",
          "home",
          "archive",
          "arrow-left",
          "arrow-right",
          "link",
          "copy",
          "file-text",
          "player-play",
          "player-pause",
          "flask-2",
          "user-scan",
          "arrow-back-up",
          "activity-heartbeat",
          "refresh",
          "player-skip-forward",
          "arrow-down",
          "chevron-left",
          "chevron-right",
          "external-link",
          "blade",
          "blender",
          "chef-hat",
          "glass-full",
          "hand-finger",
          "hand-grab",
          "tools-kitchen-2",
          "trash"
        ],
        "simple-icons": [
          "unity",
          "blender",
          "unrealengine",
          "javascript",
          "github",
          "bilibili",
          "steam",
          "thefinals"
        ]
      }
    }),
    pagefindIntegration()
  ],
  markdown: {
    syntaxHighlight: false,
    processor: unified({
      gfm: true,
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "append",
            properties: {
              className: ["heading-anchor"],
              ariaLabel: "复制标题链接"
            },
            content: {
              type: "text",
              value: "#"
            }
          }
        ],
        [rehypeExpressiveCode, expressiveCodeOptions]
      ]
    })
  },
  devToolbar: {
    enabled: false
  }
});
