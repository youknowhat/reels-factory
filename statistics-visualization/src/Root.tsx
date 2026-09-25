import React from "react";
import { Composition } from "remotion";
import { FertilityEpisode, fertilityTimeline } from "./episodes/fertility";

// One Composition per episode. Each episode's own index.tsx pairs its scenes+cues with its
// timeline.json; adding an episode means adding one line here, not touching the player.
export const Root: React.FC = () => (
  <>
    <Composition
      id="Fertility"
      component={FertilityEpisode}
      durationInFrames={fertilityTimeline.total}
      fps={fertilityTimeline.fps}
      width={fertilityTimeline.width}
      height={fertilityTimeline.height}
    />
  </>
);
