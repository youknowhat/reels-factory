// Carousel (feed card) design tokens — a separate product from the Reels episodes, so its own palette.
// Editorial paper + ink and ONE accent. The accent marks a single element per card — the title word or
// number the card exists to say — and nothing else. Every other mark (bottles, glasses, dots, ticks,
// rules) is the same ink at a lower density on the paper: a greyscale ramp, never a second hue.
export const P = {
  paper: "#F4F0E8",
  ink: "#1D1B18", // text and Korea's own data marks — the darkest thing on the card
  muted: "#6E685E", // secondary text, 4.9:1 on paper
  ink45: "#93908A", // secondary marks: the comparison country's bottles
  ink30: "#B4B0AA", // soju in a glass, the other countries' ticks
  ink20: "#C9C5BE", // the rest of a 100-person grid
  ink12: "#DAD6CF", // hairline rules, the band behind Korea's table row
  accent: "#E65100", // ~3.3:1 on paper — large bold display type only, never body text (see kit.tsx note)
};

export const W = 1080;
export const H = 1440; // 3:4 — Instagram's feed + profile-grid ratio since 2025
export const M = { x: 96, bodyTop: 112, bodyBottom: 150 };

export const FONT = {
  sans: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
  mono: '"IBM Plex Mono", "Pretendard", monospace',
};
