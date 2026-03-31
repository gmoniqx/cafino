import type { ThemeId } from "@/features/cafino/store/useCafinoStore";

export interface CafinoThemeChoice {
  id: ThemeId;
  label: string;
  emoji: string;
  accent: string;
  soft: string;
}

export const CAFINO_THEMES: CafinoThemeChoice[] = [
  { id: "coffee-brown", label: "Velvet Roast", emoji: "☕", accent: "#9a5a3c", soft: "#f7eee7" },
  { id: "peach-cream", label: "Apricot Foam", emoji: "🍑", accent: "#dc6f4e", soft: "#fdf0e8" },
  { id: "graphite-gray", label: "Slate Brew", emoji: "🖤", accent: "#4b5f6f", soft: "#ecf1f4" },
  { id: "pink-ribbon", label: "Rose Latte", emoji: "🌸", accent: "#cc5f86", soft: "#fcebf2" },
  { id: "midnight-mocha", label: "Cocoa Dusk", emoji: "🌙", accent: "#7a5f4a", soft: "#f3ebe3" },
  { id: "creamy-matcha", label: "Matcha Silk", emoji: "🍵", accent: "#5f936c", soft: "#ebf6ec" },
  { id: "butter-cookie", label: "Caramel Crumb", emoji: "🍪", accent: "#b98245", soft: "#f9f1e6" },
  { id: "sunset-vibe", label: "Sunset Crema", emoji: "🌇", accent: "#d15f3e", soft: "#fbe8df" },
  { id: "blueberry-haze", label: "Blue Mornings", emoji: "🫐", accent: "#5673bb", soft: "#ecf0fb" },
];

export function getThemeChoice(themeId: ThemeId): CafinoThemeChoice {
  return CAFINO_THEMES.find((item) => item.id === themeId) ?? CAFINO_THEMES[0];
}
