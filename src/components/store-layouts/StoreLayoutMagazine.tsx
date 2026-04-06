import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Image, Bed, Bath, Ruler, Car, ChevronRight,
  Building2, Home, Store, Building, LandPlot, ArrowRight,
  Sparkles, Eye,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Magazine Layout — Immersive editorial style with hero feature, masonry-like grid,
 * and rich visual hierarchy inspired by luxury property magazines.
 */
export default function StoreLayoutMagazine({
  filteredProducts, products, subcategories, activeCategory, setActiveCategory,
  categoryCounts, categoryCardImages, storeTheme, corretorSlug,
  handleWhatsApp, getTagStyle, getTagLabel, formatPrice, dbProfile,
}: StoreLayoutProps) {

  const getSpecs = (product: any) => {
    const specs: { icon: React.ReactNode; label: string }[] = [];
    if (product.bedrooms) specs.push({ icon: <Bed size={13} />, label: `${product.bedrooms} quartos` });
    if (product.bathrooms) specs.push({ icon: <Bath size={13} />, label: `${product.bathrooms} banheiros` });
    if (product.area) specs.push({ icon: <Ruler size={13} />, label: `${product.area}m²` });
    if (product.parking_spots) specs.push({ icon: <Car size={13} />, label: `${product.parking_spots} vagas` });
    return specs;
  };

  // Split products: first = hero, rest = grid
  const heroProduct = filteredProducts[0];
  const secondaryProducts = filteredProducts.slice(1, 3);
  const gridProducts = filteredProducts.slice(3);

  const categoryIcons: Record<string, React.ReactNode> = {
    casa: <Home size={16} />,
    apartamento: <Building size={16} />,
    terreno: <LandPlot size={16} />,
    comercial: <Store size={16} />,
  };

  return (
    <div className="space-y-8">

      {/* ─── Editorial Category Tabs ─── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
        {subcategories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          const count = categoryCounts[cat.slug] || 0;
          const isDisabled = cat.slug !== "todos" && count === 0;
          return (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              disabled={isDisabled}
              className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                background: isActive ? storeTheme.primary : "transparent",
                color: isActive ? "#fff" : storeTheme.textMuted,
                border: `1.5px solid ${isActive ? storeTheme.primary : storeTheme.border}`,
                opacity: isDisabled ? 0.3 : 1,
              }}
            >
              {categoryIcons[cat.slug]}
              {cat.name}
              {count > 0 && <span className="opacity-60 text-[10px]">({count})</span>}
            </button>
          );
        })}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-24">
          <Building2 size={48} className="mx-auto mb-4 opacity-20" style={{ color: storeTheme.textMuted }} />
          <p className="text-base font-semibold" style={{ color: storeTheme.textMuted }}>Nenhum imóvel encontrado</p>
          <p className="text-xs mt-1 opacity-50" style={{ color: storeTheme.textMuted }}>Tente outra categoria</p>
        </div>
      ) : (
        <>
          {/* ─── Hero Feature ─── */}
          {heroProduct && (
            <Link
              to={`/imoveis/produto/${heroProduct.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`}
              className="block group"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative rounded-3xl overflow-hidden"
                style={{ border: `1px solid ${storeTheme.border}` }}
              >
                <div className="relative aspect-[16/10] sm:aspect-[21/9] overflow-hidden">
                  {heroProduct.image ? (
                    <img
                      src={heroProduct.image}
                      alt={heroProduct.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.border }}>
                      <Image size={64} style={{ color: storeTheme.textMuted }} />
                    </div>
                  )}

                  {/* Cinematic gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

                  {/* Tag */}
                  {heroProduct.tag && (
                    <span className={`absolute top-4 left-4 sm:top-6 sm:left-6 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-xl ${getTagStyle(heroProduct.tag)}`}>
                      {getTagLabel(heroProduct.tag)}
                    </span>
                  )}

                  {/* Badge */}
                  <div
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest backdrop-blur-md"
                    style={{ background: `${storeTheme.primary}dd`, color: "#fff" }}
                  >
                    <Sparkles size={12} /> Destaque
                  </div>

                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 lg:p-10">
                    <div className="max-w-2xl">
                      {heroProduct.city && (
                        <p className="text-white/60 text-xs flex items-center gap-1 mb-2 uppercase tracking-wider font-medium">
                          <MapPin size={11} />
                          {heroProduct.neighborhood ? `${heroProduct.neighborhood}, ${heroProduct.city}` : heroProduct.city}
                        </p>
                      )}
                      <h2 className="text-white font-extrabold text-xl sm:text-3xl lg:text-4xl leading-tight line-clamp-2 mb-3 drop-shadow-xl">
                        {heroProduct.title}
                      </h2>

                      {/* Specs */}
                      {getSpecs(heroProduct).length > 0 && (
                        <div className="flex items-center gap-4 mb-4">
                          {getSpecs(heroProduct).map((spec, idx) => (
                            <span key={idx} className="text-white/80 text-xs flex items-center gap-1 font-medium">
                              {spec.icon} {spec.label}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        {heroProduct.price > 0 && (
                          <span className="text-white font-black text-2xl sm:text-3xl drop-shadow-lg">
                            R$ {heroProduct.price.toLocaleString("pt-BR")}
                          </span>
                        )}
                        <span
                          className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all group-hover:gap-3"
                          style={{ background: storeTheme.primary, color: "#fff" }}
                        >
                          Ver imóvel <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          )}

          {/* ─── Secondary Cards (2-col editorial) ─── */}
          {secondaryProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {secondaryProducts.map((product: any, i: number) => {
                const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
                const specs = getSpecs(product);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
                  >
                    <Link
                      to={productLink}
                      className="group block rounded-2xl overflow-hidden h-full transition-shadow duration-300 hover:shadow-2xl"
                      style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.border }}>
                            <Image size={32} style={{ color: storeTheme.textMuted }} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {product.tag && (
                          <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${getTagStyle(product.tag)}`}>
                            {getTagLabel(product.tag)}
                          </span>
                        )}
                        {product.price > 0 && (
                          <p className="absolute bottom-3 left-3 text-white font-extrabold text-lg drop-shadow-lg">
                            R$ {product.price.toLocaleString("pt-BR")}
                          </p>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-sm line-clamp-2 leading-snug mb-1.5" style={{ color: storeTheme.text }}>
                          {product.title}
                        </h3>
                        {product.city && (
                          <p className="text-[11px] flex items-center gap-1 mb-2" style={{ color: storeTheme.textMuted }}>
                            <MapPin size={10} />
                            {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
                          </p>
                        )}
                        {specs.length > 0 && (
                          <div className="flex items-center gap-3 text-[11px] font-medium" style={{ color: storeTheme.textMuted }}>
                            {specs.slice(0, 3).map((s, idx) => (
                              <span key={idx} className="flex items-center gap-1">
                                <span style={{ color: storeTheme.primary }}>{s.icon}</span> {s.label}
                              </span>
                            ))}
                          </div>
                        )}
                        {product.description && (
                          <p className="text-[11px] mt-2 line-clamp-2 leading-relaxed" style={{ color: storeTheme.textMuted }}>
                            {product.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ─── Divider ─── */}
          {gridProducts.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px" style={{ background: storeTheme.border }} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: storeTheme.textMuted }}>
                Mais imóveis
              </span>
              <div className="flex-1 h-px" style={{ background: storeTheme.border }} />
            </div>
          )}

          {/* ─── Grid Cards ─── */}
          {gridProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {gridProducts.map((product: any, i: number) => {
                const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
                const specs = getSpecs(product);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4 }}
                  >
                    <Link
                      to={productLink}
                      className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
                      style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.border }}>
                            <Image size={28} style={{ color: storeTheme.textMuted }} />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
                        {product.tag && (
                          <span className={`absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getTagStyle(product.tag)}`}>
                            {getTagLabel(product.tag)}
                          </span>
                        )}
                        {product.price > 0 && (
                          <p className="absolute bottom-2.5 left-3 text-white font-bold text-base drop-shadow-lg">
                            R$ {product.price.toLocaleString("pt-BR")}
                          </p>
                        )}
                      </div>
                      <div className="p-3.5">
                        <h3 className="font-bold text-sm line-clamp-2 leading-snug mb-1" style={{ color: storeTheme.text }}>
                          {product.title}
                        </h3>
                        {product.city && (
                          <p className="text-[10px] flex items-center gap-1 mb-2" style={{ color: storeTheme.textMuted }}>
                            <MapPin size={10} />
                            {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
                          </p>
                        )}
                        {specs.length > 0 && (
                          <div className="flex items-center gap-2.5 pt-2.5 border-t" style={{ borderColor: storeTheme.border }}>
                            {specs.slice(0, 3).map((s, idx) => (
                              <span key={idx} className="flex items-center gap-1 text-[10px] font-medium" style={{ color: storeTheme.textMuted }}>
                                <span style={{ color: storeTheme.primary }}>{s.icon}</span> {s.label}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide" style={{ color: storeTheme.primary }}>
                          <span>Ver detalhes</span>
                          <ChevronRight size={13} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
