import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Image, ChevronLeft, ChevronRight, Play, Plus,
  MessageCircle, Bed, Bath, Maximize, Car, Info, ChevronDown,
  Volume2, VolumeX, Share2, Clapperboard, LayoutDashboard, ArrowRight, Home,
  Star, Flame, Sparkles, TrendingUp, Award, Crown, Trophy,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { StoreLayoutProps } from "./types";
import { isIOSStandaloneApp } from "@/lib/pwaInstall";
import { useIsMobile } from "@/hooks/use-mobile";

/* ═══════════════════════════════════════════
   Netflix-style horizontal content row
   ═══════════════════════════════════════════ */
function NetflixRow({ title, subtitle, items, corretorSlug, getTagLabel, getTagStyle, accent, icon: Icon, ranked, badge, gradient }: {
  title: string;
  subtitle?: string;
  items: any[];
  corretorSlug: string | null;
  getTagLabel: (tag: string) => string;
  getTagStyle: (tag: string) => string;
  accent: string;
  icon?: any;
  ranked?: boolean;
  badge?: "novo" | "top" | "exclusivo" | null;
  gradient?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => { checkArrows(); }, [items.length, checkArrows]);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * (scrollRef.current.clientWidth * 0.8), behavior: "smooth" });
    setTimeout(checkArrows, 500);
  };

  if (!items.length) return null;

  return (
    <div className="mb-6 lg:mb-8 group/row relative">
      {title && (
        <div className="px-4 lg:px-12 mb-2 lg:mb-3">
          <h3 className="font-bold text-sm lg:text-lg text-white flex items-center gap-2 hover:text-[#e50914] transition-colors cursor-default">
            {Icon && (
              <span
                className="inline-flex items-center justify-center w-6 h-6 lg:w-7 lg:h-7 rounded"
                style={{ background: gradient || "rgba(229,9,20,0.15)" }}
              >
                <Icon size={14} className="text-white" />
              </span>
            )}
            <span style={gradient ? { backgroundImage: gradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : undefined}>
              {title}
            </span>
            <ChevronRight size={14} className="opacity-0 group-hover/row:opacity-100 transition-opacity text-[#e50914]" />
          </h3>
          {subtitle && (
            <p className="text-[10px] lg:text-xs text-white/40 mt-0.5 ml-8 lg:ml-9">{subtitle}</p>
          )}
        </div>
      )}

      <div className="relative">
        {showLeft && (
          <button onClick={() => scroll(-1)}
            className="absolute left-0 top-0 bottom-0 w-10 md:w-12 z-20 flex items-center justify-center bg-black/60 opacity-0 group-hover/row:opacity-100 transition-opacity rounded-r"
          >
            <ChevronLeft size={28} className="text-white" />
          </button>
        )}
        {showRight && (
          <button onClick={() => scroll(1)}
            className="absolute right-0 top-0 bottom-0 w-10 md:w-12 z-20 flex items-center justify-center bg-black/60 opacity-0 group-hover/row:opacity-100 transition-opacity rounded-l"
          >
            <ChevronRight size={28} className="text-white" />
          </button>
        )}

        <div ref={scrollRef} onScroll={checkArrows}
          className="flex gap-1 lg:gap-1.5 overflow-x-auto overflow-y-visible scrollbar-hide scroll-smooth px-4 lg:px-12 py-8 -my-8">
          {items.map((product: any, i: number) => (
            <NetflixCard
              key={product.id}
              product={product}
              index={i}
              corretorSlug={corretorSlug}
              getTagLabel={getTagLabel}
              getTagStyle={getTagStyle}
              accent={accent}
              rank={ranked ? i + 1 : undefined}
              badge={badge}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Netflix card with hover expansion
   ═══════════════════════════════════════════ */
function NetflixCard({ product, index, corretorSlug, getTagLabel, getTagStyle, accent, rank, badge }: {
  product: any; index: number; corretorSlug: string | null;
  getTagLabel: (tag: string) => string; getTagStyle: (tag: string) => string;
  accent: string; rank?: number; badge?: "novo" | "top" | "exclusivo" | null;
}) {
  const [hovered, setHovered] = useState(false);
  const productLink = `/imoveis/produto/${product.slug || product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;

  // Pseudo-rating from id hash so it stays stable per item
  const rating = (() => {
    const seed = (product.id || "").split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
    return (4 + (seed % 10) / 10).toFixed(1); // 4.0 → 4.9
  })();

  return (
    <div
      className="flex-shrink-0 relative overflow-visible"
      style={{ width: "clamp(180px, 22vw, 300px)", zIndex: hovered ? 30 : 1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={productLink} className="block">
        <motion.div
          animate={hovered ? { scale: 1.15, y: -8 } : { scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative rounded-md overflow-visible"
          style={{ transformOrigin: index === 0 ? "left center" : "center center" }}
        >
          <div
            className="relative aspect-[16/9] rounded-md overflow-hidden"
            style={hovered ? { boxShadow: `0 18px 50px rgba(0,0,0,0.85), 0 0 0 2px ${accent}` } : undefined}
          >
            {product.image ? (
              <img src={product.image} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                <Image size={24} className="text-gray-600" />
              </div>
            )}

            {/* Bottom gradient when hovered for legibility */}
            {hovered && (
              <div className="absolute inset-0" style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
              }} />
            )}

            {/* Top-10 ranking number */}
            {rank && rank <= 10 && (
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-[#e50914]/60">
                <Trophy size={10} className="text-[#e50914]" fill="#e50914" />
                <span className="text-[9px] font-black text-white">#{rank}</span>
              </div>
            )}

            {/* Novo / Top / Exclusivo badge */}
            {badge && !rank && (
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider"
                style={{
                  background: badge === "top" ? "#e50914" : badge === "exclusivo" ? "linear-gradient(135deg,#FFD700,#FFA500)" : "#22c55e",
                  color: badge === "exclusivo" ? "#000" : "#fff",
                }}>
                {badge === "top" ? "🔥 Top" : badge === "exclusivo" ? "👑 Premium" : "✨ Novo"}
              </div>
            )}

            {/* Sold overlay */}
            {product.status === "vendido" && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <span className="text-red-500 font-bold text-[10px] uppercase tracking-widest">Vendido</span>
              </div>
            )}

            {/* Tag (existing system) */}
            {product.tag && !rank && !badge && (
              <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold ${getTagStyle(product.tag)}`}>
                {getTagLabel(product.tag)}
              </span>
            )}

            {/* Rating star top-right */}
            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm">
              <Star size={9} className="text-yellow-400" fill="#facc15" />
              <span className="text-[9px] font-bold text-white">{rating}</span>
            </div>

            {/* Title overlay on hover */}
            {hovered && (
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-white font-bold text-xs line-clamp-1 drop-shadow-lg">{product.title}</p>
                {product.price > 0 && (
                  <p className="font-black text-[11px]" style={{ color: accent }}>
                    R$ {product.price.toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
            )}
          </div>

          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-[#181818] rounded-b-md shadow-2xl overflow-hidden border-t-0"
                style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.8)" }}
              >
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-white/80 transition">
                      <Play size={14} fill="#000" className="text-black ml-0.5" />
                    </span>
                    <span className="w-7 h-7 rounded-full border-2 border-gray-400 flex items-center justify-center hover:border-white transition">
                      <Plus size={14} className="text-white" />
                    </span>
                    <div className="ml-auto flex items-center gap-0.5">
                      <Star size={11} className="text-yellow-400" fill="#facc15" />
                      <span className="text-[10px] font-bold text-yellow-400">{rating}</span>
                    </div>
                  </div>
                  {product.price > 0 && (
                    <p className="font-bold text-sm text-green-400 mb-1">
                      R$ {product.price.toLocaleString("pt-BR")}
                    </p>
                  )}
                  <p className="text-white text-[11px] font-semibold leading-tight line-clamp-2 mb-1.5">
                    {product.title}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {product.bedrooms && (
                      <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                        <Bed size={9} /> {product.bedrooms} qts
                      </span>
                    )}
                    {product.bathrooms && (
                      <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                        <Bath size={9} /> {product.bathrooms}
                      </span>
                    )}
                    {product.area && (
                      <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                        <Maximize size={9} /> {product.area}m²
                      </span>
                    )}
                    {product.parking_spots && (
                      <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                        <Car size={9} /> {product.parking_spots}
                      </span>
                    )}
                  </div>
                  {product.city && (
                    <p className="text-[9px] text-gray-500 mt-1 flex items-center gap-0.5">
                      <MapPin size={8} /> {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Netflix Layout
   ═══════════════════════════════════════════ */
export default function StoreLayoutNetflix({
  filteredProducts, products, subcategories, activeCategory, setActiveCategory,
  categoryCounts, categoryCardImages, storeTheme, corretorSlug,
  isDbProfile, dbProfile, handleWhatsApp, getTagStyle, getTagLabel,
  onCinemaMode, onShareLink, filterCity, setFilterCity, availableCities, storiesBar,
}: StoreLayoutProps) {
  const { user } = useAuth();
  const [billboardIdx, setBillboardIdx] = useState(0);
  const accent = "#e50914";
  const isIOSStandalone = isIOSStandaloneApp();
  const isMobile = useIsMobile();

  const allProducts = products || filteredProducts;
  const billboard = allProducts.filter((p: any) => p.image).slice(0, 6);
  const currentBillboard = billboard[billboardIdx];

  // Auto-rotate billboard
  useEffect(() => {
    if (billboard.length <= 1 || isMobile) return;
    const t = setInterval(() => setBillboardIdx(p => (p + 1) % billboard.length), 7000);
    return () => clearInterval(t);
  }, [billboard.length, isMobile]);

  // Progress bar for current billboard
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (isMobile) {
      setProgress(0);
      return;
    }
    setProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / 7000) * 100, 100));
    }, 50);
    return () => clearInterval(interval);
  }, [billboardIdx, isMobile]);

  // Build category rows
  const categoryMap: Record<string, string[]> = {
    casas: ["casa"], apartamentos: ["apartamento"], terrenos: ["terreno"],
    comerciais: ["comercial"], alugueis: ["aluguel"], aluguel: ["aluguel"],
    flats: ["flat"], galpoes: ["galpao"],
  };
  const rows = subcategories
    .filter(c => c.slug !== "todos" && (categoryCounts[c.slug] || 0) > 0)
    .map(c => ({
      name: c.name,
      items: filteredProducts.filter((p: any) => (categoryMap[c.slug] || []).includes(p.category)),
    }))
    .filter(r => r.items.length > 0);

  return (
    <div className={isIOSStandalone ? "overflow-x-hidden max-w-full" : "overflow-x-hidden max-w-full"} style={{ background: storeTheme.bg, overflowX: "clip", maxWidth: "100%" }}>
      {/* ══════ BILLBOARD ══════ */}
      {billboard.length > 0 && currentBillboard && (
        <div className="relative w-full" style={{ aspectRatio: "16/7", minHeight: 320 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBillboard.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <img src={currentBillboard.image} alt={currentBillboard.title} className="w-full h-full object-cover" />
              {/* Netflix-style gradients */}
              <div className="absolute inset-0" style={{
                background: "linear-gradient(to right, #141414 0%, rgba(20,20,20,0.85) 25%, rgba(20,20,20,0.4) 50%, transparent 70%)",
              }} />
              <div className="absolute inset-0" style={{
                background: "linear-gradient(to top, #141414 0%, rgba(20,20,20,0.6) 30%, transparent 60%)",
              }} />
            </motion.div>
          </AnimatePresence>

          {/* Top bar buttons */}
          <div className="absolute top-4 left-4 lg:top-6 lg:left-12 z-20 flex items-center gap-2">
            <Link
              to={user && dbProfile && user.id === dbProfile.user_id ? "/painel" : "/login"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-white/80 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
            >
              <LayoutDashboard size={14} /> {user && dbProfile && user.id === dbProfile.user_id ? "Painel" : "Entrar"}
            </Link>
          </div>
          {/* Cinema/Share buttons moved to category section */}

          {/* Billboard content — Netflix style */}
          <div className="absolute bottom-[8%] lg:bottom-[15%] left-4 lg:left-12 z-10 max-w-lg">
            {/* Netflix badge + meta line */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 mb-2 lg:mb-3 flex-wrap"
            >
              <span className="font-black text-xl lg:text-3xl leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif", color: storeTheme.primary }}>I</span>
              <span className="text-[8px] lg:text-xs text-gray-300 uppercase tracking-[0.25em] font-semibold border-l border-gray-500 pl-2">
                Imóvel em Destaque
              </span>
              {/* TOP 1 badge */}
              {billboardIdx === 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#e50914] text-white text-[8px] lg:text-[10px] font-black uppercase tracking-wider">
                  <Trophy size={10} fill="#fff" /> #1 da Lista
                </span>
              )}
              {/* Premium tag highlight */}
              {currentBillboard.tag && ["premium", "luxo", "alto-padrao", "exclusivo"].includes(currentBillboard.tag) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] lg:text-[10px] font-black uppercase tracking-wider"
                  style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#000" }}>
                  <Crown size={10} /> {currentBillboard.tag}
                </span>
              )}
            </motion.div>

            {/* Rating + Year + specs meta row (Netflix-style) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="hidden lg:flex items-center gap-3 mb-2 text-xs"
            >
              <span className="flex items-center gap-1 text-yellow-400 font-bold">
                <Star size={12} fill="#facc15" /> {(4 + ((currentBillboard.id || "").length % 10) / 10).toFixed(1)}
              </span>
              <span className="text-green-400 font-bold">98% Match</span>
              <span className="text-white/50">2024</span>
              <span className="px-1.5 py-0.5 border border-white/30 text-white/70 text-[10px] font-semibold">HD</span>
              {currentBillboard.area && (
                <span className="text-white/50">{currentBillboard.area}m²</span>
              )}
            </motion.div>

            {/* Title — big and bold */}
            <motion.h2
              key={`title-${currentBillboard.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="font-black text-lg lg:text-4xl xl:text-5xl text-white leading-[1.05] drop-shadow-2xl mb-1 lg:mb-2"
            >
              {currentBillboard.title}
            </motion.h2>

            {/* Location */}
            {currentBillboard.city && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/50 text-[10px] lg:text-sm flex items-center gap-1 mb-1 lg:mb-2"
              >
                <MapPin size={10} />
                {currentBillboard.neighborhood
                  ? `${currentBillboard.neighborhood}, ${currentBillboard.city}`
                  : currentBillboard.city}
              </motion.p>
            )}

            {/* Price */}
            {currentBillboard.price > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="font-black text-base lg:text-2xl mb-1 lg:mb-2"
                style={{ color: storeTheme.primary }}
              >
                R$ {currentBillboard.price.toLocaleString("pt-BR")}
              </motion.p>
            )}

            {/* Description — Netflix synopsis style */}
            <motion.p
              key={`desc-${currentBillboard.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-gray-300 text-[10px] lg:text-sm leading-relaxed line-clamp-2 lg:line-clamp-3 max-w-md mb-2 lg:mb-4"
            >
              {currentBillboard.description || buildAutoDescription(currentBillboard)}
            </motion.p>

            {/* Property specs pills — hidden below lg to save space */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="hidden lg:flex items-center gap-2 flex-wrap mb-4"
            >
              {currentBillboard.bedrooms && (
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-white/80 text-[10px] lg:text-xs font-medium">
                  <Bed size={12} /> {currentBillboard.bedrooms} quartos
                </span>
              )}
              {currentBillboard.bathrooms && (
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-white/80 text-[10px] lg:text-xs font-medium">
                  <Bath size={12} /> {currentBillboard.bathrooms} banheiros
                </span>
              )}
              {currentBillboard.area && (
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-white/80 text-[10px] lg:text-xs font-medium">
                  <Maximize size={12} /> {currentBillboard.area}m²
                </span>
              )}
              {currentBillboard.parking_spots && (
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-white/80 text-[10px] lg:text-xs font-medium">
                  <Car size={12} /> {currentBillboard.parking_spots} vagas
                </span>
              )}
            </motion.div>

            {/* Action buttons — Netflix CTA style */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-2 lg:gap-3"
            >
              <Link
                to={`/imoveis/produto/${currentBillboard.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`}
                className="inline-flex items-center gap-1.5 px-4 lg:px-8 py-2 lg:py-3 rounded-md font-bold text-xs lg:text-base bg-white text-black hover:bg-white/90 transition-all shadow-lg"
              >
                <Info size={14} /> Saiba Mais
              </Link>
              <button
                onClick={() => handleWhatsApp(currentBillboard.title, currentBillboard.id)}
                className="inline-flex items-center gap-1.5 px-4 lg:px-8 py-2 lg:py-3 rounded-md font-bold text-xs lg:text-base text-white transition-all"
                style={{ background: "rgba(109,109,110,0.7)" }}
              >
                <MessageCircle size={14} /> WhatsApp
              </button>
            </motion.div>
          </div>

          {/* Episode indicators */}
          {billboard.length > 1 && (
            <div className="absolute right-4 lg:right-12 bottom-[15%] z-10 flex flex-col gap-1">
              {billboard.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setBillboardIdx(idx)}
                  className="w-1 transition-all rounded-full"
                  style={{
                    height: idx === billboardIdx ? 24 : 8,
                    background: idx === billboardIdx ? "#e50914" : "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Progress bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5 z-20">
            <div
              className="h-full transition-all duration-100 ease-linear"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(to right, #e50914, #ff4d4d)",
              }}
            />
          </div>

          {/* Maturity rating badge */}
          <div className="absolute right-4 lg:right-12 bottom-[5%] z-10 flex items-center gap-2">
            <span className="px-2.5 py-1 border-l-2 border-white/40 text-white/60 text-[10px] font-semibold bg-black/30 backdrop-blur-sm">
              {filteredProducts.length} imóveis
            </span>
          </div>
        </div>
      )}

      {/* Fallback top bar when there's no billboard (no items yet) */}
      {!(billboard.length > 0 && currentBillboard) && (
        <div className="relative w-full px-4 lg:px-12 pt-4 z-20">
          <Link
            to={user && dbProfile && user.id === dbProfile.user_id ? "/painel" : "/login"}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-white/80 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
          >
            <LayoutDashboard size={14} /> {user && dbProfile && user.id === dbProfile.user_id ? "Painel" : "Entrar"}
          </Link>
        </div>
      )}

      {/* Stories Bar */}
      {storiesBar && <div className="px-4 lg:px-12 pt-4">{storiesBar}</div>}

      {/* ══════ NETFLIX CATEGORY CARDS + CONTENT ══════ */}
      <div className="pb-8 pt-6">
        {/* Category cards — movie poster style */}
        <div className="flex items-center justify-between px-4 lg:px-12 mb-3">
          <h3 className="font-bold text-sm lg:text-base text-white">Explorar por Categoria</h3>
          <div className="flex items-center gap-2">
            {onCinemaMode && (
              <button
                onClick={onCinemaMode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-white/80 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
              >
                <Clapperboard size={14} /> Modo Cinema
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 lg:gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-4 lg:px-12 pb-6">
          {/* "Todos" card */}
          {(() => {
            const allImages = filteredProducts.filter((p: any) => p.image).slice(0, 4);
            const isActive = activeCategory === "todos";
            return (
              <button
                onClick={() => setActiveCategory("todos")}
                className="flex-shrink-0 relative overflow-hidden rounded-md transition-all duration-300 group/cat"
                style={{
                  width: "clamp(120px, 18vw, 180px)",
                  aspectRatio: "2/3",
                   outline: isActive ? "2px solid #fff" : "2px solid transparent",
                   outlineOffset: 2,
                }}
              >
                {allImages[0] ? (
                  <img src={allImages[0].image} alt="Todos" className="w-full h-full object-cover transition-transform duration-500 group-hover/cat:scale-110" />
                ) : (
                  <div className="w-full h-full bg-[#2a2a2a]" />
                )}
                <div className="absolute inset-0" style={{
                   background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)",
                }} />
                <div className="absolute bottom-0 left-0 right-0 p-2.5 text-center">
                  <span className="text-white font-bold text-xs md:text-sm drop-shadow-lg block">Todos</span>
                  <span className="text-white/60 text-[9px] md:text-[10px]">{categoryCounts.todos ?? products.length} imóveis</span>
                </div>
                {isActive && (
                   <div className="absolute top-0 left-0 right-0 h-[3px] bg-white" />
                )}
              </button>
            );
          })()}

          {subcategories
            .filter(c => c.slug !== "todos" && (categoryCounts[c.slug] || 0) > 0)
            .map(c => {
              const catItems = filteredProducts.filter((p: any) => (categoryMap[c.slug] || []).includes(p.category));
              const coverImg = categoryCardImages?.[c.slug] || catItems.find((p: any) => p.image)?.image;
              const isActive = activeCategory === c.slug;
              const count = categoryCounts[c.slug] || 0;

              return (
                <button
                  key={c.slug}
                  onClick={() => setActiveCategory(c.slug)}
                  className="flex-shrink-0 relative overflow-hidden rounded-md transition-all duration-300 group/cat"
                  style={{
                    width: "clamp(120px, 18vw, 180px)",
                    aspectRatio: "2/3",
                     outline: isActive ? "2px solid #fff" : "2px solid transparent",
                     outlineOffset: 2,
                  }}
                >
                  {coverImg ? (
                    <img src={coverImg} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/cat:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-[#2a2a2a]" />
                  )}
                  <div className="absolute inset-0" style={{
                     background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)",
                  }} />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 text-center">
                    <span className="text-white font-bold text-xs md:text-sm drop-shadow-lg block">{c.name}</span>
                    <span className="text-white/60 text-[9px] md:text-[10px]">{count} imóveis</span>
                  </div>
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-white" />
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* ══════ CURATED NETFLIX ROWS (desktop only) ══════ */}
      <div className="hidden lg:block pb-12">
        {(() => {
          // TOP 10 — first 10 with image
          const top10 = filteredProducts.filter((p: any) => p.image && p.status !== "vendido").slice(0, 10);
          // EM ALTA — items sorted by views_count desc
          const trending = [...filteredProducts]
            .filter((p: any) => p.image && p.status !== "vendido")
            .sort((a: any, b: any) => (b.views_count || 0) - (a.views_count || 0))
            .slice(0, 12);
          // RECÉM-CHEGADOS — sorted by created_at desc
          const newest = [...filteredProducts]
            .filter((p: any) => p.image && p.status !== "vendido")
            .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 12);
          // PREMIUM — items with premium-ish tag or top price
          const premiumTags = ["premium", "luxo", "alto-padrao", "exclusivo", "epico"];
          let premium = filteredProducts.filter((p: any) => p.image && premiumTags.includes(p.tag));
          if (premium.length < 6) {
            const byPrice = [...filteredProducts]
              .filter((p: any) => p.image && p.price > 0 && !premium.find((x: any) => x.id === p.id))
              .sort((a: any, b: any) => (b.price || 0) - (a.price || 0))
              .slice(0, 12 - premium.length);
            premium = [...premium, ...byPrice];
          }
          // PARA VOCÊ — shuffle stable based on id length
          const forYou = [...filteredProducts]
            .filter((p: any) => p.image && p.status !== "vendido")
            .sort((a: any, b: any) => ((a.id || "").length % 7) - ((b.id || "").length % 7))
            .slice(0, 12);

          return (
            <>
              {top10.length >= 3 && (
                <NetflixRow
                  title="🔥 Top 10 imóveis na sua região"
                  subtitle="Os anúncios mais procurados agora"
                  items={top10}
                  corretorSlug={corretorSlug}
                  getTagLabel={getTagLabel}
                  getTagStyle={getTagStyle}
                  accent={accent}
                  icon={Trophy}
                  ranked
                  gradient="linear-gradient(135deg, #e50914, #ff6b6b)"
                />
              )}
              {trending.length >= 3 && (
                <NetflixRow
                  title="Em Alta esta semana"
                  subtitle="O que todo mundo está olhando"
                  items={trending}
                  corretorSlug={corretorSlug}
                  getTagLabel={getTagLabel}
                  getTagStyle={getTagStyle}
                  accent={accent}
                  icon={Flame}
                  badge="top"
                />
              )}
              {newest.length >= 3 && (
                <NetflixRow
                  title="Recém-chegados"
                  subtitle="Acabaram de entrar no catálogo"
                  items={newest}
                  corretorSlug={corretorSlug}
                  getTagLabel={getTagLabel}
                  getTagStyle={getTagStyle}
                  accent={accent}
                  icon={Sparkles}
                  badge="novo"
                />
              )}
              {premium.length >= 3 && (
                <NetflixRow
                  title="Coleção Premium"
                  subtitle="Imóveis exclusivos para clientes exigentes"
                  items={premium}
                  corretorSlug={corretorSlug}
                  getTagLabel={getTagLabel}
                  getTagStyle={getTagStyle}
                  accent={accent}
                  icon={Crown}
                  badge="exclusivo"
                  gradient="linear-gradient(135deg, #FFD700, #FFA500)"
                />
              )}
              {forYou.length >= 3 && (
                <NetflixRow
                  title="Selecionados para você"
                  subtitle="Curadoria personalizada"
                  items={forYou}
                  corretorSlug={corretorSlug}
                  getTagLabel={getTagLabel}
                  getTagStyle={getTagStyle}
                  accent={accent}
                  icon={Award}
                />
              )}
              {/* Per-category rows (existing) */}
              {rows.map(row => (
                <NetflixRow
                  key={row.name}
                  title={row.name}
                  items={row.items}
                  corretorSlug={corretorSlug}
                  getTagLabel={getTagLabel}
                  getTagStyle={getTagStyle}
                  accent={accent}
                  icon={Home}
                />
              ))}
            </>
          );
        })()}
      </div>

      {filteredProducts.length > 0 && (
        <section id="products-grid" className="lg:hidden px-4 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base" style={{ color: storeTheme.text }}>
              {activeCategory === "todos"
                ? "Todos os Anúncios"
                : subcategories.find((c) => c.slug === activeCategory)?.name || "Anúncios"}
              <span className="font-medium ml-2" style={{ color: storeTheme.textMuted }}>({filteredProducts.length})</span>
            </h3>
            {availableCities && availableCities.length > 1 && setFilterCity && (
              <div className="relative">
                <select
                  value={filterCity || ""}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="appearance-none px-3 py-1.5 pr-7 rounded-md text-[11px] font-medium text-white/90 cursor-pointer border border-white/15 outline-none"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <option value="" style={{ background: "#141414", color: "#fff" }}>Todas as cidades</option>
                  {availableCities.map(city => (
                    <option key={city} value={city} style={{ background: "#141414", color: "#fff" }}>{city}</option>
                  ))}
                </select>
                <MapPin size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product: any, index: number) => {
              const productLink = `/imoveis/produto/${product.slug || product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.35 }}
                >
                  <Link
                    to={productLink}
                    className="block overflow-hidden rounded-lg"
                    style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.card }}>
                          <Image size={24} style={{ color: storeTheme.textMuted }} />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                      {product.tag && (
                        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold ${getTagStyle(product.tag)}`}>
                          {getTagLabel(product.tag)}
                        </span>
                      )}

                      {product.status === "vendido" && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <span className="text-red-400 font-bold text-[10px] uppercase tracking-[0.2em]">Vendido</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      {product.price > 0 && (
                        <p className="text-sm font-bold mb-1" style={{ color: storeTheme.primary }}>
                          R$ {product.price.toLocaleString("pt-BR")}
                        </p>
                      )}

                      <h4 className="text-[11px] font-semibold leading-tight line-clamp-2 mb-1.5" style={{ color: storeTheme.text }}>
                        {product.title}
                      </h4>

                      {product.city && (
                        <p className="text-[10px] flex items-center gap-1 line-clamp-1" style={{ color: storeTheme.textMuted }}>
                          <MapPin size={10} />
                          {product.neighborhood
                            ? `${product.neighborhood}, ${product.city}`
                            : product.city}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-20 px-4">
          <Image size={48} className="mx-auto mb-3" style={{ color: storeTheme.textMuted }} />
          <p className="text-lg font-medium" style={{ color: storeTheme.textMuted }}>Nenhum imóvel encontrado</p>
          <button onClick={() => setActiveCategory("todos")} className="text-sm mt-2 hover:underline" style={{ color: storeTheme.primary }}>Ver todos</button>
        </div>
      )}

    </div>
  );
}

/** Auto-generate a description if none exists */
function buildAutoDescription(product: any): string {
  const parts: string[] = [];
  if (product.category) {
    const catNames: Record<string, string> = {
      casa: "Casa", apartamento: "Apartamento", terreno: "Terreno",
      comercial: "Imóvel comercial", aluguel: "Imóvel para aluguel",
    };
    parts.push(catNames[product.category] || "Imóvel");
  }
  if (product.neighborhood && product.city) {
    parts.push(`localizado em ${product.neighborhood}, ${product.city}`);
  } else if (product.city) {
    parts.push(`em ${product.city}`);
  }
  if (product.area) parts.push(`com ${product.area}m²`);
  if (product.bedrooms) parts.push(`${product.bedrooms} quartos`);
  if (product.bathrooms) parts.push(`e ${product.bathrooms} banheiros`);
  return parts.join(" ") + ".";
}
