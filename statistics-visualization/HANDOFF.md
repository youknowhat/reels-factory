# statistics-visualization — 세션 핸드오프 (2026-09-25, 클라우드 세션 업데이트)

> **다른 Claude/Cursor 세션에서 이렇게 시작하세요:**  
> `~/dev/reels-factory/statistics-visualization/HANDOFF.md`와 **`storyboards/alcohol/storyboard.md`**를 읽어.  
> **현재 상태 (2026-09-25 클라우드 세션):** A/B/C 16초 비교안은 사용자가 **전부 거절**("20년 전 모션그래픽", "기울인 뱃지로 손맛 흉내", "재미·전달력·영상미 없음"). 새 방향 = **3D 오브젝트가 곧 데이터**(소주병·짝·잔·사람) + 제품 사진급 렌더. 키프레임 7장(`storyboards/alcohol/*.jpg`, 실제 파이프라인 렌더)을 사용자에게 전달, **방향 승인 대기 중.** 승인 전에는 에피소드 제작 코드를 만들지 말 것.  
> **로컬(mac) 데스크톱 세션이 핸드오프 받음 (2026-09-25):** 이 브랜치를 fast-forward, `npm install`, Remotion 패키지 버전을 전부 `4.0.524`로 고정(애드온만 4.0.528로 풀려 버전 불일치 경고가 나던 것 해결), 스토리보드 3D 렌더가 mac에서 클라우드와 같은 그림으로 나오는 것 확인(`REMOTION_GL=angle` 필요 — §7). 로컬은 ElevenLabs 접속 가능 + 3D 렌더가 훨씬 빠르므로 **사운드 생성과 최종 렌더는 로컬 권장.**

> **2026-09-25 방향 전환 (최신 — 아래 영상 관련 내용보다 우선):** 3D 스토리보드도 "여전히 촌스럽다"로 보류. **릴스 대신 피드 캐러셀**로 전환. 레퍼런스는 디에디트·롱블랙 계열 카드뉴스(데이터 → "그래서 나랑 무슨 상관?"을 라이프스타일 관점으로), 뉴스 인포그래픽 문법은 금지(이모지·3D 그래프·시상대·기울인 장식·"~로 나타났습니다" 없음). **계정명 「데이터로그」**(확정), 문구는 "통계" 대신 **"데이터"**, **캡션에 해시태그 넣지 않음**, 카드에 반복 헤더·쪽수·가로선·넘김 화살표 없음(본문 + 하단 출처 한 줄만), **강조색 #E65100**(확정, 카드당 제목 글자·숫자 딱 1곳에만), 병·잔·점·눈금 같은 그림은 추가 색 없이 **먹색 농도(회색 단계)**로만 — 배경(#F4F0E8)은 그대로 유지(진하게 하면 오히려 이 주황과의 대비가 낮아짐을 확인함) — 한국 데이터 = 가장 진한 먹, 비교 대상·나머지 = 옅은 회색 (`src/carousel/tokens.ts`의 ink/ink45/ink30/ink20/ink12), **해요체**, 3:4(1080×1440), 7장 구조(표지 → 재노출용 두 번째 표지 → 비교 → 일상 단위 번역 → 반전 → 나와의 연결 → 결론+자가진단+보낼 사람). **술 편 7장 완성**: `carousels/alcohol/01–07.png` + `sheet.png` + `caption.txt`. 코드: `src/carousel/`(tokens·kit·posts/alcohol.tsx, 모든 숫자는 `episodes/alcohol/data.json`에서 계산), 렌더: `node scripts/carousel.mjs alcohol [카드번호…]`. 다음: 사용자 피드백 → 템플릿 확정 → 다음 주제(개인 관련 주제 먼저: 앱·커피 등, 숫자는 전부 원출처 확인).

---

## 0. 프로젝트 한 줄

**인스타그램 릴스 「세계 속 한국」→ 시리즈 전환 「한국에 대한 착각」**  
UN System Data Commons(WHO/SDG 등) 통계로 한국인의 **상식(착각)**을 깨는 **9:16, 1080×1920, 30fps, Remotion + 나레이션(ElevenLabs v3)** 영상 공장.

