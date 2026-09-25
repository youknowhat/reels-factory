import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Canvas, Cue, enter, mix, prog, SceneT, Squiggle, Stamp, Txt } from "../../lib";
import { C, L } from "../../tokens";
import { Camera, Cutout, PaperTexture, Shot } from "../../motion";
import { Can, Glass, SojuBottle } from "../../props";
import { HEAVY, PER_CAPITA } from "./data";

// Style A — paper collage + a continuous camera (Johnny Harris/Vox-style explainer): props cut
// from paper, a hand-drawn ruler standing in for the country rank list, one camera move that
// carries across all four scenes instead of a cut-to-cut static frame per scene.

type P = { sc: SceneT };
const at = (p: { from: number; dur: number }, frac: number) => p.from + Math.round(p.dur * frac);

const RULER = { x0: 100, x1: 980, y: 1080 };
const rulerTickX = (rank: number, n: number, mirrored: boolean) =>
  mirrored ? RULER.x1 - ((rank - 1) / (n - 1)) * (RULER.x1 - RULER.x0) : RULER.x0 + ((rank - 1) / (n - 1)) * (RULER.x1 - RULER.x0);

// reveal1 ranks ascending (rank 1 = heaviest, at the left); reveal2 deliberately MIRRORS the axis
// (rank 1 at the right) so Korea's marker visibly flips from left to right between the two
// rankings — a staged reversal, not a claim that the two metrics share one axis.
const KOREA1_X = rulerTickX(PER_CAPITA.koreaRank, PER_CAPITA.n, false);
const KOREA2_X = rulerTickX(HEAVY.koreaRank, HEAVY.n, true);

const SHOT = {
  wide: { x: 540, y: 820, scale: 1 } as Shot,
  low: { x: mix(540, KOREA1_X, 0.55), y: RULER.y - 40, scale: 1.2 } as Shot,
  mid: { x: 540, y: 900, scale: 1.04 } as Shot,
  high: { x: mix(540, KOREA2_X, 0.55), y: RULER.y - 60, scale: 1.22 } as Shot,
};

const Ruler: React.FC<{ total: number; shown: number; mirrored?: boolean; highlightRank: number }> = ({ total, shown, mirrored, highlightRank }) => (
  <g>
    <line x1={RULER.x0} x2={RULER.x1} y1={RULER.y} y2={RULER.y} stroke={C.ink} strokeWidth={3} />
    {Array.from({ length: Math.floor(shown) }, (_, i) => {
      const rank = i + 1;
      if (rank === highlightRank) return null;
      const major = rank % 10 === 1;
      const x = rulerTickX(rank, total, !!mirrored);
      return <line key={rank} x1={x} x2={x} y1={RULER.y} y2={RULER.y - (major ? 22 : 11)} stroke={C.country} strokeWidth={major ? 2.5 : 1.4} />;
    })}
  </g>
);

// ---------------------------------------------------------------- hook · "한국인 술 소비, 세계 몇 위일까요?"
export const Hook: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const [p0] = sc.phrases;
  return (
    <Canvas>
      <PaperTexture opacity={0.07} />
      <Camera from={SHOT.wide} to={SHOT.wide} f={f} start={0} len={1}>
        <Cutout f={f} seed={11} amount={3}>
          <SojuBottle x={190} y={1440} h={230} rotate={-6} fill={C.country} />
        </Cutout>
        <Cutout f={f} seed={23} amount={3}>
          <Can x={340} y={1460} h={150} rotate={8} fill={C.country} />
        </Cutout>
        <Cutout f={f} seed={37} amount={3}>
          <Glass x={480} y={1440} h={100} rotate={-4} level={0.6} />
        </Cutout>
        <g style={{ opacity: prog(f, p0.from, 6) }}>
          <rect x={230} y={520} width={620} height={400} rx={6} fill={C.atlas200} transform="rotate(-2 540 720)" />
          <g transform="rotate(-2 540 720)">
            <Txt s="title" x={270} y={630} fill={C.ink} style={{ fontSize: 46 }}>한국인 술 소비,</Txt>
            <Txt s="title" x={270} y={700} fill={C.ink} style={{ fontSize: 46 }}>세계 몇 위일까요?</Txt>
            <Txt s="label" x={270} y={840} fill={C.inkMuted}>세계 최고 술꾼?</Txt>
          </g>
        </g>
      </Camera>
    </Canvas>
  );
};
const hookCues = (sc: SceneT): Cue[] => [{ at: sc.phrases[0].from, kind: "slap" }];

