// Mirrors the "세계 속 한국" design system tokens. Canvas px on 1080×1920.
//
// No hue is used to mean "Korea", "the reference series" or "new information" — Korean political
// parties currently span red (국민의힘), blue (민주당·조국혁신당), yellow (정의당) and orange
// (개혁신당), so any saturated accent risks reading as a party color. The whole system is
// achromatic paper/ink instead: identity comes from SHAPE (see lib.tsx's Dot/Pin) and VALUE
// (how dark a mark is), never from color alone.
export const C = {
  atlas100: "#eef2f4", // page background
  atlas200: "#dce3e8", // panels, tracks, the ink band's counterpart
  ink: "#14202b", // primary text AND Korea's own mark/series — solid, the darkest thing on screen
  inkMuted: "#4f5e6b", // secondary text
  onInk: "#eef2f4", // text/marks drawn on an ink-filled surface
  country: "#738290", // every other country's mark — mid gray, never Korea's
  ref: "#a7b2ba", // a comparison series that isn't Korea's own figure (a UN estimate, a world figure) — lighter than `country` and always drawn dashed/hatched so it reads as "not measured the same way", not as a competing identity color
};

// Sans-only, one family at heavy-to-medium weight instead of a display/body pairing — no serif anywhere.
export const F = {
  sans: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
  // Hangul inside mono text (stamps, footnotes) falls back to Pretendard, not a system face with different spacing.
  mono: '"IBM Plex Mono", "Pretendard", monospace',
};

type Style = { fontFamily: string; fontSize: number; fontWeight: number; letterSpacing?: string };
export const T: Record<"hero" | "headline" | "title" | "subtitle" | "label" | "data" | "stamp", Style> = {
  hero: { fontFamily: F.sans, fontSize: 280, fontWeight: 900, letterSpacing: "-0.02em" },
  headline: { fontFamily: F.sans, fontSize: 78, fontWeight: 800, letterSpacing: "-0.01em" },
  title: { fontFamily: F.sans, fontSize: 54, fontWeight: 700 },
  subtitle: { fontFamily: F.sans, fontSize: 46, fontWeight: 600 },
  label: { fontFamily: F.sans, fontSize: 34, fontWeight: 600 },
  data: { fontFamily: F.mono, fontSize: 30, fontWeight: 500 },
  stamp: { fontFamily: F.mono, fontSize: 24, fontWeight: 500, letterSpacing: "0.01em" },
};

export const L = { gutter: 72, safeTop: 220, bandY: 1500 };
