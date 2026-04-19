import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  MapPin, Image, Bed, Bath, Ruler, Search, X,
  Home, Building2, Key, Trees, Store, Landmark,
  ArrowRight, Sparkles, Heart, ChevronDown, LayoutDashboard,
  MessageCircle, Instagram, Shield, BadgeCheck, Zap, Clock,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";
import { useAuth } from "@/hooks/useAuth";
import { isIOSStandaloneApp } from "@/lib/pwaInstall";
import { useIsMobile } from "@/hooks/use-mobile";
import MapEmbed from "@/components/MapEmbed";

/* ── Color helpers ── */
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function getSubtle(primary: string, opacity = 0.06): string {
  return `${primary}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  casa: Home, apartamento: Building2, aluguel: Key,
  terreno: Trees, comercial: Store, flat: Landmark,
};

/**
 * Minimal Layout — Elegant & immersive with refined typography
 */
export default function StoreLayoutMinimal({
  filteredProducts, products, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, sellerDisplayName, dbProfile, getTagStyle, getTagLabel, handleWhatsApp,
  filterCity, setFilterCity, availableCities, storiesBar,
}: StoreLayoutProps) {
  const { user } = useAuth();
  const isOwner = !!(user && dbProfile && user.id === dbProfile.user_id);
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const isIOSStandalone = isIOSStandaloneApp();
  const isMobile = useIsMobile();

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  const heroProducts = filteredProducts.filter((p: any) => p.image).slice(0, 8);
  const heroImages = heroProducts.map((p: any) => p.image);
  // Dynamic city name based on current hero slide
  const currentHeroCity = heroProducts[heroIdx]?.city || dbProfile?.city || "sua região";
  const totalCount = filteredProducts.length;

  const activeCats = subcategories.filter(c => c.slug === "todos" || (categoryCounts[c.slug] || 0) > 0);

  const visibleProducts = searchTerm
    ? filteredProducts.filter((p: any) =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredProducts;

  // Auto-rotate hero images
  useEffect(() => {
    if (heroImages.length <= 1 || isMobile) return;
    const t = setInterval(() => setHeroIdx(prev => (prev + 1) % heroImages.length), 5000);
    return () => clearInterval(t);
  }, [heroImages.length, isMobile]);

  const scrollToGrid = () =>
    setTimeout(() => {
      document.getElementById("minimal-grid")?.scrollIntoView({
        behavior: isIOSStandalone ? "auto" : "smooth",
        block: "start",
      });
    }, 100);

  return (
    <div style={{ background: storeTheme.bg, overflowX: "clip", maxWidth: "100%", fontFamily: "'Manrope', 'Inter', sans-serif" }}>
      <style>{`
        .minimal-display { font-family: 'Sora', 'Inter', sans-serif; letter-spacing: -0.028em; font-feature-settings: 'ss01'; }
        .minimal-body { font-family: 'Manrope', 'Inter', sans-serif; letter-spacing: -0.005em; }
        .minimal-mono { font-family: 'Space Grotesk', 'Inter', sans-serif; font-feature-settings: 'tnum'; }
        .minimal-price { font-family: 'Space Grotesk', 'Sora', sans-serif; font-feature-settings: 'tnum', 'ss01'; letter-spacing: -0.04em; }
        .minimal-card { transition: transform .5s cubic-bezier(.2,.8,.2,1), box-shadow .5s, border-color .5s; }
        .minimal-card:hover { transform: translateY(-4px); }
        @keyframes minimalParticleUp {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: var(--mp-opacity); }
          90% { opacity: calc(var(--mp-opacity) * 0.4); }
          100% { transform: translateY(-110vh) translateX(var(--mp-drift)) scale(0.3); opacity: 0; }
        }
      `}</style>

      {/* Floating particles — uses theme primary color */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {Array.from({ length: 28 }).map((_, i) => {
          const left = (i * 37) % 100;
          const delay = (i * 0.7) % 9;
          const duration = 9 + ((i * 1.3) % 8);
          const size = 2 + ((i * 1.7) % 4);
          const opacity = 0.2 + ((i * 0.13) % 0.5);
          const drift = -40 + ((i * 11) % 80);
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${left}%`,
                bottom: "-6px",
                width: size,
                height: size,
                background: storeTheme.primary,
                boxShadow: `0 0 ${size + 3}px ${storeTheme.primary}80`,
                ["--mp-opacity" as any]: opacity,
                ["--mp-drift" as any]: `${drift}px`,
                animation: `minimalParticleUp ${duration}s ${delay}s ease-in infinite`,
              }}
            />
          );
        })}
      </div>

      {/* ═══ HERO — Cinematic parallax with auto-rotating images ═══ */}
      <motion.section
        ref={heroRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className={`relative h-[300px] md:h-[480px] overflow-hidden ${isIOSStandalone ? "mx-0" : "-mx-4 md:-mx-6"} mt-0 mb-0`}
      >
        {/* Auto-rotating background images */}
        <AnimatePresence mode="wait">
          {heroImages.length > 0 ? (
            <motion.img
              key={heroIdx}
              src={heroImages[heroIdx]}
              alt="Hero"
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ scale: heroScale }}
            />
          ) : (
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${storeTheme.bg}, ${storeTheme.primary}30)` }} />
          )}
        </AnimatePresence>

        {/* Dark gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

        {/* Painel / Entrar button */}
        <div className="absolute top-8 left-8 z-20">
          <Link
            to={isOwner ? "/painel" : "/login"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-medium hover:bg-white/20 transition-colors"
          >
            <LayoutDashboard size={14} /> {isOwner ? "Painel" : "Entrar"}
          </Link>
        </div>

        {/* Subtle accent line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(to right, ${storeTheme.primary}, transparent)` }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        />

        {/* Hero text */}
        <div className="relative z-10 h-full flex flex-col justify-end p-5 md:p-10 max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.25em] mb-2"
            style={{ color: storeTheme.primary }}
          >
            <MapPin size={12} className="inline mr-1 -mt-0.5" />
            {currentHeroCity}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="minimal-display font-extrabold text-4xl md:text-7xl leading-[1.02] text-white drop-shadow-2xl"
          >
            Imóveis em{" "}
            <span className="font-light italic" style={{ color: storeTheme.primary }}>{currentHeroCity}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="minimal-body text-sm md:text-base mt-3 max-w-md text-white/75 font-light"
          >
            {totalCount} {totalCount === 1 ? "imóvel selecionado" : "imóveis selecionados"} com cuidado
          </motion.p>

          <div className="flex items-center gap-4 mt-4">
            <div className="relative">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={() => {
                  if (availableCities && availableCities.length > 1) {
                    setShowCityPicker(prev => !prev);
                  } else {
                    scrollToGrid();
                  }
                }}
                className="inline-flex items-center gap-2 text-xs font-semibold group"
                style={{ color: storeTheme.primary }}
              >
                {filterCity ? `📍 ${filterCity}` : "Explorar"}
                <ChevronDown size={14} className={`transition-transform ${showCityPicker ? "rotate-180" : "group-hover:translate-y-1"}`} />
              </motion.button>

              {/* City picker dropdown */}
              <AnimatePresence>
                {showCityPicker && availableCities && availableCities.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full mb-2 left-0 min-w-[200px] rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl z-[9999] max-h-[50vh] overflow-y-auto"
                    style={{ background: `${storeTheme.card}ee`, border: `1px solid ${storeTheme.border}` }}
                  >
                    {/* "Todas" option */}
                    <button
                      onClick={() => { setFilterCity?.(""); setShowCityPicker(false); scrollToGrid(); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors flex items-center gap-2"
                      style={{
                        color: !filterCity ? storeTheme.primary : storeTheme.text,
                        background: !filterCity ? `${storeTheme.primary}15` : "transparent",
                      }}
                    >
                      <MapPin size={11} /> Todas as cidades
                    </button>
                    <div className="h-px" style={{ background: storeTheme.border }} />
                    {availableCities.map(city => (
                      <button
                        key={city}
                        onClick={() => { setFilterCity?.(city); setShowCityPicker(false); scrollToGrid(); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors flex items-center gap-2"
                        style={{
                          color: filterCity === city ? storeTheme.primary : storeTheme.text,
                          background: filterCity === city ? `${storeTheme.primary}15` : "transparent",
                        }}
                      >
                        <MapPin size={11} /> {city}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Slide indicators */}
            {heroImages.length > 1 && (
              <div className="flex gap-1.5">
                {heroImages.map((_: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setHeroIdx(i)}
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: i === heroIdx ? 20 : 6,
                      background: i === heroIdx ? storeTheme.primary : "rgba(255,255,255,0.3)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </motion.section>

      {/* ═══ MOBILE SELLER CARD — Compact under hero ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="md:hidden max-w-5xl mx-auto mt-4 mb-2"
      >
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
        >
          {dbProfile?.logo_url ? (
            <img src={dbProfile.logo_url} alt={sellerDisplayName} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center minimal-display font-bold text-lg text-white flex-shrink-0" style={{ background: storeTheme.primary }}>
              {sellerDisplayName?.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="minimal-display font-bold text-sm truncate" style={{ color: storeTheme.text }}>{sellerDisplayName}</h4>
            <p className="minimal-mono text-[9px] uppercase tracking-[0.18em] mt-0.5" style={{ color: storeTheme.textMuted }}>
              {dbProfile?.seller_category === "imobiliaria" ? "Imobiliária" : dbProfile?.seller_category === "construtora" ? "Construtora" : "Corretor(a)"}
              {dbProfile?.creci && ` · CRECI ${dbProfile.creci}`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ SEARCH BAR — Minimal floating ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="max-w-5xl mx-auto mt-6 mb-6"
      >
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
          style={{
            background: storeTheme.card,
            border: `1px solid ${storeTheme.border}`,
            boxShadow: searchTerm ? `0 4px 20px ${storeTheme.primary}15` : "none",
          }}
        >
          <Search size={16} style={{ color: storeTheme.textMuted }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por tipo, bairro..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-30"
            style={{ color: storeTheme.text }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="p-1 rounded-lg hover:opacity-70">
              <X size={14} style={{ color: storeTheme.textMuted }} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Stories Bar */}
      {storiesBar && <div className="max-w-5xl mx-auto mb-6">{storiesBar}</div>}

      {/* ═══ CATEGORY PILLS — Unique editorial design with theme colors ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="max-w-5xl mx-auto mb-8"
      >
        <p
          className="text-[9px] uppercase tracking-[0.35em] mb-3 minimal-mono"
          style={{ color: storeTheme.textMuted }}
        >
          ─ Categorias
        </p>
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
          {activeCats.map((cat) => {
            const isActive = activeCategory === cat.slug;
            const count = categoryCounts[cat.slug] || 0;
            const Icon = CATEGORY_ICONS[cat.slug];
            return (
              <button
                key={cat.slug}
                onClick={() => { setActiveCategory(cat.slug); scrollToGrid(); }}
                className="group relative flex-shrink-0 inline-flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full transition-all duration-300"
                style={{
                  background: isActive ? storeTheme.primary : storeTheme.card,
                  border: `1px solid ${isActive ? "transparent" : storeTheme.border}`,
                  color: isActive ? "#fff" : storeTheme.text,
                }}
              >
                <span
                  className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-500"
                  style={{
                    background: isActive ? "rgba(255,255,255,0.18)" : `${storeTheme.primary}12`,
                    color: isActive ? "#fff" : storeTheme.primary,
                  }}
                >
                  {Icon && <Icon size={13} strokeWidth={2.2} />}
                </span>
                <span className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap">
                  {cat.name}
                </span>
                {count > 0 && cat.slug !== "todos" && (
                  <span
                    className="relative z-10 minimal-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-all"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.22)" : `${storeTheme.primary}18`,
                      color: isActive ? "#fff" : storeTheme.primary,
                      minWidth: 18,
                      textAlign: "center",
                    }}
                  >
                    {count}
                  </span>
                )}
                {isActive && (
                  <motion.span
                    layoutId="minimalCatDot"
                    className="absolute -top-0.5 left-1/2 w-1 h-1 rounded-full"
                    style={{ background: "#fff", transform: "translateX(-50%)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ RESULTS LABEL ═══ */}
      <div id="minimal-grid" className="max-w-5xl mx-auto mb-4 scroll-mt-20">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: storeTheme.textMuted }}>
          {visibleProducts.length} {visibleProducts.length === 1 ? "resultado" : "resultados"}
          {searchTerm && <span> para "{searchTerm}"</span>}
        </p>
      </div>

      {/* ═══ PRODUCT GRID — Refined cards with hover reveal ═══ */}
      {visibleProducts.length > 0 ? (
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 mb-10">
          {visibleProducts.map((product: any, i: number) => {
            const _qs = [corretorSlug ? `corretor=${corretorSlug}` : "", product._isPartnerImport && product._partnerStoreSlug ? `loja=${product._partnerStoreSlug}` : ""].filter(Boolean).join("&");
            const productLink = `/imoveis/produto/${product.slug || product.id}${_qs ? `?${_qs}` : ""}`;
            const isHovered = hoveredId === product.id;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.5 }}
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <Link
                  to={productLink}
                  className="minimal-card block rounded-2xl overflow-hidden group"
                  style={{
                    background: storeTheme.card,
                    border: `1px solid ${isHovered ? storeTheme.primary + "55" : storeTheme.border}`,
                    boxShadow: isHovered
                      ? `0 24px 60px ${storeTheme.primary}18, 0 6px 16px rgba(0,0,0,0.06)`
                      : `0 1px 2px rgba(0,0,0,0.03)`,
                  }}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.border }}>
                        <Image size={24} style={{ color: storeTheme.textMuted }} />
                      </div>
                    )}

                    {/* Gradient overlay on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `linear-gradient(to top, ${storeTheme.primary}25, transparent 60%)` }}
                    />

                    {/* Tag */}
                    {product.tag && (
                      <span
                        className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md text-[9px] font-bold backdrop-blur-md tracking-wider uppercase ${getTagStyle(product.tag)}`}
                      >
                        {getTagLabel(product.tag)}
                      </span>
                    )}

                    {/* Aluguel badge */}
                    {product.isAluguel && (
                      <span
                        className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md text-[9px] font-bold backdrop-blur-md text-white tracking-wider uppercase"
                        style={{ background: `${storeTheme.primary}cc` }}
                      >
                        Aluguel
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 md:p-6">
                    {/* Eyebrow location */}
                    {product.city && (
                      <p
                        className="minimal-mono text-[7px] md:text-[8px] uppercase tracking-[0.18em] flex items-center gap-1 mb-2.5 font-medium"
                        style={{ color: storeTheme.textMuted }}
                      >
                        <MapPin size={8} strokeWidth={2.4} className="flex-shrink-0" />
                        <span className="truncate min-w-0">
                          {product.neighborhood ? `${product.neighborhood} · ${product.city}` : product.city}
                        </span>
                      </p>
                    )}

                    {/* Modern title — Sora semibold */}
                    <h3
                      className="minimal-display font-semibold text-[15px] md:text-[17px] line-clamp-2 leading-[1.25] mb-3.5"
                      style={{ color: storeTheme.text }}
                    >
                      {product.title}
                    </h3>

                    {/* Hairline divider in primary */}
                    {product.price > 0 && (
                      <div
                        className="h-px w-10 mb-3 transition-all duration-500 group-hover:w-20"
                        style={{ background: storeTheme.primary }}
                      />
                    )}

                    {/* Epic premium price — Space Grotesk with gradient border */}
                    {product.price > 0 && (
                      <div
                        className="inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-500 group-hover:scale-[1.02]"
                        style={{
                          background: `linear-gradient(${storeTheme.card}, ${storeTheme.card}) padding-box, linear-gradient(135deg, ${storeTheme.primary}, ${storeTheme.accent || storeTheme.primary}, ${storeTheme.primary}40) border-box`,
                          border: "1px solid transparent",
                          boxShadow: `0 2px 12px ${storeTheme.primary}15`,
                        }}
                      >
                        <span
                          className="minimal-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-semibold"
                          style={{ color: storeTheme.textMuted }}
                        >
                          R$
                        </span>
                        <span
                          className="minimal-price font-bold text-[22px] md:text-[26px] leading-none bg-clip-text text-transparent"
                          style={{ backgroundImage: `linear-gradient(135deg, ${storeTheme.text}, ${storeTheme.primary})` }}
                        >
                          {product.price.toLocaleString("pt-BR")}
                        </span>
                        {product.isAluguel && (
                          <span
                            className="minimal-mono text-[9px] md:text-[10px] uppercase tracking-[0.18em] ml-0.5 font-medium"
                            style={{ color: storeTheme.textMuted }}
                          >
                            /mês
                          </span>
                        )}
                      </div>
                    )}

                    {/* Specs — revealed on hover (desktop) */}
                    <div
                      className="flex items-center gap-3.5 mt-4 pt-3.5 border-t text-[10px] md:text-[11px] md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 minimal-mono uppercase tracking-[0.15em] font-medium"
                      style={{ color: storeTheme.textMuted, borderColor: `${storeTheme.border}80` }}
                    >
                      {product.bedrooms > 0 && (
                        <span className="flex items-center gap-1"><Bed size={11} /> {product.bedrooms}</span>
                      )}
                      {product.bathrooms > 0 && (
                        <span className="flex items-center gap-1"><Bath size={11} /> {product.bathrooms}</span>
                      )}
                      {product.area > 0 && (
                        <span className="flex items-center gap-1"><Ruler size={11} /> {product.area}m²</span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24">
          <Sparkles size={24} className="mx-auto mb-3 opacity-30" style={{ color: storeTheme.textMuted }} />
          <p className="text-sm" style={{ color: storeTheme.textMuted }}>Nenhum anúncio encontrado</p>
        </div>
      )}

      {/* ═══ CTA — Elegant WhatsApp ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-5xl mx-auto mb-8"
      >
        <div
          className="relative rounded-2xl overflow-hidden p-8 md:p-12 text-center"
          style={{
            background: storeTheme.card,
            border: `1px solid ${storeTheme.border}`,
          }}
        >
          {/* Subtle accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: `linear-gradient(to right, transparent, ${storeTheme.primary}, transparent)` }}
          />

          <p className="minimal-mono text-[10px] uppercase tracking-[0.32em] mb-3 font-semibold" style={{ color: storeTheme.primary }}>
            Captação de imóveis
          </p>
          <h2 className="minimal-display text-3xl md:text-5xl font-bold mb-3" style={{ color: storeTheme.text, letterSpacing: "-0.03em" }}>
            Quer anunciar seu imóvel?
          </h2>
          <p className="minimal-body text-sm md:text-base mb-7 max-w-md mx-auto font-light" style={{ color: storeTheme.textMuted }}>
            Cadastre seu imóvel gratuitamente com {sellerDisplayName} e alcance mais compradores.
          </p>
          <Link
            to={`/captar-imovel/${corretorSlug}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{
              background: storeTheme.primary,
              boxShadow: `0 4px 20px ${storeTheme.primary}30`,
            }}
          >
            Anunciar meu imóvel <ArrowRight size={14} />
          </Link>
        </div>
      </motion.section>

      {/* ═══ EPIC ABOUT SECTION ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-5xl mx-auto mb-12"
      >
        <div
          className="relative rounded-3xl overflow-hidden p-8 md:p-12"
          style={{
            background: `linear-gradient(135deg, ${storeTheme.card} 0%, ${storeTheme.primary}08 100%)`,
            border: `1px solid ${storeTheme.border}`,
            boxShadow: `0 30px 80px ${storeTheme.primary}10`,
          }}
        >
          {/* Decorative gradient orb */}
          <div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: storeTheme.primary }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ background: storeTheme.primary }}
          />

          <div className="relative z-10 grid md:grid-cols-[auto,1fr] gap-6 md:gap-10 items-start">
            {/* Avatar / Logo */}
            <div className="flex md:flex-col items-center md:items-start gap-4">
              {dbProfile?.logo_url ? (
                <img
                  src={dbProfile.logo_url}
                  alt={sellerDisplayName}
                  className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover flex-shrink-0"
                  style={{ border: `3px solid ${storeTheme.primary}40`, boxShadow: `0 12px 30px ${storeTheme.primary}30` }}
                />
              ) : (
                <div
                  className="w-20 h-20 md:w-28 md:h-28 rounded-2xl flex items-center justify-center minimal-display font-bold text-3xl md:text-4xl text-white flex-shrink-0"
                  style={{ background: storeTheme.primary, boxShadow: `0 12px 30px ${storeTheme.primary}40` }}
                >
                  {sellerDisplayName?.charAt(0)}
                </div>
              )}
              {dbProfile?.creci && (
                <div
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl"
                  style={{ background: `${storeTheme.primary}15`, border: `1px solid ${storeTheme.primary}30` }}
                >
                  <Shield size={12} style={{ color: storeTheme.primary }} />
                  <span className="minimal-mono text-[10px] font-bold tracking-wider" style={{ color: storeTheme.primary }}>
                    CRECI {dbProfile.creci}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="minimal-mono text-[10px] uppercase tracking-[0.32em] mb-2 font-semibold" style={{ color: storeTheme.primary }}>
                <BadgeCheck size={11} className="inline mr-1.5 -mt-0.5" />
                Sobre {dbProfile?.seller_category === "imobiliaria" ? "a empresa" : dbProfile?.seller_category === "construtora" ? "a construtora" : "o corretor"}
              </p>
              <h2 className="minimal-display text-3xl md:text-5xl font-bold mb-2" style={{ color: storeTheme.text, letterSpacing: "-0.03em" }}>
                {sellerDisplayName}
              </h2>
              <p className="minimal-body text-sm md:text-base mb-6 font-light" style={{ color: storeTheme.textMuted }}>
                {dbProfile?.seller_category === "imobiliaria" ? "Imobiliária" :
                 dbProfile?.seller_category === "construtora" ? "Construtora" :
                 "Corretor(a) de Imóveis"}
              </p>

              {dbProfile?.bio && (
                <p className="minimal-body text-sm md:text-base mb-6 whitespace-pre-line leading-relaxed" style={{ color: storeTheme.text }}>
                  {dbProfile.bio}
                </p>
              )}

              {/* Trust grid */}
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {[
                  { icon: MessageCircle, text: "Contato direto via WhatsApp" },
                  { icon: BadgeCheck, text: "Vendedor verificado e premium" },
                  { icon: Clock, text: "Atendimento em horário comercial" },
                  { icon: Zap, text: "Resposta rápida e profissional" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: `${storeTheme.primary}06`, border: `1px solid ${storeTheme.border}` }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${storeTheme.primary}15`, color: storeTheme.primary }}
                    >
                      <item.icon size={14} />
                    </div>
                    <span className="minimal-body text-xs md:text-sm font-medium" style={{ color: storeTheme.text }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-row gap-3">
                {dbProfile?.phone && (
                  <button
                    onClick={() => handleWhatsApp(sellerDisplayName)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl bg-[#25d366] text-white minimal-body font-bold text-xs sm:text-sm hover:bg-[#22c55e] transition-all hover:scale-105 whitespace-nowrap"
                    style={{ boxShadow: "0 8px 24px rgba(37, 211, 102, 0.35)" }}
                  >
                    <MessageCircle size={16} /> <span className="truncate">Falar no WhatsApp</span>
                  </button>
                )}
                {dbProfile?.instagram && (
                  <a
                    href={`https://instagram.com/${dbProfile.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white minimal-body font-bold text-xs sm:text-sm hover:opacity-90 transition-all hover:scale-105 whitespace-nowrap"
                    style={{ boxShadow: "0 8px 24px rgba(225, 48, 108, 0.3)" }}
                  >
                    <Instagram size={16} /> Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══ MAP — Localização at the end ═══ */}
      {(dbProfile?.address || dbProfile?.city) && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto mb-12"
        >
          <div className="mb-4">
            <p className="minimal-mono text-[10px] uppercase tracking-[0.32em] mb-2 font-semibold" style={{ color: storeTheme.primary }}>
              <MapPin size={11} className="inline mr-1.5 -mt-0.5" />
              Localização
            </p>
            <h2 className="minimal-display text-2xl md:text-3xl font-bold" style={{ color: storeTheme.text, letterSpacing: "-0.025em" }}>
              Onde estamos
            </h2>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: `1px solid ${storeTheme.border}`,
              boxShadow: `0 10px 40px ${storeTheme.primary}15`,
              minHeight: 360,
            }}
          >
            <MapEmbed address={[dbProfile?.address, dbProfile?.city, dbProfile?.state].filter(Boolean).join(", ")} />
          </div>
          {(dbProfile?.address || dbProfile?.city) && (
            <p className="minimal-body text-xs md:text-sm mt-4 flex items-start gap-2 font-light" style={{ color: storeTheme.textMuted }}>
              <MapPin size={13} style={{ color: storeTheme.primary }} className="mt-0.5 flex-shrink-0" />
              <span>{[dbProfile?.address, dbProfile?.city, dbProfile?.state].filter(Boolean).join(", ")}</span>
            </p>
          )}
        </motion.section>
      )}
    </div>
  );
}
