import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Users, Building2, Phone, BadgeCheck, ArrowRight,
  Crown, Star, Shield, Sparkles, Award, TrendingUp, MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PackageBadge from "@/components/PackageBadge";
import SeoPageLayout, { useSeoTheme, FloatingParticles, ShimmerLine } from "@/components/seo/SeoPageLayout";
import { SITE_URL } from "@/lib/siteUrl";

const SELLER_CATEGORY_LABELS: Record<string, string> = {
  imobiliaria: "Imobiliária", corretor: "Corretor(a)", construtora: "Construtora",
  proprietario: "Proprietário", loja_veiculos: "Loja de Veículos",
  autonomo: "Autônomo", concessionaria: "Concessionária",
};

const TIER_WEIGHT: Record<string, number> = {
  prime_empresa: 70, vip: 70,
  premium_empresa: 40, premium: 40,
  essencial_empresa: 20, start: 20,
  basico_empresa: 10, basico: 10,
};

const TIER_GLOW: Record<string, string> = {
  prime_empresa: "0 0 30px rgba(100,100,100,0.4), 0 0 60px rgba(100,100,100,0.15)",
  premium_empresa: "0 0 30px rgba(14,165,233,0.35), 0 0 60px rgba(14,165,233,0.12)",
  essencial_empresa: "0 0 30px rgba(225,29,72,0.3), 0 0 60px rgba(225,29,72,0.1)",
  vip: "0 0 24px rgba(147,51,234,0.35), 0 0 50px rgba(147,51,234,0.1)",
  premium: "0 0 20px rgba(245,158,11,0.3), 0 0 40px rgba(245,158,11,0.08)",
  start: "0 0 16px rgba(16,185,129,0.25)",
};

const BRAZILIAN_STATES: Record<string, string> = {
  ac: "Acre", al: "Alagoas", ap: "Amapá", am: "Amazonas", ba: "Bahia",
  ce: "Ceará", df: "Distrito Federal", es: "Espírito Santo", go: "Goiás",
  ma: "Maranhão", mt: "Mato Grosso", ms: "Mato Grosso do Sul", mg: "Minas Gerais",
  pa: "Pará", pb: "Paraíba", pr: "Paraná", pe: "Pernambuco", pi: "Piauí",
  rj: "Rio de Janeiro", rn: "Rio Grande do Norte", rs: "Rio Grande do Sul",
  ro: "Rondônia", rr: "Roraima", sc: "Santa Catarina", sp: "São Paulo",
  se: "Sergipe", to: "Tocantins",
};

function slugify(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function AnimatedCounter({ target, label, icon: Icon, color }: { target: number; label: string; icon: any; color: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target <= 0) return;
    let frame: number;
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: `${color}15`, boxShadow: `0 4px 16px ${color}15` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <p className="font-display font-black text-2xl md:text-3xl" style={{ color }}>{count}</p>
      <p className="text-[10px] md:text-xs mt-0.5 opacity-60">{label}</p>
    </motion.div>
  );
}

