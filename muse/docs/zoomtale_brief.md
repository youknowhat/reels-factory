# 줌테일(@zoomtale) — 돈과 욕망의 흑역사 브리프

주제: 자본 흐름과 대중 심리의 흑역사(버블, 사기, 화폐, 탐욕). 30초 내외 세로 릴스, 다큐 톤 내레이션.

## 흥행 공식
1. Hook 0~3초: 실제 흑백 사진/명화의 특정 부위를 타격하는 미스터리 질문(Pattern Interrupt).
2. Body 4~30초: 자막 1씬 3~4단어, 단서를 단계별로, 결론은 마지막 5초 전까지 유보(Cliffhanger). 음산하고 웅장한 다큐 톤.
3. Loop & CTA: 마지막 문장이 첫 훅 문장으로 자연스럽게 이어지는 루프 + "이 자본의 함정을 피하려면 이 영상의 패턴을 저장해두세요".

## 비주얼
Wikimedia Commons 실제 명화·흑백 사진 우선 → 보완은 Fal Flux(프롬프트 고정: "Authentic historical photograph, 35mm film grain, 19th-century vintage aesthetic, dark atmospheric museum lighting, realistic texture", 9:16). 비네트 없음.

## 실행
`.venv/bin/python run_zoomtale_auto.py --topic "..."` (`--reuse-script`, `--preview`). 대본은 `claude-opus-5` structured output, 키 없으면 내장 대본 폴백 — 보고 시 명시.
