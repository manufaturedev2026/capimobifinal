import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Image, ChevronLeft, ChevronRight, Play, Plus,
  MessageCircle, Bed, Bath, Maximize, Car, Info, ChevronDown,
  Volume2, VolumeX,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";

/* ═══════════════════════════════════════════
   Netflix-style horizontal content row
   ═══════════════════════════════════════════ */
function NetflixRow({ title, items, corretorSlug, getTagLabel, accent }: {
  title: string;
  items: any[];
  corretorSlug: string | null;
  getTagLabel: (tag: string) => string;
  accent: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => { checkArrows(); }, [items.length, checkArrows]);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * (scrollRef.current.clientWidth * 0.8), behavior: "smooth" });
    setTimeout(checkArrows, 500);
  };

  if (!items.length) return null;

  return (
    <div className="mb-6 md:mb-8 group/row relative">
      <h3 className="font-bold text-sm md:text-base text-white mb-2 md:mb-3 px-4 md:px-12 flex items-center gap-2 hover:text-[#e50914] transition-colors cursor-default">
        {title}
        <ChevronRight size={14} className="opacity-0 group-hover/row:opacity-100 transition-opacity text-[#e50914]" />
      </h3>

      <div className="relative">
        {/* Arrows */}
        {showLeft && (
          <button onClick={() => scroll(-1)}
            className="absolute left-0 top-0 bottom-0 w-10 md:w-12 z-20 flex items-center justify-center bg-black/60 opacity-0 group-hover/row:opacity-100 transition-opacity rounded-r"
          >
            <ChevronLeft size={28} className="text-white" />
          </button>
        )}
        {showRight && (
          <button onClick={() => scroll(1)}
            className="absolute right-0 top-0 bottom-0 w-10 md:w-12 z-20 flex items-center justify-center bg-black/60 opacity-0 group-hover/row:opacity-100 transition-opacity rounded-l"
          >
            <ChevronRight size={28} className="text-white" />
          </button>
        )}

        <div ref={scrollRef} onScroll={checkArrows}
          className="flex gap-1 md:gap-1.5 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-12">
          {items.map((product: any, i: number) => (
            <NetflixCard key={product.id} product={product} index={i} corretorSlug={corretorSlug} getTagLabel={getTagLabel} accent={accent} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Netflix card with hover expansion
   ═══════════════════════════════════════════ */
function NetflixCard({ product, index, corretorSlug, getTagLabel, accent }: {
  product: any; index: number; corretorSlug: string | null; getTagLabel: (tag: string) => string; accent: string;
}) {
  const [hovered, setHovered] = useState(false);
  const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;

  return (
    <div
      className="flex-shrink-0 relative"
      style={{ width: "clamp(130px, 18vw, 230px)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={productLink} className="block">
        <motion.div
          animate={hovered ? { scale: 1.3, zIndex: 30 } : { scale: 1, zIndex: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative rounded-md overflow-visible"
          style={{ transformOrigin: index === 0 ? "left center" : "center center" }}
        >
          {/* Poster */}
          <div className="relative aspect-[16/9] rounded-md overflow-hidden">
            {product.image ? (
              <img src={product.image} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                <Image size={24} className="text-gray-600" />
              </div>
            )}

            {/* Sold */}
            {product.status === "vendido" && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <span className="text-red-500 font-bold text-[10px] uppercase tracking-widest">Vendido</span>
              </div>
            )}

            {/* Tag */}
            {product.tag && (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#e50914] text-white">
                {getTagLabel(product.tag)}
              </span>
            )}
          </div>

          {/* Hover expanded panel */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-[#181818] rounded-b-md shadow-2xl overflow-hidden border-t-0"
                style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.8)" }}
              >
                <div className="p-3">
                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-white/80 transition">
                      <Play size={14} fill="#000" className="text-black ml-0.5" />
                    </span>
                    <span className="w-7 h-7 rounded-full border-2 border-gray-400 flex items-center justify-center hover:border-white transition">
                      <Plus size={14} className="text-white" />
                    </span>
                    <span className="ml-auto w-7 h-7 rounded-full border-2 border-gray-400 flex items-center justify-center hover:border-white transition">
                      <ChevronDown size={14} className="text-white" />
                    </span>
                  </div>

                  {/* Price */}
                  {product.price > 0 && (
                    <p className="font-bold text-sm text-green-400 mb-1">
                      R$ {product.price.toLocaleString("pt-BR")}
                    </p>
                  )}

                  {/* Title */}
                  <p className="text-white text-[11px] font-semibold leading-tight line-clamp-2 mb-1.5">
                    {product.title}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-2 flex-wrap">
                    {product.bedrooms && (
                      <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                        <Bed size={9} /> {product.bedrooms} qts
                      </span>
                    )}
                    {product.bathrooms && (
                      <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                        <Bath size={9} /> {product.bathrooms}
                      </span>
                    )}
                    {product.area && (
                      <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                        <Maximize size={9} /> {product.area}m²
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  {product.city && (
                    <p className="text-[9px] text-gray-500 mt-1 flex items-center gap-0.5">
                      <MapPin size={8} /> {product.city}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Netflix Layout
   ═══════════════════════════════════════════ */
export default function StoreLayoutNetflix({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, categoryCardImages, storeTheme, corretorSlug,
  isDbProfile, dbProfile, handleWhatsApp, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  const [billboardIdx, setBillboardIdx] = useState(0);
  const accent = "#e50914"; // Netflix red

  const billboard = filteredProducts.filter((p: any) => p.image).slice(0, 6);
  const currentBillboard = billboard[billboardIdx];

  useEffect(() => {
    if (billboard.length <= 1) return;
    const t = setInterval(() => setBillboardIdx(p => (p + 1) % billboard.length), 7000);
    return () => clearInterval(t);
  }, [billboard.length]);

  // Build category rows
  const categoryMap: Record<string, string[]> = {
    casas: ["casa"], apartamentos: ["apartamento"], terrenos: ["terreno"],
    comerciais: ["comercial"], alugueis: ["aluguel"], aluguel: ["aluguel"],
    flats: ["flat"], galpoes: ["galpao"],
  };
  const rows = subcategories
    .filter(c => c.slug !== "todos" && (categoryCounts[c.slug] || 0) > 0)
    .map(c => ({
      name: c.name,
      items: filteredProducts.filter((p: any) => (categoryMap[c.slug] || []).includes(p.category)),
    }))
    .filter(r => r.items.length > 0);

  return (
    <div className="-mx-4 md:-mx-8" style={{ background: "#141414" }}>
      {/* ══════ BILLBOARD ══════ */}
      {billboard.length > 0 && currentBillboard && (
        <div className="relative w-full mb-4" style={{ aspectRatio: "16/7" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBillboard.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
            >
              <img src={currentBillboard.image} alt={currentBillboard.title} className="w-full h-full object-cover" />
              {/* Netflix-style gradients */}
              <div className="absolute inset-0" style={{
                background: "linear-gradient(to right, #141414 0%, rgba(20,20,20,0.7) 30%, transparent 60%)",
              }} />
              <div className="absolute inset-0" style={{
                background: "linear-gradient(to top, #141414 0%, rgba(20,20,20,0.4) 40%, transparent 70%)",
              }} />
            </motion.div>
          </AnimatePresence>

          {/* Billboard content */}
          <div className="absolute bottom-[15%] left-4 md:left-12 z-10 max-w-md">
            {/* Fake Netflix "N" badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#e50914] font-black text-lg leading-none">N</span>
              <span className="text-[10px] text-gray-300 uppercase tracking-[0.3em] font-semibold">Imóvel em Destaque</span>
            </div>

            <h2 className="font-black text-2xl md:text-4xl lg:text-5xl text-white leading-[1.1] drop-shadow-lg">
              {currentBillboard.title}
            </h2>

            {currentBillboard.city && (
              <p className="text-white/60 text-xs md:text-sm mt-2 flex items-center gap-1">
                <MapPin size={12} /> {currentBillboard.neighborhood ? `${currentBillboard.neighborhood}, ${currentBillboard.city}` : currentBillboard.city}
              </p>
            )}

            {currentBillboard.price > 0 && (
              <p className="font-black text-xl md:text-2xl text-green-400 mt-2">
                R$ {currentBillboard.price.toLocaleString("pt-BR")}
              </p>
            )}

            {/* Description snippet */}
            {currentBillboard.description && (
              <p className="text-gray-300 text-xs md:text-sm mt-2 line-clamp-2 max-w-sm">
                {currentBillboard.description}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              <Link
                to={`/imoveis/produto/${currentBillboard.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`}
                className="inline-flex items-center gap-2 px-5 md:px-7 py-2 md:py-2.5 rounded font-bold text-sm md:text-base bg-white text-black hover:bg-white/80 transition-all"
              >
                <Play size={18} fill="black" /> Ver Detalhes
              </Link>
              <button
                onClick={() => handleWhatsApp(currentBillboard.title, currentBillboard.id)}
                className="inline-flex items-center gap-2 px-5 md:px-7 py-2 md:py-2.5 rounded font-bold text-sm md:text-base text-white transition-all"
                style={{ background: "rgba(109,109,110,0.7)" }}
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
            </div>
          </div>

          {/* Episode indicators (Netflix style) */}
          {billboard.length > 1 && (
            <div className="absolute right-4 md:right-12 bottom-[15%] z-10 flex flex-col gap-0.5">
              {billboard.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setBillboardIdx(idx)}
                  className="w-1 transition-all rounded-full"
                  style={{
                    height: idx === billboardIdx ? 20 : 8,
                    background: idx === billboardIdx ? "#e50914" : "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Maturity rating style badge */}
          <div className="absolute right-4 md:right-12 bottom-[5%] z-10 flex items-center gap-2">
            <span className="px-2 py-0.5 border border-white/30 text-white/70 text-[10px] font-semibold">
              {filteredProducts.length} imóveis
            </span>
          </div>
        </div>
      )}

      {/* ══════ CATEGORY TABS ══════ */}
      <div className="px-4 md:px-12 mb-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          {subcategories.filter(c => c.slug === "todos" || (categoryCounts[c.slug] || 0) > 0).map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold transition-all rounded"
                style={{
                  background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                  borderBottom: isActive ? `2px solid ${accent}` : "2px solid transparent",
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════ CONTENT ROWS ══════ */}
      <div className="pb-8">
        {activeCategory === "todos" && rows.length > 1 ? (
          <>
            <NetflixRow title="Em Alta 🔥" items={filteredProducts.slice(0, 10)} corretorSlug={corretorSlug} getTagLabel={getTagLabel} accent={accent} />
            <NetflixRow title="Adicionados Recentemente" items={[...filteredProducts].reverse().slice(0, 10)} corretorSlug={corretorSlug} getTagLabel={getTagLabel} accent={accent} />
            {rows.map((row) => (
              <NetflixRow key={row.name} title={row.name} items={row.items} corretorSlug={corretorSlug} getTagLabel={getTagLabel} accent={accent} />
            ))}
          </>
        ) : (
          <NetflixRow
            title={activeCategory === "todos" ? "Todos" : subcategories.find(c => c.slug === activeCategory)?.name || "Resultados"}
            items={filteredProducts}
            corretorSlug={corretorSlug}
            getTagLabel={getTagLabel}
            accent={accent}
          />
        )}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20 px-4">
          <Image size={48} className="mx-auto mb-3 text-gray-600" />
          <p className="text-lg font-medium text-gray-400">Nenhum imóvel encontrado</p>
          <button onClick={() => setActiveCategory("todos")} className="text-[#e50914] text-sm mt-2 hover:underline">Ver todos</button>
        </div>
      )}
    </div>
  );
}
