import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Easing } from "framer-motion";
import {
  MapPin, Image, Search, Bed, Bath, Ruler, Home, Building2,
  Store, Trees, Key, Landmark, Phone, ShieldCheck, Globe, Megaphone,
  ArrowRight, X, ChevronRight,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";

const QUICK_ACTIONS = [
  { slug: "casa", name: "Casas", desc: "Residenciais", icon: Home },
  { slug: "apartamento", name: "Apartamentos", desc: "Condomínios", icon: Building2 },
  { slug: "aluguel", name: "Aluguel", desc: "Locação", icon: Key },
  { slug: "terreno", name: "Terrenos", desc: "Lotes & áreas", icon: Trees },
  { slug: "comercial", name: "Comerciais", desc: "Salas & lojas", icon: Store },
  { slug: "flat", name: "Flats", desc: "Compactos", icon: Landmark },
];

const BENEFITS = [
  { icon: Phone, title: "Contato Direto", desc: "Fale direto com o corretor via WhatsApp" },
  { icon: Globe, title: "Cobertura Regional", desc: "Imóveis em todas as cidades do ES" },
  { icon: ShieldCheck, title: "Vendedores Verificados", desc: "Corretores com CRECI ativo" },
  { icon: Megaphone, title: "Anuncie Grátis", desc: "Cadastre seu imóvel sem custo" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

export default function StoreLayoutMarketplace({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, dbProfile, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const visibleProducts = searchTerm
    ? filteredProducts.filter((p: any) =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredProducts;

  const heroImage = filteredProducts[0]?.image || "";
  const cityName = dbProfile?.city || "sua cidade";

  const activeCats = subcategories.filter(c => c.slug === "todos" || (categoryCounts[c.slug] || 0) > 0);

  return (
    <div style={{ background: `${storeTheme.bg}` }}>

      {/* ═══════════════════════════════════════════════════════════════
          HERO BANNER
      ═══════════════════════════════════════════════════════════════ */}
      <motion.section {...fadeUp()} className="relative h-[340px] md:h-[420px] overflow-hidden rounded-b-3xl">
        {heroImage ? (
          <img src={heroImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${storeTheme.primary}, #1a1a2e)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-12 max-w-6xl mx-auto">
          <motion.h1
            {...fadeUp(0.15)}
            className="font-display font-extrabold text-3xl md:text-5xl text-white leading-tight drop-shadow-lg"
          >
            Imóveis em {cityName}
          </motion.h1>
          <motion.p {...fadeUp(0.25)} className="text-white/70 text-sm md:text-base mt-2 max-w-md">
            Encontre casas, apartamentos e terrenos com os melhores corretores da região.
          </motion.p>
          <motion.div {...fadeUp(0.35)}>
            <button
              onClick={() => {
                const el = document.getElementById("marketplace-grid");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white shadow-lg transition-transform hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${storeTheme.primary}, #1a5fcc)` }}
            >
              Ver ofertas <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════
          FLOATING SEARCH BAR
      ═══════════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.2)} className="max-w-6xl mx-auto px-4 -mt-7 relative z-20">
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl"
          style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
        >
          <Search size={20} style={{ color: storeTheme.textMuted }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por tipo, bairro ou cidade..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
            style={{ color: storeTheme.text }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="p-1 rounded-lg hover:opacity-70">
              <X size={16} style={{ color: storeTheme.textMuted }} />
            </button>
          )}
          <button
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-transform hover:scale-105"
            style={{ background: storeTheme.primary }}
            onClick={() => {
              const el = document.getElementById("marketplace-grid");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Buscar
          </button>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4">

        {/* ═══════════════════════════════════════════════════════════════
            QUICK ACTIONS
        ═══════════════════════════════════════════════════════════════ */}
        <motion.section {...fadeUp(0.15)} className="mt-8 mb-8">
          <h2 className="font-display font-bold text-lg mb-4" style={{ color: storeTheme.text }}>
            O que você procura?
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-6 md:overflow-visible">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const isActive = activeCategory === action.slug;
              const count = categoryCounts[action.slug] || 0;
              return (
                <button
                  key={action.slug}
                  onClick={() => {
                    setActiveCategory(isActive ? "todos" : action.slug);
                    setTimeout(() => document.getElementById("marketplace-grid")?.scrollIntoView({ behavior: "smooth" }), 100);
                  }}
                  className="flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl transition-all min-w-[100px] group"
                  style={{
                    background: isActive ? `${storeTheme.primary}12` : storeTheme.card,
                    border: `1.5px solid ${isActive ? storeTheme.primary : storeTheme.border}`,
                    boxShadow: isActive ? `0 4px 16px ${storeTheme.primary}25` : "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                      background: isActive ? `${storeTheme.primary}20` : `${storeTheme.border}80`,
                      color: isActive ? storeTheme.primary : storeTheme.textMuted,
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: isActive ? storeTheme.primary : storeTheme.text }}>
                    {action.name}
                  </span>
                  <span className="text-[10px] leading-tight" style={{ color: storeTheme.textMuted }}>
                    {count > 0 ? `${count} imóveis` : action.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════
            PROMO BANNERS
        ═══════════════════════════════════════════════════════════════ */}
        <motion.section {...fadeUp(0.2)} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Banner 1 - Todos os Imóveis */}
          <div
            className="relative h-44 md:h-48 rounded-2xl overflow-hidden group cursor-pointer"
            onClick={() => { setActiveCategory("todos"); setTimeout(() => document.getElementById("marketplace-grid")?.scrollIntoView({ behavior: "smooth" }), 100); }}
          >
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, #0d47a1, ${storeTheme.primary})` }} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-center p-6">
              <h3 className="font-display font-extrabold text-xl md:text-2xl text-white leading-tight">
                Todos os<br />Imóveis
              </h3>
              <p className="text-white/70 text-xs mt-1.5 max-w-[200px]">
                Veja todos os imóveis disponíveis na região
              </p>
              <span className="inline-flex items-center gap-1 text-white/90 text-xs font-bold mt-3 group-hover:gap-2 transition-all">
                Explorar <ArrowRight size={14} />
              </span>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20">
              <Home size={120} className="absolute -right-4 top-1/2 -translate-y-1/2 text-white" />
            </div>
          </div>

          {/* Banner 2 - Casa Própria */}
          <div
            className="relative h-44 md:h-48 rounded-2xl overflow-hidden group cursor-pointer"
            onClick={() => setActiveCategory("casa")}
          >
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, #1b5e20, #43a047)` }} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-center p-6">
              <h3 className="font-display font-extrabold text-xl md:text-2xl text-white leading-tight">
                Casa<br />Própria
              </h3>
              <p className="text-white/70 text-xs mt-1.5 max-w-[200px]">
                As melhores casas para você e sua família
              </p>
              <span className="inline-flex items-center gap-1 text-white/90 text-xs font-bold mt-3 group-hover:gap-2 transition-all">
                Explorar <ArrowRight size={14} />
              </span>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20">
              <Building2 size={120} className="absolute -right-4 top-1/2 -translate-y-1/2 text-white" />
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════
            CATEGORY GRID (circular photos)
        ═══════════════════════════════════════════════════════════════ */}
        {activeCats.length > 2 && (
          <motion.section {...fadeUp(0.25)} className="mb-8">
            <h2 className="font-display font-bold text-lg mb-4" style={{ color: storeTheme.text }}>
              Categorias
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {activeCats.filter(c => c.slug !== "todos").map((cat) => {
                const isActive = activeCategory === cat.slug;
                const Icon = QUICK_ACTIONS.find(a => a.slug === cat.slug)?.icon || Home;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => setActiveCategory(isActive ? "todos" : cat.slug)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div
                      className="w-16 h-16 md:w-18 md:h-18 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: isActive ? `${storeTheme.primary}15` : storeTheme.card,
                        border: `2.5px solid ${isActive ? storeTheme.primary : storeTheme.border}`,
                        boxShadow: isActive ? `0 0 12px ${storeTheme.primary}30` : "none",
                      }}
                    >
                      <Icon size={24} style={{ color: isActive ? storeTheme.primary : storeTheme.textMuted }} />
                    </div>
                    <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: isActive ? storeTheme.primary : storeTheme.text }}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            RESULTS HEADER
        ═══════════════════════════════════════════════════════════════ */}
        <div id="marketplace-grid" className="mb-3 flex items-center justify-between scroll-mt-20">
          <p className="text-xs font-medium" style={{ color: storeTheme.textMuted }}>
            {visibleProducts.length} {visibleProducts.length === 1 ? "resultado" : "resultados"}
          </p>
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-xs font-semibold" style={{ color: storeTheme.primary }}>
              Limpar busca
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            PRODUCT GRID
        ═══════════════════════════════════════════════════════════════ */}
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
            {visibleProducts.map((product: any, i: number) => {
              const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.4 }}
                >
                  <Link
                    to={productLink}
                    className="block rounded-2xl overflow-hidden group transition-shadow hover:shadow-xl"
                    style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.border }}>
                          <Image size={28} style={{ color: storeTheme.textMuted }} />
                        </div>
                      )}
                      {product.tag && (
                        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold shadow ${getTagStyle(product.tag)}`}>
                          {getTagLabel(product.tag)}
                        </span>
                      )}
                      {product.isAluguel && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold shadow-md" style={{ background: storeTheme.primary, color: "#fff" }}>
                          🏠 Aluguel
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-xs font-semibold line-clamp-2 leading-snug mb-1.5" style={{ color: storeTheme.text }}>
                        {product.title}
                      </h3>
                      {product.price > 0 && (
                        <p className="text-base font-bold text-emerald-500">
                          R$ {product.price.toLocaleString("pt-BR")}
                          {product.isAluguel && <span className="text-[10px] font-normal ml-0.5" style={{ color: storeTheme.textMuted }}>/mês</span>}
                        </p>
                      )}
                      {product.accepts_financing && (
                        <p className="text-[9px] mt-0.5 font-medium" style={{ color: "#00a650" }}>✓ Aceita financiamento</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-[10px]" style={{ color: storeTheme.textMuted }}>
                        {product.bedrooms > 0 && <span className="flex items-center gap-0.5"><Bed size={10} /> {product.bedrooms}</span>}
                        {product.bathrooms > 0 && <span className="flex items-center gap-0.5"><Bath size={10} /> {product.bathrooms}</span>}
                        {product.area > 0 && <span className="flex items-center gap-0.5"><Ruler size={10} /> {product.area}m²</span>}
                      </div>
                      {product.city && (
                        <p className="text-[10px] mt-1.5 flex items-center gap-1 truncate" style={{ color: storeTheme.textMuted }}>
                          <MapPin size={9} className="flex-shrink-0" />
                          {product.neighborhood ? `${product.neighborhood}, ${product.city}` : product.city}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl mb-10" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
            <Search size={36} className="mx-auto mb-3 opacity-20" style={{ color: storeTheme.textMuted }} />
            <p className="text-sm font-medium" style={{ color: storeTheme.textMuted }}>
              {searchTerm ? "Nenhum resultado para essa busca" : "Nenhum anúncio encontrado"}
            </p>
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="mt-2 text-xs font-semibold" style={{ color: storeTheme.primary }}>
                Limpar busca
              </button>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            BENEFITS BAR
        ═══════════════════════════════════════════════════════════════ */}
        <motion.section {...fadeUp(0.3)} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {BENEFITS.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <div
                key={i}
                className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl"
                style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${storeTheme.primary}12`, color: storeTheme.primary }}
                >
                  <Icon size={20} />
                </div>
                <h4 className="text-xs font-bold" style={{ color: storeTheme.text }}>{benefit.title}</h4>
                <p className="text-[10px] leading-relaxed" style={{ color: storeTheme.textMuted }}>{benefit.desc}</p>
              </div>
            );
          })}
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════
            CTA FINAL
        ═══════════════════════════════════════════════════════════════ */}
        <motion.section {...fadeUp(0.35)} className="mb-10">
          <div
            className="rounded-2xl p-8 md:p-12 text-center"
            style={{ background: `linear-gradient(135deg, #0d2137, ${storeTheme.primary}90)` }}
          >
            <h2 className="font-display font-extrabold text-xl md:text-2xl text-white mb-2">
              Quer anunciar seu imóvel?
            </h2>
            <p className="text-white/60 text-sm max-w-md mx-auto mb-5">
              Cadastre-se gratuitamente e alcance milhares de compradores na região.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl font-bold text-sm transition-transform hover:scale-105 shadow-lg"
              style={{ background: "#ffffff", color: storeTheme.primary }}
            >
              Anunciar Grátis <ArrowRight size={16} />
            </Link>
          </div>
        </motion.section>

      </div>
    </div>
  );
}
