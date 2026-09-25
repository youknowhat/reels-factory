# /ai-carousel — AI 사례 캐러셀 1편 제작

`/ai-carousel` (백로그에서 다음 순위 진행) 또는 `/ai-carousel <사례 설명|URL>` (지정 사례로 진행). 채널 규칙은 `../../../CLAUDE.md`와 `../../../docs/brief.md`.

## 절차
1. **사례 확정.** 인자가 없으면 `research/backlog.md` 최상위 미제작 항목, 있으면 웹으로 확인. `research/posted.json`과 중복 확인. 1차 출처로 사실(누가·언제·무엇을·어떤 AI) 검증 — 확인 안 되면 진행하지 않고 사용자에게 보고.
2. **원고.** `docs/brief.md`의 8장 공식대로 slug 정하고 `posts/<slug>/post.json` 작성(매거진 레이아웃: cover/article/chat/statement/numeral/quote/howto/closing, 톤 dark/light 교차 — 기준작 `posts/found_by_guess`). `posts/<slug>/credits.json`(원본 출처), `posts/<slug>/assets/`(원본 캡처, 사용자 허락된 것만), `posts/<slug>/caption.md` 작성.
   - 연결 점검: 8장 본문만 이어 읽어 하나의 이야기가 되는지, 인접 장이 인과로 이어지는지 확인.
   - 원본 이미지를 쓰는 장은 절반 이하로 유지(aggregator 방어).
   - **사용자 승인 후 렌더로 진행.**
3. **렌더.** `python render.py --post <slug>` → `output/<slug>/01.png…NN.png` + `contact.jpg`.
4. **검수.** `python review.py --post <slug>` FAIL 0 필수. 이어서 컨택트 시트를 사용자에게 전달해 "AI가 만든 티", 이야기 흐름, 톤을 확인받는다(자동 검사 대상 아님).
5. **배포.** 승인 후 `python publish.py --post <slug>` → Drive `reels-factory/<slug>/`. 게시 버튼은 사용자가 누른다. 원작자가 인스타에 있으면 Collab 초대를 캡션 확인 메모에 남긴다.
6. **기록.** `research/posted.json`에 `{slug, title, date, category}` 추가.

## 참고
- 템플릿: `templates/layouts/*.html`(구조) + `templates/themes/magazine.css`(확정 디자인). 새 레이아웃이 필요하면 기존 걸 복제해 최소만 바꾼다.
- 금지어·형식 규칙은 `CLAUDE.md` "절대 원칙" 참고. 매 편 이걸 다시 읽지 말고, 위반 의심될 때만 확인.
