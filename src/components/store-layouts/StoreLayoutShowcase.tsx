import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Image, ChevronLeft, ChevronRight, MessageCircle, Eye } from "lucide-react";
import type { StoreLayoutProps } from "./types";

export default function StoreLayoutShowcase({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, handleWhatsApp, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  const [heroIndex, setHeroIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const heroProducts = filteredProducts.slice(0, 8);
  const restProducts = filteredProducts.slice(0);

  // Auto-slide hero
  useEffect(() => {
    if (heroProducts.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setHeroIndex((p) => (p + 1) % heroProducts.length);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [heroProducts.length]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setHeroIndex(0);
  };

  const heroProduct = heroProducts[heroIndex];

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

      {/* ══════ HERO BANNER CAROUSEL ══════ */}
      {heroProducts.length > 0 && heroProduct && (
        <div className="relative rounded-3xl overflow-hidden mb-6" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={heroProduct.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6 }}
              className="relative aspect-[3/4] sm:aspect-[16/9]"
            >
              {heroProduct.image ? (
                <img
                  src={heroProduct.image}
                  alt={heroProduct.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.card }}>
                  <Image size={64} className="text-muted-foreground" />
                </div>
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

              {/* Tag */}
              {heroProduct.tag && (
                <span className={`absolute top-4 left-4 px-3 py-1 rounded-xl text-xs font-bold shadow-lg ${getTagStyle(heroProduct.tag)}`}>
                  {getTagLabel(heroProduct.tag)}
                </span>
              )}

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
                <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white drop-shadow-lg leading-tight">
                  {heroProduct.title}
                </h3>
                {heroProduct.city && (
                  <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
                    <MapPin size={11} /> {heroProduct.neighborhood ? `${heroProduct.neighborhood}, ${heroProduct.city}` : heroProduct.city}
                  </p>
                )}
                {heroProduct.price > 0 && (
                  <p className="font-display font-extrabold text-2xl sm:text-3xl text-emerald-400 mt-2 drop-shadow-lg">
                    R$ {heroProduct.price.toLocaleString("pt-BR")}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Link
                    to={`/imoveis/produto/${heroProduct.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm backdrop-blur-sm transition-all"
                    style={{ background: storeTheme.primary, color: "#fff" }}
                  >
                    <Eye size={16} /> Ver Detalhes
                  </Link>
                  <button
                    onClick={() => handleWhatsApp(heroProduct.title, heroProduct.id)}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#25d366] text-white font-bold text-sm"
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              </div>

              {/* Navigation arrows */}
              {heroProducts.length > 1 && (
                <>
                  <button
                    onClick={() => setHeroIndex((p) => (p - 1 + heroProducts.length) % heroProducts.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white active:scale-90 transition-transform"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setHeroIndex((p) => (p + 1) % heroProducts.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white active:scale-90 transition-transform"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Progress indicators */}
          {heroProducts.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {heroProducts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: idx === heroIndex ? 20 : 6,
                    background: idx === heroIndex ? "#fff" : "rgba(255,255,255,0.4)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════ REST OF LISTINGS ══════ */}
      {restProducts.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-base mb-3 px-1" style={{ color: storeTheme.text }}>
            Todos os Imóveis
            <span className="font-normal text-xs ml-2" style={{ color: storeTheme.textMuted }}>({restProducts.length})</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {restProducts.map((product: any, i: number) => {
              const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    to={productLink}
                    className="block rounded-2xl overflow-hidden transition-all"
                    style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Image size={24} className="text-muted-foreground" />
                        </div>
                      )}
                      {product.tag && (
                        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold ${getTagStyle(product.tag)}`}>
                          {getTagLabel(product.tag)}
                        </span>
                      )}
                      {product.status === "vendido" && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-xs bg-red-600 px-3 py-1 rounded-lg">VENDIDO</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-display font-bold text-xs truncate" style={{ color: storeTheme.text }}>
                        {product.title}
                      </h4>
                      {product.price > 0 && (
                        <p className="font-display font-extrabold text-sm text-emerald-500 mt-1">
                          R$ {product.price.toLocaleString("pt-BR")}
                        </p>
                      )}
                      {product.city && (
                        <p className="text-[10px] mt-1 flex items-center gap-0.5" style={{ color: storeTheme.textMuted }}>
                          <MapPin size={9} /> {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: storeTheme.textMuted }}>Nenhum anúncio encontrado</p>
        </div>
      )}
    </div>
  );
}
