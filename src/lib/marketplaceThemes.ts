export interface MarketplaceTheme {
  id: string;
  name: string;
  icon: string;
  primary: string;
  darkBase: string;
  darkMid: string;
  cardBg: string;
  border: string;
  text: string;
  textMuted: string;
  dashboardGradient: string;
}

export const MARKETPLACE_THEMES: MarketplaceTheme[] = [
  {
    id: "azul",
    name: "Azul Escuro",
    icon: "💎",
    primary: "#3B82F6",
    darkBase: "hsl(220, 40%, 8%)",
    darkMid: "hsl(220, 45%, 15%)",
    cardBg: "hsl(220, 30%, 12%)",
    border: "hsl(220, 20%, 18%)",
    text: "#f0f0f0",
    textMuted: "#8a8a9a",
    dashboardGradient: "linear-gradient(135deg, #001d42 0%, #002F6C 30%, #00609e 60%, #3B82F6 100%)",
  },
  {
    id: "rosa",
    name: "Rosa Premium",
    icon: "🌸",
    primary: "#E8587A",
    darkBase: "hsl(340, 30%, 7%)",
    darkMid: "hsl(340, 35%, 14%)",
    cardBg: "hsl(340, 25%, 11%)",
    border: "hsl(340, 18%, 18%)",
    text: "#f5eded",
    textMuted: "#a07888",
    dashboardGradient: "linear-gradient(135deg, #3d0a1e 0%, #6b1a3a 30%, #a83060 60%, #E8587A 100%)",
  },
  {
    id: "aurora",
    name: "Aurora (Rosa + Azul)",
    icon: "🌌",
    primary: "#A855F7",
    darkBase: "hsl(270, 35%, 7%)",
    darkMid: "hsl(270, 40%, 14%)",
    cardBg: "hsl(270, 28%, 11%)",
    border: "hsl(270, 18%, 18%)",
    text: "#f0eef5",
    textMuted: "#8a80a8",
    dashboardGradient: "linear-gradient(135deg, #1a0a3d 0%, #3b1a6b 25%, #6b2fa0 50%, #E8587A 80%, #F5A0B8 100%)",
  },
  {
    id: "espirito-santo",
    name: "Espírito Santo",
    icon: "🏖️",
    primary: "#3B82F6",
    darkBase: "hsl(220, 40%, 6%)",
    darkMid: "hsl(220, 35%, 14%)",
    cardBg: "hsl(220, 30%, 10%)",
    border: "hsl(340, 15%, 18%)",
    text: "#f5f0f2",
    textMuted: "#a090a8",
    dashboardGradient: "linear-gradient(135deg, #001d42 0%, #3B82F6 30%, #ffffff 55%, #E8587A 80%, #a83060 100%)",
  },
];

export function getMarketplaceTheme(id: string | null | undefined): MarketplaceTheme {
  return MARKETPLACE_THEMES.find((t) => t.id === id) || MARKETPLACE_THEMES[0];
}
