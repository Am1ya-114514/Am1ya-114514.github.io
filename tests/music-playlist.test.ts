import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

import { buildManifest, compareTracks, rankOf, titleOf } from "../scripts/lib/music-playlist.mjs";

const root = new URL("../", import.meta.url);

test("MUSIC 文件夹的排序规则", () => {
  assert.equal(titleOf("01-最后一页.mp3"), "最后一页");
  assert.equal(titleOf("02_雨爱.mp3"), "雨爱");
  assert.equal(titleOf("03．瞬.mp3"), "瞬");
  assert.equal(titleOf("04、天空.mp3"), "天空");
  assert.equal(titleOf("雨爱.mp3"), "雨爱", "没有序号时保留整个文件名");
  assert.equal(titleOf("周杰伦 - 晴天.mp3"), "周杰伦 - 晴天", "只有纯数字前缀才算序号");

  assert.equal(rankOf("01-最后一页.mp3"), 1);
  assert.equal(rankOf("10-雨爱.mp3"), 10);
  assert.equal(rankOf("雨爱.mp3"), Number.MAX_SAFE_INTEGER);

  // 有序号的排在没序号的前面；序号之间按数值而不是字典序。
  const ordered = ["9-九.mp3", "10-十.mp3", "没有序号.mp3", "1-一.mp3"].sort(compareTracks);
  assert.deepEqual(ordered, ["1-一.mp3", "9-九.mp3", "10-十.mp3", "没有序号.mp3"]);

  // 非音频文件被忽略。
  assert.deepEqual(buildManifest(["README.md", "01-a.mp3"]).map(t => t.file), ["01-a.mp3"]);
});

test("playlist.json 能接管顺序、补齐歌手名，并忽略不存在的文件", () => {
  const names = ["01-最后一页.mp3", "02-雨爱.mp3", "03-瞬.mp3"];
  const declared = [
    { file: "03-瞬.mp3", title: "瞬", artist: "队长" },
    "02-雨爱.mp3",
    "不存在.mp3"
  ];

  const manifest = buildManifest(names, declared);
  assert.deepEqual(manifest.map(t => t.title), ["瞬", "雨爱", "最后一页"], "声明的顺序优先，剩下的按文件名接在后面");
  assert.equal(manifest[0].artist, "队长");
  assert.equal(manifest[1].artist, undefined, "没写 artist 就不生成该字段");
  assert.deepEqual(manifest.map(t => t.id), ["track-1", "track-2", "track-3"]);
  assert.equal(manifest[2].src, "/themes/fuyukawa-kagari/music/01-%E6%9C%80%E5%90%8E%E4%B8%80%E9%A1%B5.mp3", "URL 要做百分号编码");
});

test("空歌单是合法状态，不会让构建失败", () => {
  assert.deepEqual(buildManifest([]), []);
  assert.deepEqual(buildManifest(["README.md"], ["README.md"]), []);
});

test("首屏自动播放：默认打开、失败后等一次手势、放完自动下一首", async () => {
  const layout = await readFile(new URL("src/themes/fuyukawa-kagari/layouts/BaseLayout.astro", root), "utf8");

  assert.match(
    layout,
    /const isMusicAutoplayEnabled = \(\) => localStorage\.getItem\(musicAutoplayKey\) !== "0";/,
    "自动播放必须是默认开（只有显式存了 \"0\" 才关）"
  );
  assert.match(layout, /player\.restoreAutoplay = isMusicAutoplayEnabled\(\) && cached\.paused !== true;/);
  assert.match(layout, /autoplay: player\.restoreAutoplay/, "进站时就要尝试播放，而不是等用户先点播放键");
  assert.match(layout, /player\.index = \(index \+ player\.tracks\.length\) % player\.tracks\.length;/, "播放列表要能循环");

  // 浏览器拦截自动播放时，交给第一次点击 / 滚动 / 按键补上。
  assert.match(layout, /const tryResumeAfterRefresh = async \(\) => \{/);
  assert.match(layout, /\["pointerdown", "keydown", "wheel", "touchstart"\]\.forEach/);
  assert.match(layout, /player\.noteHint = "点一下页面任意处开始播放。";/);

  // 一首放完 → 下一首，且保持播放。
  const ended = layout.match(/audio\.addEventListener\(\s*"ended"[\s\S]{0,140}?\}\s*,\s*audioListenerOptions\s*\);/);
  assert.ok(ended, "找不到 ended 处理器");
  assert.match(ended[0], /loadMusicTrack\(player\.index \+ 1, \{ autoplay: true \}\)/);
});

test("音量从 28% 起步，而不是媒体元素的默认 100%", async () => {
  const layout = await readFile(new URL("src/themes/fuyukawa-kagari/layouts/BaseLayout.astro", root), "utf8");

  assert.match(layout, /const musicCacheKey = "yuimi-radio-state-v2";/);
  assert.match(
    layout,
    /localStorage\.removeItem\("yuimi-radio-state-v1"\)/,
    "旧的 v1 记录里可能存着被 bug 写坏的 volume: 1，必须丢弃一次"
  );
  assert.match(layout, /const defaultMusicVolume = 0\.28;/);
  assert.match(layout, /const audio = new Audio\(\);\s*\n\s*audio\.volume = defaultMusicVolume;/);
  assert.doesNotMatch(
    layout,
    /audio\.volume \|\| 0\.28/,
    "audio.volume 的默认值是 1（真值），所以它不能当作兜底值"
  );
  assert.doesNotMatch(
    layout,
    /clampVolume\(player\.elements\.volume\?\.value/,
    "UI 可能会在首曲加载前把滑杆改写成 100%，不能拿滑杆当兜底"
  );
});

test("MUSIC 文件夹本身带着使用说明", async () => {
  const readme = await readFile(new URL("MUSIC/README.md", root), "utf8");
  assert.match(readme, /playlist\.json/);
  assert.match(readme, /01-最后一页\.mp3/);
  assert.ok((await stat(new URL("MUSIC", root))).isDirectory());
});
