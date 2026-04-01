import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Image, Search, Truck, Star, ShieldCheck, ChevronRight, Bed, Bath, Ruler } from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Marketplace Layout — Inspired by Mercado Livre: search bar, horizontal category chips,
 * product cards with badges, location info, and trust signals.
 */
export default function StoreLayoutMarketplace({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const visibleProducts = searchTerm
    ? filteredProducts.filter((p: any) =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredProducts;

  return (
    <div>
      {/* ── Search bar (ML style) ── */}
      <div className="mb-4">
        <div
          className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 shadow-sm"
          style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
        >
          <Search size={16} style={{ color: storeTheme.textMuted }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar nesta loja..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: storeTheme.text }}
          />
        </div>
      </div>

      {/* ── Horizontal category chips ── */}
      <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {subcategories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          const count = categoryCounts[cat.slug] || 0;
          const isDisabled = cat.slug !== "todos" && count === 0;
          return (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              disabled={isDisabled}
              className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                background: isActive ? storeTheme.primary : storeTheme.card,
                color: isActive ? "#fff" : storeTheme.textMuted,
                border: `1px solid ${isActive ? storeTheme.primary : storeTheme.border}`,
                opacity: isDisabled ? 0.35 : 1,
              }}
            >
              {cat.name}
              {count > 0 && !isActive && (
                <span className="ml-1 opacity-50">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Results count ── */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: storeTheme.textMuted }}>
          {visibleProducts.length} {visibleProducts.length === 1 ? "resultado" : "resultados"}
        </p>
      </div>

      {/* ── Product cards (ML style) ── */}
      {visibleProducts.length > 0 ? (
        <div className="flex flex-col gap-3">
          {visibleProducts.map((product: any, i: number) => {
            const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={productLink}
                  className="flex gap-3 rounded-lg overflow-hidden group transition-shadow hover:shadow-lg"
                  style={{
                    background: storeTheme.card,
                    border: `1px solid ${storeTheme.border}`,
                  }}
                >
                  {/* Image */}
                  <div className="relative w-[140px] h-[140px] flex-shrink-0 overflow-hidden">
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
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold shadow ${getTagStyle(product.tag)}`}>
                        {getTagLabel(product.tag)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between py-2.5 pr-3 min-w-0">
                    <div>
                      <h3 className="text-[13px] font-normal line-clamp-2 leading-snug" style={{ color: storeTheme.text }}>
                        {product.title}
                      </h3>
                      {product.price > 0 && (
                        <p className="text-lg font-semibold mt-1.5" style={{ color: storeTheme.text }}>
                          R$ {product.price.toLocaleString("pt-BR")}
                          {product.isAluguel && (
                            <span className="text-xs font-normal ml-1" style={{ color: storeTheme.textMuted }}>/mês</span>
                          )}
                        </p>
                      )}
                      {product.accepts_financing && (
                        <p className="text-[10px] mt-0.5" style={{ color: "#00a650" }}>
                          Aceita financiamento
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 mt-1.5">
                      {/* Specs row */}
                      <div className="flex items-center gap-3 text-[10px]" style={{ color: storeTheme.textMuted }}>
                        {product.bedrooms > 0 && (
                          <span className="flex items-center gap-0.5"><Bed size={10} /> {product.bedrooms}q</span>
                        )}
                        {product.bathrooms > 0 && (
                          <span className="flex items-center gap-0.5"><Bath size={10} /> {product.bathrooms}b</span>
                        )}
                        {product.area > 0 && (
                          <span className="flex items-center gap-0.5"><Ruler size={10} /> {product.area}m²</span>
                        )}
                      </div>
                      {/* Location */}
                      {product.city && (
                        <p className="text-[10px] flex items-center gap-1" style={{ color: storeTheme.textMuted }}>
                          <MapPin size={9} />
                          {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={16} style={{ color: storeTheme.textMuted }} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 rounded-lg" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
          <Search size={32} className="mx-auto mb-3 opacity-30" style={{ color: storeTheme.textMuted }} />
          <p className="text-sm font-medium" style={{ color: storeTheme.textMuted }}>
            {searchTerm ? "Nenhum resultado para essa busca" : "Nenhum anúncio encontrado"}
          </p>
        </div>
      )}
    </div>
  );
}
