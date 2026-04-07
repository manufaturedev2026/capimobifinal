import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Image, ChevronLeft, ChevronRight, MessageCircle, Eye,
  Sword, Sparkles, Trophy, Bed, Bath, Car, Maximize,
  Building2, Home, Building, LandPlot, Store, Zap,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";

/* ─── RPG decorative corner ─── */
function CornerDecor({ color, position }: { color: string; position: string }) {
  const pos = position === "tl" ? "top-0 left-0" : position === "tr" ? "top-0 right-0" : position === "bl" ? "bottom-0 left-0" : "bottom-0 right-0";
  const rotate = position === "tl" ? "" : position === "tr" ? "rotate-90" : position === "bl" ? "-rotate-90" : "rotate-180";
  return (
    <div className={`absolute ${pos} w-5 h-5 ${rotate} pointer-events-none z-10`}>
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M0 0h24v3h-21v21h-3z" fill={color} opacity="0.5" />
      </svg>
    </div>
  );
}

/* ─── Stat pill ─── */
function StatPill({ icon: Icon, value }: { icon: any; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] text-white/60 font-semibold"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <Icon size={9} className="text-white/40" /> {value}
    </span>
  );
}

const categoryIcons: Record<string, React.ReactNode> = {
  casa: <Home size={26} />,
  apartamento: <Building size={26} />,
  terreno: <LandPlot size={26} />,
  comercial: <Store size={26} />,
};

