import "pretendard/dist/web/static/Pretendard-Medium.css";
import "pretendard/dist/web/static/Pretendard-SemiBold.css";
import "pretendard/dist/web/static/Pretendard-Bold.css";
import "pretendard/dist/web/static/Pretendard-ExtraBold.css";
import "pretendard/dist/web/static/Pretendard-Black.css";
import "@fontsource/ibm-plex-mono/500.css";
import { continueRender, delayRender } from "remotion";

// Korean faces ship as unicode-range slices; load exactly the weights this episode's text needs before the first frame.
export function waitForFonts(text: string) {
  const handle = delayRender("fonts");
  const faces = [
    '900 280px "Pretendard"',
    '800 78px "Pretendard"',
    '700 54px "Pretendard"',
    '600 46px "Pretendard"',
    '500 34px "Pretendard"',
    '500 30px "IBM Plex Mono"',
  ];
  Promise.all(faces.map((face) => document.fonts.load(face, text)))
    .then(() => document.fonts.ready)
    .then(() => continueRender(handle))
    .catch((e) => { console.error(e); continueRender(handle); });
}
