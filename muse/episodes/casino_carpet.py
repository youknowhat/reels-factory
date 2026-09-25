"""
episodes/casino_carpet.py — [보관용] 구 '시각 탐정' 실험작 — 채널 컨셉 변경으로 사용 안 함: 카지노 바닥 카펫
렌더: .venv/bin/python vd_engine.py --episode casino_carpet --no-bgm
"""
import math

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

TOTAL = 59.6
BRAND = ("시각 탐정", "알고 나면 다르게 보이는 시각적 디테일", "관찰 노트 No.01")
CAPTION_STYLE = "editorial"             # 왼쪽 정렬 로어서드 + 섹션 라벨 + 인용 슬롯
BGM_STYLE = "calm"                       # 분석 톤: 드론+패드 (킥 없음)
BPM, DROPS = 80, [(43.0, 44.5)]          # 인사이트 진입에서 드럼 한 박 드롭
GOLD_CAPTIONS = (41.5, 50.5)
MOTION_BUDGET = 5                        # 60초당 카메라 이동 허용 횟수             # 인사이트 구간 자막은 골드
QUERIES = {                              # Wikimedia Commons 검색어(영어), 앞에서부터 시도
    "floor": ["casino floor slot machines interior Las Vegas"],
    "slots": ["slot machines row casino"],
    "lobby": ["hotel lobby interior", "hotel lobby carpet"],
    "crowd": ["Bellagio casino interior", "casino floor slot machines interior Las Vegas"],
}
MARKS = {"stain": (0.5, 0.55), "burn": (0.42, 0.62), "gum": (0.58, 0.50)}   # 플레이트 정규좌표


