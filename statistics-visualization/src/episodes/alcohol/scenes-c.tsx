import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { ANCHOR, Canvas, Cue, Dot, enter, mix, mixPt, Pin, prog, progInOut, Pt, SceneT, Squiggle, Stamp, Sticker, Tape, Txt } from "../../lib";
import { C, L } from "../../tokens";
import { Camera, PaperTexture } from "../../motion";
import { HEAVY, PER_CAPITA } from "./data";

// Style C — "발전형": the existing 세계 속 한국/fertility visual grammar (Sticker/Tape/Squiggle/
// Pin, achromatic tokens) unchanged; the only new ingredient is the motion module (Camera,
// PaperTexture). This is the baseline the other two styles are judged against.

type P = { sc: SceneT };
const at = (p: { from: number; dur: number }, frac: number) => p.from + Math.round(p.dur * frac);

// Shared rank-ladder geometry — reused as-is for both reveals (reveal1 vs reveal2) so the second
// ranking reads as "the same kind of chart, opposite end" rather than a new chart to parse.
const LAD = { top: 520, bottom: 1300, left: 100, maxLen: 460 };
const rowY = (n: number, i: number) => LAD.top + (i / (n - 1)) * (LAD.bottom - LAD.top);

const scaleV1 = (v: number) => (v / PER_CAPITA.top5[0].value) * LAD.maxLen;
const KOREA1: Pt = { x: LAD.left + scaleV1(PER_CAPITA.koreaValue), y: rowY(PER_CAPITA.n, PER_CAPITA.koreaRank - 1), r: 11 };

const scaleV2 = (v: number) => (v / HEAVY.top5[0].value) * LAD.maxLen;
const KOREA2: Pt = { x: LAD.left + scaleV2(HEAVY.koreaValue), y: rowY(HEAVY.n, HEAVY.koreaRank - 1), r: 14 };

// Push toward a point without recentering fully on it — a felt nudge, not a hard cut, and never
// far enough to drag the ladder's tail under the fixed ink band (only the world layer moves; the
// citation/headline/tape stay screen-locked, added as Camera's *siblings*, not its children).
const camTarget = (p: Pt) => ({ x: mix(540, p.x, 0.5), y: mix(960, p.y, 0.3) });

// ---------------------------------------------------------------- hook · "한국인 술 소비, 세계 몇 위일까요?"
export const Hook: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const [p0] = sc.phrases;
  return (
    <Canvas>
      <PaperTexture />
      <Sticker x={90} y={560} w={880} h={130} rotate={-1.5} f={f} at={p0.from} fill={C.atlas200}>
        <Txt s="title" x={122} y={645} fill={C.ink} style={{ fontSize: 50 }}>한국인 술 소비,</Txt>
      </Sticker>
      <Sticker x={210} y={730} w={660} h={130} rotate={1.5} f={f} at={p0.from + 10} fill={C.ink}>
        <Txt s="title" x={242} y={815} fill={C.onInk} style={{ fontSize: 50 }}>세계 몇 위일까요?</Txt>
      </Sticker>
      <g style={{ opacity: prog(f, 40, 6) }}>
        <Tape x={90} y={980} w={230} h={64} rotate={-2} fill={C.atlas200}><Txt s="label" x={116} y={1024} fill={C.ink}>10위권?</Txt></Tape>
        <Tape x={340} y={1030} w={230} h={64} rotate={1.5} fill={C.atlas200}><Txt s="label" x={366} y={1074} fill={C.ink}>50위권?</Txt></Tape>
        <Tape x={590} y={980} w={280} h={64} rotate={-1} fill={C.atlas200}><Txt s="label" x={616} y={1024} fill={C.ink}>100위 밖?</Txt></Tape>
      </g>
    </Canvas>
  );
};
const hookCues = (sc: SceneT): Cue[] => [{ at: sc.phrases[0].from, kind: "slap" }, { at: sc.phrases[0].from + 10, kind: "slap" }];

// ---------------------------------------------------------------- reveal1 · 188곳 중 46위
const Ladder: React.FC<{ n: number; total: number; top5: { name: string; value: number }[]; scaleV: (v: number) => number; koreaRank: number }> = ({
  n, total, top5, scaleV, koreaRank,
}) => (
  <g>
    <line x1={LAD.left} y1={LAD.top - 8} x2={LAD.left} y2={LAD.bottom + 8} stroke={C.atlas200} strokeWidth={2} />
    {Array.from({ length: Math.floor(n) }, (_, i) => {
      if (i === koreaRank - 1) return null;
      const top5idx = i < top5.length ? i : -1;
      const x = top5idx >= 0 ? LAD.left + scaleV(top5[top5idx].value) : LAD.left + 10;
      return <circle key={i} cx={x} cy={rowY(total, i)} r={top5idx >= 0 ? 5 : 2.2} fill={C.country} />;
    })}
  </g>
);

