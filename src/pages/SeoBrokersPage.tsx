import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  MapPin, Users, Search, Building2, Phone, BadgeCheck, ArrowRight,
  Sparkles, Crown, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PackageBadge from "@/components/PackageBadge";
import { Input } from "@/components/ui/input";
import FooterSimple from "@/components/FooterSimple";
import MarketplaceNavbar from "@/components/MarketplaceNavbar";
import { getMarketplaceTheme } from "@/lib/marketplaceThemes";

const SELLER_CATEGORY_LABELS: Record<string, string> = {
  imobiliaria: "Imobiliária", corretor: "Corretor(a)", construtora: "Construtora",
  proprietario: "Proprietário", loja_veiculos: "Loja de Veículos",
  autonomo: "Autônomo", concessionaria: "Concessionária",
};

const TIER_WEIGHT: Record<string, number> = {
  prime_empresa: 200, premium_empresa: 140, essencial_empresa: 100,
  vip: 70, premium: 40, start: 20, basico: 10,
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

function FloatingParticles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div key={i} className="absolute rounded-full" style={{ width: Math.random() * 4 + 2, height: Math.random() * 4 + 2, background: color, opacity: 0.15 + Math.random() * 0.2, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -40 - Math.random() * 60, 0], x: [0, (Math.random() - 0.5) * 30, 0], opacity: [0.1, 0.35, 0.1] }}
          transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function ShimmerLine({ color = "#3B82F6" }: { color?: string }) {
  return (
    <motion.div className="h-[1px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
      animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
  );
}