# ───────────── 절차 생성 소스 ─────────────
def gen_carpet(fiber, size=(3240, 5760), seed=7) -> Image.Image:
    """눈 아픈 카지노 카펫: 보라 바탕 + 금/주황/청록/초록/자주 메달리온·소용돌이·별."""
    rng = np.random.default_rng(seed)
    pal = [(214, 164, 48), (226, 88, 34), (22, 150, 140), (56, 168, 70), (196, 44, 120), (240, 224, 180), (180, 30, 40)]
    img = Image.new("RGB", size, (58, 18, 78))
    d = ImageDraw.Draw(img)
    step = 640
    th = np.linspace(0, 2 * math.pi, 140)
    for gy in range(-1, size[1] // step + 2):
        for gx in range(-1, size[0] // step + 2):
            cx = gx * step + step / 2 + (step / 2 if gy % 2 else 0) + rng.uniform(-70, 70)
            cy = gy * step + step / 2 + rng.uniform(-70, 70)
            k = int(rng.choice([4, 5, 6, 8]))
            rot = rng.uniform(0, math.pi)
            for R, col in ((300, pal[0]), (215, pal[2]), (135, pal[1]), (62, pal[5])):
                r = R * (0.55 + 0.45 * np.cos(k * th))
                d.polygon(list(zip(cx + r * np.cos(th + rot), cy + r * np.sin(th + rot))), fill=col)
    for _ in range(170):
        x, y, a = rng.uniform(0, size[0]), rng.uniform(0, size[1]), rng.uniform(0, 2 * math.pi)
        tt = np.linspace(0, 6.8, 80)
        r = 36 + 28 * tt
        d.line(list(zip(x + r * np.cos(a + tt), y + r * np.sin(a + tt))), fill=pal[int(rng.integers(len(pal)))],
               width=int(rng.integers(14, 32)), joint="curve")
    for _ in range(1100):
        x, y, r = rng.uniform(0, size[0]), rng.uniform(0, size[1]), rng.uniform(16, 44)
        col = pal[int(rng.integers(len(pal)))]
        if rng.random() < 0.5:
            pts = [(x + (r if i % 2 == 0 else r * 0.42) * math.cos(i * math.pi / 5 - math.pi / 2),
                    y + (r if i % 2 == 0 else r * 0.42) * math.sin(i * math.pi / 5 - math.pi / 2)) for i in range(10)]
        else:
            pts = [(x, y - r), (x + r * 0.6, y), (x, y + r), (x - r * 0.6, y)]
        d.polygon(pts, fill=col)
    return fiber(img.filter(ImageFilter.GaussianBlur(1.2)), rng)


def gen_beige(fiber, size=(3240, 5760), seed=3) -> Image.Image:
    rng = np.random.default_rng(seed)
    img = Image.new("RGB", size, (198, 180, 150))
    d = ImageDraw.Draw(img)
    for y in range(0, size[1], 96):
        for x in range(0, size[0], 96):
            ox = 48 if (y // 96) % 2 else 0
            d.polygon([(x + ox, y - 22), (x + ox + 22, y), (x + ox, y + 22), (x + ox - 22, y)], fill=(178, 160, 130))
    return fiber(img.filter(ImageFilter.GaussianBlur(1.0)), rng, 6)


def add_marks(carpet: Image.Image, alpha: int = 70, spots: bool = True) -> Image.Image:
    """음료 얼룩(무늬에 묻힘) + (spots) 담배 자국 + 껌 자국."""
    w, h = carpet.size
    layer = Image.new("RGBA", carpet.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    sx, sy = MARKS["stain"][0] * w, MARKS["stain"][1] * h
    rng = np.random.default_rng(11)
    for _ in range(14):
        ox, oy, r = rng.uniform(-160, 160), rng.uniform(-120, 120), rng.uniform(90, 210)
        d.ellipse((sx + ox - r, sy + oy - r * 0.7, sx + ox + r, sy + oy + r * 0.7), fill=(60, 34, 16, alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(28))
    if spots:
        d = ImageDraw.Draw(layer)
        bx, by = MARKS["burn"][0] * w, MARKS["burn"][1] * h
        d.ellipse((bx - 46, by - 46, bx + 46, by + 46), fill=(40, 22, 10, 230))
        d.ellipse((bx - 26, by - 26, bx + 26, by + 26), fill=(8, 6, 6, 255))
        gx, gy = MARKS["gum"][0] * w, MARKS["gum"][1] * h
        d.ellipse((gx - 40, gy - 30, gx + 40, gy + 30), fill=(150, 148, 138, 235))
    out = carpet.copy()
    out.paste(layer, (0, 0), layer)
    return out


def gen_maze(ctx, size=(2160, 3840)) -> Image.Image:
    """근거 컷: 프리드먼식 카지노 평면 도식 — 자막 띠(플레이트 y 2170~2830) 위쪽에만 그린다."""
    img = Image.new("RGB", size, (10, 9, 12)); d = ImageDraw.Draw(img)
    for y in range(560, 2100, 100):
        for x in range(200, 2000, 100):
            d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(38, 36, 42))
    for row in range(5):
        y = 640 + row * 290
        for col in range(3):
            x = 260 + col * 600 + (300 if row % 2 else 0)
            if x + 420 > 2000:
                continue
            d.rounded_rectangle((x, y, x + 420, y + 150), radius=18, fill=(24, 22, 28), outline=(120, 110, 130), width=4)
            for k in range(6):
                d.rectangle((x + 24 + k * 64, y + 34, x + 70 + k * 64, y + 116), outline=(95, 88, 105), width=2)
    path = [(1080, 2080), (1080, 1960), (520, 1960), (520, 1380), (1560, 1380), (1560, 800), (760, 800), (760, 560)]
    for i in range(len(path) - 1):
        x0, y0 = path[i]; x1, y1 = path[i + 1]
        n = 12
        for k in range(0, n, 2):
            d.line((x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, x0 + (x1 - x0) * (k + 1) / n, y0 + (y1 - y0) * (k + 1) / n), fill=ctx.GOLD, width=10)
    d.ellipse((1044, 2044, 1116, 2116), fill=ctx.GOLD)
    f, fs = ctx.load_font(52), ctx.load_font_regular(42)
    d.text((1150, 2050), "입구", font=f, fill=(255, 255, 255))
    d.text((180, 470), "평면 도식 — 프리드먼 원칙", font=fs, fill=ctx.GOLD)
    for text, (x, y) in [("미로형 동선", (1600, 1420)), ("창문 없음 · 시계 없음", (560, 1230)), ("게임기 = 장식", (1600, 840)), ("출구 (비노출)", (800, 470))]:
        d.text((x, y), text, font=fs, fill=(235, 232, 226))
    return img

def build_sources(ctx) -> dict:
    """SHOTS의 src 키 → 플레이트(PIL RGB, 9:16 기준 2160x3840 이상)."""
    carpet = gen_carpet(ctx.fiber)
    stain = add_marks(carpet)                        # 13.5s: 얼룩이 무늬에 묻힘
    stain_hi = add_marks(carpet, 175)                # 15.0/16.5/19.5s: 반전·화살표 리빌용
    stain_egg = add_marks(carpet, 105, spots=False)  # 6.0s: 이스터에그(재시청 유도)
    arr = np.asarray(carpet)
    third = arr.shape[1] // 3
    zones = Image.fromarray(np.concatenate([arr[:, :third], np.roll(arr[:, third:2 * third], 1, axis=2),
                                            np.roll(arr[:, 2 * third:], 2, axis=2)], axis=1))
    beige = gen_beige(ctx.fiber)
    floor, slots, lobby, crowd = (ctx.fetch(k) for k in ("floor", "slots", "lobby", "crowd"))
    floor = ctx.cover(floor, 2160, 3840) if floor else ctx.cover(carpet, 2160, 3840)
    slots = ctx.cover(slots, 2160, 3840) if slots else floor
    lobby = ctx.cover(lobby, 2160, 3840) if lobby else ctx.cover(beige, 2160, 3840)
    crowd = ctx.cover(crowd, 2160, 3840) if crowd else floor
    night = ImageEnhance.Contrast(ImageEnhance.Brightness(floor).enhance(0.55)).enhance(1.25)
    sil = ImageEnhance.Contrast(ImageEnhance.Brightness(crowd.convert("L").convert("RGB")).enhance(0.45)).enhance(1.6)
    top = ctx.cover(slots, 2160, 2600)                # 1인칭 POV: 위 = 슬롯 화면, 아래 = 카펫
    bottom = carpet.resize((2160, 3840), Image.Resampling.LANCZOS).crop((0, 0, 2160, 2400))
    pov = Image.new("RGB", (2160, 5000)); pov.paste(top, (0, 0)); pov.paste(bottom, (0, 2600))
    pov_focus = pov.copy(); pov_focus.paste(bottom.filter(ImageFilter.GaussianBlur(14)), (0, 2600))
    pov_bw = pov.copy(); pov_bw.paste(bottom.convert("L").convert("RGB"), (0, 2600))
    black = Image.new("RGB", (2160, 3840), (4, 3, 5))
    black.paste(carpet.crop((1300, 2560, 1940, 3200)), (760, 1600))
    ImageDraw.Draw(black).rectangle((760, 1600, 1400, 2240), outline=ctx.GOLD, width=6)
    card = ImageEnhance.Color(carpet.resize((2160, 3840), Image.Resampling.LANCZOS)).enhance(0.25)
    card = Image.blend(card, Image.new("RGB", (2160, 3840), (6, 4, 8)), 0.8)
    d = ImageDraw.Draw(card); f = ctx.load_font(150)
    for i, line in enumerate(["당신의 시선을 훔치는", "바닥의 진실"]):
        tw = d.textbbox((0, 0), line, font=f)[2]
        d.text(((2160 - tw) / 2, 1560 + i * 200), line, font=f, fill=(255, 255, 255))
    d.rectangle((760, 2010, 1400, 2020), fill=ctx.GOLD)
    maze = gen_maze(ctx)
    sources = ctx.text_card(["B. Friedman, Designing Casinos to Dominate the Competition (2000)",
                             "R. Thomas, Wynn Design & Development — Bellagio (1998), Wynn (2005)",
                             "상업용 카펫 규격 항목 soil hiding(오염 은폐)",
                             "사진: Wikimedia Commons — 저작자·라이선스는 캡션에 표기"], title="출처")
    return {"maze": maze, "sources": sources, "carpet": carpet, "stain": stain, "stain_hi": stain_hi, "stain_egg": stain_egg, "zones": zones, "beige": beige,
            "floor": floor, "slots": slots, "lobby": lobby, "crowd": crowd, "night": night, "sil": sil,
            "pov": pov, "pov_focus": pov_focus, "pov_bw": pov_bw, "black": black, "card": card}


# ───────────── 타임라인 ─────────────
C = 1.5
def S(t, src, dur=C, **kw):  # noqa: E741
    return {"start": t, "end": t + dur, "src": src, **kw}

SHOTS = [  # v3: 관찰 01(바닥재) → 관찰 02(시선) → 근거 → 반례 → 결론 → 출처 → 루프.  카메라 이동 move=True 4회.
    S(0.0, "carpet", 2.0, z=(8.0, 8.0), drift=(0.0, 0.003)),                                      # 훅: 초밀착 홀드
    S(2.0, "floor", 2.0, mask_reveal={"src": "carpet", "z": 8.0, "f": (0.5, 0.5), "to": (390, 1380, 300, 200), "time": 1.4}, move=True),
    S(4.0, "floor", z=(1.4, 1.4), f=((0.5, 0.8), (0.5, 0.8))),                                     # 바닥 cut-in
    S(5.5, "carpet", z=(2.2, 2.2), rot=90),                                                        # 90° 세운 벽지
    S(7.0, "stain_egg", 2.0, z=(3.2, 3.2), f=((0.5, 0.55), (0.5, 0.55)),
      overlay={"type": "callout", "at": (0.56, 0.50), "text": "6색 · 중간 명도 · 고밀도 패턴", "side": "left", "dy": -200}),  # 콜아웃 + 이스터에그
    S(9.0, "carpet", z=(3.2, 3.2), f=((0.62, 0.40), (0.62, 0.40)), bw=0.0, flash=True),             # 흑백
    S(10.5, "lobby", z=(1.0, 1.0)),
    S(12.0, "lobby", 2.0, z=(1.1, 1.1), wipe={"src2": "carpet", "z2": 1.4, "from": 1.0, "to": 0.5, "time": 0.6}, move=True,
      overlay={"type": "tags", "items": [(96, 960, "로비"), (620, 960, "게임장")]}),                    # 와이프 + 이름표
    S(14.0, "stain", z=(2.7, 2.7), f=((0.5, 0.55), (0.5, 0.55))),                                    # 얼룩(안 보임)
    S(15.5, "stain_hi", 2.0, z=(2.8, 2.8), f=((0.5, 0.55), (0.5, 0.55)), invert=True, flash=True,
      overlay={"type": "circle", "at": MARKS["stain"]}),                                               # 플래시 + 네거티브
    S(17.5, "stain_hi", subcuts=[("burn", 5.0), ("gum", 5.0), ("stain", 4.0)]),                        # 정지 크롭 점프 3회
    S(19.0, "crowd", f=((0.5, 0.6), (0.5, 0.6)), tiles={"grid": (3, 5), "mode": "reveal", "seed": 2}),  # 조각내기
    S(20.5, "stain_hi", 2.0, z=(2.2, 2.2), f=((0.5, 0.55), (0.5, 0.55)), rot=90,
      overlay={"type": "arrows", "points": MARKS}, cite="상업용 카펫 규격 항목 — soil hiding(오염 은폐)"),  # 회전 + 번호 + 인용
    S(22.5, "pov", z=(1.25, 1.25), f=((0.5, 0.72), (0.5, 0.72))),                                      # 내려다본 정지 POV
    S(24.0, "carpet", z=(3.2, 3.2), shake=8, sat=(1.2, 1.7)),                                          # 눈 아픔
    S(25.5, "pov", 2.0, z=(1.25, 1.25), f=((0.5, 0.72), (0.5, 0.22)), ease="inout", move=True),        # 고개 드는 순간
    S(27.5, "slots", 2.0, z=(1.0, 1.0), f=((0.5, 0.45), (0.5, 0.45)),
      overlay={"type": "measure", "a": (940, 620), "b": (940, 1040), "text": "눈높이 ≈ 화면 중심"}),      # 치수선
    S(29.5, "slots", 2.0, split=("tb", "carpet"), z=(1.3, 1.3), f=((0.5, 0.42), (0.5, 0.42)), z2=(2.6, 2.6)),  # 상하 분할
    S(31.5, "floor", z=(1.0, 1.0), bw=0.0,
      overlay={"type": "polyline", "points": [(540, 1680), (560, 1400), (520, 1120), (540, 760)], "arrowhead": True, "ring_start": True}),
    S(33.0, "maze", 3.0, z=(1.0, 1.0), cite="B. Friedman, Designing Casinos to Dominate the Competition (2000)"),  # 근거: 평면 도식
    S(36.0, "zones", z=(1.0, 1.0)),                                                                   # 구역별 무늬
    S(37.5, "crowd", 2.0, z=(1.0, 1.0), f=((0.5, 0.35), (0.5, 0.35)), cite="Roger Thomas — Bellagio(1998) · Wynn(2005) 설계"),  # 반례
    S(39.5, "floor", 2.0, split=("tb", "beige"), z=(1.2, 1.2), f=((0.5, 0.35), (0.5, 0.35)), z2=(1.6, 1.6),
      cite="\"편안해야 오래 머문다\" — R. Thomas"),
    S(41.5, "black", 2.0, z=(1.0, 1.0)),                                                              # 결론 진입
    S(43.5, "carpet", 2.0, z=(3.0, 3.0), blur=(0, 12)),
    S(45.5, "pov_focus", 2.5, z=(1.15, 1.15), f=((0.5, 0.28), (0.5, 0.28)), cite="설계 의도로 통용 — 통제 실험으로 입증된 명제는 아님"),
    S(48.0, "pov_bw", 2.5, z=(1.1, 1.1), f=((0.5, 0.5), (0.5, 0.5))),
    S(50.5, "card", 2.0, z=(1.0, 1.0)),                                                               # 텍스트 카드
    S(52.5, "sources", 2.0, z=(1.0, 1.0)),                                                            # 출처 카드
    S(54.5, "carpet", TOTAL - 54.8, z=(1.0, 8.0), ease="in", move=True),                              # 루프
    S(TOTAL - 0.3, "carpet", 0.3, z=(8.0, 8.0)),
]

CAPTIONS = [  # (start, end, text, 섹션 라벨) — 사람이 쓴 톤. 팔로우 유도 금지, 엔딩은 재시청 훅.
    (0.0, 2.0, "하루 수만 명이 밟고 지나가는 곳", ""), (2.0, 4.0, "카지노 바닥, 왜 이렇게 촌스러울까?", ""),
    (4.0, 5.5, "슬롯머신보다 정신없는 바닥", "관찰 01 · 바닥재"), (5.5, 7.0, "벽지였으면 안 팔렸을 무늬", "관찰 01 · 바닥재"),
    (7.0, 9.0, "색만 여섯 가지", "관찰 01 · 바닥재"), (9.0, 10.5, "흑백으로 봐도 어지러움", "관찰 01 · 바닥재"),
    (10.5, 12.0, "근데 같은 호텔 로비는 멀쩡함", "관찰 01 · 바닥재"), (12.0, 14.0, "딱 게임장 문턱부터 바뀜", "관찰 01 · 바닥재"),
    (14.0, 15.5, "여기 어딘가에 얼룩이 있음", "관찰 01 · 바닥재"), (15.5, 17.5, "색을 뒤집으면 보임", "관찰 01 · 바닥재"),
    (17.5, 19.0, "담배, 껌, 쏟은 술", "관찰 01 · 바닥재"), (19.0, 20.5, "하루에 발자국 수만 개", "관찰 01 · 바닥재"),
    (20.5, 22.5, "첫 번째 이유, 얼룩 숨기기", "관찰 01 · 정리"),
    (22.5, 24.0, "근데 진짜 이유는 따로 있음", "관찰 02 · 시선"), (24.0, 25.5, "3초만 봐도 눈이 아픔", "관찰 02 · 시선"),
    (25.5, 27.5, "그래서 저절로 고개를 들게 됨", "관찰 02 · 시선"), (27.5, 29.5, "고개 들면 딱 거기, 슬롯 화면", "관찰 02 · 시선"),
    (29.5, 31.5, "눈이 편한 곳에서 돈이 나감", "관찰 02 · 시선"), (31.5, 33.0, "'보지 마'라고 말하는 바닥", "관찰 02 · 정리"),
    (33.0, 36.0, "우연이 아니라 설계 원칙", "근거"), (36.0, 37.5, "구역마다 무늬가 다름", "근거"),
    (37.5, 39.5, "그런데 벨라지오는 반대로 갔다", "반례"), (39.5, 41.5, "높은 천장, 자연광, 차분한 바닥", "반례"),
    (41.5, 43.5, "결국 한 문장", "결론"), (43.5, 45.5, "촌스러운 게 아니라", "결론"),
    (45.5, 48.0, "일부러 눈을 위로 밀어 올린 것", "결론"), (48.0, 50.5, "그래야 시선이 머물고 지갑이 열림", "결론"),
    (54.5, 56.4, "이제 카지노 가면 바닥부터 보일 거예요", ""), (56.4, 58.2, "아, 그리고 앞에 얼룩 하나 더 숨겨놨음", ""),
    (58.2, TOTAL, "찾은 사람?", ""),
]
SFX = [(15.5, "swoosh"), (25.5, "ting"), (7.0, "tick"), (12.0, "tick"), (27.5, "tick"), (33.0, "tick")]   # 반전 2회 + 주석 클릭(작게)
