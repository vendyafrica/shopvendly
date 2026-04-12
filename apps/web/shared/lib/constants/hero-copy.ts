export type HeroMode = "discovery" | "shopping";

export const heroCopy: Record<
  HeroMode,
  { prefix: string; variants: string[]; subhead: string }
> = {
  discovery: {
    prefix: "Discover",
    variants: ["brands.", "creators.", "local stores.", "hidden gems."],
    subhead: "Shop your favourite businesses all in one place.",
  },
  shopping: {
    prefix: "Buy",
    variants: ["from trusted sellers.", "in a few taps.", "without the hassle."],
    subhead: "Explore stores, add to cart, and checkout seamlessly.",
  },
};
