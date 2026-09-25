---
name: classic-reel
description: "@theclasssssic(Muse)" 고전 명화 스토리 릴스 1편을 주제→사실 확인→대본→스토리보드→렌더→검수→구글 드라이브까지 제작. `/classic-reel` 또는 `/classic-reel <작품>`.
---

작업 디렉터리: `/Users/junghyun.park/dev/reels-factory/muse` (실행은 항상 `.venv/bin/python`).
규칙 원본은 이 디렉터리의 `CLAUDE.md` "theclasssssic 제작 원칙"과 "검수 기준" — 이 스킬은 절차만 담는다. 엔진(`vd_engine.py`)은 읽지 않는다.

1. **주제** — `$ARGUMENTS`가 있으면 그 작품. 없으면 `ls episodes`로 이미 만든 작품을 확인하고, 새 후보 3개를 제안해 사용자가 고르게 한다.
   후보 기준: 호기심을 끄는 반전이 **화면에서 직접 보일 것**, 작가 사후 70년+ 퍼블릭 도메인, Commons에 고해상도 원본이 있을 것.
2. **사실 확인** — 소장 미술관 공식 설명(WebFetch)을 먼저, 위키백과는 보조. 이야기가 기대는 사실과 소수설 여부를 에피소드 docstring에 적는다.
3. **이미지** — Commons에서 가장 큰 퍼블릭 도메인 파일을 `output/<slug>/assets/painting.jpg`(+ 같은 이름 `.json`에 title·page·license)로 저장. 너무 크면 8000px로 축소. 격자 시트 1장으로 좌표를 잡는다.
4. **대본** — `docs/theclasssssic_brief.md` 양식(주제문·교훈·세 문장 요약·비트표·연결 점검)으로 쓰고 **사용자 확인 후** 진행.
5. **에피소드** — `episodes/<slug>.py` 작성(기준작 `episodes/arnolfini_mirror.py`, 특수 연출은 CLAUDE.md "완성 에피소드" 참고). 스토리보드 1장(각 컷 첫 프레임)으로 크롭을 확인하고 고친다.
6. **렌더·검수** — `vd_engine.py --episode <slug> --no-bgm` → `review.py --episode <slug>` FAIL 0·WARN 0 → 자막-화면 정렬 그리드(한 장 4프레임, 폭 340px, 4장 이내)로 자막마다 화면이 맞는지 육안 확인.
7. **캡션·배포** — `output/<slug>/caption.md`(CLAUDE.md 캡션 규칙, 확인 필요 항목은 끝 괄호) → 미리보기 렌더(`--no-bgm` 없이) → `publish.py --episode <slug>`. 업로드가 멈추거나 실패하면 그대로 재실행, 중복 파일이 생기면 `rclone dedupe --dedupe-mode newest`.
8. **보고** — Drive 경로, 길이, 검수 결과, 게시 전 확인 항목만 짧게.

토큰: 렌더 출력은 `| tail -1`, 이미지 확인은 격자·스토리보드·정렬 그리드 외에 따로 읽지 않는다. 대본 확정 이후 편당 약 40K 이내.
