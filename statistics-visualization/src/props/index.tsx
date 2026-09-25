import React from "react";
import { mix, pop, seeded, Txt } from "../lib";
import { C } from "../tokens";

// Reusable cutout-style SVG props for the alcohol episode (and future episodes): flat, straight-
// edged silhouettes in the achromatic ink/paper system — same "shape and value carry meaning, not
// color" rule as lib.tsx's Dot/Pin. Every prop stands on its own local origin (x,y) = its base
// (or center, where noted) so callers place many of them in a row/grid without recomputing geometry.

// Base = bottom-center. Straight-edged silhouette (cap → neck → shoulder → body), sized by total
// height `h`; width follows from it. Flat cutout look on purpose — these are paper props, not
// rendered glass.
export const SojuBottle: React.FC<{ x: number; y: number; h?: number; scale?: number; rotate?: number; fill?: string; opacity?: number }> = ({
  x, y, h = 220, scale = 1, rotate = 0, fill = C.country, opacity = 1,
}) => {
  const w = h * 0.32, neckW = w * 0.34, capW = neckW * 1.15;
  const yBody = -h * 0.62, yShoulder = -h * 0.76, yNeck = -h * 0.93;
  const d = `M${-w / 2} 0 L${w / 2} 0 L${w / 2} ${yBody} L${neckW / 2} ${yShoulder} L${neckW / 2} ${yNeck} L${capW / 2} ${yNeck} L${capW / 2} ${-h} L${-capW / 2} ${-h} L${-capW / 2} ${yNeck} L${-neckW / 2} ${yNeck} L${-neckW / 2} ${yShoulder} L${-w / 2} ${yBody} Z`;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rotate})`} opacity={opacity}>
      <path d={d} fill={fill} />
    </g>
  );
};

// Base = bottom-center. A can's rim reads as a thin top ellipse + tab, same flat-fill silhouette.
export const Can: React.FC<{ x: number; y: number; h?: number; scale?: number; rotate?: number; fill?: string; opacity?: number }> = ({
  x, y, h = 140, scale = 1, rotate = 0, fill = C.country, opacity = 1,
}) => {
  const w = h * 0.62;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rotate})`} opacity={opacity}>
      <rect x={-w / 2} y={-h} width={w} height={h} rx={w * 0.1} fill={fill} />
      <ellipse cx={0} cy={-h} rx={w / 2} ry={w * 0.11} fill={fill} />
      <rect x={-w * 0.06} y={-h - 8} width={w * 0.14} height={10} rx={4} fill={fill} />
    </g>
  );
};

// Base = bottom-center. Tapered tumbler; `level` (0–1) fills from the bottom for "half a glass"
// beats — the rest stays an outline so the empty portion still reads as the same glass.
export const Glass: React.FC<{ x: number; y: number; h?: number; scale?: number; rotate?: number; level?: number; fill?: string }> = ({
  x, y, h = 100, scale = 1, rotate = 0, level = 1, fill = C.ink,
}) => {
  const wTop = h * 0.64, wBot = wTop * 0.72;
  const outline = `M${-wBot / 2} 0 L${wBot / 2} 0 L${wTop / 2} ${-h} L${-wTop / 2} ${-h} Z`;
  const lh = h * Math.max(0, Math.min(1, level));
  const wAtLevel = mix(wBot, wTop, lh / h);
  const fillD = `M${-wBot / 2} 0 L${wBot / 2} 0 L${wAtLevel / 2} ${-lh} L${-wAtLevel / 2} ${-lh} Z`;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rotate})`}>
      {level > 0 && <path d={fillD} fill={fill} />}
      <path d={outline} fill="none" stroke={C.ink} strokeWidth={4} />
    </g>
  );
};

// Center = head/torso midpoint (matches fertility's inline grid unit). `jitter` seeds a fixed
// per-instance wobble for hand-placed crowds; pass 0/undefined for a single deliberately-placed figure.
export const Person: React.FC<{ x: number; y: number; s?: number; on?: boolean; jitter?: number; rotate?: number }> = ({
  x, y, s = 1, on = true, jitter, rotate = 0,
}) => {
  const dx = jitter ? (seeded(jitter) - 0.5) * 6 : 0;
  const dy = jitter ? (seeded(jitter + 500) - 0.5) * 6 : 0;
  const rot = jitter ? (seeded(jitter + 1000) - 0.5) * 18 : rotate;
  return (
    <g transform={`translate(${x + dx} ${y + dy}) rotate(${rot.toFixed(1)}) scale(${s})`} fill={on ? C.ink : C.atlas200}>
      <circle cx={11} cy={5} r={4.6} />
      <rect x={5} y={11} width={12} height={10} rx={4} />
    </g>
  );
};

// Top-left = (x,y). A sticky note with one folded corner — the hook scene's quiz card.
export const PostIt: React.FC<{ x: number; y: number; w?: number; h?: number; rotate?: number; fill?: string; f: number; at?: number; children?: React.ReactNode }> = ({
  x, y, w = 280, h = 280, rotate = -2, fill = C.atlas200, f, at = 0, children,
}) => {
  const fold = w * 0.16;
  const cx = x + w / 2, cy = y + h / 2;
  const t = pop(f, at, 6);
  const k = mix(1.25, 1, t);
  return (
    <g opacity={t > 0 ? 1 : 0} transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${k}) translate(${-cx} ${-cy})`}>
      <path d={`M${x} ${y} H${x + w - fold} L${x + w} ${y + fold} V${y + h} H${x} Z`} fill={fill} />
      <path d={`M${x + w - fold} ${y} L${x + w} ${y + fold} L${x + w - fold} ${y + fold} Z`} fill={C.atlas100} opacity={0.7} />
      {children}
    </g>
  );
};

// Center = (x,y). A rough-edged stamped ring, slapped down like Sticker (overshoot-then-settle).
// Distinct from lib.tsx's `Stamp` (a flat source-citation tag) — this is the editorial "착각" mark.
export const InkStamp: React.FC<{ x: number; y: number; r?: number; rotate?: number; text: string; f: number; at: number }> = ({
  x, y, r = 140, rotate = -8, text, f, at,
}) => {
  const t = pop(f, at, 8);
  const k = mix(1.4, 1, t);
  const notches = 28;
  const edge = Array.from({ length: notches }, (_, i) => {
    const a = (i / notches) * Math.PI * 2;
    const j = 1 + (seeded(i) - 0.5) * 0.07;
    return `${i ? "L" : "M"}${(x + Math.cos(a) * r * j).toFixed(1)} ${(y + Math.sin(a) * r * j).toFixed(1)}`;
  }).join(" ") + "Z";
  return (
    <g opacity={t > 0 ? 0.88 * t + 0.12 : 0} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${k}) translate(${-x} ${-y})`}>
      <path d={edge} fill="none" stroke={C.ink} strokeWidth={10} opacity={0.85} />
      <circle cx={x} cy={y} r={r * 0.72} fill="none" stroke={C.ink} strokeWidth={6} opacity={0.7} />
      <Txt s="headline" x={x} y={y + 16} textAnchor="middle" fill={C.ink} style={{ fontSize: r * 0.42 }}>{text}</Txt>
    </g>
  );
};