export default function StoreLayoutShowcase({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, categoryCardImages, storeTheme, corretorSlug, handleWhatsApp, getTagStyle, getTagLabel, storiesBar,
}: StoreLayoutProps) {
  const [heroIndex, setHeroIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMobile = useIsMobile();

  const heroProducts = filteredProducts.filter((p: any) => p.image).slice(0, 8);
  const restProducts = filteredProducts;

  useEffect(() => {
    if (heroProducts.length <= 1 || isMobile) return;
    intervalRef.current = setInterval(() => {
      setHeroIndex((p) => (p + 1) % heroProducts.length);
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [heroProducts.length, isMobile]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setHeroIndex(0);
  };

  const heroProduct = heroProducts[heroIndex];
  const accentColor = storeTheme.primary;

  return (
    <div className="font-body overflow-x-hidden max-w-full" style={{ overflowX: "clip" }}>
      {/* Stories Bar */}
      {storiesBar && <div className="mb-4">{storiesBar}</div>}
      {/* ══════ CATEGORY BAR ══════ */}
      <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {subcategories.filter(c => c.slug === "todos" || (categoryCounts[c.slug] || 0) > 0).map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => handleCategoryChange(cat.slug)}
              className="relative flex-shrink-0 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                  : "rgba(0,0,0,0.5)",
                color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                border: `2px solid ${isActive ? accentColor : "rgba(255,255,255,0.12)"}`,
                clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* ══════ HERO BANNER ══════ */}
      {heroProducts.length > 0 && heroProduct && (
        <div className="relative mb-8">
          {/* Accent line */}
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={13} style={{ color: accentColor }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
              Item em Destaque
            </span>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${accentColor}40, transparent)` }} />
          </div>

          <div
            className="relative overflow-hidden"
            style={{
              border: `2px solid ${accentColor}30`,
              boxShadow: `0 0 40px ${accentColor}20, inset 0 0 30px rgba(0,0,0,0.3)`,
              clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
            }}
          >
            <CornerDecor color={accentColor} position="tl" />
            <CornerDecor color={accentColor} position="br" />

            <AnimatePresence mode="wait">
              <motion.div
                key={heroProduct.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="relative aspect-[3/4] sm:aspect-[16/9]"
              >
                <img src={heroProduct.image} alt={heroProduct.title} className="w-full h-full object-cover" />

                {/* Vignette */}
                <div className="absolute inset-0" style={{
                  background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)",
                }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

                {/* Tag */}
                {heroProduct.tag && (
                  <span
                    className="absolute top-3 left-3 z-20 px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.2)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    {getTagLabel(heroProduct.tag)}
                  </span>
                )}

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 z-10">
                  <h3 className="font-display font-black text-xl sm:text-2xl text-white leading-tight"
                    style={{ textShadow: `0 0 20px ${accentColor}40` }}>
                    {heroProduct.title}
                  </h3>
                  {heroProduct.city && (
                    <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                      <MapPin size={11} /> {heroProduct.neighborhood ? `${heroProduct.neighborhood}, ${heroProduct.city}` : heroProduct.city}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {heroProduct.bedrooms && <StatPill icon={Bed} value={`${heroProduct.bedrooms} qts`} />}
                    {heroProduct.bathrooms && <StatPill icon={Bath} value={`${heroProduct.bathrooms} ban`} />}
                    {heroProduct.area && <StatPill icon={Maximize} value={`${heroProduct.area}m²`} />}
                    {heroProduct.parking_spots && <StatPill icon={Car} value={`${heroProduct.parking_spots} vg`} />}
                  </div>

                  {heroProduct.price > 0 && (
                    <p className="font-display font-black text-2xl sm:text-3xl mt-3"
                      style={{ color: accentColor, textShadow: `0 0 15px ${accentColor}50` }}>
                      R$ {heroProduct.price.toLocaleString("pt-BR")}
                    </p>
                  )}

                  {/* Action buttons — RPG style */}
                  <div className="flex gap-2 mt-4">
                    <Link
                      to={`/imoveis/produto/${heroProduct.slug || heroProduct.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 font-black text-sm uppercase tracking-wider text-white transition-all hover:brightness-110"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)`,
                        border: `1px solid ${accentColor}60`,
                        clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
                      }}
                    >
                      <Sword size={14} /> Saiba Mais
                    </Link>
                    <button
                      onClick={() => handleWhatsApp(heroProduct.title, heroProduct.id)}
                      className="flex items-center justify-center gap-2 px-5 py-3 font-bold text-sm text-white transition-all hover:brightness-110"
                      style={{
                        background: "linear-gradient(135deg, #25d366cc, #25d36688)",
                        border: "1px solid rgba(37,211,102,0.4)",
                        clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
                      }}
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                  </div>
                </div>

                {/* Navigation */}
                {heroProducts.length > 1 && (
                  <>
                    <button
                      onClick={() => setHeroIndex((p) => (p - 1 + heroProducts.length) % heroProducts.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors z-20"
                      style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${accentColor}20` }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setHeroIndex((p) => (p + 1) % heroProducts.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors z-20"
                      style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${accentColor}20` }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Progress bar */}
            {heroProducts.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 z-20 flex">
                {heroProducts.map((_, idx) => (
                  <div key={idx} className="flex-1 transition-all duration-500"
                    style={{ background: idx === heroIndex ? accentColor : "rgba(255,255,255,0.1)" }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════ INVENTORY ══════ */}
      {restProducts.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Trophy size={16} style={{ color: accentColor }} />
            <h3 className="font-display font-black text-base uppercase tracking-wider" style={{ color: storeTheme.text }}>
              Inventário
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider"
              style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}30` }}>
              {restProducts.length} itens
            </span>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${accentColor}30, transparent)` }} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {restProducts.map((product: any, i: number) => {
              const productLink = `/imoveis/produto/${product.slug || product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={productLink}
                    className="group block relative overflow-hidden transition-all hover:scale-[1.02]"
                    style={{
                      background: "rgba(0,0,0,0.55)",
                      border: `1px solid ${accentColor}20`,
                      clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                    }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: "#111" }}>
                          <Image size={24} style={{ color: accentColor }} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                      {product.tag && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold text-white/90"
                          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}>
                          {getTagLabel(product.tag)}
                        </span>
                      )}

                      {product.status === "vendido" && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-red-400 font-black text-xs uppercase tracking-widest"
                            style={{ textShadow: "0 0 10px rgba(248,113,113,0.5)" }}>
                            VENDIDO
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3" style={{ background: "rgba(0,0,0,0.65)" }}>
                      <h4 className="font-display font-bold text-xs text-white/90 truncate leading-tight">
                        {product.title}
                      </h4>
                      {product.price > 0 && (
                        <p className="font-display font-black text-sm mt-1" style={{ color: accentColor }}>
                          R$ {product.price.toLocaleString("pt-BR")}
                        </p>
                      )}
                      {product.city && (
                        <p className="text-[10px] mt-1 flex items-center gap-0.5 text-white/40">
                          <MapPin size={9} /> {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
                        </p>
                      )}
                      {(product.bedrooms || product.area) && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {product.bedrooms && <StatPill icon={Bed} value={product.bedrooms} />}
                          {product.bathrooms && <StatPill icon={Bath} value={product.bathrooms} />}
                          {product.area && <StatPill icon={Maximize} value={`${product.area}m²`} />}
                        </div>
                      )}
                    </div>

                    {/* Bottom glow */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)` }} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <Sparkles size={32} className="mx-auto mb-3" style={{ color: accentColor }} />
          <p className="text-sm font-semibold" style={{ color: storeTheme.textMuted }}>
            Nenhum item encontrado no inventário
          </p>
        </div>
      )}
    </div>
  );
}
