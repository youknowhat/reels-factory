import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BIRTHS_KR, GOV_KOR, H1_2026, KOREA_RANK_2023, TFR_2023, TOP_2023, UN_KOR } from "./data";
import { ANCHOR, Canvas, Cue, Dot, enter, Hatch, mix, mixPt, prog, progInOut, Pt, seeded, SceneT, Squiggle, Stamp, Sticker, Tape, Txt } from "../../lib";
import { C, L } from "../../tokens";

type P = { sc: SceneT };
// A phrase-relative moment: `at(p, 0.5)` = halfway through phrase p.
const at = (p: { from: number; dur: number }, frac: number) => p.from + Math.round(p.dur * frac);

// ---------------------------------------------------------------- 1 · "한국은 끝났다"
const OVER = { x: 110, y: 720, w: 860, h: 170, rotate: -3 };
// The big sticker's period, after its -3° tilt — the Korea dot lands here.
const OVER_PERIOD: Pt = { x: 902, y: 812, r: 14 };
const OVER_T = { s1: 4, s2: 12, s3: 20, big: 30, dot: 38 };

export const Over: React.FC<P> = () => {
  const f = useCurrentFrame();
  const dot = mixPt(ANCHOR.center, OVER_PERIOD, progInOut(f, OVER_T.dot, 10));
  return (
    <Canvas>
      <Sticker x={90} y={380} w={330} h={100} rotate={-5} f={f} at={OVER_T.s1} fill={C.ink}>
        <Txt s="title" x={122} y={450} fill={C.onInk}>국가 소멸</Txt>
      </Sticker>
      <Sticker x={600} y={530} w={330} h={100} rotate={4} f={f} at={OVER_T.s2} fill={C.atlas200}>
        <Txt s="title" x={632} y={600} fill={C.ink}>인구 붕괴</Txt>
      </Sticker>
      <Sticker x={150} y={1020} w={480} h={100} rotate={3} f={f} at={OVER_T.s3} fill={C.atlas200}>
        <Txt s="title" x={182} y={1090} fill={C.ink}>출산율 세계 꼴찌</Txt>
      </Sticker>
      <Sticker {...OVER} f={f} at={OVER_T.big} fill={C.ink}>
        <Txt s="hero" x={880} y={845} textAnchor="end" fill={C.onInk} style={{ fontSize: 100 }}>KOREA IS OVER</Txt>
      </Sticker>
      <Dot p={dot} />
    </Canvas>
  );
};
const overCues = (): Cue[] => [
  ...[OVER_T.s1, OVER_T.s2, OVER_T.s3, OVER_T.big].map((a) => ({ at: a, kind: "slap" as const })),
  { at: OVER_T.dot + 10, kind: "tok" },
];

// ---------------------------------------------------------------- 2 · 0.72, 230th of 232
const LAD = { top: 560, bottom: 1300, left: 72, maxLen: 368 };
const step = (LAD.bottom - LAD.top) / TFR_2023.length;
const rowY = (i: number) => LAD.top + i * step;
const rowX = (i: number) => LAD.left + (TFR_2023[i] / TFR_2023[0]) * LAD.maxLen;
const K = KOREA_RANK_2023 - 1;
const KOREA_ROW: Pt = { x: rowX(K), y: rowY(K), r: 10 };

const Strip: React.FC<{ n: number }> = ({ n }) => (
  <g>
    <line x1={LAD.left} y1={LAD.top - 6} x2={LAD.left} y2={LAD.bottom + 6} stroke={C.atlas200} strokeWidth={2} />
    {TFR_2023.slice(0, Math.floor(n)).map((_, i) =>
      i === K ? null : <circle key={i} cx={rowX(i)} cy={rowY(i)} r={2.4} fill={C.country} />
    )}
  </g>
);

