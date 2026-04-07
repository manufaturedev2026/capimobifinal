import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { MapPin, Home, Building2, Key, Trees, Store, Landmark, Bed, Bath, Ruler, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, getTagStyle, getTagLabel } from "@/data/products";
import PackageBadge from "@/components/PackageBadge";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";

const CATEGORY_MAP: Record<string, { dbValue: string; label: string; plural: string; icon: any; description: string }> = {
  casas: { dbValue: "casa", label: "Casa", plural: "Casas", icon: Home, description: "casas à venda e para alugar" },
  apartamentos: { dbValue: "apartamento", label: "Apartamento", plural: "Apartamentos", icon: Building2, description: "apartamentos à venda e para alugar" },
  terrenos: { dbValue: "terreno", label: "Terreno", plural: "Terrenos", icon: Trees, description: "terrenos e lotes" },
  comerciais: { dbValue: "comercial", label: "Comercial", plural: "Imóveis Comerciais", icon: Store, description: "salas e lojas comerciais" },
  alugueis: { dbValue: "aluguel", label: "Aluguel", plural: "Imóveis para Alugar", icon: Key, description: "imóveis para locação" },
  flats: { dbValue: "flat", label: "Flat", plural: "Flats", icon: Landmark, description: "flats e studios" },
};

const TIER_WEIGHT: Record<string, number> = {
  prime_empresa: 200, premium_empresa: 140, essencial_empresa: 100,
  vip: 70, premium: 40, start: 20, basico: 10,
};

