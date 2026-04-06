import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Image, ChevronLeft, ChevronRight, Play, Info, MessageCircle, Bed, Bath, Maximize, Car } from "lucide-react";
import type { StoreLayoutProps } from "./types";

/* ─── Netflix-style horizontal scroll row ─── */
function ContentRow({ title, items, storeTheme, corretorSlug, getTagStyle, getTagLabel }: {
  title: string;
  items: any[];
  storeTheme: any;
  corretorSlug: string | null;
  getTagStyle: (tag: string) => string;
  getTagLabel: (tag: string) => string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => { checkScroll(); }, [items.length]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    setTimeout(checkScroll, 400);
  };

  if (items.length === 0) return null;

  return (
    <div className="mb-8 group/row relative">
      <h3 className="font-display font-bold text-base md:text-lg mb-3 px-1" style={{ color: storeTheme.text }}>
        {title}
        <span className="text-xs font-normal ml-2" style={{ color: storeTheme.textMuted }}>({items.length})</span>
      </h3>

      <div className="relative">
        {/* Scroll arrows */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 w-12 z-20 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.7), transparent)" }}
          >
            <ChevronLeft size={28} className="text-white" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 w-12 z-20 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            style={{ background: "linear-gradient(to left, rgba(0,0,0,0.7), transparent)" }}
          >
            <ChevronRight size={28} className="text-white" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth -mx-4 px-4"
        >
          {items.map((product: any, i: number) => {
            const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 w-[160px] sm:w-[200px] md:w-[220px] lg:w-[240px]"
              >
                <Link
                  to={productLink}
                  className="group/card block rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-2xl relative"
                  style={{ background: storeTheme.card }}
                >
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.card }}>
                        <Image size={32} style={{ color: storeTheme.textMuted }} />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    {/* Tag */}
                    {product.tag && (
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold shadow ${getTagStyle(product.tag)}`}>
                        {getTagLabel(product.tag)}
                      </span>
                    )}

                    {/* Sold overlay */}
                    {product.status === "vendido" && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-red-500 font-bold text-sm px-3 py-1 rounded bg-black/50">VENDIDO</span>
                      </div>
                    )}

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h4 className="font-display font-bold text-xs text-white leading-tight line-clamp-2">
                        {product.title}
                      </h4>
                      {product.price > 0 && (
                        <p className="font-display font-bold text-sm mt-1" style={{ color: storeTheme.primary }}>
                          R$ {product.price.toLocaleString("pt-BR")}
                        </p>
                      )}
                      {product.city && (
                        <p className="text-[9px] text-white/50 mt-0.5 flex items-center gap-0.5">
                          <MapPin size={8} /> {product.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Hover expanded info */}
                  <div className="hidden group-hover/card:block absolute left-0 right-0 bottom-0 translate-y-full p-3 z-30 rounded-b-lg"
                    style={{ background: storeTheme.card, borderTop: `2px solid ${storeTheme.primary}` }}>
                    <div className="flex gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-white" style={{ background: storeTheme.primary }}>
                        <Play size={8} /> Detalhes
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {product.bedrooms && (
                        <span className="text-[9px] flex items-center gap-0.5" style={{ color: storeTheme.textMuted }}>
                          <Bed size={9} /> {product.bedrooms} qts
                        </span>
                      )}
                      {product.bathrooms && (
                        <span className="text-[9px] flex items-center gap-0.5" style={{ color: storeTheme.textMuted }}>
                          <Bath size={9} /> {product.bathrooms}
                        </span>
                      )}
                      {product.area && (
                        <span className="text-[9px] flex items-center gap-0.5" style={{ color: storeTheme.textMuted }}>
                          <Maximize size={9} /> {product.area}m²
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function StoreLayoutNetflix({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, categoryCardImages, storeTheme, corretorSlug,
  isDbProfile, dbProfile, handleWhatsApp, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  const [featuredIdx, setFeaturedIdx] = useState(0);

  const featured = filteredProducts.filter((p: any) => p.image).slice(0, 5);
  const featuredProduct = featured[featuredIdx];

  // Auto-rotate featured
  useEffect(() => {
    if (featured.length <= 1) return;
    const t = setInterval(() => setFeaturedIdx(p => (p + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [featured.length]);

  // Group products by category for rows
  const categoryRows = subcategories
    .filter(c => c.slug !== "todos" && (categoryCounts[c.slug] || 0) > 0)
    .map(c => ({
      name: c.name,
      items: filteredProducts.filter((p: any) => {
        if (c.slug === "casas") return p.category === "casa";
        if (c.slug === "apartamentos") return p.category === "apartamento";
        if (c.slug === "terrenos") return p.category === "terreno";
        if (c.slug === "comerciais") return p.category === "comercial";
        if (c.slug === "alugueis" || c.slug === "aluguel") return p.category === "aluguel";
        if (c.slug === "flats") return p.category === "flat";
        if (c.slug === "galpoes") return p.category === "galpao";
        return false;
      }),
    }))
    .filter(r => r.items.length > 0);

  return (
    <div>
      {/* ══════ BILLBOARD / FEATURED HERO ══════ */}
      {featured.length > 0 && featuredProduct && (
        <div className="relative rounded-xl overflow-hidden mb-8" style={{ aspectRatio: "16/7" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={featuredProduct.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <img src={featuredProduct.image} alt={featuredProduct.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 z-10 max-w-lg">
            {featuredProduct.tag && (
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-2 text-white"
                style={{ background: `${storeTheme.primary}cc` }}>
                {getTagLabel(featuredProduct.tag)}
              </span>
            )}
            <h2 className="font-display font-black text-xl md:text-3xl text-white leading-tight drop-shadow-lg">
              {featuredProduct.title}
            </h2>
            {featuredProduct.city && (
              <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                <MapPin size={11} /> {featuredProduct.neighborhood ? `${featuredProduct.neighborhood}, ${featuredProduct.city}` : featuredProduct.city}
              </p>
            )}
            {featuredProduct.price > 0 && (
              <p className="font-display font-black text-2xl md:text-3xl mt-2" style={{ color: storeTheme.primary }}>
                R$ {featuredProduct.price.toLocaleString("pt-BR")}
              </p>
            )}

            <div className="flex gap-2 mt-4">
              <Link
                to={`/imoveis/produto/${featuredProduct.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-sm text-black transition-all hover:opacity-90"
                style={{ background: "#fff" }}
              >
                <Play size={16} fill="black" /> Ver Detalhes
              </Link>
              <button
                onClick={() => handleWhatsApp(featuredProduct.title, featuredProduct.id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-sm text-white transition-all hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
            </div>
          </div>

          {/* Indicators */}
          {featured.length > 1 && (
            <div className="absolute bottom-3 right-5 flex gap-1.5 z-10">
              {featured.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeaturedIdx(idx)}
                  className="w-8 h-1 rounded-full transition-all"
                  style={{ background: idx === featuredIdx ? "#fff" : "rgba(255,255,255,0.3)" }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════ CATEGORY TABS (mobile) ══════ */}
      <div className="lg:hidden mb-6">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 snap-x snap-mandatory -mx-4 px-4">
          {subcategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.slug;
            const count = categoryCounts[cat.slug] || 0;
            const isDisabled = cat.slug !== "todos" && count === 0;
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                disabled={isDisabled}
                className="flex-shrink-0 snap-start relative w-[110px] h-[155px] rounded-lg overflow-hidden transition-all duration-300"
                style={{
                  boxShadow: isActive ? `0 0 20px ${storeTheme.primary}40` : "0 2px 8px rgba(0,0,0,0.3)",
                  border: isActive ? `2px solid ${storeTheme.primary}` : "2px solid transparent",
                  opacity: isDisabled ? 0.4 : 1,
                }}
              >
                <img src={categoryCardImages[cat.slug] || cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5 text-left">
                  <div className="w-6 h-6 rounded bg-white/15 backdrop-blur-sm flex items-center justify-center mb-1">
                    <Icon size={12} className="text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-white leading-tight block">{cat.name}</span>
                  {(count > 0 || cat.slug === "todos") && (
                    <span className="text-[9px] text-white/50 font-medium block">{count}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════ CONTENT ROWS ══════ */}
      {activeCategory === "todos" && categoryRows.length > 1 ? (
        /* Show by category rows like Netflix */
        <>
          {/* "Todos" row first */}
          <ContentRow
            title="Em Alta"
            items={filteredProducts.slice(0, 10)}
            storeTheme={storeTheme}
            corretorSlug={corretorSlug}
            getTagStyle={getTagStyle}
            getTagLabel={getTagLabel}
          />
          {categoryRows.map((row) => (
            <ContentRow
              key={row.name}
              title={row.name}
              items={row.items}
              storeTheme={storeTheme}
              corretorSlug={corretorSlug}
              getTagStyle={getTagStyle}
              getTagLabel={getTagLabel}
            />
          ))}
        </>
      ) : (
        /* Filtered view — standard horizontal row */
        <ContentRow
          title={activeCategory === "todos" ? "Todos" : subcategories.find(c => c.slug === activeCategory)?.name || "Resultados"}
          items={filteredProducts}
          storeTheme={storeTheme}
          corretorSlug={corretorSlug}
          getTagStyle={getTagStyle}
          getTagLabel={getTagLabel}
        />
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-20 rounded-xl" style={{ background: storeTheme.card }}>
          <Image size={48} className="mx-auto mb-3" style={{ color: storeTheme.textMuted }} />
          <p className="text-lg font-medium" style={{ color: storeTheme.textMuted }}>Nenhum anúncio nesta categoria</p>
          <button onClick={() => setActiveCategory("todos")} style={{ color: storeTheme.primary }} className="text-sm mt-2 hover:underline">Ver todos</button>
        </div>
      )}
    </div>
  );
}
