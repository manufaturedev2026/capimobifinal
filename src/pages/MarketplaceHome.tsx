import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Home, Building2, Key, Trees, Store, Landmark,
  MapPin, Bed, Bath, Ruler, ArrowRight, X, Filter,
  ChevronRight, Sparkles, Crown, Star, Zap, Users, Shield,
  Phone, ShieldCheck, Globe, Megaphone, UserPlus, LogIn,
} from "lucide-react";
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

const CATEGORIES = [
  { slug: "todos", label: "Todos", icon: Sparkles },
  { slug: "casa", label: "Casas", icon: Home },
  { slug: "apartamento", label: "Apartamentos", icon: Building2 },
  { slug: "aluguel", label: "Aluguel", icon: Key },
  { slug: "terreno", label: "Terrenos", icon: Trees },
  { slug: "comercial", label: "Comerciais", icon: Store },
  { slug: "flat", label: "Flats", icon: Landmark },
];

const BENEFITS = [
  { icon: Phone, title: "Contato Direto", desc: "Fale com o corretor via WhatsApp" },
  { icon: Globe, title: "Cobertura Regional", desc: "Imóveis em diversas cidades" },
  { icon: ShieldCheck, title: "Verificados", desc: "Corretores com CRECI ativo" },
  { icon: Megaphone, title: "Anuncie Grátis", desc: "Cadastre seu imóvel sem custo" },
];

