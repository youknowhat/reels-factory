// Renders one still per scene (after its animations settle) into out/stills/<composition>/, for a
// quick visual check.
//   node scripts/stills.mjs <CompositionId> [frame frame ...]
// With no frames given, renders one still near the end of each scene in that episode's timeline.json.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browserExecutable = process.env.REMOTION_BROWSER || undefined;
const [id, ...rest] = process.argv.slice(2);
if (!id) throw new Error("usage: node scripts/stills.mjs <CompositionId> [frame ...]  (id = as registered in src/Root.tsx)");
let episode = id.toLowerCase();
let timelinePath = path.join(ROOT, "src/episodes", episode, "timeline.json");
if (!fs.existsSync(timelinePath)) {
  // A/B/C style variants (e.g. "Alcohol-A") share one timeline.json under the base episode folder.
  const base = episode.replace(/-[a-z]$/, "");
  const basePath = path.join(ROOT, "src/episodes", base, "timeline.json");
  if (fs.existsSync(basePath)) [episode, timelinePath] = [base, basePath];
}
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts") });
const composition = await selectComposition({ serveUrl, id, browserExecutable });
// Keyed by the composition id (not the possibly-shared episode folder), so style variants like
// Alcohol-A/-B/-C land in their own out/stills/ subfolder instead of overwriting each other.
const outDir = path.join(ROOT, "out/stills", id.toLowerCase());
fs.mkdirSync(outDir, { recursive: true });
const frames = rest.length
  ? rest.map(Number)
  : JSON.parse(fs.readFileSync(timelinePath, "utf8")).scenes.map((s) => s.from + s.dur - 14);
for (const [i, frame] of frames.entries()) {
  const output = path.join(outDir, `${String(i + 1).padStart(2, "0")}-${frame}.png`);
  await renderStill({ serveUrl, composition, frame, output, scale: 0.3, browserExecutable });
  console.log(output.split("/").slice(-2).join("/"));
}
