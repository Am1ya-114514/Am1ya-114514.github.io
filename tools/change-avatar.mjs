#!/usr/bin/env node
// 本地一键换头像。
//
// 用法（推荐）：双击仓库根目录下的「换头像.cmd」
// 用法（手动）：node tools/change-avatar.mjs [选项]
//
//   --image=<路径>      直接指定图片，跳过文件选择框
//   --size=<像素>       输出边长，默认 1024
//   --position=<位置>   attention（默认，自动找主体）/ centre / top / bottom / left / right
//   --dry-run           只生成图片，不提交、不推送
//   --no-push           提交但不推送
//
// 它会做三件事：
//   1. 把选中的图片裁成正方形，写成 profile.webp 与 profile.jpg
//   2. git add 这两个文件并提交
//   3. git push，触发 GitHub Actions 重新部署
//
// 站点里引用头像的地方一共 3 处（src/lib/site.ts、src/themes/fuyukawa-kagari/assets.ts、
// src/themes/fuyukawa-kagari/layouts/BaseLayout.astro），它们都指向同一个文件名，
// 所以替换文件内容即可，不需要改代码。

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const repoRoot = path.resolve(import.meta.dirname, "..");
const assetsDir = path.join(repoRoot, "public", "themes", "fuyukawa-kagari", "assets");
const webpTarget = path.join(assetsDir, "profile.webp");
const jpgTarget = path.join(assetsDir, "profile.jpg");

const args = new Map(
  process.argv.slice(2).map((raw) => {
    const [key, ...rest] = raw.replace(/^--/, "").split("=");
    return [key, rest.length ? rest.join("=") : "true"];
  })
);

const dryRun = args.has("dry-run");
const push = !dryRun && !args.has("no-push");
const size = Number(args.get("size") ?? 1024);
const position = args.get("position") ?? "attention";

const POSITIONS = {
  attention: sharp.strategy.attention,
  centre: "centre",
  center: "centre",
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right"
};

const log = (message) => console.log(message);
const die = (message) => {
  console.error(`\n[×] ${message}\n`);
  process.exit(1);
};

const formatBytes = (value) => `${(value / 1024).toFixed(1)} KiB`;

/** 让 PowerShell 弹出系统文件选择框，返回用户选中的路径。 */
async function pickImageFile() {
  const outFile = path.join(import.meta.dirname, ".picked-avatar");
  const script = [
    "Add-Type -AssemblyName System.Windows.Forms | Out-Null",
    "$dialog = New-Object System.Windows.Forms.OpenFileDialog",
    "$dialog.Title = '选择新的头像图片'",
    "$dialog.Filter = '图片文件|*.png;*.jpg;*.jpeg;*.webp;*.bmp;*.gif;*.avif;*.tif;*.tiff|所有文件|*.*'",
    "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {",
    "  [System.IO.File]::WriteAllText($env:AVATAR_PICK_FILE, $dialog.FileName, (New-Object System.Text.UTF8Encoding($false)))",
    "}"
  ].join("\n");

  try {
    execFileSync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Sta", "-Command", script],
      { stdio: "inherit", env: { ...process.env, AVATAR_PICK_FILE: outFile } }
    );
  } catch (error) {
    die(`打不开文件选择框：${error.message}\n    也可以改成手动指定：node tools/change-avatar.mjs --image="D:\\图片\\头像.png"`);
  }

  if (!existsSync(outFile)) return null;
  const picked = (await readFile(outFile, "utf8")).trim();
  await rm(outFile, { force: true });
  return picked || null;
}

const source = args.get("image") ?? (await pickImageFile());

if (!source) {
  log("\n[i] 没有选择图片，已取消。\n");
  process.exit(0);
}

if (!existsSync(source)) die(`找不到这个文件：${source}`);
if (!POSITIONS[position]) die(`--position 只能是 ${Object.keys(POSITIONS).join(" / ")}`);

const sourceInfo = await stat(source);
if (sourceInfo.size > 40 * 1024 * 1024) die(`图片太大了（${formatBytes(sourceInfo.size)}），请先压到 40 MiB 以内。`);

let metadata;
try {
  metadata = await sharp(source).metadata();
} catch (error) {
  die(`这个文件不像是能识别的图片：${error.message}`);
}

const shortestSide = Math.min(metadata.width ?? 0, metadata.height ?? 0);
if (shortestSide < 128) die(`图片太小了（${metadata.width}×${metadata.height}），至少需要 128×128。`);

log("");
log("阿巴怪的实验室 · 换头像");
log("────────────────────────────────");
log(`  来源    ${source}`);
log(`  原始    ${metadata.width}×${metadata.height} ${metadata.format ?? "?"} · ${formatBytes(sourceInfo.size)}`);
log(`  输出    ${size}×${size} webp + jpg`);
log(`  构图    ${position}${position === "attention" ? "（自动识别主体）" : ""}`);
log("");

// 先写临时文件再替换，避免处理失败时把仓库里的头像弄坏。
const stagedWebp = `${webpTarget}.tmp`;
const stagedJpg = `${jpgTarget}.tmp`;

const square = () =>
  sharp(source, { failOn: "none" })
    // 动图只取第一帧：头像不需要动。
    .rotate()
    .resize(size, size, { fit: "cover", position: POSITIONS[position] });

await square().webp({ quality: 82, effort: 5 }).toFile(stagedWebp);
await square()
  .flatten({ background: "#ffffff" })
  .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" })
  .toFile(stagedJpg);

const { rename } = await import("node:fs/promises");
await rename(stagedWebp, webpTarget);
await rename(stagedJpg, jpgTarget);

for (const target of [webpTarget, jpgTarget]) {
  const details = await stat(target);
  log(`  [✓] ${path.relative(repoRoot, target)}  ${formatBytes(details.size)}`);
}

if (dryRun) {
  log("\n[i] --dry-run：图片已生成，没有提交、也没有推送。\n");
  process.exit(0);
}

const git = (...gitArgs) => execFileSync("git", gitArgs, { cwd: repoRoot, stdio: "inherit" });

log("\n提交中…");
git("add", "--", "public/themes/fuyukawa-kagari/assets/profile.webp", "public/themes/fuyukawa-kagari/assets/profile.jpg");

const staged = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: repoRoot, encoding: "utf8" }).trim();
if (!staged) {
  log("\n[i] 头像没有变化，不用提交。\n");
  process.exit(0);
}

const stamp = new Date().toISOString().slice(0, 10);
git("commit", "-m", `chore(avatar): 更新个人头像 (${stamp})`);

if (!push) {
  log("\n[i] --no-push：已经提交，但没有推送。\n");
  process.exit(0);
}

log("\n推送到 GitHub…");
try {
  git("push", "origin", "main");
} catch {
  die("推送失败（多半是网络或代理问题）。图片和提交都已经在本地了，网络恢复后手动跑一次 git push 即可。");
}

log("");
log("────────────────────────────────");
log("  [✓] 搞定！约 1～2 分钟后刷新 https://am1ya-114514.github.io/ 就能看到新头像。");
log("      部署进度：https://github.com/Am1ya-114514/Am1ya-114514.github.io/actions");
log("");