- **로컬 경로:** `~/dev/reels-factory/statistics-visualization`
- **Git remote:** `https://github.com/youknowhat/reels-factory.git`  
- **브랜치(2026-09-25 푸시):** `claude/gallant-hopper-qbrotr`
- **원본 Claude Desktop 세션:** 이름 「통계 시각화」, sessionId `0f6ebad6-c2b9-4a92-8763-3e51d4ae36d5`  
- **상세 계획서(동일 내용의 마스터):** `~/.claude/plans/cryptic-foraging-corbato.md`
- **브랜드 아티팩트(톤·토큰·컷 템플릿, 사람이 작성):** https://claude.ai/artifact/URiy5CJi6y3LGxdTD9owQn  
  (파일럿 승인 후 10단계에서 아티팩트와 코드 동기화 예정)

---

## 1. 채널·포맷 확정 사항 (빠지면 안 됨)

### 1.1 형식

| 항목 | 값 |
|------|-----|
| 플랫폼 | Instagram Reels |
| 해상도 | 1080×1920, 30fps |
| 엔진 | Remotion 4.0.524, React 18 |
| 나레이션 | **필수.** ElevenLabs **Creator 플랜 이상** (Voice Library 목소리는 API에 **유료 플랜 필수**) |
| TTS 모델 | `eleven_v3` (`episode.json`의 `"model"`), `[excited]` 등 오디오 태그 사용 가능 |
| BGM | 인스타 업로드 시 앱에서 얹는 전제도 OK. 파일럿 계획에는 Eleven Music/SFX API 캐시도 포함 |
| 폰트 | **세리프 금지.** Pretendard(sans) + IBM Plex Mono(각주·스탬프). `@fontsource`로 로드 |
| 실사 촬영 | **하지 않음.** 인포그래픽·애니메이션·(선택) 3D |
| auto-content와 분리 | `~/dev/instagram/auto-content` 규칙(무음·텍스트 애니 없음)과 맞지 않아 **별도 Remotion 프로젝트** |

### 1.2 콘텐츠·윤리 규칙

- **추정·논쟁·정의·연도·출처**는 **캡션에 항상** (영상 자막만으로는 부족).
- **음주 부추기지 않기** (술 편). WHO 폭음 정의(60g 순 알코올) 명시.
- **한국을 빨강/파랑/노랑 등으로 표시하지 않음** — 한국 정당색과 겹침. **색이 아니라 형태(먹색 Pin/Dot)** 로 한국 표시.
- **하단 남색(잉크) 띠** = 인스타 UI safe zone. **의도적으로 비워 둠.** 사용자가 "왜 아래가 비었냐"고 물었을 때 **유지하기로 확정**.
- **카톡 한 줄 테스트:** 각 편 만들기 전에 "친구에게 보낼 한 줄"을 먼저 쓰고, 그 문장이 성립해야 제작.

### 1.3 바이럴·스토리 원칙 (출산율 v1→v2에서 확정)

**피드백 요약 (v2 시청 후):**

1. 유튜브 뉴스 채널 같음 — 정보는 전달되나 **차별점·훅·감정** 없음  
2. **플랫** — 애니메이션 단순, AI 편집툴 티  
3. **루즈** — "그래서 뭐?" / 이해는 되나 **스토리텔링·리듬** 부족  
4. **한국=빨강** 정치적 리스크  
5. 원하는 반응: "이 계정 대박", "앞으로 뭐 올라오나", "어떻게 이런 생각을", "대박/씁쓸"

**v2 대본 원칙 (출산율, 현 `fertility/episode.json`에 반영됨):**

- 질문 하나로 끝까지: *"한국 출산율, 진짜 끝났나?"*
- 아는 얘기(꼴찌)는 **5초 셋업**, 본론은 **반등 + 왜 + 유통기한(2002년생 cliff)**
- **감정 2번 뒤집기:** 절망 → 반등 → "유통기한"
- **결론은 평서문**, 마지막은 **개인 경험 댓글 유도** ("결혼·출산 소식 늘었나요?") — 투표형 "반등 vs 착시"는 **폐기**
- 차드·UN 전망 vs 실제·순위 퀴즈 등 **v1 요소 제거**
- 컷: 대상 바뀔 때만, 장면 최대 ~4초, `**키워드**` 자막 강조(색 X, 굵기만)
- 나레이션: v3 감정 태그, `VOICE_RATE` 기본 1.12

