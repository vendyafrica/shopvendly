export type StyleGuideAudience = "men" | "women";

export const STYLE_GUIDE_CATEGORIES = ["men", "women"] as const;

type StyleGuideCategory = (typeof STYLE_GUIDE_CATEGORIES)[number];

export function getStyleGuideAudience(storeCategories: string[]): StyleGuideAudience | null {
  const normalized = storeCategories.map((category) => category.toLowerCase().trim());
  const allowed = new Set<StyleGuideCategory>(STYLE_GUIDE_CATEGORIES);
  if (allowed.has("women") && normalized.includes("women")) return "women";
  if (allowed.has("men") && normalized.includes("men")) return "men";
  return null;
}
