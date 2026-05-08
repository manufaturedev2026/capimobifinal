import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Search, Home, Building2, Key, Trees, Store, Landmark,
  MapPin, Bed, Bath, Ruler, ArrowRight, X,
  Sparkles, Crown, Star, Users, Shield,
  Phone, ShieldCheck, Globe, Megaphone, UserPlus, LogIn,
  LayoutDashboard, Image, Menu, ChevronDown, Clapperboard, ChevronLeft, ChevronRight,
} from "lucide-react";
import MarketplaceNavbar from "@/components/MarketplaceNavbar";
import GlobalStoriesBar from "@/components/GlobalStoriesBar";
import { useAuth } from "@/hooks/useAuth";
import { useRealListings } from "@/hooks/useRealListings";
import { useCityDetection } from "@/hooks/useCityDetection";
import { formatPrice, getTagStyle, getTagLabel } from "@/data/products";
import PackageBadge from "@/components/PackageBadge";
import FavoriteButton from "@/components/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";
import CompareButton from "@/components/CompareButton";
import { useCompare } from "@/hooks/useCompare";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import { getStoreUrl } from "@/lib/storeUrl";
import { productUrl } from "@/lib/productUrl";
import FooterSimple from "@/components/FooterSimple";
import { useIsMobile } from "@/hooks/use-mobile";
import { getMarketplaceTheme } from "@/lib/marketplaceThemes";
import { getMarketplaceThemeCssVars } from "@/lib/marketplaceThemeCssVars";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { SITE_URL } from "@/lib/siteUrl";
import HomePwaActions from "@/components/HomePwaActions";

const QUICK_ACTIONS = [
  { slug: "casa", name: "Casas", desc: "Residenciais", icon: Home },
  { slug: "apartamento", name: "Apartamentos", desc: "Condomínios", icon: Building2 },
  { slug: "aluguel", name: "Aluguel", desc: "Locação", icon: Key },
  { slug: "terreno", name: "Terrenos", desc: "Lotes & áreas", icon: Trees },
  { slug: "comercial", name: "Comerciais", desc: "Salas & lojas", icon: Store },
  { slug: "flat", name: "Flats", desc: "Compactos", icon: Landmark },
];

const BENEFITS = [
  { icon: Phone, title: "Contato Direto", desc: "Fale direto com o corretor via WhatsApp" },
  { icon: Globe, title: "Cobertura Regional", desc: "Imóveis em diversas cidades" },
  { icon: ShieldCheck, title: "Corretores Verificados", desc: "Profissionais com CRECI ativo" },
  { icon: Megaphone, title: "Anuncie Grátis", desc: "Cadastre seu imóvel sem custo" },
];

/* ── Floating particles ── */
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

