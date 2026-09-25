import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { Canvas, Cue, enter, mix, prog, progInOut, SceneT, Squiggle, Stamp, Txt } from "../../lib";
import { C, L } from "../../tokens";
import { HEAVY, PER_CAPITA } from "./data";

// Style B — stylized 3D (MetaBallStudios-style bar-of-bottles): camera stays put (no reactive
// R3F camera rig — see note below); instead the bottle group itself moves/scales toward the
// viewer to read as a push-in. Geometry doubles as the chart: bottle height is the real value
// (scripts/undata.alcohol.mjs numbers), not a decorative prop, same "no invented data" rule as
// the 2D ladders in styles A/C. Same 2D typography overlay (Stamp/Squiggle/Tape) as those styles,
// so all three are readable as the same brand.

type P = { sc: SceneT };
const at = (p: { from: number; dur: number }, frac: number) => p.from + Math.round(p.dur * frac);

const INK = "#14202b", COUNTRY = "#9aa7b1";
const FLOOR = -1.5;

const Bottle3D: React.FC<{ x: number; hMax: number; on?: boolean; f: number; at?: number }> = ({ x, hMax, on, f, at: start = 0 }) => {
  const h = Math.max(0.05, hMax * prog(f, start, 14));
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, FLOOR + h / 2, 0]}>
        <cylinderGeometry args={[0.45, 0.5, h, 16]} />
        <meshStandardMaterial color={on ? INK : COUNTRY} roughness={0.5} />
      </mesh>
      <mesh position={[0, FLOOR + h + 0.3, 0]}>
        <cylinderGeometry args={[0.2, 0.28, 0.6, 12]} />
        <meshStandardMaterial color={on ? INK : COUNTRY} roughness={0.5} />
      </mesh>
    </group>
  );
};

const Lights: React.FC = () => (
  <>
    <ambientLight intensity={0.75} />
    <directionalLight position={[5, 8, 6]} intensity={1.15} />
    <directionalLight position={[-5, 3, -5]} intensity={0.3} />
  </>
);

// height ∝ value, on the same 0.5..4.0 world-unit scale in both reveals, so the two bar charts are
// visually comparable even though they're two different metrics.
const barH = (v: number, max: number) => 0.5 + (v / max) * 3.5;

// ---------------------------------------------------------------- hook · "한국인 술 소비, 세계 몇 위일까요?"
export const Hook: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const [p0] = sc.phrases;
  return (
    <AbsoluteFill style={{ backgroundColor: C.atlas100 }}>
      <ThreeCanvas width={1080} height={1920} camera={{ position: [0, 0, 12], fov: 40 }}>
        <Lights />
        <group rotation={[0, f * 0.01, 0]}>
          <Bottle3D x={0} hMax={4.2} on f={f} at={p0.from} />
        </group>
      </ThreeCanvas>
      <Canvas>
        <g style={{ opacity: prog(f, p0.from, 6) }}>
          <Txt s="title" x={L.gutter} y={440} fill={C.ink} style={{ fontSize: 52 }}>한국인 술 소비,</Txt>
          <Txt s="title" x={L.gutter} y={512} fill={C.ink} style={{ fontSize: 52 }}>세계 몇 위일까요?</Txt>
        </g>
      </Canvas>
    </AbsoluteFill>
  );
};
const hookCues = (sc: SceneT): Cue[] => [{ at: sc.phrases[0].from, kind: "slap" }];

