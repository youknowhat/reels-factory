import React from "react";
import { Episode } from "../../Episode";
import * as A from "./scenes-a";
import * as B from "./scenes-b";
import * as C from "./scenes-c";
import timeline from "./timeline.json";

// Three visual styles sharing one narration + one timeline.json (scripts/prep.mjs alcohol
// --reuse regenerates none of it) — the comparison pilot HANDOFF.md step 9 asks for.
export const alcoholTimeline = timeline;
export const AlcoholAEpisode: React.FC = () => (
  <Episode def={{ timeline, scenes: A.SCENES, cues: A.CUES, screenText: A.SCREEN_TEXT, loopFrames: A.END_LOOP }} />
);
export const AlcoholBEpisode: React.FC = () => (
  <Episode def={{ timeline, scenes: B.SCENES, cues: B.CUES, screenText: B.SCREEN_TEXT, loopFrames: B.END_LOOP }} />
);
export const AlcoholCEpisode: React.FC = () => (
  <Episode def={{ timeline, scenes: C.SCENES, cues: C.CUES, screenText: C.SCREEN_TEXT, loopFrames: C.END_LOOP }} />
);
