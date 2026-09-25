import React, { useState } from "react";
import { AbsoluteFill } from "remotion";
import "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { ANALOGY, HEAVY, PER_CAPITA } from "../episodes/alcohol/data";
import { waitForFonts } from "../fonts";
import { seeded } from "../lib";
import { PaperTexture } from "../motion";
import {
  BottleField, BrightStudio, CameraRig, crateStack, Crates, DARK_BG, DarkStudio, Figures, PodiumBlock, project,
  SojuBottle, SojuGlass, SpiritsBottle, useMaterials, V3, Placed,
} from "./kit3d";
import { useTextures } from "./labels";
import { GUTTER, InkBand, MUTED, Overlay, PAPER, SeriesTag, Source, Subtitle, T, Vignette } from "./type";

type Cam = { position: V3; target: V3; fov: number };

// ---------------------------------------------------------------- numbers (all from data.json)
// Pure alcohol → 360ml soju bottles at 15.7% (ANALOGY.sojuGrams = 44.6g ethanol per bottle).
const bottlesPerYear = (litres: number) => Math.round((litres * 789) / ANALOGY.sojuGrams);
const KOREA_BOTTLES = bottlesPerYear(PER_CAPITA.koreaValue); // 150
const TOP_BOTTLES = bottlesPerYear(PER_CAPITA.top5[0].value); // 300
const GLASSES = Math.round((ANALOGY.bottlesPerHeavySession * ANALOGY.soju.mL) / 50); // 10 (50ml glass)
const OF_100 = Math.round(HEAVY.koreaValue); // 45

const Scene3D: React.FC<{ cam: Cam; exposure?: number; children: React.ReactNode }> = ({ cam, exposure = 1, children }) => (
  <ThreeCanvas width={1080} height={1920} dpr={1} gl={{ antialias: true, toneMappingExposure: exposure }}>
    <CameraRig {...cam} />
    {children}
  </ThreeCanvas>
);

const Frame: React.FC<{ dark?: boolean; children: React.ReactNode }> = ({ dark, children }) => (
  <AbsoluteFill style={{ backgroundColor: dark ? DARK_BG : "#e8ecee" }}>{children}</AbsoluteFill>
);

function scatter(n: number, rx: number, rz: number, minD: number, seed: number, cz = 0): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; pts.length < n && i < 8000; i++) {
    const a = seeded(seed + i * 2) * Math.PI * 2, r = Math.sqrt(seeded(seed + i * 2 + 1));
    const x = Math.cos(a) * r * rx, z = cz + Math.sin(a) * r * rz;
    if (pts.every(([px, pz]) => Math.hypot(px - x, pz - z) >= minD)) pts.push([x, z]);
  }
  return pts;
}

// ---------------------------------------------------------------- 1 · hook — the stereotype: a table after a night out
const CAM1: Cam = { position: [0.5, 5.2, 15.2], target: [0, 1.25, -1.0], fov: 30 };
const HOOK_STANDING: Placed[] = scatter(22, 1.75, 2.3, 0.72, 101, -1.5).map(([x, z], i) => ({ p: [x, 0, z], ry: seeded(i + 40) * 6 }));

export const F1Hook: React.FC = () => {
  const m = useMaterials();
  const tex = useTextures({ soju: { kind: "bottle", title: "소주", sub: "360ml" } });
  return (
    <Frame dark>
      {tex && (
        <Scene3D cam={CAM1}>
          <DarkStudio spot={[2.5, 8, 8]} target={[0, 0.6, -0.8]} sweepZ={-2.2} glow={{ wallY: 2.2, radius: 8, poolZ: 0.8, poolRadius: 4.5 }} />
          <BottleField m={m} items={HOOK_STANDING} label={tex.soju} />
        </Scene3D>
      )}
      <Overlay>
        <PaperTexture opacity={0.05} />
        <SeriesTag dark />
        <T x={GUTTER} y={418} size={64} weight={700} color={PAPER}>한국인,</T>
        <T x={GUTTER} y={552} size={128} weight={900} color={PAPER}>세계 최고 술꾼?</T>
        <Subtitle lines={["한국인 술 소비,", "세계 몇 위일까요?"]} dark />
        <InkBand />
      </Overlay>
    </Frame>
  );
};

