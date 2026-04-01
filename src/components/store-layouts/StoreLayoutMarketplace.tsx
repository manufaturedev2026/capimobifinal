import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Image, Search, Bed, Bath, Ruler, Home, Building2, Landmark,
  Store, Trees, Key, Warehouse, ChevronRight, SlidersHorizontal, X,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";

const CATEGORY_ICONS: Record<string, any> = {
  todos: SlidersHorizontal,
  casa: Home,
  apartamento: Building2,
  terreno: Trees,
  comercial: Store,
  galpao: Warehouse,
  flat: Landmark,
  aluguel: Key,
};

/**
 * Marketplace Layout — ESCorretores / Mercado Livre inspired:
 * Big search bar, category cards with icons + descriptions, product grid cards
 */
export default function StoreLayoutMarketplace({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllCats, setShowAllCats] = useState(false);

  const visibleProducts = searchTerm
    ? filteredProducts.filter((p: any) =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredProducts;

  const activeCats = subcategories.filter(c => c.slug === "todos" || (categoryCounts[c.slug] || 0) > 0);

  return (
    <div>
      {/* ── Search bar ── */}
      <div className="mb-5">
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3 shadow-md"
          style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
        >
          <Search size={18} style={{ color: storeTheme.textMuted }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar imóveis..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
            style={{ color: storeTheme.text }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")}>
              <X size={16} style={{ color: storeTheme.textMuted }} />
            </button>
          )}
        </div>
      </div>

      {/* ── Category cards with icons (scrollable) ── */}
      <div className="mb-6">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          {(showAllCats ? activeCats : activeCats.slice(0, 6)).map((cat) => {
            const isActive = activeCategory === cat.slug;
            const count = categoryCounts[cat.slug] || 0;
            const Icon = CATEGORY_ICONS[cat.slug] || Home;
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all min-w-[80px]"
                style={{
                  background: isActive ? `${storeTheme.primary}15` : storeTheme.card,
                  border: `1.5px solid ${isActive ? storeTheme.primary : storeTheme.border}`,
                  boxShadow: isActive ? `0 4px 12px ${storeTheme.primary}20` : "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: isActive ? `${storeTheme.primary}25` : `${storeTheme.border}`,
                    color: isActive ? storeTheme.primary : storeTheme.textMuted,
                  }}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: isActive ? storeTheme.primary : storeTheme.text }}>
                  {cat.name}
                </span>
                {count > 0 && cat.slug !== "todos" && (
                  <span className="text-[9px] opacity-50" style={{ color: storeTheme.textMuted }}>{count} imóveis</span>
                )}
              </button>
            );
          })}
          {!showAllCats && activeCats.length > 6 && (
            <button
              onClick={() => setShowAllCats(true)}
              className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-2xl min-w-[80px]"
              style={{ background: storeTheme.card, border: `1.5px solid ${storeTheme.border}` }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: storeTheme.border }}>
                <ChevronRight size={18} style={{ color: storeTheme.textMuted }} />
              </div>
              <span className="text-[11px] font-semibold" style={{ color: storeTheme.textMuted }}>Mais</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Results count ── */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: storeTheme.textMuted }}>
          {visibleProducts.length} {visibleProducts.length === 1 ? "resultado" : "resultados"}
        </p>
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className="text-xs font-semibold" style={{ color: storeTheme.primary }}>
            Limpar busca
          </button>
        )}
      </div>

      {/* ── Product grid (2 columns, card style with big image) ── */}
      {visibleProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {visibleProducts.map((product: any, i: number) => {
            const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={productLink}
                  className="block rounded-2xl overflow-hidden group transition-shadow hover:shadow-xl"
                  style={{
                    background: storeTheme.card,
                    border: `1px solid ${storeTheme.border}`,
                  }}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.border }}>
                        <Image size={28} style={{ color: storeTheme.textMuted }} />
                      </div>
                    )}
                    {product.tag && (
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold shadow ${getTagStyle(product.tag)}`}>
                        {getTagLabel(product.tag)}
                      </span>
                    )}
                    {product.isAluguel && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold shadow-md"
                        style={{ background: storeTheme.primary, color: "#fff" }}>
                        🏠 Aluguel
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="text-xs font-semibold line-clamp-2 leading-snug mb-1.5" style={{ color: storeTheme.text }}>
                      {product.title}
                    </h3>

                    {product.price > 0 && (
                      <p className="text-base font-bold text-emerald-500">
                        R$ {product.price.toLocaleString("pt-BR")}
                        {product.isAluguel && (
                          <span className="text-[10px] font-normal ml-0.5" style={{ color: storeTheme.textMuted }}>/mês</span>
                        )}
                      </p>
                    )}

                    {product.accepts_financing && (
                      <p className="text-[9px] mt-0.5 font-medium" style={{ color: "#00a650" }}>
                        ✓ Aceita financiamento
                      </p>
                    )}

                    {/* Specs */}
                    <div className="flex items-center gap-2 mt-2 text-[10px]" style={{ color: storeTheme.textMuted }}>
                      {product.bedrooms > 0 && (
                        <span className="flex items-center gap-0.5"><Bed size={10} /> {product.bedrooms}</span>
                      )}
                      {product.bathrooms > 0 && (
                        <span className="flex items-center gap-0.5"><Bath size={10} /> {product.bathrooms}</span>
                      )}
                      {product.area > 0 && (
                        <span className="flex items-center gap-0.5"><Ruler size={10} /> {product.area}m²</span>
                      )}
                    </div>

                    {/* Location */}
                    {product.city && (
                      <p className="text-[10px] mt-1.5 flex items-center gap-1 truncate" style={{ color: storeTheme.textMuted }}>
                        <MapPin size={9} className="flex-shrink-0" />
                        {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
          <Search size={36} className="mx-auto mb-3 opacity-20" style={{ color: storeTheme.textMuted }} />
          <p className="text-sm font-medium" style={{ color: storeTheme.textMuted }}>
            {searchTerm ? "Nenhum resultado para essa busca" : "Nenhum anúncio encontrado"}
          </p>
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="mt-2 text-xs font-semibold" style={{ color: storeTheme.primary }}>
              Limpar busca
            </button>
          )}
        </div>
      )}
    </div>
  );
}
