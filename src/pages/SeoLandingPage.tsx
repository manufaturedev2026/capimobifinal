import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Home, Building2, Key, Trees, Store, Landmark,
  Bed, Bath, Ruler, ArrowRight, Sparkles, Crown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, getTagStyle, getTagLabel } from "@/data/products";
import PackageBadge from "@/components/PackageBadge";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import SeoPageLayout, { useSeoTheme, ShimmerLine } from "@/components/seo/SeoPageLayout";
import { SITE_URL } from "@/lib/siteUrl";

const CATEGORY_MAP: Record<string, { dbValue: string; label: string; plural: string; icon: any; description: string }> = {
  casas: { dbValue: "casa", label: "Casa", plural: "Casas", icon: Home, description: "casas à venda e para alugar" },
  apartamentos: { dbValue: "apartamento", label: "Apartamento", plural: "Apartamentos", icon: Building2, description: "apartamentos à venda e para alugar" },
  terrenos: { dbValue: "terreno", label: "Terreno", plural: "Terrenos", icon: Trees, description: "terrenos e lotes" },
  comerciais: { dbValue: "comercial", label: "Comercial", plural: "Imóveis Comerciais", icon: Store, description: "salas e lojas comerciais" },
  alugueis: { dbValue: "aluguel", label: "Aluguel", plural: "Imóveis para Alugar", icon: Key, description: "imóveis para locação" },
  flats: { dbValue: "flat", label: "Flat", plural: "Flats", icon: Landmark, description: "flats e studios" },
};

const TIER_WEIGHT: Record<string, number> = {
  prime_empresa: 70, vip: 70,
  premium_empresa: 40, premium: 40,
  essencial_empresa: 20, start: 20,
  basico_empresa: 10, basico: 10,
};

