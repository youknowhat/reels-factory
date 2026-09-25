import React, { useId } from "react";
import { mix, progInOut, seeded } from "../lib";

// New motion vocabulary (2026-09-25 handoff, step 4): a continuous camera across scene
// boundaries, a stop-motion "paper" jitter, and a grain overlay. `pop` (the overshoot spring
// already used for stickers/tape) lives in lib.tsx and is reused as-is, not duplicated here.

const CANVAS_CX = 540, CANVAS_CY = 960;

// A "shot": the scene-space point that sits at canvas center, and the zoom/rotation around it.
export type Shot = { x: number; y: number; scale: number; rotate?: number };

const shotTransform = (s: Shot) =>
  `translate(${CANVAS_CX} ${CANVAS_CY}) scale(${s.scale}) rotate(${s.rotate ?? 0}) translate(${-s.x} ${-s.y})`;

// Wraps a scene's content in a single camera move from `from` to `to`. Scenes hand off continuity
// the same way lib.tsx's ANCHOR/mixPt do for the Korea dot: scene N's `to` should equal scene
// N+1's `from`, so the cut lands mid-move instead of resetting — there is no cross-Sequence frame
// available to automate this, so it's an authoring convention, not enforced by types.
export const Camera: React.FC<{ from: Shot; to: Shot; f: number; start: number; len: number; children: React.ReactNode }> = ({
  from, to, f, start, len, children,
}) => {
  const t = progInOut(f, start, len);
  const shot: Shot = { x: mix(from.x, to.x, t), y: mix(from.y, to.y, t), scale: mix(from.scale, to.scale, t), rotate: mix(from.rotate ?? 0, to.rotate ?? 0, t) };
  return <g transform={shotTransform(shot)}>{children}</g>;
};

// Quantizes motion to a lower step rate and offsets by a deterministic per-step wobble, so cutout
// props read as hand-animated stop-motion rather than smoothly tweened. `seed` distinguishes
// independently-jittering props sharing a frame (each needs its own seed or they'd wobble in sync).
export const Cutout: React.FC<{ f: number; seed: number; amount?: number; stepFps?: number; fps?: number; children: React.ReactNode }> = ({
  f, seed, amount = 4, stepFps = 12, fps = 30, children,
}) => {
  const step = Math.floor((f * stepFps) / fps);
  const dx = (seeded(seed + step) - 0.5) * amount;
  const dy = (seeded(seed + step + 1000) - 0.5) * amount;
  const rot = (seeded(seed + step + 2000) - 0.5) * (amount * 0.15);
  return <g transform={`translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${rot.toFixed(2)})`}>{children}</g>;
};

// A full-frame grain wash (SVG feTurbulence, not a raster asset) — the "on a table" texture behind
// paper cutouts. Cheap and deterministic (fixed seed), unlike per-pixel canvas noise.
export const PaperTexture: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => {
  const id = useId();
  return (
    <>
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={7} stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0" />
      </filter>
      <rect x={0} y={0} width={1080} height={1920} filter={`url(#${id})`} opacity={opacity} />
    </>
  );
};
