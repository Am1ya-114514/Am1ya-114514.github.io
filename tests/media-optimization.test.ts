import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, realpath, rm, rmdir, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { getCoverSources, hasTransparentCover } from "../src/core/content/coverSources.ts";
import { planMediaExclusions, prunePublishedMedia } from "../scripts/prune-published-media.mjs";
import { excludedPublicMedia } from "../scripts/lib/media-publish-policy.mjs";

const manifest = JSON.parse(await readFile(new URL("../src/core/content/responsive-covers.json", import.meta.url), "utf8"));
const root = new URL("../public/", import.meta.url);
const sourcePath = (src: string) => new URL(src.replace(/^\//, ""), root);
const coverEntries = Object.entries(manifest) as [string, any][];

test("responsive covers keep accepted sources unchanged and use smaller, same-aspect alpha-capable images", async () => {
  // This site currently ships no responsive covers; the manifest is allowed to stay empty.
  let originalBytes = 0;
  let smallBytes = 0;
  let totalVariants = 0;
  for (const [src, entry] of coverEntries) {
    const data = await readFile(sourcePath(src));
    const hash = createHash("sha256").update(data)
      .update(JSON.stringify({ quality: 94, alphaQuality: 100, smartSubsample: true, effort: 6 })).digest("hex").slice(0, 8);
    assert.equal(entry.hash, hash, "Regenerate variants when the accepted source changes");
    const original = await sharp(data).metadata();
    assert.equal(entry.width, original.width);
    assert.equal(entry.height, original.height);
    assert.equal(entry.opaque, (await sharp(data).stats()).isOpaque);
    originalBytes += data.length;
    smallBytes += entry.variants[0]?.bytes ?? data.length;
    let previous = 0;
    for (const variant of entry.variants) {
      const bytes = await readFile(sourcePath(variant.src));
      const image = await sharp(bytes).metadata();
      assert.equal(image.format, "webp");
      assert.equal(image.width, variant.width);
      assert.ok(variant.width > previous && variant.width < entry.width);
      assert.ok(Math.abs(image.height! - variant.width * entry.height / entry.width) <= 1);
      assert.equal(image.hasAlpha, original.hasAlpha);
      assert.equal(bytes.length, variant.bytes);
      assert.ok(bytes.length < data.length);
      totalVariants += bytes.length;
      previous = variant.width;
    }
  }
  if (coverEntries.length > 0) {
    assert.ok(smallBytes < originalBytes * .4, "Small-cover total must save at least 60% without lowering quality");
    assert.ok(totalVariants < 5_000_000, "Derivative files have a bounded publishing cost");
  }
});

test("cover attributes preserve full-resolution fallback, permit high-DPR selection and leave unknown URLs alone", () => {
  for (const [src, entry] of coverEntries) {
    const result = getCoverSources(src, "380px");
    assert.equal(result.sizes, "380px");
    assert.ok(result.srcset?.endsWith(`${src} ${entry.width}w`));
    assert.ok(result.srcset?.includes(`${entry.variants[0].src} ${entry.variants[0].width}w`));
  }
  for (const src of [undefined, null, "", "/other.webp", "https://example.com/cover.webp", "/blog-covers/cover-01.webp?v=2"]) {
    assert.deepEqual(getCoverSources(src, "100vw"), {});
  }
  assert.equal(hasTransparentCover("https://example.com/new-cover.png"), true, "Unknown artwork keeps its existing backdrop");
  assert.equal(hasTransparentCover(undefined), false);
  assert.equal(hasTransparentCover(null), false);
});

test("publish exclusions only affect reviewed originals and cannot target public or an unrelated output folder", async () => {
  await assert.rejects(() => prunePublishedMedia(new URL("../public/", import.meta.url)), /Refusing to prune/);
  assert.equal(new Set(excludedPublicMedia).size, excludedPublicMedia.length);
  assert.ok(excludedPublicMedia.every(name => !/\.\.|^\//.test(name)));
  assert.ok(excludedPublicMedia.every(name => !/\.mp4$|\.mp3$|readme\//.test(name)));
});

test("the entire exclusion plan is checked for path traversal and references before any file removal", async () => {
  // realpath, because Windows hands out 8.3 short temporary paths that the
  // sandbox-aware containment check would compare against long-path realpaths.
  const directory = await realpath(await mkdtemp(path.join(os.tmpdir(), "media-publish-test-")));
  try {
    await writeFile(path.join(directory, "old.png"), "original");
    const plan = await planMediaExclusions(directory, [], ["old.png", "absent.png"]);
    assert.equal(plan.length, 1);
    assert.equal(plan[0].bytes, 8);
    await assert.rejects(() => planMediaExclusions(directory, [], ["../escape.png"]), /Unsafe media path/);
    await assert.rejects(() => planMediaExclusions(directory, [], [path.parse(directory).root]), /Unsafe media path/);
    await assert.rejects(() => planMediaExclusions(directory, [["page.html", '<img src="/old.png">']], ["old.png"]), /still referenced/);
    await assert.rejects(() => planMediaExclusions(directory, [["runtime.js", 'const root="/"; root+"old.png"']], ["old.png"]), /still referenced/);
    assert.equal((await stat(path.join(directory, "old.png"))).size, 8, "Planning never modifies originals");
  } finally {
    // mkdtemp owns this exact leaf directory; remove only the file created above.
    await rm(path.join(directory, "old.png"));
    await rmdir(directory);
  }
});

test("the theme uses cover candidates without eager CSS background requests", async () => {
  const paths = [
    "src/themes/fuyukawa-kagari/pages/BlogIndexPage.astro",
    "src/themes/fuyukawa-kagari/pages/HomePage.astro"
  ];
  for (const filename of paths) {
    const content = await readFile(new URL(`../${filename}`, import.meta.url), "utf8");
    assert.match(content, /getCoverSources/);
    assert.match(content, /loading="lazy"/);
  }
});