**초기 기획(1편 출산율 v1, 참고용·재사용 X):**  
UN 0.75 전망·230위 퀴즈·차드 8배·손주 14명·투표 엔딩 — 사용자 피드back으로 **전면 폐기**.

### 1.4 시리즈 전환 (2026-09-25 확정)

| 이전 | 이후 |
|------|------|
| 「세 world 속 한국 #N」 단발 | **「한국에 대한 착각 #N」** — 한국인 **자기 상식**을 UN 데이터로 깸 |
| 1편 출산율 완성본 중심 | **파일럿 = 술** `"한국인, 세계 최고 술꾼?"` |
| 출산율 v2 | **흑백 토큰 적용 완료**, 나중에 착각 포맷으로 **재편집 후보** |

**다음 편 후보 (데이터 방향만 확인됨):**

- 비만: 193개국 중 ~176위, 상위는 태평양 섬  
- 인터넷: 한국 ~15위, 100% 국가들(UAE 등)  
- 출산율: v2를 착각 시리즈 문법으로 재편

---

## 2. 활성 계획 (지금 당장 할 일)

**목표:** 술 편 **도입~반전2 (~16초)** 를 **비주얼 A/B/C 3종**으로 렌더 → 사용자 선택 → **전체 ~35초** 완성 + 캡션.

**중단 지점 (2026-09-25 클라우드 세션):** A/B/C 비교안 거절됨 → **스토리보드 단계로 되돌아감.** `storyboards/alcohol/storyboard.md`에 ~32초 전체 비트·신규 나레이션 초안·모션·사운드·숫자 근거·결정 사항 정리, 키프레임 7장 렌더(`node scripts/storyboard.mjs`). **사용자 방향 승인 대기.** 승인되면: 1→2번 전환만 5초 애니메이틱으로 먼저 → 확인 → 전체 제작. A/B/C 코드(`scenes-a/b/c.tsx`, `src/props/`, `src/motion/`, `Root.tsx`의 `Alcohol-*`)는 제작 시작할 때 삭제 대상.

### 2.1 술 편 스토리 (전체 ~35초, 초안)

| 박자 | 나레이션 | 화면 |
|------|----------|------|
| 착각 | 한국인 술 소비, 세계 몇 위일까요? | 포스트잇 "세계 최고 술꾼?" + 보기 |
| 반전1 | UN 회원국 ○○위. 생각보다 한참 아래 | 예상 마커 vs 실제 한국 (아래) |
| pivot | 근데— | 정적, 한국 표식만 |
| 반전2 | 폭음으로 보면 ○위 | 순위 뒤집힘, 한국 상단 |
| 비유 | 폭음 = 소주 **약 1.3병**, 성인 절반 가까이 한 달 1회 | 병·사람 100명 중 45 |
| 결론 | 많이 마시는 나라 X, **몰아 마시는 나라** | "착각" 도장 + 사운드 로고 |
| 댓글+예고 | 이번 달 1.3병 넘긴 날? / 다음 착각 예고 | 루프 |

**카톡 한 줄:** "야 우리나라 술 소비 세계 60위권이래. 근데 폭음은 3위 ㅋㅋ 몰아 마시는 나라"

### 2.2 확정 데이터 (`src/episodes/alcohol/data.json`, 2026-09-25)

- **회원국 필터:** UN 193개국 (`scripts/lib/un-members.mjs`). 홍콩·마카오·푸에르토리코 등 제외.  
- **연도:** 폭음·1인당 소비 모두 **2020**으로 통일.  
- **재조회:** `node scripts/undata.alcohol.mjs` (MCP read-only)

| 지표 | 한국 | 순위 | n |
|------|------|------|---|
| 1인당 알코올 (L/년, 15+) | 8.47 | **46 / 188** | 188 |
| 폭음 비율 (전체 성인, 30일 내 60g+) | 45.15% | **3 / 185** | 185 |

