import React from "react";
import { Episode } from "../../Episode";
import { CUES, END_LOOP, SCENES, SCREEN_TEXT } from "./scenes";
import timeline from "./timeline.json";

export const fertilityTimeline = timeline;
export const FertilityEpisode: React.FC = () => (
  <Episode def={{ timeline, scenes: SCENES, cues: CUES, screenText: SCREEN_TEXT, loopFrames: END_LOOP }} />
);
