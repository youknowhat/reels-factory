#!/usr/bin/env python3
"""
run_zoomtale_auto.py — 줌테일(@zoomtale) 스타일 릴스 완전 자동 파이프라인
주제: 돈과 욕망의 흑역사 (자본 흐름과 대중 심리)

  Stage 1  Claude (claude-opus-5, structured output) → 30초 JSON 대본
  Stage 2  씬별 병렬 빌드: Wikimedia Commons 원본 → (없으면) Fal.ai Flux Schnell → (없으면) 절차적 플레이트
           + ElevenLabs 내레이션 → (키 없으면) macOS `say` → (없으면) 무음
  Stage 3  Ken Burns 줌 / 크로스페이드 / 필름 그레인 / 비네트 / 하단 자막 / 다크 드론 앰비언스 / Save CTA
  Stage 4  output/final_zoomtale_reel.mp4 (1080x1920, 30fps, H.264 + AAC)

사용법:
  cp .env.example .env   # ANTHROPIC_API_KEY / ELEVENLABS_API_KEY / FAL_KEY 입력
  .venv/bin/python run_zoomtale_auto.py [--topic "..."] [--reuse-script] [--preview]

키가 없는 단계는 자동으로 폴백되며, output/build_report.json 에 어떤 공급자가 쓰였는지 기록됩니다.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import math
import os
import shutil
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import wave
from pathlib import Path
from typing import List, Literal, Optional

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# ───────────────────────────── 설정 ─────────────────────────────
ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output" / "zoomtale"
ASSETS = OUT / "assets"
W, H = 1080, 1920
FPS = 30
XFADE = 0.3            # 씬 간 크로스페이드(초)
SCENE_PAD = 0.32       # 내레이션 뒤 여백(초)
MIN_SCENE = 2.2
UA = "ZoomtaleAutoPipeline/1.0 (https://www.instagram.com/zoomtale/; contact: pipeline@zoomtale.local)"
FONT_PATH = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
CLAUDE_MODEL = "claude-opus-5"
FLUX_STYLE = ("Authentic historical photograph, 35mm film grain, 19th-century vintage aesthetic, "
              "dark atmospheric museum lighting, realistic texture")
ELEVEN_VOICE = os.environ.get("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB")  # Adam (deep narrator)
DEFAULT_TOPIC = "돈의 강과 집단 광기가 불러온 역사상 가장 비극적인 버블"
REPORT: dict = {"stages": {}, "scenes": []}


def log(stage: str, msg: str) -> None:
    print(f"[{time.strftime('%H:%M:%S')}] [{stage}] {msg}", flush=True)


# ───────────────────────────── Stage 1: 대본 ─────────────────────────────
class Scene(BaseModel):
    id: int
    phase: Literal["hook", "body", "cliffhanger", "reveal", "loop_cta"]
    narration: str = Field(description="한국어 내레이션 한 문장 (TTS로 읽힘)")
    subtitle: str = Field(description="화면 자막, 3~4단어 이내")
    wikimedia_query: str = Field(description="Wikimedia Commons 검색어(영어). 실제 존재하는 명화/흑백사진 제목 위주")
    flux_prompt: str = Field(description="Wikimedia 실패 시 쓸 실사 이미지 프롬프트(영어)")
    focus_x: float = Field(description="줌 타격 지점 x (0~1)")
    focus_y: float = Field(description="줌 타격 지점 y (0~1)")
    zoom: Literal["in", "out"]
    reuse_hook_image: bool = Field(description="훅 씬 이미지를 재사용(무한 루프용)")


class ReelScript(BaseModel):
    title: str
    topic: str
    hook_question: str
    scenes: List[Scene]
    cta_text: str
    loop_rationale: str = Field(description="마지막 문장이 첫 훅 문장으로 이어지는 이유")


SYSTEM_PROMPT = """너는 인스타그램 20만 팔로워 채널 '줌테일(zoomtale)'의 수석 디렉터다. 주제는 '돈과 욕망의 흑역사(자본 흐름과 대중 심리)'.
30초 세로 릴스 대본을 아래 흥행 방정식대로 JSON으로 만든다.

