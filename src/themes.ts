// ============================================================================
// BRAND PALETTE — Palette unique imposée (4 couleurs)
// Brand Gold : #C0A080
// Brand BG    : #FDFBF8
// Brand Text  : #4D4D4D
// Brand Dark  : #2E2E2E
// ============================================================================

export type ThemeId = "brand";

export interface ThemeColors {
  // Pas de variantes : on impose ces 4 couleurs uniquement
  primary: { 50: string; 100: string; 300: string; 500: string; 700: string; 900: string };
  accent: { 50: string; 100: string; 300: string; 500: string; 700: string };
  semantic: {
    success: string; successBg: string; successBorder: string;
    warning: string; warningBg: string; warningBorder: string;
    danger: string; dangerBg: string; dangerBorder: string;
    info: string; infoBg: string; infoBorder: string;
  };
  sections: {
    dashboard: string;
    couples: string;
    messages: string;
    gallery: string;
    settings: string;
  };
  categoryColors: Record<string, string>;
  tagColors: Record<string, string>;
  status: {
    "En cours": string;
    "Quota Atteint": string;
    "Clôturé": string;
    "En retard": string;
    "Critique": string;
  };
  stamp: {
    like: string;
    nope: string;
    super: string;
  };
}

// Palette Brand — 4 couleurs imposées
// Toutes les nuances sont des dérivés cohérents de la palette
const brand: ThemeColors = {
  primary: {
    50: "#F5F0E8", 100: "#E8E2D7", 300: "#8A8378", 500: "#2E2E2E", 700: "#1A1A1A", 900: "#000000"
  },
  accent: {
    50: "#FDFBF8", 100: "#F5EBD9", 300: "#D4B58F", 500: "#C0A080", 700: "#8A7458"
  },
  semantic: {
    success: "#5A7A5A", successBg: "#EFF3EC", successBorder: "#B8C9B4",
    warning: "#B89060", warningBg: "#F5EBD9", warningBorder: "#D8BFA0",
    danger:  "#8B4040", dangerBg:  "#F5E8E5", dangerBorder: "#D8A8A0",
    info:    "#5A6A7A", infoBg:    "#ECEEF1", infoBorder: "#9FB0C5"
  },
  sections: {
    dashboard: "#2E2E2E",
    couples: "#C0A080",
    messages: "#8A8378",
    gallery: "#4D4D4D",
    settings: "#1A1A1A"
  },
  categoryColors: {
    Dot: "#C0A080",
    Globale: "#8A8378",
    Album: "#B89060",
    Civil: "#5A7A5A",
    Cocktail: "#5A6A7A",
    Soiree: "#8B4040",
    Preparatifs: "#C0A080",
    default: "#8A8378"
  },
  tagColors: {
    VIP: "#8B4040",
    Urgent: "#B89060",
    Premium: "#C0A080",
    Termine: "#5A7A5A",
    Default: "#8A8378"
  },
  status: {
    "En cours": "#8A8378",
    "Quota Atteint": "#B89060",
    "Clôturé": "#5A7A5A",
    "En retard": "#B89060",
    "Critique": "#8B4040"
  },
  stamp: {
    like: "#C0A080",
    nope: "#8B4040",
    super: "#B89060"
  }
};

export const themes: Record<ThemeId, ThemeColors> = { brand };

export const themeMeta: Record<ThemeId, { label: string; emoji: string; description: string }> = {
  brand: { label: "Brand", emoji: "✦", description: "Palette unique imposée" }
};

export function getTagColor(tag: string, theme: ThemeColors): string {
  return theme.tagColors[tag] || theme.tagColors.Default;
}

export function getCategoryColor(category: string, theme: ThemeColors): string {
  return theme.categoryColors[category] || theme.categoryColors.default;
}