/* ═══ Featured broker card (top 3 premium) ═══ */
function FeaturedBrokerCard({ profile, tier, theme, delay }: { profile: any; tier?: string; theme: any; delay: number }) {
  const { primary: PRIMARY, cardBg: CARD_BG, border: BORDER, text: TEXT, textMuted: TEXT_MUTED } = theme;
  const displayName = profile.company_name || profile.full_name;
  const categoryLabel = profile.seller_category ? SELLER_CATEGORY_LABELS[profile.seller_category] : null;

  return (
    <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay, duration: 0.6, type: "spring" }}>
      <Link to={`/empresa/${profile.slug}`} className="block rounded-3xl overflow-hidden transition-all duration-500 group hover:scale-[1.03] relative" style={{ background: CARD_BG, border: `2px solid ${PRIMARY}50`, boxShadow: TIER_GLOW[tier || ""] || `0 8px 32px ${PRIMARY}20` }}>
        {/* Glow overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${PRIMARY}12 0%, transparent 70%)` }} />

        {/* Header with gradient */}
        <div className="relative h-32 md:h-40 flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${PRIMARY}25, ${PRIMARY}08 50%, ${CARD_BG})` }}>
          <FloatingParticles color={PRIMARY} />
          <motion.div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: PRIMARY, opacity: 0.08 }} animate={{ scale: [1, 1.4, 1], opacity: [0.05, 0.12, 0.05] }} transition={{ duration: 5, repeat: Infinity }} />

          {profile.logo_url ? (
            <img loading="lazy" decoding="async" src={profile.logo_url} alt={displayName} className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-4 shadow-2xl z-10 group-hover:scale-110 transition-transform duration-500" style={{ borderColor: `${PRIMARY}30` }} />
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center border-4 shadow-2xl z-10" style={{ background: `linear-gradient(135deg, ${PRIMARY}30, ${PRIMARY}10)`, color: PRIMARY, borderColor: `${PRIMARY}30` }}>
              <Building2 size={32} />
            </div>
          )}

          {tier && (
            <div className="absolute top-3 right-3 z-10"><PackageBadge tier={tier as any} size="md" /></div>
          )}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: `${PRIMARY}20`, color: PRIMARY, backdropFilter: "blur(8px)" }}>
            <Award size={12} /> Destaque
          </div>
        </div>

        <div className="p-4 md:p-5">
          <h3 className="font-display font-black text-sm md:text-lg line-clamp-1" style={{ color: TEXT }}>{displayName}</h3>

          {categoryLabel && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <BadgeCheck size={14} style={{ color: PRIMARY }} />
              <span className="text-[11px] md:text-xs font-semibold" style={{ color: PRIMARY }}>{categoryLabel}</span>
            </div>
          )}

          {profile.bio && (
            <p className="text-[11px] md:text-xs mt-2 line-clamp-2 leading-relaxed" style={{ color: TEXT_MUTED }}>{profile.bio}</p>
          )}

          {(profile.city || profile.state) && (
            <p className="text-[11px] mt-2 flex items-center gap-1" style={{ color: TEXT_MUTED }}>
              <MapPin size={11} className="flex-shrink-0" /> {[profile.city, profile.state].filter(Boolean).join(", ")}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.creci && (
              <span className="text-[10px] px-2.5 py-1 rounded-lg font-bold" style={{ background: `${PRIMARY}12`, color: PRIMARY, border: `1px solid ${PRIMARY}25` }}>
                <Shield size={9} className="inline mr-1" />CRECI: {profile.creci}
              </span>
            )}
            {profile.cnpj && (
              <span className="text-[10px] px-2.5 py-1 rounded-lg font-medium" style={{ background: `${BORDER}60`, color: TEXT_MUTED }}>CNPJ: {profile.cnpj}</span>
            )}
          </div>

          <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER}` }}>
            <span className="text-xs font-bold group-hover:underline flex items-center gap-1.5" style={{ color: PRIMARY }}>
              Ver perfil <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
            {profile.phone && (
              <span className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "#25D36620", color: "#25D366" }}>
                <MessageCircle size={10} /> WhatsApp
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ═══ Regular broker card ═══ */
function BrokerCard({ profile, tier, theme, index }: { profile: any; tier?: string; theme: any; index: number }) {
  const { primary: PRIMARY, cardBg: CARD_BG, border: BORDER, text: TEXT, textMuted: TEXT_MUTED } = theme;
  const displayName = profile.company_name || profile.full_name;
  const categoryLabel = profile.seller_category ? SELLER_CATEGORY_LABELS[profile.seller_category] : null;
  const isPaid = tier && tier !== "basico";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.6) }}>
      <Link to={`/empresa/${profile.slug}`} className="block rounded-2xl overflow-hidden transition-all duration-300 group hover:scale-[1.03] hover:-translate-y-1" style={{ background: CARD_BG, border: `1.5px solid ${isPaid ? PRIMARY + "40" : BORDER}`, boxShadow: isPaid ? (TIER_GLOW[tier!] || `0 0 16px ${PRIMARY}12`) : "none" }}>
        <div className="relative h-36 flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${PRIMARY}18, ${PRIMARY}05)` }}>
          {isPaid && <FloatingParticles color={PRIMARY} />}
          {profile.logo_url ? (
            <img loading="lazy" decoding="async" src={profile.logo_url} alt={displayName} className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover border-3 shadow-xl z-10 group-hover:scale-110 transition-transform duration-500" style={{ borderColor: CARD_BG }} />
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center border-3 shadow-xl z-10" style={{ background: `${PRIMARY}15`, color: PRIMARY, borderColor: CARD_BG }}>
              <Building2 size={32} />
            </div>
          )}
          {tier && tier !== "basico" && (
            <div className="absolute top-2 right-2 z-10"><PackageBadge tier={tier as any} size="sm" /></div>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-display font-bold text-xs md:text-sm line-clamp-1" style={{ color: TEXT }}>{displayName}</h3>
          {categoryLabel && (
            <div className="flex items-center gap-1 mt-1">
              <BadgeCheck size={12} style={{ color: PRIMARY }} />
              <span className="text-[10px] font-medium" style={{ color: PRIMARY }}>{categoryLabel}</span>
            </div>
          )}
          {(profile.city || profile.state) && (
            <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: TEXT_MUTED }}>
              <MapPin size={10} /> {[profile.city, profile.state].filter(Boolean).join(", ")}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {profile.creci && (
              <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>CRECI: {profile.creci}</span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold group-hover:underline" style={{ color: PRIMARY }}>Ver perfil →</span>
            {profile.phone && (
              <span className="text-[9px] flex items-center gap-0.5" style={{ color: TEXT_MUTED }}><Phone size={9} /> WhatsApp</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function SeoBrokersPage() {
  const { estado, cidade } = useParams<{ estado?: string; cidade?: string }>();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [tiers, setTiers] = useState<Record<string, string>>({});
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const theme = useSeoTheme();
  const { primary: PRIMARY, cardBg: CARD_BG, border: BORDER, text: TEXT, textMuted: TEXT_MUTED } = theme;

  // Detect if `:estado` param is actually a city name (not a known 2-letter state code)
  const isStateCode = estado && estado.length <= 2 && !!BRAZILIAN_STATES[estado.toLowerCase()];
  const resolvedStateCode = isStateCode ? estado.toUpperCase() : "";
  const resolvedCitySlug = cidade || (!isStateCode && estado ? estado : "");
  
  const stateName = resolvedStateCode ? (BRAZILIAN_STATES[resolvedStateCode.toLowerCase()] || resolvedStateCode) : "";
  const stateCode = resolvedStateCode;
  const cityName = resolvedCitySlug ? resolvedCitySlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let query = supabase.from("profiles")
        .select("id, full_name, company_name, slug, city, state, logo_url, phone, creci, cnpj, seller_category, bio, seller_type")
        .eq("seller_type", "imoveis").not("slug", "is", null);
      if (stateCode) query = query.eq("state", stateCode);
      if (cityName) query = query.ilike("city", `%${cityName}%`);
      const { data } = await query.limit(200);
      setProfiles(data || []);
      if (data && data.length > 0) {
        const ids = data.map(p => p.id);
        const { data: subs } = await supabase.from("seller_subscriptions").select("seller_id, tier").in("seller_id", ids).eq("is_active", true);
        const map: Record<string, string> = {};
        subs?.forEach(s => { map[s.seller_id] = s.tier; });
        setTiers(map);

        // Fetch property images from these brokers
        const { data: itemsData } = await supabase
          .from("seller_items")
          .select("photos")
          .in("seller_id", ids)
          .eq("status", "ativo")
          .not("photos", "is", null)
          .limit(30);
        const imgs: string[] = [];
        (itemsData || []).forEach((item: any) => {
          if (item.photos?.[0] && !imgs.includes(item.photos[0])) imgs.push(item.photos[0]);
        });
        // Shuffle
        for (let i = imgs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
        }
        setHeroImages(imgs.slice(0, 12));
      }
      setLoading(false);
    };
    fetchData();
  }, [stateCode, cityName]);

  const filteredProfiles = useMemo(() => {
    let list = [...profiles];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.full_name?.toLowerCase().includes(q) || p.company_name?.toLowerCase().includes(q) || p.creci?.toLowerCase().includes(q) || p.cnpj?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q));
    }
    list.sort((a, b) => (TIER_WEIGHT[tiers[b.id] || "basico"] || 1) - (TIER_WEIGHT[tiers[a.id] || "basico"] || 1));
    return list;
  }, [profiles, tiers, search]);

  // Split featured (top paid) vs regular
  const featuredProfiles = useMemo(() => {
    return filteredProfiles.filter(p => {
      const t = tiers[p.id];
      return t && t !== "basico" && t !== "start";
    }).slice(0, 6);
  }, [filteredProfiles, tiers]);

  const regularProfiles = useMemo(() => {
    const featuredIds = new Set(featuredProfiles.map(p => p.id));
    return filteredProfiles.filter(p => !featuredIds.has(p.id));
  }, [filteredProfiles, featuredProfiles]);

  const citiesInState = useMemo(() => {
    if (!stateCode || cityName) return [];
    const map = new Map<string, string>();
    profiles.forEach(p => { if (p.city) map.set(slugify(p.city), p.city); });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [profiles, stateCode, cityName]);

  const statesAvailable = useMemo(() => {
    if (stateCode) return [];
    const set = new Map<string, number>();
    profiles.forEach(p => { if (p.state) set.set(p.state, (set.get(p.state) || 0) + 1); });
    return Array.from(set.entries()).sort((a, b) => b[1] - a[1]);
  }, [profiles, stateCode]);

  const stats = useMemo(() => {
    const categories = new Set(profiles.map(p => p.seller_category).filter(Boolean));
    const cities = new Set(profiles.map(p => p.city).filter(Boolean));
    const withCreci = profiles.filter(p => p.creci).length;
    return { total: filteredProfiles.length, categories: categories.size, cities: cities.size, verified: withCreci };
  }, [profiles, filteredProfiles]);

  const pageTitle = useMemo(() => {
    if (cityName && stateName) return `Corretores de Imóveis em ${cityName}, ${stateName}`;
    if (cityName) return `Corretores de Imóveis em ${cityName}`;
    if (stateName) return `Corretores de Imóveis no ${stateName}`;
    return "Corretores de Imóveis - Profissionais Verificados";
  }, [cityName, stateName]);

  const metaDesc = useMemo(() => {
    if (cityName && stateName) return `Encontre corretores de imóveis em ${cityName}, ${stateName}. ${filteredProfiles.length} profissionais com CRECI verificado.`;
    if (cityName) return `Encontre corretores de imóveis em ${cityName}. ${filteredProfiles.length} profissionais verificados disponíveis.`;
    if (stateName) return `Lista de corretores e imobiliárias no ${stateName}. Profissionais verificados com CRECI ativo.`;
    return "Encontre corretores de imóveis verificados em todo o Brasil. Busque por cidade, estado, CRECI ou CNPJ.";
  }, [cityName, stateName, filteredProfiles.length]);

  const jsonLd = {
    "@context": "https://schema.org", "@type": "ItemList", name: pageTitle, description: metaDesc, numberOfItems: filteredProfiles.length,
    itemListElement: filteredProfiles.slice(0, 20).map((p, i) => ({
      "@type": "ListItem", position: i + 1,
      item: { "@type": "RealEstateAgent", name: p.company_name || p.full_name, url: `${SITE_URL}/empresa/${p.slug}`, ...(p.logo_url && { image: p.logo_url }), ...(p.phone && { telephone: p.phone }), address: { "@type": "PostalAddress", ...(p.city && { addressLocality: p.city }), ...(p.state && { addressRegion: p.state }), addressCountry: "BR" } },
    })),
  };

  const canonicalPath = cityName && stateCode ? `/corretores/${stateCode.toLowerCase()}/${slugify(cityName)}` : cityName ? `/corretores/${slugify(cityName)}` : stateCode ? `/corretores/${stateCode.toLowerCase()}` : "/corretores";

  const breadcrumbs = [
    { label: "Início", to: "/" },
    { label: "Corretores", to: "/corretores" },
    ...(stateName && cityName ? [{ label: stateName, to: `/corretores/${stateCode.toLowerCase()}` }] : []),
    ...(stateName && !cityName ? [{ label: stateName }] : []),
    ...(cityName ? [{ label: cityName }] : []),
  ];

  return (
    <SeoPageLayout
      theme={theme}
      title={pageTitle}
      metaDescription={metaDesc}
      canonical={`${SITE_URL}${canonicalPath}`}
      jsonLd={jsonLd}
      breadcrumbs={breadcrumbs}
      heroImages={heroImages}
      heroTagline="Corretores Verificados"
      heroSubtitle={
        <span className="flex items-center gap-2">
          <Users size={16} />
          {loading ? "Carregando..." : `${filteredProfiles.length} profissionais encontrados`}
        </span>
      }
      searchPlaceholder="Buscar por nome, CRECI, CNPJ ou cidade..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      {/* ═══ ANIMATED STATS ═══ */}
      {!loading && stats.total > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="max-w-6xl mx-auto px-4 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 rounded-2xl p-5 md:p-6" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
            <AnimatedCounter target={stats.total} label="Profissionais" icon={Users} color={PRIMARY} />
            <AnimatedCounter target={stats.verified} label="CRECI Verificado" icon={Shield} color="#10B981" />
            <AnimatedCounter target={stats.cities} label="Cidades" icon={MapPin} color={theme.promoAccent || "#F59E0B"} />
            <AnimatedCounter target={stats.categories} label="Categorias" icon={TrendingUp} color={theme.promoExploreColor || "#8B5CF6"} />
          </div>
        </motion.div>
      )}

      {/* States links */}
      {!stateCode && statesAvailable.length > 0 && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="max-w-6xl mx-auto px-4 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={16} style={{ color: PRIMARY }} />
            <h2 className="font-display font-bold text-lg" style={{ color: TEXT }}>Buscar por Estado</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {statesAvailable.map(([st, count]) => (
              <Link key={st} to={`/corretores/${st.toLowerCase()}`} className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 hover:shadow-lg" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }}>
                {BRAZILIAN_STATES[st.toLowerCase()] || st} <span className="ml-1 opacity-50">({count})</span>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* Cities links */}
      {stateCode && !cityName && citiesInState.length > 0 && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="max-w-6xl mx-auto px-4 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} style={{ color: PRIMARY }} />
            <h2 className="font-display font-bold text-lg" style={{ color: TEXT }}>Cidades em {stateName}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {citiesInState.map(([slug, name]) => (
              <Link key={slug} to={`/corretores/${estado}/${slug}`} className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 hover:shadow-lg" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }}>
                {name}
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      <ShimmerLine color={PRIMARY} />

      {/* ═══ FEATURED BROKERS ═══ */}
      {featuredProfiles.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-8 pb-2">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY}aa)` }}>
              <Star size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg" style={{ color: TEXT }}>Corretores em Destaque</h2>
              <p className="text-[10px]" style={{ color: TEXT_MUTED }}>Profissionais premium verificados</p>
            </div>
          </motion.div>
          <div className={`grid gap-4 ${featuredProfiles.length === 1 ? "grid-cols-1 max-w-md" : featuredProfiles.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"}`}>
            {featuredProfiles.map((p, i) => (
              <FeaturedBrokerCard key={p.id} profile={p} tier={tiers[p.id]} theme={theme} delay={0.2 + i * 0.15} />
            ))}
          </div>
        </section>
      )}

      {featuredProfiles.length > 0 && <ShimmerLine color={PRIMARY} />}

      {/* ═══ ALL PROFILES GRID ═══ */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Users size={16} style={{ color: PRIMARY }} />
          <h2 className="font-display font-bold text-lg" style={{ color: TEXT }}>
            {loading ? "Carregando..." : regularProfiles.length > 0 ? `${regularProfiles.length} corretor(es)` : featuredProfiles.length > 0 ? "" : `${filteredProfiles.length} corretor(es)`}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: CARD_BG }} />
            ))}
          </div>
        ) : regularProfiles.length === 0 && featuredProfiles.length === 0 ? (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto mb-4" style={{ color: TEXT_MUTED }} />
            <p style={{ color: TEXT_MUTED }}>Nenhum corretor encontrado</p>
            <Link to="/corretores" className="mt-4 inline-flex items-center gap-2 font-semibold" style={{ color: PRIMARY }}>
              Ver todos os corretores <ArrowRight size={16} />
            </Link>
          </div>
        ) : regularProfiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {regularProfiles.map((profile, i) => (
              <BrokerCard key={profile.id} profile={profile} tier={tiers[profile.id]} theme={theme} index={i} />
            ))}
          </div>
        ) : null}
      </section>
    </SeoPageLayout>
  );
}
