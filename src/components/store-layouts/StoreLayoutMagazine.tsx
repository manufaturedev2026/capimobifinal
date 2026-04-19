import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Image, Bed, Bath, Ruler, Car, ChevronRight,
  Building2, Home, Store, Building, LandPlot, ArrowRight,
  Sparkles,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";

/* ── Shared helpers ── */
const categoryIcons: Record<string, React.ReactNode> = {
  casa: <Home size={16} />,
  apartamento: <Building size={16} />,
  terreno: <LandPlot size={16} />,
  comercial: <Store size={16} />,
};

function getSpecs(product: any) {
  const specs: { icon: React.ReactNode; label: string }[] = [];
  if (product.bedrooms) specs.push({ icon: <Bed size={12} />, label: `${product.bedrooms}` });
  if (product.bathrooms) specs.push({ icon: <Bath size={12} />, label: `${product.bathrooms}` });
  if (product.area) specs.push({ icon: <Ruler size={12} />, label: `${product.area}m²` });
  if (product.parking_spots) specs.push({ icon: <Car size={12} />, label: `${product.parking_spots}` });
  return specs;
}

/* ── Card components ── */

/** Full-width hero card */
function HeroCard({ product, corretorSlug, storeTheme, getTagStyle, getTagLabel, delay = 0 }: any) {
  const _qs = [corretorSlug ? `corretor=${corretorSlug}` : "", product._isPartnerImport && product._partnerStoreSlug ? `loja=${product._partnerStoreSlug}` : ""].filter(Boolean).join("&");
  const link = `/imoveis/produto/${product.slug || product.id}${_qs ? `?${_qs}` : ""}`;
  const specs = getSpecs(product);
  return (
    <Link to={link} className="block group">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay }}
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
        style={{ border: `1px solid ${storeTheme.border}` }}
      >
        <div className="relative aspect-[4/3] sm:aspect-[21/9] overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.border }}>
              <Image size={48} style={{ color: storeTheme.textMuted }} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

          {product.tag && (
            <span className={`absolute top-3 left-3 sm:top-5 sm:left-5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${getTagStyle(product.tag)}`}>
              {getTagLabel(product.tag)}
            </span>
          )}

          <div
            className="absolute top-3 right-3 sm:top-5 sm:right-5 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest backdrop-blur-md"
            style={{ background: `${storeTheme.primary}dd`, color: "#fff" }}
          >
            <Sparkles size={10} /> Destaque
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
            {product.city && (
              <p className="text-white/60 text-[10px] flex items-center gap-1 mb-1 uppercase tracking-wider font-medium">
                <MapPin size={10} />
                {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
              </p>
            )}
            <h2 className="text-white font-extrabold text-base sm:text-2xl lg:text-3xl leading-tight line-clamp-2 mb-2">
              {product.title}
            </h2>
            {specs.length > 0 && (
              <div className="flex items-center gap-3 mb-2">
                {specs.map((s, i) => (
                  <span key={i} className="text-white/70 text-[10px] sm:text-xs flex items-center gap-1">{s.icon} {s.label}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              {product.price > 0 && (
                <span className="text-white font-black text-lg sm:text-2xl">
                  R$ {product.price.toLocaleString("pt-BR")}
                </span>
              )}
              <span
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
                style={{ background: storeTheme.primary, color: "#fff" }}
              >
                Ver imóvel <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/** Compact card for 2-col grid */
function CompactCard({ product, corretorSlug, storeTheme, getTagStyle, getTagLabel, delay = 0 }: any) {
  const _qs = [corretorSlug ? `corretor=${corretorSlug}` : "", product._isPartnerImport && product._partnerStoreSlug ? `loja=${product._partnerStoreSlug}` : ""].filter(Boolean).join("&");
  const link = `/imoveis/produto/${product.slug || product.id}${_qs ? `?${_qs}` : ""}`;
  const specs = getSpecs(product);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Link
        to={link}
        className="group block rounded-xl overflow-hidden h-full transition-shadow hover:shadow-xl"
        style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.border }}>
              <Image size={24} style={{ color: storeTheme.textMuted }} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
          {product.tag && (
            <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getTagStyle(product.tag)}`}>
              {getTagLabel(product.tag)}
            </span>
          )}
          {product.price > 0 && (
            <p className="absolute bottom-2 left-2 text-white font-bold text-sm drop-shadow-lg">
              R$ {product.price.toLocaleString("pt-BR")}
            </p>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-bold text-xs line-clamp-2 leading-snug mb-1" style={{ color: storeTheme.text }}>
            {product.title}
          </h3>
          {product.city && (
            <p className="text-[9px] flex items-center gap-1" style={{ color: storeTheme.textMuted }}>
              <MapPin size={9} />
              {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
            </p>
          )}
          {specs.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t" style={{ borderColor: storeTheme.border }}>
              {specs.slice(0, 3).map((s, i) => (
                <span key={i} className="flex items-center gap-0.5 text-[9px]" style={{ color: storeTheme.textMuted }}>
                  <span style={{ color: storeTheme.primary }}>{s.icon}</span> {s.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/** Medium card for single-col within alternating pattern */
function MediumCard({ product, corretorSlug, storeTheme, getTagStyle, getTagLabel, delay = 0 }: any) {
  const _qs = [corretorSlug ? `corretor=${corretorSlug}` : "", product._isPartnerImport && product._partnerStoreSlug ? `loja=${product._partnerStoreSlug}` : ""].filter(Boolean).join("&");
  const link = `/imoveis/produto/${product.slug || product.id}${_qs ? `?${_qs}` : ""}`;
  const specs = getSpecs(product);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Link
        to={link}
        className="group flex gap-3 rounded-xl overflow-hidden transition-shadow hover:shadow-xl"
        style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
      >
        <div className="relative w-32 sm:w-40 flex-shrink-0 overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 min-h-[120px]" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center min-h-[120px]" style={{ background: storeTheme.border }}>
              <Image size={24} style={{ color: storeTheme.textMuted }} />
            </div>
          )}
          {product.tag && (
            <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getTagStyle(product.tag)}`}>
              {getTagLabel(product.tag)}
            </span>
          )}
        </div>
        <div className="flex-1 py-3 pr-3 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm line-clamp-2 leading-snug mb-1" style={{ color: storeTheme.text }}>
              {product.title}
            </h3>
            {product.city && (
              <p className="text-[10px] flex items-center gap-1 mb-1" style={{ color: storeTheme.textMuted }}>
                <MapPin size={10} />
                {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
              </p>
            )}
            {specs.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                {specs.slice(0, 3).map((s, i) => (
                  <span key={i} className="flex items-center gap-0.5 text-[10px]" style={{ color: storeTheme.textMuted }}>
                    <span style={{ color: storeTheme.primary }}>{s.icon}</span> {s.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          {product.price > 0 && (
            <p className="font-extrabold text-base mt-2" style={{ color: storeTheme.primary }}>
              R$ {product.price.toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * Magazine Layout — Immersive editorial with varied card sizes
 */
export default function StoreLayoutMagazine({
  filteredProducts, products, subcategories, activeCategory, setActiveCategory,
  categoryCounts, categoryCardImages, storeTheme, corretorSlug, sellerDisplayName,
  handleWhatsApp, getTagStyle, getTagLabel, formatPrice, dbProfile, storiesBar,
}: StoreLayoutProps) {

  const cardProps = { corretorSlug, storeTheme, getTagStyle, getTagLabel };

  // Categories with items (exclude "todos" for visual cards, keep it as a reset)
  const visualCategories = subcategories.filter(c => c.slug !== "todos" && (categoryCounts[c.slug] || 0) > 0);

  return (
    <div className="space-y-6">
      {/* Stories Bar */}
      {storiesBar && <div className="mb-2">{storiesBar}</div>}
      {/* ─── Visual Category Cards ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: storeTheme.text }}>
            Categorias
          </h2>
          {activeCategory !== "todos" && (
            <button
              onClick={() => setActiveCategory("todos")}
              className="text-[11px] font-bold underline"
              style={{ color: storeTheme.primary }}
            >
              Ver todos
            </button>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 lg:-mx-12 lg:px-12">
          {visualCategories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            const count = categoryCounts[cat.slug] || 0;
            const bgImage = categoryCardImages?.[cat.slug];
            return (
              <motion.button
                key={cat.slug}
                onClick={() => setActiveCategory(isActive ? "todos" : cat.slug)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative rounded-2xl overflow-hidden h-28 w-36 sm:w-44 flex-shrink-0 group transition-all"
                style={{
                  border: `2px solid ${isActive ? storeTheme.primary : storeTheme.border}`,
                  boxShadow: isActive ? `0 0 20px ${storeTheme.primary}40` : "none",
                }}
              >
                {bgImage ? (
                  <img src={bgImage} alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${storeTheme.primary}30, ${storeTheme.primary}10)` }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />

                <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-2">
                  <span className="mb-1 opacity-90">
                    {categoryIcons[cat.slug] || <Building2 size={20} />}
                  </span>
                  <span className="text-xs font-bold drop-shadow-lg">{cat.name}</span>
                  <span className="text-[9px] opacity-60 mt-0.5">{count} {count === 1 ? "imóvel" : "imóveis"}</span>
                </div>

                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: storeTheme.primary }} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-24">
          <Building2 size={48} className="mx-auto mb-4 opacity-20" style={{ color: storeTheme.textMuted }} />
          <p className="text-base font-semibold" style={{ color: storeTheme.textMuted }}>Nenhum imóvel encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product: any, i: number) => {
            /*
             * Alternating magazine pattern:
             *  0: Hero (full-width big)
             *  1,2: Side-by-side compact (2-col)
             *  3: Horizontal medium card
             *  4: Hero again
             *  5,6: Side-by-side
             *  7: Horizontal
             *  ... repeat every 4 positions
             */
            const pos = i % 4;

            if (pos === 0) {
              // Hero card
              return <HeroCard key={product.id} product={product} {...cardProps} delay={i * 0.03} />;
            }

            if (pos === 1) {
              // Start of a 2-col pair
              const next = filteredProducts[i + 1];
              return (
                <div key={product.id} className="grid grid-cols-2 gap-3">
                  <CompactCard product={product} {...cardProps} delay={i * 0.03} />
                  {next && <CompactCard product={next} {...cardProps} delay={(i + 1) * 0.03} />}
                </div>
              );
            }

            if (pos === 2) {
              // Already rendered as part of the pair above
              return null;
            }

            // pos === 3: Horizontal medium card
            return <MediumCard key={product.id} product={product} {...cardProps} delay={i * 0.03} />;
          })}
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
