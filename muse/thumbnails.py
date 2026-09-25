#!/usr/bin/env python3
"""
thumbnails.py — 릴스 썸네일(커버) 생성기. 영상 렌더와 별개, review.py 대상 아님(육안 확인).
두 컨셉: museum(미술관에 몰린 인파) / billboard(도시 전광판에 송출).

  .venv/bin/python thumbnails.py --episode arnolfini_mirror --style museum
  .venv/bin/python thumbnails.py --episode arnolfini_mirror --style billboard
  .venv/bin/python thumbnails.py --episode arnolfini_mirror --style both   # 기본
"""
from __future__ import annotations

import argparse
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from vd_engine import GOLD, H, W, cover, load_font, load_font_regular, wrap_chars

ROOT = Path(__file__).resolve().parent


def vgrad(h: int, top, bot) -> np.ndarray:
    t = np.linspace(0, 1, h)[:, None, None]
    return (np.array(top) * (1 - t) + np.array(bot) * t).astype(np.float32)


def glow(canvas: np.ndarray, cx: int, cy: int, rx: int, ry: int, color, strength: float) -> np.ndarray:
    h, w = canvas.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
    a = np.clip(1 - d, 0, 1)[..., None] ** 1.6 * strength
    return canvas * (1 - a) + np.array(color, dtype=np.float32) * a


