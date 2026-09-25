import React, { useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import "../fonts"; // Pretendard 500–900 + IBM Plex Mono 500 @font-face declarations
import { FONT, H, M, P, W } from "./tokens";

// Korean faces ship as unicode-range slices, so load every weight against the exact text on the
// cards before the first frame is captured.
export const useFonts = (text: string) => {
  useState(() => {
    const handle = delayRender("carousel fonts");
    const faces = [500, 600, 700, 800, 900].map((w) => `${w} 40px "Pretendard"`).concat('500 22px "IBM Plex Mono"');
    Promise.all(faces.map((f) => document.fonts.load(f, text)))
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle))
      .catch((e) => { console.error(e); continueRender(handle); });
    return null;
  });
};

// One editorial frame for every card: just the body and a small source line at the bottom. No
// running header, page count or swipe arrow (Instagram already shows the account and the dots), no
// tilt, stickers or emoji — hierarchy comes only from type size, ink density and the one accent.
export const Card: React.FC<{ source?: React.ReactNode; children: React.ReactNode }> = ({ source, children }) => (
  <AbsoluteFill style={{ background: P.paper, color: P.ink, fontFamily: FONT.sans, wordBreak: "keep-all" }}>
    <div style={{ position: "absolute", left: M.x, right: M.x, top: M.bodyTop, bottom: M.bodyBottom }}>{children}</div>
    {source && (
      <div style={{ position: "absolute", left: M.x, right: M.x, bottom: 64, fontSize: 21, fontWeight: 500, lineHeight: 1.5, letterSpacing: "-0.005em", color: P.muted }}>
        {source}
      </div>
    )}
  </AbsoluteFill>
);

type TextProps = { size: number; weight?: number; color?: string; lh?: number; style?: React.CSSProperties; children: React.ReactNode };
// Big type tightens as it grows, the way a magazine sets display headlines.
export const Text: React.FC<TextProps> = ({ size, weight = 700, color = P.ink, lh, style, children }) => (
  <div
    style={{
      fontSize: size, fontWeight: weight, color, whiteSpace: "pre-line",
      lineHeight: lh ?? (size >= 200 ? 0.9 : size >= 90 ? 1.1 : size >= 50 ? 1.22 : 1.45),
      letterSpacing: size >= 200 ? "-0.055em" : size >= 90 ? "-0.04em" : size >= 50 ? "-0.028em" : "-0.01em",
      ...style,
    }}
  >
    {children}
  </div>
);
// The card's one emphasis. Use it once per card, on the word or number the card exists to say.
export const Accent: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: P.accent }}>{children}</span>;

// ——— Data marks ———

// A soju-bottle silhouette for isotype stacks: one glyph = one bottle.
export const Bottle: React.FC<{ w: number; color: string }> = ({ w, color }) => (
  <svg width={w} height={w * 2.5} viewBox="0 0 20 50" style={{ display: "block" }}>
    <rect x={7} y={0} width={6} height={5} rx={1} fill={color} />
    <rect x={7.6} y={5.5} width={4.8} height={10} fill={color} />
    <path d="M7.6 15.5 C7.6 20 3 21.5 3 26.5 L3 47 Q3 50 6 50 L14 50 Q17 50 17 47 L17 26.5 C17 21.5 12.4 20 12.4 15.5 Z" fill={color} />
  </svg>
);

// n bottles in rows of `cols`, filled bottom-up from the left so stacks read like bars made of bottles.
export const BottleStack: React.FC<{ n: number; cols: number; w: number; gap: number; color: string }> = ({ n, cols, w, gap, color }) => {
  const rows = Math.ceil(n / cols);
  return (
    <div style={{ display: "flex", flexDirection: "column-reverse", gap }}>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} style={{ display: "flex", gap }}>
          {Array.from({ length: Math.min(cols, n - r * cols) }, (_, c) => <Bottle key={c} w={w} color={color} />)}
        </div>
      ))}
    </div>
  );
};