export default function MarketplaceHome() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { detectedCity } = useCityDetection();
  const { sellers: realSellers, items: realItems, loading } = useRealListings("imoveis");
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem, isInCompare } = useCompare();

  const [activeCategory, setActiveCategory] = useState("todos");
  const [filterCity, setFilterCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 24;
  const catScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (detectedCity && !filterCity) setFilterCity(detectedCity);
  }, [detectedCity]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    realItems.forEach((item) => { if (item.city) set.add(item.city.trim()); });
    return Array.from(set).sort();
  }, [realItems]);

  const sellersMap = useMemo(() => {
    const map: Record<string, { id: string; name: string; logo: string; slug?: string | null; tier?: string }> = {};
    realSellers.forEach((s) => {
      map[s.id] = { id: s.id, name: s.name, logo: s.logo, slug: (s as any).slug, tier: s.tier };
    });
    return map;
  }, [realSellers]);

  const filteredItems = useMemo(() => {
    let items = [...realItems];

    // Category filter
    if (activeCategory !== "todos") {
      if (activeCategory === "aluguel") {
        items = items.filter((i) => (i.tags || []).includes("aluguel_flex") || i.category === "aluguel");
      } else {
        items = items.filter((i) => i.category === activeCategory);
      }
    }

    // City filter
    if (filterCity) {
      const city = filterCity.trim().toLowerCase();
      items = items.filter((i) => i.city?.trim().toLowerCase() === city);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.city?.toLowerCase().includes(q) ||
        i.neighborhood?.toLowerCase().includes(q)
      );
    }

    // Only active
    items = items.filter((i) => (i as any).status !== "vendido" && (i as any).status !== "inativo");

    return items;
  }, [realItems, activeCategory, filterCity, searchQuery]);

  const paginatedItems = useMemo(() => {
    return filteredItems.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredItems, page]);

  const hasMore = paginatedItems.length < filteredItems.length;

  const totalBrokers = realSellers.length;
  const totalItems = realItems.length;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Brokers App – Marketplace de Imóveis</title>
        <meta name="description" content="Encontre imóveis de diversos corretores verificados. Casas, apartamentos, terrenos e muito mais." />
      </Helmet>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="font-display font-bold text-lg text-foreground shrink-0">
            Brokers<span className="text-primary">App</span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-lg relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Buscar imóveis, cidades, bairros..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <Link to="/painel" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">
                <Shield size={14} /> Painel
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-secondary transition-colors">
                  <LogIn size={14} /> Entrar
                </Link>
                <Link to="/login?trial=7" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">
                  <UserPlus size={14} /> Criar Loja
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="max-w-2xl">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display font-bold text-3xl lg:text-5xl text-foreground leading-tight"
              >
                Encontre o imóvel
                <span className="text-primary"> ideal</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-3 text-muted-foreground text-base lg:text-lg max-w-lg"
              >
                {totalItems}+ imóveis de {totalBrokers} corretores verificados em um só lugar.
              </motion.p>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Home size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">{totalItems}</p>
                    <p className="text-[10px] text-muted-foreground">Imóveis</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">{totalBrokers}</p>
                    <p className="text-[10px] text-muted-foreground">Corretores</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">{availableCities.length}</p>
                    <p className="text-[10px] text-muted-foreground">Cidades</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA para corretores */}
            {!user && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="hidden lg:flex flex-col items-center text-center p-8 rounded-3xl bg-card border border-border shadow-lg"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles size={24} className="text-primary" />
                </div>
                <h3 className="font-display font-bold text-xl text-foreground">
                  É corretor de imóveis?
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                  Crie sua loja profissional, com app próprio, CRM, notificações push e SEO otimizado.
                </p>
                <Link
                  to="/anunciar"
                  className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
                >
                  <Megaphone size={16} /> Comece a Anunciar
                </Link>
                <p className="text-[11px] text-muted-foreground mt-2">Gratuito para começar • Sem cartão de crédito</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ── Filters ── */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">
          {/* Categories scroll */}
          <div ref={catScrollRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => { setActiveCategory(cat.slug); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
                >
                  <cat.icon size={14} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* City filter */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => { setFilterCity(""); setPage(1); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 transition-all ${
                !filterCity ? "bg-accent text-accent-foreground" : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Globe size={12} /> Todas Cidades
            </button>
            {availableCities.map((city) => (
              <button
                key={city}
                onClick={() => { setFilterCity(city); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 transition-all ${
                  filterCity === city ? "bg-accent text-accent-foreground" : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Properties Grid ── */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{filteredItems.length}</span> imóveis encontrados
            {filterCity && <span> em <span className="font-medium text-foreground">{filterCity}</span></span>}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search size={48} className="text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold text-foreground">Nenhum imóvel encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou buscar em outra cidade.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedItems.map((item) => {
                const seller = sellersMap[item.sellerId];
                const firstTag = (item.tags || [])[0];
                const isAluguel = (item.tags || []).includes("aluguel_flex") || item.category === "aluguel";
                const pUrl = productUrl(item);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-lg transition-all"
                  >
                    <Link to={pUrl}>
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {/* Tags */}
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                          {firstTag && firstTag !== "aluguel_flex" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white">
                              {getTagLabel(firstTag)}
                            </span>
                          )}
                          {isAluguel && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                              🏠 Aluguel
                            </span>
                          )}
                        </div>

                        {/* Favorites */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          <FavoriteButton isFavorite={isFavorite(item.id)} onClick={(e) => { e.preventDefault(); toggleFavorite(item.id); }} />
                        </div>

                        {/* Seller badge */}
                        {seller && (
                          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                            {seller.logo && (
                              <img src={seller.logo} alt="" className="w-4 h-4 rounded-full object-cover" />
                            )}
                            <span className="text-[10px] text-white font-medium truncate max-w-[100px]">{seller.name}</span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-3">
                      <Link to={pUrl}>
                        <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        {item.city && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <MapPin size={10} /> {item.neighborhood ? `${item.neighborhood}, ` : ""}{item.city}
                          </p>
                        )}
                        <p className="text-base font-bold text-primary mt-1.5">
                          {item.price ? formatPrice(item.price) : "Consulte"}
                          {isAluguel && <span className="text-xs font-normal text-muted-foreground">/mês</span>}
                        </p>

                        {/* Specs */}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                          {item.bedrooms && (
                            <span className="flex items-center gap-0.5"><Bed size={12} /> {item.bedrooms}</span>
                          )}
                          {(item as any).bathrooms && (
                            <span className="flex items-center gap-0.5"><Bath size={12} /> {(item as any).bathrooms}</span>
                          )}
                          {item.area && (
                            <span className="flex items-center gap-0.5"><Ruler size={12} /> {item.area}m²</span>
                          )}
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
                >
                  Carregar mais imóveis
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Benefits ── */}
      <section className="border-t border-border bg-secondary/30 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brokers Section ── */}
      {realSellers.length > 0 && (
        <section className="py-10 max-w-7xl mx-auto px-4">
          <h2 className="font-display font-bold text-xl text-foreground mb-6">Corretores na plataforma</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {realSellers.slice(0, 10).map((seller) => (
              <Link
                key={seller.id}
                to={`/empresa/${(seller as any).slug || seller.id}`}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card hover:shadow-lg transition-all group"
              >
                {seller.logo ? (
                  <img src={seller.logo} alt={seller.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-border group-hover:ring-primary transition-all" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {seller.name.charAt(0)}
                  </div>
                )}
                <p className="text-xs font-bold text-foreground text-center line-clamp-1">{seller.name}</p>
                {seller.city && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <MapPin size={9} /> {seller.city}
                  </p>
                )}
                <PackageBadge tier={seller.tier as any} size="sm" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA for brokers ── */}
      {!user && (
        <section className="py-16 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="font-display font-bold text-2xl lg:text-3xl text-foreground">
                  Quer anunciar seus imóveis?
                </h2>
                <p className="text-muted-foreground mt-3 text-sm max-w-md leading-relaxed">
                  Crie sua loja profissional com app próprio, CRM, galeria de anúncios, notificações push, WhatsApp integrado e muito mais. Comece gratuitamente.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Link
                    to="/anunciar"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
                  >
                    <Megaphone size={16} /> Saiba como anunciar
                  </Link>
                  <Link
                    to="/login?trial=7"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-foreground font-bold text-sm hover:bg-secondary transition-colors"
                  >
                    <UserPlus size={16} /> Criar conta grátis
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Globe, title: "App próprio", desc: "Loja instalável no celular" },
                  { icon: Users, title: "CRM integrado", desc: "Gerencie seus leads" },
                  { icon: Shield, title: "Push notifications", desc: "Engaje seus clientes" },
                  { icon: Star, title: "SEO otimizado", desc: "Apareça no Google" },
                ].map((b) => (
                  <div key={b.title} className="flex items-start gap-2.5 p-3 rounded-xl bg-card border border-border">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <b.icon size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{b.title}</p>
                      <p className="text-[10px] text-muted-foreground">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <FooterSimple />
    </div>
  );
}