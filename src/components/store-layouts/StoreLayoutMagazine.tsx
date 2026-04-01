import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Image, MessageCircle } from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Magazine Layout — Large full-width cards, editorial style, 1 column
 */
export default function StoreLayoutMagazine({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, handleWhatsApp, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  return (
    <div>
      {/* Horizontal scroll filters */}
      <div className="lg:hidden mb-6 flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {subcategories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          const count = categoryCounts[cat.slug] || 0;
          const isDisabled = cat.slug !== "todos" && count === 0;
          return (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              disabled={isDisabled}
              className="flex-shrink-0 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all"
              style={{
                background: isActive ? storeTheme.primary : storeTheme.card,
                color: isActive ? "#fff" : storeTheme.text,
                border: `1px solid ${isActive ? storeTheme.primary : storeTheme.border}`,
                opacity: isDisabled ? 0.4 : 1,
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Full-width magazine cards */}
      {filteredProducts.length > 0 ? (
        <div className="space-y-4">
          {filteredProducts.map((product: any, i: number) => {
            const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
            return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={productLink} className="block rounded-3xl overflow-hidden group" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted"><Image size={40} className="text-muted-foreground" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {product.tag && (
                      <span className={`absolute top-3 left-3 px-3 py-1 rounded-xl text-xs font-bold shadow-lg ${getTagStyle(product.tag)}`}>
                        {getTagLabel(product.tag)}
                      </span>
                    )}
                    {product.price > 0 && (
                      <p className="absolute bottom-3 left-3 font-display font-extrabold text-xl text-white drop-shadow-lg">
                        R$ {product.price.toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-bold text-base" style={{ color: storeTheme.text }}>{product.title}</h3>
                    {product.city && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: storeTheme.textMuted }}>
                        <MapPin size={11} /> {product.city}
                      </p>
                    )}
                    {product.description && (
                      <p className="text-xs mt-2 line-clamp-2" style={{ color: storeTheme.textMuted }}>{product.description}</p>
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