def framed_painting(painting: Image.Image, target_w: int, target_h: int, bevel=26, mat=0):
    """액자: 베벨 있는 금색 프레임(+선택 매트) 안에 그림을 cover로 채움."""
    inner_w, inner_h = target_w - 2 * (bevel + mat), target_h - 2 * (bevel + mat)
    art = cover(painting, inner_w, inner_h)
    frame = Image.new("RGB", (target_w, target_h), (18, 14, 10))
    d = ImageDraw.Draw(frame)
    shades = [(168, 132, 62), (214, 178, 104), (140, 106, 46), (232, 202, 140), (120, 90, 38)]
    for i, col in enumerate(shades):
        inset = int(bevel * i / len(shades))
        d.rectangle((inset, inset, target_w - 1 - inset, target_h - 1 - inset), outline=col, width=max(2, bevel // len(shades) + 1))
    if mat:
        d.rectangle((bevel, bevel, target_w - 1 - bevel, target_h - 1 - bevel), fill=(235, 230, 218))
    frame.paste(art, (bevel + mat, bevel + mat))
    return frame


def scatter_stars(canvas: np.ndarray, n: int, y_max: int, seed: int):
    rng = np.random.default_rng(seed)
    h, w = canvas.shape[:2]
    for _ in range(n):
        x, y = rng.integers(0, w), rng.integers(0, y_max)
        b = rng.uniform(80, 220)
        canvas[y, x] = np.minimum(255, canvas[y, x] + b)
    return canvas


# ───────────────────────── museum: 미술관 벽 + 몰린 인파(뒷모습) ─────────────────────────
def make_museum(painting: Image.Image, seed: int = 7) -> Image.Image:
    canvas = vgrad(H, (210, 202, 186), (96, 88, 74))[:, 0, :]
    canvas = np.tile(canvas[:, None, :], (1, W, 1))
    canvas = glow(canvas, W // 2, 210, 560, 420, (255, 248, 226), 0.55)

    fw, fh = 740, 980
    frame = framed_painting(painting, fw, fh, bevel=30)
    base = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8))
    fx, fy = (W - fw) // 2, 190
    shadow = Image.new("L", (fw + 90, fh + 90), 0)
    ImageDraw.Draw(shadow).ellipse((10, fh, fw + 80, fh + 90), fill=110)
    shadow = shadow.filter(ImageFilter.GaussianBlur(30))
    base.paste((20, 16, 12), (fx - 45, fy - 45), shadow)
    base.paste(frame, (fx, fy))
    d = ImageDraw.Draw(base)
    py = fy + fh + 26
    d.rounded_rectangle((fx + fw // 2 - 130, py, fx + fw // 2 + 130, py + 46), radius=4, fill=(30, 26, 20), outline=GOLD, width=2)

    arr = np.asarray(base, dtype=np.float32)
    rng = np.random.default_rng(seed)
    crowd_top = py + 90
    rows = [(crowd_top, H, 30, 0.55, 1.0), (crowd_top - 60, crowd_top + 260, 20, 0.35, 0.72),
            (crowd_top - 130, crowd_top + 120, 14, 0.22, 0.5)]
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    for y0, y1, n, dark, scale in rows:
        xs = np.sort(rng.uniform(-40, W + 40, n))
        for x in xs:
            hh = rng.uniform(200, 340) * scale
            ww = hh * rng.uniform(0.42, 0.58)
            y = rng.uniform(y0, y1)
            tone = int(14 + dark * rng.uniform(0, 10))
            col = (tone, tone, tone + int(4 * dark))
            head_r = ww * 0.30
            ld.ellipse((x - head_r, y, x + head_r, y + head_r * 2), fill=col + (255,))
            ld.rounded_rectangle((x - ww / 2, y + head_r * 1.7, x + ww / 2, y + hh), radius=ww * 0.22, fill=col + (255,))
            if rng.random() < 0.16 * scale:
                px, py2 = x + rng.uniform(-ww * 0.3, ww * 0.3), y - head_r * 0.5
                ld.rounded_rectangle((px - 9, py2 - 26, px + 9, py2 + 4), radius=3, fill=(8, 8, 10, 255))
                ld.ellipse((px - 12, py2 - 30, px + 12, py2 - 6), fill=(255, 255, 255, 40))
    layer = layer.filter(ImageFilter.GaussianBlur(0.6))
    larr = np.asarray(layer, dtype=np.float32)
    a = larr[..., 3:4] / 255
    arr = arr * (1 - a) + larr[..., :3] * a
    floor_fade = np.clip((np.arange(H) - (H - 260)) / 260, 0, 1)[:, None, None]
    arr = arr * (1 - floor_fade * 0.35) + np.array([6, 5, 6]) * (floor_fade * 0.35)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


# ───────────────────────── billboard: 야간 도시 전광판 ─────────────────────────
def make_billboard(painting: Image.Image, seed: int = 3) -> Image.Image:
    sky = vgrad(1150, (10, 10, 26), (36, 24, 46))[:, 0, :]
    canvas = np.zeros((H, W, 3), dtype=np.float32)
    canvas[:1150] = np.tile(sky[:, None, :], (1, W, 1))
    canvas[1150:] = np.array([8, 8, 12])
    canvas = scatter_stars(canvas, 90, 300, seed)

    rng = np.random.default_rng(seed)
    img = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    x = 0
    while x < W:
        bw = int(rng.uniform(70, 170))
        bh = int(rng.uniform(260, 780))
        top = 1150 - bh
        tone = int(rng.uniform(8, 20))
        d.rectangle((x, top, x + bw, 1160), fill=(tone, tone, tone + 4))
        for wy in range(top + 20, 1140, int(rng.uniform(26, 40))):
            for wx in range(x + 8, x + bw - 8, int(rng.uniform(20, 30))):
                if rng.random() < 0.5:
                    lit = [(255, 214, 130), (150, 200, 255), (255, 255, 255)][rng.integers(3)]
                    d.rectangle((wx, wy, wx + 9, wy + 12), fill=lit)
        x += bw + int(rng.uniform(4, 14))
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    arr = np.asarray(img, dtype=np.float32)

    bw, bh = 860, 1140
    bx, by = (W - bw) // 2, 300
    bez = 30
    board = Image.new("RGB", (bw, bh), (6, 6, 8))
    ImageDraw.Draw(board).rectangle((0, 0, bw - 1, bh - 1), outline=(60, 60, 66), width=6)
    art = cover(painting, bw - 2 * bez, bh - 2 * bez)
    board.paste(art, (bez, bez))
    barr = np.asarray(board, dtype=np.float32)
    scan = (np.sin(np.arange(bh) * math.pi) * 0 + 1.0)
    scan[::3] *= 0.90
    barr *= scan[:, None, None]

    canvas2 = arr.copy()
    canvas2 = glow(canvas2, bx + bw // 2, by + bh // 2, bw * 0.85, bh * 0.7, tuple(np.mean(art.resize((1, 1)), axis=(0, 1)).astype(int)) if False else (200, 190, 255), 0.16)
    canvas2[by:by + bh, bx:bx + bw] = barr
    glow_img = Image.fromarray(np.clip(canvas2, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0))
    base = np.asarray(glow_img, dtype=np.float32)

    halo = np.zeros_like(base)
    halo[by:by + bh, bx:bx + bw] = barr
    halo_img = Image.fromarray(np.clip(halo, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(70))
    harr = np.asarray(halo_img, dtype=np.float32)
    base = np.clip(base + harr * 0.22, 0, 255)

    frame_col = np.array([16, 16, 20], dtype=np.float32)
    fr = np.zeros((H, W), dtype=np.float32)
    t = bez
    fr[by - t:by, bx - t:bx + bw + t] = 1; fr[by + bh:by + bh + t, bx - t:bx + bw + t] = 1
    fr[by - t:by + bh + t, bx - t:bx] = 1; fr[by - t:by + bh + t, bx + bw:bx + bw + t] = 1
    base = base * (1 - fr[..., None]) + frame_col * fr[..., None]

    refl = np.zeros((H, W, 3), dtype=np.float32)
    for i, yy in enumerate(range(by, by + bh)):
        sy = 1150 + (bh - i) * (770 / bh)
        if 1150 <= sy < H:
            refl[int(sy), bx:bx + bw] = base[yy, bx:bx + bw] * 0.5
    refl_img = Image.fromarray(np.clip(refl, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))
    rarr = np.asarray(refl_img, dtype=np.float32)
    street_fade = np.clip((np.arange(H) - 1150) / 250, 0, 1)[:, None, None]
    base[1150:] = base[1150:] * (1 - street_fade[1150:] * 0.55) + rarr[1150:] * 0.9

    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    xs = np.sort(rng.uniform(60, W - 60, 22))
    for x in xs:
        hh = rng.uniform(70, 118)
        ww = hh * 0.42
        y = H - rng.uniform(40, 130)
        col = (5, 5, 7, 255)
        ld.ellipse((x - ww * 0.3, y - hh, x + ww * 0.3, y - hh + ww * 0.6), fill=col)
        ld.rounded_rectangle((x - ww / 2, y - hh * 0.62, x + ww / 2, y), radius=ww * 0.2, fill=col)
    larr = np.asarray(layer, dtype=np.float32); a = larr[..., 3:4] / 255
    base = base * (1 - a) + larr[..., :3] * a
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))


# ───────────────────────── photoreal: Fal Flux img2img로 배경만 실사화, 실제 그림은 그대로 합성 ─────────────────────────
PROMPTS = {
    "museum": ("editorial documentary photograph of a crowded art museum gallery, warm golden-hour spotlight "
               "glow on a large gilded picture frame on the wall, dozens of museum visitors seen from behind in "
               "silhouette, some holding up phones, polished wood floor with soft reflections, shallow depth of "
               "field, 35mm film photography, Getty Images editorial style, photorealistic, highly detailed"),
    "billboard": ("cinematic night photograph of a rainy city street, a massive glowing LED billboard mounted on "
                  "a building, neon light reflections on wet asphalt, illuminated skyscraper windows, small crowd "
                  "of pedestrians looking up in silhouette, moody blue and purple color grade, photorealistic "
                  "street photography, high detail, 50mm lens"),
}


async def _photoreal_async(mockup: Image.Image, prompt: str, strength: float) -> Image.Image:
    import io
    import fal_client
    buf = io.BytesIO(); mockup.save(buf, format="JPEG", quality=95); buf.seek(0)
    handle = await fal_client.upload_async(buf.read(), content_type="image/jpeg")
    result = await fal_client.run_async("fal-ai/flux/dev/image-to-image", arguments={
        "prompt": prompt, "image_url": handle, "strength": strength,
        "num_inference_steps": 32, "guidance_scale": 3.5, "output_format": "jpeg"})
    import urllib.request
    with urllib.request.urlopen(result["images"][0]["url"], timeout=120) as r:
        data = r.read()
    return Image.open(io.BytesIO(data)).convert("RGB")


def make_artist_mockup(painting: Image.Image, seed: int = 11):
    """화가가 그림을 들고 선 대략적인 스캐폴드(상체 전부 + 가슴 높이로 든 그림 + 양옆 거리 건물). Flux가 이 구도만 참고해 새로 그린다."""
    canvas = vgrad(H, (176, 158, 130), (120, 104, 80))[:, 0, :]                    # 낮 거리 톤(placeholder, Flux가 새로 그림)
    img = Image.fromarray(np.clip(np.tile(canvas[:, None, :], (1, W, 1)), 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    rng = np.random.default_rng(seed)
    for x, bw, tone in ((-40, 380, 30), (760, 380, 24)):                          # 인물 좌우로 여백을 남겨 거리 건물 배치
        d.rectangle((x, 260, x + bw, H), fill=(int(70 + tone), int(58 + tone), int(44 + tone)))
        for wy in range(320, H - 60, 150):
            for wx in range(x + 30, x + bw - 30, 90):
                d.rectangle((wx, wy, wx + 46, wy + 70), fill=(38, 30, 24))         # 격자창(어두운 구멍) — Flux가 목조 건물로 재해석
        d.polygon([(x, 260), (x + bw // 2, 150), (x + bw, 260)], fill=(56, 44, 34))  # 박공지붕 실루엣
    d.rectangle((0, H - 140, W, H), fill=(96, 88, 76))                             # 자갈길 바닥 톤
    skin, robe = (196, 168, 140), (58, 30, 30)
    d.ellipse((452, 90, 628, 340), fill=skin)                                       # 머리(더 크게 — 이목구비가 들어갈 자리)
    d.ellipse((488, 200, 520, 222), fill=(60, 45, 40)); d.ellipse((560, 200, 592, 222), fill=(60, 45, 40))  # 눈
    d.line((540, 225, 532, 260), fill=(150, 120, 100), width=4)                     # 코
    d.arc((505, 275, 575, 305), 20, 160, fill=(110, 70, 65), width=5)               # 입
    d.line((470, 195, 510, 185), fill=(90, 65, 55), width=4); d.line((610, 195, 570, 185), fill=(90, 65, 55), width=4)  # 눈썹
    d.polygon([(390, 430), (690, 430), (760, 1920), (320, 1920)], fill=robe)       # 몸통(어깨~하단, 상체 전부 프레임 안)
    d.polygon([(405, 470), (330, 890), (425, 1390), (490, 890)], fill=robe)        # 왼팔
    d.polygon([(675, 470), (750, 890), (655, 1390), (595, 890)], fill=robe)        # 오른팔
    pw = 600
    ph = round(pw * painting.height / painting.width)
    px, py = (W - pw) // 2, 700
    d.rectangle((px - 24, py - 24, px + pw + 24, py + ph + 24), fill=(40, 26, 16))  # 나무 액자 placeholder
    img.paste(cover(painting, pw, ph), (px, py))
    d.ellipse((px - 44, py + ph - 66, px + 16, py + ph + 24), fill=skin)            # 왼손
    d.ellipse((px + pw - 16, py + ph - 66, px + pw + 44, py + ph + 24), fill=skin)  # 오른손
    return img, (px - 24, py - 24, pw + 48, ph + 48)


def make_artist_mockup_real(painting: Image.Image, bg_photo_path: str):
    """실제 브뤼헤 건물 파사드 사진(좌우)을 양옆에 배치 + 화가 placeholder(중앙). 배경 자체가 실제 세계 기반."""
    src = Image.open(bg_photo_path).convert("RGB")
    sw, sh = src.size
    left = src.crop((0, 0, int(sw * 0.216), int(sh * 0.80))).resize((380, 1780), Image.Resampling.LANCZOS)
    right = src.crop((int(sw * 0.783), 0, sw, int(sh * 0.80))).resize((380, 1780), Image.Resampling.LANCZOS)
    img = Image.new("RGB", (W, H), (176, 158, 130))
    img.paste(left, (-40, 0)); img.paste(right, (760, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((360, 10, 560, 90), fill=(200, 192, 176))                            # 구름 — 위쪽 빈 하늘의 텍스트 환각 방지
    d.ellipse((520, 0, 740, 70), fill=(195, 187, 170))
    d.rectangle((0, H - 140, W, H), fill=(96, 88, 76))                             # 자갈길 바닥 톤(하단 현대 요소 가림)
    skin, robe = (196, 168, 140), (58, 30, 30)
    d.ellipse((452, 90, 628, 340), fill=skin)
    d.ellipse((488, 200, 520, 222), fill=(60, 45, 40)); d.ellipse((560, 200, 592, 222), fill=(60, 45, 40))
    d.line((540, 225, 532, 260), fill=(150, 120, 100), width=4)
    d.arc((505, 275, 575, 305), 20, 160, fill=(110, 70, 65), width=5)
    d.line((470, 195, 510, 185), fill=(90, 65, 55), width=4); d.line((610, 195, 570, 185), fill=(90, 65, 55), width=4)
    d.polygon([(400, 300), (700, 300), (780, 1920), (300, 1920)], fill=robe)        # 목 바로 아래부터 로브(빈 배경 갭 없음)
    d.polygon([(415, 340), (330, 890), (425, 1390), (490, 890)], fill=robe)
    d.polygon([(685, 340), (750, 890), (655, 1390), (595, 890)], fill=robe)
    pw = 600
    ph = round(pw * painting.height / painting.width)
    px, py = (W - pw) // 2, 650
    d.rectangle((px - 24, py - 24, px + pw + 24, py + ph + 24), fill=(40, 26, 16))
    img.paste(cover(painting, pw, ph), (px, py))
    d.ellipse((px - 44, py + ph - 66, px + 16, py + ph + 24), fill=skin)
    d.ellipse((px + pw - 16, py + ph - 66, px + pw + 44, py + ph + 24), fill=skin)
    return img, (px - 24, py - 24, pw + 48, ph + 48)


def wood_framed(painting: Image.Image, w: int, h: int, bevel: int = 22) -> Image.Image:
    """작가가 들고 있는 그림용 소박한 나무 액자(시대에 안 맞는 금박 미술관 액자 대신)."""
    board = Image.new("RGB", (w, h), (40, 26, 16))
    board.paste(cover(painting, w - 2 * bevel, h - 2 * bevel), (bevel, bevel))
    ImageDraw.Draw(board).rectangle((0, 0, w - 1, h - 1), outline=(70, 46, 26), width=4)
    return board


def screen_framed(painting: Image.Image, w: int, h: int, bezel: int = 26) -> Image.Image:
    """전광판용: 금색 액자가 아니라 얇은 검은 베젤 — 화면(스크린)처럼 보이게."""
    board = Image.new("RGB", (w, h), (6, 6, 8))
    ImageDraw.Draw(board).rectangle((0, 0, w - 1, h - 1), outline=(60, 60, 66), width=6)
    board.paste(cover(painting, w - 2 * bezel, h - 2 * bezel), (bezel, bezel))
    return board


def make_photoreal(style: str, painting: Image.Image, strength: float = 0.6, prompt: str | None = None) -> Image.Image:
    """PIL 목업(구도 고정) → Flux img2img로 배경(+artist는 인물도)을 실사화 → 진짜 그림을 원래 자리에 다시 합성(작품 자체는 항상 원본 그대로)."""
    import asyncio
    if style == "museum":
        mockup = make_museum(painting)
        fw, fh, fx, fy = 740, 980, (W - 740) // 2, 190
        frame = framed_painting(painting, fw, fh, bevel=30)
    elif style == "billboard":
        mockup = make_billboard(painting)
        fw, fh, fx, fy = 860, 1140, (W - 860) // 2, 300
        frame = screen_framed(painting, fw, fh, bezel=30)
    else:  # artist
        mockup, (fx, fy, fw, fh) = make_artist_mockup(painting)
        frame = wood_framed(painting, fw, fh, bevel=24)
    bg = asyncio.run(_photoreal_async(mockup, prompt or PROMPTS[style], strength))
    bg = cover(bg, W, H)
    if style == "billboard":                                    # 화면 발광(bloom) — 스크린처럼 주변에 빛 번짐
        halo = Image.new("RGB", (W, H), (0, 0, 0))
        halo.paste(frame, (fx, fy))
        harr = np.asarray(halo.filter(ImageFilter.GaussianBlur(55)), dtype=np.float32)
        bg = Image.fromarray(np.clip(np.asarray(bg, dtype=np.float32) + harr * 0.35, 0, 255).astype(np.uint8))
    else:
        shadow = Image.new("L", (fw + 90, fh + 90), 0)
        ImageDraw.Draw(shadow).ellipse((10, fh, fw + 80, fh + 90), fill=120)
        shadow = shadow.filter(ImageFilter.GaussianBlur(30))
        bg.paste((10, 8, 8), (fx - 45, fy - 45), shadow)
    bg.paste(frame, (fx, fy))
    return bg


# ───────────────────────── lens: 돋보기 썸네일 (실제 그림만 사용, API 비용 없음, 항상 같은 결과) ─────────────────────────
SAFE_TOP, SAFE_H = 240, 1440   # 인스타 피드 격자가 보여주는 가운데 3:4 안전 영역(1080x1440) — 렌즈·문구는 이 안에


def lens_crop(painting: Image.Image, fx: float, fy: float, zoom: float, size: int) -> Image.Image:
    """painting의 (fx,fy) 정규좌표를 중심으로 zoom배 확대한 정사각형을 size로 리사이즈."""
    side = min(painting.width, painting.height) / zoom
    cx, cy = fx * painting.width, fy * painting.height
    x0 = min(max(cx - side / 2, 0), painting.width - side)
    y0 = min(max(cy - side / 2, 0), painting.height - side)
    return painting.crop((int(x0), int(y0), int(x0 + side), int(y0 + side))).resize((size, size), Image.Resampling.LANCZOS)


def make_lens(painting: Image.Image, fx: float, fy: float, zoom: float, caption: str = "",
              lens_content: Image.Image | None = None, cx: int = 540, cy: int = 780, r: int = 320) -> Image.Image:
    """전체 그림을 어둡게 깔고, 금테 원형 렌즈 안에 디테일을 확대해서 보여준다. lens_content를 주면 그걸 원 안에 쓴다(해골 등)."""
    bg = cover(painting, W, H)
    arr = np.asarray(bg, dtype=np.float32) * 0.5
    canvas = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    content = lens_content or lens_crop(painting, fx, fy, zoom, r * 2)
    if content.size != (r * 2, r * 2):
        content = content.resize((r * 2, r * 2), Image.Resampling.LANCZOS)
    mask = Image.new("L", (r * 2, r * 2), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, r * 2 - 1, r * 2 - 1), fill=255)
    shadow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shadow).ellipse((cx - r - 14, cy - r - 6, cx + r + 14, cy + r + 26), fill=130)
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    canvas.paste((6, 5, 4), (0, 0), shadow)
    canvas.paste(content, (cx - r, cy - r), mask)
    d = ImageDraw.Draw(canvas)
    for i, w in enumerate((10, 4)):
        col = (86, 62, 28) if i == 0 else GOLD
        d.ellipse((cx - r - (10 - i * 4), cy - r - (10 - i * 4), cx + r + (10 - i * 4), cy + r + (10 - i * 4)), outline=col, width=w)
    if caption:
        font = load_font(64)
        lines = wrap_chars(caption, 12)
        lh = 84
        ty = SAFE_TOP + SAFE_H - 70 - lh * len(lines)
        for i, line in enumerate(lines):
            tw = d.textbbox((0, 0), line, font=font, stroke_width=8)[2]
            d.text(((W - tw) / 2, ty + i * lh), line, font=font, fill=(255, 255, 255), stroke_width=8, stroke_fill=(0, 0, 0))
    return canvas


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--episode", required=True)
    ap.add_argument("--style", choices=["museum", "billboard", "artist", "both"], default="both")
    ap.add_argument("--photoreal", action="store_true", help="Fal Flux img2img로 배경 실사화(유료, FAL_KEY 필요)")
    ap.add_argument("--strength", type=float, default=0.6, help="photoreal 재구성 강도(0=원본 유지, 1=거의 무시)")
    a = ap.parse_args()
    painting = Image.open(ROOT / "output" / a.episode / "assets" / "painting.jpg").convert("RGB")
    out_dir = ROOT / "output" / a.episode
    styles = ["museum", "billboard"] if a.style == "both" else [a.style]
    for s in styles:
        if a.photoreal:
            out = make_photoreal(s, painting, strength=a.strength)
            path = out_dir / f"thumb_{s}_photoreal.jpg"
        else:
            out = make_museum(painting) if s == "museum" else make_billboard(painting)
            path = out_dir / f"thumb_{s}.jpg"
        out.save(path, quality=93)
        print(f"{s} -> {path}")


if __name__ == "__main__":
    main()
