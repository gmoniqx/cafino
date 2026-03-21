import type { ThemeId } from "@/features/cafino/store/useCafinoStore";

export interface CafinoThemeChoice {
  id: ThemeId;
  label: string;
  emoji: string;
  accent: string;
  soft: string;
}

export const CAFINO_THEMES: CafinoThemeChoice[] = [
  { id: "coffee-brown", label: "Coffee Brown", emoji: "☕", accent: "#8f7648", soft: "#f3eee7" },
  { id: "peach-cream", label: "Peach Cream", emoji: "🍑", accent: "#d37a62", soft: "#f9ebe4" },
  { id: "graphite-gray", label: "Graphite Gray", emoji: "🖤", accent: "#5d6169", soft: "#ecedf1" },
  { id: "pink-ribbon", label: "Pink Ribbon", emoji: "🌸", accent: "#d7739b", soft: "#f9ebf1" },
  { id: "midnight-mocha", label: "Midnight Mocha", emoji: "🌙", accent: "#8c6e53", soft: "#f0e9e1" },
  { id: "creamy-matcha", label: "Creamy Matcha", emoji: "🍵", accent: "#77a383", soft: "#eaf2ea" },
  { id: "butter-cookie", label: "Butter Cookie", emoji: "🍪", accent: "#c59d5f", soft: "#f5f0e4" },
  { id: "sunset-vibe", label: "Sunset Vibe", emoji: "🌇", accent: "#d26b59", soft: "#f8e9e4" },
  { id: "blueberry-haze", label: "Blueberry Haze", emoji: "🫐", accent: "#7e86c6", soft: "#eceefa" },
];

export function getThemeChoice(themeId: ThemeId): CafinoThemeChoice {
  return CAFINO_THEMES.find((item) => item.id === themeId) ?? CAFINO_THEMES[0];
}