// A shot glass (outline) filled `fill` (0–1) from the bottom.
export const ShotGlass: React.FC<{ w: number; fill: number; id: string }> = ({ w, fill, id }) => {
  const h = w * 1.15, inset = w * 0.14, sw = 3;
  const pts = `${sw},${sw} ${w - sw},${sw} ${w - inset},${h - sw} ${inset},${h - sw}`;
  const top = sw + (h - 2 * sw) * (1 - fill * 0.86); // liquid stops a little below the rim
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs><clipPath id={id}><polygon points={pts} /></clipPath></defs>
      <rect x={0} y={top} width={w} height={h} fill={P.ink30} clipPath={`url(#${id})`} />
      <polygon points={pts} fill="none" stroke={P.ink} strokeWidth={sw} strokeLinejoin="round" />
    </svg>
  );
};

// 100 dots, the first `on` in full ink, the rest faint — "N out of 100 people".
export const UnitGrid: React.FC<{ on: number; d: number; gap: number }> = ({ on, d, gap }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(10, ${d}px)`, gap }}>
    {Array.from({ length: 100 }, (_, i) => (
      <div key={i} style={{ width: d, height: d, borderRadius: "50%", background: i < on ? P.ink : P.ink20 }} />
    ))}
  </div>
);

// Every ranked country as one hairline tick, 1st on the left; Korea's tick is full ink and tall.
export const RankRuler: React.FC<{ n: number; rank: number; width: number; label: string; first: string }> = ({ n, rank, width, label, first }) => {
  const step = width / (n - 1);
  const kx = (rank - 1) * step;
  return (
    <div style={{ position: "relative", width, height: 190 }}>
      {Array.from({ length: n }, (_, i) =>
        i === rank - 1 ? null : <div key={i} style={{ position: "absolute", left: i * step - 1, top: 84, width: 2, height: 44, background: P.ink30 }} />
      )}
      <div style={{ position: "absolute", left: kx - 3, top: 48, width: 6, height: 80, background: P.ink }} />
      <div style={{ position: "absolute", left: kx - 3, top: 0, fontSize: 30, fontWeight: 800, color: P.ink, whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ position: "absolute", left: 0, top: 144, fontSize: 26, fontWeight: 600, color: P.muted, whiteSpace: "nowrap" }}>{first}</div>
      <div style={{ position: "absolute", right: 0, top: 144, fontSize: 26, fontWeight: 600, color: P.muted }}>{n}위</div>
    </div>
  );
};

export type Row = { rank: number; name: string; value: string; korea?: boolean };
// A magazine-style ranking table: hairline rules, mono numbers; Korea's row in full ink on a faint band, the rest muted.
export const RankTable: React.FC<{ rows: Row[] }> = ({ rows }) => (
  <div style={{ borderTop: `2px solid ${P.ink}` }}>
    {rows.map((r) => (
      <div
        key={r.rank}
        style={{
          display: "flex", alignItems: "baseline", gap: 32, padding: "18px 16px", borderBottom: `1px solid ${P.ink12}`,
          color: r.korea ? P.ink : P.muted, background: r.korea ? P.ink12 : "transparent",
        }}
      >
        <span style={{ fontFamily: FONT.mono, fontSize: 30, width: 40 }}>{r.rank}</span>
        <span style={{ fontSize: 42, fontWeight: r.korea ? 800 : 700, letterSpacing: "-0.02em", flex: 1 }}>{r.name}</span>
        <span style={{ fontFamily: FONT.mono, fontSize: 36, fontWeight: 500 }}>{r.value}</span>
      </div>
    ))}
  </div>
);

// All cards of a post side by side at 1/3 scale — for reviewing a post at a glance.
export const SHEET = { scale: 1 / 3, gap: 16 };
export const sheetSize = (n: number) => ({
  width: Math.round(SHEET.gap + n * (W * SHEET.scale + SHEET.gap)),
  height: Math.round(H * SHEET.scale + 2 * SHEET.gap),
});
export const Sheet: React.FC<{ cards: React.FC[] }> = ({ cards }) => (
  <AbsoluteFill style={{ background: P.ink, flexDirection: "row", gap: SHEET.gap, padding: SHEET.gap }}>
    {cards.map((C, i) => (
      <div key={i} style={{ width: W * SHEET.scale, height: H * SHEET.scale, position: "relative", overflow: "hidden", flex: "none" }}>
        <div style={{ width: W, height: H, transform: `scale(${SHEET.scale})`, transformOrigin: "0 0", position: "absolute" }}>
          <C />
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
