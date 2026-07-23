import type { Database } from "@/integrations/supabase/types";

type BackgroundType = Database["public"]["Enums"]["background_type"];

export interface CuratedTheme {
  id: string;
  name: string;
  category: "customizable" | "curated";
  isPremium?: boolean;
  
  // Visual do card
  thumbnail: {
    type: "color" | "gradient" | "image";
    value: string;
    textColor: string;
    accentBar: string;
  };
  
  // Configurações do tema quando aplicado (null para Custom)
  settings: {
    background_type: BackgroundType;
    background_value: string;
    text_color: string;
    accent_color: string;
    font_family: string;
    button_style: string;
    button_radius: number;
  } | null;
}

export const CURATED_THEMES: CuratedTheme[] = [
  // Card especial para customização
  {
    id: "custom",
    name: "Custom",
    category: "customizable",
    thumbnail: {
      type: "color",
      value: "#f8fafc",
      textColor: "#94a3b8",
      accentBar: "#e2e8f0",
    },
    settings: null,
  },
  
  // Temas Curados
  {
    id: "agate",
    name: "Agate",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
      textColor: "#4ade80",
      accentBar: "#4ade80",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
      text_color: "#ffffff",
      accent_color: "#4ade80",
      font_family: "inter",
      button_style: "rounded",
      button_radius: 12,
    },
  },
  {
    id: "air",
    name: "Air",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      textColor: "#ffffff",
      accentBar: "#a78bfa",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      text_color: "#ffffff",
      accent_color: "#a78bfa",
      font_family: "poppins",
      button_style: "pill",
      button_radius: 999,
    },
  },
  {
    id: "bloom",
    name: "Bloom",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      textColor: "#ffffff",
      accentBar: "#fbbf24",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      text_color: "#ffffff",
      accent_color: "#fbbf24",
      font_family: "poppins",
      button_style: "pill",
      button_radius: 999,
    },
  },
  {
    id: "breeze",
    name: "Breeze",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      textColor: "#ffffff",
      accentBar: "#ffffff",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      text_color: "#ffffff",
      accent_color: "#ffffff",
      font_family: "inter",
      button_style: "rounded",
      button_radius: 16,
    },
  },
  {
    id: "forest",
    name: "Forest",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
      textColor: "#ffffff",
      accentBar: "#86efac",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
      text_color: "#ffffff",
      accent_color: "#86efac",
      font_family: "inter",
      button_style: "rounded",
      button_radius: 12,
    },
  },
  {
    id: "haven",
    name: "Haven",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)",
      textColor: "#78350f",
      accentBar: "#d97706",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)",
      text_color: "#78350f",
      accent_color: "#d97706",
      font_family: "poppins",
      button_style: "rounded",
      button_radius: 16,
    },
  },
  {
    id: "lake",
    name: "Lake",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(180deg, #0c4a6e 0%, #082f49 100%)",
      textColor: "#38bdf8",
      accentBar: "#38bdf8",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(180deg, #0c4a6e 0%, #082f49 100%)",
      text_color: "#ffffff",
      accent_color: "#38bdf8",
      font_family: "inter",
      button_style: "rounded",
      button_radius: 12,
    },
  },
  {
    id: "mineral",
    name: "Mineral",
    category: "curated",
    thumbnail: {
      type: "color",
      value: "#f1f5f9",
      textColor: "#1e293b",
      accentBar: "#64748b",
    },
    settings: {
      background_type: "color",
      background_value: "#f1f5f9",
      text_color: "#1e293b",
      accent_color: "#64748b",
      font_family: "inter",
      button_style: "rounded",
      button_radius: 8,
    },
  },
  {
    id: "neon",
    name: "Neon",
    category: "curated",
    thumbnail: {
      type: "color",
      value: "#0a0a0a",
      textColor: "#22d3ee",
      accentBar: "#a855f7",
    },
    settings: {
      background_type: "color",
      background_value: "#0a0a0a",
      text_color: "#22d3ee",
      accent_color: "#a855f7",
      font_family: "inter",
      button_style: "rounded",
      button_radius: 8,
    },
  },
  {
    id: "rise",
    name: "Rise",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
      textColor: "#ffffff",
      accentBar: "#fef3c7",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
      text_color: "#ffffff",
      accent_color: "#fef3c7",
      font_family: "poppins",
      button_style: "pill",
      button_radius: 999,
    },
  },
  {
    id: "twilight",
    name: "Twilight",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
      textColor: "#ffffff",
      accentBar: "#f9a8d4",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
      text_color: "#ffffff",
      accent_color: "#f9a8d4",
      font_family: "poppins",
      button_style: "pill",
      button_radius: 999,
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
      textColor: "#22d3ee",
      accentBar: "#22d3ee",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
      text_color: "#ffffff",
      accent_color: "#22d3ee",
      font_family: "inter",
      button_style: "rounded",
      button_radius: 16,
    },
  },
  {
    id: "coral",
    name: "Coral",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)",
      textColor: "#ffffff",
      accentBar: "#ffffff",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)",
      text_color: "#ffffff",
      accent_color: "#ffffff",
      font_family: "poppins",
      button_style: "rounded",
      button_radius: 12,
    },
  },
  {
    id: "arctic",
    name: "Arctic",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%)",
      textColor: "#0369a1",
      accentBar: "#0284c7",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%)",
      text_color: "#0369a1",
      accent_color: "#0284c7",
      font_family: "inter",
      button_style: "rounded",
      button_radius: 12,
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(180deg, #f3e8ff 0%, #e9d5ff 100%)",
      textColor: "#7c3aed",
      accentBar: "#a855f7",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(180deg, #f3e8ff 0%, #e9d5ff 100%)",
      text_color: "#7c3aed",
      accent_color: "#a855f7",
      font_family: "poppins",
      button_style: "pill",
      button_radius: 999,
    },
  },
  {
    id: "carbon",
    name: "Carbon",
    category: "curated",
    thumbnail: {
      type: "color",
      value: "#171717",
      textColor: "#fafafa",
      accentBar: "#525252",
    },
    settings: {
      background_type: "color",
      background_value: "#171717",
      text_color: "#fafafa",
      accent_color: "#525252",
      font_family: "inter",
      button_style: "square",
      button_radius: 4,
    },
  },
  {
    id: "peach",
    name: "Peach",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(135deg, #fecdd3 0%, #fed7aa 100%)",
      textColor: "#9f1239",
      accentBar: "#f43f5e",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(135deg, #fecdd3 0%, #fed7aa 100%)",
      text_color: "#9f1239",
      accent_color: "#f43f5e",
      font_family: "poppins",
      button_style: "rounded",
      button_radius: 16,
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(180deg, #064e3b 0%, #022c22 100%)",
      textColor: "#6ee7b7",
      accentBar: "#10b981",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(180deg, #064e3b 0%, #022c22 100%)",
      text_color: "#ffffff",
      accent_color: "#10b981",
      font_family: "inter",
      button_style: "rounded",
      button_radius: 12,
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    category: "curated",
    thumbnail: {
      type: "gradient",
      value: "linear-gradient(180deg, #7c3aed 0%, #f97316 100%)",
      textColor: "#ffffff",
      accentBar: "#fbbf24",
    },
    settings: {
      background_type: "gradient",
      background_value: "linear-gradient(180deg, #7c3aed 0%, #f97316 100%)",
      text_color: "#ffffff",
      accent_color: "#fbbf24",
      font_family: "poppins",
      button_style: "pill",
      button_radius: 999,
    },
  },
  {
    id: "paper",
    name: "Paper",
    category: "curated",
    thumbnail: {
      type: "color",
      value: "#fefce8",
      textColor: "#422006",
      accentBar: "#ca8a04",
    },
    settings: {
      background_type: "color",
      background_value: "#fefce8",
      text_color: "#422006",
      accent_color: "#ca8a04",
      font_family: "roboto",
      button_style: "rounded",
      button_radius: 8,
    },
  },
];

// Helpers
export function getCuratedThemeById(id: string): CuratedTheme | undefined {
  return CURATED_THEMES.find(theme => theme.id === id);
}

export function getCuratedThemes(): CuratedTheme[] {
  return CURATED_THEMES.filter(theme => theme.category === "curated");
}

export function getCustomizableThemes(): CuratedTheme[] {
  return CURATED_THEMES.filter(theme => theme.category === "customizable");
}
