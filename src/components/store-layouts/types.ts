import { StoreTheme } from "@/components/StoreThemePicker";

export interface StoreLayoutProps {
  products: any[];
  filteredProducts: any[];
  subcategories: { slug: string; name: string; icon: any; img: string }[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  categoryCounts: Record<string, number>;
  categoryCardImages: Record<string, string>;
  storeTheme: StoreTheme;
  corretorSlug: string | null;
  isDbProfile: boolean;
  dbProfile: any;
  handleWhatsApp: (title: string, productId?: string) => void;
  formatPrice: (price: number) => string;
  getTagStyle: (tag: string) => string;
  getTagLabel: (tag: string) => string;
}

export const STORE_LAYOUTS = [
  { id: "netflix", name: "Netflix", desc: "Carrossel de categorias + grid de cards", preview: "🎬" },
  { id: "minimal", name: "Minimal", desc: "Limpo e elegante, sem distrações", preview: "✨" },
  { id: "marketplace", name: "Marketplace", desc: "Estilo Mercado Livre com busca e badges", preview: "🛒" },
  { id: "showcase", name: "Showcase", desc: "Foco em um imóvel por vez", preview: "🏆" },
  { id: "magazine", name: "Magazine", desc: "Cards grandes estilo revista", preview: "📰" },
  { id: "gallery", name: "Galeria", desc: "Mosaico estilo Pinterest", preview: "🖼️" },
  { id: "elegant", name: "Elegant", desc: "Escuro com glassmorphism premium", preview: "💎" },
] as const;

export type StoreLayoutId = typeof STORE_LAYOUTS[number]["id"];

/** Layouts allowed per subscription tier */
export const LAYOUTS_BY_TIER: Record<string, string[]> = {
  basico: ["netflix"],
  start: ["netflix"],
  premium: ["netflix", "minimal", "marketplace", "showcase"],
  vip: ["netflix", "minimal", "marketplace", "showcase", "magazine", "gallery", "elegant"],
  essencial_empresa: ["netflix", "minimal", "marketplace", "showcase"],
  premium_empresa: ["netflix", "minimal", "marketplace", "showcase", "magazine", "gallery", "elegant"],
  prime_empresa: ["netflix", "minimal", "marketplace", "showcase", "magazine", "gallery", "elegant"],
};

export function isLayoutAllowed(layoutId: string, tier: string | null | undefined): boolean {
  const allowed = LAYOUTS_BY_TIER[tier || "basico"] || LAYOUTS_BY_TIER.basico;
  return allowed.includes(layoutId);
}

/** Returns the minimum tier required for a layout */
export function getMinTierForLayout(layoutId: string): string {
  if (["magazine", "gallery", "elegant"].includes(layoutId)) return "Premium";
  if (["minimal", "marketplace", "showcase"].includes(layoutId)) return "VIP";
  return "";
}