export const Bottom: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const [p0, p1] = sc.phrases;
  if (f < p1.from) {
    const n = Math.round(interpolate(f, [0, 14], [0, 72], { extrapolateRight: "clamp" }));
    const dot = mixPt(OVER_PERIOD, ANCHOR.decimal, progInOut(f, 0, 10));
    return (
      <Canvas>
        <Stamp text="국가데이터처 · 2023" w={300} f={f} />
        <Txt s="title" x={L.gutter} y={440} fill={C.ink}>2023년 한국 합계출산율</Txt>
        <Squiggle x={L.gutter} y={826} w={600} f={f} start={12} />
        <Txt s="hero" x={242} y={800} textAnchor="end" fill={C.ink}>0</Txt>
        <Txt s="hero" x={322} y={800} fill={C.ink}>{String(n).padStart(2, "0")}</Txt>
        <Dot p={dot} />
        <Txt s="label" x={L.gutter} y={910} fill={C.inkMuted} style={enter(f, 14)}>여성 1명이 평생 낳는 아이 수</Txt>
      </Canvas>
    );
  }
  const land = at(p1, 0.62);
  const n = interpolate(f, [p1.from, land], [0, TFR_2023.length], { extrapolateRight: "clamp" });
  const dot = mixPt(ANCHOR.decimal, KOREA_ROW, progInOut(f, p1.from, land - p1.from));
  return (
    <Canvas>
      <Stamp text="UN WPP 2024 · 2023" w={320} f={99} />
      <Txt s="headline" x={72} y={410} fill={C.ink}>232곳 중</Txt>
      <g style={enter(f, land)}>
        <Squiggle x={72} y={548} w={210} f={f} start={land + 2} />
        <Txt s="headline" x={72} y={502} fill={C.ink}>230위</Txt>
      </g>
      <Txt s="data" x={LAD.left + LAD.maxLen + 40} y={572} fill={C.inkMuted} style={{ opacity: prog(f, p1.from + 2, 6) }}>
        1위 {TOP_2023.name} {TOP_2023.value}
      </Txt>
      <Strip n={n} />
      <Txt s="data" x={KOREA_ROW.x + 34} y={KOREA_ROW.y + 10} fill={C.ink} style={enter(f, land + 4)}>
        한국 0.72 · 아래로는 홍콩·마카오뿐
      </Txt>
      <Dot p={dot} />
    </Canvas>
  );
};
const bottomCues = (sc: SceneT): Cue[] => [
  { at: 14, kind: "tick" },
  { at: at(sc.phrases[1], 0.62), kind: "tok" },
];

// ---------------------------------------------------------------- 3 · 100 adults → 13 grandchildren
const Person: React.FC<{ x: number; y: number; on: boolean; i: number; s: number }> = ({ x, y, on, i, s }) => {
  const dx = (seeded(i) - 0.5) * 6, dy = (seeded(i + 500) - 0.5) * 6, rot = (seeded(i + 1000) - 0.5) * 18;
  return (
    <g transform={`translate(${x + dx} ${y + dy}) rotate(${rot.toFixed(1)}) scale(${s})`} fill={on ? C.ink : C.atlas200}>
      <circle cx={11} cy={5} r={4.6} />
      <rect x={5} y={11} width={12} height={10} rx={4} />
    </g>
  );
};
const grandCut = (sc: SceneT) => at(sc.phrases[0], 0.55);

export const Grandkids: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const cut = grandCut(sc);
  const shown = Math.round(100 * prog(f, 0, 10));
  const left = Math.round(mix(100, 13, prog(f, cut, 14)));
  const filled = Math.min(shown, left);
  const after = f >= cut;
  return (
    <Canvas>
      <Stamp text="단순 계산 · 0.72 유지 가정" w={370} f={f} />
      <Txt s="title" x={72} y={420} fill={C.ink}>어른 100명의 손주는?</Txt>
      {Array.from({ length: 100 }, (_, i) => (
        <Person key={i} x={72 + (i % 10) * 42} y={496 + Math.floor(i / 10) * 46} on={i < filled} i={i} s={1.6} />
      ))}
      <Txt s="label" x={560} y={620} fill={C.inkMuted}>{after ? "손주 세대" : "지금 어른"}</Txt>
      <Txt s="hero" x={560} y={780} fill={after ? C.ink : C.ink} style={{ fontSize: 150 }}>{left}명</Txt>
      <Squiggle x={560} y={806} w={300} f={f} start={cut + 14} />
      <Txt s="data" x={72} y={1010} fill={C.inkMuted} style={enter(f, cut + 14)}>
        여성 50명 × 0.72 = 36명 → 여성 18명 × 0.72 = 13명
      </Txt>
    </Canvas>
  );
};
const grandkidsCues = (sc: SceneT): Cue[] => [{ at: grandCut(sc) + 14, kind: "tick" }];

