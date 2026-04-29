import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  MapPin, Image, Search, Bed, Bath, Ruler, Home, Building2,
  Store, Trees, Key, Landmark, Phone, ShieldCheck, Globe, Megaphone,
  ArrowRight, X, Sparkles, Crown, Star, LayoutDashboard, Clapperboard,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";
import { isIOSStandaloneApp } from "@/lib/pwaInstall";
import { BRAZIL_STATES } from "@/data/brazilStates";
import { useIsMobile } from "@/hooks/use-mobile";
import { getSellerProfessionalTitle } from "@/lib/sellerTitle";

const QUICK_ACTIONS = [
  { slug: "casa", name: "Casas", desc: "Residenciais", icon: Home },
  { slug: "apartamento", name: "Apartamentos", desc: "Condomínios", icon: Building2 },
  { slug: "aluguel", name: "Aluguel", desc: "Locação", icon: Key },
  { slug: "terreno", name: "Terrenos", desc: "Lotes & áreas", icon: Trees },
  { slug: "comercial", name: "Comerciais", desc: "Salas & lojas", icon: Store },
  { slug: "flat", name: "Flats", desc: "Compactos", icon: Landmark },
];

const getBenefitsRow = () => [
  { icon: Phone, title: "Contato Direto", desc: "Fale direto com o corretor via WhatsApp" },
  { icon: Megaphone, title: "Anuncie seu Imóvel", desc: "Cadastre o seu imóvel em nosso site sem custo" },
];

const getBenefitsStack = (cityName?: string, creci?: string | null, verifiedTitle: string = "Corretor(a) Verificado(a)") => [
  { icon: ShieldCheck, title: verifiedTitle, desc: creci ? `CRECI ${creci}` : "Profissional com registro ativo" },
  { icon: Globe, title: "Cobertura Regional", desc: `Imóveis em toda${cityName ? ` ${cityName}` : " a região"}` },
];

