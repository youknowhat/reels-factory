import React from "react";
import { Composition } from "remotion";
import { FertilityEpisode, fertilityTimeline } from "./episodes/fertility";
import { AlcoholAEpisode, AlcoholBEpisode, AlcoholCEpisode, alcoholTimeline } from "./episodes/alcohol";

// One Composition per episode (or, during the alcohol pilot's style comparison, per style —
// A/B/C share one timeline.json). Each episode's own index.tsx pairs its scenes+cues with its
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
    <Composition
      id="Alcohol-A"
      component={AlcoholAEpisode}
      durationInFrames={alcoholTimeline.total}
      fps={alcoholTimeline.fps}
      width={alcoholTimeline.width}
      height={alcoholTimeline.height}
    />
    <Composition
      id="Alcohol-B"
      component={AlcoholBEpisode}
      durationInFrames={alcoholTimeline.total}
      fps={alcoholTimeline.fps}
      width={alcoholTimeline.width}
      height={alcoholTimeline.height}
    />
    <Composition
      id="Alcohol-C"
      component={AlcoholCEpisode}
      durationInFrames={alcoholTimeline.total}
      fps={alcoholTimeline.fps}
      width={alcoholTimeline.width}
      height={alcoholTimeline.height}
    />
  </>
);
