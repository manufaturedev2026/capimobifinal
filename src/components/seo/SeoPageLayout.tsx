import { useState, useEffect, useRef, ReactNode } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Search, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MarketplaceNavbar from "@/components/MarketplaceNavbar";
import FooterSimple from "@/components/FooterSimple";
import { getMarketplaceTheme, type MarketplaceTheme } from "@/lib/marketplaceThemes";
import { getMarketplaceThemeCssVars } from "@/lib/marketplaceThemeCssVars";
import FloatingParticles from "@/components/seo/FloatingParticles";
import ShimmerLine from "@/components/seo/ShimmerLine";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export { FloatingParticles, ShimmerLine };

export function useSeoTheme() {
  const [themeId, setThemeId] = useState(() => localStorage.getItem("marketplace_theme") || "azul");
  useEffect(() => {
    supabase.from("platform_settings").select("value").eq("key", "homepage_theme").maybeSingle().then(({ data }) => {
      if (data?.value) { setThemeId(data.value); localStorage.setItem("marketplace_theme", data.value); }
    });
  }, []);
  return getMarketplaceTheme(themeId);
}

const HERO_INTERVAL = 5000;

interface SeoPageLayoutProps {
  theme: MarketplaceTheme;
  title: string;
  metaDescription: string;
  canonical: string;
  jsonLd?: object;
  heroImage?: string | null;
  heroImages?: string[];
  heroHeight?: string;
  breadcrumbs: Array<{ label: string; to?: string }>;
  heroTagline?: string;
  heroSubtitle?: string | ReactNode;
  heroAction?: ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  children: ReactNode;
}

export default function SeoPageLayout({
  theme,
  title,
  metaDescription,
  canonical,
  jsonLd,
  heroImage,
  heroImages,
  heroHeight = "h-[50vh] md:h-[65vh]",
  breadcrumbs,
  heroTagline,
  heroSubtitle,
  heroAction,
  searchPlaceholder = "Buscar...",
  searchValue,
  onSearchChange,
  children,
}: SeoPageLayoutProps) {
  const { primary: PRIMARY, darkBase: DARK_BASE, darkMid: DARK_MID, cardBg: CARD_BG, border: BORDER, text: TEXT, textMuted: TEXT_MUTED } = theme;
  const themeVars = getMarketplaceThemeCssVars(theme);
  const { site_name } = useSiteSettings();

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  // Auto-rotate hero images
  const allHeroImages = heroImages?.length ? heroImages : heroImage ? [heroImage] : [];
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    if (allHeroImages.length <= 1) return;
    const timer = setInterval(() => setHeroIdx(p => (p + 1) % allHeroImages.length), HERO_INTERVAL);
    return () => clearInterval(timer);
  }, [allHeroImages.length]);
  const currentHeroImage = allHeroImages[heroIdx] || null;

  return (
    <div style={{ ...themeVars, background: DARK_BASE, color: TEXT, overflowX: "clip", maxWidth: "100%" }} className="min-h-screen">
      <Helmet>
        <title>{`${title} | ${site_name}`}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={metaDescription} />
        {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
      </Helmet>

      <MarketplaceNavbar theme={theme} user={null} showImoveisScroll={false} />

      {/* ═══ HERO ═══ */}
      <motion.section ref={heroRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className={`relative ${heroHeight} overflow-hidden`}>
        {currentHeroImage ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={currentHeroImage}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              src={currentHeroImage}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ y: heroY }}
            />
          </AnimatePresence>
        ) : (
          <motion.div className="absolute inset-0" style={{ y: heroY, background: `linear-gradient(135deg, ${DARK_BASE}, ${DARK_MID} 40%, ${PRIMARY}90)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <motion.div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: PRIMARY, opacity: 0.12 }} animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.18, 0.08] }} transition={{ duration: 6, repeat: Infinity }} />
        <FloatingParticles color={PRIMARY} />

        <div className="relative z-10 h-full flex flex-col justify-end p-5 md:p-12 max-w-6xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-white/50 text-xs mb-3 flex-wrap">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span>/</span>}
                {b.to ? <Link to={b.to} className="hover:text-white transition-colors">{b.label}</Link> : <span className="text-white/80">{b.label}</span>}
              </span>
            ))}
          </div>

          {heroTagline && (
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="flex items-center gap-2 mb-2">
              <Sparkles size={14} style={{ color: theme.promoAccent || PRIMARY }} />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest" style={{ color: theme.promoAccent || PRIMARY }}>{heroTagline}</span>
            </motion.div>
          )}

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="font-display font-black text-2xl md:text-5xl text-white leading-[1.1] drop-shadow-2xl">
            {title}
          </motion.h1>

          {heroSubtitle && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-white/60 text-xs md:text-base mt-2 max-w-lg">
              {heroSubtitle}
            </motion.div>
          )}

          {heroAction && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-3 md:mt-5">
              {heroAction}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* ═══ SEARCH BAR ═══ */}
      {onSearchChange && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="max-w-6xl mx-auto px-4 -mt-7 relative z-20">
          <div className="flex items-center gap-2 md:gap-3 rounded-2xl px-4 py-3 md:px-5 md:py-4 backdrop-blur-xl" style={{ background: `${CARD_BG}ee`, border: `1px solid ${BORDER}`, boxShadow: `0 8px 40px ${PRIMARY}15` }}>
            <Search size={20} style={{ color: PRIMARY }} />
            <input type="text" value={searchValue || ""} onChange={e => onSearchChange(e.target.value)} placeholder={searchPlaceholder} className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40" style={{ color: TEXT }} />
            {searchValue && <button onClick={() => onSearchChange("")} className="p-1 rounded-lg hover:opacity-70"><X size={16} style={{ color: TEXT_MUTED }} /></button>}
          </div>
        </motion.div>
      )}

      {/* ═══ CONTENT ═══ */}
      {children}

      {/* ═══ SEO TEXT ═══ */}
      <ShimmerLine color={PRIMARY} />
      <section className="max-w-4xl mx-auto px-4 py-8 pb-12">
        <div className="rounded-2xl p-6 md:p-8" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
          <h2 className="font-display font-bold text-xl mb-4" style={{ color: TEXT }}>{title}</h2>
          <div className="text-sm leading-relaxed space-y-3" style={{ color: TEXT_MUTED }}>
            <p>{metaDescription}</p>
            <p>O Capimobi é a plataforma que conecta compradores diretamente com corretores e imobiliárias verificadas de todo o Brasil. Encontre seu imóvel ideal com contato direto via WhatsApp.</p>
          </div>
        </div>
      </section>

      <FooterSimple theme={{ bg: DARK_BASE, text: TEXT, textMuted: TEXT_MUTED, border: BORDER, primary: PRIMARY }} />
    </div>
  );
}
