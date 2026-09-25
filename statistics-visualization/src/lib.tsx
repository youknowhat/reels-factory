import React from "react";
import { Easing, interpolate } from "remotion";
import { C, L, T } from "./tokens";

export type Phrase = { from: number; dur: number; sub: string[]; audio: string };
export type SceneT = { id: string; from: number; dur: number; phrases: Phrase[] };
export type Pt = { x: number; y: number; r: number };

const out = Easing.bezier(0.2, 0.8, 0.2, 1);
const inOut = Easing.bezier(0.45, 0, 0.25, 1);
// A springier overshoot for things that should feel thrown down, not faded in — see `pop`.
const overshoot = Easing.bezier(0.34, 1.56, 0.64, 1);

// 0→1 over [start, start + len], eased and clamped.
export const prog = (f: number, start: number, len: number, easing = out) =>
  interpolate(f, [start, start + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
export const progInOut = (f: number, start: number, len: number) => prog(f, start, len, inOut);
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const mixPt = (a: Pt, b: Pt, t: number): Pt => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), r: mix(a.r, b.r, t) });

// Fade + small rise, the only entrance used for plain text.
export const enter = (f: number, start: number, len = 8) => {
  const t = prog(f, start, len);
  return { opacity: t, transform: `translateY(${(1 - t) * 18}px)` };
};

// A physical drop: overshoots past 1 then settles — for anything that should feel slapped or
// dropped into place (stickers, tape, a mark landing) rather than a UI element fading in.
export const pop = (f: number, start: number, len = 6) => prog(f, start, len, overshoot);

// Deterministic per-index "randomness" (same every frame, every render) — for hand-placed jitter.
export const seeded = (i: number) => {
  let x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const Canvas: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

type TextProps = React.SVGProps<SVGTextElement> & { s: keyof typeof T };
export const Txt: React.FC<TextProps> = ({ s, style, children, ...rest }) => (
  <text {...rest} style={{ ...T[s], ...style }}>
    {children}
  </text>
);

// A small tilted paper tag — the source stamp. Solid fill (not an outline box), like a label
// stuck onto the frame by hand rather than a UI chip.
export const Stamp: React.FC<{ text: string; w: number; f: number; rotate?: number }> = ({ text, w, f, rotate = -1.6 }) => (
  <g style={{ opacity: prog(f, 0, 6) }} transform={`rotate(${rotate} ${L.gutter} 262)`}>
    <rect x={L.gutter} y={236} width={w} height={52} rx={10} fill={C.atlas200} />
    <Txt s="stamp" x={L.gutter + 16} y={270} fill={C.inkMuted}>
      {text}
    </Txt>
  </g>
);

// A washi-tape strip with angle-cut ends — for calling out a new/surprising number over the chart.
// Default fill is solid ink (a stamped label), so callers using the default should set their
// child text to `C.onInk`; a caller that passes its own (lighter) `fill` keeps ink text.
export const Tape: React.FC<{ x: number; y: number; w: number; h?: number; rotate?: number; fill?: string; children: React.ReactNode }> = ({
  x, y, w, h = 60, rotate = -1.2, fill = C.ink, children,
}) => {
  const cut = 14;
  const pts = [`${x + cut},${y}`, `${x + w},${y}`, `${x + w - cut},${y + h}`, `${x},${y + h}`].join(" ");
  return (
    <g transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}>
      <polygon points={pts} fill={fill} />
      {children}
    </g>
  );
};

// A rough marker underline, drawn on like a highlighter swipe. Reused wherever a number or
// phrase is the point of the frame — the brand's one recurring hand-gesture. It's a value change
// (a solid ink stroke), not a color one, so it reads the same everywhere.
export const Squiggle: React.FC<{ x: number; y: number; w: number; f: number; start: number; color?: string; weight?: number }> = ({
  x, y, w, f, start, color = C.ink, weight = 14,
}) => {
  const d = `M${x} ${y} Q${x + w * 0.28} ${y - 10} ${x + w * 0.5} ${y - 2} T${x + w} ${y + 3}`;
  const t = prog(f, start, 10);
  return (
    <path
      d={d}
      stroke={color}
      strokeWidth={weight}
      strokeLinecap="round"
      fill="none"
      opacity={0.35}
      style={{ strokeDasharray: 900, strokeDashoffset: 900 * (1 - t) }}
    />
  );
};

