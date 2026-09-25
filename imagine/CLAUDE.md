# imagine — AI 사례 캐러셀 채널 (가칭, 채널명 확정 전)

인스타그램 **캐러셀**(1080x1350 PNG 6~8장)을 HTML/CSS 템플릿 → Playwright(Chromium)로 렌더한다. `muse/`·`statistics-visualization/` 규칙과 섞지 않는다(이 채널은 팔로우·공유 CTA를 쓴다).

- 메시지·독자·원고 양식: `docs/brief.md` / 계정 소개: `docs/profile.md`
- 사례 후보: `research/backlog.md` / 이미 다룬 사례: `research/posted.json`
- 한 편: `posts/<slug>/post.json`, `assets/`, `credits.json`, `caption.md` → 산출물 `output/<slug>/01.png…`

## 환경
- `npm install`(폰트: pretendard, Noto Serif KR, Gowun Batang, IBM Plex Mono) + `pip install playwright`. 클라우드 환경엔 Chromium이 `/opt/pw-browsers`에 있다. 로컬 macOS는 `python -m playwright install chromium` 1회.
- 클라우드 세션은 웹 검색은 되지만 기사 페이지 열람이 네트워크 정책에 막힐 수 있다. 원문 확인이 막히면 사용자에게 알리고, 확인 못 한 사실은 캡션 `(게시 전 확인: …)`에 올린다.

## 절대 원칙
1. **원본성(aggregator 제재 대응).** 2026-04-30부터 남의 콘텐츠가 대부분인 계정은 비팔로워 추천에서 빠진다. 워터마크·단순 편집은 원본으로 인정되지 않는다. → 슬라이드 대부분은 **우리가 만든 해설**(구조화·비교·단계 그래픽·통찰)이고, 원본 이미지는 증거 자료로 작게, 매번 출처 칩과 함께. 원본 이미지 면적은 전체 슬라이드 면적의 40% 이하(`review.py`가 검사).
2. **"AI가 만든 티" 금지.** 보라-파랑 그라디언트, 로봇·뇌·회로·네온 이미지, AI 생성 스톡 일러스트, 글래스모피즘, 모든 장이 같은 박스 레이아웃, 이모지, ✨, 느낌표, "놀랍게도", "AI 시대 필수", "~하는 N가지 방법" 같은 정형 훅.
3. **사실.** 사례는 1차 출처(원작자 게시물·본인 인터뷰·공식 발표·신뢰할 만한 언론)로 확인. 확인 안 되면 쓰지 않는다. 사적 개인의 신상·얼굴은 본인이 공개한 범위 안에서만.
4. **사람이 먼저.** 기술 설명보다 "누가, 왜 떠올렸나"가 이야기의 중심. 매 편 결론은 "도구는 누구나 가졌다. 달랐던 건 떠올린 사람이다"의 변주.

## 워크플로우 (`/ai-carousel`)
1. 리서치 → `research/backlog.md`에 후보(카톡 한 줄 + 점수) → 사용자가 고른다.
2. 원고(`docs/brief.md` 양식) → 연결 점검 → **사용자 승인 후** 렌더.
3. 렌더 → `review.py` FAIL 0 → 컨택트 시트를 사용자에게 보내 휴대폰으로 확인받는다.
4. 배포: `publish.py`로 Drive `reels-factory/<slug>/`(PNG + caption.txt). 게시는 사람이 한다.
