import { readFile, readdir, stat } from "node:fs/promises";
import { excludedPublicMedia } from "./lib/media-publish-policy.mjs";

const distDir = new URL("../dist/", import.meta.url);
const astroDir = new URL("_astro/", distDir);
const rootDir = new URL("../", import.meta.url);
const failures = [];

// Budgets for the single-theme personal site. Every page is rendered by the
// Fuyukawa Kagari theme, so the numbers stay in the same ballpark across routes.
const fileBudgets = [
  ["Home HTML", "index.html", 240_000],
  ["Blog index HTML", "blog/index.html", 180_000],
  ["Games HTML", "games/index.html", 200_000],
  ["Works HTML", "projects/index.html", 220_000],
  ["About HTML", "about/index.html", 200_000],
  ["404 HTML", "404.html", 140_000]
];

const stylesheetBudgets = [
  ["Home CSS", "index.html", 260_000],
  ["Blog index CSS", "blog/index.html", 200_000],
  ["Games CSS", "games/index.html", 200_000],
  ["Works CSS", "projects/index.html", 200_000],
  ["About CSS", "about/index.html", 200_000]
];

// Generic bundle guards instead of per-file names: hashed chunk names change often.
const totalScriptBudget = 1_600_000;
const chunkBudget = 420_000;

const formatBytes = (value) => `${(value / 1024).toFixed(1)} KiB`;

const recordBudget = (label, size, limit) => {
  const passed = size <= limit;
  console.log(`${passed ? "PASS" : "FAIL"} ${label}: ${formatBytes(size)} / ${formatBytes(limit)}`);
  if (!passed) failures.push(`${label} exceeded its budget by ${formatBytes(size - limit)}`);
};

for (const [label, relativePath, limit] of fileBudgets) {
  try {
    const details = await stat(new URL(relativePath, distDir));
    recordBudget(label, details.size, limit);
  } catch {
    failures.push(`${label} is missing: dist/${relativePath}`);
  }
}

for (const [label, relativePath, limit] of stylesheetBudgets) {
  try {
    const html = await readFile(new URL(relativePath, distDir), "utf8");
    const stylesheetPaths = [...html.matchAll(/href="\/_astro\/([^"?]+\.css)(?:\?[^"]*)?"/g)]
      .map((match) => match[1]);
    const uniquePaths = [...new Set(stylesheetPaths)];
    if (uniquePaths.length === 0) throw new Error("no stylesheets found");
    const sizes = await Promise.all(uniquePaths.map((name) => stat(new URL(name, astroDir))));
    recordBudget(label, sizes.reduce((total, details) => total + details.size, 0), limit);
  } catch (error) {
    failures.push(`${label} could not be measured: ${error.message}`);
  }
}

let astroFiles = [];
try {
  astroFiles = await readdir(astroDir);
} catch {
  failures.push("dist/_astro is missing");
}

const scriptFiles = astroFiles.filter((name) => name.endsWith(".js"));
if (scriptFiles.length === 0) {
  failures.push("dist/_astro emitted no JavaScript bundles");
} else {
  const scriptSizes = await Promise.all(scriptFiles.map(async (name) => [name, (await stat(new URL(name, astroDir))).size]));
  const total = scriptSizes.reduce((sum, [, size]) => sum + size, 0);
  recordBudget(`All emitted scripts (${scriptFiles.length} chunks)`, total, totalScriptBudget);
  const [largestName, largestSize] = scriptSizes.reduce((worst, entry) => (entry[1] > worst[1] ? entry : worst));
  recordBudget(`Largest script chunk (${largestName})`, largestSize, chunkBudget);
}

// The hero wordmark is a generated SVG whose viewBox must stay in step with the
// CSS box that sizes it, otherwise the handwriting gets letterboxed or clipped.
try {
  const svg = await readFile(new URL("public/themes/fuyukawa-kagari/assets/hero-title.svg", rootDir), "utf8");
  const viewBox = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
  if (!viewBox) throw new Error("hero-title.svg has no viewBox");
  const [, , , boxWidth, boxHeight] = viewBox.map(Number);
  const css = await readFile(new URL("src/themes/fuyukawa-kagari/styles/refresh.css", rootDir), "utf8");
  const rule = css.match(/body\[data-fuyukawa\] \.hero h1 \{[^}]*aspect-ratio:\s*([\d.]+)\s*\/\s*([\d.]+)/);
  if (!rule) throw new Error("refresh.css has no .hero h1 aspect-ratio");
  const expected = Number(rule[1]) / Number(rule[2]);
  const actual = boxWidth / boxHeight;
  if (Math.abs(expected - actual) > 0.01) {
    failures.push(`Hero title aspect ratio drifted: CSS ${expected.toFixed(4)} vs SVG ${actual.toFixed(4)}`);
  } else {
    console.log(`PASS Hero title aspect ratio: ${actual.toFixed(4)}`);
  }
  if (!/<path id="glyph-A"/.test(svg)) failures.push("Hero wordmark lost its generated glyph outlines");
} catch (error) {
  failures.push(`Hero title validation failed: ${error.message}`);
}

// Responsive covers are optional: validate them only when the manifest lists any.
try {
  const covers = JSON.parse(await readFile(new URL("src/core/content/responsive-covers.json", rootDir), "utf8"));
  const entries = Object.entries(covers);
  if (entries.length === 0) {
    console.log("PASS Responsive covers: none declared, nothing to validate");
  } else {
    let bytes = 0;
    let smallBytes = 0;
    let originalBytes = 0;
    for (const [source, cover] of entries) {
      originalBytes += (await stat(new URL(source.slice(1), distDir))).size;
      smallBytes += cover.variants[0]?.bytes ?? 0;
      for (const variant of cover.variants) {
        const published = await stat(new URL(variant.src.slice(1), distDir));
        if (published.size !== variant.bytes) failures.push(`Responsive cover size mismatch: ${variant.src}`);
        bytes += published.size;
      }
    }
    recordBudget("Responsive cover derivatives", bytes, 5_000_000);
    recordBudget("Small covers versus originals", smallBytes, Math.floor(originalBytes * 0.4));
  }
} catch (error) {
  failures.push(`Published media validation failed: ${error.message}`);
}

for (const relative of excludedPublicMedia) {
  try {
    await stat(new URL(relative, distDir));
    failures.push(`Reviewed source media leaked into the build: ${relative}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

if (failures.length > 0) {
  console.error("\nPerformance budget violations:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("\nAll performance budgets passed.");
}
