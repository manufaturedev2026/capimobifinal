import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { MapPin, Users, Search, Building2, Phone, BadgeCheck, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PackageBadge from "@/components/PackageBadge";
import { Input } from "@/components/ui/input";

const SELLER_CATEGORY_LABELS: Record<string, string> = {
  imobiliaria: "Imobiliária",
  corretor: "Corretor(a)",
  construtora: "Construtora",
  proprietario: "Proprietário",
  loja_veiculos: "Loja de Veículos",
  autonomo: "Autônomo",
  concessionaria: "Concessionária",
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

export default function SeoBrokersPage() {
  const { estado, cidade } = useParams<{ estado?: string; cidade?: string }>();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [tiers, setTiers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const stateName = estado ? (BRAZILIAN_STATES[estado.toLowerCase()] || estado.toUpperCase()) : "";
  const stateCode = estado?.toUpperCase() || "";
  const cityName = cidade?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select("id, full_name, company_name, slug, city, state, logo_url, phone, creci, cnpj, seller_category, bio, seller_type")
        .eq("seller_type", "imoveis")
        .not("slug", "is", null);

      if (stateCode) query = query.eq("state", stateCode);
      if (cityName) query = query.ilike("city", `%${cityName}%`);

      const { data } = await query.limit(200);
      setProfiles(data || []);

      if (data && data.length > 0) {
        const ids = data.map(p => p.id);
        const { data: subs } = await supabase
          .from("seller_subscriptions")
          .select("seller_id, tier")
          .in("seller_id", ids)
          .eq("is_active", true);
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
      list = list.filter(p =>
        (p.full_name?.toLowerCase().includes(q)) ||
        (p.company_name?.toLowerCase().includes(q)) ||
        (p.creci?.toLowerCase().includes(q)) ||
        (p.cnpj?.toLowerCase().includes(q)) ||
        (p.city?.toLowerCase().includes(q))
      );
    }
    // Weighted sort by tier
    list.sort((a, b) => {
      const wA = TIER_WEIGHT[tiers[a.id] || "basico"] || 1;
      const wB = TIER_WEIGHT[tiers[b.id] || "basico"] || 1;
      return wB - wA;
    });
    return list;
  }, [profiles, tiers, search]);

  // Extract unique cities for internal linking
  const citiesInState = useMemo(() => {
    if (!stateCode || cityName) return [];
    const map = new Map<string, string>();
    profiles.forEach(p => { if (p.city) map.set(slugify(p.city), p.city); });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [profiles, stateCode, cityName]);

  // Extract unique states for global page
  const statesAvailable = useMemo(() => {
    if (stateCode) return [];
    const set = new Map<string, number>();
    profiles.forEach(p => {
      if (p.state) set.set(p.state, (set.get(p.state) || 0) + 1);
    });
    return Array.from(set.entries()).sort((a, b) => b[1] - a[1]);
  }, [profiles, stateCode]);

  const pageTitle = useMemo(() => {
    if (cityName && stateName) return `Corretores de Imóveis em ${cityName}, ${stateName}`;
    if (stateName) return `Corretores de Imóveis no ${stateName}`;
    return "Corretores de Imóveis - Encontre Profissionais Verificados";
  }, [cityName, stateName]);

  const metaDesc = useMemo(() => {
    if (cityName) return `Encontre corretores de imóveis em ${cityName}, ${stateName}. ${filteredProfiles.length} profissionais com CRECI verificado. Contato direto via WhatsApp.`;
    if (stateName) return `Lista de corretores e imobiliárias no ${stateName}. Profissionais verificados com CRECI ativo para compra, venda e aluguel de imóveis.`;
    return "Encontre corretores de imóveis verificados em todo o Brasil. Busque por cidade, estado, CRECI ou CNPJ. Contato direto via WhatsApp.";
  }, [cityName, stateName, filteredProfiles.length]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    description: metaDesc,
    numberOfItems: filteredProfiles.length,
    itemListElement: filteredProfiles.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "RealEstateAgent",
        name: p.company_name || p.full_name,
        url: `https://blackbroker.lovable.app/empresa/${p.slug}`,
        ...(p.logo_url && { image: p.logo_url }),
        ...(p.phone && { telephone: p.phone }),
        address: {
          "@type": "PostalAddress",
          ...(p.city && { addressLocality: p.city }),
          ...(p.state && { addressRegion: p.state }),
          addressCountry: "BR",
        },
      },
    })),
  };

  const canonicalPath = cityName && estado
    ? `/corretores/${estado}/${slugify(cityName)}`
    : estado ? `/corretores/${estado}` : "/corretores";

  return (
    <div className="min-h-screen bg-secondary/50">
      <Helmet>
        <title>{`${pageTitle} | Brokers App`}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={`https://blackbroker.lovable.app${canonicalPath}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-2 flex-wrap">
            <Link to="/" className="hover:text-primary-foreground">Início</Link>
            <span>/</span>
            <Link to="/corretores" className="hover:text-primary-foreground">Corretores</Link>
            {stateName && (
              <>
                <span>/</span>
                {cityName ? (
                  <Link to={`/corretores/${estado}`} className="hover:text-primary-foreground">{stateName}</Link>
                ) : (
                  <span className="text-primary-foreground">{stateName}</span>
                )}
              </>
            )}
            {cityName && (
              <>
                <span>/</span>
                <span className="text-primary-foreground">{cityName}</span>
              </>
            )}
          </div>

          <h1 className="font-display font-bold text-3xl md:text-4xl text-primary-foreground">
            {pageTitle}
          </h1>
          <p className="text-primary-foreground/80 mt-2 flex items-center gap-2">
            <Users size={16} />
            {loading ? "Carregando..." : `${filteredProfiles.length} profissionais encontrados`}
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="px-4 -mt-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por nome, CRECI, CNPJ ou cidade..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* States links (global page) */}
      {!stateCode && statesAvailable.length > 0 && (
        <section className="px-4 mt-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display font-bold text-xl text-foreground mb-4">Buscar por Estado</h2>
            <div className="flex flex-wrap gap-2">
              {statesAvailable.map(([st, count]) => (
                <Link
                  key={st}
                  to={`/corretores/${st.toLowerCase()}`}
                  className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {BRAZILIAN_STATES[st.toLowerCase()] || st} ({count})
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cities links (state page) */}
      {stateCode && !cityName && citiesInState.length > 0 && (
        <section className="px-4 mt-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display font-bold text-xl text-foreground mb-4">Cidades em {stateName}</h2>
            <div className="flex flex-wrap gap-2">
              {citiesInState.map(([slug, name]) => (
                <Link
                  key={slug}
                  to={`/corretores/${estado}/${slug}`}
                  className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Profiles Grid */}
      <section className="px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-bold text-xl text-foreground mb-6">
            {loading ? "Carregando..." : `${filteredProfiles.length} corretor(es) encontrado(s)`}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-card border border-border rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-20">
              <Users size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum corretor encontrado</p>
              <Link to="/corretores" className="mt-4 inline-flex items-center gap-2 text-primary font-semibold">
                Ver todos os corretores <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProfiles.map((profile, i) => {
                const tier = tiers[profile.id];
                const displayName = profile.company_name || profile.full_name;
                const categoryLabel = profile.seller_category ? SELLER_CATEGORY_LABELS[profile.seller_category] || profile.seller_category : null;

                return (
                  <motion.div key={profile.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Link to={`/empresa/${profile.slug}`}>
                      <div className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        {/* Header with logo */}
                        <div className="relative h-28 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          {profile.logo_url ? (
                            <img src={profile.logo_url} alt={displayName} className="w-20 h-20 rounded-full object-cover border-4 border-card shadow-lg" />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-card shadow-lg">
                              <Building2 size={32} className="text-primary" />
                            </div>
                          )}
                          {tier && (
                            <div className="absolute top-3 right-3">
                              <PackageBadge tier={tier} />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-4 pt-3">
                          <h3 className="font-display font-bold text-base text-foreground line-clamp-1">{displayName}</h3>

                          {categoryLabel && (
                            <div className="flex items-center gap-1 mt-1">
                              <BadgeCheck size={14} className="text-primary" />
                              <span className="text-xs text-primary font-medium">{categoryLabel}</span>
                            </div>
                          )}

                          {(profile.city || profile.state) && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin size={12} />
                              {[profile.city, profile.state].filter(Boolean).join(", ")}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 mt-2">
                            {profile.creci && (
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                CRECI: {profile.creci}
                              </span>
                            )}
                            {profile.cnpj && (
                              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                                CNPJ: {profile.cnpj}
                              </span>
                            )}
                          </div>

                          {profile.bio && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{profile.bio}</p>
                          )}

                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-primary font-semibold group-hover:underline">Ver perfil →</span>
                            {profile.phone && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Phone size={10} /> WhatsApp
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* SEO Content */}
      <section className="px-4 md:px-8 pb-12">
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl p-6 md:p-8">
          <h2 className="font-display font-bold text-xl text-foreground mb-4">
            {cityName ? `Corretores em ${cityName}, ${stateName}` : stateName ? `Corretores no ${stateName}` : "Encontre Corretores de Imóveis"}
          </h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            <p>
              {cityName
                ? `Encontre os melhores corretores de imóveis em ${cityName}, ${stateName}. Profissionais verificados com CRECI ativo, prontos para ajudá-lo na compra, venda ou aluguel do seu imóvel. Contato direto via WhatsApp.`
                : stateName
                  ? `O Brokers App conecta você aos melhores corretores e imobiliárias do ${stateName}. Busque por cidade, CRECI ou CNPJ e entre em contato direto com profissionais verificados.`
                  : `O Brokers App é a plataforma que conecta compradores e vendedores diretamente com corretores de imóveis verificados em todo o Brasil. Busque por estado, cidade, CRECI ou CNPJ para encontrar o profissional ideal.`}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
