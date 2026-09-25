// Narration + SFX + timeline for one episode.
//   node scripts/prep.mjs <episode>            → macOS "Yuna" voice (draft)
//   ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID in env or .env → ElevenLabs voice (final)
//   model: episode.json "model" (e.g. eleven_v3), else ELEVENLABS_MODEL_ID, else eleven_multilingual_v2.
//   [tags] in tts text are eleven_v3 audio tags; they are stripped for any other model or voice.
//   node scripts/prep.mjs <episode> --reuse → keep the existing public/vo/<episode> takes, rebuild only the timeline (no API calls).
//   VOICE_RATE (default 1.12) speeds playback in the render; Remotion's atempo keeps the pitch.
// Reads src/episodes/<episode>/episode.json. Writes public/vo/<episode>/*.{wav,mp3,json},
// public/sfx/*.wav (shared across episodes) and src/episodes/<episode>/timeline.json.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;
const GAP = 3; // frames of silence between phrases
const SPEED = Number(process.env.VOICE_SPEED || 1.1);
const PAD_IN = 0.04, PAD_OUT = 0.14; // seconds kept around the spoken span when trimming

const args = process.argv.slice(2);
const REUSE = args.includes("--reuse");
const EPISODE = args.find((a) => !a.startsWith("--"));
if (!EPISODE) throw new Error("usage: node scripts/prep.mjs <episode> [--reuse]  (episode = a folder under src/episodes/)");
const EP_DIR = path.join(ROOT, "src/episodes", EPISODE);
if (!fs.existsSync(path.join(EP_DIR, "episode.json"))) throw new Error(`no src/episodes/${EPISODE}/episode.json`);

// .env is optional; real env vars win.
const envFile = path.join(ROOT, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const ELEVEN = process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID;

const ep = JSON.parse(fs.readFileSync(path.join(EP_DIR, "episode.json"), "utf8"));
const MODEL = ep.model || process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const V3 = MODEL === "eleven_v3";
const plain = (t) => t.replace(/\[[a-z ]+\]\s*/gi, "");
const VOICE_DIR = `vo/${EPISODE}`; // relative to public/ — what staticFile() resolves and what timeline.json records
const voDir = path.join(ROOT, "public", VOICE_DIR);
const RATE = Number(process.env.VOICE_RATE || 1.12);
if (!REUSE) fs.rmSync(voDir, { recursive: true, force: true });
fs.mkdirSync(voDir, { recursive: true });

function wavSeconds(file) {
  const b = fs.readFileSync(file);
  let rate = 0, channels = 1, bits = 16;
  for (let p = 12; p < b.length - 8; ) {
    const id = b.toString("ascii", p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === "fmt ") { channels = b.readUInt16LE(p + 10); rate = b.readUInt32LE(p + 12); bits = b.readUInt16LE(p + 22); }
    if (id === "data") return size / (rate * channels * (bits / 8));
    p += 8 + size + (size % 2);
  }
  throw new Error(`no data chunk in ${file}`);
}

// First and last spoken character in the alignment, skipping [audio tags] and whitespace.
function speechSpan(a) {
  let inTag = false, first = -1, last = -1;
  a.characters.forEach((ch, i) => {
    if (ch === "[") inTag = true;
    const spoken = !inTag && /[^\s.,…—'"?!-]/.test(ch);
    if (ch === "]") inTag = false;
    if (spoken) { if (first < 0) first = i; last = i; }
  });
  return { start: a.character_start_times_seconds[first], end: a.character_end_times_seconds[last] };
}

function probeSeconds(file) {
  const out = execFileSync("npx", ["remotion", "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { cwd: ROOT }).toString();
  return parseFloat(out.trim());
}

async function speak(text, base) {
  const mp3 = path.join(voDir, `${base}.mp3`), align = path.join(voDir, `${base}.json`);
  if (REUSE && fs.existsSync(mp3) && fs.existsSync(align)) {
    return { file: `${base}.mp3`, seconds: probeSeconds(mp3), ...speechSpan(JSON.parse(fs.readFileSync(align, "utf8"))) };
  }
  if (ELEVEN) {
    const file = mp3;
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}/with-timestamps?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: V3 ? text : plain(text),
        model_id: MODEL,
        language_code: "ko",
        // v3 takes stability 0 (creative) / 0.5 (natural) / 1 (robust) and ignores style controls.
        voice_settings: V3
          ? { stability: 0.5, similarity_boost: 0.75, speed: SPEED }
          : { stability: 0.5, similarity_boost: 0.75, style: 0.1, use_speaker_boost: true, speed: SPEED },
      }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const out = await res.json();
    fs.writeFileSync(file, Buffer.from(out.audio_base64, "base64"));
    fs.writeFileSync(align, JSON.stringify(out.alignment));
    const { start, end } = speechSpan(out.alignment);
    return { file: `${base}.mp3`, seconds: probeSeconds(file), start, end };
  }
  const wavFile = path.join(voDir, `${base}.wav`);
  execFileSync("say", ["-v", "Yuna", "-r", "205", "-o", wavFile, "--file-format=WAVE", "--data-format=LEI16@44100", plain(text)]);
  return { file: `${base}.wav`, seconds: wavSeconds(wavFile) };
}

// Three short synthesized cues, shared by every episode, so no episode carries third-party audio.
function writeSfx() {
  const SR = 44100, dir = path.join(ROOT, "public/sfx");
  if (fs.existsSync(path.join(dir, "slap.wav"))) return; // already there from a previous episode's prep
  fs.mkdirSync(dir, { recursive: true });
  const wav = (x) => {
    const buf = Buffer.alloc(44 + x.length * 2);
    buf.write("RIFF", 0); buf.writeUInt32LE(36 + x.length * 2, 4); buf.write("WAVEfmt ", 8);
    buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24);
    buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36);
    buf.writeUInt32LE(x.length * 2, 40);
    x.forEach((v, i) => buf.writeInt16LE(Math.max(-1, Math.min(1, v)) * 32767, 44 + i * 2));
    return buf;
  };
  const tone = (secs, f0, f1, decay, gain) => {
    const n = Math.round(SR * secs), x = new Float32Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, f = f0 + (f1 - f0) * (i / n);
      ph += (2 * Math.PI * f) / SR;
      x[i] = Math.sin(ph) * Math.exp(-t * decay) * gain * Math.min(1, i / 40);
    }
    return x;
  };
  fs.writeFileSync(path.join(dir, "tick.wav"), wav(tone(0.05, 2200, 1800, 90, 0.35)));
  fs.writeFileSync(path.join(dir, "tok.wav"), wav(tone(0.16, 520, 380, 28, 0.6)));
  // slap: a short, dull paper hit for stickers and tape landing
  const n = Math.round(SR * 0.09), slap = new Float32Array(n);
  let lp = 0, seed = 7;
  for (let i = 0; i < n; i++) {
    seed = (seed * 16807) % 2147483647;
    lp += ((seed / 2147483647) * 2 - 1 - lp) * 0.25;
    slap[i] = lp * Math.exp(-(i / SR) * 45) * 1.6 + Math.sin((2 * Math.PI * 140 * i) / SR) * Math.exp(-(i / SR) * 60) * 0.35;
  }
  fs.writeFileSync(path.join(dir, "slap.wav"), wav(slap));
}