// ---------------------------------------------------------------- 4 · "근데—"
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

// ---------------------------------------------------------------- 5 · two years up, faster than the UN expected
const RB = { X0: 150, X1: 880, Y0: 1120, Y1: 560, lo: 0.6, hi: 1.3, from: 2015, to: 2025 };
const rx = (yr: number) => RB.X0 + ((yr - RB.from) / (RB.to - RB.from)) * (RB.X1 - RB.X0);
const ry = (v: number) => RB.Y0 - ((v - RB.lo) / (RB.hi - RB.lo)) * (RB.Y0 - RB.Y1);
const unLine = (a: number, b: number) =>
  UN_KOR.slice(a - 2000, b - 2000 + 1).map((v, i) => `${i ? "L" : "M"}${rx(a + i).toFixed(1)} ${ry(v).toFixed(1)}`).join(" ");
const GOV_PT = GOV_KOR.map(([yr, v]) => ({ x: rx(yr), y: ry(v) }));
export const REBOUND_END: Pt = { ...GOV_PT[2], r: 13 };
const rbTimes = (sc: SceneT) => ({ y24: at(sc.phrases[0], 0.4), y25: at(sc.phrases[0], 0.75) });

export const Rebound: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const [, p1] = sc.phrases;
  const { y24, y25 } = rbTimes(sc);
  const solid = prog(f, 0, 12), proj = prog(f, 8, 8);
  const seg1 = prog(f, 12, y24 - 12), seg2 = prog(f, y24, y25 - y24);
  const lead = mixPt(ANCHOR.center, { ...GOV_PT[0], r: 10 }, progInOut(f, 0, 12));
  const pop = (a: number) => prog(f, a, 5);
  return (
    <Canvas>
      <defs>
        <clipPath id="rb-solid"><rect x={RB.X0 - 8} y={0} width={(rx(2023) - RB.X0) * solid + 8} height={1920} /></clipPath>
        <clipPath id="rb-proj"><rect x={rx(2023) - 4} y={0} width={(rx(2025) - rx(2023)) * proj + 12} height={1920} /></clipPath>
      </defs>
      <Stamp text="UN WPP 2024 / 국가데이터처" w={410} f={99} />
      <Txt s="title" x={72} y={410} fill={C.ink}>한국 합계출산율 2015–2025</Txt>
      <line x1={72} x2={120} y1={470} y2={470} stroke={C.ref} strokeWidth={6} strokeDasharray="2 8" />
      <Txt s="label" x={132} y={482} fill={C.ink}>UN 추정 · 예측(점선)</Txt>
      <circle cx={560} cy={470} r={10} fill={C.ink} />
      <Txt s="label" x={584} y={482} fill={C.ink}>정부 발표</Txt>
      {[0.6, 0.8, 1.0, 1.2].map((v) => (
        <g key={v}>
          <line x1={RB.X0} x2={RB.X1} y1={ry(v)} y2={ry(v)} stroke={C.atlas200} strokeWidth={1} opacity={0.7} />
          <Txt s="data" x={RB.X0 - 14} y={ry(v) + 10} textAnchor="end" fill={C.inkMuted}>{v.toFixed(1)}</Txt>
        </g>
      ))}
      {[2015, 2020, 2025].map((yr) => (
        <Txt key={yr} s="data" x={rx(yr)} y={RB.Y0 + 50} textAnchor="middle" fill={C.inkMuted}>{yr}</Txt>
      ))}
      <path d={unLine(2015, 2023)} fill="none" stroke={C.ref} strokeWidth={6} strokeDasharray="2 10" strokeLinecap="round" clipPath="url(#rb-solid)" />
      <path d={unLine(2023, 2025)} fill="none" stroke={C.ref} strokeWidth={6} strokeDasharray="12 10" clipPath="url(#rb-proj)" />
      {/* official figures: one source, so its own connected line */}
      <line x1={GOV_PT[0].x} y1={GOV_PT[0].y} x2={mix(GOV_PT[0].x, GOV_PT[1].x, seg1)} y2={mix(GOV_PT[0].y, GOV_PT[1].y, seg1)} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      <line x1={GOV_PT[1].x} y1={GOV_PT[1].y} x2={mix(GOV_PT[1].x, GOV_PT[2].x, seg2)} y2={mix(GOV_PT[1].y, GOV_PT[2].y, seg2)} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      {f < 12 ? <Dot p={lead} /> : <Dot ring p={{ ...GOV_PT[0], r: 10 }} />}
      <Dot ring p={{ ...GOV_PT[1], r: 10 * pop(y24) }} />
      <Dot ring p={{ ...GOV_PT[2], r: 13 * pop(y25) }} />
      <g opacity={prog(f, y25 + 4, 1)}>
        <Tape x={520} y={800} w={330} h={64} rotate={-2}>
          <Txt s="title" x={548} y={850} fill={C.onInk} style={{ fontSize: 44 }}>2년 연속 ↗</Txt>
        </Tape>
      </g>
      <g style={enter(f, p1.from)}>
        <Txt s="label" x={rx(2025) - 24} y={ry(0.8) - 24} textAnchor="end" fill={C.ink} style={{ fontWeight: 800 }}>실제 0.80</Txt>
        <Txt s="data" x={rx(2025) - 24} y={ry(0.749) + 74} textAnchor="end" fill={C.inkMuted}>UN 예측 0.75</Txt>
      </g>
    </Canvas>
  );
};
const reboundCues = (sc: SceneT): Cue[] => {
  const { y24, y25 } = rbTimes(sc);
  return [{ at: y24, kind: "tick" }, { at: y25, kind: "tok" }, { at: y25 + 4, kind: "slap" }];
};

