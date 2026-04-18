import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, ChevronRight, MapPin, Bed, Bath, Ruler, ShieldCheck,
  Zap, Award, Banknote, ArrowRight, MessageCircle, Phone, Star,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Apple Pro Dark — luxo cinematográfico inspirado em Apple Pro / Vision Pro.
 * Paleta: grafite profundo + dourado champagne. Tipografia grande, fotos amplas.
 */

const APPLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Cormorant+Garamond:wght@400;500;600&display=swap";

// Luxe palette
const C = {
  bg: "#08080A",
  surface: "#0F0F12",
  surface2: "#16161A",
  hairline: "rgba(255,255,255,0.08)",
  text: "#F5F5F7",
  textMuted: "#A1A1A8",
  gold: "#C9A66B",
  goldSoft: "#E6C988",
  goldDeep: "#8E6F3E",
};

const APPLE_NAV = [
  { id: "comprar", label: "Comprar" },
  { id: "alugar", label: "Alugar" },
  { id: "lancamentos", label: "Lançamentos" },
  { id: "corretores", label: "Corretores" },
  { id: "contato", label: "Contato" },
];

const APPLE_CATEGORIES: { slug: string; name: string; tagline: string }[] = [
  { slug: "casa", name: "Casas", tagline: "Espaço para viver bem." },
  { slug: "apartamento", name: "Apartamentos", tagline: "Cidade na sua janela." },
  { slug: "terreno", name: "Terrenos", tagline: "Comece do zero, do seu jeito." },
  { slug: "comercial", name: "Comerciais", tagline: "Onde o trabalho acontece." },
  { slug: "galpao", name: "Galpões", tagline: "Escala para o seu negócio." },
  { slug: "aluguel", name: "Aluguel", tagline: "Sinta-se em casa, sem compromisso." },
];

const APPLE_BENEFITS = [
  { icon: Zap, title: "Atendimento prime", desc: "Resposta em minutos pelo WhatsApp." },
  { icon: ShieldCheck, title: "Imóveis verificados", desc: "Cada anúncio é validado por um especialista." },
  { icon: Award, title: "Corretores especialistas", desc: "Profissionais com CRECI ativo na sua região." },
  { icon: Banknote, title: "Financiamento facilitado", desc: "Simulação e aprovação sem complicação." },
];

const APPLE_TESTIMONIALS = [
  { name: "Marina A.", role: "Compradora", quote: "Encontrei o apartamento dos sonhos em uma semana. Atendimento impecável." },
  { name: "Rafael S.", role: "Investidor", quote: "Plataforma rápida, fotos honestas e corretor sempre disponível." },
  { name: "Letícia P.", role: "Locatária", quote: "Parecia comprar um produto de luxo, só que o produto era a minha nova casa." },
];

