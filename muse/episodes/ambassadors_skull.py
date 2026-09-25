"""
episodes/ambassadors_skull.py — theclasssssic #2: 한스 홀바인 〈대사들〉(1533) — 진짜 주인공은 발밑의 해골
뼈대: 주제문("진짜 주인공은 두 남자가 아니다") → 성공의 증거 → 발밑의 얼룩 → 비스듬히 보면 해골(왜상, 화면에서 직접 펴 보임)
      → 주제문 회수 → 결론(죽음은 발밑에) → 두 번째 단서(커튼 뒤 십자가) → 여운 → 정적 → 루프
사실 확인(2026-09-24, National Gallery 공식 설명):
  - 왼쪽 장 드 댕트빌(프랑스 왕 프랑수아 1세의 대사, 두 번째 영국 파견), 오른쪽 라보르 주교 조르주 드 셀브. 라틴어 명문상 28세·24세. 1533년.
  - 두 사람 발 사이의 길쭉한 형태 = 왜상(anamorphosis) 해골, "그림 오른쪽 아래 구석에서 올려다봐야" 제대로 보임. 메멘토 모리.
  - 왼쪽 위 초록 커튼에 핀으로 꽂힌 십자가 — "구원의 보편적 희망을 표현하는 것일 수 있다"(공식 설명도 가능성으로 표현 → 영상은 질문형).
"""
import math

from PIL import Image, ImageDraw, ImageFilter

TOTAL = 59.0
BRAND = ("", "", "")
CAPTION_STYLE = "clean"
BGM_STYLE = "calm"
XFADE = 0.25
MOTION_BUDGET = 4
QUERIES = {"painting": "File:Hans Holbein the Younger - The Ambassadors - Google Art Project.jpg"}  # 3840px 썸네일로 캐시(원본 30000px)
PW, PH = 3840, 3784                       # 캐시된 원본 크기
PL, PR, PT, PB = 1000, 1000, 1000, 1800   # 여백 판(pad): 가장자리의 십자가·해골을 화면 중앙에 두기 위한 어두운 여백
BG = (10, 9, 12)
SKULL = ((0.23, 0.98), (0.72, 0.76))      # 왜상 해골의 긴 축(그림 정규좌표)


def PP(x, y):  # 그림 정규좌표 → 여백 판 정규좌표
    return ((x * PW + PL) / (PW + PL + PR), (y * PH + PT) / (PH + PT + PB))


P = {"dint": (0.235, 0.19), "selve": (0.845, 0.20), "chain": (0.27, 0.35), "instr": (0.55, 0.27), "shelf": (0.55, 0.61),
     "skull_l": (0.33, 0.94), "skull_r": (0.62, 0.81), "skull_c": (0.475, 0.87), "feet": (0.47, 0.80), "cross": (0.034, 0.096)}


