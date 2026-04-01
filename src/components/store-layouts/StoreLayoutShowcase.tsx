import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Image, ChevronUp, ChevronDown, MessageCircle, Eye } from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Showcase Layout — One property at a time, full-width, swipe/tap to navigate
 */
export default function StoreLayoutShowcase({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, handleWhatsApp, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = () => setCurrentIndex((p) => Math.min(p + 1, filteredProducts.length - 1));
  const goPrev = () => setCurrentIndex((p) => Math.max(p - 1, 0));

  // Category chips
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentIndex(0);
  };

  const product = filteredProducts[currentIndex];

  return (
    <div>
      {/* Category chips */}
      <div className="lg:hidden mb-4 flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {subcategories.filter(c => c.slug === "todos" || (categoryCounts[c.slug] || 0) > 0).map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => handleCategoryChange(cat.slug)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all"
              style={{
                background: isActive ? storeTheme.primary : storeTheme.card,
                color: isActive ? "#fff" : storeTheme.textMuted,
                border: `1px solid ${isActive ? storeTheme.primary : storeTheme.border}`,
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Showcase card */}
      {filteredProducts.length > 0 && product ? (
        <div className="relative">
          {/* Counter */}
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs font-semibold" style={{ color: storeTheme.textMuted }}>
              {currentIndex + 1} de {filteredProducts.length}
            </p>
            <div className="flex gap-1.5">
              <button onClick={goPrev} disabled={currentIndex === 0} className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
                <ChevronUp size={16} style={{ color: storeTheme.text }} />
              </button>
              <button onClick={goNext} disabled={currentIndex >= filteredProducts.length - 1} className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
                <ChevronDown size={16} style={{ color: storeTheme.text }} />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.35 }}
              className="rounded-3xl overflow-hidden"
              style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}`, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
            >
              {/* Large image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted"><Image size={48} className="text-muted-foreground" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                {product.tag && (
                  <span className={`absolute top-3 left-3 px-3 py-1 rounded-xl text-xs font-bold shadow-lg ${getTagStyle(product.tag)}`}>
                    {getTagLabel(product.tag)}
                  </span>
                )}
                {product.price > 0 && (
                  <p className="absolute bottom-3 left-3 font-display font-extrabold text-2xl text-white drop-shadow-lg">
                    R$ {product.price.toLocaleString("pt-BR")}
                  </p>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-display font-bold text-lg" style={{ color: storeTheme.text }}>{product.title}</h3>
                {product.city && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: storeTheme.textMuted }}>
                    <MapPin size={11} /> {product.city}
                  </p>
                )}
                {product.description && (
                  <p className="text-xs mt-3 line-clamp-3" style={{ color: storeTheme.textMuted }}>{product.description}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Link
                    to={`/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all"
                    style={{ background: storeTheme.primary, color: "#fff" }}
                  >
                    <Eye size={16} /> Ver Detalhes
                  </Link>
                  <button
                    onClick={() => handleWhatsApp(product.title, product.id)}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#25d366] text-white font-bold text-sm"
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex justify-center gap-1 mt-4">
            {filteredProducts.slice(0, 10).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: idx === currentIndex ? 20 : 6,
                  background: idx === currentIndex ? storeTheme.primary : storeTheme.border,
                }}
              />
            ))}
            {filteredProducts.length > 10 && (
              <span className="text-[9px] ml-1" style={{ color: storeTheme.textMuted }}>+{filteredProducts.length - 10}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: storeTheme.textMuted }}>Nenhum anúncio encontrado</p>
        </div>
      )}
    </div>
  );
}
