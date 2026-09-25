import { registerRoot } from "remotion";
import { CarouselRoot } from "./Root";

// Separate entry point from src/index.ts (Reels) and src/storyboard/: feed carousels are stills,
// rendered card by card by scripts/carousel.mjs.
registerRoot(CarouselRoot);
