// Short side-by-side voice audition before spending credits on a full episode.
//   node scripts/voice-test.mjs → out/voice-test/{v2,v3}.mp3
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

// Same three beats in both: the hook, the known fact, and the pivot — where tone contrast matters most.
const takes = {
  v2: {
    model_id: "eleven_multilingual_v2",
    voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.1, use_speaker_boost: true },
    text: "해외에선 '한국은 끝났다'는 말까지 나왔죠. 이천이십삼 년 출산율, 영 점 칠이 명. 유엔 통계 이백삼십이 곳 중에, 이백삼십 위. 근데, 이 년 연속 올랐어요.",
  },
  v3: {
    model_id: "eleven_v3",
    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    text: "해외에선… '한국은 끝났다'는 말까지 나왔죠. 이천이십삼 년 출산율, 영 점 칠이 명. 유엔 통계 이백삼십이 곳 중에… 이백삼십 위. 근데 — [excited] 이 년 연속, 올랐어요.",
  },
};

const dir = path.join(ROOT, "out/voice-test");
fs.mkdirSync(dir, { recursive: true });
for (const [name, body] of Object.entries(takes)) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, language_code: "ko" }),
  });
  if (!res.ok) { console.log(name, "FAILED", res.status, (await res.text()).slice(0, 300)); continue; }
  fs.writeFileSync(path.join(dir, `${name}.mp3`), Buffer.from(await res.arrayBuffer()));
  console.log(name, "ok");
}
