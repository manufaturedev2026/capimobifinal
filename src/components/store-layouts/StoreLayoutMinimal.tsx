import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Image } from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Minimal Layout — Clean, no category carousel, just pill filters + clean grid
 */
export default function StoreLayoutMinimal({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  return (
    <div>
      {/* Pill filters */}
      <div className="lg:hidden mb-6 flex flex-wrap gap-2">
        {subcategories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          const count = categoryCounts[cat.slug] || 0;
          const isDisabled = cat.slug !== "todos" && count === 0;
          return (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              disabled={isDisabled}
              className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={{
                background: isActive ? storeTheme.primary : `${storeTheme.border}`,
                color: isActive ? "#fff" : storeTheme.textMuted,
                opacity: isDisabled ? 0.4 : 1,
              }}
            >
              {cat.name} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

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