export default function SeoBrokersPage() {
  const { estado, cidade } = useParams<{ estado?: string; cidade?: string }>();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [tiers, setTiers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [themeId, setThemeId] = useState(() => localStorage.getItem("marketplace_theme") || "azul");
  useEffect(() => {
    supabase.from("platform_settings").select("value").eq("key", "homepage_theme").maybeSingle().then(({ data }) => {
      if (data?.value) { setThemeId(data.value); localStorage.setItem("marketplace_theme", data.value); }
    });
  }, []);
  const theme = getMarketplaceTheme(themeId);
  const { primary: PRIMARY, darkBase: DARK_BASE, darkMid: DARK_MID, cardBg: CARD_BG, border: BORDER, text: TEXT, textMuted: TEXT_MUTED } = theme;

  const stateName = estado ? (BRAZILIAN_STATES[estado.toLowerCase()] || estado.toUpperCase()) : "";
  const stateCode = estado?.toUpperCase() || "";
  const cityName = cidade?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "";

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

  const pageTitle = useMemo(() => {
    if (cityName && stateName) return `Corretores de Imóveis em ${cityName}, ${stateName}`;
    if (stateName) return `Corretores de Imóveis no ${stateName}`;
    return "Corretores de Imóveis - Profissionais Verificados";
  }, [cityName, stateName]);

  const metaDesc = useMemo(() => {
    if (cityName) return `Encontre corretores de imóveis em ${cityName}, ${stateName}. ${filteredProfiles.length} profissionais com CRECI verificado.`;
    if (stateName) return `Lista de corretores e imobiliárias no ${stateName}. Profissionais verificados com CRECI ativo.`;
    return "Encontre corretores de imóveis verificados em todo o Brasil. Busque por cidade, estado, CRECI ou CNPJ.";
  }, [cityName, stateName, filteredProfiles.length]);

  const jsonLd = {
    "@context": "https://schema.org", "@type": "ItemList", name: pageTitle, description: metaDesc, numberOfItems: filteredProfiles.length,
    itemListElement: filteredProfiles.slice(0, 20).map((p, i) => ({
      "@type": "ListItem", position: i + 1,
      item: { "@type": "RealEstateAgent", name: p.company_name || p.full_name, url: `https://blackbroker.lovable.app/empresa/${p.slug}`, ...(p.logo_url && { image: p.logo_url }), ...(p.phone && { telephone: p.phone }), address: { "@type": "PostalAddress", ...(p.city && { addressLocality: p.city }), ...(p.state && { addressRegion: p.state }), addressCountry: "BR" } },
    })),
  };

  const canonicalPath = cityName && estado ? `/corretores/${estado}/${slugify(cityName)}` : estado ? `/corretores/${estado}` : "/corretores";
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <div style={{ background: DARK_BASE, color: TEXT, overflowX: "clip", maxWidth: "100%" }} className="min-h-screen">
      <Helmet>
        <title>{`${pageTitle} | Brokers App`}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={`https://blackbroker.lovable.app${canonicalPath}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <MarketplaceNavbar theme={theme} user={null} showImoveisScroll={false} />

      {/* ═══ HERO ═══ */}
      <motion.section ref={heroRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="relative h-[240px] md:h-[380px] overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroY, background: `linear-gradient(135deg, ${DARK_BASE}, ${DARK_MID} 40%, ${PRIMARY}90)` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <motion.div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: PRIMARY, opacity: 0.15 }} animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 6, repeat: Infinity }} />
        <FloatingParticles color={PRIMARY} />

        <div className="relative z-10 h-full flex flex-col justify-end p-5 md:p-12 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-white/50 text-xs mb-3 flex-wrap">
            <Link to="/" className="hover:text-white transition-colors">Início</Link>
            <span>/</span>
            <Link to="/corretores" className="hover:text-white transition-colors">Corretores</Link>
            {stateName && <><span>/</span>{cityName ? <Link to={`/corretores/${estado}`} className="hover:text-white transition-colors">{stateName}</Link> : <span className="text-white/80">{stateName}</span>}</>}
            {cityName && <><span>/</span><span className="text-white/80">{cityName}</span></>}
          </div>

          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="flex items-center gap-2 mb-2">
            <Sparkles size={14} style={{ color: theme.promoAccent || PRIMARY }} />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest" style={{ color: theme.promoAccent || PRIMARY }}>Corretores Verificados</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="font-display font-black text-2xl md:text-5xl text-white leading-[1.1] drop-shadow-2xl">
            {pageTitle}
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-white/60 text-xs md:text-base mt-2 flex items-center gap-2">
            <Users size={16} />
            {loading ? "Carregando..." : `${filteredProfiles.length} profissionais encontrados`}
          </motion.p>
        </div>
      </motion.section>

      {/* ═══ SEARCH ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="max-w-6xl mx-auto px-4 -mt-7 relative z-20">
        <div className="flex items-center gap-2 md:gap-3 rounded-2xl px-4 py-3 md:px-5 md:py-4 backdrop-blur-xl" style={{ background: `${CARD_BG}ee`, border: `1px solid ${BORDER}`, boxShadow: `0 8px 40px ${PRIMARY}15` }}>
          <Search size={20} style={{ color: PRIMARY }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, CRECI, CNPJ ou cidade..." className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40" style={{ color: TEXT }} />
          {search && <button onClick={() => setSearch("")} className="p-1 rounded-lg hover:opacity-70"><X size={16} style={{ color: TEXT_MUTED }} /></button>}
        </div>
      </motion.div>

      {/* States links */}
      {!stateCode && statesAvailable.length > 0 && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="max-w-6xl mx-auto px-4 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={16} style={{ color: PRIMARY }} />
            <h2 className="font-display font-bold text-lg" style={{ color: TEXT }}>Buscar por Estado</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {statesAvailable.map(([st, count]) => (
              <Link key={st} to={`/corretores/${st.toLowerCase()}`} className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }}>
                {BRAZILIAN_STATES[st.toLowerCase()] || st} ({count})
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
              <Link key={slug} to={`/corretores/${estado}/${slug}`} className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }}>
                {name}
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      <ShimmerLine color={PRIMARY} />

      {/* ═══ PROFILES GRID ═══ */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Users size={16} style={{ color: PRIMARY }} />
          <h2 className="font-display font-bold text-lg" style={{ color: TEXT }}>
            {loading ? "Carregando..." : `${filteredProfiles.length} corretor(es)`}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: CARD_BG }} />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto mb-4" style={{ color: TEXT_MUTED }} />
            <p style={{ color: TEXT_MUTED }}>Nenhum corretor encontrado</p>
            <Link to="/corretores" className="mt-4 inline-flex items-center gap-2 font-semibold" style={{ color: PRIMARY }}>
              Ver todos os corretores <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProfiles.map((profile, i) => {
              const tier = tiers[profile.id];
              const displayName = profile.company_name || profile.full_name;
              const categoryLabel = profile.seller_category ? SELLER_CATEGORY_LABELS[profile.seller_category] || profile.seller_category : null;
              const isPaid = tier && tier !== "basico";

              return (
                <motion.div key={profile.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}>
                  <Link to={`/empresa/${profile.slug}`} className="block rounded-2xl overflow-hidden transition-all duration-300 group hover:scale-[1.02]" style={{ background: CARD_BG, border: `1.5px solid ${isPaid ? PRIMARY + "40" : BORDER}`, boxShadow: isPaid ? `0 0 16px ${PRIMARY}12` : "none" }}>
                    {/* Header */}
                    <div className="relative h-24 flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${PRIMARY}20, ${PRIMARY}05)` }}>
                      <FloatingParticles color={PRIMARY} />
                      {profile.logo_url ? (
                        <img src={profile.logo_url} alt={displayName} className="w-16 h-16 rounded-full object-cover border-4 shadow-lg z-10" style={{ borderColor: CARD_BG }} />
                      ) : (
                        <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-lg z-10" style={{ background: `${PRIMARY}20`, color: PRIMARY, borderColor: CARD_BG }}>
                          <Building2 size={24} />
                        </div>
                      )}
                      {tier && (
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
                        {profile.cnpj && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${BORDER}80`, color: TEXT_MUTED }}>CNPJ: {profile.cnpj}</span>
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
            })}
          </div>
        )}
      </section>

      {/* ═══ SEO TEXT ═══ */}
      <ShimmerLine color={PRIMARY} />
      <section className="max-w-4xl mx-auto px-4 py-8 pb-12">
        <div className="rounded-2xl p-6 md:p-8" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
          <h2 className="font-display font-bold text-xl mb-4" style={{ color: TEXT }}>
            {cityName ? `Corretores em ${cityName}, ${stateName}` : stateName ? `Corretores no ${stateName}` : "Encontre Corretores de Imóveis"}
          </h2>
          <div className="text-sm leading-relaxed space-y-3" style={{ color: TEXT_MUTED }}>
            <p>{metaDesc}</p>
            <p>O Brokers App é a plataforma que conecta compradores e vendedores diretamente com corretores de imóveis verificados em todo o Brasil. Busque por estado, cidade, CRECI ou CNPJ para encontrar o profissional ideal.</p>
          </div>
        </div>
      </section>

      <FooterSimple theme={{ bg: DARK_BASE, text: TEXT, textMuted: TEXT_MUTED, border: BORDER, primary: PRIMARY }} />
    </div>
  );
}