const scenes = [];
const report = [];
let at = 0;
for (const [si, sc] of ep.scenes.entries()) {
  let t = sc.lead;
  const phrases = [];
  for (const [pi, ph] of sc.phrases.entries()) {
    const { file, seconds, start, end } = await speak(ph.tts, `s${si + 1}-${pi + 1}`);
    // With alignment, keep only the spoken span (plus a breath); otherwise use the whole file.
    const inSec = start !== undefined ? Math.max(0, start - PAD_IN) : 0;
    const outSec = end !== undefined ? Math.min(seconds, end + PAD_OUT) : seconds;
    const trim = Math.floor(inSec * FPS); // media frames skipped at the start
    const dur = Math.ceil(((outSec - trim / FPS) * FPS) / RATE); // composition frames the phrase occupies
    phrases.push({ from: t, dur, trim, rate: RATE, sub: ph.sub, audio: file });
    report.push(`${sc.id}.${pi + 1} ${(dur / FPS).toFixed(2)}s (file ${seconds.toFixed(2)}s)  ${(plain(ph.tts).replace(/[^가-힣a-z0-9]/gi, "").length / (dur / FPS)).toFixed(1)} chars/s  ${plain(ph.tts)}`);
    t += dur + GAP;
  }
  t = t - GAP + sc.tail;
  scenes.push({ id: sc.id, from: at, dur: t, phrases });
  at += t;
}
writeSfx();

const timeline = { fps: FPS, width: 1080, height: 1920, total: at, voiceDir: VOICE_DIR, voice: ELEVEN ? `elevenlabs:${MODEL}` : "macos-yuna", scenes };
fs.writeFileSync(path.join(EP_DIR, "timeline.json"), JSON.stringify(timeline, null, 1));
console.log(report.join("\n"));
console.log(`[${EPISODE}] voice=${timeline.voice} total=${(at / FPS).toFixed(1)}s ` + scenes.map((s) => `${s.id}:${(s.dur / FPS).toFixed(1)}`).join(" "));