폭음 1~3위: 룩셈부르크 48.05, 아일랜드 45.77, **한국 45.15**.

**비유 (JSON `analogy`):** 참이슬 후레쉬 15.7%, 360ml → ~44.6g 순 알코올 → WHO 60g ≈ **1.35병**.

### 2.3 16초 비교용 대본 (이미 `episode.json` + VO)

- 파일: `src/episodes/alcohol/episode.json` (`id`: `ep02-alcohol-compare`)  
- 장면: `hook` → `reveal1` → `pivot` → `reveal2` (반전2까지)  
- 나레이션: `public/vo/alcohol/s*.mp3` + alignment json, `timeline.json` **total=390 frames (~13s)** — 전체 16초 목표와 맞추려면 tail/lead 조정 가능  
- **세 스타일이 동일 timeline·동일 VO 공유**

### 2.4 비주얼 A / B / C (사용자 선택 대기)

- **A 종이·콜라주 + 연속 카메라:** 테이블 위 컷아웃, ruler 순위 스티커, Johnny Harris/Vox  
- **B 3D:** `@remotion/three`, 병 탑·사람 100명 중 45명 MetaBallStudios  
- **C 발전형:** 현 fertility 스타일 + 새 모션 원칙만 (기준선)

**공통:** 한국=먹색 **Pin**(순위 strip) / **Dot**(단독), 타국=회색 hollow, UN/기준=점선·**Hatch**, 강조 형광 연두(정당색 회피) — 계획서; **현 코드 `tokens.ts`는 전면 무채색** (연두는 파일럿에서 palette 검증 후 추가).

**모션:** 카메라 연속, `@remotion/noise` 흔들림, `@remotion/motion-blur`, 스프링 `pop`, 매치컷, 12fps 컷아웃 jitter.

**사운드 (미구현):** `scripts/sfx.mjs`, `scripts/music.mjs` → `public/sfx/`, `public/music/` 캐시, Eleven API, **음악은 크레딧 확인 후**.

---

## 3. 구현 체크리스트 (계획 10단계)

| # | 내용 | 상태 |
|---|------|------|
| 1 | `episodes/fertility/`, `episodes/alcohol/`, 공용 `Episode.tsx`, `lib.tsx`, `prep.mjs <ep>`, `stills.mjs <CompositionId>` | **완료** (Root에 `Fertility` + `Alcohol-A/B/C` 등록됨) |
| 2 | `scripts/undata.alcohol.mjs` + `lib/undata-client.mjs`, `un-members.mjs` → `alcohol/data.json` | **완료** |
| 3 | `tokens.ts` 무채색·Pin/Dot/Hatch, fertility scenes 반영 | **완료** |
| 4 | `src/motion/` (Camera, Cutout, PaperTexture, pop) | **완료** (`pop`은 기존 `lib.tsx` 재사용, 새로 안 만듦) |
| 5 | `src/props/` SVG (소주병, 캔, 잔, 사람, 포스트잇, 도장) | **완료** |
| 6 | `alcohol-A`, `alcohol-B`, `alcohol-C` compositions + scenes | **완료** — A=종이콜라주+연속카메라, B=3D 병차트(`@remotion/three`), C=발전형(기존 fertility 문법+새 모션만) |
| 7 | sfx/music 스크립트 | **미착수** (기존 `public/sfx/` tick/tok/slap 재사용 중, 전용 사운드 없음) |
| 8 | alcohol compare 나레이션 v3 | **완료** (`--reuse`로 재생성 방지) |
| 9 | A/B/C 16s 렌더 → 선택 → 35s 전체 + 캡션 | **16s 렌더·전달 완료** (`out/alcohol-{a,b,c}.mp4`, gitignore라 로컬엔 없음 — 사용자에게 파일로 전달됨), **사용자 선택 대기**. 35s 확장은 미착수 |
| 10 | 브랜드 아티팩트 동기화 | **파일럿 승인 후** |

