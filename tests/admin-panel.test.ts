import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (relativePath: string) => readFile(new URL(relativePath, root), "utf8");

// The writing desk is a vendored Sveltia CMS bundle. Pinning the hash keeps an
// accidental partial copy or an unreviewed swap from shipping silently; bump it
// together with a deliberate dependency update.
const VENDORED_CMS_SHA256 = "be690504c2165c2c508f70ec097e30e3175fb81632aa34fdaed078fa5fbc3e17";

test("the writing desk ships a pinned Sveltia CMS bundle and a noindex host page", async () => {
  const bundle = await readFile(new URL("public/admin/sveltia-cms.js", root));
  const digest = createHash("sha256").update(bundle).digest("hex");
  assert.equal(digest, VENDORED_CMS_SHA256, "public/admin/sveltia-cms.js changed; review the upgrade and update the pin");
  assert.ok(bundle.byteLength > 1_000_000, "the vendored CMS bundle looks truncated");

  const host = await read("public/admin/index.html");
  assert.match(host, /name="robots"\s+content="noindex/, "the writing desk must not be indexed by search engines");
  assert.match(host, /data-pagefind-ignore="all"/, "the writing desk must stay out of the site search index");
  assert.match(host, /src="\.\/sveltia-cms\.js"/, "the host page must load the vendored bundle, not a CDN copy");
  assert.doesNotMatch(host, /unpkg\.com|cdn\.jsdelivr\.net/, "the writing desk must not depend on a CDN at boot time");
});

test("the writing desk edits the same collection that Astro validates", async () => {
  const config = await read("public/admin/config.yml");
  const schema = await read("src/content.config.ts");

  assert.match(config, /name:\s*github/);
  assert.match(config, /repo:\s*Am1ya-114514\/Am1ya-114514\.github\.io/);
  assert.match(config, /branch:\s*main/);

  // `folder` is the collection directory; `media_folder` sits at column 0 and is unrelated.
  const collectionFolder = config.match(/^ {4}folder:\s*"([^"]+)"/m)?.[1];
  const loaderBase = schema.match(/base:\s*"\.\/([^"]+)"/)?.[1];
  assert.equal(collectionFolder, loaderBase, "the CMS folder and the Astro loader base must agree");

  const schemaKeys = new Set(
    [...schema.matchAll(/^\s{4}(\w+):/gm)].map(match => match[1])
  );
  // Only look inside the `fields:` block; collection entries use `- name:` too.
  const fieldsBlock = config.split(/^\s*fields:\s*$/m)[1] ?? "";
  const cmsFields = [...fieldsBlock.matchAll(/^\s*-\s*name:\s*([\w-]+)/gm)].map(match => match[1]);
  assert.ok(cmsFields.length > 0, "the CMS config declares no fields");

  for (const field of cmsFields) {
    if (field === "body") continue;
    assert.ok(schemaKeys.has(field), `CMS field "${field}" is not part of the Astro content schema`);
  }

  for (const required of ["title", "description", "pubDate", "category", "draft", "slug"]) {
    assert.ok(cmsFields.includes(required), `the CMS config lost its "${required}" field`);
  }

  // Filenames come from the slug field, and Astro derives the route from the filename.
  const posts = (await readdir(new URL("src/content/blog/", root))).filter(name => name.endsWith(".md"));
  assert.ok(posts.length > 0, "there are no posts to edit");
  for (const post of posts) {
    const source = await read(`src/content/blog/${post}`);
    const slug = source.match(/^slug:\s*"([^"]+)"/m)?.[1];
    assert.equal(slug, post.replace(/\.md$/, ""), `${post} must declare a slug that matches its filename`);
  }
});