export default function SeoLandingPage() {
  const { cidade, categoria, bairro } = useParams<{ cidade?: string; categoria?: string; bairro?: string }>();
  const [items, setItems] = useState<any[]>([]);
  const [tiers, setTiers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const cityName = cidade?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";
  const neighborhoodName = bairro?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";
  const catInfo = categoria ? CATEGORY_MAP[categoria] : null;

  // Build page title and meta
  const pageTitle = useMemo(() => {
    const parts: string[] = [];
    if (catInfo) parts.push(catInfo.plural);
    else parts.push("Imóveis");
    if (neighborhoodName) parts.push(`no ${neighborhoodName}`);
    if (cityName) parts.push(`em ${cityName}`);
    if (!cityName && !neighborhoodName) parts.push("- Encontre seu imóvel");
    return parts.join(" ");
  }, [catInfo, cityName, neighborhoodName]);

  const metaDescription = useMemo(() => {
    const cat = catInfo ? catInfo.description : "imóveis";
    if (neighborhoodName && cityName) return `Encontre ${cat} no bairro ${neighborhoodName}, ${cityName}. Anúncios atualizados de corretores verificados.`;
    if (cityName) return `Encontre ${cat} em ${cityName}. Confira anúncios de corretores e imobiliárias verificadas.`;
    if (catInfo) return `Encontre ${catInfo.description} em diversas cidades. Corretores verificados com CRECI ativo.`;
    return "Encontre imóveis à venda e para alugar. Corretores verificados.";
  }, [catInfo, cityName, neighborhoodName]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let query = supabase
        .from("seller_items")
        .select("id, title, price, photos, city, neighborhood, category, bedrooms, bathrooms, area, status, slug, seller_id, tags")
        .eq("status", "ativo")
        .eq("seller_type", "imoveis")
        .or("is_owner_listing.is.null,is_owner_listing.eq.false")
        .order("created_at", { ascending: false })
        .limit(60);

      if (cityName) query = query.ilike("city", `%${cityName}%`);
      if (neighborhoodName) query = query.ilike("neighborhood", `%${neighborhoodName}%`);
      if (catInfo) {
        if (catInfo.dbValue === "aluguel") {
          query = query.or(`category.eq.aluguel,tags.cs.{aluguel_flex}`);
        } else {
          query = query.eq("category", catInfo.dbValue as any);
        }
      }

      const { data } = await query;
      const list = data || [];

      // Fetch tiers
      const sellerIds = [...new Set(list.map((i: any) => i.seller_id).filter(Boolean))];
      if (sellerIds.length > 0) {
        const { data: subs } = await supabase
          .from("seller_subscriptions")
          .select("seller_id, tier")
          .in("seller_id", sellerIds)
          .eq("is_active", true);
        const map: Record<string, string> = {};
        (subs || []).forEach((s: any) => { map[s.seller_id] = s.tier; });
        setTiers(map);
      }

      setItems(list);
      setLoading(false);
    };
    fetchData();
  }, [cityName, neighborhoodName, catInfo?.dbValue]);

  const sortedItems = useMemo(() => {
    return [...items].map((item) => {
      const weight = TIER_WEIGHT[tiers[item.seller_id] || "basico"] || 10;
      const score = weight * (0.7 + Math.random() * 0.6);
      return { ...item, _score: score };
    }).sort((a, b) => b._score - a._score);
  }, [items, tiers]);

  const stats = useMemo(() => {
    const prices = items.filter((i) => i.price).map((i) => i.price);
    return {
      count: items.length,
      avg: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    };
  }, [items]);

  // Related links for internal linking
  const relatedCategories = Object.entries(CATEGORY_MAP).filter(([slug]) => slug !== categoria);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    description: metaDescription,
    numberOfItems: items.length,
    itemListElement: sortedItems.slice(0, 10).map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "RealEstateListing",
        name: item.title,
        url: `https://blackbroker.lovable.app/imoveis/produto/${item.slug || item.id}`,
        ...(item.price && { price: item.price, priceCurrency: "BRL" }),
        ...(item.photos?.[0] && { image: item.photos[0] }),
      },
    })),
  };

  const canonical = (() => {
    const base = "https://blackbroker.lovable.app/imoveis";
    const parts: string[] = [];
    if (cidade) parts.push(cidade);
    if (categoria) parts.push(categoria);
    if (bairro) parts.push("bairro", bairro);
    return parts.length ? `${base}/${parts.join("/")}` : base;
  })();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle} | Brokers App</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Simple top nav */}
      <nav className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="font-display font-bold text-lg text-foreground">Brokers App</Link>
          <div className="flex items-center gap-3">
            <Link to="/buscar" className="text-sm text-muted-foreground hover:text-primary transition-colors">Buscar</Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">Entrar</Link>
          </div>
        </div>
      </nav>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Início</Link>
          <span>/</span>
          <Link to="/imoveis" className="hover:text-primary transition-colors">Imóveis</Link>
          {cityName && (
            <>
              <span>/</span>
              <Link to={`/imoveis/${cidade}`} className="hover:text-primary transition-colors">{cityName}</Link>
            </>
          )}
          {catInfo && (
            <>
              <span>/</span>
              <span className="text-foreground font-medium">{catInfo.plural}</span>
            </>
          )}
          {neighborhoodName && (
            <>
              <span>/</span>
              <span className="text-foreground font-medium">{neighborhoodName}</span>
            </>
          )}
        </nav>

        {/* H1 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-2xl md:text-4xl text-foreground mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground text-sm md:text-base mb-6">{metaDescription}</p>
        </motion.div>

        {/* Stats bar */}
        {stats.count > 0 && (
          <div className="flex flex-wrap gap-4 mb-8 p-4 rounded-2xl bg-card border border-border">
            <div className="text-center px-4">
              <p className="text-2xl font-bold text-primary">{stats.count}</p>
              <p className="text-xs text-muted-foreground">Imóveis</p>
            </div>
            {stats.avg > 0 && (
              <>
                <div className="text-center px-4 border-l border-border">
                  <p className="text-2xl font-bold text-foreground">{formatPrice(stats.min)}</p>
                  <p className="text-xs text-muted-foreground">A partir de</p>
                </div>
                <div className="text-center px-4 border-l border-border">
                  <p className="text-2xl font-bold text-foreground">{formatPrice(stats.avg)}</p>
                  <p className="text-xs text-muted-foreground">Preço médio</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Category pills (when on city page) */}
        {cityName && !categoria && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {Object.entries(CATEGORY_MAP).map(([slug, cat]) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={slug}
                  to={`/imoveis/${cidade}/${slug}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary hover:bg-primary/5 transition-all whitespace-nowrap text-sm font-medium text-foreground"
                >
                  <Icon size={16} className="text-primary" />
                  {cat.plural}
                </Link>
              );
            })}
          </div>
        )}

        {/* Items grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : sortedItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedItems.map((item) => {
              const tier = tiers[item.seller_id] || "basico";
              const firstTag = item.tags?.[0];
              return (
                <Link
                  key={item.id}
                  to={`/imoveis/produto/${item.slug || item.id}`}
                  className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={item.photos?.[0] || ""} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {firstTag && firstTag !== "aluguel_flex" && (
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold shadow-lg backdrop-blur-sm ${getTagStyle(firstTag)}`}>
                          {getTagLabel(firstTag)}
                        </span>
                      )}
                    </div>
                    {tier !== "basico" && (
                      <div className="absolute top-2 right-2">
                        <PackageBadge tier={tier as any} size="sm" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h2 className="font-semibold text-sm text-foreground line-clamp-2">{item.title}</h2>
                    <p className="text-primary font-bold text-sm mt-1">{formatPrice(item.price || 0)}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      {item.bedrooms > 0 && <span className="flex items-center gap-0.5"><Bed size={12} /> {item.bedrooms}</span>}
                      {item.bathrooms > 0 && <span className="flex items-center gap-0.5"><Bath size={12} /> {item.bathrooms}</span>}
                      {item.area > 0 && <span className="flex items-center gap-0.5"><Ruler size={12} /> {item.area}m²</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin size={10} />
                      {[item.neighborhood, item.city].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">Nenhum imóvel encontrado</p>
            <Link to="/" className="text-primary font-medium mt-2 inline-block hover:underline">
              ← Voltar ao início
            </Link>
          </div>
        )}

        {/* Internal linking section for SEO */}
        <section className="mt-16 pt-8 border-t border-border">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Explore mais</h2>
          <div className="flex flex-wrap gap-2">
            {relatedCategories.map(([slug, cat]) => (
              <Link
                key={slug}
                to={cityName ? `/imoveis/${cidade}/${slug}` : `/imoveis/${slug}`}
                className="px-4 py-2 rounded-xl bg-card border border-border hover:border-primary text-sm text-foreground transition-all"
              >
                {cat.plural} {cityName ? `em ${cityName}` : ""}
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Brokers App. Todos os direitos reservados.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/privacidade" className="hover:text-primary transition-colors">Privacidade</Link>
            <Link to="/termos" className="hover:text-primary transition-colors">Termos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
