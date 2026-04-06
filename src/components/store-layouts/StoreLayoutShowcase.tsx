import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Image, ChevronLeft, ChevronRight, MessageCircle, Eye,
  Sword, Shield, Star, Crown, Sparkles, Flame, Gem, Trophy,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";

/* ─── RPG helpers ─── */
function getRarityFromPrice(price: number) {
  if (price >= 1_000_000) return { label: "LENDÁRIO", color: "#FFD700", glow: "rgba(255,215,0,0.5)", icon: Crown, border: "#FFD700" };
  if (price >= 500_000)  return { label: "ÉPICO", color: "#A855F7", glow: "rgba(168,85,247,0.5)", icon: Gem, border: "#A855F7" };
  if (price >= 200_000)  return { label: "RARO", color: "#3B82F6", glow: "rgba(59,130,246,0.5)", icon: Star, border: "#3B82F6" };
  return { label: "COMUM", color: "#22C55E", glow: "rgba(34,197,94,0.4)", icon: Shield, border: "#22C55E" };
}

function getRarityFromTag(tag: string) {
  if (["luxo", "prime", "alto_padrao"].includes(tag)) return { label: "LENDÁRIO", color: "#FFD700" };
  if (["premium", "exclusivo"].includes(tag)) return { label: "ÉPICO", color: "#A855F7" };
  if (["em_destaque", "top", "lancamento"].includes(tag)) return { label: "RARO", color: "#3B82F6" };
  return null;
}

/* pixel-art-style decorative corner */
function CornerDecor({ color, position }: { color: string; position: string }) {
  const pos = position === "tl" ? "top-0 left-0" : position === "tr" ? "top-0 right-0" : position === "bl" ? "bottom-0 left-0" : "bottom-0 right-0";
  const rotate = position === "tl" ? "" : position === "tr" ? "rotate-90" : position === "bl" ? "-rotate-90" : "rotate-180";
  return (
    <div className={`absolute ${pos} w-6 h-6 ${rotate} pointer-events-none z-10`}>
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M0 0h24v4h-20v20h-4z" fill={color} opacity="0.6" />
      </svg>
    </div>
  );
}

