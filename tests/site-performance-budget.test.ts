import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const readSource = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(`../${relativePath}`, import.meta.url)),
  "utf8"
);

const profileSource = readSource("src/core/PerformanceProfile.astro");
const themeSource = readSource("src/themes/fuyukawa-kagari/styles/theme.css");
const refreshSource = readSource("src/themes/fuyukawa-kagari/styles/refresh.css");
const packageSource = readSource("package.json");
const budgetSource = readSource("scripts/check-performance-budgets.mjs");

test("shared performance profile publishes document visibility", () => {
  assert.match(profileSource, /root\.dataset\.yuimiVisibility = document\.visibilityState/);
  assert.match(profileSource, /document\.addEventListener\("visibilitychange", applyVisibility/);
});

test("the theme pauses CSS animation work while the document is hidden", () => {
  assert.match(themeSource, /html\[data-yuimi-visibility="hidden"\][^]*animation-play-state: paused !important/);
  assert.match(refreshSource, /data-yuimi-visibility="hidden"\][^]*animation-play-state: paused !important/);
});

test("lite mode removes only persistent decorative motion", () => {
  assert.match(themeSource, /html\[data-yuimi-performance="lite"\] \.sakura-rain span/);
  assert.match(themeSource, /html\[data-yuimi-performance="lite"\] \.console-meter span/);
  assert.match(themeSource, /html\[data-yuimi-performance="lite"\][^]*animation: none !important/);
  assert.match(refreshSource, /data-yuimi-performance="lite"\] \.sakura-rain \{ display: none; \}/);
});

test("production build enforces route, CSS and bundle budgets", () => {
  const scripts = JSON.parse(packageSource).scripts;
  assert.equal(
    scripts.build,
    "npm run generate:assets && npm run prepare:covers && astro build && npm run prune:media && npm run check:modules && npm run check:performance"
  );
  assert.equal(scripts["check:modules"], "node --experimental-vm-modules scripts/check-built-modules.mjs");
  assert.equal(scripts["check:performance"], "node scripts/check-performance-budgets.mjs");
  assert.match(budgetSource, /Home HTML/);
  assert.match(budgetSource, /Home CSS/);
  assert.match(budgetSource, /Largest script chunk/);
  assert.match(budgetSource, /Hero title aspect ratio/);
  assert.doesNotMatch(budgetSource, /Kisara|kisara/);
});