export default function StoreLayoutAppleStore(props: StoreLayoutProps) {
  const {
    products, filteredProducts, dbProfile, sellerDisplayName,
    activeCategory, setActiveCategory, handleWhatsApp, formatPrice,
    filterCity, setFilterCity, availableCities = [],
  } = props;

  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [count, setCount] = useState(0);
  const totalCount = (filteredProducts || []).length;

  /* ── Inject Apple Pro Dark aesthetic + neutralize host chrome ───────────── */
  useEffect(() => {
    if (!document.querySelector(`link[href="${APPLE_FONTS_HREF}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = APPLE_FONTS_HREF;
      document.head.appendChild(link);
    }

    const styleId = "apple-store-layout-styles";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.innerHTML = `
      body.apple-store-active { background: ${C.bg} !important; color: ${C.text}; }
      body.apple-store-active .apple-font {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
          "SF Pro Text", "Helvetica Neue", Inter, system-ui, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      body.apple-store-active .apple-serif {
        font-family: "Cormorant Garamond", "Times New Roman", serif;
        font-weight: 500;
        letter-spacing: -0.01em;
      }
      body.apple-store-active [data-broker-card-section],
      body.apple-store-active [data-company-hero],
      body.apple-store-active [data-company-hero-mobile],
      body.apple-store-active [data-company-stats-bar],
      body.apple-store-active main aside,
      body.apple-store-active aside.hidden.lg\\:block,
      body.apple-store-active #products-grid {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      body.apple-store-active main,
      body.apple-store-active main > div,
      body.apple-store-active main > div > div {
        max-width: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      @keyframes apple-fade-up {
        from { opacity: 0; transform: translateY(28px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .apple-fade-up { animation: apple-fade-up 1.1s cubic-bezier(.22,.61,.36,1) both; }
      @keyframes gold-shimmer {
        0%   { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .gold-text {
        background: linear-gradient(90deg, ${C.goldDeep} 0%, ${C.goldSoft} 35%, #FFF1C6 50%, ${C.goldSoft} 65%, ${C.goldDeep} 100%);
        background-size: 200% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: gold-shimmer 8s linear infinite;
      }
      .gold-hairline {
        height: 1px;
        background: linear-gradient(90deg, transparent, ${C.gold}80, transparent);
      }
      .gold-btn {
        background: linear-gradient(180deg, ${C.goldSoft} 0%, ${C.gold} 50%, ${C.goldDeep} 100%);
        color: #1a1408;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.4),
          inset 0 -1px 0 rgba(0,0,0,0.25),
          0 8px 24px -8px ${C.gold}55;
      }
      .gold-btn:hover { filter: brightness(1.08); }
      .luxe-card {
        background: linear-gradient(180deg, ${C.surface} 0%, ${C.surface2} 100%);
        border: 1px solid ${C.hairline};
      }
      .luxe-card:hover {
        border-color: ${C.gold}40;
        box-shadow: 0 30px 80px -30px rgba(0,0,0,0.8), 0 0 0 1px ${C.gold}20;
      }
      .grain::before {
        content: "";
        position: absolute; inset: 0;
        background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
        background-size: 3px 3px;
        opacity: 0.5;
        pointer-events: none;
        mix-blend-mode: overlay;
      }
    `;

    document.body.classList.add("apple-store-active");
    return () => {
      document.body.classList.remove("apple-store-active");
    };
  }, []);

  /* ── Sticky header on scroll ───────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Category filter ───────────────────────────────────────────────────── */
  const visibleProducts = useMemo(() => {
    let list = filteredProducts || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.neighborhood?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [filteredProducts, searchQuery]);

  const getProductImage = (p: any) =>
    p?.image || p?.images?.[0] || p?.photos?.[0] || "/placeholder.svg";

  const heroImage =
    getProductImage(products?.[0]) !== "/placeholder.svg"
      ? getProductImage(products?.[0])
      : dbProfile?.logo_url ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1800&q=85";

  const phone = dbProfile?.phone || "";

  return (
    <div className="apple-font min-h-screen" style={{ background: C.bg, color: C.text }}>
      {/* ─────────────── 1. HEADER ─────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(8,8,10,0.78)" : "rgba(8,8,10,0.45)",
          backdropFilter: "saturate(180%) blur(24px)",
          WebkitBackdropFilter: "saturate(180%) blur(24px)",
          borderBottom: scrolled ? `1px solid ${C.hairline}` : "1px solid transparent",
        }}
      >
        <div className="max-w-[1240px] mx-auto h-14 px-6 flex items-center justify-between text-[13px]">
          <Link to="/" className="flex items-center gap-2">
            <span className="apple-serif text-[22px] gold-text leading-none">
              {(sellerDisplayName || dbProfile?.company_name || "Imóveis").slice(0, 1)}
            </span>
            <span className="font-medium tracking-tight" style={{ color: C.text }}>
              {sellerDisplayName || dbProfile?.company_name || "Imóveis"}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" style={{ color: `${C.text}d0` }}>
            {APPLE_NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "corretores") document.getElementById("apple-broker")?.scrollIntoView({ behavior: "smooth" });
                  else if (item.id === "contato") handleWhatsApp("Olá! Tenho interesse nos seus imóveis.");
                  else if (item.id === "lancamentos") document.getElementById("apple-grid")?.scrollIntoView({ behavior: "smooth" });
                  else {
                    setActiveCategory(item.id === "alugar" ? "aluguel" : "todos");
                    document.getElementById("apple-grid")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => document.getElementById("apple-search")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-white transition-colors"
              style={{ color: `${C.text}c0` }}
              aria-label="Buscar"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => handleWhatsApp("Olá! Quero falar com um consultor.")}
              className="gold-btn hidden sm:inline-flex items-center px-4 h-8 rounded-full text-[12px] font-semibold tracking-tight transition-all"
            >
              Falar com consultor
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────── 2. HERO ─────────────── */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 relative overflow-hidden" style={{ background: C.bg }}>
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(closest-side, ${C.gold}18, transparent 70%)` }}
        />
        <div className="max-w-[1100px] mx-auto px-5 sm:px-6 text-center apple-fade-up relative">
          <p className="text-[10px] sm:text-[12px] font-medium uppercase tracking-[0.28em] sm:tracking-[0.32em] mb-4 sm:mb-5" style={{ color: C.gold }}>
            Coleção Privada
          </p>
          <h1 className="text-[34px] sm:text-[64px] lg:text-[88px] leading-[1.05] font-semibold tracking-tight">
            <span style={{ color: C.text }}>O extraordinário,</span>
            <br />
            <span className="apple-serif italic gold-text">cuidadosamente selecionado.</span>
          </h1>
          <p className="mt-5 sm:mt-7 text-[15px] sm:text-[20px] max-w-[680px] mx-auto leading-relaxed" style={{ color: C.textMuted }}>
            Casas, apartamentos e residências exclusivas com a experiência de um atendimento prime.
          </p>
          <div className="mt-7 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[14px] sm:text-[15px]">
            <button
              onClick={() => document.getElementById("apple-grid")?.scrollIntoView({ behavior: "smooth" })}
              className="gold-btn inline-flex items-center px-6 sm:px-7 h-11 sm:h-12 rounded-full font-semibold tracking-tight transition-all"
            >
              Explorar coleção
            </button>
            <button
              onClick={() => handleWhatsApp("Olá! Quero falar com um consultor.")}
              className="inline-flex items-center gap-1.5 px-6 sm:px-7 h-11 sm:h-12 rounded-full font-medium border transition-colors"
              style={{ borderColor: `${C.gold}50`, color: C.text }}
            >
              Falar com consultor <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 mt-10 sm:mt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1] }}
            className="rounded-2xl sm:rounded-[32px] overflow-hidden relative grain aspect-[4/5] sm:aspect-[21/9]"
            style={{
              border: `1px solid ${C.hairline}`,
              boxShadow: `0 60px 120px -40px rgba(0,0,0,0.9), 0 0 0 1px ${C.gold}15`,
            }}
          >
            <img
              src={heroImage}
              alt="Imóvel em destaque"
              className="w-full h-full object-cover"
              style={{ filter: "saturate(1.05) contrast(1.05)" }}
              loading="eager"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.92) 100%)" }}
            />
            <div className="absolute bottom-5 sm:bottom-10 left-5 sm:left-10 right-5 sm:right-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-6">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.28em] sm:tracking-[0.32em]" style={{ color: C.gold }}>
                  Em destaque
                </p>
                <h3 className="apple-serif italic mt-1.5 sm:mt-2 text-[22px] sm:text-[40px] lg:text-[52px] leading-[1.05] line-clamp-2" style={{ color: C.text }}>
                  {products?.[0]?.title || "Sua próxima conquista."}
                </h3>
                {products?.[0]?.city && (
                  <p className="mt-1.5 sm:mt-2 text-[12px] sm:text-[14px] flex items-center gap-1.5" style={{ color: `${C.text}aa` }}>
                    <MapPin size={12} /> {[products[0].neighborhood, products[0].city].filter(Boolean).join(" • ")}
                  </p>
                )}
              </div>
              {products?.[0]?.price && (
                <div className="sm:text-right">
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] sm:tracking-[0.24em]" style={{ color: `${C.text}80` }}>
                    A partir de
                  </p>
                  <p className="apple-serif text-[24px] sm:text-[34px] gold-text mt-0.5 sm:mt-1">
                    {formatPrice(products[0].price)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────────── 3. SEARCH ─────────────── */}
      <section id="apple-search" className="py-20" style={{ background: C.surface }}>
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center max-w-[680px] mx-auto">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em]" style={{ color: C.gold }}>
              Curadoria personalizada
            </p>
            <h2 className="apple-serif italic mt-3 text-[36px] sm:text-[44px] leading-tight" style={{ color: C.text }}>
              Encontre o que importa para você.
            </h2>
          </div>

          <div
            className="mt-10 rounded-3xl p-3 sm:p-4 luxe-card"
            style={{
              boxShadow: `0 30px 80px -30px rgba(0,0,0,0.7)`,
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-3 flex items-center gap-2 px-4 h-12 rounded-xl" style={{ background: C.bg, border: `1px solid ${C.hairline}` }}>
                <MapPin size={16} style={{ color: C.gold }} />
                <select
                  value={filterCity || ""}
                  onChange={(e) => setFilterCity?.(e.target.value)}
                  className="flex-1 bg-transparent text-[14px] outline-none"
                  style={{ color: C.text }}
                >
                  <option value="" style={{ background: C.surface }}>Todas as cidades</option>
                  {availableCities.map((c) => (
                    <option key={c} value={c} style={{ background: C.surface }}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3 flex items-center px-4 h-12 rounded-xl" style={{ background: C.bg, border: `1px solid ${C.hairline}` }}>
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="w-full bg-transparent text-[14px] outline-none"
                  style={{ color: C.text }}
                >
                  <option value="todos" style={{ background: C.surface }}>Qualquer tipo</option>
                  <option value="casa" style={{ background: C.surface }}>Casa</option>
                  <option value="apartamento" style={{ background: C.surface }}>Apartamento</option>
                  <option value="comercial" style={{ background: C.surface }}>Comercial</option>
                  <option value="terreno" style={{ background: C.surface }}>Terreno</option>
                  <option value="aluguel" style={{ background: C.surface }}>Aluguel</option>
                </select>
              </div>
              <div className="md:col-span-3 flex items-center px-4 h-12 rounded-xl" style={{ background: C.bg, border: `1px solid ${C.hairline}` }}>
                <select className="w-full bg-transparent text-[14px] outline-none" style={{ color: C.text }} defaultValue="">
                  <option value="" style={{ background: C.surface }}>Faixa de preço</option>
                  <option style={{ background: C.surface }}>Até R$ 300.000</option>
                  <option style={{ background: C.surface }}>R$ 300.000 – R$ 700.000</option>
                  <option style={{ background: C.surface }}>R$ 700.000 – R$ 1.500.000</option>
                  <option style={{ background: C.surface }}>Acima de R$ 1.500.000</option>
                </select>
              </div>
              <div className="md:col-span-1 flex items-center px-4 h-12 rounded-xl" style={{ background: C.bg, border: `1px solid ${C.hairline}` }}>
                <select className="w-full bg-transparent text-[14px] outline-none" style={{ color: C.text }} defaultValue="">
                  <option value="" style={{ background: C.surface }}>Quartos</option>
                  <option style={{ background: C.surface }}>1+</option>
                  <option style={{ background: C.surface }}>2+</option>
                  <option style={{ background: C.surface }}>3+</option>
                  <option style={{ background: C.surface }}>4+</option>
                </select>
              </div>
              <button
                onClick={() => document.getElementById("apple-grid")?.scrollIntoView({ behavior: "smooth" })}
                className="gold-btn md:col-span-2 inline-flex items-center justify-center gap-2 h-12 rounded-xl text-[14px] font-semibold tracking-tight transition-all"
              >
                <Search size={16} /> Buscar
              </button>
            </div>

            <div className="mt-3 px-2 flex items-center gap-2" style={{ color: C.textMuted }}>
              <Search size={14} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por título, bairro ou cidade…"
                className="flex-1 bg-transparent text-[13px] outline-none py-2 placeholder:opacity-60"
                style={{ color: C.text }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── 4. CATEGORIES ─────────────── */}
      <section className="py-24" style={{ background: C.bg }}>
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.32em]" style={{ color: C.gold }}>
                Coleções
              </p>
              <h2 className="apple-serif italic mt-3 text-[36px] sm:text-[44px] leading-tight" style={{ color: C.text }}>
                Explore por categoria.
              </h2>
            </div>
            <button
              onClick={() => document.getElementById("apple-grid")?.scrollIntoView({ behavior: "smooth" })}
              className="hidden sm:inline-flex items-center gap-1 text-[14px] font-medium hover:underline"
              style={{ color: C.gold }}
            >
              Ver tudo <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {APPLE_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => {
                  setActiveCategory(cat.slug);
                  document.getElementById("apple-grid")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="luxe-card text-left rounded-3xl p-8 h-[280px] flex flex-col justify-between transition-all duration-500 hover:-translate-y-1 relative overflow-hidden grain"
              >
                <div
                  className="absolute -top-20 -right-20 w-56 h-56 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(closest-side, ${C.gold}25, transparent 70%)` }}
                />
                <div className="relative">
                  <p className="text-[11px] font-medium uppercase tracking-[0.32em]" style={{ color: C.gold }}>
                    Coleção
                  </p>
                  <h3 className="apple-serif italic mt-3 text-[30px] leading-tight" style={{ color: C.text }}>
                    {cat.name}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.textMuted }}>
                    {cat.tagline}
                  </p>
                </div>
                <div className="relative inline-flex items-center gap-1 text-[13px] font-medium" style={{ color: C.gold }}>
                  Saiba mais <ChevronRight size={15} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── 5. FEATURED GRID ─────────────── */}
      <section id="apple-grid" className="py-24" style={{ background: C.surface }}>
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.32em]" style={{ color: C.gold }}>
                Em destaque
              </p>
              <h2 className="apple-serif italic mt-3 text-[36px] sm:text-[44px] leading-tight" style={{ color: C.text }}>
                Residências selecionadas.
              </h2>
            </div>
            <p className="text-[13px]" style={{ color: C.textMuted }}>
              {visibleProducts.length} {visibleProducts.length === 1 ? "imóvel" : "imóveis"}
            </p>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="luxe-card rounded-3xl p-20 text-center" style={{ color: C.textMuted }}>
              Nenhum imóvel encontrado com os filtros atuais.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {visibleProducts.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: Math.min(idx * 0.04, 0.3) }}
                  className="group luxe-card rounded-3xl overflow-hidden transition-all duration-500"
                >
                  <Link to={`/imovel/${p.slug || p.id}`} className="block">
                    <div className="aspect-[4/3] overflow-hidden relative" style={{ background: C.bg }}>
                      <img
                        src={getProductImage(p)}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.06]"
                      />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background: `linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.6) 100%)`,
                        }}
                      />
                    </div>
                    <div className="p-7">
                      <p className="text-[10px] font-medium uppercase tracking-[0.28em]" style={{ color: C.gold }}>
                        {p.category || "Imóvel"}
                      </p>
                      <h3 className="apple-serif italic mt-2 text-[22px] leading-tight line-clamp-1" style={{ color: C.text }}>
                        {p.title}
                      </h3>
                      {(p.neighborhood || p.city) && (
                        <p className="mt-2 text-[13px] flex items-center gap-1" style={{ color: C.textMuted }}>
                          <MapPin size={12} />
                          {[p.neighborhood, p.city].filter(Boolean).join(" • ")}
                        </p>
                      )}

                      <div className="mt-5 flex items-center gap-5 text-[13px]" style={{ color: C.textMuted }}>
                        {p.bedrooms ? <span className="inline-flex items-center gap-1.5"><Bed size={13} />{p.bedrooms}</span> : null}
                        {p.bathrooms ? <span className="inline-flex items-center gap-1.5"><Bath size={13} />{p.bathrooms}</span> : null}
                        {p.area ? <span className="inline-flex items-center gap-1.5"><Ruler size={13} />{p.area}m²</span> : null}
                      </div>

                      <div className="mt-6 pt-6 flex items-end justify-between" style={{ borderTop: `1px solid ${C.hairline}` }}>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: C.textMuted }}>
                            A partir de
                          </p>
                          <p className="apple-serif text-[26px] gold-text mt-1">
                            {p.price ? formatPrice(p.price) : "Sob consulta"}
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 text-[13px] font-medium group-hover:gap-2 transition-all"
                          style={{ color: C.gold }}
                        >
                          Ver <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─────────────── 6. EXPERIENCE / BENEFITS ─────────────── */}
      <section className="py-28 relative overflow-hidden" style={{ background: C.bg }}>
        <div
          className="absolute top-0 left-0 right-0 mx-auto w-[700px] gold-hairline"
          style={{ maxWidth: "60%" }}
        />
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="text-center max-w-[760px] mx-auto">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em]" style={{ color: C.gold }}>
              Experiência diferenciada
            </p>
            <h2 className="apple-serif italic mt-4 text-[40px] sm:text-[56px] leading-[1.05]" style={{ color: C.text }}>
              Comprar um imóvel <span className="gold-text">devia ser assim.</span>
            </h2>
            <p className="mt-5 text-[18px]" style={{ color: C.textMuted }}>
              Tecnologia, transparência e atendimento humano em cada etapa.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {APPLE_BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="luxe-card rounded-3xl p-7 h-full transition-all duration-500">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(180deg, ${C.surface2}, ${C.bg})`,
                      border: `1px solid ${C.gold}40`,
                      color: C.gold,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="apple-serif italic mt-6 text-[22px] leading-tight" style={{ color: C.text }}>
                    {b.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.textMuted }}>
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────── 7. BROKER ─────────────── */}
      <section id="apple-broker" className="py-28" style={{ background: C.surface }}>
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em]" style={{ color: C.gold }}>
              Corretor responsável
            </p>
            <h2 className="apple-serif italic mt-3 text-[40px] sm:text-[52px] leading-[1.05]" style={{ color: C.text }}>
              Atendimento que faz diferença.
            </h2>
          </div>

          <div
            className="max-w-[760px] mx-auto luxe-card rounded-3xl p-10 sm:p-12 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden grain"
          >
            <div
              className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(closest-side, ${C.gold}20, transparent 70%)` }}
            />
            <div
              className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0 relative"
              style={{ border: `2px solid ${C.gold}80`, boxShadow: `0 0 30px ${C.gold}30` }}
            >
              {dbProfile?.logo_url ? (
                <img src={dbProfile.logo_url} alt={sellerDisplayName} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-[32px] apple-serif gold-text"
                  style={{ background: C.bg }}
                >
                  {(sellerDisplayName || "I").slice(0, 1)}
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left relative">
              <h3 className="apple-serif italic text-[28px] leading-tight" style={{ color: C.text }}>
                {sellerDisplayName || dbProfile?.full_name || "Especialista em imóveis"}
              </h3>
              {dbProfile?.creci && (
                <p className="mt-1 text-[13px] uppercase tracking-[0.24em]" style={{ color: C.gold }}>
                  CRECI {dbProfile.creci}
                </p>
              )}
              {dbProfile?.bio && (
                <p className="mt-4 text-[15px] leading-relaxed line-clamp-3" style={{ color: C.textMuted }}>
                  {dbProfile.bio}
                </p>
              )}
              <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-3">
                <button
                  onClick={() => handleWhatsApp("Olá! Vim pelo seu site, gostaria de mais informações.")}
                  className="gold-btn inline-flex items-center gap-2 px-5 h-11 rounded-full text-[14px] font-semibold tracking-tight transition-all"
                >
                  <MessageCircle size={15} /> WhatsApp
                </button>
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-full text-[14px] font-medium border transition-colors hover:bg-white/5"
                    style={{ borderColor: `${C.gold}50`, color: C.text }}
                  >
                    <Phone size={15} /> Ligar
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── 8. TESTIMONIALS ─────────────── */}
      <section className="py-28" style={{ background: C.bg }}>
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="text-center max-w-[680px] mx-auto">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em]" style={{ color: C.gold }}>
              Quem já viveu essa experiência
            </p>
            <h2 className="apple-serif italic mt-3 text-[40px] sm:text-[52px] leading-[1.05]" style={{ color: C.text }}>
              Histórias reais.
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
            {APPLE_TESTIMONIALS.map((t) => (
              <div key={t.name} className="luxe-card rounded-3xl p-8 transition-all duration-500">
                <div className="flex gap-0.5" style={{ color: C.gold }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="apple-serif italic mt-5 text-[20px] leading-relaxed" style={{ color: C.text }}>
                  “{t.quote}”
                </p>
                <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${C.hairline}` }}>
                  <p className="text-[14px] font-semibold" style={{ color: C.text }}>{t.name}</p>
                  <p className="text-[12px] uppercase tracking-[0.2em] mt-0.5" style={{ color: C.gold }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── 9. CTA ─────────────── */}
      <section className="py-32 relative overflow-hidden" style={{ background: C.surface }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${C.gold}18, transparent 60%)`,
          }}
        />
        <div className="max-w-[820px] mx-auto px-6 text-center relative">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] mb-4" style={{ color: C.gold }}>
            Próximo passo
          </p>
          <h2 className="apple-serif italic text-[44px] sm:text-[64px] leading-[1.05]" style={{ color: C.text }}>
            Pronto para encontrar
            <br />
            <span className="gold-text">seu imóvel ideal?</span>
          </h2>
          <p className="mt-6 text-[18px]" style={{ color: C.textMuted }}>
            Converse agora com um consultor e receba indicações personalizadas em minutos.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleWhatsApp("Olá! Estou pronto para encontrar meu imóvel ideal.")}
              className="gold-btn inline-flex items-center px-7 h-12 rounded-full text-[15px] font-semibold tracking-tight transition-all"
            >
              Falar com consultor
            </button>
            <button
              onClick={() => document.getElementById("apple-grid")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center px-7 h-12 rounded-full text-[15px] font-medium border transition-colors hover:bg-white/5"
              style={{ borderColor: `${C.gold}50`, color: C.text }}
            >
              Ver imóveis
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────── 10. FOOTER ─────────────── */}
      <footer style={{ background: C.bg, color: C.textMuted, borderTop: `1px solid ${C.hairline}` }}>
        <div className="max-w-[1240px] mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-[13px]">
            <div>
              <p className="apple-serif italic text-[18px] mb-4 gold-text">Comprar</p>
              <ul className="space-y-2.5">
                <li><button onClick={() => setActiveCategory("casa")} className="hover:text-white transition-colors">Casas</button></li>
                <li><button onClick={() => setActiveCategory("apartamento")} className="hover:text-white transition-colors">Apartamentos</button></li>
                <li><button onClick={() => setActiveCategory("comercial")} className="hover:text-white transition-colors">Comerciais</button></li>
              </ul>
            </div>
            <div>
              <p className="apple-serif italic text-[18px] mb-4 gold-text">Alugar</p>
              <ul className="space-y-2.5">
                <li><button onClick={() => setActiveCategory("aluguel")} className="hover:text-white transition-colors">Mensal</button></li>
                <li><button onClick={() => setActiveCategory("aluguel")} className="hover:text-white transition-colors">Temporada</button></li>
              </ul>
            </div>
            <div>
              <p className="apple-serif italic text-[18px] mb-4 gold-text">Para você</p>
              <ul className="space-y-2.5">
                <li><Link to="/anunciar" className="hover:text-white transition-colors">Anunciar imóvel</Link></li>
                <li><button onClick={() => handleWhatsApp("Olá! Quero falar com um consultor.")} className="hover:text-white transition-colors">Falar com consultor</button></li>
              </ul>
            </div>
            <div>
              <p className="apple-serif italic text-[18px] mb-4 gold-text">Sobre</p>
              <ul className="space-y-2.5">
                <li><Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
                <li><Link to="/termos" className="hover:text-white transition-colors">Termos</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px]" style={{ borderTop: `1px solid ${C.hairline}` }}>
            <p>© {new Date().getFullYear()} {sellerDisplayName || "Imóveis"}. Todos os direitos reservados.</p>
            <p className="apple-serif italic" style={{ color: C.gold }}>Feito com cuidado para encontrar o seu lar.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