// ---------------------------------------------------------------- 6 · +15.4% in H1 2026
const SURGE_DOT: Pt = { x: 490, y: 790, r: 22 };
export const Surge: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const [, p1] = sc.phrases;
  const v = interpolate(f, [0, 16], [0, H1_2026.pct], { extrapolateRight: "clamp" });
  const whole = Math.floor(v + 1e-6), tenth = Math.floor((v - whole) * 10 + 1e-6);
  const dot = mixPt(REBOUND_END, SURGE_DOT, progInOut(f, 0, 10));
  return (
    <Canvas>
      <Stamp text="국가데이터처 · 2026년 6월 인구동향" w={470} f={f} />
      <Txt s="title" x={L.gutter} y={440} fill={C.ink}>2026년 상반기 출생아</Txt>
      <Squiggle x={L.gutter} y={826} w={800} f={f} start={14} />
      <Txt s="hero" x={460} y={800} textAnchor="end" fill={C.ink} style={{ fontSize: 230 }}>+{whole}</Txt>
      <Txt s="hero" x={520} y={800} fill={C.ink} style={{ fontSize: 230 }}>{tenth}%</Txt>
      <Dot p={dot} />
      <Txt s="label" x={L.gutter} y={910} fill={C.inkMuted} style={enter(f, 16)}>
        14만 5,804명 · 1년 전보다 1만 9,430명 더
      </Txt>
      <g opacity={prog(f, p1.from, 1)}>
        <Tape x={72} y={980} w={600} h={80} rotate={-1.5}>
          <Txt s="title" x={104} y={1038} fill={C.onInk}>증가 폭 · 역대 최대</Txt>
        </Tape>
      </g>
    </Canvas>
  );
};
const surgeCues = (sc: SceneT): Cue[] => [{ at: 16, kind: "tick" }, { at: sc.phrases[1].from, kind: "slap" }];