export const Reveal1: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const [p0] = sc.phrases;
  const land = at(p0, 0.6);
  const n = interpolate(f, [0, land], [0, PER_CAPITA.n], { extrapolateRight: "clamp" });
  const dot = mixPt(ANCHOR.center, KOREA1, progInOut(f, 4, land - 4));
  return (
    <Canvas>
      <PaperTexture />
      <Camera from={{ x: 540, y: 960, scale: 1 }} to={{ ...camTarget(KOREA1), scale: 1.06 }} f={f} start={land} len={36}>
        <Ladder n={n} total={PER_CAPITA.n} top5={PER_CAPITA.top5} scaleV={scaleV1} koreaRank={PER_CAPITA.koreaRank} />
        <g style={{ opacity: prog(f, land, 4) }}>
          <Pin tip={KOREA1} label="한국" />
        </g>
        <Dot p={dot} />
        <Txt s="data" x={KOREA1.x + 30} y={KOREA1.y + 8} fill={C.ink} style={enter(f, land + 4)}>
          한국 {PER_CAPITA.koreaValue.toFixed(2)}L/년
        </Txt>
      </Camera>
      <Stamp text="UN Data Commons · SDG/WHO 2020" w={440} f={f} />
      <Txt s="headline" x={L.gutter} y={410} fill={C.ink}>UN 회원국 188곳 중</Txt>
      <g style={enter(f, land)}>
        <Squiggle x={L.gutter} y={548} w={220} f={f} start={land + 2} />
        <Txt s="headline" x={L.gutter} y={502} fill={C.ink}>46위</Txt>
      </g>
      <Txt s="data" x={LAD.left + LAD.maxLen + 30} y={LAD.top - 20} textAnchor="end" fill={C.inkMuted} style={{ opacity: prog(f, 4, 6) }}>
        1위 {PER_CAPITA.top5[0].name} {PER_CAPITA.top5[0].value.toFixed(1)}L
      </Txt>
    </Canvas>
  );
};
const reveal1Cues = (sc: SceneT): Cue[] => [{ at: at(sc.phrases[0], 0.6), kind: "tok" }, { at: sc.phrases[1].from, kind: "slap" }];

// ---------------------------------------------------------------- pivot · "근데—"
export const Pivot: React.FC<P> = () => {
  const f = useCurrentFrame();
  const beat = f > 4 ? Math.sin((f - 4) / 2.5) * 3 * Math.exp(-(f - 4) / 20) : 0;
  const ring = prog(f, 4, 20);
  return (
    <Canvas>
      <circle cx={ANCHOR.center.x} cy={ANCHOR.center.y} r={mix(22, 130, ring)} fill="none" stroke={C.ink} strokeWidth={3} opacity={(1 - ring) * 0.5} />
      <Dot p={{ ...ANCHOR.center, r: ANCHOR.center.r * prog(f, 0, 4) + beat }} />
    </Canvas>
  );
};
const pivotCues = (): Cue[] => [{ at: 2, kind: "tok" }];

// ---------------------------------------------------------------- reveal2 · 185개국 중 3위 (the flip)
export const Reveal2: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const [p0, p1] = sc.phrases;
  const jumpStart = p1.from - 6, jumpLen = 30;
  const land = at(p1, 0.45);
  const n = interpolate(f, [0, p0.dur], [0, HEAVY.n], { extrapolateRight: "clamp" });
  const dot = mixPt(KOREA1, KOREA2, progInOut(f, jumpStart, jumpLen));
  const push = progInOut(f, jumpStart, jumpLen);
  return (
    <Canvas>
      <PaperTexture />
      <Camera from={{ x: 540, y: 960, scale: 1 }} to={{ ...camTarget(KOREA2), scale: 1.1 }} f={f} start={jumpStart} len={jumpLen}>
        <Ladder n={n} total={HEAVY.n} top5={HEAVY.top5} scaleV={scaleV2} koreaRank={HEAVY.koreaRank} />
        <g style={{ opacity: prog(f, land, 4) }}>
          <Pin tip={KOREA2} label="한국" />
        </g>
        <Dot p={{ ...dot, r: mix(11, 14, push) }} ring />
      </Camera>
      <Stamp text="WHO · 폭음(60g+) 2020" w={330} f={f} />
      <Txt s="headline" x={L.gutter} y={410} fill={C.ink} style={enter(f, 0)}>한 번에 몰아 마시면—</Txt>
      <Txt s="data" x={LAD.left + LAD.maxLen + 30} y={LAD.top - 20} textAnchor="end" fill={C.inkMuted} style={{ opacity: prog(f, 4, 6) }}>
        1위 {HEAVY.top5[0].name} {HEAVY.top5[0].value.toFixed(1)}%
      </Txt>
      <g style={enter(f, land)}>
        <Squiggle x={L.gutter} y={548} w={200} f={f} start={land + 2} />
        <Txt s="headline" x={L.gutter} y={502} fill={C.ink}>3위</Txt>
      </g>
    </Canvas>
  );
};
const reveal2Cues = (sc: SceneT): Cue[] => {
  const jumpStart = sc.phrases[1].from - 6;
  return [{ at: jumpStart, kind: "tick" }, { at: at(sc.phrases[1], 0.45), kind: "slap" }];
};

export const SCENES: Record<string, React.FC<P>> = { hook: Hook, reveal1: Reveal1, pivot: Pivot, reveal2: Reveal2 };
export const CUES: Record<string, (sc: SceneT) => Cue[]> = { hook: hookCues, reveal1: reveal1Cues, pivot: pivotCues, reveal2: reveal2Cues };
export const END_LOOP = 0;
export const SCREEN_TEXT =
  "한국인 술 소비,세계 몇 위일까요?10위권?50위권?100위 밖?UN Data Commons · SDG/WHO 2020UN 회원국 188곳 중46위1위 Romania 16.9L" +
  "생각보다 한참 아래한국 8.47L/년한WHO · 폭음(60g+) 2020한 번에 몰아 마시면—1위 Luxembourg 48.0%3위185개국 중 3위";