// ---------------------------------------------------------------- reveal1 · 188곳 중 46위
const XS1 = [-4, -2.6, -1.3, 0, 1.3];
export const Reveal1: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const [p0] = sc.phrases;
  const land = at(p0, 0.6);
  const push = progInOut(f, land, 30);
  return (
    <AbsoluteFill style={{ backgroundColor: C.atlas100 }}>
      <ThreeCanvas width={1080} height={1920} camera={{ position: [0.6, 0, 20], fov: 44 }}>
        <Lights />
        <group position={[mix(0, 1.6, push), 0, mix(0, 2.2, push)]} rotation={[0, 0.15, 0]}>
          {PER_CAPITA.top5.map((c, i) => (
            <Bottle3D key={c.iso3} x={XS1[i]} hMax={barH(c.value, PER_CAPITA.top5[0].value)} f={f} at={i * 3} />
          ))}
          <Bottle3D x={3.4} hMax={barH(PER_CAPITA.koreaValue, PER_CAPITA.top5[0].value)} on f={f} at={18} />
        </group>
      </ThreeCanvas>
      <Canvas>
        <Stamp text="UN Data Commons · SDG/WHO 2020" w={440} f={f} />
        <Txt s="headline" x={L.gutter} y={410} fill={C.ink}>UN 회원국 188곳 중</Txt>
        <g style={enter(f, land)}>
          <Squiggle x={L.gutter} y={548} w={220} f={f} start={land + 2} />
          <Txt s="headline" x={L.gutter} y={502} fill={C.ink}>46위</Txt>
        </g>
      </Canvas>
    </AbsoluteFill>
  );
};
const reveal1Cues = (sc: SceneT): Cue[] => [{ at: at(sc.phrases[0], 0.6), kind: "tok" }, { at: sc.phrases[1].from, kind: "slap" }];

// ---------------------------------------------------------------- pivot · "근데—" (holds on Korea's bottle)
export const Pivot: React.FC<P> = () => {
  const f = useCurrentFrame();
  const hMax = barH(PER_CAPITA.koreaValue, PER_CAPITA.top5[0].value);
  return (
    <AbsoluteFill style={{ backgroundColor: C.atlas100 }}>
      <ThreeCanvas width={1080} height={1920} camera={{ position: [0, 0, 7], fov: 34 }}>
        <Lights />
        <group rotation={[0, f * 0.012, 0]}>
          <Bottle3D x={0} hMax={hMax} on f={99} at={0} />
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
const pivotCues = (): Cue[] => [{ at: 2, kind: "tok" }];

// ---------------------------------------------------------------- reveal2 · 185개국 중 3위 (the flip)
const XS2 = [-4, -2.6, -1.3, 0, 1.3];
export const Reveal2: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const [p0, p1] = sc.phrases;
  const jumpStart = p1.from - 6, jumpLen = 30;
  const land = at(p1, 0.45);
  const push = progInOut(f, jumpStart, jumpLen);
  return (
    <AbsoluteFill style={{ backgroundColor: C.atlas100 }}>
      <ThreeCanvas width={1080} height={1920} camera={{ position: [-0.6, 0, 20], fov: 44 }}>
        <Lights />
        <group position={[mix(0, -1.3, push), 0, mix(0, 2.4, push)]} rotation={[0, -0.12, 0]}>
          {HEAVY.top5.map((c, i) => (
            <Bottle3D key={c.iso3} x={XS2[i]} hMax={barH(c.value, HEAVY.top5[0].value)} on={c.iso3 === "KOR"} f={f} at={i * 3} />
          ))}
        </group>
      </ThreeCanvas>
      <Canvas>
        <Stamp text="WHO · 폭음(60g+) 2020" w={330} f={f} />
        <Txt s="headline" x={L.gutter} y={410} fill={C.ink} style={enter(f, 0)}>몰아 마시는 '폭음'으로 보면</Txt>
        <g style={enter(f, land)}>
          <Squiggle x={L.gutter} y={548} w={200} f={f} start={land + 2} />
          <Txt s="headline" x={L.gutter} y={502} fill={C.ink}>3위</Txt>
        </g>
      </Canvas>
    </AbsoluteFill>
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
  "한국인 술 소비,세계 몇 위일까요?UN Data Commons · SDG/WHO 2020UN 회원국 188곳 중46위생각보다 한참 아래" +
  "WHO · 폭음(60g+) 2020몰아 마시는 '폭음'으로 보면3위185개국 중 3위";
