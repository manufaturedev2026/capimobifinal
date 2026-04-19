import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Image, MapPin, Building2, Home, Building, LandPlot, Store, Zap, ArrowRight,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Gallery Layout — Pinterest/Instagram-style masonry with epic Marvel categories
 */
export default function StoreLayoutGallery({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, categoryCardImages, storeTheme, corretorSlug, sellerDisplayName, dbProfile, getTagStyle, getTagLabel, storiesBar,
}: StoreLayoutProps) {
  const getAspect = (i: number) => {
    const pattern = [1, 1.3, 0.85, 1.15, 1, 0.9];
    return pattern[i % pattern.length];
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    casa: <Home size={26} />,
    apartamento: <Building size={26} />,
    terreno: <LandPlot size={26} />,
    comercial: <Store size={26} />,
  };

  const visualCategories = subcategories.filter(c => c.slug !== "todos" && (categoryCounts[c.slug] || 0) > 0);

  return (
    <div>
      {/* Stories Bar */}
      {storiesBar && <div className="mb-4">{storiesBar}</div>}

      {/* ─── Epic Marvel-Style Categories ─── */}
      {visualCategories.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={18} style={{ color: storeTheme.primary }} />
              <h2 className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: storeTheme.text }}>
                Categorias
              </h2>
            </div>
            {activeCategory !== "todos" && (
              <button
                onClick={() => setActiveCategory("todos")}
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: storeTheme.primary }}
              >
                Ver todos ›
              </button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 lg:-mx-0 lg:px-0">
            {visualCategories.map((cat, idx) => {
              const isActive = activeCategory === cat.slug;
              const count = categoryCounts[cat.slug] || 0;
              const bgImage = categoryCardImages?.[cat.slug];
              return (
                <motion.button
                  key={cat.slug}
                  onClick={() => setActiveCategory(isActive ? "todos" : cat.slug)}
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.1, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex-shrink-0 w-36 sm:w-44 rounded-2xl overflow-hidden group cursor-pointer"
                  style={{
                    height: "180px",
                    border: isActive ? `3px solid ${storeTheme.primary}` : "3px solid transparent",
                    boxShadow: isActive
                      ? `0 0 30px ${storeTheme.primary}50, 0 0 60px ${storeTheme.primary}20`
                      : "0 8px 30px rgba(0,0,0,0.3)",
                  }}
                >
                  {bgImage ? (
                    <img src={bgImage} alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="absolute inset-0"
                      style={{ background: `linear-gradient(160deg, ${storeTheme.primary}40 0%, ${storeTheme.bg} 50%, ${storeTheme.primary}20 100%)` }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  {isActive && (
                    <motion.div className="absolute inset-0"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ background: `linear-gradient(180deg, ${storeTheme.primary}30 0%, transparent 60%)` }} />
                  )}
                  <div className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: isActive ? storeTheme.primary : `linear-gradient(90deg, transparent, ${storeTheme.primary}60, transparent)` }} />
                  <div className="relative z-10 h-full flex flex-col items-center justify-end pb-4 px-3">
                    <div className="mb-3 p-3 rounded-xl backdrop-blur-sm"
                      style={{
                        background: isActive ? `${storeTheme.primary}40` : "rgba(255,255,255,0.1)",
                        boxShadow: isActive ? `0 0 20px ${storeTheme.primary}40` : "none",
                      }}>
                      <span style={{ color: isActive ? storeTheme.primary : "#fff" }}>
                        {categoryIcons[cat.slug] || <Building2 size={26} />}
                      </span>
                    </div>
                    <span className="text-sm font-black uppercase tracking-wider text-center leading-tight drop-shadow-lg"
                      style={{ color: isActive ? storeTheme.primary : "#fff" }}>
                      {cat.name}
                    </span>
                    <span className="mt-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{
                        background: isActive ? storeTheme.primary : "rgba(255,255,255,0.15)",
                        color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                      }}>
                      {count} {count === 1 ? "imóvel" : "imóveis"}
                    </span>
                  </div>
                  {isActive && (
                    <motion.div layoutId="gallery-category-active"
                      className="absolute bottom-0 left-0 right-0 h-1.5 rounded-t-full"
                      style={{ background: storeTheme.primary }} />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Masonry-style grid */}
      {filteredProducts.length > 0 ? (
        <div className="columns-2 gap-2 space-y-2">
          {filteredProducts.map((product: any, i: number) => {
            const _partner = product._isPartnerImport && product._partnerStoreSlug ? `/loja/${product._partnerStoreSlug}` : "";
              const _qs = corretorSlug ? `?corretor=${corretorSlug}` : "";
              const productLink = `/imoveis/produto/${product.slug || product.id}${_partner}${_qs}`;
            const aspectRatio = getAspect(i);
            return (
              <motion.div key={product.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="break-inside-avoid">
                <Link to={productLink} className="block rounded-xl overflow-hidden group relative" style={{ aspectRatio: `1/${aspectRatio}` }}>
                  {product.image ? (
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted"><Image size={24} className="text-muted-foreground" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <h3 className="text-white text-xs font-bold line-clamp-1">{product.title}</h3>
                    {product.price > 0 && (
                      <p className="text-xs font-bold mt-0.5" style={{ color: storeTheme.primary }}>R$ {product.price.toLocaleString("pt-BR")}</p>
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

      {/* ═══ CTA Captação ═══ */}
      <section className="px-4 py-12">
        <div className="rounded-2xl p-8 md:p-12 text-center" style={{ background: `linear-gradient(135deg, ${storeTheme.primary}20, ${storeTheme.primary}08)`, border: `1px solid ${storeTheme.primary}30` }}>
          <Home size={32} className="mx-auto mb-4" style={{ color: storeTheme.primary }} />
          <h2 className="font-display font-bold text-xl md:text-2xl mb-2" style={{ color: storeTheme.text }}>Quer anunciar seu imóvel?</h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: storeTheme.textMuted }}>
            Cadastre seu imóvel gratuitamente com {sellerDisplayName} e alcance mais compradores.
          </p>
          <Link to={`/captar-imovel/${corretorSlug}`} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105" style={{ background: storeTheme.primary, boxShadow: `0 8px 24px ${storeTheme.primary}40` }}>
            Anunciar meu imóvel <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