export default function StoreLayoutShowcase({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, handleWhatsApp, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  const [heroIndex, setHeroIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const heroProducts = filteredProducts.slice(0, 8);
  const restProducts = filteredProducts.slice(0);

  useEffect(() => {
    if (heroProducts.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setHeroIndex((p) => (p + 1) % heroProducts.length);
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [heroProducts.length]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setHeroIndex(0);
  };

  const heroProduct = heroProducts[heroIndex];
  const heroRarity = heroProduct ? getRarityFromPrice(heroProduct.price || 0) : null;

  /* Stats mock based on product data */
  const getStats = (p: any) => {
    const stats = [];
    if (p.bedrooms) stats.push({ label: "Quartos", value: p.bedrooms, icon: "🛏️" });
    if (p.bathrooms) stats.push({ label: "Banheiros", value: p.bathrooms, icon: "🚿" });
    if (p.area) stats.push({ label: "Área", value: `${p.area}m²`, icon: "📐" });
    if (p.parking_spots) stats.push({ label: "Vagas", value: p.parking_spots, icon: "🚗" });
    return stats;
  };

  return (
    <div className="font-body">
      {/* ══════ GUILD CATEGORY BAR ══════ */}
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
                  ? `linear-gradient(135deg, ${storeTheme.primary}, ${storeTheme.primary}cc)`
                  : "rgba(0,0,0,0.6)",
                color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                border: `2px solid ${isActive ? storeTheme.primary : "rgba(255,255,255,0.15)"}`,
                clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* ══════ HERO — FEATURED QUEST ══════ */}
      {heroProducts.length > 0 && heroProduct && heroRarity && (
        <div className="relative mb-8">
          {/* Rarity label */}
          <div className="flex items-center gap-2 mb-2">
            <Flame size={14} style={{ color: heroRarity.color }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: heroRarity.color }}>
              {heroRarity.label} • Item em Destaque
            </span>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${heroRarity.color}40, transparent)` }} />
          </div>

          <div
            className="relative overflow-hidden"
            style={{
              border: `2px solid ${heroRarity.border}40`,
              boxShadow: `0 0 30px ${heroRarity.glow}, inset 0 0 30px rgba(0,0,0,0.3)`,
              clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
            }}
          >
            <CornerDecor color={heroRarity.color} position="tl" />
            <CornerDecor color={heroRarity.color} position="br" />

            <AnimatePresence mode="wait">
              <motion.div
                key={heroProduct.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="relative aspect-[3/4] sm:aspect-[16/9]"
              >
                {heroProduct.image ? (
                  <img src={heroProduct.image} alt={heroProduct.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <Image size={64} style={{ color: heroRarity.color }} />
                  </div>
                )}

                {/* Dark vignette */}
                <div className="absolute inset-0" style={{
                  background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
                }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

                {/* Rarity badge top-right */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5"
                  style={{
                    background: `${heroRarity.color}20`,
                    border: `1px solid ${heroRarity.color}60`,
                    backdropFilter: "blur(8px)",
                    clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
                  }}
                >
                  <heroRarity.icon size={12} style={{ color: heroRarity.color }} />
                  <span className="text-[10px] font-black tracking-widest" style={{ color: heroRarity.color }}>
                    {heroRarity.label}
                  </span>
                </div>

                {/* Tag */}
                {heroProduct.tag && (() => {
                  const tagRarity = getRarityFromTag(heroProduct.tag);
                  return (
                    <span
                      className="absolute top-3 left-3 z-20 px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                      style={{
                        background: tagRarity ? `${tagRarity.color}30` : "rgba(0,0,0,0.5)",
                        color: tagRarity ? tagRarity.color : "#fff",
                        border: `1px solid ${tagRarity ? tagRarity.color + "50" : "rgba(255,255,255,0.2)"}`,
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      ⚔ {getTagLabel(heroProduct.tag)}
                    </span>
                  );
                })()}

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 z-10">
                  <h3 className="font-display font-black text-xl sm:text-2xl text-white leading-tight"
                    style={{ textShadow: `0 0 20px ${heroRarity.glow}` }}>
                    {heroProduct.title}
                  </h3>
                  {heroProduct.city && (
                    <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                      <MapPin size={11} /> {heroProduct.neighborhood ? `${heroProduct.neighborhood}, ${heroProduct.city}` : heroProduct.city}
                    </p>
                  )}

                  {/* Stats bar */}
                  {getStats(heroProduct).length > 0 && (
                    <div className="flex gap-3 mt-3">
                      {getStats(heroProduct).map((s, i) => (
                        <div key={i} className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/80 font-semibold"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          <span>{s.icon}</span> {s.value}
                        </div>
                      ))}
                    </div>
                  )}

                  {heroProduct.price > 0 && (
                    <p className="font-display font-black text-2xl sm:text-3xl mt-3"
                      style={{ color: heroRarity.color, textShadow: `0 0 15px ${heroRarity.glow}` }}>
                      R$ {heroProduct.price.toLocaleString("pt-BR")}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-4">
                    <Link
                      to={`/imoveis/produto/${heroProduct.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 font-black text-sm uppercase tracking-wider text-white transition-all hover:brightness-110"
                      style={{
                        background: `linear-gradient(135deg, ${heroRarity.color}cc, ${heroRarity.color}88)`,
                        border: `1px solid ${heroRarity.color}60`,
                        clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
                      }}
                    >
                      <Sword size={14} /> Explorar
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
                      <MessageCircle size={14} />
                    </button>
                  </div>
                </div>

                {/* Navigation arrows */}
                {heroProducts.length > 1 && (
                  <>
                    <button
                      onClick={() => setHeroIndex((p) => (p - 1 + heroProducts.length) % heroProducts.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors z-20"
                      style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${heroRarity.color}30`, clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setHeroIndex((p) => (p + 1) % heroProducts.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors z-20"
                      style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${heroRarity.color}30`, clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* XP-bar style progress */}
            {heroProducts.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 z-20 flex">
                {heroProducts.map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-1 transition-all duration-500"
                    style={{
                      background: idx === heroIndex
                        ? `linear-gradient(90deg, ${heroRarity.color}, ${heroRarity.color}88)`
                        : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════ INVENTORY — ALL ITEMS ══════ */}
      {restProducts.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Trophy size={16} style={{ color: storeTheme.primary }} />
            <h3 className="font-display font-black text-base uppercase tracking-wider" style={{ color: storeTheme.text }}>
              Inventário
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider"
              style={{ background: `${storeTheme.primary}20`, color: storeTheme.primary, border: `1px solid ${storeTheme.primary}30` }}>
              {restProducts.length} itens
            </span>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${storeTheme.primary}30, transparent)` }} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {restProducts.map((product: any, i: number) => {
              const rarity = getRarityFromPrice(product.price || 0);
              const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
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
                      background: "rgba(0,0,0,0.6)",
                      border: `1px solid ${rarity.border}30`,
                      clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                    }}
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: "#111" }}>
                          <Image size={24} style={{ color: rarity.color }} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                      {/* Rarity indicator */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5"
                        style={{
                          background: `${rarity.color}20`,
                          border: `1px solid ${rarity.color}40`,
                          backdropFilter: "blur(4px)",
                        }}>
                        <rarity.icon size={9} style={{ color: rarity.color }} />
                        <span className="text-[8px] font-black tracking-widest" style={{ color: rarity.color }}>
                          {rarity.label}
                        </span>
                      </div>

                      {/* Tag */}
                      {product.tag && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold text-white/90"
                          style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}>
                          {getTagLabel(product.tag)}
                        </span>
                      )}

                      {product.status === "vendido" && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-red-400 font-black text-xs uppercase tracking-widest"
                            style={{ textShadow: "0 0 10px rgba(248,113,113,0.5)" }}>
                            ⚔ VENDIDO
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3" style={{ background: "rgba(0,0,0,0.7)" }}>
                      <h4 className="font-display font-bold text-xs text-white/90 truncate leading-tight">
                        {product.title}
                      </h4>
                      {product.price > 0 && (
                        <p className="font-display font-black text-sm mt-1" style={{ color: rarity.color }}>
                          R$ {product.price.toLocaleString("pt-BR")}
                        </p>
                      )}
                      {product.city && (
                        <p className="text-[10px] mt-1 flex items-center gap-0.5 text-white/40">
                          <MapPin size={9} /> {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
                        </p>
                      )}

                      {/* Mini stats */}
                      {(product.bedrooms || product.area) && (
                        <div className="flex gap-2 mt-2">
                          {product.bedrooms && (
                            <span className="text-[9px] text-white/50 px-1.5 py-0.5"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              🛏️ {product.bedrooms}
                            </span>
                          )}
                          {product.area && (
                            <span className="text-[9px] text-white/50 px-1.5 py-0.5"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              📐 {product.area}m²
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom glow line */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: `linear-gradient(90deg, transparent, ${rarity.color}60, transparent)` }} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <Sparkles size={32} className="mx-auto mb-3" style={{ color: storeTheme.primary }} />
          <p className="text-sm font-semibold" style={{ color: storeTheme.textMuted }}>
            Nenhum item encontrado no inventário
          </p>
        </div>
      )}
    </div>
  );
}