// ---------------------------------------------------------------- 7–8 · births by birth year: the 90s wall, then the cliff
const BC = { X0: 120, X1: 900, base: 1150, top: 600, max: 800000, barW: 34 };
const slot = (BC.X1 - BC.X0) / BIRTHS_KR.length;
const bx = (i: number) => BC.X0 + i * slot + (slot - BC.barW) / 2;
const bh = (v: number) => (v / BC.max) * (BC.base - BC.top);
const by = (v: number) => BC.base - bh(v);
const idx = (yr: number) => BIRTHS_KR.findIndex(([y]) => y === yr);
const WALL = [1991, 1995], CLIFF = [2002, 2006];
const inRange = (yr: number, [a, b]: number[]) => yr >= a && yr <= b;

const Bracket: React.FC<{ from: number; to: number; y: number; t: number }> = ({ from, to, y, t }) => {
  const x1 = bx(idx(from)), x2 = bx(idx(to)) + BC.barW;
  return (
    <path d={`M${x1} ${y + 16} V${y} H${mix(x1, x2, t)}${t >= 1 ? ` V${y + 16}` : ""}`} fill="none" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
  );
};

// Three groups, three treatments — none of them a color: context bars are plain gray, the boom
// cohort (the story) is solid ink, the cliff cohort (the warning) is hatched ink-on-gray.
const BirthChart: React.FC<{ f: number; grow: (yr: number) => number; wall: boolean; cliff: boolean }> = ({ f, grow, wall, cliff }) => (
  <g>
    <defs><Hatch id="cliffHatch" /></defs>
    <line x1={BC.X0 - 10} x2={BC.X1} y1={BC.base} y2={BC.base} stroke={C.inkMuted} strokeWidth={2} />
    {BIRTHS_KR.map(([yr, v], i) => {
      const g = grow(yr);
      if (g <= 0) return null;
      const fill = wall && inRange(yr, WALL) ? C.ink : cliff && inRange(yr, CLIFF) ? "url(#cliffHatch)" : C.country;
      const h = bh(v) * g;
      return <path key={yr} d={`M${bx(i)} ${BC.base} V${BC.base - h + 6} a6 6 0 0 1 6 -6 H${bx(i) + BC.barW - 6} a6 6 0 0 1 6 6 V${BC.base} Z`} fill={fill} />;
    })}
    {[1990, 1995, 2000, 2005].map((yr) => (
      <Txt key={yr} s="data" x={bx(idx(yr)) + BC.barW / 2} y={BC.base + 46} textAnchor="middle" fill={C.inkMuted}>{yr}</Txt>
    ))}
    <Txt s="data" x={BC.X0 - 10} y={BC.base + 92} fill={C.inkMuted} style={{ fontSize: 24 }}>태어난 해</Txt>
  </g>
);

const whyTimes = (sc: SceneT) => ({ wall: sc.phrases[1].from, tag: at(sc.phrases[1], 0.6), marry: sc.phrases[2].from });
// The 70만 reference stops before the 2000s bars, leaving room for the cliff's label.
const L70_END = bx(idx(2000)) + BC.barW;
const Line70: React.FC<{ o: number }> = ({ o }) => (
  <g opacity={o}>
    <line x1={BC.X0 - 10} x2={L70_END} y1={by(700000)} y2={by(700000)} stroke={C.ink} strokeWidth={2} strokeDasharray="8 8" />
    <Txt s="data" x={L70_END} y={by(700000) - 14} textAnchor="end" fill={C.ink}>70만</Txt>
  </g>
);
const WallTag: React.FC<{ f: number; start: number }> = ({ f, start }) => (
  <g opacity={prog(f, start, 1)}>
    <Bracket from={WALL[0]} to={WALL[1]} y={by(730678) - 34} t={prog(f, start, 6)} />
    <Tape x={bx(idx(1991)) - 6} y={by(730678) - 116} w={250} h={60} rotate={-2}>
      <Txt s="label" x={bx(idx(1991)) + 18} y={by(730678) - 74} fill={C.onInk} style={{ fontWeight: 800 }}>지금 30대</Txt>
    </Tape>
  </g>
);

