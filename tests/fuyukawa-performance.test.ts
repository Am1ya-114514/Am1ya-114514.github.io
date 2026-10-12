import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const readSource = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(`../${relativePath}`, import.meta.url)),
  "utf8"
);

const layoutSource = readSource("src/themes/fuyukawa-kagari/layouts/BaseLayout.astro");
const homeSource = readSource("src/themes/fuyukawa-kagari/pages/HomePage.astro");

test("Fuyukawa no longer mounts the Live2D mascot", () => {
  // Removed on request: nothing in the shared layout may pull the widget back in.
  assert.doesNotMatch(layoutSource, /live2d|waifu/i);
});

test("Fuyukawa bounds and defers location and weather requests", () => {
  assert.match(homeSource, /const scheduleHomeWeather =/);
  assert.match(homeSource, /locationCacheTtl = 1000 \* 60 \* 60 \* 12/);
  assert.match(homeSource, /fetchWithTimeout\(weatherUrl, \{\}, 4500, signal\)/);
  assert.match(homeSource, /const getTimezoneLocation = \(\) => \{/);
  assert.match(homeSource, /connection\?\.saveData/);
  // The hero signal must stay keyless: no borrowed API keys, no third-party IP lookups.
  assert.doesNotMatch(homeSource, /apis\.map\.qq\.com|ipwho\.is|ipapi\.co|requestJsonp/);
  assert.doesNotMatch(homeSource, /getPconlineIpLocation|getTencentNewsIpLocation/);
});

test("Fuyukawa pauses the second-by-second clock while hidden", () => {
  assert.match(homeSource, /const scheduleHomeClock =/);
  assert.match(homeSource, /document\.visibilityState !== "visible"/);
  assert.match(homeSource, /document\.addEventListener\("visibilitychange", handleClockVisibility\)/);
  assert.doesNotMatch(homeSource, /setInterval\(updateHomeClock, 1000\)/);
});
