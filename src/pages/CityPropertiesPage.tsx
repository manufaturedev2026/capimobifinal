import { useState, useMemo, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Home, Landmark, Store, Key, Search, MapPin, Image } from "lucide-react";
import { useCityData } from "@/hooks/useCityData";
import { getTagStyle, getTagLabel, formatPrice } from "@/data/products";
import { propertyCategories } from "@/data/companies";
import CitySEO from "@/components/CitySEO";
import PackageBadge from "@/components/PackageBadge";
import HeroBannerCarousel from "@/components/HeroBannerCarousel";

const iconMap: Record<string, React.ElementType> = { Key, Home, Building2, Landmark, Store };

function capitalize(str: string) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

const categoryMap: Record<string, string[]> = {
  casas: ["casa"],
  apartamentos: ["apartamento", "flat"],
  terrenos: ["terreno"],
  comerciais: ["comercial", "galpao"],
  aluguel: ["aluguel"],
};

export default function CityPropertiesPage() {
  const { cidade } = useParams();
  const [searchParams] = useSearchParams();
  const categoriaParam = searchParams.get("categoria");
  const citySlug = cidade || "";
  const cityName = capitalize(citySlug.replace(/-/g, " "));
  const { items, loading } = useCityData(citySlug, "imoveis");
  const [activeCategory, setActiveCategory] = useState<string | null>(categoriaParam);
  const [filterNeighborhood, setFilterNeighborhood] = useState("");
  const itemsSectionRef = useRef<HTMLDivElement>(null);

  const scrollToItems = () => {
    setTimeout(() => {
      itemsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => { if (i.neighborhood) set.add(i.neighborhood); });
    return Array.from(set).sort();
  }, [items]);

  // Hero carousel data
  const heroSellersMap = useMemo(() => {
    const map: Record<string, { id: string; name: string; logo: string }> = {};
    items.forEach((item) => {
      if (!map[item.sellerId]) {
        map[item.sellerId] = { id: item.sellerId, name: item.sellerName, logo: item.sellerLogo };
      }
    });
    return map;
  }, [items]);

  const heroItems = useMemo(() => {
    return items.map((item) => ({
      id: item.id,
      companyId: item.sellerId,
      title: item.title,
      price: item.price,
      image: item.image,
      images: item.images,
      tag: item.tags?.[0] && item.tags[0] !== "aluguel_flex" ? getTagLabel(item.tags[0]) : undefined,
      description: item.description || "",
      type: "imovel" as const,
      specs: {},
      location: item.city || "",
      realCategory: item.category,
      isAluguel: (item.tags || []).includes("aluguel_flex") || item.category === "aluguel",
    }));
  }, [items]);

  const featuredProducts = useMemo(() => {
    const shuffled = [...heroItems].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 7);
  }, [heroItems]);

  const filteredProducts = useMemo(() => {
    let list = [...items];
    if (activeCategory) {
      if (activeCategory === "aluguel") {
        list = list.filter((i) => (i.tags || []).includes("aluguel_flex") || i.category === "aluguel");
      } else {
        const matchCats = categoryMap[activeCategory] || [];
        list = list.filter((i) => matchCats.includes(i.category));
      }
    }
    if (filterNeighborhood) {
      list = list.filter((i) => i.neighborhood === filterNeighborhood);
    }
    return list;
  }, [items, activeCategory, filterNeighborhood]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CitySEO city={cityName} segment="imoveis" itemCount={items.length} items={items} />

      <HeroBannerCarousel
        items={heroItems as any}
        sellers={heroSellersMap}
        featuredItemIds={new Set()}
        type="imoveis"
        filterCity={cityName}
        filterCategory={activeCategory ? (categoryMap[activeCategory]?.[0] || undefined) : undefined}
        fallbackImage="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&h=500&fit=crop"
        accentColor="text-emerald-400"
      />

      {/* Search Filters */}
      <section className="px-4 md:px-8 lg:px-12 pt-4 pb-2">
        <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm">
          <h3 className="font-display font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <Search size={16} /> Filtrar imóveis em {cityName}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={filterNeighborhood}
              onChange={(e) => setFilterNeighborhood(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todos os bairros</option>
              {neighborhoods.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-muted-foreground text-sm px-2">
              <MapPin size={14} /> {cityName}, ES — {items.length} imóvel(is)
            </div>
            <button
              onClick={() => { setActiveCategory(null); setFilterNeighborhood(""); }}
              className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#002F6C] to-[#00AEEF] text-white font-bold text-sm hover:opacity-90 transition-opacity shadow"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 md:px-8 lg:px-12 mt-6 relative z-10">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 pl-1 pr-8 snap-x snap-mandatory md:grid md:grid-cols-5 md:overflow-visible md:pl-0 md:pr-0">
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

      {/* Featured Carousel */}
      {featuredProducts.length > 0 && (
        <section className="pt-8 pb-2">
          <h3 className="font-display font-semibold text-base text-foreground mb-4 px-4 md:px-8 lg:px-12">
            Destaques em {cityName}
          </h3>
          <div className="flex gap-3 overflow-x-auto md:overflow-visible scrollbar-hide pb-2 snap-x snap-mandatory md:snap-none px-4 md:px-8 lg:px-12 md:grid md:grid-cols-7">
            {featuredProducts.map((product, i) => {
              const seller = heroSellersMap[product.companyId];
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex-shrink-0 w-[200px] md:w-auto snap-start"
                >
                  <Link to={`/imoveis/produto/${product.id}`} className="group block">
                    <div className="relative aspect-[3/2] rounded-2xl overflow-hidden shadow-md">
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {seller && (
                          <div className="flex items-center gap-1.5">
                            <img src={seller.logo} alt={seller.name} className="w-5 h-5 rounded-full object-cover border border-white/30" />
                            <span className="text-white/80 text-[10px] truncate">{seller.name}</span>
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
      )}

      {/* Products listing */}
      <section ref={itemsSectionRef} className="px-4 md:px-8 lg:px-12 py-8 scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
            {activeCategory
              ? `${propertyCategories.find((c) => c.slug === activeCategory)?.name || "Imóveis"} em ${cityName}`
              : `Todos os Imóveis em ${cityName}`}
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredProducts.length} imóvel(is)
          </span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((item, i) => {
              const isAluguel = (item.tags || []).includes("aluguel_flex") || item.category === "aluguel";
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link to={`/imoveis/produto/${item.id}`}>
                    <div className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Image size={32} className="text-muted-foreground" />
                          </div>
                        )}
                        {item.tags?.[0] && item.tags[0] !== "aluguel_flex" && (
                          <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow ${getTagStyle(item.tags[0])}`}>
                            {getTagLabel(item.tags[0])}
                          </span>
                        )}
                        {isAluguel && (
                          <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow bg-primary text-primary-foreground">
                            🏠 Aluguel
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-display font-bold text-base md:text-lg text-foreground line-clamp-1">
                          {item.title}
                        </h3>
                        {item.price > 0 && (
                          <p className="text-xl font-bold text-emerald-500 mt-1">
                            R$ {item.price.toLocaleString("pt-BR")}
                            {isAluguel && <span className="text-sm font-normal text-muted-foreground"> /mês</span>}
                          </p>
                        )}
                        {item.neighborhood && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin size={10} /> {item.neighborhood}
                          </p>
                        )}
                        {item.sellerName && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                            {item.sellerLogo && (
                              <img src={item.sellerLogo} alt="" className="w-5 h-5 rounded-full object-cover" />
                            )}
                            <span className="text-xs text-muted-foreground truncate">{item.sellerName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="font-display font-bold text-lg text-foreground mb-2">Nenhum imóvel encontrado</h3>
            <p className="text-muted-foreground text-sm">Ainda não há imóveis cadastrados em {cityName}.</p>
            <Link to="/imoveis" className="text-primary text-sm mt-3 inline-block hover:underline">Ver todos os imóveis</Link>
          </div>
        )}
      </section>

      {/* SEO Content */}
      <section className="px-4 md:px-8 lg:px-12 pb-10">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-3">Imóveis em {cityName}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Encontre os melhores imóveis em {cityName}, Espírito Santo. Nossa plataforma reúne casas, apartamentos, terrenos,
            imóveis comerciais e galpões disponíveis para compra e aluguel em {cityName}. Compare preços, veja fotos e entre em
            contato direto com os corretores e imobiliárias de {cityName} pelo WhatsApp.
          </p>
          {neighborhoods.length > 0 && (
            <>
              <h3 className="font-display font-semibold text-foreground mt-4 mb-2">Bairros de {cityName}</h3>
              <div className="flex flex-wrap gap-2">
                {neighborhoods.map((n) => (
                  <button key={n} onClick={() => setFilterNeighborhood(n)} className="px-3 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
                    {n}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
