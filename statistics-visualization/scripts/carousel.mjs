// Renders one feed carousel post: every card as a 1080×1440 PNG plus a review sheet.
//   node scripts/carousel.mjs alcohol          → carousels/alcohol/01.png … NN.png + sheet.png
//   node scripts/carousel.mjs alcohol 2 5      → only cards 2 and 5
// Needs REMOTION_BROWSER pointing at a chrome-headless-shell binary (see HANDOFF.md §7).
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [post, ...only] = process.argv.slice(2);
if (!post) throw new Error("usage: node scripts/carousel.mjs <post> [card …]  (post = a file in src/carousel/posts/)");
const browserExecutable = process.env.REMOTION_BROWSER || undefined;

const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/carousel/index.ts") });
const outDir = path.join(ROOT, "carousels", post);
fs.mkdirSync(outDir, { recursive: true });

const cards = await selectComposition({ serveUrl, id: `Carousel-${post}`, browserExecutable });
const pick = only.map(Number);
for (let i = 0; i < cards.durationInFrames; i++) {
  if (pick.length && !pick.includes(i + 1)) continue;
  const output = path.join(outDir, `${String(i + 1).padStart(2, "0")}.png`);
  await renderStill({ serveUrl, composition: cards, frame: i, output, imageFormat: "png", browserExecutable });
  console.log(path.relative(ROOT, output));
}
const sheet = await selectComposition({ serveUrl, id: `Carousel-${post}-sheet`, browserExecutable });
await renderStill({ serveUrl, composition: sheet, frame: 0, output: path.join(outDir, "sheet.png"), imageFormat: "png", browserExecutable });
console.log(path.relative(ROOT, path.join(outDir, "sheet.png")));
