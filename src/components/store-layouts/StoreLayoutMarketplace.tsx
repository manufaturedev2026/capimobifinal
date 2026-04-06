import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  MapPin, Image, Search, Bed, Bath, Ruler, Home, Building2,
  Store, Trees, Key, Landmark, Phone, ShieldCheck, Globe, Megaphone,
  ArrowRight, X, Sparkles, Crown, Star,
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

/* ── Floating particles component ── */
function FloatingParticles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: color,
            opacity: 0.15 + Math.random() * 0.2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -40 - Math.random() * 60, 0],
            x: [0, (Math.random() - 0.5) * 30, 0],
            opacity: [0.1, 0.35, 0.1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Shimmer line animation ── */
function ShimmerLine({ color }: { color: string }) {
  return (
    <motion.div
      className="h-[1px] w-full"
      style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
      animate={{ opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function StoreLayoutMarketplace({
  filteredProducts, subcategories, activeCategory, setActiveCategory,
  categoryCounts, storeTheme, corretorSlug, dbProfile, getTagStyle, getTagLabel,
}: StoreLayoutProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [heroIdx, setHeroIdx] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  const visibleProducts = searchTerm
    ? filteredProducts.filter((p: any) =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredProducts;

  const heroImages = filteredProducts.slice(0, 5).map((p: any) => p.image).filter(Boolean);
  const cityName = dbProfile?.city || "sua cidade";
  const activeCats = subcategories.filter(c => c.slug === "todos" || (categoryCounts[c.slug] || 0) > 0);

  // Auto-rotate hero
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const t = setInterval(() => setHeroIdx(prev => (prev + 1) % heroImages.length), 5000);
    return () => clearInterval(t);
  }, [heroImages.length]);

  const scrollToGrid = () => setTimeout(() => document.getElementById("marketplace-grid")?.scrollIntoView({ behavior: "smooth" }), 100);

  return (
    <div style={{ background: storeTheme.bg }}>

      {/* ═══ HERO — Parallax + Particles + Auto-slide ═══ */}
      <motion.section
        ref={heroRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[380px] md:h-[480px] overflow-hidden rounded-b-[2rem]"
      >
        {/* Parallax background */}
        <AnimatePresence mode="wait">
          <motion.div
            key={heroIdx}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            {heroImages[heroIdx] ? (
              <motion.img
                src={heroImages[heroIdx]}
                alt="Hero"
                className="w-full h-full object-cover"
                style={{ y: heroY, scale: heroScale }}
              />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${storeTheme.bg}, ${storeTheme.primary})` }} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Animated glow orb */}
        <motion.div
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: storeTheme.primary, opacity: 0.12 }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <FloatingParticles color={storeTheme.primary} />

        {/* Hero content */}
        <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-12 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex items-center gap-2 mb-3"
          >
            <Sparkles size={16} style={{ color: storeTheme.primary }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: storeTheme.primary }}>
              Marketplace Imobiliário
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="font-display font-black text-4xl md:text-6xl text-white leading-[1.1] drop-shadow-2xl"
          >
            Imóveis em<br />
            <span style={{ color: storeTheme.primary }}>{cityName}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-white/60 text-sm md:text-base mt-3 max-w-md"
          >
            Encontre casas, apartamentos e terrenos com os melhores corretores da região.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex items-center gap-3 mt-5"
          >
            <button
              onClick={() => {
                const el = document.getElementById("marketplace-grid");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm text-white shadow-2xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]"
              style={{
                background: `linear-gradient(135deg, ${storeTheme.primary}, ${storeTheme.primary}bb)`,
                boxShadow: `0 8px 32px ${storeTheme.primary}40`,
              }}
            >
              Ver ofertas
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-xs text-white/40">{filteredProducts.length} imóveis</span>
          </motion.div>

          {/* Hero slide indicators */}
          {heroImages.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-1.5 mt-5"
            >
              {heroImages.map((_: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setHeroIdx(i)}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: i === heroIdx ? 28 : 8,
                    background: i === heroIdx ? storeTheme.primary : "rgba(255,255,255,0.25)",
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* ═══ FLOATING SEARCH BAR — Glow effect ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="max-w-6xl mx-auto px-4 -mt-7 relative z-20"
      >
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4 backdrop-blur-xl"
          style={{
            background: `${storeTheme.card}ee`,
            border: `1px solid ${storeTheme.border}`,
            boxShadow: `0 8px 40px ${storeTheme.primary}15, 0 2px 8px rgba(0,0,0,0.1)`,
          }}
        >
          <Search size={20} style={{ color: storeTheme.primary }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por tipo, bairro ou cidade..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
            style={{ color: storeTheme.text }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="p-1 rounded-lg hover:opacity-70">
              <X size={16} style={{ color: storeTheme.textMuted }} />
            </button>
          )}
          <button
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
            style={{ background: storeTheme.primary, boxShadow: `0 4px 16px ${storeTheme.primary}30` }}
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

        {/* ═══ QUICK ACTIONS — Glass morphism cards ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-10 mb-8"
        >
          <div className="flex items-center gap-2 mb-5">
            <Crown size={16} style={{ color: storeTheme.primary }} />
            <h2 className="font-display font-bold text-lg" style={{ color: storeTheme.text }}>
              O que você procura?
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-6 md:overflow-visible">
            {QUICK_ACTIONS.map((action, idx) => {
              const Icon = action.icon;
              const isActive = activeCategory === action.slug;
              const count = categoryCounts[action.slug] || 0;
              return (
                <motion.button
                  key={action.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.06 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setActiveCategory(isActive ? "todos" : action.slug); scrollToGrid(); }}
                  className="flex-shrink-0 flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all min-w-[100px] relative overflow-hidden"
                  style={{
                    background: isActive ? `${storeTheme.primary}18` : `${storeTheme.card}`,
                    border: `1.5px solid ${isActive ? storeTheme.primary : storeTheme.border}`,
                    boxShadow: isActive
                      ? `0 8px 24px ${storeTheme.primary}25, inset 0 1px 0 ${storeTheme.primary}20`
                      : `0 2px 8px rgba(0,0,0,0.06)`,
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeGlow"
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ background: `radial-gradient(circle at center, ${storeTheme.primary}10, transparent 70%)` }}
                    />
                  )}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all relative"
                    style={{
                      background: isActive ? `${storeTheme.primary}25` : `${storeTheme.border}60`,
                      color: isActive ? storeTheme.primary : storeTheme.textMuted,
                      boxShadow: isActive ? `0 0 16px ${storeTheme.primary}20` : "none",
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
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        <ShimmerLine color={storeTheme.primary} />

        {/* ═══ PROMO BANNERS — Glow + hover lift ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8"
        >
          {[
            { slug: "todos", title: ["Todos os", "Imóveis"], desc: "Veja todos os imóveis disponíveis na região", icon: Home },
            { slug: "casa", title: ["Casa", "Própria"], desc: "As melhores casas para você e sua família", icon: Building2 },
          ].map((banner, bIdx) => (
            <motion.div
              key={banner.slug}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
              className="relative h-44 md:h-52 rounded-2xl overflow-hidden group cursor-pointer"
              onClick={() => { setActiveCategory(banner.slug); scrollToGrid(); }}
              style={{ boxShadow: `0 8px 32px ${storeTheme.primary}18` }}
            >
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${storeTheme.bg}, ${storeTheme.primary}${bIdx === 0 ? "" : "cc"})` }} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
              <FloatingParticles color={storeTheme.primary} />
              <div className="relative z-10 h-full flex flex-col justify-center p-6">
                <h3 className="font-display font-black text-2xl md:text-3xl text-white leading-tight">
                  {banner.title[0]}<br />{banner.title[1]}
                </h3>
                <p className="text-white/60 text-xs mt-2 max-w-[200px]">{banner.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-white/90 text-xs font-bold mt-3 group-hover:gap-3 transition-all">
                  Explorar <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10">
                <banner.icon size={140} className="absolute -right-6 top-1/2 -translate-y-1/2 text-white" />
              </div>
            </motion.div>
          ))}
        </motion.section>

        {/* ═══ CATEGORY CIRCLES — Animated borders ═══ */}
        {activeCats.length > 2 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Star size={14} style={{ color: storeTheme.primary }} />
              <h2 className="font-display font-bold text-lg" style={{ color: storeTheme.text }}>Categorias</h2>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {activeCats.filter(c => c.slug !== "todos").map((cat, cIdx) => {
                const isActive = activeCategory === cat.slug;
                const Icon = QUICK_ACTIONS.find(a => a.slug === cat.slug)?.icon || Home;
                return (
                  <motion.button
                    key={cat.slug}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + cIdx * 0.05 }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setActiveCategory(isActive ? "todos" : cat.slug); scrollToGrid(); }}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center transition-all relative"
                      style={{
                        background: isActive ? `${storeTheme.primary}20` : storeTheme.card,
                        border: `2.5px solid ${isActive ? storeTheme.primary : storeTheme.border}`,
                        boxShadow: isActive ? `0 0 20px ${storeTheme.primary}35` : "none",
                      }}
                    >
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{ border: `2px solid ${storeTheme.primary}` }}
                          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      <Icon size={24} style={{ color: isActive ? storeTheme.primary : storeTheme.textMuted }} />
                    </div>
                    <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: isActive ? storeTheme.primary : storeTheme.text }}>
                      {cat.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        )}

        <ShimmerLine color={storeTheme.primary} />

        {/* ═══ RESULTS HEADER ═══ */}
        <div id="marketplace-grid" className="mt-6 mb-4 flex items-center justify-between scroll-mt-20">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: storeTheme.primary }} />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: storeTheme.textMuted }}>
              {visibleProducts.length} {visibleProducts.length === 1 ? "resultado" : "resultados"}
            </p>
          </div>
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-xs font-semibold" style={{ color: storeTheme.primary }}>
              Limpar busca
            </button>
          )}
        </div>

        {/* ═══ PRODUCT GRID — Staggered reveal + hover glow ═══ */}
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
            {visibleProducts.map((product: any, i: number) => {
              const productLink = `/imoveis/produto/${product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.5 }}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                >
                  <Link
                    to={productLink}
                    className="block rounded-2xl overflow-hidden group transition-all"
                    style={{
                      background: storeTheme.card,
                      border: `1px solid ${storeTheme.border}`,
                      boxShadow: `0 2px 8px rgba(0,0,0,0.06)`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${storeTheme.primary}20, 0 4px 12px rgba(0,0,0,0.1)`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px rgba(0,0,0,0.06)`;
                    }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: storeTheme.border }}>
                          <Image size={28} style={{ color: storeTheme.textMuted }} />
                        </div>
                      )}
                      {/* Gradient overlay on hover */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: `linear-gradient(to top, ${storeTheme.primary}30, transparent 60%)` }}
                      />
                      {product.tag && (
                        <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[9px] font-bold shadow-lg backdrop-blur-sm ${getTagStyle(product.tag)}`}>
                          {getTagLabel(product.tag)}
                        </span>
                      )}
                      {product.isAluguel && (
                        <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[9px] font-bold shadow-lg backdrop-blur-sm" style={{ background: `${storeTheme.primary}dd`, color: "#fff" }}>
                          🏠 Aluguel
                        </span>
                      )}
                    </div>
                    <div className="p-3.5">
                      <h3 className="text-xs font-bold line-clamp-2 leading-snug mb-2" style={{ color: storeTheme.text }}>
                        {product.title}
                      </h3>
                      {product.price > 0 && (
                        <p className="text-lg font-black" style={{ color: storeTheme.primary }}>
                          R$ {product.price.toLocaleString("pt-BR")}
                          {product.isAluguel && <span className="text-[10px] font-normal ml-1" style={{ color: storeTheme.textMuted }}>/mês</span>}
                        </p>
                      )}
                      {product.accepts_financing && (
                        <p className="text-[9px] mt-1 font-semibold flex items-center gap-1" style={{ color: storeTheme.primary }}>
                          <ShieldCheck size={10} /> Aceita financiamento
                        </p>
                      )}
                      <div className="flex items-center gap-2.5 mt-2.5 text-[10px]" style={{ color: storeTheme.textMuted }}>
                        {product.bedrooms > 0 && <span className="flex items-center gap-0.5"><Bed size={10} /> {product.bedrooms}</span>}
                        {product.bathrooms > 0 && <span className="flex items-center gap-0.5"><Bath size={10} /> {product.bathrooms}</span>}
                        {product.area > 0 && <span className="flex items-center gap-0.5"><Ruler size={10} /> {product.area}m²</span>}
                      </div>
                      {product.city && (
                        <p className="text-[10px] mt-2 flex items-center gap-1 truncate" style={{ color: storeTheme.textMuted }}>
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
          <div className="text-center py-20 rounded-2xl mb-10" style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}>
            <Search size={40} className="mx-auto mb-4 opacity-20" style={{ color: storeTheme.textMuted }} />
            <p className="text-sm font-medium" style={{ color: storeTheme.textMuted }}>
              {searchTerm ? "Nenhum resultado para essa busca" : "Nenhum anúncio encontrado"}
            </p>
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="mt-3 text-xs font-semibold" style={{ color: storeTheme.primary }}>
                Limpar busca
              </button>
            )}
          </div>
        )}

        {/* ═══ BENEFITS — Glass cards with glow icons ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {BENEFITS.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={i}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl relative overflow-hidden"
                style={{ background: storeTheme.card, border: `1px solid ${storeTheme.border}` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center relative"
                  style={{ background: `${storeTheme.primary}15`, color: storeTheme.primary }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{ background: `${storeTheme.primary}10` }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                  />
                  <Icon size={20} />
                </div>
                <h4 className="text-xs font-bold" style={{ color: storeTheme.text }}>{benefit.title}</h4>
                <p className="text-[10px] leading-relaxed" style={{ color: storeTheme.textMuted }}>{benefit.desc}</p>
              </motion.div>
            );
          })}
        </motion.section>

        <ShimmerLine color={storeTheme.primary} />

        {/* ═══ CTA FINAL — Glow + particles ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mb-12 mt-4"
        >
          <div
            className="relative rounded-2xl p-8 md:p-14 text-center overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${storeTheme.bg}, ${storeTheme.primary}90)` }}
          >
            <FloatingParticles color="#ffffff" />
            <motion.div
              className="absolute top-0 right-0 w-60 h-60 rounded-full blur-3xl pointer-events-none"
              style={{ background: storeTheme.primary, opacity: 0.15 }}
              animate={{ scale: [1, 1.5, 1], x: [0, 20, 0] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <div className="relative z-10">
              <Crown size={32} className="mx-auto mb-4 text-white/80" />
              <h2 className="font-display font-black text-2xl md:text-3xl text-white mb-3">
                Quer anunciar seu imóvel?
              </h2>
              <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
                Cadastre-se gratuitamente e alcance milhares de compradores na região.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-105 shadow-xl"
                style={{ background: "#ffffff", color: storeTheme.primary, boxShadow: `0 8px 32px rgba(255,255,255,0.2)` }}
              >
                Anunciar Grátis <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </motion.section>

      </div>
    </div>
  );
}