export const Why: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const t = whyTimes(sc);
  const grow = (yr: number) => (yr > 1999 ? 0 : prog(f, (yr - 1990) * 1.2, 10));
  return (
    <Canvas>
      <Stamp text="국가데이터처(옛 통계청) 출생통계" w={440} f={f} />
      <Txt s="title" x={72} y={410} fill={C.ink}>태어난 해별 출생아 수</Txt>
      <BirthChart f={f} grow={grow} wall={f >= t.wall} cliff={false} />
      <Line70 o={prog(f, t.wall, 6)} />
      <WallTag f={f} start={t.tag} />
      <g opacity={prog(f, t.marry, 1)}>
        <Tape x={430} y={470} w={560} h={62} rotate={1.5} fill={C.atlas200}>
          <Txt s="label" x={456} y={512} fill={C.ink}>+ 혼인 건수 2024·2025 연속 증가</Txt>
        </Tape>
      </g>
    </Canvas>
  );
};
const whyCues = (sc: SceneT): Cue[] => {
  const t = whyTimes(sc);
  return [{ at: t.wall, kind: "tick" }, { at: t.tag, kind: "slap" }, { at: t.marry, kind: "slap" }];
};

const cliffTimes = (sc: SceneT) => ({ grow: sc.phrases[0].from, dark: sc.phrases[1].from, tag: at(sc.phrases[1], 0.5) });
export const Cliff: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const t = cliffTimes(sc);
  const grow = (yr: number) => (yr <= 1999 ? 1 : prog(f, t.grow + (yr - 2000) * 1.5, 10));
  const cx1 = bx(idx(CLIFF[0]));
  return (
    <Canvas>
      <Stamp text="국가데이터처(옛 통계청) 출생통계" w={440} f={99} />
      <Txt s="title" x={72} y={410} fill={C.ink}>태어난 해별 출생아 수</Txt>
      <BirthChart f={f} grow={grow} wall cliff={f >= t.dark} />
      <Line70 o={1} />
      <WallTag f={99} start={0} />
      <g opacity={prog(f, t.dark, 4)}>
        <Bracket from={CLIFF[0]} to={CLIFF[1]} y={by(496911) - 34} t={prog(f, t.dark, 6)} />
        <Tape x={cx1 - 30} y={by(496911) - 150} w={260} h={104} rotate={2}>
          <Txt s="label" x={cx1 - 6} y={by(496911) - 106} fill={C.onInk} style={{ fontWeight: 800 }}>40만 명대</Txt>
          <Txt s="label" x={cx1 - 6} y={by(496911) - 64} fill={C.onInk} style={{ opacity: prog(f, t.tag, 4) }}>약 1/3 ↓</Txt>
        </Tape>
      </g>
    </Canvas>
  );
};
const cliffCues = (sc: SceneT): Cue[] => {
  const t = cliffTimes(sc);
  return [{ at: t.dark, kind: "slap" }, { at: t.tag, kind: "tick" }];
};

// ---------------------------------------------------------------- 9 · "반등은 진짜. 다만 유통기한이 있을지도" (loops back to the start)
export const END_LOOP = 22; // frames of the tail spent carrying the dot back to the center
const END_PERIOD: Pt = { x: 668, y: 546, r: 15 };
const TAG = { x: 72, y: 680, w: 720, h: 190, rotate: -3 };
const TAG_HOLE: Pt = { x: 128, y: 772, r: 16 };