// ---------------------------------------------------------------- 2 · reveal1 — a year of alcohol, in soju crates
const CAM2: Cam = { position: [0, 8, 134], target: [0, 10.5, 0], fov: 23 };
const KR_X = 0.6, RO_X = 6.2;
const KR = crateStack([KR_X, 0, 0], KOREA_BOTTLES / 30);
const RO = crateStack([RO_X, 0, 0], TOP_BOTTLES / 30);
const KR_TOP = KR.crates.length * 2.324, RO_TOP = RO.crates.length * 2.324;

export const F2Reveal1: React.FC = () => {
  const m = useMaterials();
  const tex = useTextures({ soju: { kind: "bottle", title: "소주" } });
  const kr = project([KR_X, KR_TOP, 0], CAM2), ro = project([RO_X, RO_TOP, 0], CAM2);
  const krL = project([KR_X - 2.2, KR_TOP, 0], CAM2).x, roR = project([RO_X + 2.2, RO_TOP, 0], CAM2).x;
  return (
    <Frame>
      {tex && (
        <Scene3D cam={CAM2}>
          <BrightStudio shadowScale={40} shadowFar={10} fog={[220, 300]} />
          <Crates m={m} at={[...KR.crates, ...RO.crates]} />
          <BottleField m={m} items={[...KR.bottles, ...RO.bottles]} label={tex.soju} />
        </Scene3D>
      )}
      <Overlay>
        <Vignette />
        <PaperTexture opacity={0.05} />
        <SeriesTag />
        <T x={GUTTER} y={360} size={36} weight={700}>15세 이상 1인당, 1년 치 술을</T>
        <T x={GUTTER} y={402} size={36} weight={700} color={MUTED}>소주로 바꿔 쌓으면</T>
        {/* #1's height, carried across so the gap above Korea's stack is the point */}
        <line x1={GUTTER} x2={roR} y1={ro.y} y2={ro.y} stroke="#14202b" strokeWidth={3} strokeDasharray="12 10" />
        <T x={roR} y={ro.y - 22} size={34} weight={800} anchor="end">1위 루마니아 {TOP_BOTTLES}병</T>
        <T x={GUTTER - 6} y={kr.y - 118} size={184} weight={900}>46위</T>
        <Source y={kr.y - 68}>{`188개국 중 · UN SDG 3.5.2 · 2020`}</Source>
        <T x={krL - 20} y={kr.y + 10} size={38} weight={800} anchor="end">대한민국 {KOREA_BOTTLES}병</T>
        <Subtitle lines={["UN 회원국 188곳 중", "**46위**."]} />
        <InkBand />
      </Overlay>
    </Frame>
  );
};

// ---------------------------------------------------------------- 3 · pivot — lights out
const CAM3: Cam = { position: [0, 1.2, 10.5], target: [0, 1.0, 0], fov: 30 };

export const F3Pivot: React.FC = () => {
  const m = useMaterials();
  const tex = useTextures({ soju: { kind: "bottle", title: "소주", sub: "360ml" } });
  return (
    <Frame dark>
      {tex && (
        <Scene3D cam={CAM3}>
          <DarkStudio />
          <SojuBottle m={m} label={tex.soju} rotation={[0, -0.25, 0]} />
        </Scene3D>
      )}
      <Overlay>
        <PaperTexture opacity={0.05} />
        <Subtitle lines={["근데—"]} dark />
        <InkBand />
      </Overlay>
    </Frame>
  );
};

// ---------------------------------------------------------------- 4 · reveal2 — binge drinking podium
const CAM4: Cam = { position: [0.25, 3.8, 24.5], target: [0, 2.2, 0], fov: 28 };
const PODIUM: { x: number; h: number; rank: string; iso: string }[] = [
  { x: -1.85, h: 1.25, rank: "2", iso: "IRL" },
  { x: 0, h: 1.75, rank: "1", iso: "LUX" },
  { x: 1.85, h: 0.95, rank: "3", iso: "KOR" },
];
const KO_NAME: Record<string, string> = { LUX: "룩셈부르크", IRL: "아일랜드", KOR: "대한민국" };
const heavyOf = (iso: string) => HEAVY.top5.find((c) => c.iso3 === iso)!.value.toFixed(1) + "%";

