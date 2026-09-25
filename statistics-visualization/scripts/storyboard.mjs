// Renders the storyboard key frames at full resolution into storyboards/<episode>/NN-name.jpg.
//   node scripts/storyboard.mjs            → all frames
//   node scripts/storyboard.mjs 2 4        → only key frames 2 and 4
// Needs REMOTION_BROWSER pointing at a chrome-headless-shell binary (see HANDOFF.md §7).
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browserExecutable = process.env.REMOTION_BROWSER || undefined;
const chromiumOptions = { gl: process.env.REMOTION_GL || null };
const NAMES = ["01-hook", "02-reveal1", "03-pivot", "04-reveal2", "05-analogy", "06-scale", "07-end"];
const only = process.argv.slice(2).map(Number);

const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/storyboard/index.ts") });
const composition = await selectComposition({ serveUrl, id: "SB-Alcohol", browserExecutable, chromiumOptions });
const outDir = path.join(ROOT, "storyboards/alcohol");
fs.mkdirSync(outDir, { recursive: true });
for (const [i, name] of NAMES.entries()) {
  const frame = i + 1;
  if (only.length && !only.includes(frame)) continue;
  const t0 = Date.now();
  await renderStill({
    serveUrl, composition, frame, output: path.join(outDir, `${name}.jpg`), imageFormat: "jpeg", jpegQuality: 90,
    browserExecutable, chromiumOptions, timeoutInMilliseconds: 180000,
  });
  console.log(`${name}.jpg  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
