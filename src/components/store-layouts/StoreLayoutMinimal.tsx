import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  MapPin, Image, Bed, Bath, Ruler, Search, X,
  Home, Building2, Key, Trees, Store, Landmark,
  ArrowRight, Sparkles, Heart, ChevronDown, LayoutDashboard,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";
import { useAuth } from "@/hooks/useAuth";
import { isIOSStandaloneApp } from "@/lib/pwaInstall";
import { useIsMobile } from "@/hooks/use-mobile";

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
    <div style={{ background: storeTheme.bg, overflowX: "clip", maxWidth: "100%", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .minimal-display { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.02em; }
        .minimal-mono { font-family: 'Inter', sans-serif; font-feature-settings: 'tnum'; }
        @keyframes catGlow {
          0%, 100% { box-shadow: 0 0 0 0 var(--cat-glow); }
          50% { box-shadow: 0 0 0 6px transparent; }
        }
        .cat-pill-active { animation: catGlow 2.4s ease-in-out infinite; }
        @keyframes catShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .cat-pill-shimmer::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform: translateX(-100%);
          pointer-events: none;
        }
        .cat-pill-active.cat-pill-shimmer::before {
          animation: catShimmer 3s ease-in-out infinite;
        }
      `}</style>

      {/* ═══ HERO — Cinematic parallax with auto-rotating images ═══ */}
      <motion.section
        ref={heroRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className={`relative h-[300px] md:h-[480px] overflow-hidden ${isIOSStandalone ? "mx-0" : "-mx-4 md:-mx-6"} -mt-6 md:-mt-6 mb-0`}
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
            transition={{ delay: 0.4 }}
            className="font-display font-light text-2xl md:text-5xl leading-tight text-white drop-shadow-lg"
          >
            Imóveis em{" "}
            <span className="font-bold" style={{ color: storeTheme.primary }}>{currentHeroCity}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xs md:text-sm mt-2 max-w-md text-white/70"
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

      {/* ═══ CATEGORY TABS — Elegant underline style ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="max-w-5xl mx-auto mb-8"
      >
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          {activeCats.map((cat) => {
            const isActive = activeCategory === cat.slug;
            const count = categoryCounts[cat.slug] || 0;
            const Icon = CATEGORY_ICONS[cat.slug];
            return (
              <button
                key={cat.slug}
                onClick={() => { setActiveCategory(cat.slug); scrollToGrid(); }}
                className="relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all"
                style={{ color: isActive ? storeTheme.primary : storeTheme.textMuted }}
              >
                {Icon && <Icon size={13} />}
                <span>{cat.name}</span>
                {count > 0 && cat.slug !== "todos" && (
                  <span className="text-[9px] opacity-50">{count}</span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="minimalTabIndicator"
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                    style={{ background: storeTheme.primary }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="h-[1px] -mt-[1px]" style={{ background: storeTheme.border }} />
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
            const productLink = `/imoveis/produto/${product.slug || product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
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
                  className="block rounded-2xl overflow-hidden group transition-all duration-500"
                  style={{
                    background: storeTheme.card,
                    border: `1px solid ${isHovered ? storeTheme.primary + "40" : storeTheme.border}`,
                    boxShadow: isHovered
                      ? `0 16px 48px ${storeTheme.primary}12, 0 4px 12px rgba(0,0,0,0.08)`
                      : `0 1px 3px rgba(0,0,0,0.04)`,
                  }}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
                        className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[8px] font-bold backdrop-blur-sm ${getTagStyle(product.tag)}`}
                      >
                        {getTagLabel(product.tag)}
                      </span>
                    )}

                    {/* Aluguel badge */}
                    {product.isAluguel && (
                      <span
                        className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[8px] font-bold backdrop-blur-sm text-white"
                        style={{ background: `${storeTheme.primary}cc` }}
                      >
                        Aluguel
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3 md:p-4">
                    <h3
                      className="text-[11px] md:text-xs font-semibold line-clamp-2 leading-snug mb-1.5"
                      style={{ color: storeTheme.text }}
                    >
                      {product.title}
                    </h3>

                    {product.city && (
                      <p className="text-[9px] md:text-[10px] flex items-center gap-1 mb-2" style={{ color: storeTheme.textMuted }}>
                        <MapPin size={9} />
                        {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
                      </p>
                    )}

                    {product.price > 0 && (
                      <p className="text-sm md:text-base font-bold" style={{ color: storeTheme.primary }}>
                        R$ {product.price.toLocaleString("pt-BR")}
                        {product.isAluguel && (
                          <span className="text-[9px] font-normal ml-1" style={{ color: storeTheme.textMuted }}>/mês</span>
                        )}
                      </p>
                    )}

                    {/* Specs — revealed on hover (desktop) */}
                    <div
                      className="flex items-center gap-2.5 mt-2 text-[9px] md:text-[10px] md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
                      style={{ color: storeTheme.textMuted }}
                    >
                      {product.bedrooms > 0 && (
                        <span className="flex items-center gap-0.5"><Bed size={10} /> {product.bedrooms}</span>
                      )}
                      {product.bathrooms > 0 && (
                        <span className="flex items-center gap-0.5"><Bath size={10} /> {product.bathrooms}</span>
                      )}
                      {product.area > 0 && (
                        <span className="flex items-center gap-0.5"><Ruler size={10} /> {product.area}m²</span>
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

          <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: storeTheme.primary }}>
            Captação de imóveis
          </p>
          <h2 className="font-display text-xl md:text-2xl font-light mb-2" style={{ color: storeTheme.text }}>
            Quer anunciar seu imóvel?
          </h2>
          <p className="text-xs mb-6 max-w-md mx-auto" style={{ color: storeTheme.textMuted }}>
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
    </div>
  );
}
