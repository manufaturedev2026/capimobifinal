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
  { id: "magazine", name: "Magazine", desc: "Cards grandes estilo revista", preview: "📰" },
  { id: "gallery", name: "Galeria", desc: "Mosaico estilo Pinterest", preview: "🖼️" },
  { id: "elegant", name: "Elegant", desc: "Escuro com glassmorphism premium", preview: "💎" },
  { id: "showcase", name: "Showcase", desc: "Foco em um imóvel por vez", preview: "🏆" },
] as const;

export type StoreLayoutId = typeof STORE_LAYOUTS[number]["id"];