export default function SeoLandingPage() {
  const { cidade, categoria, bairro } = useParams<{ cidade?: string; categoria?: string; bairro?: string }>();
  const [items, setItems] = useState<any[]>([]);
  const [tiers, setTiers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  const theme = useSeoTheme();
  const { primary: PRIMARY, cardBg: CARD_BG, border: BORDER, text: TEXT, textMuted: TEXT_MUTED } = theme;

  const cityName = cidade?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";
  const neighborhoodName = bairro?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";
  const catInfo = categoria ? CATEGORY_MAP[categoria] : null;

  const pageTitle = useMemo(() => {
    const parts: string[] = [];
    if (catInfo) parts.push(catInfo.plural); else parts.push("Imóveis");
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
        .select("id, title, price, photos, thumbnail_url, city, neighborhood, category, bedrooms, bathrooms, area, status, slug, seller_id, tags")
        .eq("status", "ativo").eq("seller_type", "imoveis")
        .or("is_owner_listing.is.null,is_owner_listing.eq.false")
        .order("created_at", { ascending: false }).limit(120);

      if (cityName) query = query.ilike("city", `%${cityName}%`);
      if (neighborhoodName) query = query.ilike("neighborhood", `%${neighborhoodName}%`);
      if (catInfo) {
        if (catInfo.dbValue === "aluguel") query = query.or(`category.eq.aluguel,tags.cs.{aluguel_flex}`);
        else query = query.eq("category", catInfo.dbValue as any);
      }

      const { data } = await query;
      const list = data || [];
      const sellerIds = [...new Set(list.map((i: any) => i.seller_id).filter(Boolean))];
      if (sellerIds.length > 0) {
        const { data: subs } = await supabase.from("seller_subscriptions").select("seller_id, tier").in("seller_id", sellerIds).eq("is_active", true);
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
    let list = [...items];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => i.title.toLowerCase().includes(q) || i.neighborhood?.toLowerCase().includes(q) || i.city?.toLowerCase().includes(q));
    }
    return list.map(item => {
      const weight = TIER_WEIGHT[tiers[item.seller_id] || "basico"] || 10;
      return { ...item, _score: weight * (0.7 + Math.random() * 0.6) };
    }).sort((a, b) => b._score - a._score);
  }, [items, tiers, searchQuery]);

  const paginatedItems = useMemo(() => sortedItems.slice(0, page * ITEMS_PER_PAGE), [sortedItems, page]);
  const hasMore = paginatedItems.length < sortedItems.length;

  const stats = useMemo(() => {
    const prices = items.filter(i => i.price).map(i => i.price);
    return { count: items.length, avg: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0, min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };
  }, [items]);

  const heroImages = useMemo(() => {
    const images: string[] = [];
    for (const item of sortedItems) {
      if (item.photos?.[0] && !images.includes(item.photos[0])) {
        images.push(item.photos[0]);
        if (images.length >= 10) break;
      }
    }
    return images;
  }, [sortedItems]);
  const heroImage = heroImages[0] || null;
  const relatedCategories = Object.entries(CATEGORY_MAP).filter(([slug]) => slug !== categoria);

  const jsonLd = {
    "@context": "https://schema.org", "@type": "ItemList",
    name: pageTitle, description: metaDescription, numberOfItems: items.length,
    itemListElement: sortedItems.slice(0, 10).map((item, i) => ({
      "@type": "ListItem", position: i + 1,
      item: { "@type": "RealEstateListing", name: item.title, url: `${SITE_URL}/imoveis/produto/${item.slug || item.id}`, ...(item.price && { price: item.price, priceCurrency: "BRL" }), ...(item.photos?.[0] && { image: item.photos[0] }) },
    })),
  };

  const canonical = (() => {
    const base = `${SITE_URL}/imoveis`;
    const parts: string[] = [];
    if (cidade) parts.push(cidade);
    if (categoria) parts.push(categoria);
    if (bairro) parts.push("bairro", bairro);
    return parts.length ? `${base}/${parts.join("/")}` : base;
  })();

  const breadcrumbs = [
    { label: "Início", to: "/" },
    { label: "Imóveis", to: "/imoveis" },
    ...(cityName ? [{ label: cityName, to: `/imoveis/${cidade}` }] : []),
    ...(catInfo ? [{ label: catInfo.plural }] : []),
    ...(neighborhoodName ? [{ label: neighborhoodName }] : []),
  ];

  const scrollToGrid = () => setTimeout(() => document.getElementById("seo-grid")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

  return (
    <SeoPageLayout
      theme={theme}
      title={pageTitle}
      metaDescription={metaDescription}
      canonical={canonical}
      jsonLd={jsonLd}
      heroImage={heroImage}
      heroImages={heroImages}
      heroHeight="h-[50vh] md:h-[65vh]"
      breadcrumbs={breadcrumbs}
      heroTagline={catInfo ? catInfo.plural : "Marketplace de Imóveis"}
      heroSubtitle={metaDescription}
      heroAction={
        <button onClick={scrollToGrid} className="group inline-flex items-center gap-2 px-5 py-2.5 md:px-7 md:py-3.5 rounded-2xl font-bold text-xs md:text-sm text-white shadow-2xl transition-all hover:scale-105" style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY}bb)`, boxShadow: `0 8px 32px ${PRIMARY}40` }}>
          Ver {stats.count} imóveis <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      }
      searchPlaceholder="Buscar por título, bairro ou cidade..."
      searchValue={searchQuery}
      onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
    >
      {/* ═══ STATS ═══ */}
      {stats.count > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="max-w-6xl mx-auto px-4 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Imóveis", value: String(stats.count) },
              ...(stats.avg > 0 ? [
                { label: "A partir de", value: formatPrice(stats.min) },
                { label: "Preço médio", value: formatPrice(stats.avg) },
                { label: "Até", value: formatPrice(stats.max) },
              ] : []),
            ].map(s => (
              <div key={s.label} className="text-center p-4 rounded-2xl" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                <p className="text-xs" style={{ color: TEXT_MUTED }}>{s.label}</p>
                <p className="font-display font-bold text-lg mt-1" style={{ color: TEXT }}>{s.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══ CATEGORY PILLS ═══ */}
      {cityName && !categoria && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="max-w-6xl mx-auto px-4 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={16} style={{ color: PRIMARY }} />
            <h2 className="font-display font-bold text-lg" style={{ color: TEXT }}>Categorias em {cityName}</h2>
          </div>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
            {Object.entries(CATEGORY_MAP).map(([slug, cat]) => {
              const Icon = cat.icon;
              return (
                <Link key={slug} to={`/imoveis/${cidade}/${slug}`} className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:scale-105 whitespace-nowrap text-sm font-medium" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }}>
                  <Icon size={16} style={{ color: PRIMARY }} /> {cat.plural}
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      <ShimmerLine color={PRIMARY} />

      {/* ═══ ITEMS GRID ═══ */}
      <section id="seo-grid" className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={16} style={{ color: PRIMARY }} />
          <h2 className="font-display font-bold text-lg" style={{ color: TEXT }}>
            {loading ? "Carregando..." : `${sortedItems.length} imóvel(is) encontrado(s)`}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : paginatedItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedItems.map((item, idx) => {
                const tier = tiers[item.seller_id] || "basico";
                const firstTag = item.tags?.[0];
                const isPaid = tier !== "basico";
                const isAluguel = item.category === "aluguel" || item.tags?.includes("aluguel_flex");
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.03, 0.5) }}>
                    <Link to={`/imoveis/produto/${item.slug || item.id}`} className="block rounded-2xl overflow-hidden transition-all duration-300 group hover:scale-[1.02]" style={{ background: CARD_BG, border: `1.5px solid ${isPaid ? PRIMARY + "40" : BORDER}`, boxShadow: isPaid ? `0 0 16px ${PRIMARY}12` : "none" }}>
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img src={item.thumbnail_url || item.photos?.[0] || ""} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        {firstTag && firstTag !== "aluguel_flex" && (
                          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold shadow-lg backdrop-blur-sm ${getTagStyle(firstTag)}`}>
                            {getTagLabel(firstTag)}
                          </span>
                        )}
                        {isPaid && (
                          <div className="absolute top-2 right-2"><PackageBadge tier={tier as any} size="sm" /></div>
                        )}
                        {isAluguel && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-blue-500/90 text-white backdrop-blur-sm">🏠 Aluguel</span>
                        )}
                      </div>
                      <div className="p-2.5 md:p-3.5">
                        <h3 className="text-[11px] md:text-xs font-bold line-clamp-2 leading-snug mb-1.5" style={{ color: TEXT }}>{item.title}</h3>
                        {item.price && (
                          <p className="text-sm md:text-lg font-black" style={{ color: PRIMARY }}>
                            {formatPrice(item.price)}
                            {isAluguel && <span className="text-[10px] font-normal ml-1" style={{ color: TEXT_MUTED }}>/mês</span>}
                          </p>
                        )}
                        <div className="flex items-center gap-2.5 mt-2.5 text-[10px]" style={{ color: TEXT_MUTED }}>
                          {item.bedrooms > 0 && <span className="flex items-center gap-0.5"><Bed size={10} /> {item.bedrooms}</span>}
                          {item.bathrooms > 0 && <span className="flex items-center gap-0.5"><Bath size={10} /> {item.bathrooms}</span>}
                          {item.area > 0 && <span className="flex items-center gap-0.5"><Ruler size={10} /> {item.area}m²</span>}
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
              <div className="flex justify-center mt-8">
                <button onClick={() => setPage(p => p + 1)} className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105" style={{ background: PRIMARY, boxShadow: `0 4px 16px ${PRIMARY}30` }}>
                  Carregar mais imóveis
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg" style={{ color: TEXT_MUTED }}>Nenhum imóvel encontrado</p>
            <Link to="/" className="font-medium mt-2 inline-block hover:underline" style={{ color: PRIMARY }}>← Voltar ao início</Link>
          </div>
        )}
      </section>

      {/* ═══ EXPLORE MORE ═══ */}
      <ShimmerLine color={PRIMARY} />
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="font-display font-bold text-lg mb-4" style={{ color: TEXT }}>Explore mais</h2>
        <div className="flex flex-wrap gap-2">
          {relatedCategories.map(([slug, cat]) => (
            <Link key={slug} to={cityName ? `/imoveis/${cidade}/${slug}` : `/imoveis/categoria/${slug}`} className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }}>
              {cat.plural} {cityName ? `em ${cityName}` : ""}
            </Link>
          ))}
          <Link to="/corretores" className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: `${PRIMARY}15`, border: `1px solid ${PRIMARY}40`, color: PRIMARY }}>
            Ver corretores
          </Link>
        </div>
      </section>
    </SeoPageLayout>
  );
}
