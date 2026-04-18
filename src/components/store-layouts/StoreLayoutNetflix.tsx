import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Image, ChevronLeft, ChevronRight, Play, Plus,
  MessageCircle, Bed, Bath, Maximize, Car, Info, ChevronDown,
  Volume2, VolumeX, Share2, Clapperboard, LayoutDashboard, ArrowRight, Home,
  Star, Flame, Sparkles, TrendingUp, Award, Crown, Trophy,
  Search, Ruler, ShieldCheck, Filter, X, BadgeCheck, Instagram, Phone, Building2,
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
  categoryCounts, categoryCardImages, storeTheme, corretorSlug, sellerDisplayName,
  isDbProfile, dbProfile, handleWhatsApp, getTagStyle, getTagLabel,
  onCinemaMode, onShareLink, filterCity, setFilterCity, availableCities, storiesBar,
}: StoreLayoutProps) {
  const { user } = useAuth();
  const [billboardIdx, setBillboardIdx] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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
              <motion.img
                src={currentBillboard.image}
                alt={currentBillboard.title}
                className="w-full h-full object-cover"
                initial={{ scale: 1.15 }}
                animate={{ scale: 1.05 }}
                transition={{ duration: 8, ease: "easeOut" }}
              />
              {/* Netflix-style gradients */}
              <div className="absolute inset-0" style={{
                background: "linear-gradient(to right, #141414 0%, rgba(20,20,20,0.85) 25%, rgba(20,20,20,0.4) 50%, transparent 70%)",
              }} />
              <div className="absolute inset-0" style={{
                background: "linear-gradient(to top, #141414 0%, rgba(20,20,20,0.6) 30%, transparent 60%)",
              }} />
              {/* Cinematic vignette */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)`,
              }} />
              {/* Color tint glow */}
              <motion.div
                className="absolute inset-0 pointer-events-none mix-blend-overlay"
                style={{ background: `radial-gradient(circle at 30% 50%, ${storeTheme.primary}40, transparent 60%)` }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Floating particles */}
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={`p-${currentBillboard.id}-${i}`}
                  className="absolute w-1 h-1 rounded-full pointer-events-none"
                  style={{
                    background: storeTheme.primary,
                    left: `${10 + (i * 9)}%`,
                    top: `${20 + (i % 4) * 18}%`,
                    boxShadow: `0 0 10px ${storeTheme.primary}`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{ duration: 4 + (i % 3), repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                />
              ))}
              {/* Scan line */}
              <motion.div
                className="absolute left-0 right-0 h-[2px] pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent, ${storeTheme.primary}80, transparent)`, boxShadow: `0 0 20px ${storeTheme.primary}` }}
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
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
              className="flex items-center gap-2 lg:gap-3 mb-2 text-[10px] lg:text-xs flex-wrap"
            >
              <span className="flex items-center gap-1 text-yellow-400 font-bold">
                <Star size={10} className="lg:w-3 lg:h-3" fill="#facc15" /> {(4 + ((currentBillboard.id || "").length % 10) / 10).toFixed(1)}
              </span>
              <span className="text-green-400 font-bold">98% Match</span>
              <span className="text-white/50">2024</span>
              <span className="px-1.5 py-0.5 border border-white/30 text-white/70 text-[9px] lg:text-[10px] font-semibold">HD</span>
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


      {/* ══════ MARKETPLACE-STYLE GRID + SIDEBAR FILTERS ══════ */}
      {(() => {
        const visibleProducts = searchTerm
          ? filteredProducts.filter((p: any) =>
              p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : filteredProducts;

        const activeCats = subcategories.filter(c => c.slug === "todos" || (categoryCounts[c.slug] || 0) > 0);

        return (
          <section id="netflix-grid" className="px-4 lg:px-12 py-8 scroll-mt-20" style={{ background: storeTheme.bg }}>
            {/* Search bar */}
            <div className="mb-6 max-w-3xl">
              <div
                className="flex items-center gap-2 rounded-2xl px-4 py-3 backdrop-blur-xl"
                style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
              >
                <Search size={18} style={{ color: storeTheme.textMuted }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por título, bairro ou cidade..."
                  className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:opacity-50"
                  style={{ color: storeTheme.text }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="p-1 rounded-full hover:opacity-70" style={{ color: storeTheme.textMuted }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile filter toggle */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}`, color: storeTheme.text }}
              >
                <Filter size={14} /> Filtros
                {(filterCity || activeCategory !== "todos") && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ background: storeTheme.primary, color: "#fff" }}>
                    {[filterCity, activeCategory !== "todos" ? activeCategory : null].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex gap-6">
              {/* ─── SIDEBAR FILTERS (desktop) + drawer (mobile) ─── */}
              <aside
                className={`${showMobileFilters ? "fixed inset-0 z-50 p-4 overflow-y-auto" : "hidden"} lg:block lg:relative lg:inset-auto lg:p-0 lg:w-[260px] lg:flex-shrink-0`}
                style={showMobileFilters ? { background: storeTheme.bg } : undefined}
              >
                {showMobileFilters && (
                  <div className="flex items-center justify-between mb-4 lg:hidden">
                    <h4 className="text-base font-bold" style={{ color: storeTheme.text }}>Filtros</h4>
                    <button onClick={() => setShowMobileFilters(false)} style={{ color: storeTheme.text }}>
                      <X size={20} />
                    </button>
                  </div>
                )}

                <div className="lg:sticky lg:top-4 space-y-5">
                  {/* ─── Verified Professional Card ─── */}
                  {dbProfile && (
                    <div
                      className="rounded-2xl overflow-hidden"
                      style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
                    >
                      <div
                        className="px-4 py-3 flex items-center gap-2"
                        style={{ background: `linear-gradient(135deg, ${storeTheme.primary}, ${storeTheme.primary}cc)` }}
                      >
                        <BadgeCheck size={16} className="text-white" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-white">
                          Profissional Verificado
                        </span>
                      </div>

                      <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                          {dbProfile.logo_url ? (
                            <img
                              src={dbProfile.logo_url}
                              alt={dbProfile.full_name || dbProfile.company_name}
                              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                              style={{ border: `2px solid ${storeTheme.primary}` }}
                            />
                          ) : (
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: `${storeTheme.primary}22`, border: `2px solid ${storeTheme.primary}` }}
                            >
                              <Building2 size={20} style={{ color: storeTheme.primary }} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate" style={{ color: storeTheme.text }}>
                              {dbProfile.full_name || dbProfile.company_name}
                            </p>
                            <p className="text-[10px]" style={{ color: storeTheme.textMuted }}>
                              {dbProfile.seller_category === "imobiliaria"
                                ? "Imobiliária"
                                : dbProfile.seller_category === "construtora"
                                ? "Construtora"
                                : "Corretor(a) de Imóveis"}
                            </p>
                          </div>
                        </div>

                        {dbProfile.bio && (
                          <p className="text-[11px] leading-relaxed line-clamp-3" style={{ color: storeTheme.textMuted }}>
                            {dbProfile.bio}
                          </p>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center py-2 rounded-lg" style={{ background: `${storeTheme.primary}10` }}>
                            <p className="text-base font-black" style={{ color: storeTheme.primary }}>{allProducts.length}</p>
                            <p className="text-[8px] uppercase tracking-wider" style={{ color: storeTheme.textMuted }}>Imóveis</p>
                          </div>
                          <div className="text-center py-2 rounded-lg" style={{ background: `${storeTheme.primary}10` }}>
                            <p className="text-base font-black" style={{ color: storeTheme.primary }}>✓</p>
                            <p className="text-[8px] uppercase tracking-wider" style={{ color: storeTheme.textMuted }}>Verificado</p>
                          </div>
                          {availableCities && availableCities.length > 0 && (
                            <div className="text-center py-2 rounded-lg" style={{ background: `${storeTheme.primary}10` }}>
                              <p className="text-base font-black" style={{ color: storeTheme.primary }}>{availableCities.length}</p>
                              <p className="text-[8px] uppercase tracking-wider" style={{ color: storeTheme.textMuted }}>
                                {availableCities.length === 1 ? "Cidade" : "Cidades"}
                              </p>
                            </div>
                          )}
                        </div>

                        {dbProfile.creci && (
                          <div
                            className="flex items-center justify-center gap-1.5 py-2 rounded-lg"
                            style={{ background: `${storeTheme.primary}15`, border: `1px solid ${storeTheme.primary}30` }}
                          >
                            <ShieldCheck size={12} style={{ color: storeTheme.primary }} />
                            <span className="text-[10px] font-bold tracking-wider" style={{ color: storeTheme.primary }}>
                              CRECI {dbProfile.creci}
                            </span>
                          </div>
                        )}

                        <div className="space-y-2">
                          <button
                            onClick={() => handleWhatsApp(`Olá ${dbProfile.full_name || dbProfile.company_name}!`)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
                            style={{ background: storeTheme.primary, color: "#fff" }}
                          >
                            <MessageCircle size={13} /> WhatsApp Direto
                          </button>
                          {dbProfile.instagram && (
                            <a
                              href={`https://instagram.com/${String(dbProfile.instagram).replace("@", "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
                              style={{ background: `${storeTheme.primary}15`, color: storeTheme.primary, border: `1px solid ${storeTheme.primary}40` }}
                            >
                              <Instagram size={13} /> Instagram
                            </a>
                          )}
                        </div>

                        <div className="pt-2 space-y-1.5" style={{ borderTop: `1px solid ${storeTheme.border}` }}>
                          <p className="text-[10px] font-black uppercase tracking-widest pt-2" style={{ color: storeTheme.primary }}>
                            Por que escolher
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: storeTheme.textMuted }}>
                            <span style={{ color: storeTheme.primary }}>✓</span> Resposta rápida via WhatsApp
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: storeTheme.textMuted }}>
                            <span style={{ color: storeTheme.primary }}>✓</span> Vendedor premium verificado
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: storeTheme.textMuted }}>
                            <span style={{ color: storeTheme.primary }}>✓</span> {allProducts.length} imóveis disponíveis
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* City filter */}
                  {availableCities && availableCities.length > 1 && setFilterCity && (
                    <div className="rounded-2xl p-4" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
                      <h5 className="text-[11px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: storeTheme.primary }}>
                        <MapPin size={12} /> Cidade
                      </h5>
                      <div className="space-y-1 max-h-[240px] overflow-y-auto">
                        <button
                          onClick={() => setFilterCity("")}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: !filterCity ? `${storeTheme.primary}22` : "transparent",
                            color: !filterCity ? storeTheme.primary : storeTheme.text,
                          }}
                        >
                          Todas as cidades
                        </button>
                        {availableCities.map((city) => (
                          <button
                            key={city}
                            onClick={() => setFilterCity(city)}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                            style={{
                              background: filterCity === city ? `${storeTheme.primary}22` : "transparent",
                              color: filterCity === city ? storeTheme.primary : storeTheme.text,
                            }}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category filter */}
                  {activeCats.length > 1 && (
                    <div className="rounded-2xl p-4" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
                      <h5 className="text-[11px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: storeTheme.primary }}>
                        <Home size={12} /> Categoria
                      </h5>
                      <div className="space-y-1">
                        {activeCats.map((cat) => {
                          const count = categoryCounts[cat.slug] || 0;
                          const isActive = activeCategory === cat.slug;
                          return (
                            <button
                              key={cat.slug}
                              onClick={() => setActiveCategory(cat.slug)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                              style={{
                                background: isActive ? `${storeTheme.primary}22` : "transparent",
                                color: isActive ? storeTheme.primary : storeTheme.text,
                              }}
                            >
                              <span>{cat.name}</span>
                              <span className="text-[10px] opacity-60">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reset */}
                  {(filterCity || activeCategory !== "todos" || searchTerm) && (
                    <button
                      onClick={() => { setFilterCity?.(""); setActiveCategory("todos"); setSearchTerm(""); }}
                      className="w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-80"
                      style={{ background: storeTheme.primary, color: "#fff" }}
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </aside>

              {/* ─── PRODUCT GRID ─── */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base lg:text-lg" style={{ color: storeTheme.text }}>
                    {activeCategory === "todos"
                      ? "Todos os Imóveis"
                      : subcategories.find((c) => c.slug === activeCategory)?.name || "Imóveis"}
                    <span className="font-medium ml-2 text-sm" style={{ color: storeTheme.textMuted }}>({visibleProducts.length})</span>
                  </h3>
                </div>

                {visibleProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {visibleProducts.map((product: any, i: number) => {
                      const productLink = `/imoveis/produto/${product.slug || product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.4 }}
                          whileHover={{ y: -6, transition: { duration: 0.25 } }}
                        >
                          <Link
                            to={productLink}
                            className="block rounded-2xl overflow-hidden group transition-all"
                            style={{
                              background: storeTheme.card,
                              border: `1px solid ${storeTheme.border}`,
                              boxShadow: `0 2px 8px rgba(0,0,0,0.2)`,
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${storeTheme.primary}30, 0 4px 12px rgba(0,0,0,0.3)`;
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px rgba(0,0,0,0.2)`;
                            }}
                          >
                            <div className="relative aspect-[4/3] overflow-hidden">
                              {product.image ? (
                                <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.border }}>
                                  <Image size={28} style={{ color: storeTheme.textMuted }} />
                                </div>
                              )}
                              <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `linear-gradient(to top, ${storeTheme.primary}40, transparent 60%)` }}
                              />
                              {product.tag && (
                                <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[9px] font-bold shadow-lg backdrop-blur-sm ${getTagStyle(product.tag)}`}>
                                  {getTagLabel(product.tag)}
                                </span>
                              )}
                              {product.isAluguel && (
                                <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[9px] font-bold shadow-lg backdrop-blur-sm" style={{ background: `${storeTheme.primary}dd`, color: "#fff" }}>
                                  🏠 Aluguel
                                </span>
                              )}
                              {product.status === "vendido" && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                  <span className="text-red-400 font-bold text-xs uppercase tracking-[0.2em]">Vendido</span>
                                </div>
                              )}
                            </div>
                            <div className="p-3 md:p-3.5">
                              <h3 className="text-[11px] md:text-xs font-bold line-clamp-2 leading-snug mb-1.5" style={{ color: storeTheme.text }}>
                                {product.title}
                              </h3>
                              {product.price > 0 && (
                                <p className="text-sm md:text-lg font-black" style={{ color: storeTheme.primary }}>
                                  R$ {product.price.toLocaleString("pt-BR")}
                                  {product.isAluguel && <span className="text-[10px] font-normal ml-1" style={{ color: storeTheme.textMuted }}>/mês</span>}
                                </p>
                              )}
                              {product.accepts_financing && (
                                <p className="text-[9px] mt-1 font-semibold flex items-center gap-1" style={{ color: storeTheme.primary }}>
                                  <ShieldCheck size={10} /> Aceita financiamento
                                </p>
                              )}
                              <div className="flex items-center gap-2.5 mt-2.5 text-[10px]" style={{ color: storeTheme.textMuted }}>
                                {product.bedrooms > 0 && <span className="flex items-center gap-0.5"><Bed size={10} /> {product.bedrooms}</span>}
                                {product.bathrooms > 0 && <span className="flex items-center gap-0.5"><Bath size={10} /> {product.bathrooms}</span>}
                                {product.area > 0 && <span className="flex items-center gap-0.5"><Ruler size={10} /> {product.area}m²</span>}
                              </div>
                              {product.city && (
                                <p className="text-[10px] mt-2 flex items-center gap-1 truncate" style={{ color: storeTheme.textMuted }}>
                                  <MapPin size={9} className="flex-shrink-0" />
                                  {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
                                </p>
                              )}
                              <button
                                onClick={(e) => { e.preventDefault(); handleWhatsApp(product.title, product.id); }}
                                className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-opacity hover:opacity-90"
                                style={{ background: storeTheme.primary, color: "#fff" }}
                              >
                                <MessageCircle size={12} /> WhatsApp
                              </button>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 rounded-2xl" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
                    <Search size={40} className="mx-auto mb-4 opacity-30" style={{ color: storeTheme.textMuted }} />
                    <p className="text-sm font-medium" style={{ color: storeTheme.textMuted }}>
                      {searchTerm ? "Nenhum resultado para essa busca" : "Nenhum imóvel encontrado"}
                    </p>
                    <button
                      onClick={() => { setSearchTerm(""); setActiveCategory("todos"); setFilterCity?.(""); }}
                      className="mt-3 text-xs font-semibold hover:underline"
                      style={{ color: storeTheme.primary }}
                    >
                      Limpar filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ══════ CTA Captação ÉPICA — depois do grid de imóveis ══════ */}
      <section className="px-4 lg:px-12 py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: `linear-gradient(135deg, #0a0a0a 0%, ${storeTheme.primary}25 50%, #0a0a0a 100%)`,
            border: `1px solid ${storeTheme.primary}40`,
            boxShadow: `0 30px 80px -20px ${storeTheme.primary}50, inset 0 1px 0 ${storeTheme.primary}30`,
          }}
        >
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `linear-gradient(${storeTheme.primary}40 1px, transparent 1px), linear-gradient(90deg, ${storeTheme.primary}40 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          }} />

          {/* Glowing orbs */}
          <motion.div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl"
            style={{ background: `${storeTheme.primary}40` }}
            animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl"
            style={{ background: `${storeTheme.primary}30` }}
            animate={{ x: [0, -40, 0], y: [0, -20, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
            background: `linear-gradient(90deg, transparent, ${storeTheme.primary}, transparent)`,
          }} />

          {/* Floating sparkles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: storeTheme.primary,
                left: `${15 + i * 14}%`,
                top: `${20 + (i % 3) * 25}%`,
                boxShadow: `0 0 12px ${storeTheme.primary}`,
              }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
            />
          ))}

          {/* Content */}
          <div className="relative z-10 px-6 py-12 md:px-16 md:py-20 text-center">
            {/* Animated badge */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{
                background: `${storeTheme.primary}20`,
                border: `1px solid ${storeTheme.primary}50`,
                backdropFilter: "blur(10px)",
              }}
            >
              <Sparkles size={14} style={{ color: storeTheme.primary }} className="animate-pulse" />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em]" style={{ color: storeTheme.primary }}>
                Oportunidade Exclusiva
              </span>
            </motion.div>

            {/* Icon with glow */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, type: "spring" }}
              className="relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl mb-6"
              style={{
                background: `linear-gradient(135deg, ${storeTheme.primary}, ${storeTheme.primary}80)`,
                boxShadow: `0 0 40px ${storeTheme.primary}80, inset 0 1px 0 rgba(255,255,255,0.3)`,
              }}
            >
              <Home size={32} className="text-white drop-shadow-lg md:w-10 md:h-10" />
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{ border: `2px solid ${storeTheme.primary}` }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="font-black text-2xl md:text-4xl lg:text-5xl mb-4 leading-tight tracking-tight"
              style={{ color: "#fff", textShadow: `0 4px 20px ${storeTheme.primary}60` }}
            >
              Transforme seu imóvel em{" "}
              <span style={{
                background: `linear-gradient(135deg, ${storeTheme.primary}, #fff, ${storeTheme.primary})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                negócio
              </span>
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-sm md:text-base mb-8 max-w-xl mx-auto leading-relaxed"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Cadastre seu imóvel <span className="font-bold" style={{ color: storeTheme.primary }}>gratuitamente</span> com{" "}
              <span className="font-bold text-white">{sellerDisplayName}</span> e alcance milhares de compradores qualificados.
            </motion.p>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-3 md:gap-5 mb-8 text-[10px] md:text-xs"
            >
              {[
                { icon: ShieldCheck, label: "100% Seguro" },
                { icon: Sparkles, label: "Sem Taxas" },
                { icon: TrendingUp, label: "Mais Visibilidade" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                  <item.icon size={14} style={{ color: storeTheme.primary }} />
                  {item.label}
                </div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, type: "spring" }}
            >
              <Link
                to={`/captar-imovel/${dbProfile?.slug || corretorSlug || ""}`}
                className="group relative inline-flex items-center gap-3 px-8 md:px-12 py-4 md:py-5 rounded-2xl font-black text-sm md:text-base text-white overflow-hidden transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${storeTheme.primary}, ${storeTheme.primary}cc)`,
                  boxShadow: `0 20px 50px -10px ${storeTheme.primary}80, inset 0 1px 0 rgba(255,255,255,0.4)`,
                }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 -translate-x-full"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}
                  animate={{ translateX: ["-100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                />
                <span className="relative uppercase tracking-wider">Anunciar meu imóvel</span>
                <ArrowRight size={18} className="relative group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Bottom hint */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9 }}
              className="text-[10px] md:text-xs mt-5 uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              ⚡ Cadastro em menos de 2 minutos
            </motion.p>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{
            background: `linear-gradient(90deg, transparent, ${storeTheme.primary}, transparent)`,
          }} />
        </motion.div>
      </section>

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
