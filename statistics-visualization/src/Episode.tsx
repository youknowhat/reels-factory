import React, { useState } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { waitForFonts } from "./fonts";
import { Canvas, Cue, SceneT, Txt } from "./lib";
import { C, L } from "./tokens";

type PhraseT = SceneT["phrases"][number] & { trim?: number; rate?: number };
type SceneWithPhrases = Omit<SceneT, "phrases"> & { phrases: PhraseT[] };
export type Timeline = { fps: number; width: number; height: number; total: number; voiceDir: string; scenes: SceneWithPhrases[] };

export type EpisodeDef = {
  timeline: Timeline;
  scenes: Record<string, React.FC<{ sc: SceneT }>>;
  cues: Record<string, (sc: SceneT) => Cue[]>;
  screenText: string; // every literal on-screen string, for font preloading
  loopFrames: number; // tail frames spent carrying the mark back to the episode's start point
};

// Subtitles sit on the light background just above the ink band (not inside it), so they read in
// plain ink. "**word**" is the phrase's keyword: heavier weight only — no color, so it can't be
// mistaken for a party's hue.
const Line: React.FC<{ text: string; y: number }> = ({ text, y }) => (
  <Txt s="subtitle" x={540} y={y} textAnchor="middle" fill={C.ink}>
    {text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part, i) =>
      part.startsWith("**") ? (
        <tspan key={i} style={{ fontWeight: 800 }}>{part.slice(2, -2)}</tspan>
      ) : (
        <tspan key={i}>{part}</tspan>
      )
    )}
  </Txt>
);
const Subtitle: React.FC<{ lines: string[] }> = ({ lines }) => (
  <Canvas>
    {lines.map((line, i) => <Line key={i} text={line} y={lines.length === 2 ? 1372 + i * 64 : 1436} />)}
  </Canvas>
);

const VOLUME = { tick: 0.4, tok: 0.55, slap: 0.5 };

// One player for every episode: it just walks `def.timeline.scenes`, mounting each scene's
// component, its subtitles/audio, and its sound cues. An episode is data (scenes.tsx + cues +
// timeline.json), not a different player — see src/episodes/<name>/index.tsx.
export const Episode: React.FC<{ def: EpisodeDef }> = ({ def }) => {
  const { timeline, scenes: SCENES, cues: CUES, screenText, loopFrames } = def;
  const sceneList = timeline.scenes;
  const allText = sceneList.flatMap((s) => s.phrases.flatMap((p) => p.sub)).join("").replace(/\*\*/g, "") + screenText;
  useState(() => waitForFonts(allText));
  return (
    <AbsoluteFill style={{ backgroundColor: C.atlas100 }}>
      {sceneList.map((s) => {
        const Scene = SCENES[s.id];
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={s.id}>
            <Scene sc={s} />
          </Sequence>
        );
      })}
      <Canvas>
        <rect x={0} y={L.bandY} width={1080} height={1920 - L.bandY} fill={C.ink} />
      </Canvas>
      {sceneList.flatMap((s, si) =>
        s.phrases.map((p, i) => {
          const next = s.phrases[i + 1];
          const last = si === sceneList.length - 1 && !next;
          const end = next ? next.from : last ? s.dur - loopFrames - 2 : s.dur;
          return (
            <React.Fragment key={p.audio}>
              <Sequence from={s.from + p.from} durationInFrames={end - p.from} name={`sub ${p.audio}`}>
                <Subtitle lines={p.sub} />
              </Sequence>
              <Sequence from={s.from + p.from} durationInFrames={p.dur + 2} name={`vo ${p.audio}`}>
                <Audio src={staticFile(`${timeline.voiceDir}/${p.audio}`)} trimBefore={p.trim ?? 0} playbackRate={p.rate ?? 1} />
              </Sequence>
            </React.Fragment>
          );
        })
      )}
      {sceneList.flatMap((s) =>
        (CUES[s.id]?.(s) ?? []).map((c, i) => (
          <Sequence key={`${s.id}-${i}`} from={s.from + c.at} durationInFrames={12} name={`${s.id} ${c.kind}`}>
            <Audio src={staticFile(`sfx/${c.kind}.wav`)} volume={VOLUME[c.kind]} />
          </Sequence>
        ))
      )}
    </AbsoluteFill>
  );
};
