#!/usr/bin/env python3
"""
vd_engine.py — '시각 탐정' 1.5초 컷 텍스트 릴스 렌더 엔진 v3 (내레이션 없음)
에피소드는 episodes/<slug>.py 가 데이터로 기술한다 — TOTAL, BRAND, QUERIES, MARKS, SHOTS, CAPTIONS, SFX, build_sources(ctx)
(+ 선택: CAPTION_STYLE="editorial", BGM_STYLE="calm", GOLD_CAPTIONS, MOTION_BUDGET, DROPS, BPM). 스펙은 CLAUDE.md.
이 파일은 에피소드마다 손대지 않는다.

  .venv/bin/python vd_engine.py --episode casino_carpet --no-bgm     # 업로드용(SFX만)
  .venv/bin/python vd_engine.py --episode casino_carpet              # 미리보기용(자리표시 BGM)
  .venv/bin/python vd_engine.py --episode casino_carpet --seconds 6  # 스모크 테스트
"""
from __future__ import annotations

import argparse
import importlib
import io
import json
import math
import os
import time
from pathlib import Path
from types import SimpleNamespace

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

from run_zoomtale_auto import FONT_PATH, H, W, _http_get, load_font, log, wikimedia_search, wrap_words, write_wav

ROOT = Path(__file__).resolve().parent
FPS = 30
GOLD = (229, 192, 123)
CREDITS: list[dict] = []
EASES = {"linear": lambda p: p, "in": lambda p: p ** 3, "out": lambda p: 1 - (1 - p) ** 3,
         "inout": lambda p: p * p * (3 - 2 * p)}


def load_font_regular(size: int) -> ImageFont.FreeTypeFont:
    for idx in range(0, 14):
        try:
            f = ImageFont.truetype(FONT_PATH, size, index=idx)
        except Exception:
            break
        if f.getname()[1] in ("Regular", "Medium"):
            return f
    return ImageFont.truetype(FONT_PATH, size, index=0)


# ───────────────────────── 소스 헬퍼 (에피소드 build_sources(ctx)에 전달) ─────────────────────────
def fetch(key: str, queries: dict[str, list[str]], assets: Path) -> Image.Image | None:
    """Wikimedia Commons에서 key의 검색어를 순서대로 시도, assets/<key>.jpg 캐시."""
    assets.mkdir(parents=True, exist_ok=True)
    dest, meta_path = assets / f"{key}.jpg", assets / f"{key}.json"
    if dest.exists():
        if meta_path.exists():
            CREDITS.append(json.loads(meta_path.read_text()))
        return Image.open(dest).convert("RGB")
    spec = queries.get(key, [])
    if isinstance(spec, str) and spec.startswith("File:"):            # 제목 지정 → 원본 해상도
        import urllib.parse
        api = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
            {"action": "query", "titles": spec, "prop": "imageinfo", "iiprop": "url|size|extmetadata", "format": "json"})
        page = next(iter(json.loads(_http_get(api))["query"]["pages"].values()))
        info = page["imageinfo"][0]; meta = info.get("extmetadata", {})
        hit = {"title": spec, "url": info["url"], "page": info["descriptionurl"],
               "license": meta.get("LicenseShortName", {}).get("value", ""), "artist": meta.get("Artist", {}).get("value", "")}
        spec = [None]
    for q in spec:
        try:
            if q is not None:
                hit = wikimedia_search(q)
            if not hit:
                continue
            img = Image.open(io.BytesIO(_http_get(hit["url"], timeout=180))).convert("RGB")
            img.save(dest, quality=95)
            meta = {"key": key, "title": hit["title"], "page": hit["page"], "license": hit["license"], "artist": hit["artist"]}
            meta_path.write_text(json.dumps(meta, ensure_ascii=False))
            CREDITS.append(meta)
            log("src", f"{key} ← {hit['title'][:60]} [{hit['license']}]")
            return img
        except Exception as e:
            log("src", f"{key} '{q}' 실패: {e}")
    log("src", f"{key}: Commons 실패 → 에피소드 폴백")
    return None


def cover(img: Image.Image, w: int, h: int) -> Image.Image:
    s = max(w / img.width, h / img.height)
    im = img.resize((math.ceil(img.width * s), math.ceil(img.height * s)), Image.Resampling.LANCZOS)
    x0, y0 = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x0, y0, x0 + w, y0 + h))