def build_sources(ctx) -> dict:
    painting = ctx.fetch("painting")
    full = Image.new("RGB", (2160, 3840), BG)
    fit = painting.resize((2160, round(painting.height * 2160 / painting.width)), Image.Resampling.LANCZOS)
    full.paste(fit, (0, (3840 - fit.height) // 2))
    pad = Image.new("RGB", (PW + PL + PR, PH + PT + PB), BG)
    pad.paste(painting, (PL, PT))
    return {"painting": painting, "full": full, "pad": pad}


# ───────────── 왜상 해골 펴기: 얼룩을 비스듬한 시점으로 압축해 해골로 접는다 ─────────────
_BAND = {}


def _band(painting):
    if "rgba" not in _BAND:
        (ax, ay), (bx, by) = [(x * painting.width, y * painting.height) for x, y in SKULL]
        ang = math.degrees(math.atan2(ay - by, bx - ax))
        cx, cy = (ax + bx) / 2, (ay + by) / 2
        R = int(math.hypot(bx - ax, ay - by) * 0.62)
        box = (int(cx - R), int(cy - R), int(cx + R), int(cy + R))
        reg = painting.crop(box)
        inside = Image.new("L", painting.size, 255).crop(box)                     # 그림 바깥(크롭 패딩)은 투명 처리할 마스크
        rot = reg.rotate(-ang, resample=Image.Resampling.BICUBIC)                 # 해골 축을 수평으로
        rin = inside.rotate(-ang, resample=Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(40))
        crop_box = (0, int(R - 0.30 * R), 2 * R, int(R + 0.30 * R))
        band = rot.crop(crop_box).convert("RGBA")
        valid = rin.crop(crop_box)
        w, h = band.size
        alpha = Image.new("L", (w, h), 255); d = ImageDraw.Draw(alpha)
        fy, fx = int(h * 0.22), int(w * 0.06)
        for i in range(fy):                                                         # 위아래·양끝을 부드럽게 흐려 배경에 녹임
            v = int(255 * i / fy); d.line((0, i, w, i), fill=v); d.line((0, h - 1 - i, w, h - 1 - i), fill=v)
        side = Image.new("L", (w, h), 255); d2 = ImageDraw.Draw(side)
        for i in range(fx):
            v = int(255 * i / fx); d2.line((i, 0, i, h), fill=v); d2.line((w - 1 - i, 0, w - 1 - i, h), fill=v)
        import numpy as np
        a = np.minimum(np.minimum(np.asarray(alpha), np.asarray(side)), np.asarray(valid))
        band.putalpha(Image.fromarray(a.astype("uint8")))
        _BAND.update(rgba=band, ang=ang)
    return _BAND["rgba"], _BAND["ang"]


def anamorph(src, p, local):
    band, ang = _band(src["painting"])
    q = min(1.0, p / 0.35); q = q * q * (3 - 2 * q)                                   # 앞 35%: 접히기, 나머지: 해골 정지 + 아주 느린 밀기
    k = 1 - (1 - 0.17) * q                                                            # 비스듬한 시점의 압축비
    s0 = 1080 / ((PW + PL + PR) / 2.65)                                               # 직전 컷(여백 판 z=2.65)과 같은 배율에서 시작
    w_end, h_end = band.width * 0.17, band.height
    s1 = min(980 / w_end, 1050 / h_end)
    s = (s0 + (s1 - s0) * q) * (1 + 0.05 * max(0.0, (p - 0.35) / 0.65))
    sq = band.resize((max(8, int(band.width * k * s)), max(8, int(band.height * s))), Image.Resampling.BILINEAR)
    out = sq.rotate(ang * (1 - q), resample=Image.Resampling.BICUBIC, expand=True)    # 원래 기울기 → 수평(똑바로 선 해골)
    canvas = Image.new("RGB", (1080, 1920), BG)
    cy = 960 + (820 - 960) * q
    canvas.paste(out, (int(540 - out.width / 2), int(cy - out.height / 2)), out)
    return canvas


def S(t, src, dur, **kw):  # noqa: E741
    return {"start": t, "end": t + dur, "src": src, **kw}

SHOTS = [  # 12컷 / 59초. 이동 4회: 목걸이→천문도구, 얼룩 훑기, 해골 펴기, 십자가로.
    S(0.0, "full", 4.0, z=(1.0, 1.0)),                                                          # 주제문: 그림 전체
    S(4.0, "painting", 3.5, z=(4.0, 4.0), f=(P["dint"], P["dint"])),                            # 왼쪽: 28세 대사
    S(7.5, "painting", 3.5, z=(4.0, 4.0), f=(P["selve"], P["selve"])),                          # 오른쪽: 24세 주교
    S(11.0, "painting", 4.0, path=[(*P["chain"], 3.4), (*P["chain"], 3.4), (*P["instr"], 3.0), (*P["instr"], 3.0)],
      path_times=[0.0, 0.12, 0.55, 1.0]),                                                        # 모피·금목걸이 → 하늘을 재는 도구
    S(15.0, "painting", 3.5, z=(2.8, 2.8), f=(P["shelf"], P["shelf"])),                          # 지구본·류트·책
    S(18.5, "full", 3.5, z=(1.12, 1.12)),                                                        # 두 사람 전체
    S(22.0, "pad", 10.5, xfade=0.6,                                                              # 발밑의 얼룩을 따라 훑고, 가운데에서 멈춤
      path=[(*PP(*P["skull_l"]), 3.4), (*PP(*P["skull_r"]), 3.4), (*PP(*P["skull_c"]), 2.65)], path_times=[0.0, 0.6, 1.0]),
    S(32.5, "painting", 8.0, render=anamorph),                                                   # 얼룩이 접혀 해골이 된다
    S(40.5, "pad", 4.5, z=(2.0, 2.0), f=(PP(*P["feet"]), PP(*P["feet"]))),                       # 두 사람의 발과 해골
    S(45.0, "pad", 7.0, path=[(*PP(0.35, 0.45), 3.0), (*PP(0.35, 0.45), 3.0), (*PP(*P["cross"]), 10.0), (*PP(*P["cross"]), 10.0)],
      path_times=[0.0, 0.10, 0.48, 1.0]),                                                        # 왼쪽 위 커튼 뒤 십자가로
    S(52.0, "full", 6.7, z=(1.0, 1.0), xfade=0.6),                                               # 여운 → 정적 → 루프
    S(TOTAL - 0.3, "full", 0.3, z=(1.0, 1.0)),                                                   # 정지 꼬리(이음새)
]

CAPTIONS = [  # 첫 문장 = 주제문. 37초에 "진짜 주인공은 이 해골이었다"로 회수. 각 자막 3.5~4.5초.
    (0.0, 4.0, "이 초상화의 진짜 주인공은\n두 남자가 아니다."),
    (4.0, 7.5, "스물여덟 살의\n프랑스 대사,"),
    (7.5, 11.0, "스물네 살의 주교."),
    (11.0, 15.0, "값비싼 모피와 금 목걸이,\n하늘을 재는 도구들."),
    (15.0, 18.5, "지구본과 악기,\n책까지."),
    (18.5, 22.0, "모든 게 두 사람의 성공을\n말하는 것 같다."),
    (22.0, 25.5, "그런데 두 사람 발밑에,\n이상한 얼룩 하나."),
    (25.5, 29.0, "정면에서 보면\n무엇인지 알 수 없다."),
    (29.0, 32.5, "그림 오른쪽 아래에서\n비스듬히 올려다보면,"),
    (32.5, 37.0, "해골이 나타난다."),
    (37.0, 40.5, "진짜 주인공은\n이 해골이었다."),
    (40.5, 45.0, "아무리 젊고 가진 게 많아도,\n죽음은 늘 발밑에 있다."),
    (45.0, 48.5, "그런데 화가는\n하나를 더 숨겨 두었다."),
    (48.5, 52.0, "왼쪽 위 커튼 뒤,\n작은 십자가."),
    (52.0, 56.0, "죽음 곁에\n희망도 걸어 둔 걸까."),
]
SFX = [(32.5, "low")]   # 해골이 나타나는 순간 한 번