**다음 세션 첫 작업:** 사용자가 A/B/C 중 하나를 고르면 — (1) 나머지 두 스타일의 `scenes-*.tsx` + `Root.tsx`의 `Alcohol-*` Composition 2개 삭제, (2) 고른 스타일로 **35초 전체 대본** 확장 (§2.1 표의 비유·결론·댓글유도 장면 추가, `episode.json` 확장 후 `prep.mjs alcohol` 재실행 — 기존 hook~reveal2 VO는 유지되도록 `--reuse` 우선 시도), (3) 7단계 sfx/music 스크립트, (4) 최종 렌더.

**구현 메모 (다음 세션이 막힐 만한 것들):**
- 이 컨테이너엔 `ffmpeg`이 기본 미설치 — `apt-get update && apt-get install -y ffmpeg` 필요(첫 `apt-get install`이 `libva2` 등 일부 404로 실패하면 `apt-get update` 먼저 재실행 후 재시도하면 해결됨). `remotion render`(mp4)는 ffmpeg 필수, `stills.mjs`(png)는 불필요.
- 브라우저: `/opt/pw-browsers/chromium-1194/...`의 **풀 `chrome` 바이너리는 실패**함("Old Headless mode has been removed"). `REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` 사용.
- `@remotion/three` 추가 시 `@react-three/fiber`가 `@types/react@19`를 끌어와서 `<mesh>`/`<group>` 등 JSX 타입이 전부 깨짐(React 19 타입의 JSX 네임스페이스 변경 때문) — `package.json`에 `"@types/react": "^18.3.12"`를 **직접 고정**해서 해결함(react 런타임은 계속 18.3.1). `@types/three`도 별도 설치 필요(`three@0.169`는 타입을 자체 번들 안 함).
- `Episode.tsx`의 `SceneWithPhrases = SceneT & {phrases: PhraseT[]}`가 교차타입 충돌로 `tsc` 에러 냄 — `Omit<SceneT,"phrases"> & {...}`로 수정함(런타임 영향 없음).
- `scripts/stills.mjs`는 `<CompositionId>`를 그대로 폴더명으로 써서 A/B/C가 서로 덮어쓸 뻔함 — timeline.json 위치는 `-a/-b/-c` 접미사를 뗀 공용 `alcohol/` 폴더에서 찾되, PNG 출력 폴더는 원래 id(`alcohol-a` 등)로 분리하도록 고쳐놓음.
- Episode.tsx가 각 phrase의 **자막을 y≈1372~1436에 이미 자동으로 그림** — 씬 컴포넌트에서 같은 문장을 또 Tape로 하단에 그리면 겹침. A/B/C 전부 그 중복 Tape는 뺐음; 새 장면 만들 때 하단 텍스트는 자막에 맡기고 씬 자체는 y<1400 안에서만 그릴 것(잉크 띠 bandY=1500이 그 아래를 덮어버림).

---

## 4. 코드베이스 맵

