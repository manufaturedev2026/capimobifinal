import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Image, Menu, X } from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Minimal Layout — Scrollable category pills + hamburger menu
 */
export default function StoreLayoutMinimal({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div>
      {/* Top bar: scrollable pills + hamburger */}
      <div className="lg:hidden mb-5 flex items-center gap-2">
        <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          {subcategories.filter(c => c.slug === "todos" || (categoryCounts[c.slug] || 0) > 0).slice(0, 4).map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className="flex-shrink-0 px-3.5 py-2 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap"
                style={{
                  background: isActive ? storeTheme.primary : `${storeTheme.border}`,
                  color: isActive ? "#fff" : storeTheme.textMuted,
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
        {subcategories.length > 4 && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: `${storeTheme.border}`, color: storeTheme.text }}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
      </div>

      {/* Hamburger dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden mb-4 overflow-hidden rounded-xl"
            style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
          >
            <div className="p-2 grid grid-cols-2 gap-1.5">
              {subcategories.map((cat) => {
                const isActive = activeCategory === cat.slug;
                const count = categoryCounts[cat.slug] || 0;
                const isDisabled = cat.slug !== "todos" && count === 0;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => { setActiveCategory(cat.slug); setMenuOpen(false); }}
                    disabled={isDisabled}
                    className="px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-all"
                    style={{
                      background: isActive ? `${storeTheme.primary}20` : "transparent",
                      color: isActive ? storeTheme.primary : storeTheme.textMuted,
                      opacity: isDisabled ? 0.3 : 1,
                      borderLeft: isActive ? `3px solid ${storeTheme.primary}` : "3px solid transparent",
                    }}
                  >
                    {cat.name} {count > 0 && <span className="opacity-60">({count})</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean 2-column grid with minimal cards */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {filteredProducts.map((product: any, i: number) => {
            const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
            return (
              <motion.div key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <Link to={productLink} className="block rounded-xl overflow-hidden group" style={{ background: storeTheme.card }}>
                  <div className="relative aspect-square overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted"><Image size={24} className="text-muted-foreground" /></div>
                    )}
                  </div>
                  <div className="px-2.5 py-2.5">
                    <h3 className="text-xs font-semibold line-clamp-1" style={{ color: storeTheme.text }}>{product.title}</h3>
                    {product.price > 0 && (
                      <p className="text-sm font-bold text-emerald-500 mt-0.5">R$ {product.price.toLocaleString("pt-BR")}</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: storeTheme.textMuted }}>Nenhum anúncio encontrado</p>
        </div>
      )}
    </div>
  );
}
