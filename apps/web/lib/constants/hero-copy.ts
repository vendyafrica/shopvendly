export type HeroMode = "discovery" | "shopping";

export const heroCopy: Record<
  HeroMode,
  { prefix: string; variants: string[]; subhead: string }
> = {
  discovery: {
    prefix: "Discover",
    variants: ["brands.", "creators.", "local stores.", "hidden gems."],
    subhead: "Shop directly from creators and businesses all in one place.",
  },
  shopping: {
    prefix: "Buy",
    variants: ["with confidence.", "from trusted sellers.", "in a few taps.", "without the hassle."],
    subhead: "Explore real stores, chat with sellers, and checkout seamlessly.",
  },
};
