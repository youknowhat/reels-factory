import React from "react";
import { Composition, useCurrentFrame } from "remotion";
import { FRAMES, StoryboardFrame } from "./frames";

// Frame n (1-based) of this composition is storyboard key frame n; frame 0 is left empty.
const AlcoholStoryboard: React.FC = () => <StoryboardFrame index={useCurrentFrame()} />;

export const StoryboardRoot: React.FC = () => (
  <Composition id="SB-Alcohol" component={AlcoholStoryboard} durationInFrames={FRAMES.length + 1} fps={30} width={1080} height={1920} />
);