def fiber(img: Image.Image, rng, sigma: float = 9.0) -> Image.Image:
    """섬유/종이 질감: 미세 노이즈 + 결 방향 줄무늬."""
    arr = np.asarray(img, dtype=np.float32)
    arr = arr * 0.93 + 8 + rng.normal(0, sigma, (arr.shape[0], arr.shape[1], 1)) + rng.normal(0, 4, (arr.shape[0], 1, 1))
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def wrap_chars(text: str, limit: int) -> list[str]:
    words, out, cur = text.split(" "), [], ""
    for w in words:
        if cur and len(cur) + len(w) + 1 > limit:
            out.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    return out + [cur] if cur else out


def text_card(lines: list[str], title: str | None = None, size=(2160, 3840)) -> Image.Image:
    """출처/근거용 텍스트 카드 플레이트(왼쪽 정렬, 절제된 타이포)."""
    img = Image.new("RGB", size, (7, 6, 9)); d = ImageDraw.Draw(img)
    y = 1300
    if title:
        d.text((180, y), title, font=load_font_regular(64), fill=GOLD)
        d.rectangle((180, y + 92, 420, y + 98), fill=GOLD); y += 200
    body = load_font_regular(56)
    for line in lines:
        for sub in wrap_chars(line, 30):
            d.text((180, y), sub, font=body, fill=(235, 232, 226)); y += 84
        y += 36
    return img


# ───────────────────────── 프레임 합성 ─────────────────────────
def lerp(a, b, p):
    return a + (b - a) * p


def crop_view(plate: Image.Image, z: float, fx: float, fy: float, rot: float = 0.0, dx: float = 0, dy: float = 0):
    """플레이트에서 (zoom, focus) 창을 잘라 1080x1920으로. rot≠0이면 대각선 정사각형을 잘라 회전 후 센터 크롭."""
    ww = plate.width / z
    wh = ww * H / W
    if wh > plate.height:
        wh = plate.height; ww = wh * W / H
    cx = min(max(fx * plate.width + dx, ww / 2), plate.width - ww / 2)
    cy = min(max(fy * plate.height + dy, wh / 2), plate.height - wh / 2)
    if abs(rot) > 0.01:
        s = math.hypot(ww, wh)
        sx = min(max(cx - s / 2, 0), plate.width - s); sy = min(max(cy - s / 2, 0), plate.height - s)
        sq = plate.crop((int(sx), int(sy), int(sx + s), int(sy + s))).rotate(rot, resample=Image.Resampling.BILINEAR)
        c = s / 2
        return sq.crop((int(c - ww / 2), int(c - wh / 2), int(c + ww / 2), int(c + wh / 2))).resize((W, H), Image.Resampling.BILINEAR)
    return plate.crop((int(cx - ww / 2), int(cy - wh / 2), int(cx + ww / 2), int(cy + wh / 2))).resize((W, H), Image.Resampling.BILINEAR)


_TILE_CACHE: dict = {}


