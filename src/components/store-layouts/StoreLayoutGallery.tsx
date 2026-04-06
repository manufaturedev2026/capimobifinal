import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Image, MapPin } from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Gallery Layout — Pinterest/Instagram-style masonry with no borders
 */
export default function StoreLayoutGallery({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  // Alternate tall/short cards for masonry effect
  const getAspect = (i: number) => {
    const pattern = [1, 1.3, 0.85, 1.15, 1, 0.9];
    return pattern[i % pattern.length];
  };

  return (
    <div>
      {/* Minimal pill filters */}
      <div className="lg:hidden mb-5 flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {subcategories.filter(c => c.slug === "todos" || (categoryCounts[c.slug] || 0) > 0).map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all"
              style={{
                background: isActive ? storeTheme.text : "transparent",
                color: isActive ? storeTheme.bg : storeTheme.textMuted,
                border: `1px solid ${isActive ? storeTheme.text : storeTheme.border}`,
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Masonry-style grid */}
      {filteredProducts.length > 0 ? (
        <div className="columns-2 gap-2 space-y-2">
          {filteredProducts.map((product: any, i: number) => {
            const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
            const aspectRatio = getAspect(i);
            return (
              <motion.div key={product.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="break-inside-avoid">
                <Link to={productLink} className="block rounded-xl overflow-hidden group relative" style={{ aspectRatio: `1/${aspectRatio}` }}>
                  {product.image ? (
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted"><Image size={24} className="text-muted-foreground" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-white text-xs font-bold line-clamp-1">{product.title}</h3>
                    {product.price > 0 && (
                      <p className="text-emerald-400 text-xs font-bold mt-0.5">R$ {product.price.toLocaleString("pt-BR")}</p>
                    )}
                    {product.city && (
                      <p className="text-white/70 text-[10px] mt-0.5 flex items-center gap-1"><MapPin size={9} /> {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}</p>
                    )}
                  </div>
                  {product.tag && (
                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold ${getTagStyle(product.tag)}`}>
                      {getTagLabel(product.tag)}
                    </span>
                  )}
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