// ---------------------------------------------------------------- reveal1 · 188곳 중 46위
export const Reveal1: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const [p0] = sc.phrases;
  const land = at(p0, 0.6);
  const shown = interpolate(f, [0, land], [0, PER_CAPITA.n], { extrapolateRight: "clamp" });
  return (
    <Canvas>
      <PaperTexture opacity={0.07} />
      <Camera from={SHOT.wide} to={SHOT.low} f={f} start={land} len={36}>
        <Ruler total={PER_CAPITA.n} shown={shown} highlightRank={PER_CAPITA.koreaRank} />
        <g style={{ opacity: prog(f, land, 6) }}>
          <Cutout f={f} seed={5} amount={2.5}>
            <SojuBottle x={KOREA1_X} y={RULER.y} h={150} fill={C.ink} />
          </Cutout>
        </g>
      </Camera>
      <Stamp text="UN Data Commons · SDG/WHO 2020" w={440} f={f} />
      <Txt s="headline" x={L.gutter} y={410} fill={C.ink}>UN 회원국 188곳 중</Txt>
      <g style={enter(f, land)}>
        <Squiggle x={L.gutter} y={548} w={220} f={f} start={land + 2} />
        <Txt s="headline" x={L.gutter} y={502} fill={C.ink}>46위</Txt>
      </g>
    </Canvas>
  );
};
const reveal1Cues = (sc: SceneT): Cue[] => [{ at: at(sc.phrases[0], 0.6), kind: "tok" }, { at: sc.phrases[1].from, kind: "slap" }];

// ---------------------------------------------------------------- pivot · "근데—" (holds on Korea's marker)
export const Pivot: React.FC<P> = () => {
  const f = useCurrentFrame();
  return (
    <Canvas>
      <PaperTexture opacity={0.07} />
      <Camera from={SHOT.low} to={SHOT.mid} f={f} start={0} len={26}>
        <Cutout f={f} seed={5} amount={5}>
          <SojuBottle x={KOREA1_X} y={RULER.y} h={150} fill={C.ink} />
        </Cutout>
      </Camera>
    </Canvas>
  );
};
const pivotCues = (): Cue[] => [{ at: 2, kind: "tok" }];

// ---------------------------------------------------------------- reveal2 · 185개국 중 3위 (the flip)
export const Reveal2: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const [p0, p1] = sc.phrases;
  const jumpStart = p1.from - 6, jumpLen = 30;
  const land = at(p1, 0.4);
  const shown = interpolate(f, [0, p0.dur], [0, HEAVY.n], { extrapolateRight: "clamp" });
  return (
    <Canvas>
      <PaperTexture opacity={0.07} />
      <Camera from={SHOT.mid} to={SHOT.high} f={f} start={jumpStart} len={jumpLen}>
        <Ruler total={HEAVY.n} shown={shown} mirrored highlightRank={HEAVY.koreaRank} />
        <g style={{ opacity: prog(f, land, 4) }}>
          <Cutout f={f} seed={9} amount={2.5}>
            <SojuBottle x={KOREA2_X} y={RULER.y} h={170} fill={C.ink} />
          </Cutout>
        </g>
      </Camera>
      <Stamp text="WHO · 폭음(60g+) 2020" w={330} f={f} />
      <Txt s="headline" x={L.gutter} y={410} fill={C.ink} style={enter(f, 0)}>몰아 마시는 '폭음'으로 보면</Txt>
      <g style={enter(f, land)}>
        <Squiggle x={L.gutter} y={548} w={200} f={f} start={land + 2} />
        <Txt s="headline" x={L.gutter} y={502} fill={C.ink}>3위</Txt>
      </g>
    </Canvas>
  );
};
const reveal2Cues = (sc: SceneT): Cue[] => {
  const jumpStart = sc.phrases[1].from - 6;
  return [{ at: jumpStart, kind: "tick" }, { at: at(sc.phrases[1], 0.4), kind: "slap" }];
};

export const SCENES: Record<string, React.FC<P>> = { hook: Hook, reveal1: Reveal1, pivot: Pivot, reveal2: Reveal2 };
export const CUES: Record<string, (sc: SceneT) => Cue[]> = { hook: hookCues, reveal1: reveal1Cues, pivot: pivotCues, reveal2: reveal2Cues };
export const END_LOOP = 0;
export const SCREEN_TEXT =
  "한국인 술 소비,세계 몇 위일까요?세계 최고 술꾼?UN Data Commons · SDG/WHO 2020UN 회원국 188곳 중46위생각보다 한참 아래" +
  "WHO · 폭음(60g+) 2020몰아 마시는 '폭음'으로 보면3위185개국 중 3위";