/* ── Floating particles component ── */
function FloatingParticles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: color,
            opacity: 0.15 + Math.random() * 0.2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -40 - Math.random() * 60, 0],
            x: [0, (Math.random() - 0.5) * 30, 0],
            opacity: [0.1, 0.35, 0.1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Shimmer line animation ── */
function ShimmerLine({ color }: { color: string }) {
  return (
    <motion.div
      className="h-[1px] w-full"
      style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
      animate={{ opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ── Derive a dark base from the primary color for gradients ── */
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

function getDarkBase(primary: string): string {
  try {
    const [h] = hexToHsl(primary);
    return `hsl(${h}, 40%, 8%)`;
  } catch {
    return "#0a0a0a";
  }
}

function getDarkMid(primary: string): string {
  try {
    const [h] = hexToHsl(primary);
    return `hsl(${h}, 45%, 15%)`;
  } catch {
    return "#1a1a2e";
  }
}

export default function StoreLayoutMarketplace({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, dbProfile, getTagStyle, getTagLabel, handleWhatsApp,
  filterCity, setFilterCity, availableCities, storiesBar, formatPrice, onCinemaMode,
}: StoreLayoutProps) {
  const { user } = useAuth();
  const isOwner = !!(user && dbProfile && user.id === dbProfile.user_id);
  const darkBase = getDarkBase(storeTheme.primary);
  const darkMid = getDarkMid(storeTheme.primary);
  const [searchTerm, setSearchTerm] = useState("");
  const [heroIdx, setHeroIdx] = useState(0);
  const [promoIdx, setPromoIdx] = useState(0);
  const [desktopPromoPage, setDesktopPromoPage] = useState(0);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const promoScrollRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const isIOSStandalone = isIOSStandaloneApp();
  const isMobile = useIsMobile();
  const profileDisplayName = dbProfile?.seller_category === "imobiliaria" || dbProfile?.seller_category === "construtora"
    ? dbProfile?.company_name || dbProfile?.full_name || "Imobiliária"
    : dbProfile?.full_name || dbProfile?.company_name || "Corretor";

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  const visibleProducts = searchTerm
    ? filteredProducts.filter((p: any) =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredProducts;

  // Build hero products with city diversity
  const heroProducts = (() => {
    const withImage = filteredProducts.filter((p: any) => p.image);
    const citySeen = new Set<string>();
    const diverse: any[] = [];
    // First pass: one per city
    for (const p of withImage) {
      if (p.city && !citySeen.has(p.city)) {
        citySeen.add(p.city);
        diverse.push(p);
      }
    }
    // Fill remaining slots
    for (const p of withImage) {
      if (diverse.length >= 5) break;
      if (!diverse.includes(p)) diverse.push(p);
    }
    return diverse.slice(0, 5);
  })();
  const heroImages = heroProducts.map((p: any) => p.image);
  const currentHeroCity = heroProducts[heroIdx]?.city || filterCity || dbProfile?.city || "sua cidade";
  const activeCats = subcategories.filter(c => c.slug === "todos" || (categoryCounts[c.slug] || 0) > 0);

  // Auto-rotate hero
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const t = setInterval(() => setHeroIdx(prev => (prev + 1) % heroImages.length), 5000);
    return () => clearInterval(t);
  }, [heroImages.length, isMobile]);

  const scrollPromoCardIntoView = (index: number) => {
    const el = promoScrollRef.current;
    if (!el) return;

    const card = el.children[index] as HTMLElement | undefined;
    if (!card) return;

    const targetLeft = Math.max(0, card.offsetLeft - (el.clientWidth - card.clientWidth) / 2);
    el.scrollTo({ left: targetLeft, behavior: isIOSStandalone ? "auto" : "smooth" });
  };

  // Auto-scroll promo banners on mobile
  useEffect(() => {
    if (isIOSStandalone || isMobile) return;

    const el = promoScrollRef.current;
    if (!el) return;
    const totalBanners = el.children.length;
    if (totalBanners <= 1) return;

    const t = setInterval(() => {
      setPromoIdx((prev) => {
        const next = (prev + 1) % totalBanners;
        scrollPromoCardIntoView(next);
        return next;
      });
    }, 4000);

    return () => clearInterval(t);
  }, [filteredProducts.length, categoryCounts, isIOSStandalone, isMobile]);

  const scrollToGrid = () =>
    setTimeout(() => {
      document.getElementById("marketplace-grid")?.scrollIntoView({
        behavior: isIOSStandalone ? "auto" : "smooth",
        block: "start",
      });
    }, 100);

  return (
    <div style={{ background: storeTheme.bg, overflowX: "clip", maxWidth: "100%" }}>

      {/* ═══ HERO — Parallax + Particles + Auto-slide ═══ */}
      <motion.section
        ref={heroRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[280px] md:h-[480px] overflow-hidden"
      >
        {/* Parallax background */}
        <AnimatePresence mode="wait">
          <motion.div
            key={heroIdx}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            {heroImages[heroIdx] ? (
              <motion.img
                src={heroImages[heroIdx]}
                alt="Hero"
                className="w-full h-full object-cover"
                style={{ y: heroY, scale: heroScale }}
              />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${darkBase}, ${darkMid}, ${storeTheme.primary})` }} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Animated glow orb */}
        <motion.div
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: storeTheme.primary, opacity: 0.12 }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <FloatingParticles color={storeTheme.primary} />

        {/* Painel / Entrar button + Cinema */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <Link
            to={isOwner ? "/painel" : "/login"}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md text-white text-xs font-medium hover:bg-white/25 transition-colors"
          >
            <LayoutDashboard size={14} /> {isOwner ? "Painel" : "Entrar"}
          </Link>
        </div>

        {/* Cinema Mode button — top right, discreet */}
        {onCinemaMode && filteredProducts.filter((p: any) => p.image).length > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            onClick={onCinemaMode}
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-white/60 hover:text-white transition-all"
            style={{ background: "rgba(0,0,0,0.35)" }}
          >
            <Clapperboard size={13} /> <span className="hidden md:inline">Cinema</span>
          </motion.button>
        )}

        {/* Hero content */}
        <div className="relative z-10 h-full flex flex-col justify-end p-5 md:p-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col gap-0.5 mb-2"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: storeTheme.primary }} />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest" style={{ color: storeTheme.primary }}>
                {profileDisplayName} — {getSellerProfessionalTitle(dbProfile)}
              </span>
            </div>
            {dbProfile?.creci && (
              <span className="text-[10px] md:text-xs font-medium ml-[22px]" style={{ color: `${storeTheme.text}99` }}>
                CRECI {dbProfile.creci}
              </span>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="font-display font-black text-2xl md:text-6xl text-white leading-[1.1] drop-shadow-2xl"
          >
            Imóveis em<br />
            <span style={{ color: storeTheme.primary }}>{currentHeroCity}</span>
          </motion.h1>

          {/* City selector */}
          {availableCities && availableCities.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative mt-1"
            >
              <button
                onClick={() => setShowCityPicker(!showCityPicker)}
                className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors"
              >
                <MapPin size={12} />
                {filterCity || "Todas as cidades"}
                <span className="text-[10px]">▾</span>
              </button>
              <AnimatePresence>
                {showCityPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute left-0 top-full mt-1 z-[9999] rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl max-h-[50vh] overflow-y-auto min-w-[200px]"
                    style={{ background: `${storeTheme.card}f0`, border: `1px solid ${storeTheme.border}` }}
                  >
                    <button
                      onClick={() => { setFilterCity?.(""); setShowCityPicker(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium hover:opacity-80 transition-opacity"
                      style={{ color: !filterCity ? storeTheme.primary : storeTheme.text }}
                    >
                      Todas as cidades
                    </button>
                    {availableCities.map(city => (
                      <button
                        key={city}
                        onClick={() => { setFilterCity?.(city); setShowCityPicker(false); setHeroIdx(0); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium hover:opacity-80 transition-opacity"
                        style={{
                          color: filterCity === city ? storeTheme.primary : storeTheme.text,
                          borderTop: `1px solid ${storeTheme.border}`,
                        }}
                      >
                        {city}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-white/60 text-xs md:text-base mt-2 md:mt-3 max-w-md hidden md:block"
          >
            Encontre casas, apartamentos e terrenos com os melhores corretores da região.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex items-center gap-3 mt-3 md:mt-5"
          >
            <button
              onClick={() => {
                if (currentHeroCity && currentHeroCity !== "sua cidade") {
                  setFilterCity?.(currentHeroCity);
                }
                const el = document.getElementById("marketplace-grid");
                el?.scrollIntoView({ behavior: isIOSStandalone ? "auto" : "smooth", block: "start" });
              }}
              className="group inline-flex items-center gap-2 px-5 py-2.5 md:px-7 md:py-3.5 rounded-2xl font-bold text-xs md:text-sm text-white shadow-2xl transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${storeTheme.primary}, ${storeTheme.primary}bb)`,
                boxShadow: `0 8px 32px ${storeTheme.primary}40`,
              }}
            >
              Ver ofertas em {currentHeroCity}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-xs text-white/40">{filteredProducts.length} imóveis</span>
          </motion.div>

          {/* Hero slide indicators */}
          {heroImages.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-1.5 mt-3 md:mt-5"
            >
              {heroImages.map((_: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setHeroIdx(i)}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: i === heroIdx ? 28 : 8,
                    background: i === heroIdx ? storeTheme.primary : "rgba(255,255,255,0.25)",
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* ═══ FLOATING SEARCH BAR — Glow effect ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="px-4 md:px-8 -mt-7 relative z-20"
      >
        <div
          className="flex items-center gap-2 md:gap-3 rounded-2xl px-4 py-3 md:px-5 md:py-4 backdrop-blur-xl"
          style={{
            background: `${storeTheme.card}ee`,
            border: `1px solid ${storeTheme.border}`,
            boxShadow: `0 8px 40px ${storeTheme.primary}15, 0 2px 8px rgba(0,0,0,0.1)`,
          }}
        >
          <Search size={20} style={{ color: storeTheme.primary }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por tipo, bairro ou cidade..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
            style={{ color: storeTheme.text }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="p-1 rounded-lg hover:opacity-70">
              <X size={16} style={{ color: storeTheme.textMuted }} />
            </button>
          )}
          <button
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
            style={{ background: storeTheme.primary, boxShadow: `0 4px 16px ${storeTheme.primary}30` }}
            onClick={() => {
              const el = document.getElementById("marketplace-grid");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Buscar
          </button>
        </div>
      </motion.div>

      {/* Stories Bar */}
      {storiesBar && (
        <div className="px-4 md:px-8 mt-4">
          {storiesBar}
        </div>
      )}

      <div className="px-2 md:px-8">

        {/* ═══ QUICK ACTIONS — Glass morphism cards ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 md:mt-10 mb-6 md:mb-8"
        >
          <div className="flex items-center gap-2 mb-5">
            <Crown size={16} style={{ color: storeTheme.primary }} />
            <h2 className="font-display font-bold text-lg" style={{ color: storeTheme.text }}>
              O que você procura?
            </h2>
          </div>
          <div className="flex gap-2.5 md:gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2 md:mx-0 md:px-0 md:grid md:grid-cols-6 md:overflow-visible">
            {QUICK_ACTIONS.map((action, idx) => {
              const Icon = action.icon;
              const isActive = activeCategory === action.slug;
              const count = categoryCounts[action.slug] || 0;
              return (
                <motion.button
                  key={action.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.06 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setActiveCategory(isActive ? "todos" : action.slug); scrollToGrid(); }}
                  className="flex-shrink-0 flex flex-col items-center justify-start gap-1.5 md:gap-2.5 p-3 md:p-4 rounded-2xl transition-all w-[92px] h-[132px] md:w-auto md:h-auto md:min-w-[100px] relative overflow-hidden"
                  style={{
                    background: isActive ? `${storeTheme.primary}18` : `${storeTheme.card}`,
                    border: `1.5px solid ${isActive ? storeTheme.primary : storeTheme.border}`,
                    boxShadow: isActive
                      ? `0 8px 24px ${storeTheme.primary}25, inset 0 1px 0 ${storeTheme.primary}20`
                      : `0 2px 8px rgba(0,0,0,0.06)`,
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeGlow"
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ background: `radial-gradient(circle at center, ${storeTheme.primary}10, transparent 70%)` }}
                    />
                  )}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all relative"
                    style={{
                      background: isActive ? `${storeTheme.primary}25` : `${storeTheme.border}60`,
                      color: isActive ? storeTheme.primary : storeTheme.textMuted,
                      boxShadow: isActive ? `0 0 16px ${storeTheme.primary}20` : "none",
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-bold text-center leading-tight min-h-[30px] flex items-center" style={{ color: isActive ? storeTheme.primary : storeTheme.text }}>
                    {action.name}
                  </span>
                  <span className="text-[10px] leading-tight text-center line-clamp-2 min-h-[24px]" style={{ color: storeTheme.textMuted }}>
                    {count > 0 ? `${count} imóveis` : action.desc}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        <ShimmerLine color={storeTheme.primary} />

        {/* ═══ MOST VIEWED — Horizontal scroll ═══ */}
        {(() => {
          const sorted = [...filteredProducts]
            .sort((a: any, b: any) => (b.views_count || 0) - (a.views_count || 0))
            .slice(0, 20);
          if (sorted.length === 0) return null;
          return (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-6 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Star size={16} style={{ color: storeTheme.primary }} />
                <h2 className="font-display font-bold text-lg" style={{ color: storeTheme.text }}>
                  Mais Visitados
                </h2>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2 md:mx-0 md:px-0">
                {sorted.map((product: any, i: number) => {
                  const _partner = product._isPartnerImport && product._partnerStoreSlug ? `/loja/${product._partnerStoreSlug}` : "";
              const _qs = corretorSlug ? `?corretor=${corretorSlug}` : "";
              const productLink = `/imoveis/produto/${product.slug || product.id}${_partner}${_qs}`;
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex-shrink-0"
                      style={{ width: "200px" }}
                    >
                      <Link
                        to={productLink}
                        className="block rounded-2xl overflow-hidden group transition-all"
                        style={{
                          background: storeTheme.card,
                          border: `1px solid ${storeTheme.border}`,
                          boxShadow: `0 2px 8px rgba(0,0,0,0.06)`,
                        }}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          {product.image ? (
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.border }}>
                              <Image size={24} style={{ color: storeTheme.textMuted }} />
                            </div>
                          )}
                          {product.views_count > 0 && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[9px] font-bold backdrop-blur-sm" style={{ background: `${storeTheme.primary}cc`, color: "#fff" }}>
                              👁 {product.views_count}
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="text-xs font-bold line-clamp-1" style={{ color: storeTheme.text }}>{product.title}</h3>
                          {(product.city || product.neighborhood) && (
                            <p className="text-[10px] mt-0.5 flex items-start gap-1 line-clamp-2" style={{ color: storeTheme.textMuted }}>
                              <MapPin size={10} className="flex-shrink-0 mt-0.5" />
                              <span className="break-words">
                                {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
                              </span>
                            </p>
                          )}
                          <p className="font-bold text-sm mt-1" style={{ color: storeTheme.primary }}>
                            {formatPrice(product.price || 0)}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          );
        })()}

        <ShimmerLine color={storeTheme.primary} />

        {/* ═══ PROMO BANNERS — Auto-scroll on mobile + swipeable ═══ */}
        {(() => {
          const categoryMeta: Record<string, { title: [string, string]; desc: string; icon: any }> = {
            todos: { title: ["Todos os", "Imóveis"], desc: "Veja todos os imóveis disponíveis na região", icon: Home },
            casa: { title: ["Casa", "Própria"], desc: "As melhores casas para você e sua família", icon: Home },
            apartamento: { title: ["Aptos", "Modernos"], desc: "Apartamentos com a melhor localização", icon: Building2 },
            aluguel: { title: ["Para", "Alugar"], desc: "Opções de aluguel com ótimo custo-benefício", icon: Key },
            terreno: { title: ["Terrenos", "& Lotes"], desc: "Terrenos com ótima localização", icon: Trees },
            comercial: { title: ["Salas", "Comerciais"], desc: "Espaços comerciais para seu negócio", icon: Store },
            flat: { title: ["Flats", "Compactos"], desc: "Flats e studios prontos para morar", icon: Landmark },
          };
          // Sort categories by count (most popular first), always keep "todos" first
          const ranked = Object.entries(categoryCounts)
            .filter(([slug, count]) => count > 0 && slug !== "todos" && categoryMeta[slug])
            .sort((a, b) => b[1] - a[1])
            .map(([slug]) => slug);
          const bannerSlugs = ["todos", ...ranked];
          // Get a UNIQUE cover image per category (no repeated images)
          const categoryImages: Record<string, string> = {};
          const usedImages = new Set<string>();
          for (const slug of bannerSlugs) {
            const items = slug === "todos"
              ? filteredProducts
              : filteredProducts.filter((p: any) => p.category === slug || (slug === "aluguel" && p.isAluguel));
            const sorted = [...items].sort((a: any, b: any) => (b.views_count || 0) - (a.views_count || 0));
            const best = sorted.find((p: any) => p.image && !usedImages.has(p.image));
            if (best?.image) {
              categoryImages[slug] = best.image;
              usedImages.add(best.image);
            }
          }
          const promoBanners = bannerSlugs
            .filter(slug => categoryMeta[slug])
            .map(slug => ({ slug, ...categoryMeta[slug], coverImage: categoryImages[slug] }));

          return (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="my-8"
            >
              {/* Mobile: horizontal auto-scroll carousel */}
              <div className="md:hidden relative">
                <div
                  ref={promoScrollRef}
                  className="flex gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory pb-2 -mx-2 px-2 md:mx-0 md:px-0"
                  onTouchStart={() => {}}
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const scrollLeft = el.scrollLeft;
                    const cardWidth = el.clientWidth * 0.85 + 12; // 85% width + gap
                    const idx = Math.round(scrollLeft / cardWidth);
                    setPromoIdx(Math.max(0, Math.min(idx, promoBanners.length - 1)));
                  }}
                  style={{ overscrollBehaviorX: "contain" }}
                >
                  {promoBanners.map((banner, bIdx) => (
                    <motion.div
                      key={banner.slug}
                      className="relative h-40 rounded-2xl overflow-hidden cursor-pointer snap-center flex-shrink-0"
                      style={{
                        width: "85%",
                        minWidth: "85%",
                        boxShadow: `0 8px 32px ${storeTheme.primary}18`,
                      }}
                      onClick={() => { setActiveCategory(banner.slug); scrollToGrid(); }}
                    >
                      {banner.coverImage ? (
                        <img loading="lazy" decoding="async" src={banner.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : null}
                      <div className="absolute inset-0" style={{ background: `${storeTheme.primary}90` }} />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                      <FloatingParticles color="#ffffff" />
                      <div className="relative z-10 h-full flex flex-col justify-center p-5">
                        <h3 className="font-display font-black text-xl text-white leading-tight">
                          {banner.title[0]}<br />{banner.title[1]}
                        </h3>
                        <p className="text-white/60 text-xs mt-2 max-w-[200px]">{banner.desc}</p>
                        <span className="inline-flex items-center gap-1.5 text-white/90 text-xs font-bold mt-3">
                          Explorar <ArrowRight size={14} />
                        </span>
                      </div>
                      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10">
                        <banner.icon size={120} className="absolute -right-4 top-1/2 -translate-y-1/2 text-white" />
                      </div>
                    </motion.div>
                  ))}
                </div>
                {/* Dots */}
                <div className="flex justify-center gap-1.5 mt-3">
                  {promoBanners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        scrollPromoCardIntoView(i);
                        setPromoIdx(i);
                      }}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: i === promoIdx ? 24 : 8,
                        background: i === promoIdx ? storeTheme.primary : `${storeTheme.textMuted}40`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Desktop: paginated 2 at a time */}
              <div className="hidden md:block relative">
                {(() => {
                  const maxStart = Math.max(0, promoBanners.length - 2);
                  const startIdx = Math.min(desktopPromoPage, maxStart);
                  const currentBanners = promoBanners.slice(startIdx, startIdx + 2);
                  return (
                    <>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={startIdx}
                          initial={{ opacity: 0, x: 40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -40 }}
                          transition={{ duration: 0.35 }}
                          className="grid grid-cols-2 gap-4"
                        >
                          {currentBanners.map((banner, bIdx) => (
                            <motion.div
                              key={banner.slug}
                              whileHover={{ y: -4, transition: { duration: 0.25 } }}
                              className="relative h-52 rounded-2xl overflow-hidden group cursor-pointer"
                              onClick={() => { setActiveCategory(banner.slug); scrollToGrid(); }}
                              style={{ boxShadow: `0 8px 32px ${storeTheme.primary}18` }}
                            >
                              {banner.coverImage ? (
                                <img src={banner.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                              ) : null}
                              <div className="absolute inset-0" style={{ background: `${storeTheme.primary}90` }} />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                              <FloatingParticles color="#ffffff" />
                              <div className="relative z-10 h-full flex flex-col justify-center p-6">
                                <h3 className="font-display font-black text-3xl text-white leading-tight">
                                  {banner.title[0]}<br />{banner.title[1]}
                                </h3>
                                <p className="text-white/60 text-xs mt-2 max-w-[200px]">{banner.desc}</p>
                                <span className="inline-flex items-center gap-1.5 text-white/90 text-xs font-bold mt-3 group-hover:gap-3 transition-all">
                                  Explorar <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                              </div>
                              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10">
                                <banner.icon size={140} className="absolute -right-6 top-1/2 -translate-y-1/2 text-white" />
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </AnimatePresence>
                      {maxStart > 0 && (
                        <div className="flex justify-center gap-2 mt-4">
                          {Array.from({ length: maxStart + 1 }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setDesktopPromoPage(i)}
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: i === startIdx ? 28 : 10,
                                background: i === startIdx ? storeTheme.primary : `${storeTheme.textMuted}40`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </motion.section>
          );
        })()}


        {/* ═══ RESULTS HEADER ═══ */}
        <div id="marketplace-grid" className="mt-6 mb-4 flex items-center justify-between scroll-mt-32">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: storeTheme.primary }} />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: storeTheme.textMuted }}>
              {visibleProducts.length} {visibleProducts.length === 1 ? "resultado" : "resultados"}
            </p>
          </div>
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-xs font-semibold" style={{ color: storeTheme.primary }}>
              Limpar busca
            </button>
          )}
        </div>

        {/* ═══ PRODUCT GRID — Staggered reveal + hover glow ═══ */}
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-12">
            {visibleProducts.map((product: any, i: number) => {
              const _partner = product._isPartnerImport && product._partnerStoreSlug ? `/loja/${product._partnerStoreSlug}` : "";
              const _qs = corretorSlug ? `?corretor=${corretorSlug}` : "";
              const productLink = `/imoveis/produto/${product.slug || product.id}${_partner}${_qs}`;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.5 }}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                >
                  <Link
                    to={productLink}
                    className="block rounded-2xl overflow-hidden group transition-all"
                    style={{
                      background: storeTheme.card,
                      border: `1px solid ${storeTheme.border}`,
                      boxShadow: `0 2px 8px rgba(0,0,0,0.06)`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${storeTheme.primary}20, 0 4px 12px rgba(0,0,0,0.1)`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px rgba(0,0,0,0.06)`;
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
                      {/* Gradient overlay on hover */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: `linear-gradient(to top, ${storeTheme.primary}30, transparent 60%)` }}
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
                    </div>
                    <div className="p-2.5 md:p-3.5">
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
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 rounded-2xl mb-10" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
            <Search size={40} className="mx-auto mb-4 opacity-20" style={{ color: storeTheme.textMuted }} />
            <p className="text-sm font-medium" style={{ color: storeTheme.textMuted }}>
              {searchTerm ? "Nenhum resultado para essa busca" : "Nenhum anúncio encontrado"}
            </p>
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="mt-3 text-xs font-semibold" style={{ color: storeTheme.primary }}>
                Limpar busca
              </button>
            )}
          </div>
        )}

        {/* ═══ BENEFITS — Glass cards with glow icons ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {getBenefits(dbProfile?.city || undefined, dbProfile?.creci).map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={i}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl relative overflow-hidden"
                style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center relative"
                  style={{ background: `${storeTheme.primary}15`, color: storeTheme.primary }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{ background: `${storeTheme.primary}10` }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                  />
                  <Icon size={20} />
                </div>
                <h4 className="text-xs font-bold" style={{ color: storeTheme.text }}>{benefit.title}</h4>
                <p className="text-[10px] leading-relaxed" style={{ color: storeTheme.textMuted }}>{benefit.desc}</p>
              </motion.div>
            );
          })}
        </motion.section>

        <ShimmerLine color={storeTheme.primary} />


      </div>
    </div>
  );
}
