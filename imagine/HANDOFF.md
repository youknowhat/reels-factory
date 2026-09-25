# imagine — 로컬 인수인계 (2026-09-25)

> **로컬 Claude Code 세션에서 이렇게 시작하세요:**
> `~/dev/reels-factory/imagine/HANDOFF.md`를 읽고 「다음 할 일」 1번부터 진행해.

클라우드 세션은 사진·뉴스·ChatGPT 사이트가 네트워크 정책으로 막혀 있어서 이미지 수집·시연 캡처·원문 확인을 할 수 없었다. 그 세 가지를 로컬에서 이어서 한다.

## 0. 한 줄
「상상력만 있다면 무엇이든 가능한 세상」 — AI 활용 사례를 미니멀 매거진 피드(인스타 캐러셀 1080x1350, 7~8장)로 전하는 채널. 메시지: AI가 발전할수록 병목은 인간의 상상력이다. 독자 일반인 80% / 실무자 20%.

- 브랜치: `claude/gifted-ramanujan-d5bt9q` (푸시됨). `git fetch && git checkout claude/gifted-ramanujan-d5bt9q`
- 규칙: `CLAUDE.md`(절대 원칙) · `docs/brief.md`(공식·이미지 원칙·캡션) · 제작 스킬 `/ai-carousel`

## 1. 확정된 결정 (사용자 피드백 순)
1. 형식: 캐러셀 먼저(릴스는 나중에 파생). 게시는 사람이 한다 — 자동화는 Drive 업로드까지.
2. 1차 시안(종이 톤 잡지/신문 스크랩/노트형) → **폐기**: "썸네일만 봐선 AI와 관련 있는지 1도 안 느껴진다", "AI가 만든 PPT 같다".
3. 2차(텍스트 많은 에디토리얼 매거진, 드롭캡·주석·거대 숫자) → **폐기**: 글자가 훅까지 떠맡아 무거움.
4. **현행: 미니멀 매거진 피드** — 레퍼런스 @artart.today. 풀블리드 이미지 + 하단 흰 글씨 두 줄 + 라벨 `상상한도 | AI`. 이미지는 핵심 메시지·화면 캡처·시연, 세부는 캡션. 단 **1장이 던진 궁금증의 답은 슬라이드에 남긴다**(사용자 동의).
5. 원래 사례를 재현하지 않는다(비용·결과 불일치·오해 위험). 우리 시연은 '따라 하기' 한 장만, **가상 예시**로.
6. 남의 이미지는 장수의 절반 이하(인스타 2026-04-30 aggregator 제재: 남의 콘텐츠가 대부분인 계정은 비팔로워 추천 제외).

## 2. 로컬 환경 (최초 1회)
```bash
cd ~/dev/reels-factory/imagine
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m playwright install chromium
npm install                      # 폰트: Pretendard, Instrument Serif, IBM Plex Mono
# Drive 배포(muse와 같은 리모트): rclone config create gdrive drive scope=drive.file
```
실행은 항상 `.venv/bin/python`. `render.py`는 클라우드용 Chromium 경로가 없으면 Playwright 기본 브라우저를 쓴다.

## 3. 현재 상태
- 파일럿 `posts/found_by_guess` — 「엄마 이름 하나로 60년 만에 가족을 찾았다」(캐나다 아바타르, ChatGPT에 짐작까지 적어 넣어 동생을 찾음, 가디언 2026-07). 원고·캡션·출처 완료, 렌더 시 **이미지 3장만 비어 있다**(자리표시에 "이미지 필요"가 찍힘, `review.py` FAIL 3).
  | 장 | 파일 | 가져오는 법 |
  |---|---|---|
  | 01 표지 | `01_cover.jpg` | `fetch_assets.py`가 기사 og:image를 받는다. 실패하면 가디언 원문에서 대표 사진 수동 저장 |
  | 05 재회 | `05_reunion.jpg` | 수동: 가디언/업워시 기사 속 재회·인물 사진 |
  | 07 따라 하기 | `07_demo.png` | 수동: ChatGPT에 **가상의 예시**로 질문 틀을 넣은 대화 화면 캡처(실존 인물 정보 금지). 틀은 `caption.md`에 있음 |
- 2~4, 6장은 렌더러가 그리는 재구성 그래픽(대화창·문서 카드·인용) — 이미지 불필요.
- 사례 백로그 14건: `research/backlog.md` (다음 추천: #4 거제 야구 게임, #3 브로콜리 농부).

## 4. 다음 할 일
1. **원문 확인.** 가디언 기사를 열어 `posts/found_by_guess/caption.md` 끝의 `(게시 전 확인: …)` 항목을 검증하고 캡션·슬라이드를 고친다. 특히 "생모/동생 관계", "어머니 생존 여부", "60년", "87~97세". 원문과 다르면 1차 출처를 따른다.
2. **이미지.** `.venv/bin/python fetch_assets.py --post found_by_guess` → `수동` 표시 항목 캡처 → `assets/`에 저장. 표지 사진이 약하면(인물이 안 보이거나 AI 이야기로 안 읽히면) 사용자에게 대안을 제시.
3. **렌더·검수.** `.venv/bin/python render.py --post found_by_guess && .venv/bin/python review.py --post found_by_guess` → FAIL 0. `output/found_by_guess/contact.jpg`와 `01.png`를 사용자에게 보여주고 휴대폰 확인을 받는다. 표지 글씨가 사진과 겹쳐 안 읽히면 `image.pos`(object-position)로 크롭을 옮긴다.
4. **채널명 확정.** 현재 임시 「상상한도」(`@sangsang.hando`). 후보·소개문은 `docs/profile.md`. 확정되면 `post.json`의 `masthead`/`handle`만 바꾼다.
5. **배포.** 승인 후 `.venv/bin/python publish.py --post found_by_guess` → Drive `reels-factory/found_by_guess/`(PNG + 복붙용 캡션).
6. 2편 이상 만들어 공식이 반복 가능한지 확인 → 필요하면 `docs/brief.md`·스킬 갱신. (선택) 매주 백로그를 채우는 리서치 루틴.

## 5. 파일 지도
| 파일 | 역할 |
|---|---|
| `render.py` | post.json → `output/<slug>/NN.png` + `contact.jpg` + `metrics.json`. 없는 이미지는 자리표시 |
| `review.py` | 크기·장수, 글자 넘침/여백, 금지어·이모지, 이미지 누락, 남의 이미지 ≤ 50%·출처, 캡션 첫 줄·해시태그 ≤ 5 |
| `fetch_assets.py` | image 항목의 `src`/`og`/`shot`으로 이미지 수집(로컬) |
| `publish.py` | Drive 업로드(rclone, muse와 같은 `gdrive:reels-factory`) |
| `templates/layouts/photo.html`, `closing.html`, `themes/magazine.css` | 디자인 전부 |
| `posts/<slug>/post.json` | `photo` 슬라이드: `image`{file,key,pos,src/og/shot,want} 또는 `chat`{label,text,typing} 또는 `doc`{meta,hit} 또는 `quote:true` + `headline`, `sub`. `**강조**` = 주황색 |
| `posts/<slug>/credits.json` | 출처. 우리가 만든 이미지는 `own: true` |
