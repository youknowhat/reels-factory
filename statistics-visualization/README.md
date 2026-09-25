# statistics-visualization

"세계 속 한국": UN 통계 릴스 시리즈. Remotion, 1080×1920, 30fps.
브랜드 시스템(톤앤매너·토큰·컷 템플릿): https://claude.ai/artifact/URiy5CJi6y3LGxdTD9owQn

## 한 편 만들기
1. `src/episode.json`: 장면별 문장. `sub`는 화면 자막, `tts`는 읽는 발음 (숫자는 한글로 풀어 씁니다).
2. `npm run prep`: 나레이션·효과음을 만들고 `src/timeline.json`을 씁니다.
   - 기본은 macOS 유나 음성(초안)입니다.
   - `.env`에 `ELEVENLABS_API_KEY`와 `ELEVENLABS_VOICE_ID`가 있으면 ElevenLabs 음성을 씁니다.
3. `node scripts/stills.mjs`: 장면별 정지 화면을 `out/stills/`에 뽑아 레이아웃을 확인합니다.
4. `npm run render -- --browser-executable="$REMOTION_BROWSER"`: 결과는 `out/ep01-fertility.mp4`입니다.

`REMOTION_BROWSER`는 auto-content에 이미 받아둔 chrome-headless-shell 경로입니다. 비워두면 Remotion이 새로 받습니다.