```
statistics-visualization/
├── HANDOFF.md                 ← 이 파일
├── README.md                  ← prep/stills/render 요약 (ep01 경로는 구식, fertility/alcohol 사용)
├── .env                       ← gitignore. ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID (채팅에 올리지 말 것)
├── src/
│   ├── Root.tsx               ← Composition 등록: Fertility, Alcohol-A/B/C
│   ├── Episode.tsx            ← timeline + scenes/cues 주입형 플레이어 (2D 전용 — B는 별도 ThreeCanvas 레이어)
│   ├── lib.tsx                ← Canvas, Txt, Stamp, Tape, Dot, Pin, Hatch, prog, pop, …
│   ├── tokens.ts              ← C.* 색, L.bandY=1500 잉크 띠, T.* 타이포
│   ├── fonts.ts
│   ├── props/index.tsx        ← SojuBottle, Can, Glass, Person, PostIt, InkStamp (cutout SVG, 주로 A용)
│   ├── motion/index.tsx       ← Camera(씬 간 연속 카메라 핸드오프), Cutout(정지모션 지터), PaperTexture(그레인)
│   └── episodes/
│       ├── fertility/
│       │   ├── episode.json   ← v2 대본 (eleven_v3)
│       │   ├── timeline.json  ← total 1269f ≈ 42.3s
│       │   ├── scenes.tsx, index.tsx, data.ts, tfr_*.json
│       └── alcohol/
│           ├── episode.json   ← 16s compare 대본만
│           ├── timeline.json  ← total 390f = 13.0s, A/B/C 공유
│           ├── data.json, data.ts  ← PER_CAPITA(46/188), HEAVY(3/185), ANALOGY
│           ├── scenes-a.tsx   ← 종이콜라주: Ruler(rank1↔188 mirror로 반전 연출) + SojuBottle + 연속 Camera
│           ├── scenes-b.tsx   ← 3D: `@remotion/three`, 병 높이=실제 값(barH), 2D 타이포는 별도 오버레이
│           ├── scenes-c.tsx   ← 발전형: fertility의 Strip/Pin 래더 패턴 재사용 + Camera 푸시인만 추가
│           └── index.tsx      ← AlcoholAEpisode/BEpisode/CEpisode, 셋 다 같은 timeline.json
├── public/vo/fertility/       ← mp3+json
├── public/vo/alcohol/         ← s1-1 … s4-2 mp3+json
├── scripts/
│   ├── prep.mjs               ← node scripts/prep.mjs fertility|alcohol [--reuse]
│   ├── stills.mjs             ← node scripts/stills.mjs Fertility|Alcohol-A|... [frames…] (출력 폴더는 id 기준)
│   └── undata.alcohol.mjs
└── package.json               ← remotion 4.0.524, motion-blur, noise, paths, transitions, + @remotion/three,
                                  three, @react-three/fiber, @types/three, @types/react(18로 고정 — 구현 메모 참고)
```

### 4.1 fertility 편 (출산율 v2)

- **Composition id:** `Fertility` (`src/episodes/fertility/index.tsx`)  
- **길이:** ~42.3초 (1269 frames)  
- **상태:** 흑백 리디자인 후 **stills로 구조 검증 완료** (세션 중). `out/` mp4는 git에 없음 — 로컬 재렌더 필요.  
- **대본 전문:** `src/episodes/fertility/episode.json` 참고.

### 4.2 alcohol 편

- **`scenes-a.tsx` / `scenes-b.tsx` / `scenes-c.tsx` + `index.tsx`** — 2026-09-25 클라우드 세션에서 작성, 4장면(hook/reveal1/pivot/reveal2) 모두 구현됨  
- **`Root.tsx`에 `Alcohol-A`/`Alcohol-B`/`Alcohol-C` 등록 완료**  
- **16초 비교 렌더** `out/alcohol-a.mp4` / `-b.mp4` / `-c.mp4` (`out/`은 gitignore — 로컬엔 없음, 사용자에게 파일로 전달됨)  
- **전체 35초 `episode.json` 확장** — 스타일 선택 **후** (비유·결론·댓글 장면 추가 + prep 재실행), 아직 미착수

---

## 5. UN 데이터 파이프라인

- **MCP (read-only):** `https://unsd-datacommons.gcp.un-icc.cloud/mcp` (인증 없음, 2026-09-24 확인)  
- **도구:** `search_indicators`, `get_observations`, `get_child_observations` 등  
- **프로젝트 내:** `scripts/lib/undata-client.mjs`  
- **회원국 목록:** `scripts/lib/un-members.mjs`  
- **술 지표 variable 예:**  
  - 1인당: `undata/sdg/SH_ALC_CONSPT.AGE--Y_GE15`  
  - 폭음: `undata/who/ALCO_HEAVY_E.AGE--Y_GE15__REF_PER_CD--LAST30DAYS`

Claude Desktop 세션에서 작성된 참고 메모(다른 경로):  
`~/.claude/projects/.../memory/un-datacommons-mcp.md` (스크래치 옮기기 전 경로일 수 있음)

---

## 6. ElevenLabs (운영 메모)

- **Free 플랜:** Voice Library 목소리 **API 사용 불가** (`402 payment_required`)  
- **Creator 플랜:** 사용자 업그레이드 완료 (2026-09-24)  
- **Voice ID:** Voices → Explore → Korean → My Voices → Copy voice ID → `.env`  
- **모델:** `eleven_v3` (감정 태그). `prep.mjs`가 `[tag]` strip 처리 (non-v3)  
- **재생 속도:** `VOICE_RATE=1.12` (timeline에 rate 기록, Remotion atempo)  
- **크레딧:** compare 나레이션 1회 생성됨. 이후 **`--reuse`** 로 낭비 방지. SFX/음악은 계획서 크레딧 표 참고.

