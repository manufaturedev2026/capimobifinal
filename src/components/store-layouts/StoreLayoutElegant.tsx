import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Image, Bed, Bath, Ruler } from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Elegant Layout — Dark glassmorphism cards with premium feel
 */
export default function StoreLayoutElegant({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  return (
    <div>
      {/* Sleek category tabs */}
      <div className="lg:hidden mb-6">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {subcategories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            const count = categoryCounts[cat.slug] || 0;
            const isDisabled = cat.slug !== "todos" && count === 0;
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                disabled={isDisabled}
                className="flex-shrink-0 px-4 py-2.5 text-xs font-semibold transition-all relative"
                style={{
                  color: isActive ? storeTheme.primary : storeTheme.textMuted,
                  opacity: isDisabled ? 0.3 : 1,
                }}
              >
                {cat.name}
                {isActive && (
                  <motion.div layoutId="elegant-tab" className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: storeTheme.primary }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Glassmorphism cards */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map((product: any, i: number) => {
            const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
            return (
              <motion.div key={product.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Link
                  to={productLink}
                  className="flex gap-3 rounded-2xl overflow-hidden group p-3 backdrop-blur-sm transition-all hover:scale-[1.01]"
                  style={{
                    background: `${storeTheme.card}cc`,
                    border: `1px solid ${storeTheme.border}`,
                    boxShadow: `0 4px 20px rgba(0,0,0,0.1)`,
                  }}
                >
                  <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted"><Image size={20} className="text-muted-foreground" /></div>
                    )}
                    {product.tag && (
                      <span className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold ${getTagStyle(product.tag)}`}>
                        {getTagLabel(product.tag)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                    <div>
                      <h3 className="font-display font-bold text-sm line-clamp-2 leading-tight" style={{ color: storeTheme.text }}>{product.title}</h3>
                      {product.city && (
                        <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: storeTheme.textMuted }}>
                          <MapPin size={9} /> {product.city}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      {product.price > 0 && (
                        <p className="font-display font-extrabold text-emerald-500 text-base">
                          R$ {product.price.toLocaleString("pt-BR")}
                        </p>
                      )}
                    </div>
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
