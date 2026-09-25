import React from "react";
import { F } from "../tokens";

// Storyboard typography: one sans family, strong size contrast, everything on a straight grid —
// no rotation or jitter pretending to be hand-made. The only "texture" comes from the renders.
export const INK = "#14202b";
export const PAPER = "#eef2f4";
export const MUTED = "#56636e";
export const GUTTER = 72;

type TP = {
  x: number; y: number; size: number; weight?: number; color?: string; mono?: boolean;
  anchor?: "start" | "middle" | "end"; tracking?: string; opacity?: number; children: React.ReactNode;
};
export const T: React.FC<TP> = ({ x, y, size, weight = 700, color = INK, mono, anchor = "start", tracking, opacity, children }) => (
  <text
    x={x} y={y} textAnchor={anchor} fill={color} opacity={opacity}
    style={{ fontFamily: mono ? F.mono : F.sans, fontSize: size, fontWeight: weight, letterSpacing: tracking ?? (size >= 90 ? "-0.035em" : size >= 50 ? "-0.02em" : "-0.005em") }}
  >
    {children}
  </text>
);

export const Overlay: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

export const SeriesTag: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <g>
    <T x={GUTTER} y={268} size={28} weight={800} color={dark ? PAPER : INK}>한국에 대한 착각</T>
    <T x={GUTTER + 222} y={268} size={28} weight={500} color={dark ? PAPER : MUTED} mono>#1</T>
  </g>
);

export const Source: React.FC<{ y: number; dark?: boolean; children: React.ReactNode }> = ({ y, dark, children }) => (
  <T x={GUTTER} y={y} size={21} weight={500} mono color={dark ? "#9aa6b0" : MUTED} tracking="0">
    {children}
  </T>
);

// Same placement/weights as Episode.tsx's subtitles so frames show the real final composition.
export const Subtitle: React.FC<{ lines: string[]; dark?: boolean }> = ({ lines, dark }) => (
  <g>
    {lines.map((line, i) => (
      <text
        key={i} x={540} y={lines.length === 2 ? 1372 + i * 64 : 1436} textAnchor="middle" fill={dark ? PAPER : INK}
        style={{ fontFamily: F.sans, fontSize: 46, fontWeight: 600 }}
      >
        {line.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part, j) =>
          part.startsWith("**") ? <tspan key={j} style={{ fontWeight: 800 }}>{part.slice(2, -2)}</tspan> : <tspan key={j}>{part}</tspan>
        )}
      </text>
    ))}
  </g>
);

export const InkBand: React.FC = () => <rect x={0} y={1500} width={1080} height={420} fill={INK} />;

// Photographic light fall-off for the bright studio frames (drawn over the render, under the type).
export const Vignette: React.FC = () => (
  <>
    <defs>
      <radialGradient id="sb-vignette" cx="50%" cy="44%" r="78%">
        <stop offset="55%" stopColor={INK} stopOpacity={0} />
        <stop offset="100%" stopColor={INK} stopOpacity={0.2} />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={1080} height={1500} fill="url(#sb-vignette)" />
  </>
);
