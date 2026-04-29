import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import SoldCountdown from "@/components/SoldCountdown";
import { Building2, Home, Landmark, Store, Key, ArrowLeft, ArrowRight, Search } from "lucide-react";
import { propertyCategories } from "@/data/companies";
import { formatPrice, getTagStyle, getTagLabel, type Product } from "@/data/products";
import { useRealListings } from "@/hooks/useRealListings";
import PackageBadge from "@/components/PackageBadge";
import HeroBannerCarousel from "@/components/HeroBannerCarousel";
import { useCityDetection } from "@/hooks/useCityDetection";

import { ES_NEIGHBORHOODS } from "@/data/esNeighborhoods";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import FavoriteButton from "@/components/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";
import CompareButton from "@/components/CompareButton";
import { useCompare } from "@/hooks/useCompare";
import SwipeablePropertyCard from "@/components/SwipeablePropertyCard";

const iconMap: Record<string, React.ElementType> = { Key, Home, Building2, Landmark, Store };

export default function PropertiesPage() {
  const { cidade } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoriaParam = searchParams.get("categoria");
  const { detectedCity } = useCityDetection();
  const initialCity = cidade ? cidade.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : (detectedCity || "");
  const [activeCategory, setActiveCategory] = useState<string | null>(categoriaParam);
  const [filterCity, setFilterCity] = useState(initialCity);
  const [filterType, setFilterType] = useState("");
  const [showRentals, setShowRentals] = useState(true);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [minArea, setMinArea] = useState("");
  const [onlyFinancing, setOnlyFinancing] = useState(false);
  const [onlyFurnished, setOnlyFurnished] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterNeighborhood, setFilterNeighborhood] = useState("");
  const itemsSectionRef = useRef<HTMLDivElement>(null);

  // Sync filter when detected city loads async
  useEffect(() => {
    if (!cidade && detectedCity && !filterCity) {
      setFilterCity(detectedCity);
      navigate(`/imoveis/${detectedCity.toLowerCase().replace(/\s+/g, "-")}`, { replace: true });
    }
  }, [detectedCity]);

  // Sync filterCity when URL changes
  useEffect(() => {
    if (cidade) {
      const cityFromUrl = cidade.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      setFilterCity(cityFromUrl);
      setFilterNeighborhood("");
    }
  }, [cidade]);

  const { sellers: realSellers, items: realItems, loading: listingsLoading } = useRealListings("imoveis");
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem, isInCompare } = useCompare();

  const scrollToItems = () => {
    setTimeout(() => {
      itemsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const allSellers = useMemo(() => {
    const map: Record<string, { id: string; name: string; logo: string; address: string }> = {};
    realSellers.forEach((s) => { map[s.id] = { id: s.id, name: s.name, logo: s.logo, address: s.address }; });
    return map;
  }, [realSellers]);

  const propertyProducts = useMemo(() => {
    return realItems.map((item) => ({
      id: item.id,
      companyId: item.sellerId,
      title: item.title,
      price: item.price,
      image: item.image,
      images: item.images,
      tag: item.tags?.[0] && item.tags[0] !== "aluguel_flex" ? getTagLabel(item.tags[0]) : item.tags?.[1] ? getTagLabel(item.tags[1]) : undefined,
      allTags: (item.tags || []).filter((t) => t !== "aluguel_flex"),
      description: item.description || "",
      type: "imovel" as const,
      specs: {},
      location: item.city || "",
      sellerTier: item.sellerTier || "basico",
      hasBlackTag: (item as any).hasBlackTag || false,
      hasDestaque: (item as any).hasDestaque || false,
      realCategory: item.category,
      isAluguel: (item.tags || []).includes("aluguel_flex") || item.category === "aluguel",
      furnished: item.furnished,
      accepts_financing: item.accepts_financing,
      bedrooms: item.bedrooms,
      area: item.area,
      neighborhood: item.neighborhood,
      status: (item as any).status || "ativo",
      sold_at: item.sold_at,
    })) as (Product & { sellerTier?: string; realCategory?: string; isAluguel?: boolean; furnished?: boolean; accepts_financing?: boolean; bedrooms?: number; area?: number; neighborhood?: string; status?: string; sold_at?: string | null })[];
  }, [realItems]);

  const normalizeCityValue = (value?: string | null) => value?.trim().toLowerCase() ?? "";

  // Filter sellers by city + only paid plans
  const paidTiers = ["start", "premium", "prime", "essencial_empresa", "premium_empresa"];
  const filteredSellers = useMemo(() => {
    const paid = realSellers.filter((s) => paidTiers.includes(s.tier));
    if (!filterCity) return paid;
    const selectedCity = normalizeCityValue(filterCity);
    return paid.filter((seller) => normalizeCityValue(seller.city) === selectedCity);
  }, [realSellers, filterCity]);

  // Category mapping for filtering
  const categoryMap: Record<string, string[]> = {
    casas: ["casa"],
    apartamentos: ["apartamento"],
    terrenos: ["terreno"],
    comerciais: ["comercial"],
    alugueis: ["aluguel"],
    aluguel: ["aluguel"],
    flats: ["flat"],
    galpoes: ["galpao"],
    coberturas: ["apartamento"],
  };

  const effectiveCategory = filterType || activeCategory;

  const featuredProducts = useMemo(() => {
    let base = filterCity
      ? propertyProducts.filter((p) => normalizeCityValue((p as any).location) === normalizeCityValue(filterCity))
      : [...propertyProducts];
    // Filter by category
    if (effectiveCategory) {
      if (effectiveCategory === "aluguel" || effectiveCategory === "alugueis") {
        base = base.filter((p) => (p as any).isAluguel);
      } else {
        const matchCats = categoryMap[effectiveCategory] || [];
        base = base.filter((p) => {
          const realCat = (p as any).realCategory;
          return realCat && matchCats.includes(realCat);
        });
      }
    }
    const shuffled = [...base].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 7);
  }, [propertyProducts, filterCity, effectiveCategory]);

  // Hero carousel sellers map
  const heroSellersMap = useMemo(() => {
    const map: Record<string, { id: string; name: string; logo: string }> = {};
    Object.entries(allSellers).forEach(([id, s]) => { map[id] = { id: s.id, name: s.name, logo: s.logo }; });
    return map;
  }, [allSellers]);

  // Featured item IDs for hero banner
  const featuredItemIds = useMemo(() => {
    const ids = new Set<string>();
    realSellers.forEach((s) => { if (s.featured_item_id) ids.add(s.featured_item_id); });
    return ids;
  }, [realSellers]);

  const availableCities = useMemo(() => {
    const citiesFromItems = new Set<string>();
    realItems.forEach((item) => {
      if (item.city) citiesFromItems.add(item.city.trim());
    });
    
    return Array.from(citiesFromItems).sort();
  }, [realItems]);

  const availableNeighborhoods = useMemo(() => {
    if (filterCity) {
      const staticNeighborhoods = ES_NEIGHBORHOODS[filterCity] || [];
      if (staticNeighborhoods.length > 0) return staticNeighborhoods;
      const set = new Set<string>();
      realItems.forEach((item) => {
        if (item.neighborhood && normalizeCityValue(item.city) === normalizeCityValue(filterCity)) {
          set.add(item.neighborhood.trim());
        }
      });
      return Array.from(set).sort();
    }
    return [];
  }, [filterCity, realItems]);

  const propertyTypes = [
    { value: "alugueis", label: "Aluguel" },
    { value: "casas", label: "Casas" },
    { value: "apartamentos", label: "Apartamentos" },
    { value: "terrenos", label: "Terrenos" },
    { value: "comerciais", label: "Comerciais" },
    { value: "flats", label: "Flats" },
    { value: "galpoes", label: "Galpões" },
    { value: "coberturas", label: "Coberturas" },
  ];

  const filteredProducts = useMemo(() => {
    let list = !effectiveCategory
      ? [...propertyProducts]
      : propertyProducts.filter((p) => {
          if (effectiveCategory === "aluguel" || effectiveCategory === "alugueis") {
            return (p as any).isAluguel;
          }
          const realCat = (p as any).realCategory;
          const matchCats = categoryMap[effectiveCategory] || [];
          return realCat && matchCats.includes(realCat);
        });

    if (filterCity) {
      const selectedCity = normalizeCityValue(filterCity);
      list = list.filter((product) => normalizeCityValue((product as any).location) === selectedCity);
    }

    if (filterNeighborhood) {
      list = list.filter((p) => (p as any).neighborhood === filterNeighborhood || (p as any).specs?.Bairro === filterNeighborhood);
    }

    if (!showRentals) {
      list = list.filter((p) => !(p as any).isAluguel);
    }

    // Advanced filters
    if (priceMin) list = list.filter((p) => (p.price || 0) >= parseFloat(priceMin));
    if (priceMax) list = list.filter((p) => (p.price || 0) <= parseFloat(priceMax));
    if (minBedrooms) list = list.filter((p) => ((p as any).specs?.Quartos || (p as any).bedrooms || 0) >= parseInt(minBedrooms));
    if (minArea) list = list.filter((p) => ((p as any).specs?.["Área"] || (p as any).area || 0) >= parseFloat(minArea));
    if (onlyFurnished) list = list.filter((p) => (p as any).furnished);
    if (onlyFinancing) list = list.filter((p) => (p as any).accepts_financing);

    // Keep priority order from useRealListings (weighted by tier)
    // Real items already come sorted by tier weight, static items go at the end
    return list;
  }, [activeCategory, propertyProducts, filterCity, filterType, filterNeighborhood, realSellers, showRentals, priceMin, priceMax, minBedrooms, minArea, onlyFurnished, onlyFinancing]);

  return (
    <div className="min-h-screen bg-background">
      <HeroBannerCarousel
        items={propertyProducts as any}
        sellers={heroSellersMap}
        featuredItemIds={featuredItemIds}
        type="imoveis"
        filterCity={filterCity}
        filterCategory={effectiveCategory ? (categoryMap[effectiveCategory]?.[0] || undefined) : undefined}
        fallbackImage="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&h=500&fit=crop"
        accentColor="text-emerald-400"
      />

      {/* Search Filters */}
      <section className="px-4 md:px-8 lg:px-12 pt-4 pb-2">
        <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm">
          <h3 className="font-display font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <Search size={16} /> Filtrar imóveis
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={filterCity}
              onChange={(e) => { const v = e.target.value; setFilterCity(v); setFilterNeighborhood(""); navigate(v ? `/imoveis/${v.toLowerCase().replace(/\s+/g, "-")}` : "/imoveis", { replace: true }); }}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todas as cidades</option>
              {availableCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterNeighborhood}
              onChange={(e) => setFilterNeighborhood(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todos os bairros</option>
              {availableNeighborhoods.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setActiveCategory(null); }}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todos os tipos</option>
              {propertyTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${showAdvanced ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
              >
                {showAdvanced ? "▲ Filtros" : "▼ Mais Filtros"}
              </button>
              <button
                onClick={() => { setFilterCity(""); setFilterType(""); setFilterNeighborhood(""); setActiveCategory(null); setShowRentals(true); setPriceMin(""); setPriceMax(""); setMinBedrooms(""); setMinArea(""); setOnlyFinancing(false); setOnlyFurnished(false); }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white font-bold text-sm hover:opacity-90 transition-opacity shadow"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Preço Mín (R$)</label>
                  <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Preço Máx (R$)</label>
                  <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Sem limite"
                    className="w-full px-3 py-2 rounded-xl bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Quartos (mín)</label>
                  <select value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Qualquer</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Área mín (m²)</label>
                  <input type="number" value={minArea} onChange={(e) => setMinArea(e.target.value)} placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setOnlyFinancing(!onlyFinancing)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    onlyFinancing ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground hover:border-primary/30"
                  }`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${onlyFinancing ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                    {onlyFinancing && <span className="text-primary-foreground text-[9px]">✓</span>}
                  </div>
                  Aceita Financiamento
                </button>
                <button type="button" onClick={() => setOnlyFurnished(!onlyFurnished)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    onlyFurnished ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-muted-foreground hover:border-primary/30"
                  }`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${onlyFurnished ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                    {onlyFurnished && <span className="text-primary-foreground text-[9px]">✓</span>}
                  </div>
                  Mobiliado
                </button>
              </div>
            </div>
          )}

          {effectiveCategory !== "aluguel" && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setShowRentals(!showRentals)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${showRentals ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${showRentals ? "translate-x-5" : "translate-x-0"}`} />
              </button>
              <span className="text-sm text-foreground font-medium">
                {showRentals ? "Exibindo itens de aluguel" : "Itens de aluguel ocultos"}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Categories - Carousel */}
      <section className="px-4 md:px-8 lg:px-12 mt-6 relative z-10">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 pl-1 pr-10 snap-x snap-mandatory md:grid md:grid-cols-5 md:overflow-visible md:pl-0 md:pr-0">
          {propertyCategories.map((cat, i) => {
            const Icon = iconMap[cat.icon] || Building2;
            const isActive = activeCategory === cat.slug;
            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex-shrink-0 w-[140px] md:w-auto snap-start"
              >
                <button
                  onClick={() => { setActiveCategory(isActive ? null : cat.slug); if (!isActive) scrollToItems(); }}
                  className={`w-full group rounded-2xl transition-all ${isActive ? "scale-95 brightness-110" : ""}`}
                >
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-t ${cat.color} ${
                        isActive ? "opacity-90" : "opacity-65 group-hover:opacity-80"
                      } transition-opacity`}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Icon size={26} className="text-white drop-shadow-md" />
                      <span className="font-display font-bold text-white text-sm md:text-base drop-shadow-lg">
                        {cat.name}
                      </span>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Featured Products Carousel */}
      <section className="pt-8 pb-2">
        <h3 className="font-display font-semibold text-base text-foreground mb-4 px-4 md:px-8 lg:px-12">Destaques</h3>
        <div className="flex gap-3 overflow-x-auto md:overflow-visible scrollbar-hide pb-2 snap-x snap-mandatory md:snap-none -mx-4 px-4 md:mx-0 md:px-8 lg:px-12 md:grid md:grid-cols-7">
          {featuredProducts.map((product, i) => {
            const company = allSellers[product.companyId];
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 w-[200px] md:w-auto snap-start"
              >
                <Link to={`/imoveis/produto/${(product as any).slug || product.id}`} className="group block">
                  <div className="relative aspect-[3/2] rounded-2xl overflow-hidden shadow-md">
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      {company && (
                        <div className="flex items-center gap-1.5">
                          <img loading="lazy" decoding="async" src={company.logo} alt={company.name} className="w-5 h-5 rounded-full object-cover border border-white/30" />
                          <span className="text-white/80 text-[10px] truncate">{company.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
          <div className="flex-shrink-0 w-4 md:hidden" aria-hidden="true" />
        </div>
      </section>

      {/* Products listing */}
      <section ref={itemsSectionRef} className="px-4 md:px-8 lg:px-12 py-8 scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
            {activeCategory
              ? propertyCategories.find((c) => c.slug === activeCategory)?.name
              : filterType
              ? propertyTypes.find((t) => t.value === filterType)?.label
              : "Todos os Imóveis"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredProducts.length} imóvel(is)
          </span>
        </div>

        {listingsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product, i) => {
            const company = allSellers[product.companyId];
            return (
              <SwipeablePropertyCard
                key={product.id}
                product={product as any}
                company={company}
                index={i}
              />
            );
          })}
        </div>
        )}

        {filteredProducts.length === 0 && (
          <p className="text-center text-muted-foreground py-16">
            Nenhum imóvel encontrado nesta categoria
          </p>
        )}
      </section>
    </div>
  );
}