[Hook 0~3초] 씬1: 실제 기묘한 흑백 사진/명화의 특정 부분을 타격하는 자극적·미스터리한 질문. "이 그림 속 X는 왜…?" 형태. Pattern Interrupt.
[Body 4~25초] 씬2~6: 단서를 단계별로 제공. 숫자·날짜·구체적 디테일. 결론은 절대 미리 말하지 않는다(Cliffhanger).
[Reveal] 씬7: 마지막 5초 직전에만 결론 공개. 훅의 이미지를 재해석하는 반전.
[Loop+CTA] 씬8: 마지막 내레이션은 "…같은 그림이 다시 그려지고 있습니다"처럼 씬1 훅 문장과 문맥이 자연스럽게 이어지는 무한 루프 구조. 이어서 반드시 cta_text를 그대로 붙인다.
   cta_text = "이 자본의 함정을 피하려면 이 영상의 패턴을 저장해두세요"

규칙:
- 씬은 정확히 8개. phase 순서: hook, body, body, body, body, cliffhanger, reveal, loop_cta.
- 내레이션은 음산하고 웅장한 다큐멘터리 톤. 문장은 짧게. 전체 내레이션 합계 200~240자(공백 포함) — 30초 안에 들어가야 한다.
- subtitle은 3~4단어 이내(예: "구근 하나 = 연봉 10배"). 내레이션 축약이 아니라 '단서'만.
- wikimedia_query는 영어로, Wikimedia Commons에 실제 존재하는 공공영역 명화·역사사진 제목/화가명을 구체적으로(예: "Jan Brueghel the Younger Satire on Tulip Mania"). 차트·지도·로고 금지.
- flux_prompt는 영어 실사 사진 프롬프트(인물 얼굴 클로즈업 피함, 텍스트 없음).
- 씬1과 씬8은 같은 이미지(씬8 reuse_hook_image=true). 씬7 reveal도 훅 이미지 재사용 가능.
- focus_x/focus_y는 이미지에서 시선을 꽂을 지점(0~1).
- 특정 실존 인물 비방·허위 사실 금지. 역사적 사실만."""


FALLBACK_SCRIPT = {
    "title": "꽃 한 송이에 집 한 채를 건 사람들",
    "topic": DEFAULT_TOPIC,
    "hook_question": "이 원숭이들은 왜, 꽃 한 송이에 집 한 채를 걸었을까요?",
    "cta_text": "이 자본의 함정을 피하려면 이 영상의 패턴을 저장해두세요",
    "loop_rationale": "마지막 문장 '같은 그림이 다시 그려지고 있습니다'가 첫 문장 '이 원숭이들은 왜…'의 '그림'으로 되돌아간다.",
    "scenes": [
        {"id": 1, "phase": "hook", "narration": "이 원숭이들은 왜, 꽃 한 송이에 집 한 채를 걸었을까요?",
         "subtitle": "꽃 한 송이 = 집 한 채?",
         "wikimedia_query": "Jan Brueghel the Younger Satire on Tulip Mania",
         "flux_prompt": "17th century Flemish oil painting of monkeys in noble dress trading tulip bulbs, dark tavern",
         "focus_x": 0.40, "focus_y": 0.80, "zoom": "in", "reuse_hook_image": False},
        {"id": 2, "phase": "body", "narration": "1636년 네덜란드. 돈이 강물처럼 넘쳤습니다.",
         "subtitle": "1636년, 네덜란드",
         "wikimedia_query": "Gerrit Berckheyde Dam Square Amsterdam painting",
         "flux_prompt": "Amsterdam canal harbor 17th century, merchant ships, gold coins, dark painterly light",
         "focus_x": 0.5, "focus_y": 0.6, "zoom": "out", "reuse_hook_image": False},
        {"id": 3, "phase": "body", "narration": "튤립 구근 하나가, 숙련공 연봉의 열 배에 팔렸죠.",
         "subtitle": "구근 하나 = 연봉 10배",
         "wikimedia_query": "Semper Augustus tulip watercolor 17th century",
         "flux_prompt": "single red and white striped tulip on black velvet, 17th century still life, dramatic light",
         "focus_x": 0.5, "focus_y": 0.35, "zoom": "in", "reuse_hook_image": False},
        {"id": 4, "phase": "body", "narration": "사람들은 꽃이 아니라, '내일의 가격'을 샀습니다.",
         "subtitle": "꽃이 아닌 '내일'을 샀다",
         "wikimedia_query": "Hendrik Pot Flora's Wagon of Fools",
         "flux_prompt": "crowd of 17th century Dutch merchants shouting in a tavern auction, candle light, oil painting",
         "focus_x": 0.5, "focus_y": 0.5, "zoom": "in", "reuse_hook_image": False},
        {"id": 5, "phase": "body", "narration": "1637년 2월 3일, 경매장에서 아무도 손을 들지 않았습니다.",
         "subtitle": "1637년 2월 3일, 침묵",
         "wikimedia_query": "Haarlem Grote Markt 17th century painting Berckheyde",
         "flux_prompt": "empty 17th century Dutch auction hall, overturned chairs, single candle, dark oil painting",
         "focus_x": 0.5, "focus_y": 0.55, "zoom": "out", "reuse_hook_image": False},
        {"id": 6, "phase": "cliffhanger", "narration": "며칠 만에, 가격은 99% 증발했습니다.",
         "subtitle": "며칠 만에 -99%",
         "wikimedia_query": "Vanitas still life skull wilted flowers 17th century painting",
         "flux_prompt": "wilted dead tulips on a wooden table, torn promissory notes, 17th century vanitas painting",
         "focus_x": 0.75, "focus_y": 0.4, "zoom": "in", "reuse_hook_image": False},
        {"id": 7, "phase": "reveal", "narration": "원숭이는 그들이 아니라, 우리의 초상이었습니다.",
         "subtitle": "원숭이는 우리였다",
         "wikimedia_query": "Jan Brueghel the Younger Satire on Tulip Mania",
         "flux_prompt": "17th century Flemish oil painting of monkeys in noble dress trading tulip bulbs, dark tavern",
         "focus_x": 0.40, "focus_y": 0.80, "zoom": "out", "reuse_hook_image": True},
        {"id": 8, "phase": "loop_cta",
         "narration": "400년이 지난 지금, 같은 그림이 다시 그려지고 있습니다. 이 자본의 함정을 피하려면, 이 영상의 패턴을 저장해두세요.",
         "subtitle": "같은 그림이 다시",
         "wikimedia_query": "Jan Brueghel the Younger Satire on Tulip Mania",
         "flux_prompt": "17th century Flemish oil painting of monkeys in noble dress trading tulip bulbs, dark tavern",
         "focus_x": 0.40, "focus_y": 0.80, "zoom": "in", "reuse_hook_image": True},
    ],
}


def anthropic_credentials_present() -> bool:
    if os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"):
        return True
    return (Path.home() / ".config" / "anthropic").exists()


def generate_script(topic: str) -> ReelScript:
    if anthropic_credentials_present():
        try:
            import anthropic
            client = anthropic.Anthropic()
            log("stage1", f"Claude({CLAUDE_MODEL})로 대본 생성 중…")
            resp = client.messages.parse(
                model=CLAUDE_MODEL,
                max_tokens=16000,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": f"주제: {topic}\n위 규칙대로 30초 릴스 대본 JSON을 만들어라."}],
                output_format=ReelScript,
            )
            if resp.stop_reason == "refusal":
                raise RuntimeError(f"refusal: {resp.stop_details}")
            script = resp.parsed_output
            script.cta_text = FALLBACK_SCRIPT["cta_text"]
            REPORT["stages"]["script"] = {"provider": "anthropic", "model": CLAUDE_MODEL,
                                          "usage": resp.usage.to_dict()}
            return script
        except Exception as e:  # 인증/네트워크/스키마 오류 → 폴백
            log("stage1", f"Claude 호출 실패({type(e).__name__}: {e}) → 내장 대본 폴백")
    else:
        log("stage1", "ANTHROPIC_API_KEY 없음 → 내장 대본(튤립 버블) 폴백")
    REPORT["stages"]["script"] = {"provider": "fallback_builtin"}
    return ReelScript(**FALLBACK_SCRIPT)


# ───────────────────────────── Stage 2: 에셋 ─────────────────────────────
BAD_WORDS = ("chart", "graph", "map", "diagram", "logo", "icon", "flag", "coat of arms", "svg", "plot",
             "table", "screenshot", "carta", "index")


def _http_get(url: str, timeout: int = 40) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def wikimedia_search(query: str, allow_charts: bool = False) -> Optional[dict]:
    params = {
        "action": "query", "generator": "search", "gsrsearch": query, "gsrnamespace": 6, "gsrlimit": 12,
        "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 2000, "format": "json",
    }
    data = json.loads(_http_get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)))
    cands = []
    for page in data.get("query", {}).get("pages", {}).values():
        info = (page.get("imageinfo") or [None])[0]
        if not info or info.get("mime") not in ("image/jpeg", "image/png", "image/tiff"):
            continue
        if info.get("width", 0) < 700 or info.get("height", 0) < 500:
            continue
        title = page["title"].lower()
        penalty = 0 if allow_charts else sum(3 for w in BAD_WORDS if w in title)
        score = page.get("index", 99) + penalty + (0 if info["mime"] == "image/jpeg" else 1.5)
        meta = info.get("extmetadata", {})
        cands.append((score, {
            "title": page["title"], "url": info.get("thumburl") or info["url"],
            "page": info["descriptionurl"], "license": meta.get("LicenseShortName", {}).get("value", ""),
            "artist": meta.get("Artist", {}).get("value", ""), "mime": info["mime"],
        }))
    if not cands:
        return None
    cands.sort(key=lambda c: c[0])
    return cands[0][1]


def fetch_wikimedia_image(scene: Scene, dest: Path) -> Optional[dict]:
    try:
        allow_charts = scene.phase == "cliffhanger" and "chart" in scene.wikimedia_query.lower()
        hit = wikimedia_search(scene.wikimedia_query, allow_charts=allow_charts)
        if not hit:
            return None
        raw = _http_get(hit["url"])
        img = Image.open(__import__("io").BytesIO(raw)).convert("RGB")
        img.save(dest, quality=95)
        hit["provider"] = "wikimedia"
        return hit
    except Exception as e:
        log("stage2", f"scene{scene.id} Wikimedia 실패: {type(e).__name__}: {e}")
        return None


async def fetch_flux_image(scene: Scene, dest: Path) -> Optional[dict]:
    if not (os.environ.get("FAL_KEY") or os.environ.get("FAL_API_KEY")):
        return None
    try:
        import fal_client
        os.environ.setdefault("FAL_KEY", os.environ.get("FAL_API_KEY", ""))
        prompt = f"{scene.flux_prompt}. {FLUX_STYLE}"
        result = await fal_client.run_async(
            "fal-ai/flux/schnell",
            arguments={"prompt": prompt, "image_size": "portrait_16_9", "num_inference_steps": 4,
                       "num_images": 1, "enable_safety_checker": True},
        )
        url = result["images"][0]["url"]
        Image.open(__import__("io").BytesIO(_http_get(url))).convert("RGB").save(dest, quality=95)
        return {"provider": "fal_flux_schnell", "title": prompt, "url": url, "license": "generated"}
    except Exception as e:
        log("stage2", f"scene{scene.id} Flux 실패: {type(e).__name__}: {e}")
        return None


def procedural_plate(scene: Scene, dest: Path) -> dict:
    """마지막 폴백: 어두운 아카이브 질감 플레이트."""
    rng = np.random.default_rng(scene.id)
    base = rng.normal(28, 9, (H // 4, W // 4, 1)).clip(0, 255).astype(np.uint8).repeat(3, axis=2)
    img = Image.fromarray(base).resize((W, H), Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(3))
    img = ImageEnhance.Color(img.convert("RGB")).enhance(0.0)
    tint = Image.new("RGB", (W, H), (46, 36, 24))
    img = Image.blend(img, tint, 0.35)
    img.save(dest, quality=92)
    return {"provider": "procedural", "title": "procedural plate", "license": "n/a"}


async def build_image(scene: Scene, hook_path: Optional[Path]) -> tuple[Path, dict]:
    dest = ASSETS / f"scene_{scene.id:02d}.jpg"
    if scene.reuse_hook_image and hook_path and hook_path.exists():
        shutil.copy(hook_path, dest)
        return dest, {"provider": "reuse_hook"}
    meta = await asyncio.to_thread(fetch_wikimedia_image, scene, dest)
    if meta is None:
        meta = await fetch_flux_image(scene, dest)
    if meta is None:
        meta = procedural_plate(scene, dest)
    log("stage2", f"scene{scene.id} image ← {meta['provider']} ({meta.get('title', '')[:60]})")
    return dest, meta


def tts_elevenlabs(text: str, dest: Path) -> bool:
    key = os.environ.get("ELEVENLABS_API_KEY") or os.environ.get("ELEVEN_API_KEY")
    if not key:
        return False
    try:
        from elevenlabs import VoiceSettings
        from elevenlabs.client import ElevenLabs
        client = ElevenLabs(api_key=key)
        audio = client.text_to_speech.convert(
            voice_id=ELEVEN_VOICE, text=text, model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128",
            voice_settings=VoiceSettings(stability=0.38, similarity_boost=0.85, style=0.55, use_speaker_boost=True),
        )
        dest.write_bytes(b"".join(audio))
        return True
    except Exception as e:
        log("stage2", f"ElevenLabs 실패: {type(e).__name__}: {e}")
        return False


def tts_macos_say(text: str, dest: Path) -> bool:
    if not shutil.which("say"):
        return False
    try:
        subprocess.run(["say", "-v", "Yuna", "-r", "205", "-o", str(dest), text], check=True,
                       capture_output=True, timeout=120)
        return dest.exists() and dest.stat().st_size > 1000
    except Exception as e:
        log("stage2", f"macOS say 실패: {e}")
        return False


def write_wav(path: Path, samples: np.ndarray, sr: int = 44100) -> None:
    pcm = (np.clip(samples, -1, 1) * 32767).astype(np.int16)
    if pcm.ndim == 1:
        pcm = np.stack([pcm, pcm], axis=1)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())


async def build_voice(scene: Scene) -> tuple[Path, str]:
    mp3 = ASSETS / f"voice_{scene.id:02d}.mp3"
    if await asyncio.to_thread(tts_elevenlabs, scene.narration, mp3):
        return mp3, "elevenlabs"
    aiff = ASSETS / f"voice_{scene.id:02d}.aiff"
    if await asyncio.to_thread(tts_macos_say, scene.narration, aiff):
        return aiff, "macos_say"
    wav = ASSETS / f"voice_{scene.id:02d}.wav"
    write_wav(wav, np.zeros(int(44100 * max(2.0, len(scene.narration) * 0.16))))
    return wav, "silence"


async def stage2(script: ReelScript) -> list[dict]:
    ASSETS.mkdir(parents=True, exist_ok=True)
    hook = script.scenes[0]
    hook_path, hook_meta = await build_image(hook, None)          # 훅 이미지 먼저(재사용 대상)
    voice_tasks = [build_voice(s) for s in script.scenes]
    image_tasks = [build_image(s, hook_path) for s in script.scenes[1:]]
    voices, images = await asyncio.gather(asyncio.gather(*voice_tasks), asyncio.gather(*image_tasks))
    images = [(hook_path, hook_meta)] + list(images)
    from moviepy import AudioFileClip
    built = []
    for scene, (img_path, img_meta), (voice_path, voice_provider) in zip(script.scenes, images, voices):
        dur = AudioFileClip(str(voice_path)).duration
        built.append({"scene": scene, "image": img_path, "image_meta": img_meta,
                      "voice": voice_path, "voice_provider": voice_provider, "voice_dur": dur})
        REPORT["scenes"].append({"id": scene.id, "image": img_meta, "voice": voice_provider,
                                 "voice_seconds": round(dur, 2)})
        log("stage2", f"scene{scene.id} voice ← {voice_provider} ({dur:.2f}s)")
    return built


# ───────────────────────────── Stage 3: 연출 ─────────────────────────────
def load_font(size: int) -> ImageFont.FreeTypeFont:
    best, best_rank = None, -1
    ranks = {"Heavy": 4, "ExtraBold": 3, "Bold": 2, "SemiBold": 1}
    for idx in range(0, 14):
        try:
            f = ImageFont.truetype(FONT_PATH, size, index=idx)
        except Exception:
            break
        rank = max([r for n, r in ranks.items() if n in f.getname()[1]] + [0])
        if rank > best_rank:
            best, best_rank = f, rank
    return best or ImageFont.load_default()


def vintage_grade(img: Image.Image) -> Image.Image:
    """실사 아카이브 톤: 채도 -30%, 대비 +15%, 밝기 -10%, 웜 틴트."""
    img = ImageEnhance.Color(img).enhance(0.7)
    img = ImageEnhance.Contrast(img).enhance(1.15)
    img = ImageEnhance.Brightness(img).enhance(0.9)
    tint = Image.new("RGB", img.size, (60, 44, 26))
    return Image.blend(img, tint, 0.08)


def make_plate(path: Path, margin: float = 1.3) -> Image.Image:
    img = vintage_grade(Image.open(path).convert("RGB"))
    scale = max(W * margin / img.width, H * margin / img.height)
    size = (max(int(img.width * scale), int(W * margin)), max(int(img.height * scale), int(H * margin)))
    return img.resize(size, Image.Resampling.LANCZOS)


def kb_frame(plate: Image.Image, p: float, zoom_dir: str, fx: float, fy: float, margin: float = 1.3,
             strength: float = 1.0) -> np.ndarray:
    """Ken Burns: p∈[0,1] 진행률. zoom in → 타격 지점으로 서서히 파고듦."""
    pe = p * p * (3 - 2 * p)                              # smoothstep
    zmax = 1 + (margin - 1) * min(1.0, strength)
    z = 1 + (zmax - 1) * (pe if zoom_dir == "in" else 1 - pe)
    cw, ch = W * margin / z, H * margin / z
    cx = fx * plate.width * (0.5 + 0.5 * pe) + 0.5 * plate.width * (0.5 - 0.5 * pe)  # 중심→타격점 팬
    cy = fy * plate.height * (0.5 + 0.5 * pe) + 0.5 * plate.height * (0.5 - 0.5 * pe)
    x0 = min(max(cx - cw / 2, 0), plate.width - cw)
    y0 = min(max(cy - ch / 2, 0), plate.height - ch)
    crop = plate.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W, H), Image.Resampling.BILINEAR)
    return np.asarray(crop, dtype=np.float32)


def wrap_words(text: str, limit: int = 13) -> list[str]:
    """어절 경계에서 길이가 가장 균등한 지점으로 2줄 분할."""
    if len(text) <= limit:
        return [text]
    words = text.split(" ")
    splits = [(" ".join(words[:k]), " ".join(words[k:])) for k in range(1, len(words))]
    return list(min(splits, key=lambda ab: abs(len(ab[0]) - len(ab[1])))) if splits else [text]


def subtitle_layer(text: str) -> tuple[np.ndarray, np.ndarray, int]:
    """하단 자막 RGBA 스트립 → (rgb float32, alpha float32 [h,w,1], y_top)"""
    font = load_font(76)
    strip_h = 360
    layer = Image.new("RGBA", (W, strip_h), (0, 0, 0, 0))
    grad = np.linspace(0, 150, strip_h, dtype=np.uint8)[:, None].repeat(W, axis=1)   # 하단 어두운 그라데이션
    layer.putalpha(Image.fromarray(grad))
    d = ImageDraw.Draw(layer)
    lines = wrap_words(text)
    y = 120
    for line in lines:
        bbox = d.textbbox((0, 0), line, font=font, stroke_width=6)
        tw = bbox[2] - bbox[0]
        d.text(((W - tw) / 2, y), line, font=font, fill=(255, 255, 255, 255),
               stroke_width=6, stroke_fill=(0, 0, 0, 255))
        y += 100
    arr = np.asarray(layer, dtype=np.float32)
    return arr[..., :3], arr[..., 3:4] / 255.0, H - strip_h


def cta_layer(cta: str) -> tuple[np.ndarray, np.ndarray]:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rectangle((0, 0, W, H), fill=(0, 0, 0, 110))
    d.rounded_rectangle((70, 690, W - 70, 1130), radius=28, fill=(10, 8, 6, 205), outline=(229, 192, 123, 255), width=3)
    f1, f2, f3 = load_font(66), load_font(50), load_font(40)
    half = cta.find("이 영상")
    lines = [cta[:half].strip(), cta[half:].strip()] if half > 0 else [cta]
    y = 760
    for line in lines:
        tw = d.textbbox((0, 0), line, font=f1)[2]
        d.text(((W - tw) / 2, y), line, font=f1, fill=(255, 255, 255, 255))
        y += 96
    tag = "▶ 저장   ·   ↗ 공유   ·   @zoomtale"
    tw = d.textbbox((0, 0), tag, font=f2)[2]
    d.text(((W - tw) / 2, 1000), tag, font=f2, fill=(229, 192, 123, 255))
    arr = np.asarray(layer, dtype=np.float32)
    return arr[..., :3], arr[..., 3:4] / 255.0


def brand_layer() -> tuple[np.ndarray, np.ndarray]:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text((64, 150), "Z O O M T A L E", font=load_font(34), fill=(235, 225, 200, 190))
    d.text((64, 196), "돈과 욕망의 흑역사", font=load_font(30), fill=(229, 192, 123, 170))
    arr = np.asarray(layer, dtype=np.float32)
    return arr[..., :3], arr[..., 3:4] / 255.0


def vignette_mask() -> np.ndarray:
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    return np.clip(1.12 - 0.62 * r ** 2.2, 0.25, 1.0)[..., None]


def grain_tiles(n: int = 8, sigma: float = 7.0) -> list[np.ndarray]:
    rng = np.random.default_rng(42)
    return [rng.normal(0, sigma, (H, W, 1)).astype(np.float32).repeat(3, axis=2) for _ in range(n)]


def build_ambience(total: float, hit_times: list[float], path: Path, sr: int = 44100) -> None:
    """다크 다큐 드론 + 임팩트 히트(절차 합성, 외부 에셋 불필요)."""
    n = int(total * sr)
    t = np.arange(n) / sr
    drone = (0.5 * np.sin(2 * np.pi * 41.2 * t) + 0.35 * np.sin(2 * np.pi * 55.0 * t + 0.4)
             + 0.22 * np.sin(2 * np.pi * 82.4 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t)))
    drone *= 0.72 + 0.28 * np.sin(2 * np.pi * 0.045 * t)
    rng = np.random.default_rng(3)
    spec = np.fft.rfft(rng.standard_normal(n))
    freqs = np.fft.rfftfreq(n, 1 / sr)
    spec *= 1 / np.maximum(freqs, 20) ** 1.1                    # 브라운 노이즈(바람/홀 톤)
    spec[freqs > 1800] = 0
    noise = np.fft.irfft(spec, n)
    noise /= np.abs(noise).max() + 1e-9
    mix = drone * 0.65 + noise * 0.45
    mix /= np.abs(mix).max() + 1e-9
    mix *= 0.11
    for ht in hit_times:                                        # 서브 임팩트
        i0 = int(ht * sr); L = int(1.1 * sr)
        if i0 >= n:
            continue
        tt = np.arange(min(L, n - i0)) / sr
        f = 120 * np.exp(-tt * 3.2) + 36
        hit = np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-tt * 3.0) * 0.42
        hit += rng.standard_normal(len(tt)) * np.exp(-tt * 22) * 0.18
        mix[i0:i0 + len(tt)] += hit
    fade_in, fade_out = int(1.2 * sr), int(1.8 * sr)
    mix[:fade_in] *= np.linspace(0, 1, fade_in)
    mix[-fade_out:] *= np.linspace(1, 0, fade_out)
    write_wav(path, mix, sr)


def stage3_4(script: ReelScript, built: list[dict], out_path: Path, fps: int, preview: bool) -> None:
    from moviepy import AudioFileClip, CompositeAudioClip, VideoClip

    # 타임라인
    timeline = []
    t = 0.0
    for b in built:
        lead = 0.35 if b["scene"].phase == "hook" else 0.0
        dur = max(MIN_SCENE, lead + b["voice_dur"] + SCENE_PAD)
        timeline.append({"start": t, "dur": dur, "voice_at": t + lead, **b})
        t += dur
    total = t + 0.4
    log("stage3", f"총 길이 {total:.1f}s / {len(timeline)}씬")

    plates = [make_plate(b["image"]) for b in timeline]
    subs = [subtitle_layer(b["scene"].subtitle) for b in timeline]
    cta_rgb, cta_a = cta_layer(script.cta_text)
    brand_rgb, brand_a = brand_layer()
    vig = vignette_mask()
    grains = grain_tiles()
    end_cache: dict[int, np.ndarray] = {}

    def scene_frame(i: int, p: float) -> np.ndarray:
        s = timeline[i]["scene"]
        strength = 1.0 if s.phase in ("hook", "reveal", "loop_cta") else 0.6
        return kb_frame(plates[i], p, s.zoom, s.focus_x, s.focus_y, strength=strength)

    def frame_function(tt: float) -> np.ndarray:
        i = max(0, min(len(timeline) - 1, next((k for k, b in enumerate(timeline) if tt < b["start"] + b["dur"]), len(timeline) - 1)))
        b = timeline[i]
        local = tt - b["start"]
        p = min(1.0, local / b["dur"])
        frame = scene_frame(i, p)
        if i > 0 and local < XFADE:                                   # 크로스페이드
            if i - 1 not in end_cache:
                end_cache[i - 1] = scene_frame(i - 1, 1.0)
            a = local / XFADE
            frame = end_cache[i - 1] * (1 - a) + frame * a
        frame = frame + grains[int(tt * fps) % len(grains)]
        # 자막(0.22s 팝인) — loop_cta 씬 후반엔 CTA 오버레이로 교체
        show_cta = b["scene"].phase == "loop_cta" and p > 0.42
        if show_cta:
            a = min(1.0, (p - 0.42) * b["dur"] / 0.5)
            frame = frame * (1 - cta_a * a) + cta_rgb * cta_a * a
        else:
            rgb, al, y0 = subs[i]
            al = al * min(1.0, local / 0.22)
            frame[y0:] = frame[y0:] * (1 - al) + rgb * al
        frame = frame * (1 - brand_a) + brand_rgb * brand_a
        if tt < 0.3:
            frame *= tt / 0.3
        elif tt > total - 0.4:
            frame *= max(0.0, (total - tt) / 0.4)
        return np.clip(frame, 0, 255).astype(np.uint8)

    # 오디오: 내레이션 + 앰비언스(훅·리빌 지점 임팩트)
    amb_path = ASSETS / "ambience.wav"
    hits = [0.0] + [b["start"] for b in timeline if b["scene"].phase in ("reveal", "cliffhanger")]
    build_ambience(total, hits, amb_path)
    audio = CompositeAudioClip([AudioFileClip(str(amb_path))] +
                               [AudioFileClip(str(b["voice"])).with_start(b["voice_at"]) for b in timeline]
                               ).with_duration(total)

    video = VideoClip(frame_function, duration=total).with_audio(audio)
    if preview:
        video = video.resized(0.5)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    log("stage4", f"렌더링 → {out_path}")
    video.write_videofile(str(out_path), fps=fps, codec="libx264", audio_codec="aac", audio_fps=44100,
                          bitrate="10000k", preset="medium", threads=os.cpu_count() or 4,
                          ffmpeg_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart", "-profile:v", "high"],
                          logger=None)


# ───────────────────────────── main ─────────────────────────────
def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--topic", default=DEFAULT_TOPIC)
    ap.add_argument("--reuse-script", action="store_true", help="output/script.json 재사용(Stage 1 스킵)")
    ap.add_argument("--preview", action="store_true", help="540x960 빠른 미리보기")
    ap.add_argument("--fps", type=int, default=FPS)
    ap.add_argument("--out", default=str(OUT / "final_zoomtale_reel.mp4"))
    args = ap.parse_args()
    OUT.mkdir(exist_ok=True)
    t0 = time.time()

    script_path = OUT / "script.json"
    if args.reuse_script and script_path.exists():
        script = ReelScript(**json.loads(script_path.read_text(encoding="utf-8"))["script"])
        REPORT["stages"]["script"] = {"provider": "reused"}
    else:
        script = generate_script(args.topic)
    script_path.write_text(json.dumps({"provider": REPORT["stages"]["script"], "script": script.model_dump()},
                                      ensure_ascii=False, indent=2), encoding="utf-8")
    log("stage1", f"대본 확정: '{script.title}' / {len(script.scenes)}씬 / "
                  f"내레이션 {sum(len(s.narration) for s in script.scenes)}자")

    built = asyncio.run(stage2(script))
    stage3_4(script, built, Path(args.out), args.fps, args.preview)

    (OUT / "credits.json").write_text(json.dumps(
        [{"scene": r["id"], **{k: v for k, v in r["image"].items() if k != "provider"}, "provider": r["image"]["provider"]}
         for r in REPORT["scenes"]], ensure_ascii=False, indent=2), encoding="utf-8")
    REPORT["elapsed_sec"] = round(time.time() - t0, 1)
    REPORT["output"] = args.out
    (OUT / "build_report.json").write_text(json.dumps(REPORT, ensure_ascii=False, indent=2), encoding="utf-8")
    log("done", f"완료 {REPORT['elapsed_sec']}s → {args.out}")


if __name__ == "__main__":
    main()
