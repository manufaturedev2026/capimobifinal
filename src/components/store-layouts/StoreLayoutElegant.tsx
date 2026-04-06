import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Image, Bed, Bath, Ruler, Car, ChevronRight,
  Building2, Home, Search, SlidersHorizontal, X,
  TreePine, Store, Building, LandPlot,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Elegant Layout — Professional real-estate agency style
 */
export default function StoreLayoutElegant({
  filteredProducts, products, subcategories, activeCategory, setActiveCategory,
  categoryCounts, categoryCardImages, storeTheme, corretorSlug, getTagStyle, getTagLabel,
  formatPrice, dbProfile,
}: StoreLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Derive unique cities from products
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    (products || []).forEach((p: any) => { if (p.city) cities.add(p.city); });
    return Array.from(cities).sort();
  }, [products]);

  const [filterCity, setFilterCity] = useState("");

  // Apply local filters on top of already-filtered products
  const localFiltered = useMemo(() => {
    let list = filteredProducts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p: any) =>
        p.title?.toLowerCase().includes(q) ||
        p.neighborhood?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q)
      );
    }
    if (filterCity) list = list.filter((p: any) => p.city === filterCity);
    if (minPrice) list = list.filter((p: any) => (p.price || 0) >= Number(minPrice));
    if (maxPrice) list = list.filter((p: any) => (p.price || 0) <= Number(maxPrice));
    if (minBedrooms) list = list.filter((p: any) => (p.bedrooms || 0) >= Number(minBedrooms));
    return list;
  }, [filteredProducts, searchQuery, filterCity, minPrice, maxPrice, minBedrooms]);

  const featuredProduct = localFiltered[0];
  const gridProducts = localFiltered.slice(1);

  // Stats
  const totalItems = (products || []).length;
  const uniqueCities = availableCities.length;

  const categoryIcons: Record<string, React.ReactNode> = {
    casa: <Home size={20} />,
    apartamento: <Building size={20} />,
    terreno: <LandPlot size={20} />,
    comercial: <Store size={20} />,
    todos: <Building2 size={20} />,
  };

  const getSpecIcons = (product: any) => {
    const specs: { icon: React.ReactNode; label: string }[] = [];
    if (product.bedrooms) specs.push({ icon: <Bed size={13} />, label: `${product.bedrooms}` });
    if (product.bathrooms) specs.push({ icon: <Bath size={13} />, label: `${product.bathrooms}` });
    if (product.area) specs.push({ icon: <Ruler size={13} />, label: `${product.area}m²` });
    if (product.parking_spots) specs.push({ icon: <Car size={13} />, label: `${product.parking_spots}` });
    return specs;
  };

  const hasActiveFilters = searchQuery || filterCity || minPrice || maxPrice || minBedrooms;

  const clearFilters = () => {
    setSearchQuery(""); setFilterCity(""); setMinPrice(""); setMaxPrice(""); setMinBedrooms("");
  };

  return (
    <div className="space-y-6">

      {/* ─── Stats Bar ─── */}
      <div
        className="flex items-center justify-center gap-6 py-3 px-4 rounded-xl text-xs font-semibold"
        style={{ background: `${storeTheme.primary}10`, border: `1px solid ${storeTheme.primary}20` }}
      >
        <div className="flex items-center gap-1.5" style={{ color: storeTheme.primary }}>
          <Building2 size={15} />
          <span style={{ color: storeTheme.text }}>{totalItems}</span> imóveis
        </div>
        <div className="w-px h-4" style={{ background: storeTheme.border }} />
        <div className="flex items-center gap-1.5" style={{ color: storeTheme.primary }}>
          <MapPin size={15} />
          <span style={{ color: storeTheme.text }}>{uniqueCities}</span> {uniqueCities === 1 ? "cidade" : "cidades"}
        </div>
        {dbProfile?.creci && (
          <>
            <div className="w-px h-4" style={{ background: storeTheme.border }} />
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: storeTheme.textMuted }}>
              CRECI {dbProfile.creci}
            </div>
          </>
        )}
      </div>

      {/* ─── Search & Filters ─── */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div
            className="flex-1 flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
          >
            <Search size={16} style={{ color: storeTheme.textMuted }} />
            <input
              type="text"
              placeholder="Buscar imóvel, bairro ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: storeTheme.text }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X size={14} style={{ color: storeTheme.textMuted }} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 rounded-xl flex items-center gap-2 text-xs font-bold transition-all"
            style={{
              background: showFilters ? storeTheme.primary : storeTheme.card,
              color: showFilters ? "#fff" : storeTheme.textMuted,
              border: `1px solid ${showFilters ? storeTheme.primary : storeTheme.border}`,
            }}
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>

        {/* Expandable filter row */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
          >
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl"
              style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
            >
              <select
                value={filterCity} onChange={(e) => setFilterCity(e.target.value)}
                className="rounded-lg px-3 py-2 text-xs outline-none"
                style={{ color: storeTheme.text, background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
              >
                <option value="" style={{ background: storeTheme.card, color: storeTheme.text }}>Todas as cidades</option>
                {availableCities.map(c => <option key={c} value={c} style={{ background: storeTheme.card, color: storeTheme.text }}>{c}</option>)}
              </select>
              <input
                type="number" placeholder="Preço mín." value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="rounded-lg px-3 py-2 text-xs outline-none placeholder:opacity-50"
                style={{ color: storeTheme.text, background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
              />
              <input
                type="number" placeholder="Preço máx." value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="rounded-lg px-3 py-2 text-xs outline-none placeholder:opacity-50"
                style={{ color: storeTheme.text, background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
              />
              <select
                value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)}
                className="rounded-lg px-3 py-2 text-xs bg-transparent outline-none"
                style={{ color: storeTheme.text, border: `1px solid ${storeTheme.border}` }}
              >
                <option value="">Quartos</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
          </motion.div>
        )}

        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium" style={{ color: storeTheme.textMuted }}>
              {localFiltered.length} resultado{localFiltered.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={clearFilters}
              className="text-[11px] font-bold underline" style={{ color: storeTheme.primary }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* ─── Category Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {subcategories.filter(c => c.slug !== "todos").slice(0, 4).map((cat) => {
          const isActive = activeCategory === cat.slug;
          const count = categoryCounts[cat.slug] || 0;
          const bgImage = categoryCardImages?.[cat.slug];
          return (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(isActive ? "todos" : cat.slug)}
              className="relative rounded-xl overflow-hidden h-24 sm:h-28 group transition-all"
              style={{
                border: `2px solid ${isActive ? storeTheme.primary : storeTheme.border}`,
              }}
            >
              {bgImage ? (
                <img src={bgImage} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="absolute inset-0" style={{ background: `${storeTheme.primary}15` }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-white">
                {categoryIcons[cat.slug] || <Building2 size={20} />}
                <span className="text-xs font-bold mt-1">{cat.name}</span>
                <span className="text-[10px] opacity-70">{count} {count === 1 ? "imóvel" : "imóveis"}</span>
              </div>
              {isActive && (
                <div className="absolute inset-0 border-2 rounded-xl" style={{ borderColor: storeTheme.primary }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Featured (Hero) Card ─── */}
      {featuredProduct && (
        <Link
          to={`/imoveis/produto/${featuredProduct.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`}
          className="block group"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${storeTheme.border}` }}
          >
            <div className="relative aspect-[21/9] sm:aspect-[21/8] overflow-hidden">
              {featuredProduct.image ? (
                <img
                  src={featuredProduct.image} alt={featuredProduct.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.border }}>
                  <Image size={48} style={{ color: storeTheme.textMuted }} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

              {featuredProduct.tag && (
                <span className={`absolute top-4 left-4 px-3 py-1 rounded-md text-[10px] font-bold uppercase ${getTagStyle(featuredProduct.tag)}`}>
                  {getTagLabel(featuredProduct.tag)}
                </span>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                <span
                  className="inline-block px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest mb-2"
                  style={{ background: storeTheme.primary, color: "#fff" }}
                >
                  ★ Destaque
                </span>
                <h2 className="text-white font-bold text-lg sm:text-2xl line-clamp-2 mb-1 drop-shadow-lg">
                  {featuredProduct.title}
                </h2>
                {featuredProduct.city && (
                  <p className="text-white/70 text-xs flex items-center gap-1 mb-2">
                    <MapPin size={12} />
                    {featuredProduct.neighborhood ? `${featuredProduct.neighborhood}, ${featuredProduct.city}` : featuredProduct.city}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  {featuredProduct.price > 0 && (
                    <span className="text-white font-extrabold text-xl sm:text-2xl">
                      R$ {featuredProduct.price.toLocaleString("pt-BR")}
                    </span>
                  )}
                  {getSpecIcons(featuredProduct).map((spec, idx) => (
                    <span key={idx} className="text-white/80 text-xs flex items-center gap-1">
                      {spec.icon} {spec.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
      )}

      {/* ─── Property Grid ─── */}
      {gridProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gridProducts.map((product: any, i: number) => {
            const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
            const specs = getSpecIcons(product);
            const hasPrice = product.price > 0;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
              >
                <Link
                  to={productLink}
                  className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
                  style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.border }}>
                        <Image size={32} style={{ color: storeTheme.textMuted }} />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                    {product.tag && (
                      <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${getTagStyle(product.tag)}`}>
                        {getTagLabel(product.tag)}
                      </span>
                    )}
                    {hasPrice && (
                      <div className="absolute bottom-3 left-3">
                        <p className="text-white font-bold text-lg drop-shadow-lg">
                          R$ {product.price.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm line-clamp-2 leading-snug mb-2" style={{ color: storeTheme.text }}>
                      {product.title}
                    </h3>
                    {product.city && (
                      <p className="text-[11px] flex items-center gap-1 mb-3" style={{ color: storeTheme.textMuted }}>
                        <MapPin size={11} />
                        {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
                      </p>
                    )}
                    {specs.length > 0 && (
                      <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: storeTheme.border }}>
                        {specs.map((spec, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-[11px] font-medium" style={{ color: storeTheme.textMuted }}>
                            <span style={{ color: storeTheme.primary }}>{spec.icon}</span>
                            {spec.label}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide" style={{ color: storeTheme.primary }}>
                      <span>Ver detalhes</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : localFiltered.length === 0 && !featuredProduct ? (
        <div className="text-center py-24">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" style={{ color: storeTheme.textMuted }} />
          <p className="text-sm font-medium" style={{ color: storeTheme.textMuted }}>Nenhum imóvel encontrado</p>
          <p className="text-xs mt-1 opacity-60" style={{ color: storeTheme.textMuted }}>Tente outra categoria ou limpe os filtros</p>
        </div>
      ) : null}
    </div>
  );
}