/* ── Shimmer line ── */
function ShimmerLine({ color = "#3B82F6" }: { color?: string }) {
  return (
    <motion.div
      className="h-[1px] w-full"
      style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
      animate={{ opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function MarketplaceHome() {
  const { user, profile } = useAuth();
  const { site_name } = useSiteSettings();
  const navigate = useNavigate();
  const { detectedCity } = useCityDetection();
  const { sellers: realSellers, items: realItems, loading } = useRealListings("imoveis");
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem, isInCompare } = useCompare();
  const isMobile = useIsMobile();

  const [themeId, setThemeId] = useState(() => localStorage.getItem("marketplace_theme") || "azul");
  useEffect(() => {
    supabase.from("platform_settings").select("value").eq("key", "homepage_theme").maybeSingle().then(({ data }) => {
      if (data?.value) {
        setThemeId(data.value);
        localStorage.setItem("marketplace_theme", data.value);
      }
    });
  }, []);
  const theme = getMarketplaceTheme(themeId);
  const themeVars = getMarketplaceThemeCssVars(theme);
  const PRIMARY = theme.primary;
  const DARK_BASE = theme.darkBase;
  const DARK_MID = theme.darkMid;
  const CARD_BG = theme.cardBg;
  const BORDER = theme.border;
  const TEXT = theme.text;
  const TEXT_MUTED = theme.textMuted;

  const [activeCategory, setActiveCategory] = useState("todos");
  const [filterCity, setFilterCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [heroIdx, setHeroIdx] = useState(0);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [promoIdx, setPromoIdx] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openStates, setOpenStates] = useState<Set<string>>(new Set());
  const [cinemaMode, setCinemaMode] = useState<number | null>(null);
  const ITEMS_PER_PAGE = 24;
  const heroRef = useRef<HTMLDivElement>(null);
  const promoScrollRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    realItems.forEach((item) => { if (item.city) set.add(item.city.trim()); });
    return Array.from(set).sort();
  }, [realItems]);

  const citiesByState = useMemo(() => {
    const map = new Map<string, Set<string>>();
    realItems.forEach((item) => {
      if (item.city) {
        const st = item.state?.trim() || "Outros";
        if (!map.has(st)) map.set(st, new Set());
        map.get(st)!.add(item.city.trim());
      }
    });
    const result: { state: string; cities: string[] }[] = [];
    map.forEach((cities, state) => {
      result.push({ state, cities: Array.from(cities).sort() });
    });
    result.sort((a, b) => a.state.localeCompare(b.state));
    return result;
  }, [realItems]);

  useEffect(() => {
    if (detectedCity && !filterCity && availableCities.length > 0) {
      const slug = detectedCity.toLowerCase().replace(/\s+/g, "-");
      const match = availableCities.find(
        (c) => c.trim().toLowerCase().replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "") === slug
      );
      if (match) {
        setFilterCity(match);
        // Auto-open the state that contains this city
        const stateGroup = citiesByState.find((g) => g.cities.includes(match));
        if (stateGroup) setOpenStates(new Set([stateGroup.state]));
      }
    }
  }, [detectedCity, availableCities, citiesByState]);

  // Keep the state expanded whenever filterCity changes
  useEffect(() => {
    if (filterCity && citiesByState.length > 0) {
      const stateGroup = citiesByState.find((g) => g.cities.includes(filterCity));
      if (stateGroup) {
        setOpenStates((prev) => {
          if (prev.has(stateGroup.state)) return prev;
          return new Set([...prev, stateGroup.state]);
        });
      }
    }
  }, [filterCity, citiesByState]);

  const sellersMap = useMemo(() => {
    const map: Record<string, { id: string; name: string; logo: string; slug?: string | null; tier?: string }> = {};
    realSellers.forEach((s) => {
      map[s.id] = { id: s.id, name: s.name, logo: s.logo, slug: (s as any).slug, tier: s.tier };
    });
    return map;
  }, [realSellers]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const source = filterCity
      ? realItems.filter((i) => (i.city || "").toLowerCase() === filterCity.toLowerCase())
      : realItems;
    source.forEach((i) => {
      if ((i as any).status === "vendido" || (i as any).status === "inativo") return;
      const cat = i.category || "outros";
      counts[cat] = (counts[cat] || 0) + 1;
      if ((i.tags || []).includes("aluguel_flex") || cat === "aluguel") {
        counts["aluguel"] = (counts["aluguel"] || 0) + (cat !== "aluguel" ? 1 : 0);
      }
    });
    return counts;
  }, [realItems, filterCity]);

  const filteredItems = useMemo(() => {
    let items = [...realItems];
    if (activeCategory !== "todos") {
      if (activeCategory === "aluguel") {
        items = items.filter((i) => (i.tags || []).includes("aluguel_flex") || i.category === "aluguel");
      } else {
        items = items.filter((i) => i.category === activeCategory);
      }
    }
    if (filterCity && !searchQuery.trim()) {
      const city = filterCity.trim().toLowerCase();
      items = items.filter((i) => i.city?.trim().toLowerCase() === city);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.city?.toLowerCase().includes(q) ||
        i.neighborhood?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q) ||
        (i as any).address?.toLowerCase().includes(q)
      );
    }
    items = items.filter((i) => (i as any).status !== "vendido" && (i as any).status !== "inativo");
    return items;
  }, [realItems, activeCategory, filterCity, searchQuery]);

  const paginatedItems = useMemo(() => filteredItems.slice(0, page * ITEMS_PER_PAGE), [filteredItems, page]);
  const hasMore = paginatedItems.length < filteredItems.length;

  // Hero products: when city is selected, show neighborhood diversity; otherwise city diversity
  const heroProducts = useMemo(() => {
    const withImage = realItems.filter((p) => p.image && (p as any).status === "ativo");

    if (filterCity) {
      // Filter to selected city, then diversify by neighborhood
      const cityItems = withImage.filter((p) => p.city?.trim().toLowerCase() === filterCity.trim().toLowerCase());
      const nhSeen = new Set<string>();
      const diverse: typeof cityItems = [];
      for (const p of cityItems) {
        const nh = p.neighborhood?.trim();
        if (nh && !nhSeen.has(nh)) { nhSeen.add(nh); diverse.push(p); }
      }
      for (const p of cityItems) {
        if (diverse.length >= 8) break;
        if (!diverse.includes(p)) diverse.push(p);
      }
      return diverse.slice(0, 8);
    }

    // No city filter: diversify by city
    const citySeen = new Set<string>();
    const diverse: typeof withImage = [];
    for (const p of withImage) {
      if (p.city && !citySeen.has(p.city)) { citySeen.add(p.city); diverse.push(p); }
    }
    for (const p of withImage) {
      if (diverse.length >= 5) break;
      if (!diverse.includes(p)) diverse.push(p);
    }
    return diverse.slice(0, 5);
  }, [realItems, filterCity]);

  const heroImages = heroProducts.map((p) => p.image);

  // Build hero label: "Casas em Bairro" or "Imóveis em Cidade"
  const currentHeroLabel = useMemo(() => {
    const item = heroProducts[heroIdx];
    if (!item) return filterCity || "sua região";

    if (filterCity && item.neighborhood) {
      const catLabels: Record<string, string> = {
        casa: "Casas", apartamento: "Apartamentos", terreno: "Terrenos",
        comercial: "Comerciais", galpao: "Galpões", flat: "Flats",
        aluguel: "Aluguéis", outros: "Imóveis",
      };
      const label = catLabels[item.category] || "Imóveis";
      return `${label} em ${item.neighborhood}`;
    }

    return item.city || filterCity || "sua região";
  }, [heroProducts, heroIdx, filterCity]);

  // Auto-rotate hero
  useEffect(() => {
    if (heroImages.length <= 1 || isMobile) return;
    const t = setInterval(() => setHeroIdx((prev) => (prev + 1) % heroImages.length), 5000);
    return () => clearInterval(t);
  }, [heroImages.length, isMobile]);

  // Auto-scroll promo on desktop
  useEffect(() => {
    if (isMobile) return;
    const el = promoScrollRef.current;
    if (!el || el.children.length <= 1) return;
    const t = setInterval(() => {
      setPromoIdx((prev) => {
        const next = (prev + 1) % el.children.length;
        const card = el.children[next] as HTMLElement | undefined;
        if (card) {
          const targetLeft = Math.max(0, card.offsetLeft - (el.clientWidth - card.clientWidth) / 2);
          el.scrollTo({ left: targetLeft, behavior: "smooth" });
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [realItems.length, isMobile]);

  // Fullscreen for cinema mode
  useEffect(() => {
    if (cinemaMode !== null) {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().then(() => {
          try { (screen.orientation as any).lock?.("landscape"); } catch {}
        }).catch(() => {});
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      try { (screen.orientation as any).unlock?.(); } catch {}
    }
  }, [cinemaMode]);

  // Cinema products (active items with images)
  const cinemaProducts = useMemo(() => {
    return filteredItems
      .filter((p) => p.image && (p as any).status === "ativo")
      .slice(0, 30);
  }, [filteredItems]);

  const scrollToGrid = () =>
    setTimeout(() => {
      document.getElementById("marketplace-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

  const promoBanners = [
    { slug: "todos", title: ["Todos os", "Imóveis"], desc: "Veja todos os imóveis disponíveis", icon: Home },
    { slug: "casa", title: ["Casa", "Própria"], desc: "As melhores casas para sua família", icon: Building2 },
    { slug: "apartamento", title: ["Aptos", "Modernos"], desc: "Apartamentos com ótima localização", icon: Building2 },
    { slug: "aluguel", title: ["Para", "Alugar"], desc: "Opções de aluguel com ótimo custo-benefício", icon: Key },
  ].filter((b) => b.slug === "todos" || (categoryCounts[b.slug] || 0) > 0);

  return (
    <div style={{ ...themeVars, background: DARK_BASE, color: TEXT }} className="min-h-screen w-full overflow-x-hidden">
      <Helmet>
        <title>{site_name} – Marketplace de Imóveis</title>
        <meta name="description" content="Encontre imóveis de diversos corretores verificados. Casas, apartamentos, terrenos e muito mais." />
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:title" content={`${site_name} – Marketplace de Imóveis`} />
        <meta property="og:description" content="Encontre imóveis de diversos corretores verificados. Casas, apartamentos, terrenos e muito mais." />
        <meta property="og:url" content={SITE_URL} />
      </Helmet>

      <MarketplaceNavbar theme={theme} user={user} showImoveisScroll={true} />

      {/* ═══ HERO — Parallax + Particles ═══ */}
      <motion.section
        ref={heroRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[380px] md:h-[480px] overflow-hidden"
      >
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
              <img
                src={heroImages[heroIdx]}
                alt="Hero"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${DARK_BASE}, ${DARK_MID}, ${PRIMARY})` }} />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <motion.div
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: PRIMARY, opacity: 0.12 }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <FloatingParticles color={PRIMARY} />

        {/* Hero content */}
        <div className="relative z-10 h-full flex flex-col justify-end p-5 md:p-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex items-center gap-2 mb-2"
          >
            <Sparkles size={14} style={{ color: theme.promoAccent || PRIMARY }} />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest" style={{ color: theme.promoAccent || PRIMARY }}>
              Marketplace de Imóveis
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="font-display font-black text-2xl md:text-6xl text-white leading-[1.1] drop-shadow-2xl"
          >
            {filterCity ? (
              <>{currentHeroLabel}</>
            ) : (
              <>Imóveis em<br /><span style={{ color: "#ffffff" }}>{currentHeroLabel}</span></>
            )}
          </motion.h1>

          {/* City selector */}
          {availableCities.length > 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="relative mt-1 lg:hidden">
              <button
                onClick={() => setShowCityPicker(!showCityPicker)}
                className="flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-md"
              >
                <MapPin size={14} />
                {filterCity || "Todas as cidades"}
                <ChevronDown size={14} className={`transition-transform duration-200 ${showCityPicker ? "rotate-180" : ""}`} />
              </button>

              {/* Overlay + City list */}
              {showCityPicker && typeof document !== "undefined"
                ? createPortal(
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[2147483646] bg-black/75 backdrop-blur-md"
                        onClick={() => setShowCityPicker(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[360px] z-[2147483647] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden"
                        style={{ background: CARD_BG, border: `1px solid ${BORDER}`, boxShadow: "0 24px 80px rgba(0,0,0,0.45)" }}
                      >
                        <div className="md:hidden flex justify-center py-2">
                          <div className="w-10 h-1 rounded-full" style={{ background: BORDER }} />
                        </div>
                        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <p className="text-sm font-bold" style={{ color: TEXT }}>Selecionar cidade</p>
                          <button onClick={() => setShowCityPicker(false)} className="p-1 rounded-lg hover:opacity-70">
                            <X size={16} style={{ color: TEXT_MUTED }} />
                          </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
                          <button
                            onClick={() => { setFilterCity(""); setShowCityPicker(false); setPage(1); }}
                            className="w-full text-left px-4 py-3.5 text-sm font-medium flex items-center gap-2.5 transition-colors active:opacity-70"
                            style={{
                              color: !filterCity ? PRIMARY : TEXT,
                              background: !filterCity ? `${PRIMARY}15` : "transparent",
                            }}
                          >
                            <Globe size={15} style={{ color: !filterCity ? PRIMARY : TEXT_MUTED }} />
                            Todas as cidades
                          </button>
                          {citiesByState.map(({ state: uf, cities }) => {
                            const isOpen = openStates.has(uf);
                            const hasActive = cities.includes(filterCity);
                            return (
                              <div key={uf}>
                                <button
                                  onClick={() => {
                                    setOpenStates((prev) => {
                                      if (prev.has(uf)) return new Set();
                                      return new Set([uf]);
                                    });
                                  }}
                                  className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors active:opacity-70"
                                  style={{
                                    color: hasActive ? PRIMARY : TEXT,
                                    borderTop: `1px solid ${BORDER}40`,
                                    background: hasActive ? `${PRIMARY}08` : "transparent",
                                  }}
                                >
                                  <span className="flex items-center gap-2">
                                    <MapPin size={13} style={{ color: hasActive ? PRIMARY : TEXT_MUTED }} />
                                    {uf}
                                  </span>
                                  <ChevronDown
                                    size={14}
                                    style={{
                                      color: TEXT_MUTED,
                                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                      transition: "transform 0.2s",
                                    }}
                                  />
                                </button>
                                {isOpen && cities.map((city) => (
                                  <button
                                    key={city}
                                    onClick={() => { setFilterCity(city); setShowCityPicker(false); setHeroIdx(0); setPage(1); }}
                                    className="w-full text-left pl-9 pr-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors active:opacity-70"
                                    style={{
                                      color: filterCity === city ? PRIMARY : TEXT,
                                      background: filterCity === city ? `${PRIMARY}15` : "transparent",
                                    }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: filterCity === city ? PRIMARY : TEXT_MUTED }} />
                                    {city}
                                  </button>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>,
                    document.body
                  )
                : null}
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-white/60 text-xs md:text-base mt-2 md:mt-3 max-w-md hidden md:block"
          >
            {(() => {
              const itemsInCity = filterCity
                ? realItems.filter((i) => (i.city || "").toLowerCase() === filterCity.toLowerCase() && (i as any).status !== "vendido" && (i as any).status !== "inativo")
                : realItems.filter((i) => (i as any).status !== "vendido" && (i as any).status !== "inativo");
              const sellerIdsInCity = new Set(itemsInCity.map((i) => (i as any).seller_id || (i as any).sellerId));
              const sellersInCity = filterCity
                ? realSellers.filter((s) => sellerIdsInCity.has(s.id) || (s.city || "").toLowerCase() === filterCity.toLowerCase())
                : realSellers;
              return `${itemsInCity.length}+ imóveis de ${sellersInCity.length} corretores verificados${filterCity ? ` em ${filterCity}` : " em um só lugar"}.`;
            })()}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex items-center gap-3 mt-8 md:mt-5 mb-10 md:mb-0"
          >
            <button
              onClick={() => {
                scrollToGrid();
              }}
              className="group inline-flex items-center gap-2 px-5 py-2.5 md:px-7 md:py-3.5 rounded-2xl font-bold text-xs md:text-sm text-white shadow-2xl transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY}bb)`, boxShadow: `0 8px 32px ${PRIMARY}40` }}
            >
              Ver ofertas em {filterCity || "sua região"}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-xs text-white/40">{filteredItems.length} imóveis</span>
          </motion.div>

          {/* Hero indicators */}
          {heroImages.length > 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex gap-1.5 mt-3 md:mt-5">
              {heroImages.map((_: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setHeroIdx(i)}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{ width: i === heroIdx ? 28 : 8, background: i === heroIdx ? PRIMARY : "rgba(255,255,255,0.25)" }}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Cinema mode button — bottom-right of hero */}
        {cinemaProducts.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            onClick={() => setCinemaMode(0)}
            className="absolute bottom-20 md:bottom-16 right-4 md:right-6 z-20 flex items-center justify-center gap-2 w-12 h-12 md:w-auto md:h-auto md:px-5 md:py-3 rounded-full md:rounded-2xl text-sm font-semibold text-white/80 hover:text-white backdrop-blur-md border border-white/15 hover:bg-white/20 transition-all hover:scale-105 shadow-xl"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <Clapperboard size={18} className="text-primary" />
            <span className="hidden md:inline">Modo Cinema</span>
          </motion.button>
        )}
      </motion.section>

      {/* ═══ FLOATING SEARCH BAR ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="px-4 md:px-8 -mt-7 relative z-20"
      >
        <div
          className="flex items-center gap-2 md:gap-3 rounded-2xl px-4 py-3 md:px-5 md:py-4 backdrop-blur-xl"
          style={{ background: `${CARD_BG}ee`, border: `1px solid ${BORDER}`, boxShadow: `0 8px 40px ${PRIMARY}15, 0 2px 8px rgba(0,0,0,0.1)` }}
        >
          <Search size={20} style={{ color: PRIMARY }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Buscar por tipo, bairro ou cidade..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
            style={{ color: TEXT }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-1 rounded-lg hover:opacity-70">
              <X size={16} style={{ color: TEXT_MUTED }} />
            </button>
          )}
          <button
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
            style={{ background: PRIMARY, boxShadow: `0 4px 16px ${PRIMARY}30` }}
            onClick={scrollToGrid}
          >
            Buscar
          </button>
        </div>
      </motion.div>

      {/* ═══ MAIN LAYOUT: SIDEBAR + CONTENT ═══ */}
      <div className="px-4 md:px-8 flex gap-6">

        {/* ── Desktop City Sidebar ── */}
        <aside className="hidden lg:block w-[220px] flex-shrink-0 sticky top-4 self-start mt-8">
          <div className="rounded-2xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <MapPin size={14} style={{ color: PRIMARY }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: TEXT }}>Localização</p>
            </div>
            <div className="max-h-[65vh] overflow-y-auto overscroll-contain">
              <button
                onClick={() => { setFilterCity(""); setPage(1); }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors"
                style={{
                  color: !filterCity ? PRIMARY : TEXT,
                  background: !filterCity ? `${PRIMARY}12` : "transparent",
                }}
              >
                <Globe size={14} style={{ color: !filterCity ? PRIMARY : TEXT_MUTED }} />
                Todas
              </button>
              {citiesByState.map(({ state: uf, cities }) => {
                const isOpen = openStates.has(uf);
                const hasActive = cities.includes(filterCity);
                return (
                  <div key={uf}>
                    <button
                      onClick={() => {
                        setOpenStates((prev) => {
                          if (prev.has(uf)) return new Set();
                          return new Set([uf]);
                        });
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors"
                      style={{
                        color: hasActive ? PRIMARY : TEXT,
                        borderTop: `1px solid ${BORDER}30`,
                        background: hasActive ? `${PRIMARY}08` : "transparent",
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin size={12} style={{ color: hasActive ? PRIMARY : TEXT_MUTED }} />
                        {uf}
                      </span>
                      <ChevronDown
                        size={14}
                        style={{
                          color: TEXT_MUTED,
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </button>
                    {isOpen && cities.map((city) => (
                      <button
                        key={city}
                        onClick={() => { setFilterCity(city); setHeroIdx(0); setPage(1); }}
                        className="w-full text-left pl-8 pr-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
                        style={{
                          color: filterCity === city ? PRIMARY : TEXT,
                          background: filterCity === city ? `${PRIMARY}12` : "transparent",
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: filterCity === city ? PRIMARY : TEXT_MUTED }} />
                        {city}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0">

        {/* ═══ GLOBAL AUTO STORIES ═══ */}
        <GlobalStoriesBar primaryColor={PRIMARY} textColor={TEXT} city={filterCity} />

        {/* ═══ QUICK ACTIONS ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 md:mt-10 mb-6 md:mb-8"
        >
          <div className="flex items-center gap-2 mb-5">
            <Crown size={16} style={{ color: PRIMARY }} />
            <h2 className="font-display font-bold text-lg" style={{ color: TEXT }}>O que você procura?</h2>
          </div>
          <div className="flex gap-2.5 md:gap-3 overflow-x-auto scrollbar-hide py-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-6 md:overflow-visible">
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
                  onClick={() => { setActiveCategory(isActive ? "todos" : action.slug); setPage(1); scrollToGrid(); }}
                  className="flex-shrink-0 flex flex-col items-center justify-start gap-1.5 md:gap-2.5 p-3 md:p-4 rounded-2xl transition-all w-[92px] h-[132px] md:w-auto md:h-auto md:min-w-[100px] relative overflow-hidden"
                  style={{
                    background: isActive ? `${PRIMARY}18` : CARD_BG,
                    border: `1.5px solid ${isActive ? PRIMARY : BORDER}`,
                    boxShadow: isActive ? `0 8px 24px ${PRIMARY}25, inset 0 1px 0 ${PRIMARY}20` : `0 2px 8px rgba(0,0,0,0.06)`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: isActive ? `${PRIMARY}25` : `${BORDER}60`,
                      color: isActive ? PRIMARY : TEXT_MUTED,
                      boxShadow: isActive ? `0 0 16px ${PRIMARY}20` : "none",
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-bold text-center leading-tight min-h-[30px] flex items-center" style={{ color: isActive ? PRIMARY : TEXT }}>{action.name}</span>
                  <span className="text-[10px] leading-tight text-center line-clamp-2 min-h-[24px]" style={{ color: TEXT_MUTED }}>
                    {count > 0 ? `${count} imóveis` : action.desc}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        <ShimmerLine color={PRIMARY} />

        {/* ═══ PROMO BANNERS ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="my-8"
        >
          {/* Mobile carousel */}
          <div className="md:hidden relative">
            <div
              ref={promoScrollRef}
              className="flex gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0"
              style={{ overscrollBehaviorX: "contain" }}
            >
              {promoBanners.map((banner, bIdx) => (
                <motion.div
                  key={banner.slug}
                  className="relative h-40 rounded-2xl overflow-hidden cursor-pointer snap-center flex-shrink-0"
                  style={{ width: "85%", minWidth: "85%", boxShadow: `0 8px 32px ${PRIMARY}18` }}
                  onClick={() => { setActiveCategory(banner.slug); setPage(1); scrollToGrid(); }}
                >
                  <div className="absolute inset-0" style={{ background: theme.promoAccent ? (bIdx === 1 ? `linear-gradient(135deg, ${PRIMARY} 0%, #ffffff 50%, ${theme.promoAccent} 100%)` : `linear-gradient(135deg, ${theme.promoAccent} 0%, #ffffff 50%, ${PRIMARY} 100%)`) : `linear-gradient(135deg, ${DARK_BASE}, ${PRIMARY}cc)` }} />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                  <FloatingParticles color={bIdx === 0 && theme.promoAccent ? theme.promoAccent : PRIMARY} />
                  <div className="relative z-10 h-full flex flex-col justify-center p-5">
                    <h3 className="font-display font-black text-xl text-white leading-tight">
                      {banner.title[0]}<br />{banner.title[1]}
                    </h3>
                    <p className="text-white/60 text-xs mt-2 max-w-[200px]">{banner.desc}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold mt-3" style={{ color: theme.promoExploreColor || "rgba(255,255,255,0.9)" }}>
                      Explorar <ArrowRight size={14} />
                    </span>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10">
                    <banner.icon size={120} className="absolute -right-4 top-1/2 -translate-y-1/2 text-white" />
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
              {promoBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPromoIdx(i)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === promoIdx ? 24 : 8, background: i === promoIdx ? PRIMARY : `${TEXT_MUTED}40` }}
                />
              ))}
            </div>
          </div>

          {/* Desktop grid */}
          <div className="hidden md:grid md:grid-cols-2 gap-4">
            {promoBanners.slice(0, 2).map((banner, bIdx) => (
              <motion.div
                key={banner.slug}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                className="relative h-52 rounded-2xl overflow-hidden group cursor-pointer"
                onClick={() => { setActiveCategory(banner.slug); setPage(1); scrollToGrid(); }}
                style={{ boxShadow: `0 8px 32px ${PRIMARY}18` }}
              >
                <div className="absolute inset-0" style={{ background: theme.promoAccent ? (bIdx === 1 ? `linear-gradient(135deg, ${PRIMARY} 0%, #ffffff 50%, ${theme.promoAccent} 100%)` : `linear-gradient(135deg, ${theme.promoAccent} 0%, #ffffff 50%, ${PRIMARY} 100%)`) : `linear-gradient(135deg, ${DARK_BASE}, ${PRIMARY}cc)` }} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                <FloatingParticles color={bIdx === 0 && theme.promoAccent ? theme.promoAccent : PRIMARY} />
                <div className="relative z-10 h-full flex flex-col justify-center p-6">
                  <h3 className="font-display font-black text-3xl text-white leading-tight">
                    {banner.title[0]}<br />{banner.title[1]}
                  </h3>
                  <p className="text-white/60 text-xs mt-2 max-w-[200px]">{banner.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold mt-3 group-hover:gap-3 transition-all" style={{ color: theme.promoExploreColor || "rgba(255,255,255,0.9)" }}>
                    Explorar <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10">
                  <banner.icon size={140} className="absolute -right-6 top-1/2 -translate-y-1/2 text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <ShimmerLine color={PRIMARY} />

        {/* ═══ RESULTS HEADER ═══ */}
        <div id="marketplace-grid" className="mt-6 mb-4 flex items-center justify-between scroll-mt-20">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: PRIMARY }} />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
              {filteredItems.length} {filteredItems.length === 1 ? "resultado" : "resultados"}
              {filterCity && <span> em <span style={{ color: TEXT }}>{filterCity}</span></span>}
            </p>
          </div>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-xs font-semibold" style={{ color: PRIMARY }}>
              Limpar busca
            </button>
          )}
        </div>

        {/* ═══ PRODUCT GRID ═══ */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-12">
            {Array.from({ length: 8 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 rounded-2xl mb-10" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
            <Search size={40} className="mx-auto mb-4 opacity-20" style={{ color: TEXT_MUTED }} />
            <p className="text-sm font-medium" style={{ color: TEXT_MUTED }}>
              {searchQuery ? "Nenhum resultado para essa busca" : "Nenhum anúncio encontrado"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-12">
              {paginatedItems.map((item, i) => {
                const seller = sellersMap[item.sellerId];
                const firstTag = (item.tags || [])[0];
                const isAluguel = (item.tags || []).includes("aluguel_flex") || item.category === "aluguel";
                const pUrl = productUrl(item);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.5 }}
                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  >
                    <Link
                      to={pUrl}
                      className="block rounded-2xl overflow-hidden group transition-all"
                      style={{ background: CARD_BG, border: `1px solid ${BORDER}`, boxShadow: `0 2px 8px rgba(0,0,0,0.06)` }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${PRIMARY}20, 0 4px 12px rgba(0,0,0,0.1)`; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px rgba(0,0,0,0.06)`; }}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: BORDER }}>
                            <Image size={28} style={{ color: TEXT_MUTED }} />
                          </div>
                        )}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{ background: `linear-gradient(to top, ${PRIMARY}30, transparent 60%)` }}
                        />
                        {/* Tags */}
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                          {firstTag && firstTag !== "aluguel_flex" && (
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold shadow-lg backdrop-blur-sm ${getTagStyle(firstTag)}`}>
                              {getTagLabel(firstTag)}
                            </span>
                          )}
                          {isAluguel && (
                            <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold shadow-lg backdrop-blur-sm text-white" style={{ background: `${PRIMARY}dd` }}>
                              🏠 Aluguel
                            </span>
                          )}
                        </div>


                        {/* Seller badge + plan */}
                        {seller && (
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                              {seller.logo && <img loading="lazy" decoding="async" src={seller.logo} alt="" className="w-4 h-4 rounded-full object-cover" />}
                              <span className="text-[10px] text-white font-medium truncate max-w-[100px]">{seller.name}</span>
                            </div>
                            {seller.tier && seller.tier !== "basico" && (
                              <PackageBadge tier={seller.tier as any} size="sm" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 md:p-3.5">
                        <h3 className="text-[11px] md:text-xs font-bold line-clamp-2 leading-snug mb-1.5" style={{ color: TEXT }}>
                          {item.title}
                        </h3>
                        {item.price && (
                          <p className="text-sm md:text-lg font-black" style={{ color: PRIMARY }}>
                            {formatPrice(item.price)}
                            {isAluguel && <span className="text-[10px] font-normal ml-1" style={{ color: TEXT_MUTED }}>/mês</span>}
                          </p>
                        )}
                        <div className="flex items-center gap-2.5 mt-2.5 text-[10px]" style={{ color: TEXT_MUTED }}>
                          {item.bedrooms && <span className="flex items-center gap-0.5"><Bed size={10} /> {item.bedrooms}</span>}
                          {(item as any).bathrooms && <span className="flex items-center gap-0.5"><Bath size={10} /> {(item as any).bathrooms}</span>}
                          {item.area && <span className="flex items-center gap-0.5"><Ruler size={10} /> {item.area}m²</span>}
                        </div>
                        {item.city && (
                          <p className="text-[10px] mt-2 flex items-center gap-1 truncate" style={{ color: TEXT_MUTED }}>
                            <MapPin size={9} className="flex-shrink-0" />
                            {item.neighborhood ? `${item.neighborhood}, ${item.city}` : item.city}
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center mb-12">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
                  style={{ background: PRIMARY, boxShadow: `0 4px 16px ${PRIMARY}30` }}
                >
                  Carregar mais imóveis
                </button>
              </div>
            )}
          </>
        )}

        {/* ═══ BROKERS ═══ */}
        {realSellers.length > 0 && (() => {
          const TIER_PRIORITY: Record<string, number> = {
            prime_empresa: 1, premium_empresa: 2, essencial_empresa: 3,
            prime: 4, vip: 4, premium: 5, start: 6, basico: 7,
          };
          const pool = filterCity
            ? realSellers.filter((s) => (s.city || "").toLowerCase() === filterCity.toLowerCase())
            : realSellers;
          if (pool.length === 0) return null;
          const sorted = [...pool].sort((a, b) => {
            const pa = TIER_PRIORITY[a.tier || "basico"] ?? 99;
            const pb = TIER_PRIORITY[b.tier || "basico"] ?? 99;
            return pa - pb;
          });
          const displayed = sorted.slice(0, 10);
          return (
          <>
            <ShimmerLine color={PRIMARY} />
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="my-8"
            >
              <div className="flex items-center gap-2 mb-5">
                <Users size={16} style={{ color: PRIMARY }} />
                <h2 className="font-display font-bold text-lg" style={{ color: TEXT }}>
                  Corretores na plataforma
                  <span className="text-xs font-normal ml-2" style={{ color: TEXT_MUTED }}>({pool.length}{filterCity ? ` em ${filterCity}` : ""})</span>
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {displayed.map((seller) => {
                  const tier = (seller.tier || "basico") as string;
                  const isPaid = tier !== "basico";
                  return (
                  <Link
                    key={seller.id}
                    to={`/empresa/${(seller as any).slug || seller.id}`}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all group hover:scale-[1.02] relative"
                    style={{
                      background: CARD_BG,
                      border: `1px solid ${isPaid ? PRIMARY + "40" : BORDER}`,
                      boxShadow: isPaid ? `0 0 12px ${PRIMARY}15` : "none",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${PRIMARY}20`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = isPaid ? `0 0 12px ${PRIMARY}15` : "none"; }}
                  >
                    {seller.logo ? (
                      <img loading="lazy" decoding="async" src={seller.logo} alt={seller.name} className="w-14 h-14 rounded-full object-cover ring-2 transition-all" style={{ borderColor: isPaid ? PRIMARY : BORDER }} />
                    ) : (
                      <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: `${PRIMARY}20`, color: PRIMARY }}>
                        {seller.name.charAt(0)}
                      </div>
                    )}
                    <p className="text-xs font-bold text-center line-clamp-1" style={{ color: TEXT }}>{seller.name}</p>
                    {seller.city && (
                      <p className="text-[10px] flex items-center gap-0.5" style={{ color: TEXT_MUTED }}>
                        <MapPin size={9} /> {seller.city}
                      </p>
                    )}
                    <PackageBadge tier={tier as any} size="sm" />
                  </Link>
                  );
                })}
              </div>
              {pool.length > 10 && (
                <div className="flex justify-center mt-5">
                  <Link
                    to={filterCity ? `/corretores/${filterCity.toLowerCase().replace(/\s+/g, "-")}` : "/corretores"}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.03]"
                    style={{ background: `${PRIMARY}15`, color: PRIMARY, border: `1px solid ${PRIMARY}30` }}
                  >
                    Ver todos os corretores ({pool.length})
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </motion.section>
          </>
          );
        })()}

        {/* ═══ BENEFITS ═══ */}
        <ShimmerLine color={PRIMARY} />
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8"
        >
          {BENEFITS.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={i}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl relative overflow-hidden"
                style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center relative"
                  style={{ background: `${PRIMARY}15`, color: PRIMARY }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{ background: `${PRIMARY}10` }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                  />
                  <Icon size={20} />
                </div>
                <h4 className="text-xs font-bold" style={{ color: TEXT }}>{benefit.title}</h4>
                <p className="text-[10px] leading-relaxed" style={{ color: TEXT_MUTED }}>{benefit.desc}</p>
              </motion.div>
            );
          })}
        </motion.section>

        {/* ═══ CTA FOR BROKERS ═══ */}
        {!user && (
          <>
            <ShimmerLine color={PRIMARY} />
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="my-8"
            >
              <div
                className="relative rounded-2xl p-8 md:p-14 text-center overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${DARK_BASE}, ${DARK_MID}, ${PRIMARY}90)` }}
              >
                <FloatingParticles color="#ffffff" />
                <motion.div
                  className="absolute top-0 right-0 w-60 h-60 rounded-full blur-3xl pointer-events-none"
                  style={{ background: PRIMARY, opacity: 0.15 }}
                  animate={{ scale: [1, 1.5, 1], x: [0, 20, 0] }}
                  transition={{ duration: 8, repeat: Infinity }}
                />
                <div className="relative z-10">
                  <Crown size={32} className="mx-auto mb-4 text-white/80" />
                  <h2 className="font-display font-black text-2xl md:text-3xl text-white mb-3">
                    Quer anunciar seus imóveis?
                  </h2>
                  <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
                    Crie sua loja profissional com app próprio, CRM, galeria de anúncios, notificações push, WhatsApp integrado e muito mais. Comece gratuitamente.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      to="/anunciar"
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:scale-105 shadow-xl"
                      style={{ background: PRIMARY, boxShadow: `0 8px 32px ${PRIMARY}40` }}
                    >
                      <Megaphone size={16} /> Saiba como anunciar
                    </Link>
                    <Link
                      to="/login?trial=7"
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white/80 transition-all hover:text-white border border-white/20 hover:border-white/40"
                    >
                      <UserPlus size={16} /> Criar conta grátis
                    </Link>
                  </div>
                </div>
              </div>
            </motion.section>
          </>
        )}
        </div>{/* end flex-1 main content */}
      </div>{/* end flex sidebar+content */}

      <FooterSimple theme={{ bg: DARK_BASE, text: TEXT, textMuted: TEXT_MUTED, border: BORDER, primary: PRIMARY, accent: theme.promoAccent }} />

      {/* ═══ CINEMA MODE OVERLAY ═══ */}
      <AnimatePresence>
        {cinemaMode !== null && cinemaProducts.length > 0 && (() => {
          const total = cinemaProducts.length;
          const current = cinemaProducts[cinemaMode];
          if (!current) return null;
          const img = current.image;
          const seller = sellersMap[(current as any).seller_id];

          return (
            <motion.div
              key="cinema-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="fixed inset-0 z-[9999] bg-black flex flex-col"
            >
              {/* Image */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`cinema-img-${cinemaMode}`}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <img loading="lazy" decoding="async" src={img} alt={current.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
                </motion.div>
              </AnimatePresence>

              {/* Close */}
              <button
                onClick={() => setCinemaMode(null)}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white text-lg hover:bg-black/60 transition-colors"
              >
                ✕
              </button>

              {/* Arrows */}
              <button
                onClick={() => setCinemaMode((prev) => (prev! - 1 + total) % total)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={() => setCinemaMode((prev) => (prev! + 1) % total)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <ChevronRight size={24} />
              </button>

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 z-40 p-6 md:p-10">
                <motion.div
                  key={`cinema-info-${cinemaMode}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {seller && (
                    <div className="flex items-center gap-2 mb-3">
                      {seller.logo && <img loading="lazy" decoding="async" src={seller.logo} className="w-7 h-7 rounded-full object-cover border border-white/20" alt="" />}
                      <span className="text-white/60 text-sm font-medium">{seller.name}</span>
                    </div>
                  )}
                  <h2 className="text-white font-display font-black text-2xl md:text-4xl leading-tight max-w-2xl">
                    {current.title}
                  </h2>
                  <div className="flex items-center gap-4 mt-3">
                    {current.price && (
                      <span className="text-xl md:text-2xl font-bold" style={{ color: PRIMARY }}>
                        R$ {current.price.toLocaleString("pt-BR")}
                      </span>
                    )}
                    {current.city && (
                      <span className="text-white/50 text-sm flex items-center gap-1">
                        <MapPin size={13} /> {current.city}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-white/40 text-xs">
                    {(current as any).bedrooms && <span>{(current as any).bedrooms} quartos</span>}
                    {(current as any).bathrooms && <span>• {(current as any).bathrooms} banheiros</span>}
                    {(current as any).area && <span>• {(current as any).area}m²</span>}
                  </div>
                  <Link
                    to={`/imoveis/produto/${(current as any).slug || current.id}`}
                    onClick={() => setCinemaMode(null)}
                    className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                    style={{ background: PRIMARY, boxShadow: `0 4px 20px ${PRIMARY}40` }}
                  >
                    Ver detalhes <ArrowRight size={14} />
                  </Link>
                </motion.div>
              </div>

              {/* Counter */}
              <div className="absolute top-5 left-5 z-50">
                <p className="text-white/40 text-xs">{cinemaMode + 1} de {total}</p>
              </div>

              {/* Auto-advance progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-50">
                <motion.div
                  key={`cinema-progress-${cinemaMode}`}
                  className="h-full"
                  style={{ background: PRIMARY }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 8, ease: "linear" }}
                  onAnimationComplete={() => setCinemaMode((prev) => (prev! + 1) % total)}
                />
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <HomePwaActions primaryColor={PRIMARY} />
    </div>
  );
}

