"""
episodes/icarus_fall.py — theclasssssic #4: 〈이카로스의 추락이 있는 풍경〉(1560년 무렵, 브뤼셀 벨기에 왕립미술관 올드마스터스 미술관)
뼈대: 주제문("주인공은 이카로스다") → 그런데 크게 보이는 건 농부·목동·배 → 이카로스는 어디? → 배 아래 두 다리 → 신화 속 이카로스
      → 신화에선 모두 올려다봤다 ↔ 그림에선 아무도 안 본다 → 결론(화가가 그린 건 무관심한 세상) → 여운(주인공은 다리만) → 루프
사실 확인(2026-09-24, Wikipedia 'Landscape with the Fall of Icarus', 미술관 입장 인용 포함):
  - 올드마스터스 미술관(브뤼셀), 1560년 무렵, 캔버스에 유채(패널에서 옮겨짐). 미술관: 구도는 확실히 브뤼헐, 실제 붓질은 브뤼헐인지 의문(사본설).
    → 영상에서는 화가 이름을 말하지 않고 '화가'로만. 캡션에서 귀속 문제를 설명.
  - 이카로스: "배 바로 아래 물속에 다리가 보인다".
  - 오비디우스 『변신 이야기』: 어부·목동·농부가 하늘을 나는 두 사람을 보고 놀라 신인 줄 앎 — 그림은 그런 인상을 주지 않음.
  - 오든의 시 「Musée des Beaux Arts」(1938)가 이 그림을 다룸(캡션에서만 언급, 인용 안 함).
"""
from PIL import Image

TOTAL = 48.3
BRAND = ("", "", "")
CAPTION_STYLE = "clean"
BGM_STYLE = "calm"
XFADE = 0.25
MOTION_BUDGET = 4
QUERIES = {"painting": "File:Pieter Bruegel the Elder - Landscape with the Fall of Icarus - Brussels, Royal Museums of Fine Arts of Belgium - Google Arts & Culture.jpg"}  # 8000px로 캐시
BG = (10, 9, 12)
Z_FULLH = 8000 / (5218 * 9 / 16)                                                    # 세로를 꽉 채우는 배율(가로의 37%)
P = {"plough": (0.45, 0.66), "plough_head": (0.41, 0.64), "shep": (0.515, 0.57), "ship": (0.80, 0.50),
     "legs": (0.855, 0.785), "sun": (0.655, 0.27), "world": (0.50, 0.50)}


def build_sources(ctx) -> dict:
    painting = ctx.fetch("painting")
    full = Image.new("RGB", (2160, 3840), BG)
    fit = painting.resize((2160, round(painting.height * 2160 / painting.width)), Image.Resampling.LANCZOS)
    full.paste(fit, (0, (3840 - fit.height) // 2))
    return {"painting": painting, "full": full}


def S(t, src, dur, **kw):  # noqa: E741
    return {"start": t, "end": t + dur, "src": src, **kw}

SHOTS = [  # 12컷 / 48.3초. 이동 1회(풍경을 훑다가 두 다리로 다가감).
    S(0.0, "full", 4.0, z=(1.0, 1.0)),                                                          # 주제문: 그림 전체
    S(4.0, "painting", 3.5, z=(4.0, 4.0), f=(P["plough"], P["plough"])),                        # 가장 크게 보이는 농부
    S(7.5, "painting", 3.5, z=(6.0, 6.0), f=(P["shep"], P["shep"])),                            # 하늘을 보는 목동
    S(11.0, "painting", 3.5, z=(3.5, 3.5), f=(P["ship"], P["ship"])),                           # 배
    S(14.5, "painting", 7.5, path=[(0.30, 0.5, Z_FULLH), (0.75, 0.5, Z_FULLH), (*P["legs"], 16.0), (*P["legs"], 16.0)],
      path_times=[0.0, 0.42, 0.82, 1.0]),                                                         # 이카로스는 어디? → 배 아래 두 다리
    S(22.0, "painting", 7.5, z=(16.0, 16.0), f=(P["legs"], P["legs"])),                         # 두 다리 — 신화 속 소년
    S(29.5, "painting", 4.0, z=(5.0, 5.0), f=(P["sun"], P["sun"]), xfade=0.6),                  # 하늘·해 — 신화에선 모두 올려다봤다
    S(33.5, "painting", 4.0, z=(6.5, 6.5), f=(P["plough_head"], P["plough_head"])),             # 고개 숙인 농부 — 아무도 보지 않는다
    S(37.5, "painting", 4.5, z=(Z_FULLH, Z_FULLH), f=(P["world"], P["world"])),                 # 결론: 제 할 일을 하는 세상
    S(42.0, "painting", 3.5, z=(16.0, 16.0), f=(P["legs"], P["legs"])),                         # 여운: 다리만 남은 주인공
    S(45.5, "full", TOTAL - 45.8, z=(1.0, 1.0), xfade=0.6),                                      # 정적 → 첫 장면으로 루프
    S(TOTAL - 0.3, "full", 0.3, z=(1.0, 1.0)),                                                   # 정지 꼬리(이음새)
]

CAPTIONS = [  # 첫 문장 = 주제문. 여운(42.0s)이 주제문을 비틀고, 루프에서 첫 문장이 다르게 읽힌다.
    (0.0, 4.0, "이 그림의 주인공은\n이카로스다."),
    (4.0, 7.5, "그런데 가장 크게 보이는 건\n밭을 가는 농부."),
    (7.5, 11.0, "하늘을 올려다보는 목동,"),
    (11.0, 14.5, "바다로 나아가는 배."),
    (14.5, 18.0, "그럼 이카로스는\n어디 있을까?"),
    (18.0, 22.0, "배 아래, 물에 빠진\n두 다리."),
    (22.0, 26.0, "밀랍 날개로 날다\n태양에 너무 가까이 간 소년."),
    (26.0, 29.5, "날개가 녹아,\n바다로 떨어졌다."),
    (29.5, 33.5, "신화 속 농부와 목동은\n하늘을 나는 그를 보고 놀랐다."),
    (33.5, 37.5, "그런데 이 그림에선,\n아무도 그를 보지 않는다."),
    (37.5, 42.0, "화가가 그린 건 추락이 아니라,\n아무도 보지 않는 세상이다."),
    (42.0, 45.5, "제목 속 주인공은,\n끝내 두 다리만 남았다."),
]
SFX = [(18.0, "low")]   # 두 다리가 드러나는 순간 한 번