---

## 7. 렌더·검증 명령

```bash
cd ~/dev/reels-factory/statistics-visualization
npm install

# 나레이션+timeline (키 있으면 ElevenLabs)
node scripts/prep.mjs fertility
node scripts/prep.mjs alcohol
node scripts/prep.mjs alcohol --reuse   # VO 유지, timeline만

# 브라우저 (auto-content 번들 재사용 가능, mac)
export REMOTION_BROWSER="$HOME/dev/instagram/auto-content/node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell"
# 3D(three.js — 스토리보드, 이후 술 편 장면)는 mac에서 ANGLE 필수. 기본 GL은 "Error creating WebGL context"로 실패함.
export REMOTION_GL=angle   # scripts/storyboard.mjs가 이 값을 읽음. `npx remotion render|still`에는 --gl=angle
# mac + ANGLE 실측(2026-09-25): 스토리보드 프레임당 1–3초 → 32초(960프레임) 전체 ≈ 15–50분. 클라우드 소프트웨어 GL(3–20초)보다 훨씬 빠름
# 클라우드 세션(Linux)에서 쓴 경로 — 풀 chrome 바이너리는 안 됨, 반드시 headless_shell:
# export REMOTION_BROWSER="/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"
# mp4 렌더(remotion render)는 ffmpeg 필요 — 없으면: apt-get update && apt-get install -y ffmpeg

node scripts/stills.mjs Fertility
node scripts/stills.mjs Alcohol-A   # 등록 후 — Alcohol-B, Alcohol-C도 동일

npm run studio
npx remotion render Alcohol-A out/alcohol-a.mp4 --browser-executable="$REMOTION_BROWSER"
```

**검증:**

- 데이터: `node scripts/undata.alcohol.mjs` stdout vs `data.json`  
- 화면: `out/stills/<comp>/` — safe area, Pin/Dot 식별, 하단 띠  
- 나레이션: 문장별 길이·6자/s, **사용자 청취 필수** (에이전트는 못 들음)  
- ffprobe로 길이·오디오 스트림  
- 캡션: WHO 60g, 2020, 회원국 기준, 추정·출처

---

## 8. 레퍼런스 (계획서에서 확정)

Factfulness 무지 테스트, NYT You Draw It, Mona Chalabi 비유, Kurzgesagt SK, MetaBallStudios 3D, Johnny Harris/Vox 콜라주, Terrible Maps 톤, 14F(일사에프) — **뉴스 문법 탈출, 재미·20–30대 눈높이**.

---

## 9. 사용자 대화 로그 (의사결정만)

| 시점 | 사용자 요청·피드back |
|------|---------------------|
| 시작 | 바이럴·공유, 나레이션 필요?, 추정/논쟁은 캡션 |
| | AI 티 ↓, **인간이 한땀한땀** 느낌 (실사 X, **인포그래픽/애니**) |
| | 브랜딩 토큰 일관 |
| | **1편 실제 mp4**, ElevenLabs 필요 시 알려달라 |
| | `~/dev/reels-factory/statistics-visualization` 로 이전 |
| | ElevenLabs + **AI 틀 벗어난 비주얼**, 캐주얼, **세리프 X** |
| | Creator 플랜 업그레이드 — 신경 써서 재렌더 |
| | **루즈, 스토리텔링**, 공유 reaction — v2 대본·연출 원칙 확정 |
| | 하단 남색 — **유지** |
| | 여전히 뉴스 채널, 플랫, AI 편집 티, **한국 빨강 금지**, 레퍼 더 |
| | (중단) `[Request interrupted]` |
| | **결과물만 보고 종료** |
| | **reels-factory 클라oud 이어하기** — 코드 원격 + 계획 전달 |
| | (한도) session limit — Git push로 `claude/gallant-hopper-qbrotr` |
| | **클라우드 세션 진행**: 4·5·6단계 구현 + A/B/C 16초 mp4 렌더 완료, 사용자에게 파일 전달 |
| | A/B/C **전부 거절** — "20년 전 모션그래픽", 기울인 뱃지 = 1차원적 손맛 흉내, 재미·전달력·영상미 없음. 코드 전에 **콘셉트·스토리보드부터** 확인받기로 |
| | 이미지 생성은 "꼭 필요할 때만", 필요하면 ElevenLabs 고려 → 이번 방향은 실제 렌더라 불필요. ElevenLabs는 사운드에 쓰기로 제안(클라우드 네트워크가 `api.elevenlabs.io` 차단 중) |

