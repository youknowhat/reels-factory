import { registerRoot } from "remotion";
import { StoryboardRoot } from "./Root";

// Separate entry point from src/index.ts: storyboard frames are pre-production stills, rendered by
// scripts/storyboard.mjs, and never appear in the episode Root.
registerRoot(StoryboardRoot);
