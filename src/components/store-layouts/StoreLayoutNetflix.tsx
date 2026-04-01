import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Image, MessageCircle } from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Netflix Layout — Horizontal category carousel + standard grid
 * This is the default/original layout.
 */
export default function StoreLayoutNetflix({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, categoryCardImages, storeTheme, corretorSlug,
  isDbProfile, dbProfile, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  return (
    <div>
      {/* Category Carousel */}
      <div className="lg:hidden mb-6">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 snap-x snap-mandatory -mx-4 px-4">
          {subcategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.slug;
            const count = categoryCounts[cat.slug] || 0;
            const isDisabled = cat.slug !== "todos" && count === 0;
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                disabled={isDisabled}
                className="flex-shrink-0 snap-start relative w-[120px] h-[170px] rounded-2xl overflow-hidden transition-all duration-300 group"
                style={{
                  boxShadow: isActive ? `0 0 24px ${storeTheme.primary}50, 0 8px 20px rgba(0,0,0,0.4)` : "0 4px 12px rgba(0,0,0,0.2)",
                  border: isActive ? `2.5px solid ${storeTheme.primary}` : "2.5px solid transparent",
                  opacity: isDisabled ? 0.4 : 1,
                }}
              >
                <img src={categoryCardImages[cat.slug] || cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                  <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center mb-1">
                    <Icon size={14} className="text-white" />
                  </div>
                  <span className="text-[13px] font-bold text-white leading-tight block">{cat.name}</span>
                  {(count > 0 || cat.slug === "todos") && (
                    <span className="text-[10px] text-white/60 font-medium mt-0.5 block">{count} imóveis</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
          {filteredProducts.map((product: any, i: number) => {
            const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
            return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Link to={productLink} className="group block rounded-2xl overflow-hidden hover:shadow-lg transition-all" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {product.image ? (
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Image size={32} className="text-muted-foreground" /></div>
                    )}
                    {product.tag && (
                      <span className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md ${getTagStyle(product.tag)}`}>
                        {getTagLabel(product.tag)}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-display font-semibold text-sm leading-tight line-clamp-2" style={{ color: storeTheme.text }}>{product.title}</h3>
                    {product.price > 0 && (
                      <p className="font-display font-bold text-emerald-500 text-base mt-1">R$ {product.price.toLocaleString("pt-BR")}</p>
                    )}
                    {product.city && (
                      <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: storeTheme.textMuted }}><MapPin size={10} /> {product.city}</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 rounded-2xl" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
          <Image size={48} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium" style={{ color: storeTheme.textMuted }}>Nenhum anúncio nesta categoria</p>
          <button onClick={() => setActiveCategory("todos")} style={{ color: storeTheme.primary }} className="text-sm mt-2 hover:underline">Ver todos</button>
        </div>
      )}
    </div>
  );
}