---

## 10. 새 세션용 프롬프트 (복붙)

**방향 승인 전 (지금):** 사용자가 스토리보드(`storyboards/alcohol/storyboard.md` + 키프레임 7장)에 답하지 않았다면 먼저 그걸 보여주고 답을 받을 것. 에피소드 제작 코드 착수 금지.

**방향 승인 후:**
```
프로젝트: ~/dev/reels-factory/statistics-visualization
HANDOFF.md와 storyboards/alcohol/storyboard.md를 읽었어. 스토리보드 방향 승인됨 (+ 결정 사항 답: ...).

1. 1번(테이블) → 2번(소주 짝 탑) 전환만 5초 애니메이틱으로 먼저: src/storyboard/kit3d.tsx 재사용, 0.5배 해상도.
   사운드 포함해서 사용자에게 보여주고 모션 톤 확인받기.
2. 확인되면 A/B/C 코드(scenes-a/b/c.tsx, src/props, src/motion, Root.tsx의 Alcohol-*) 삭제하고
   episodes/alcohol/을 스토리보드 7비트 기준으로 새로 구성. episode.json을 ~32초로 확장
   (신규 나레이션 초안은 storyboard.md), prep.mjs alcohol로 VO 생성 — 기존 4문장은 --reuse로 유지.
3. sfx/music (ElevenLabs Sound Effects·Music API) — 클라우드면 네트워크 허용 + 키 필요, 아니면 로컬.
4. 전체 렌더 → 프레임 연속(컨택트시트)으로 모션 직접 검수한 뒤에만 전달.

규칙: 한국 = 색이 아니라 형태(소주병 실루엣), 기울인 장식 금지, 하단 잉크 띠 유지, 세리프 금지,
씬 텍스트는 y<1350 (자막 y≈1372~1436).
```

---

## 11. 알려진 갭·주의

- **3D 스토리보드 킷 (`src/storyboard/`) 함정:** Remotion의 `ThreeCanvas`는 프레임당 `advance()`를 **한 번**만 돈다 →
  drei `<Instances>`(두 번째 틱에 인스턴스 등록)는 아무것도 안 그림 — `kit3d.tsx`의 `Instanced`(layout effect에서 행렬 기록) 사용.
  three의 투과(transmission)는 **불투명 물체만** 비춰 보여줌 → 어두운 장면에선 병 뒤에 밝은 불투명 배경(`Sweep`)이 있어야 초록이 보임.
  얇은 유리는 `depthWrite:false`여야 안의 액체(투명 오브젝트)가 보임. 캔버스 텍스처(라벨)는 폰트 로드 후 만들고, 그 뒤에 `ThreeCanvas`를 마운트.

- `README.md`의 `src/episode.json`, `out/ep01-fertility.mp4` 경로는 **구조 리팩 전** 설명 — `episodes/fertility/` 기준으로 작업.  
- 계획서의 **형광 연두 강조** vs **현 tokens.ts 전무채색** — C 스타일 또는 palette 검증 후 연두 도입 여부 사용자에게 확인 가능.  
- `out/`·`.env`는 gitignore — 클론 후 `.env`와 렌더는 로컬.  
- 브랜드 아티팩트는 **구(빨강=한국) 일부 가능** — 코드가 **source of truth** (무채색+형태).

---

*작성: Cursor 세션, Claude Desktop 「통계 시각화」로그 + cryptic-foraging-corbato.md + repo 상태 동기화 (2026-09-25).*