export const F4Reveal2: React.FC = () => {
  const m = useMaterials();
  const tex = useTextures({
    kor: { kind: "bottle", title: "소주" },
    other: { kind: "bottle", title: "" },
    p1: { kind: "podium", rank: "1", name: KO_NAME.LUX, value: heavyOf("LUX") },
    p2: { kind: "podium", rank: "2", name: KO_NAME.IRL, value: heavyOf("IRL") },
    p3: { kind: "podium", rank: "3", name: KO_NAME.KOR, value: heavyOf("KOR") },
  });
  const krTop = project([1.85, 0.95 + 2.14, 0], CAM4);
  return (
    <Frame>
      {tex && (
        <Scene3D cam={CAM4}>
          <BrightStudio shadowScale={14} shadowFar={5} />
          {PODIUM.map((b) => (
            <group key={b.iso}>
              <PodiumBlock m={m} position={[b.x, 0, 0]} size={[1.72, b.h, 1.5]} face={tex[`p${b.rank}` as "p1"]} />
              {b.iso === "KOR" ? (
                <SojuBottle m={m} position={[b.x, b.h, 0.05]} rotation={[0, -0.2, 0]} label={tex.kor} />
              ) : (
                <SpiritsBottle m={m} position={[b.x, b.h, 0.05]} rotation={[0, 0.3, 0]} label={tex.other} />
              )}
            </group>
          ))}
        </Scene3D>
      )}
      <Overlay>
        <Vignette />
        <PaperTexture opacity={0.05} />
        <SeriesTag />
        <T x={GUTTER} y={360} size={36} weight={700}>한 자리에서 몰아 마시는</T>
        <T x={GUTTER} y={402} size={36} weight={700} color={MUTED}>‘폭음’ 비율로 보면</T>
        <Source y={446}>{`185개국 중 · WHO · 2020`}</Source>
        <T x={1008} y={krTop.y - 40} size={200} weight={900} anchor="end">3위</T>
        <Subtitle lines={["185개국 중 **3위**예요."]} />
        <InkBand />
      </Overlay>
    </Frame>
  );
};

// ---------------------------------------------------------------- 5 · analogy — what "binge" means, in glasses
const CAM5: Cam = { position: [0, 1.4, 11.3], target: [0, 0.6, 0], fov: 30 };
const SHOTS: V3[] = Array.from({ length: GLASSES }, (_, i) => [-1.12 + (i % 5) * 0.56, 0, i < 5 ? -0.1 : 0.55]);

export const F5Analogy: React.FC = () => {
  const m = useMaterials();
  const tex = useTextures({ soju: { kind: "bottle", title: "소주", sub: "360ml" } });
  return (
    <Frame dark>
      {tex && (
        <Scene3D cam={CAM5}>
          <DarkStudio spot={[1.5, 6, 6]} target={[0, 0.3, 0]} glow={{ wallY: 0.7, radius: 5.2, poolZ: -1.2, poolRadius: 3.2 }} />
          <SojuBottle m={m} position={[1.12, 0.32, -0.95]} rotation={[0, -0.08, Math.PI / 2]} label={tex.soju} />
          {SHOTS.map((p, i) => <SojuGlass key={i} m={m} position={p} level={0.86} />)}
        </Scene3D>
      )}
      <Overlay>
        <PaperTexture opacity={0.05} />
        <SeriesTag dark />
        <T x={GUTTER} y={360} size={36} weight={700} color={PAPER}>WHO 기준 ‘폭음’ = 한 자리 순수 알코올 60g+</T>
        <T x={GUTTER} y={548} size={176} weight={900} color={PAPER}>{GLASSES}잔</T>
        <T x={GUTTER} y={616} size={44} weight={700} color={PAPER}>{`≈ 소주 ${ANALOGY.bottlesPerHeavySession}병`}</T>
        <Source y={662} dark>{`소주 15.7% · 360ml · 잔 50ml 기준 환산`}</Source>
        <Subtitle lines={["폭음은 한 자리에서 소주 **1.35병**,", "열 잔 가까이예요."]} dark />
        <InkBand />
      </Overlay>
    </Frame>
  );
};

// ---------------------------------------------------------------- 6 · scale — 45 in 100
// ~35° down: low enough that the figures read as people, high enough that back rows still show.
const CAM6: Cam = { position: [0, 42, 60.5], target: [0, 0.9, 0.9], fov: 24 };
const PEOPLE: V3[] = Array.from({ length: 100 }, (_, i) => [-6.975 + (i % 10) * 1.55, 0, -6.975 + Math.floor(i / 10) * 1.55]);
const DRINKERS = new Set(
  PEOPLE.map((_, i) => i).sort((a, b) => seeded(a + 900) - seeded(b + 900)).slice(0, OF_100)
);
const DRINKER_BOTTLES: Placed[] = PEOPLE.filter((_, i) => DRINKERS.has(i)).map((p, i) => ({ p: [p[0] + 0.42, 0, p[2] + 0.52], s: 0.78, ry: seeded(i + 70) * 6 }));

