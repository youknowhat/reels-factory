"""
episodes/arcimboldo_gardener.py — theclasssssic #3: 주세페 아르침볼도 〈오르톨라노(채소 기르는 사람)〉(1590년 무렵, 크레모나 알라 폰초네 시립미술관)
뼈대: 주제문("거꾸로 봐야 보인다") → 평범한 채소 그릇 → 뒤집으면 얼굴 → 궁정 화가·황제도 채소로 → '장난'이라 불림 → 잊힘 → 재발견
      → 결론("보는 눈이 바뀌면 다르게 보인다") → 여운("한 번 더 뒤집어 볼까") → 다시 뒤집어 첫 장면으로 루프
사실 확인(2026-09-24, Wikipedia 'Giuseppe Arcimboldo' + Commons 파일 설명):
  - 빈에서 페르디난트 1세, 프라하에서 막시밀리안 2세·루돌프 2세의 궁정 초상화가(황제 셋).
  - 〈베르툼누스〉(1590–91): 루돌프 2세를 로마 계절의 신 베르툼누스로 — 과일·채소·꽃으로 구성.
  - 동시대 사람들은 그의 그림을 scherzi·grilli·capricci(장난·변덕)라 불렀다.
  - 그와 루돌프 2세가 죽은 뒤 빠르게 잊혔고 17~18세기 문헌에 언급되지 않음 → 20세기 초 달리 등 초현실주의자들이 재발견.
  - 〈오르톨라노〉: 크레모나 알라 폰초네 시립미술관, 그릇에 담긴 채소 ↔ 뒤집으면 사람 얼굴(Commons 'L'ortolano' 설명).
"""
from PIL import Image

TOTAL = 52.5
BRAND = ("", "", "")
CAPTION_STYLE = "clean"
BGM_STYLE = "calm"
XFADE = 0.25
MOTION_BUDGET = 4
QUERIES = {"painting": "File:Arcimboldo Vegetables.jpg",                                                   # 얼굴 방향으로 저장된 원본(2172x2846), 퍼블릭 도메인
           "vertumnus": "File:Giuseppe Arcimboldo - Rudolf II of Habsburg as Vertumnus - Google Art Project.jpg"}
BG = (10, 9, 12)
Z_FULLH = 2172 / (2846 * 9 / 16)                                                                            # 세로를 꽉 채우는 배율
P = {"veg": (0.5, 0.5), "face": (0.35, 0.45), "vert_face": (0.5, 0.42)}


