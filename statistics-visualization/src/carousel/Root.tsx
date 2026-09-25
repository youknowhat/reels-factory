import React from "react";
import { Composition, useCurrentFrame } from "remotion";
import { Sheet, sheetSize, useFonts } from "./kit";
import { H, W } from "./tokens";
import * as alcohol from "./posts/alcohol";

// Each post is one composition where frame i is card i+1, plus a "-sheet" composition that lays the
// whole post out side by side for review. Adding a post = one import + one entry in POSTS.
const POSTS: Record<string, { CARDS: React.FC[]; TEXT: string }> = { alcohol };

const cardsOf = (post: { CARDS: React.FC[]; TEXT: string }): React.FC => () => {
  useFonts(post.TEXT);
  const Card = post.CARDS[useCurrentFrame()];
  return Card ? <Card /> : null;
};
const sheetOf = (post: { CARDS: React.FC[]; TEXT: string }): React.FC => () => {
  useFonts(post.TEXT);
  return <Sheet cards={post.CARDS} />;
};

export const CarouselRoot: React.FC = () => (
  <>
    {Object.entries(POSTS).map(([id, post]) => (
      <React.Fragment key={id}>
        <Composition id={`Carousel-${id}`} component={cardsOf(post)} durationInFrames={post.CARDS.length} fps={30} width={W} height={H} />
        <Composition id={`Carousel-${id}-sheet`} component={sheetOf(post)} durationInFrames={1} fps={30} {...sheetSize(post.CARDS.length)} />
      </React.Fragment>
    ))}
  </>
);