export const F6Scale: React.FC = () => {
  const m = useMaterials();
  const tex = useTextures({ soju: { kind: "bottle", title: "소주" } });
  return (
    <Frame>
      {tex && (
        <Scene3D cam={CAM6}>
          <BrightStudio shadowScale={30} shadowFar={4} />
          <Figures m={m} at={PEOPLE} />
          <BottleField m={m} items={DRINKER_BOTTLES} label={tex.soju} />
        </Scene3D>
      )}
      <Overlay>
        <Vignette />
        <PaperTexture opacity={0.05} />
        <SeriesTag />
        <T x={GUTTER} y={360} size={36} weight={700}>지난 한 달, 폭음한 날이 있는 사람</T>
        <T x={GUTTER} y={520} size={150} weight={900}>100명 중 {OF_100}명</T>
        <Source y={574}>{`15세 이상 인구 · WHO · 2020 · ${HEAVY.koreaValue.toFixed(1)}%`}</Source>
        <Subtitle lines={["지난 한 달, 이렇게 마신 날이 있는 사람이", `**100명 중 ${OF_100}명**.`]} />
        <InkBand />
      </Overlay>
    </Frame>
  );
};

// ---------------------------------------------------------------- 7 · end — the conclusion, and the question back
const CAM7: Cam = { position: [0.4, 1.15, 14], target: [0, 1.05, 0], fov: 30 };

export const F7End: React.FC = () => {
  const m = useMaterials();
  const tex = useTextures({ mark: { kind: "bottle", title: "착각", sub: "#1 술" } });
  return (
    <Frame dark>
      {tex && (
        <Scene3D cam={CAM7}>
          <DarkStudio />
          <SojuBottle m={m} label={tex.mark} rotation={[0, -0.15, 0]} />
        </Scene3D>
      )}
      <Overlay>
        <PaperTexture opacity={0.05} />
        <SeriesTag dark />
        <T x={GUTTER} y={410} size={56} weight={700} color={PAPER}>많이 마시는 나라가 아니라,</T>
        <T x={GUTTER} y={536} size={118} weight={900} color={PAPER}>몰아 마시는 나라</T>
        <Subtitle lines={["여러분은 이번 달,", `**${GLASSES}잔** 넘긴 날 있었나요?`]} dark />
        <InkBand />
      </Overlay>
    </Frame>
  );
};

export const FRAMES: [string, React.FC][] = [
  ["01-hook", F1Hook], ["02-reveal1", F2Reveal1], ["03-pivot", F3Pivot], ["04-reveal2", F4Reveal2],
  ["05-analogy", F5Analogy], ["06-scale", F6Scale], ["07-end", F7End],
];

// Every literal drawn by the overlays, for font preloading.
export const FRAME_TEXT =
  "한국에 대한 착각#1한국인,세계 최고 술꾼?술 소비몇 위일까요15세 이상 1인당, 1년 치 술을소주로 바꿔 쌓으면1위 루마니아300병46위대한민국150병188개국 중 · UN SDG 3.5.2 · 2020+" +
  "UN 회원국 188곳 중근데—한 자리에서 몰아 마시는‘폭음’ 비율로 보면3위185개국 중 · WHO · 2020예요WHO 기준 ‘폭음’ = 한 자리 순수 알코올 60g10잔≈ 소주 1.35병" +
  "소주 15.7% · 360ml · 잔 50ml 기준 환산폭음은 한 자리에서열 잔 가까이예요.지난 한 달, 폭음한 날이 있는 사람100명 중 45명15세 이상 인구 · WHO · 2020 · 45.2%" +
  "이렇게 마신 날이 있는 사람이많이 마시는 나라가 아니라,몰아 마시는 나라여러분은 이번 달,넘긴 날 있었나요?0123456789.%";

export const StoryboardFrame: React.FC<{ index: number }> = ({ index }) => {
  useState(() => waitForFonts(FRAME_TEXT));
  const entry = FRAMES[index - 1];
  if (!entry) return null;
  const [, C] = entry;
  return <C />;
};