def _lb(img, size=(2160, 3840)):
    c = Image.new("RGB", size, BG)
    fit = img.resize((size[0], round(img.height * size[0] / img.width)), Image.Resampling.LANCZOS)
    c.paste(fit, (0, (size[1] - fit.height) // 2))
    return c


def build_sources(ctx) -> dict:
    face = ctx.fetch("painting")
    bowl = face.rotate(180)
    vert = ctx.fetch("vertumnus")
    return {"face": face, "bowl": bowl, "vert": vert, "bowl_lb": _lb(bowl), "face_lb": _lb(face), "vert_lb": _lb(vert)}


# ───────────── 그림 뒤집기 / 나란히 보기 ─────────────
_SMALL = {}


def _small(src, key):
    if key not in _SMALL:
        _SMALL[key] = src[key].resize((1080, 1920), Image.Resampling.LANCZOS)
    return _SMALL[key]


def _flip(src, local, t0, t1, a0, a1):
    q = min(1.0, max(0.0, (local - t0) / (t1 - t0))); q = q * q * (3 - 2 * q)
    return _small(src, "bowl_lb").rotate(a0 + (a1 - a0) * q, resample=Image.Resampling.BICUBIC, fillcolor=BG)


def flip_in(src, p, local):      # 채소 그릇 → 얼굴
    return _flip(src, local, 1.2, 3.4, 0, 180)


def flip_back(src, p, local):    # 얼굴 → 채소 그릇
    return _flip(src, local, 1.5, 3.7, 180, 360)


def pair(src, p, local):         # 같은 그림, 두 방향
    c = Image.new("RGB", (1080, 1920), BG)
    for i, key in enumerate(("bowl", "face")):
        im = src[key].resize((500, round(500 * src[key].height / src[key].width)), Image.Resampling.LANCZOS)
        c.paste(im, (27 + i * 526, 820 - im.height // 2))
    return c


def S(t, src, dur, **kw):  # noqa: E741
    return {"start": t, "end": t + dur, "src": src, **kw}

SHOTS = [  # 14컷 / 52.5초. 이동 3회(뒤집기·나란히·되뒤집기, 모두 render).
    S(0.0, "bowl", 4.0, z=(Z_FULLH, Z_FULLH)),                                                  # 주제문: 채소 그릇
    S(4.0, "bowl", 3.5, z=(2.0, 2.0), f=(P["veg"], P["veg"])),                                  # 양파·순무·뿌리채소
    S(7.5, "bowl_lb", 3.5, z=(1.0, 1.0)),                                                       # 그림 전체 — 평범한 정물화
    S(11.0, "bowl_lb", 7.5, render=flip_in),                                                    # 뒤집기 → 얼굴
    S(18.5, "face", 3.5, z=(2.0, 2.0), f=(P["face"], P["face"])),                               # 얼굴 디테일 — 제목
    S(22.0, "face", 4.0, z=(Z_FULLH, Z_FULLH)),                                                 # 얼굴 — 화가
    S(26.0, "vert_lb", 4.0, z=(1.0, 1.0), xfade=0.6),                                           # 〈베르툼누스〉 — 황제의 얼굴
    S(30.0, "vert", 3.5, z=(1.8, 1.8), f=(P["vert_face"], P["vert_face"])),                     # '장난'이라 불렸다
    S(33.5, "vert", 3.5, z=(1.8, 1.8), f=(P["vert_face"], P["vert_face"]), sat=(1.0, 0.0)),     # 잊혔다 — 색이 빠진다
    S(37.0, "vert", 4.5, z=(1.8, 1.8), f=(P["vert_face"], P["vert_face"]), sat=(0.0, 1.0)),     # 다시 찾아냈다 — 색이 돌아온다
    S(41.5, "bowl_lb", 4.0, render=pair, xfade=0.6),                                            # 결론: 같은 그림, 두 방향
    S(45.5, "bowl_lb", 5.0, render=flip_back),                                                  # 여운: 다시 뒤집기
    S(50.5, "bowl", TOTAL - 50.8, z=(Z_FULLH, Z_FULLH), xfade=0.6),                             # 정적 → 첫 장면으로 루프
    S(TOTAL - 0.3, "bowl", 0.3, z=(Z_FULLH, Z_FULLH)),                                          # 정지 꼬리(이음새)
]

CAPTIONS = [  # 첫 문장 = 주제문. 결론(41.5s)이 주제문을 일반화하고, 여운(45.5s)이 다시 뒤집기로 첫 장면에 돌아간다.
    (0.0, 4.0, "이 그림은\n거꾸로 봐야 보인다."),
    (4.0, 7.5, "그릇 하나에 담긴\n양파와 순무, 뿌리채소들."),
    (7.5, 11.0, "이대로라면\n평범한 정물화다."),
    (11.0, 14.5, "그런데 그림을\n거꾸로 뒤집으면,"),
    (14.5, 18.5, "그릇은 모자가 되고,\n채소들은 얼굴이 된다."),
    (18.5, 22.0, "제목은 '오르톨라노',\n채소 기르는 사람."),
    (22.0, 26.0, "그린 사람은 아르침볼도.\n황제 셋을 모신 궁정 화가였다."),
    (26.0, 30.0, "그는 과일과 채소로\n황제의 얼굴까지 그렸다."),
    (30.0, 33.5, "당시 사람들은 이런 그림을\n'장난'이라 불렀다."),
    (33.5, 37.0, "그가 죽자,\n그림들은 곧 잊혔다."),
    (37.0, 41.5, "300여 년 뒤, 초현실주의\n화가들이 그를 다시 찾아냈다."),
    (41.5, 45.5, "같은 그림도, 보는 눈이 바뀌면\n전혀 다른 것이 보인다."),
    (45.5, 49.5, "이 그릇도,\n한 번 더 뒤집어 볼까."),
]
SFX = [(12.2, "low")]   # 그림이 뒤집히기 시작하는 순간 한 번
