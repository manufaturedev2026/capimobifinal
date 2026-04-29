import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { MapPin, Home, Building2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/siteUrl";
import { formatPrice } from "@/data/products";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import FavoriteButton from "@/components/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function NeighborhoodPage() {
  const { cidade, bairro } = useParams<{ cidade: string; bairro: string }>();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { site_name } = useSiteSettings();

  const cityName = cidade?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "";
  const neighborhoodName = bairro?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "";

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("seller_items")
        .select("id, title, price, photos, thumbnail_url, city, neighborhood, category, bedrooms, bathrooms, area, status")
        .eq("status", "ativo")
        .ilike("city", `%${cityName}%`)
        .ilike("neighborhood", `%${neighborhoodName}%`)
        .limit(50);
      setItems(data || []);
      setLoading(false);
    };
    if (cityName && neighborhoodName) fetch();
  }, [cityName, neighborhoodName]);

  const stats = useMemo(() => {
    if (items.length === 0) return null;
    const prices = items.filter(i => i.price).map(i => i.price);
    return {
      count: items.length,
      avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
    };
  }, [items]);

  return (
    <div className="min-h-screen bg-secondary/50">
      <Helmet>
        <title>{`Imóveis em ${neighborhoodName}, ${cityName} | ${site_name}`}</title>
        <meta name="description" content={`Encontre imóveis em ${neighborhoodName}, ${cityName}. ${stats ? `${stats.count} imóveis a partir de ${formatPrice(stats.minPrice)}.` : "Casas, apartamentos e terrenos disponíveis."}`} />
        <link rel="canonical" href={`${SITE_URL}/imoveis/${cidade}/bairro/${bairro}`} />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-2">
            <Link to="/" className="hover:text-primary-foreground">Início</Link>
            <span>/</span>
            <Link to={`/imoveis/${cidade}`} className="hover:text-primary-foreground">{cityName}</Link>
            <span>/</span>
            <span className="text-primary-foreground">{neighborhoodName}</span>
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-primary-foreground">
            Imóveis em {neighborhoodName}
          </h1>
          <p className="text-primary-foreground/80 mt-2 flex items-center gap-2">
            <MapPin size={16} />
            {neighborhoodName}, {cityName}
          </p>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="px-4 -mt-6 relative z-10">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Imóveis", value: stats.count },
              { label: "Preço Médio", value: formatPrice(stats.avgPrice) },
              { label: "A partir de", value: formatPrice(stats.minPrice) },
              { label: "Até", value: formatPrice(stats.maxPrice) },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center shadow-md">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display font-bold text-lg text-foreground mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Items */}
      <section className="px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-bold text-xl text-foreground mb-6">
            {loading ? "Carregando..." : `${items.length} imóvel(is) em ${neighborhoodName}`}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Home size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum imóvel encontrado em {neighborhoodName}</p>
              <Link to={`/imoveis/${cidade}`} className="mt-4 inline-flex items-center gap-2 text-primary font-semibold">
                Ver todos em {cityName} <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {items.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link to={`/imoveis/produto/${item.slug || item.id}`}>
                    <div className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img src={item.thumbnail_url || item.photos?.[0] || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                        <div className="absolute top-3 right-3">
                          <FavoriteButton
                            isFavorite={isFavorite(item.id)}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item.id); }}
                          />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-display font-bold text-base text-foreground line-clamp-1">{item.title}</h3>
                        <p className="text-lg font-bold text-emerald-500 mt-1">{formatPrice(item.price)}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {item.bedrooms && <span>🛏 {item.bedrooms} quartos</span>}
                          {item.bathrooms && <span>🚿 {item.bathrooms} banheiros</span>}
                          {item.area && <span>📐 {item.area}m²</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SEO Content */}
      <section className="px-4 md:px-8 pb-12">
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl p-6 md:p-8">
          <h2 className="font-display font-bold text-xl text-foreground mb-4">
            Sobre {neighborhoodName}, {cityName}
          </h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            <p>
              O bairro {neighborhoodName} está localizado em {cityName}.
              {stats && stats.count > 0 ? ` Atualmente há ${stats.count} imóveis disponíveis nesta região, com preços variando de ${formatPrice(stats.minPrice)} a ${formatPrice(stats.maxPrice)}.` : " Fique de olho nas novas oportunidades que surgem constantemente."}
            </p>
            <p>
              O {site_name} é a plataforma que conecta compradores diretamente com corretores e imobiliárias de todo o Brasil. Encontre seu imóvel ideal em {neighborhoodName} com contato direto via WhatsApp.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
