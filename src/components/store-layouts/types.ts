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
  sellerDisplayName: string;
  isDbProfile: boolean;
  dbProfile: any;
  handleWhatsApp: (title: string, productId?: string) => void;
  formatPrice: (price: number) => string;
  getTagStyle: (tag: string) => string;
  getTagLabel: (tag: string) => string;
  filterCity?: string;
  setFilterCity?: (city: string) => void;
  availableCities?: string[];
  onCinemaMode?: () => void;
  onShareLink?: () => void;
  storiesBar?: React.ReactNode;
}

export const STORE_LAYOUTS = [
  { id: "netflix", name: "Netflix", desc: "Carrossel de categorias + grid de cards", preview: "🎬" },
  { id: "minimal", name: "Minimal", desc: "Limpo e elegante, sem distrações", preview: "✨" },
  { id: "marketplace", name: "Marketplace", desc: "Estilo Mercado Livre com busca e badges", preview: "🛒" },
  { id: "cyberpunk_marketplace", name: "Cyberpunk", desc: "Marketplace com estética Cyberpunk 2077: neon, scanlines e glitch", preview: "🤖" },
  { id: "magazine", name: "Magazine", desc: "Cards grandes estilo revista", preview: "📰" },
  { id: "gallery", name: "Galeria", desc: "Mosaico estilo Pinterest", preview: "🖼️" },
  { id: "elegant", name: "Elegant", desc: "Estilo site de imobiliária profissional", preview: "🏢" },
] as const;

export type StoreLayoutId = typeof STORE_LAYOUTS[number]["id"];

/** Layouts allowed per subscription tier */
export const LAYOUTS_BY_TIER: Record<string, string[]> = {
  basico: ["marketplace"],
  start: ["marketplace"],
  vip: ["marketplace", "netflix", "minimal", "cyberpunk_marketplace"],
  premium: ["marketplace", "netflix", "minimal", "magazine", "gallery", "elegant", "cyberpunk_marketplace"],
  essencial_empresa: ["marketplace", "netflix", "minimal", "cyberpunk_marketplace"],
  premium_empresa: ["marketplace", "netflix", "minimal", "magazine", "gallery", "elegant", "cyberpunk_marketplace"],
  prime_empresa: ["marketplace", "netflix", "minimal", "magazine", "gallery", "elegant", "cyberpunk_marketplace"],
  black: ["marketplace", "netflix", "minimal", "magazine", "gallery", "elegant", "cyberpunk_marketplace"],
};

export function isLayoutAllowed(layoutId: string, tier: string | null | undefined): boolean {
  const allowed = LAYOUTS_BY_TIER[tier || "basico"] || LAYOUTS_BY_TIER.basico;
  return allowed.includes(layoutId);
}

/** Returns the minimum tier required for a layout */
export function getMinTierForLayout(layoutId: string): string {
  if (["magazine", "gallery", "elegant"].includes(layoutId)) return "Premium";
  if (["netflix", "minimal", "cyberpunk_marketplace"].includes(layoutId)) return "VIP";
  return "";
}