def tile_map(cols: int, rows: int) -> np.ndarray:
    if (cols, rows) not in _TILE_CACHE:
        yy, xx = np.mgrid[0:H, 0:W]
        _TILE_CACHE[(cols, rows)] = (yy * rows // H) * cols + (xx * cols // W)
    return _TILE_CACHE[(cols, rows)]


def render_shot(shot: dict, src: dict, marks: dict, local: float, fi: int) -> Image.Image:
    dur = shot["end"] - shot["start"]
    if "render" in shot:                                       # 에피소드가 직접 그리는 화면(예: 왜상 해골 펴기) — (src, 진행률 0~1, 경과초) → 1080x1920 RGB
        return shot["render"](src, min(1.0, local / dur), local)
    p = EASES[shot.get("ease", "linear")](min(1.0, local / dur))
    plate = src[shot["src"]]
    z0, z1 = shot.get("z", (1.0, 1.0))
    f0, f1 = shot.get("f", ((0.5, 0.5), (0.5, 0.5)))
    fx, fy, z = lerp(f0[0], f1[0], p), lerp(f0[1], f1[1], p), lerp(z0, z1, p)
    if "path" in shot:                                         # 한 컷 안에서 여러 지점을 도는 느린 이동(자막-화면 연결용)
        pts = shot["path"]
        times = shot.get("path_times") or [i / (len(pts) - 1) for i in range(len(pts))]
        raw = min(1.0, local / dur)
        seg = max(0, min(len(pts) - 2, next((i for i in range(len(pts) - 1) if raw <= times[i + 1]), len(pts) - 2)))
        span = times[seg + 1] - times[seg]
        sp = EASES["inout"](0.0 if span <= 0 else min(1.0, (raw - times[seg]) / span))
        a, b = pts[seg], pts[seg + 1]
        fx, fy, z = lerp(a[0], b[0], sp), lerp(a[1], b[1], sp), lerp(a[2], b[2], sp)
    if "drift" in shot:                                        # 인지되지 않는 미세 팬
        fx += shot["drift"][0] * p; fy += shot["drift"][1] * p
    if "subcuts" in shot:                                      # 컷 안의 정지 크롭 점프
        k = min(len(shot["subcuts"]) - 1, int(local / dur * len(shot["subcuts"])))
        foc, z = shot["subcuts"][k]
        fx, fy = marks[foc] if isinstance(foc, str) else foc
    rot = shot.get("rot", 0)
    if rot and shot.get("rot_anim"):
        rot = rot * EASES["out"](min(1.0, local / shot["rot_anim"]))
    dx = dy = 0
    if shot.get("shake"):
        rng = np.random.default_rng(fi)
        dx, dy = rng.uniform(-shot["shake"], shot["shake"], 2) * plate.width / 1080
    img = crop_view(plate, z, fx, fy, rot, dx, dy)
    if "split" in shot:
        mode, other = shot["split"]
        z2 = lerp(*shot.get("z2", (1.0, 1.0)), p)
        img2 = crop_view(src[other], z2, 0.5, 0.5)
        if mode == "lr":
            img.paste(img2.crop((W // 4, 0, W // 4 + W // 2, H)), (W // 2, 0))
            ImageDraw.Draw(img).rectangle((W // 2 - 3, 0, W // 2 + 3, H), fill=GOLD)
        else:
            img.paste(img2.crop((0, H // 4, W, H // 4 + H // 2)), (0, H // 2))
            ImageDraw.Draw(img).rectangle((0, H // 2 - 3, W, H // 2 + 3), fill=GOLD)
    if "wipe" in shot:                                         # 한 화면에서 경계가 이동하는 좌→우 와이프
        wp = shot["wipe"]
        q = EASES["out"](min(1.0, local / wp.get("time", 0.6)))
        b = int(W * lerp(wp.get("from", 1.0), wp.get("to", 0.5), q))
        if b < W:
            img2 = crop_view(src[wp["src2"]], wp.get("z2", 1.0), 0.5, 0.5)
            img.paste(img2.crop((b, 0, W, H)), (b, 0))
            ImageDraw.Draw(img).rectangle((b - 3, 0, b + 3, H), fill=GOLD)
    if "mask_reveal" in shot:                                  # 앞 컷 화면이 인셋으로 줄며 배경(src)을 드러냄
        mr = shot["mask_reveal"]
        q = EASES["inout"](min(1.0, local / mr.get("time", 1.4)))
        tx, ty, tw, th = mr["to"]
        rx, ry = int(lerp(0, tx, q)), int(lerp(0, ty, q))
        rw, rh = max(8, int(lerp(W, tw, q))), max(8, int(lerp(H, th, q)))
        inset = crop_view(src[mr["src"]], mr.get("z", 1.0), *mr.get("f", (0.5, 0.5))).resize((rw, rh), Image.Resampling.BILINEAR)
        img.paste(inset, (rx, ry))
        if q > 0.02:
            ImageDraw.Draw(img).rectangle((rx, ry, rx + rw, ry + rh), outline=GOLD, width=4)
    if "sat" in shot:
        img = ImageEnhance.Color(img).enhance(lerp(*shot["sat"], p))
    if "blur" in shot:
        r = lerp(*shot["blur"], p)
        if r > 0.3:
            img = img.filter(ImageFilter.GaussianBlur(r))
    if "bw" in shot:
        a = 1.0 if shot["bw"] == 0 else min(1.0, local / shot["bw"])
        img = Image.blend(img, img.convert("L").convert("RGB"), a)
    if shot.get("invert"):
        img = Image.eval(img, lambda v: 255 - v)
    if "tiles" in shot:                                        # 조각내기: reveal(비트마다 채움) / spotlight(일부만 밝게)
        tl = shot["tiles"]; cols, rows = tl["grid"]
        tm = tile_map(cols, rows); n = cols * rows
        if tl.get("mode", "reveal") == "reveal":
            order = np.random.default_rng(tl.get("seed", 0)).permutation(n)
            lit = np.isin(tm, order[: min(n, int(local / (dur * 0.8) * n) + 1)])
        else:
            lit = np.isin(tm, tl["index"])
        arr = np.asarray(img, dtype=np.float32) * np.where(lit, 1.0, tl.get("dim", 0.12))[..., None]
        img = Image.fromarray(arr.astype(np.uint8))
    if shot.get("flash") and local < 0.1:                      # 반전 지점 화이트 플래시
        img = Image.blend(img, Image.new("RGB", (W, H), (255, 255, 255)), (1 - local / 0.1) * 0.85)
    return img


def _dashed(d: ImageDraw.ImageDraw, pts, fill, width=7, n=9):
    for i in range(len(pts) - 1):
        x0, y0 = pts[i]; x1, y1 = pts[i + 1]
        for k in range(0, n, 2):
            d.line((lerp(x0, x1, k / n), lerp(y0, y1, k / n), lerp(x0, x1, (k + 1) / n), lerp(y0, y1, (k + 1) / n)), fill=fill, width=width)


def _label_box(d: ImageDraw.ImageDraw, x: int, y: int, text: str, font, fill=(0, 0, 0, 190), color=(255, 255, 255, 255), border=GOLD + (255,)):
    bb = d.textbbox((0, 0), text, font=font)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    d.rounded_rectangle((x, y, x + tw + 36, y + th + 30), radius=8, fill=fill, outline=border, width=2)
    d.text((x + 18, y + 12), text, font=font, fill=color)
    return tw + 36, th + 30


def overlay_layer(spec: dict, shot: dict, src: dict) -> np.ndarray:
    """데이터 기반 오버레이: circle / arrows / polyline / callout / tags / measure / box (CLAUDE.md 스펙)."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    plate = src[shot["src"]]
    z = shot.get("z", (1.0, 1.0))[0]
    fx, fy = shot.get("f", ((0.5, 0.5),))[0]

    def to_screen(px, py):  # 플레이트 정규좌표 → 화면좌표 (회전 포함)
        ww = plate.width / z
        s = W / ww
        x, y = (px - fx) * plate.width * s, (py - fy) * plate.height * s
        th = math.radians(shot.get("rot", 0))
        return W / 2 + x * math.cos(th) + y * math.sin(th), H / 2 - x * math.sin(th) + y * math.cos(th)

    kind = spec["type"]; g = GOLD + (255,)
    if kind == "circle":
        x, y = to_screen(*spec["at"]); r = spec.get("r", 280)
        for rr, a in ((r + 20, 60), (r, 255)):
            d.ellipse((x - rr, y - rr, x + rr, y + rr), outline=(235, 40, 40, a), width=10)
    elif kind == "arrows":
        f = load_font(44)
        for i, (px, py) in enumerate(spec["points"].values()):
            x, y = to_screen(px, py)
            ex, ey = x + 170 * (1 if i % 2 == 0 else -1), y - 190
            d.line((ex, ey, x, y), fill=g, width=8)
            d.ellipse((x - 14, y - 14, x + 14, y + 14), fill=g)
            d.text((ex - 20, ey - 60), f"{i + 1}", font=f, fill=g)
    elif kind == "polyline":
        pts = spec["points"]
        if spec.get("dashed"):
            _dashed(d, pts, (255, 255, 255, 220))
        else:
            for i in range(len(pts) - 1):
                d.line((*pts[i], *pts[i + 1]), fill=GOLD + (230,), width=8)
        if spec.get("dots"):
            for x, y in pts:
                d.ellipse((x - 12, y - 12, x + 12, y + 12), fill=g)
        if spec.get("arrowhead"):
            x, y = pts[-1]; d.polygon([(x, y - 60), (x - 40, y + 30), (x + 40, y + 30)], fill=g)
        if spec.get("ring_start"):
            x, y = pts[0]; d.ellipse((x - 30, y - 30, x + 30, y + 30), outline=g, width=6)
    elif kind == "callout":                                    # 관찰 지점 → 지시선 → 라벨(분석 흔적)
        x, y = to_screen(*spec["at"]); side = spec.get("side", "right"); dy = spec.get("dy", -170)
        font = load_font_regular(34)
        tw = d.textbbox((0, 0), spec["text"], font=font)[2] + 36
        lx = x + 120 if side == "right" else x - 120 - tw
        ly = y + dy
        d.ellipse((x - 10, y - 10, x + 10, y + 10), fill=g)
        d.ellipse((x - 24, y - 24, x + 24, y + 24), outline=g, width=3)
        d.line((x, y, lx if side == "right" else lx + tw, ly + 28), fill=g, width=3)
        _label_box(d, int(lx), int(ly), spec["text"], font)
    elif kind == "tags":                                       # 화면 좌표 라벨(비교 대상 이름표)
        font = load_font(34)
        for x, y, text in spec["items"]:
            _label_box(d, x, y, text, font, fill=GOLD + (235,), color=(20, 16, 10, 255), border=GOLD + (255,))
    elif kind == "measure":                                    # 두 점 사이 치수선 + 라벨
        (ax, ay), (bx, by) = spec["a"], spec["b"]
        d.line((ax, ay, bx, by), fill=g, width=4)
        for x, y in ((ax, ay), (bx, by)):
            if abs(bx - ax) < abs(by - ay):
                d.line((x - 22, y, x + 22, y), fill=g, width=4)
            else:
                d.line((x, y - 22, x, y + 22), fill=g, width=4)
        font = load_font_regular(32)
        mx, my = (ax + bx) / 2, (ay + by) / 2
        tw = d.textbbox((0, 0), spec["text"], font=font)[2] + 36
        lx = mx - tw - 24 if mx > W * 0.55 else mx + 24                # 화면 밖으로 나가지 않게 라벨 방향 선택
        _label_box(d, int(lx), int(my - 30), spec["text"], font)
    elif kind == "box":                                        # 영역 강조 + 이름표
        x, y, w, h = spec["rect"]
        d.rectangle((x, y, x + w, y + h), outline=g, width=4)
        if spec.get("text"):
            _label_box(d, x, y - 62, spec["text"], load_font(30), fill=GOLD + (235,), color=(20, 16, 10, 255))
    return np.asarray(layer, dtype=np.float32)


def caption_layer(text: str, gold: bool = False) -> tuple[np.ndarray, int]:
    """기본(pill) 스타일: 가운데 정렬 큰 자막."""
    long = len(text) > 18
    font = load_font(58 if long else 70)
    lines = wrap_words(text, 16 if long else 13)
    lh = 78 if long else 92
    h = lh * len(lines) + 60
    layer = Image.new("RGBA", (W, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i, line in enumerate(lines):
        bb = d.textbbox((0, 0), line, font=font)
        tw = bb[2] - bb[0]
        x, y = (W - tw) / 2, 30 + i * lh
        d.rounded_rectangle((x - 26, y - 10, x + tw + 26, y + lh - 6), radius=16, fill=(0, 0, 0, 150))
        d.text((x, y), line, font=font, fill=(GOLD if gold else (255, 255, 255)) + (255,))
    return np.asarray(layer, dtype=np.float32), 1250 - h // 2


CAP_Y, CAP_H = 1085, 330            # 편집자 스타일 자막 띠 위치/높이 (인용 슬롯 포함)


def caption_layer_editorial(text: str, label: str = "", big: bool = False, gold: bool = False) -> tuple[np.ndarray, int]:
    """편집자 스타일: 왼쪽 정렬 로어서드 띠 + 섹션 라벨. 같은 자리·같은 높이로 반복 → 형식의 일관성."""
    font = load_font(66 if big else 56)
    lines = wrap_words(text, 13 if big else 16)
    lh = 82 if big else 68
    layer = Image.new("RGBA", (W, CAP_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle((48, 0, W - 48, CAP_H), radius=10, fill=(0, 0, 0, 150))
    d.rectangle((48, 0, 54, CAP_H), fill=GOLD + (255,))
    if label:
        d.text((76, 24), label, font=load_font_regular(30), fill=GOLD + (255,))
    for i, line in enumerate(lines):
        d.text((76, 70 + i * lh), line, font=font, fill=(GOLD if gold else (255, 255, 255)) + (255,))
    return np.asarray(layer, dtype=np.float32), CAP_Y


def caption_layer_clean(text: str, gold: bool = False) -> tuple[np.ndarray, int]:
    """clean 스타일: 박스 없이 가운데 정렬, 흰 글자 + 검은 외곽선 + 부드러운 그림자. 잘 보이기만 하면 된다."""
    font = load_font(62)
    lines = text.split("\n") if "\n" in text else wrap_words(text, 14)   # \n = 수동 줄바꿈
    lh = 84
    h = lh * len(lines) + 60
    shadow = Image.new("RGBA", (W, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(shadow)
    for i, line in enumerate(lines):
        tw = d.textbbox((0, 0), line, font=font, stroke_width=7)[2]
        d.text(((W - tw) / 2 + 4, 30 + i * lh + 6), line, font=font, fill=(0, 0, 0, 170), stroke_width=12, stroke_fill=(0, 0, 0, 170))
    shadow = shadow.filter(ImageFilter.GaussianBlur(6))
    d = ImageDraw.Draw(shadow)
    for i, line in enumerate(lines):
        tw = d.textbbox((0, 0), line, font=font, stroke_width=7)[2]
        d.text(((W - tw) / 2, 30 + i * lh), line, font=font, fill=(GOLD if gold else (255, 255, 255)) + (255,),
               stroke_width=7, stroke_fill=(0, 0, 0, 255))
    return np.asarray(shadow, dtype=np.float32), 1380 - h // 2


def cite_layer(text: str) -> tuple[np.ndarray, int]:
    """인용 슬롯: 자막 띠 하단, 작은 글자. 주장이 나오는 컷에만 붙는다."""
    layer = Image.new("RGBA", (W, 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rectangle((76, 8, 80, 32), fill=GOLD + (220,))
    d.text((92, 4), text, font=load_font_regular(26), fill=(229, 205, 150, 225))
    return np.asarray(layer, dtype=np.float32), CAP_Y + 280


def brand_layer(title: str, slogan: str, note: str = "") -> np.ndarray:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text((64, 140), title, font=load_font(42), fill=(255, 255, 255, 215))
    if slogan:
        d.text((64, 196), slogan, font=load_font_regular(27), fill=GOLD + (190,))
    if note:
        f = load_font_regular(28)
        d.text((W - 64 - d.textbbox((0, 0), note, font=f)[2], 150), note, font=f, fill=(255, 255, 255, 190))
    return np.asarray(layer, dtype=np.float32)


# ───────────────────────── 오디오 ─────────────────────────
def build_audio(path: Path, total: float, sfx: list, bgm: bool, bpm: int = 80, drops=(), style: str = "pulse", sr: int = 48000) -> None:
    """자리표시 BGM: pulse(80BPM 킥) | calm(드론+패드, 분석 톤). SFX: swoosh / ting / tick(주석 클릭)."""
    n = int(total * sr); t = np.arange(n) / sr
    mix = np.zeros(n); rng = np.random.default_rng(5)

    def add(i0: int, sig: np.ndarray):
        sig = sig[: max(0, n - i0)]
        mix[i0:i0 + len(sig)] += sig

    if bgm:
        if style == "pulse":
            beat = 60 / bpm
            for b in np.arange(0, total, beat):
                if any(a <= b < c for a, c in drops):
                    continue
                tt = np.arange(int(0.3 * sr)) / sr
                f = 150 * np.exp(-tt * 24) + 46
                add(int(b * sr), np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-tt * 13) * 0.9)
                hat = rng.standard_normal(int(0.035 * sr)) * np.exp(-np.arange(int(0.035 * sr)) / sr * 150) * 0.5
                add(int((b + beat / 2) * sr), np.diff(hat, prepend=0.0) * 0.35)
            env = 1 - 0.55 * np.exp(-((t % beat)) * 9)
            mix += np.sin(2 * np.pi * 41.2 * t) * 0.32 * env * (0.7 + 0.3 * np.sin(2 * np.pi * 0.09 * t))
            mix += np.sin(2 * np.pi * 82.4 * t) * 0.07 * env
        else:                                                   # calm: 저음 드론 + 느린 화성 + 패드
            mix += np.sin(2 * np.pi * 55.0 * t) * 0.22 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * t))
            mix += np.sin(2 * np.pi * 82.4 * t) * 0.06 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.031 * t + 1))
            mix += np.sin(2 * np.pi * 110.0 * t) * 0.03 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.023 * t + 2))
        spec = np.fft.rfft(rng.standard_normal(n)); fr = np.fft.rfftfreq(n, 1 / sr)
        spec *= 1 / np.maximum(fr, 30) ** 1.2; spec[fr > (900 if style == "pulse" else 600)] = 0
        pad = np.fft.irfft(spec, n); pad /= np.abs(pad).max() + 1e-9
        mix += pad * (0.10 if style == "pulse" else 0.16)
    for ts, kind in sfx:
        if kind == "swoosh":
            tt = np.arange(int(0.4 * sr)) / sr
            f = 300 + 2600 * (tt / 0.4) ** 2
            sig = rng.standard_normal(len(tt)) * np.sin(2 * np.pi * np.cumsum(f) / sr) * np.sin(np.pi * tt / 0.4) ** 2 * 0.55
        elif kind == "low":                                     # 반전 순간의 낮은 울림(드라마 톤)
            tt = np.arange(int(1.6 * sr)) / sr
            f = 70 * np.exp(-tt * 1.5) + 38
            sig = np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-tt * 2.2) * 0.5
        elif kind == "tick":
            tt = np.arange(int(0.05 * sr)) / sr
            sig = (np.sin(2 * np.pi * 1600 * tt) * np.exp(-tt * 180) + rng.standard_normal(len(tt)) * np.exp(-tt * 900) * 0.6) * 0.22
        else:
            tt = np.arange(int(0.9 * sr)) / sr
            sig = sum(a * np.sin(2 * np.pi * fq * tt) for fq, a in ((1320, 1.0), (2640, 0.35), (3960, 0.15))) * np.exp(-tt * 5.5) * 0.5
        add(int(ts * sr), sig)
    mix /= np.abs(mix).max() + 1e-9
    mix *= 0.7
    fi, fo = int(0.5 * sr), int(1.5 * sr)
    mix[:fi] *= np.linspace(0, 1, fi); mix[-fo:] *= np.linspace(1, 0, fo)
    write_wav(path, mix, sr)


# ───────────────────────── 렌더 ─────────────────────────
def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--episode", required=True, help="episodes/<slug>.py")
    ap.add_argument("--no-bgm", action="store_true", help="자리표시 BGM 제외(SFX만) — 인스타 트렌딩 BGM 얹을 업로드용")
    ap.add_argument("--seconds", type=float, default=0, help="앞 N초만 렌더(스모크 테스트)")
    ap.add_argument("--out", default="")
    args = ap.parse_args()
    ep = importlib.import_module(f"episodes.{args.episode}")
    out_dir = ROOT / "output" / args.episode
    out_dir.mkdir(parents=True, exist_ok=True)
    out = args.out or str(out_dir / (f"{args.episode}_sfx_only.mp4" if args.no_bgm else f"{args.episode}_preview_bgm.mp4"))
    total = ep.TOTAL
    t0 = time.time()
    ctx = SimpleNamespace(fetch=lambda key: fetch(key, ep.QUERIES, out_dir / "assets"), cover=cover, fiber=fiber, text_card=text_card,
                          GOLD=GOLD, load_font=load_font, load_font_regular=load_font_regular, W=W, H=H)
    src = ep.build_sources(ctx)
    marks = getattr(ep, "MARKS", {})
    gold_range = getattr(ep, "GOLD_CAPTIONS", (-1, -1))
    style = getattr(ep, "CAPTION_STYLE", "pill")
    editorial = style == "editorial"
    cap_fade = 0.0 if style == "clean" else 0.12                     # clean: 컷과 함께 즉시(깜빡임 없음)
    xfade = getattr(ep, "XFADE", 0.0)                               # 컷 사이 디졸브(초)
    end_cache: dict[int, np.ndarray] = {}
    brand = brand_layer(*ep.BRAND) if any(getattr(ep, "BRAND", ())) else None   # 브랜드 텍스트 없음이 기본
    caps = {}
    for i, cap in enumerate(ep.CAPTIONS):
        s, e, txt = cap[:3]; label = cap[3] if len(cap) > 3 else ""
        gold = gold_range[0] <= s < gold_range[1]
        caps[i] = (caption_layer_editorial(txt, label, big=(s < 4.0), gold=gold) if editorial
                   else caption_layer_clean(txt, gold=gold) if style == "clean" else caption_layer(txt, gold=gold))
    overlays = {i: overlay_layer(sh["overlay"], sh, src) for i, sh in enumerate(ep.SHOTS) if "overlay" in sh}
    cites = {i: cite_layer(sh["cite"]) for i, sh in enumerate(ep.SHOTS) if "cite" in sh}
    grains = [np.random.default_rng(i).normal(0, 4.5, (H, W, 1)).astype(np.float32) for i in range(6)]

    def blend(frame, layer, y0, a_scale=1.0):
        h = layer.shape[0]
        a = layer[..., 3:4] / 255 * a_scale
        frame[y0:y0 + h] = frame[y0:y0 + h] * (1 - a) + layer[..., :3] * a

    def frame_function(t: float) -> np.ndarray:
        fi = int(t * FPS)
        si = next((i for i, sh in enumerate(ep.SHOTS) if sh["start"] <= t < sh["end"]), len(ep.SHOTS) - 1)
        sh = ep.SHOTS[si]
        local = t - sh["start"]
        frame = np.asarray(render_shot(sh, src, marks, local, fi), dtype=np.float32)
        xf = sh.get("xfade", xfade)                                  # 컷별 디졸브 길이(막 전환은 길게)
        if xf and si > 0 and local < xf:                       # 디졸브: 앞 컷 마지막 프레임과 섞기
            if si - 1 not in end_cache:
                pv = ep.SHOTS[si - 1]
                end_cache[si - 1] = np.asarray(render_shot(pv, src, marks, pv["end"] - pv["start"] - 0.001, fi), dtype=np.float32)
            a = local / xf
            frame = end_cache[si - 1] * (1 - a) + frame * a
        frame = frame + grains[fi % 6]
        if si in overlays:
            blend(frame, overlays[si], 0, min(1.0, local / 0.3))
        ci = next((i for i, cap in enumerate(ep.CAPTIONS) if cap[0] <= t < cap[1]), None)
        if ci is not None:
            layer, y0 = caps[ci]
            blend(frame, layer, y0, 1.0 if cap_fade == 0 else min(1.0, (t - ep.CAPTIONS[ci][0]) / cap_fade))
        if si in cites:
            layer, y0 = cites[si]
            blend(frame, layer, y0, min(1.0, local / 0.3))
        if brand is not None:
            blend(frame, brand, 0)
        if t < 0.25:
            frame *= t / 0.25
        elif t > total - 0.3:
            frame *= max(0.0, (total - t) / 0.3)
        return np.clip(frame, 0, 255).astype(np.uint8)

    audio_path = out_dir / ("audio_sfx_only.wav" if args.no_bgm else "audio_bgm.wav")
    build_audio(audio_path, total, ep.SFX, bgm=not args.no_bgm, bpm=getattr(ep, "BPM", 80), drops=getattr(ep, "DROPS", ()),
                style=getattr(ep, "BGM_STYLE", "pulse"))
    from moviepy import AudioFileClip, VideoClip
    dur = min(total, args.seconds) if args.seconds else total
    video = VideoClip(frame_function, duration=dur).with_audio(AudioFileClip(str(audio_path)).with_duration(dur))
    log("render", f"{dur}s → {out}")
    video.write_videofile(out, fps=FPS, codec="libx264", audio_codec="aac", audio_fps=48000, bitrate="10000k",
                          preset="medium", threads=os.cpu_count() or 4,
                          ffmpeg_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart", "-profile:v", "high"], logger=None)
    (out_dir / "credits.json").write_text(json.dumps(CREDITS, ensure_ascii=False, indent=2), encoding="utf-8")
    log("done", f"{time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