export const End: React.FC<P> = ({ sc }) => {
  const f = useCurrentFrame();
  const [p0, p1, p2] = sc.phrases;
  const leave = prog(f, sc.dur - END_LOOP - 6, 8);
  const toHole = progInOut(f, p1.from, 10);
  const home = progInOut(f, sc.dur - END_LOOP, END_LOOP - 4);
  const dot = mixPt(mixPt({ ...END_PERIOD, r: 15 * prog(f, p0.from + 4, 4) }, TAG_HOLE, toHole), ANCHOR.center, home);
  const tcx = TAG.x + TAG.w / 2, tcy = TAG.y + TAG.h / 2;
  const tagIn = prog(f, p1.from, 5);
  const notch = 60;
  return (
    <Canvas>
      <g opacity={1 - leave}>
        <g style={enter(f, p0.from)}>
          <Txt s="hero" x={72} y={560} fill={C.ink} style={{ fontSize: 110 }}>반등은 진짜</Txt>
        </g>
        {/* a price tag, its hole where the Korea dot sits */}
        <g opacity={tagIn > 0 ? 1 : 0} transform={`translate(${tcx} ${tcy}) rotate(${TAG.rotate}) scale(${mix(1.3, 1, tagIn)}) translate(${-tcx} ${-tcy})`}>
          <polygon
            points={`${TAG.x + notch},${TAG.y} ${TAG.x + TAG.w},${TAG.y} ${TAG.x + TAG.w},${TAG.y + TAG.h} ${TAG.x + notch},${TAG.y + TAG.h} ${TAG.x},${TAG.y + TAG.h / 2}`}
            fill={C.ink}
          />
          <Txt s="title" x={TAG.x + 110} y={TAG.y + 82} fill={C.onInk}>유통기한</Txt>
          <Txt s="label" x={TAG.x + 110} y={TAG.y + 140} fill={C.onInk}>90년대생이 30대인 동안</Txt>
        </g>
        <g style={enter(f, p2.from)}>
          <path d="M72 960 H1008 V1150 H240 L190 1200 L196 1150 H72 Z" fill={C.atlas200} />
          <Txt s="title" x={112} y={1040} fill={C.ink}>요즘 주변에 결혼·출산 소식,</Txt>
          <Txt s="title" x={112} y={1108} fill={C.ink}>늘었나요? 댓글로 알려주세요</Txt>
        </g>
      </g>
      <Dot p={dot} />
    </Canvas>
  );
};
const endCues = (sc: SceneT): Cue[] => [
  { at: sc.phrases[0].from + 4, kind: "tok" },
  { at: sc.phrases[1].from, kind: "slap" },
  { at: sc.dur - 4, kind: "tok" },
];

export const SCENES: Record<string, React.FC<P>> = {
  over: Over, bottom: Bottom, grandkids: Grandkids, pivot: Pivot, rebound: Rebound, surge: Surge, why: Why, cliff: Cliff, end: End,
};

// Sound cues live next to the animation timings they belong to, so the two can't drift apart.
export const CUES: Record<string, (sc: SceneT) => Cue[]> = {
  over: overCues, bottom: bottomCues, grandkids: grandkidsCues, pivot: pivotCues, rebound: reboundCues,
  surge: surgeCues, why: whyCues, cliff: cliffCues, end: endCues,
};

// Every literal string drawn on screen (subtitles are added separately), for font preloading.
export const SCREEN_TEXT =
  "국가 소멸인구 붕괴출산율 세계 꼴찌KOREA IS OVER국가데이터처 · 2023년 한국 합계출산율여성 1명이 평생 낳는 아이 수" +
  "UN WPP 2024232곳 중230위1위 소말리아 6.13한국 0.72 · 아래로는 홍콩·마카오뿐단순 계산 · 0.72 유지 가정어른 100명의 손주는?" +
  "손주 세대지금 어른명여성 50명 × 0.72 = 36명 → 여성 18명 × 0.72 = 13명한국 합계출산율 2015–2025UN 추정 · 예측(점선)정부 발표" +
  "2년 연속 ↗실제 0.80UN 예측 0.75국가데이터처 · 2026년 6월 인구동향2026년 상반기 출생아+0123456789%14만 5,804명 · 1년 전보다 1만 9,430명 더" +
  "증가 폭 · 역대 최대국가데이터처(옛 통계청) 출생통계태어난 해별 출생아 수태어난 해70만지금 30대+ 혼인 건수 2024·2025 연속 증가40만 명대약 1/3 ↓" +
  "반등은 진짜유통기한90년대생이 30대인 동안요즘 주변에 결혼·출산 소식,늘었나요? 댓글로 알려주세요";
