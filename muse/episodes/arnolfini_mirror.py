"""
episodes/arnolfini_mirror.py — theclasssssic #1: 아르놀피니 부부의 초상 — 결혼식 그림인가, 추모 그림인가 (van Eyck, 1434)
v7 동화 문법: 첫 문장이 주제문("이 그림은 오랫동안 '결혼식 그림'으로 읽혔다")이고, 이후 모든 문장이 그걸 뒷받침하거나
뒤집는다. 자막 하나는 최소 2.8초, 직전 자막보다 30% 넘게 빨라지지 않는다(review.py가 검사).
사실 확인(2026-09-24, National Gallery 공식 설명 WebFetch):
  - 그림 속 남자 = "가장 유력한 후보"는 Giovanni di Nicolao Arnolfini (내셔널갤러리 공식 입장).
  - 그림 속 여자 = "probably his second wife, whose identity is unknown" — 내셔널갤러리는 신원 미상인 '두 번째 아내'로 본다.
    → 그림 속 여자를 "죽은 첫 아내"라고 단정하면 안 됨. 영상은 "이 여자는 누구인지 확실치 않다"까지만 말한다.
  - 코스탄차 트렌타(그의 첫 아내)는 1433년 2월 이전 사망(Wikipedia). 그림은 1434년.
  - 촛불 비대칭 → 추모 초상 해석은 마거릿 코스터(2003)의 개별 이론. "일부 학자는"으로 한정.
"""
from PIL import Image

TOTAL = 56.0
BRAND = ("", "", "")
CAPTION_STYLE = "clean"
BGM_STYLE = "calm"
XFADE = 0.25
MOTION_BUDGET = 4
QUERIES = {"painting": "File:Eyck, Jan van - Arnolfini Portrait - NG.jpg"}   # National Gallery 고해상도(4353x6000), 퍼블릭 도메인
# 플레이트 정규좌표 (격자 시트로 확정)
P = {"candle": (0.418, 0.078), "stubs": (0.560, 0.088), "chandelier": (0.500, 0.110), "mirror": (0.500, 0.305),
     "sign": (0.500, 0.232), "hands": (0.550, 0.420), "man": (0.272, 0.200), "woman": (0.750, 0.245),
     "couple": (0.500, 0.260)}


def build_sources(ctx) -> dict:
    painting = ctx.fetch("painting")
    full = Image.new("RGB", (2160, 3840), (10, 9, 12))                      # 전체 그림(레터박스)
    fit = painting.resize((2160, round(painting.height * 2160 / painting.width)), Image.Resampling.LANCZOS)
    full.paste(fit, (0, (3840 - fit.height) // 2))
    return {"painting": painting, "full": full}


def S(t, src, dur, **kw):  # noqa: E741
    return {"start": t, "end": t + dur, "src": src, **kw}

SHOTS = [  # 13컷 / 56초. 컷은 "보여줄 대상"이 바뀔 때만 — 자막 2개가 한 컷 위를 지나가도 된다.
    S(0.0, "full", 4.0, z=(1.0, 1.0)),                                                            # 주제문: 그림 전체
    S(4.0, "painting", 3.5, z=(3.0, 3.0), f=(P["hands"], P["hands"])),                             # 맞잡은 손
    S(7.5, "painting", 3.5, z=(8.5, 8.5), f=(P["mirror"], P["mirror"])),                           # 거울 속 두 사람
    S(11.0, "painting", 4.5, z=(6.8, 6.8),                                                         # 거울 → 서명, 한 컷 안에서 위로 이동
      path=[(*P["mirror"], 6.8), (*P["sign"], 6.8)]),
    S(15.5, "painting", 3.5, z=(1.8, 1.8), f=(P["couple"], P["couple"])),                          # 두 사람 (결혼식처럼 보였다)
    S(19.0, "painting", 8.0, z=(4.5, 4.5), f=(P["man"], P["man"])),                                # 남자 얼굴 — 자막 2개(추적 → 첫 아내 사망)
    S(27.0, "painting", 3.5, z=(3.6, 4.0), f=(P["woman"], P["woman"]), ease="inout", move=True),   # 컷: 여자 얼굴 — "이 여자는 누구일까?"
    S(30.5, "painting", 3.5, z=(3.6, 3.6), f=(P["chandelier"], P["chandelier"])),                  # 화가는 답 대신 단서를 남겼다
    S(34.0, "painting", 6.5,                                                                        # 남자→켜진 초→다 탄 초→여자, 한 컷 안의 투어
      path=[(*P["man"], 4.5), (*P["candle"], 8.0), (*P["stubs"], 8.0), (*P["woman"], 4.0)],
      path_times=[0.0, 0.32, 0.62, 1.0]),
    S(40.5, "painting", 8.0, z=(1.8, 1.8), f=(P["couple"], P["couple"])),                          # 두 사람, 다시(콜백) — 자막 2개(다르게 읽는다)
    S(48.5, "painting", 5.0, z=(3.0, 2.0), f=(P["hands"], P["hands"]), ease="inout", move=True),   # 여운: 손에서 천천히 멀어짐
    S(53.5, "full", 2.2, z=(1.0, 1.0), xfade=0.6),                                                  # 정적(자막 없음) → 첫 장면으로 루프
    S(TOTAL - 0.3, "full", 0.3, z=(1.0, 1.0)),                                                      # 정지 꼬리(이음새)
]

CAPTIONS = [  # 첫 문장 = 주제문. 이후 모든 문장은 그걸 뒷받침하거나 뒤집는다. 각 자막 ≥2.8초.
    (0.0, 4.0, "이 그림은 오랫동안\n'결혼식 그림'으로 읽혔다."),
    (4.0, 7.5, "손을 맞잡은 두 사람,"),
    (7.5, 11.0, "거울 속에 비친 증인들,"),
    (11.0, 15.5, "벽에 적힌 화가의 한마디.\n\"얀 반 에이크, 여기 있었다.\""),
    (15.5, 19.0, "모든 게\n결혼식처럼 보였다."),
    (19.0, 23.0, "그런데 학자들이\n이 남자를 추적하다가,"),
    (23.0, 27.0, "그의 첫 아내가 이미\n세상을 떠났다는 걸 알아냈다."),
    (27.0, 30.5, "그럼 옆에 선\n이 여자는 누구일까?"),
    (30.5, 34.0, "화가는 답 대신\n단서 하나를 남겼다."),
    (34.0, 37.5, "남자 쪽 초에는\n불이 켜져 있고,"),
    (37.5, 40.5, "여자 쪽 초는 다 타고\n밑동만 남았다."),
    (40.5, 44.5, "그래서 어떤 학자들은\n이 그림을 다르게 읽는다."),
    (44.5, 48.5, "결혼식이 아니라,\n떠난 아내를 기억하는 그림이라고."),
    (48.5, 53.5, "그림 속에서라도\n한 번 더, 손을 잡고 싶었던 걸까."),
    # 루프용 연결 문장을 따로 만들지 않는다 — 여운 뒤 정적, 그리고 첫 장면이 루프를 만든다.
]
SFX = [(27.0, "low")]   # 반전 한 번, 낮게