// A paper sticker that slaps onto the frame: overshoots in scale for a few frames, then sits tilted.
export const Sticker: React.FC<{
  x: number; y: number; w: number; h: number; rotate: number; f: number; at: number;
  fill: string; children: React.ReactNode;
}> = ({ x, y, w, h, rotate, f, at, fill, children }) => {
  const t = prog(f, at, 5);
  const k = mix(1.35, 1, t);
  const cx = x + w / 2, cy = y + h / 2;
  return (
    <g opacity={t > 0 ? 1 : 0} transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${k}) translate(${-cx} ${-cy})`}>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={fill} />
      {children}
    </g>
  );
};

// Diagonal hatch pattern (ink lines on transparent) — texture standing in for a color state
// ("this is the shrinking/warning group") without introducing a new hue.
export const Hatch: React.FC<{ id: string; color?: string; pitch?: number }> = ({ id, color = C.ink, pitch = 8 }) => (
  <pattern id={id} width={pitch} height={pitch} patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
    <rect width={pitch} height={pitch} fill={C.atlas200} />
    <line x1={0} y1={0} x2={0} y2={pitch} stroke={color} strokeWidth={pitch * 0.42} />
  </pattern>
);

// Korea's mark is never a color — it's the one dark, ringed shape among lighter or hollow ones.
// `Dot`: the roaming spotlight mark (a hero number's decimal point, a point on a line chart).
// `Pin`: a map-pin silhouette for rank-strips, where many small country-circles sit together and
// Korea needs a different SILHOUETTE, not just a different fill, to be found at a glance.
export const Dot: React.FC<{ p: Pt; ring?: boolean }> = ({ p, ring }) => {
  const r = Math.max(0, p.r);
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={r + 7} fill="none" stroke={C.ink} strokeWidth={1.5} opacity={0.35} />
      <circle cx={p.x} cy={p.y} r={r} fill={C.ink} stroke={ring ? C.atlas100 : "none"} strokeWidth={ring ? 4 : 0} />
    </g>
  );
};

// tip = the exact data point; the head bulges upward from it, so it reads as "pointing at" the value.
export const pin = (tip: Pt) => {
  const r = Math.max(1, tip.r);
  const k = 2.6; // head center is k·r above the tip
  return `M${tip.x} ${tip.y} C${tip.x - r * 1.5} ${tip.y - r * 1.1} ${tip.x - r * 1.3} ${tip.y - r * k} ${tip.x} ${tip.y - r * k} C${tip.x + r * 1.3} ${tip.y - r * k} ${tip.x + r * 1.5} ${tip.y - r * 1.1} ${tip.x} ${tip.y} Z`;
};
export const Pin: React.FC<{ tip: Pt; label?: string }> = ({ tip, label }) => {
  const r = Math.max(1, tip.r);
  return (
    <g>
      <path d={pin({ ...tip, r: r + 3 })} fill="none" stroke={C.ink} strokeWidth={1.5} opacity={0.3} />
      <path d={pin(tip)} fill={C.ink} />
      {label && (
        <Txt s="stamp" x={tip.x} y={tip.y - r * 2.6 - 6} textAnchor="middle" fill={C.onInk} style={{ fontSize: r * 1.1 }}>
          {label}
        </Txt>
      )}
    </g>
  );
};

// Anchors where the Korea mark rests between scenes, so a hand-off (one scene's dot becoming the
// next scene's) lands in the right spot without each scene knowing about the others' layout.
export const ANCHOR = {
  center: { x: 540, y: 860, r: 22 }, // where an episode starts and ends, so the loop is seamless
  decimal: { x: 277, y: 786, r: 25 }, // the decimal point of a 280px hero number set at the gutter
};

export type Cue = { at: number; kind: "tick" | "tok" | "slap" };
