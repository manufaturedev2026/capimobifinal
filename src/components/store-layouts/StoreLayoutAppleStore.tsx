import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, ChevronRight, MapPin, Bed, Bath, Ruler, ShieldCheck,
  Zap, Award, Banknote, ArrowRight, MessageCircle, Phone, Star,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Apple Store — layout 100% próprio, inspirado na Apple.com.
 * Estética: branco, espaço, tipografia SF, foto grande, conversão silenciosa.
 *
 * NÃO reutiliza nenhum layout existente.
 */

const APPLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap";

const APPLE_NAV = [
  { id: "comprar", label: "Comprar" },
  { id: "alugar", label: "Alugar" },
  { id: "lancamentos", label: "Lançamentos" },
  { id: "corretores", label: "Corretores" },
  { id: "anunciar", label: "Anunciar", to: "/anunciar" },
  { id: "contato", label: "Contato" },
];

const APPLE_CATEGORIES: { slug: string; name: string; tagline: string; tone: "light" | "dark" }[] = [
  { slug: "casa", name: "Casas", tagline: "Espaço para viver bem.", tone: "light" },
  { slug: "apartamento", name: "Apartamentos", tagline: "Cidade na sua janela.", tone: "dark" },
  { slug: "alto-padrao", name: "Alto Padrão", tagline: "O extraordinário, todos os dias.", tone: "dark" },
  { slug: "lancamento", name: "Lançamentos", tagline: "Acabou de chegar.", tone: "light" },
  { slug: "comercial", name: "Comerciais", tagline: "Onde o trabalho acontece.", tone: "light" },
  { slug: "aluguel", name: "Temporada", tagline: "Sinta-se em casa, em qualquer lugar.", tone: "dark" },
];

const APPLE_BENEFITS = [
  { icon: Zap, title: "Atendimento rápido", desc: "Resposta em minutos pelo WhatsApp." },
  { icon: ShieldCheck, title: "Imóveis verificados", desc: "Cada anúncio é validado por um especialista." },
  { icon: Award, title: "Corretores especialistas", desc: "Profissionais com CRECI ativo na sua região." },
  { icon: Banknote, title: "Financiamento facilitado", desc: "Simulação e aprovação sem complicação." },
];

const APPLE_TESTIMONIALS = [
  { name: "Marina A.", role: "Compradora", quote: "Encontrei o apartamento dos sonhos em uma semana. Atendimento impecável." },
  { name: "Rafael S.", role: "Investidor", quote: "Plataforma rápida, fotos honestas e corretor sempre disponível." },
  { name: "Letícia P.", role: "Locatária", quote: "Parecia comprar um produto Apple, só que o produto era a minha nova casa." },
];

export default function StoreLayoutAppleStore(props: StoreLayoutProps) {
  const {
    products, filteredProducts, dbProfile, sellerDisplayName,
    activeCategory, setActiveCategory, handleWhatsApp, formatPrice,
    filterCity, setFilterCity, availableCities = [],
  } = props;

  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  /* ── Inject Apple aesthetic + neutralize host chrome ───────────────────── */
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
      body.apple-store-active { background: #ffffff !important; }
      body.apple-store-active .apple-font {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
          "SF Pro Text", "Helvetica Neue", Inter, system-ui, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      /* Hide every host wrapper that competes with the Apple layout */
      body.apple-store-active [data-broker-card-section],
      body.apple-store-active [data-company-hero],
      body.apple-store-active [data-company-stats-bar],
      body.apple-store-active main aside,
      body.apple-store-active aside.hidden.lg\\:block {
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
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .apple-fade-up { animation: apple-fade-up .9s cubic-bezier(.22,.61,.36,1) both; }
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
    <div className="apple-font min-h-screen bg-white text-[#1d1d1f]">
      {/* ─────────────── 1. HEADER ─────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/85 backdrop-blur-xl border-b border-black/5"
            : "bg-white/60 backdrop-blur-md"
        }`}
      >
        <div className="max-w-[1180px] mx-auto h-12 px-6 flex items-center justify-between text-[13px]">
          <Link to="/" className="font-semibold tracking-tight text-[#1d1d1f]">
            {sellerDisplayName || dbProfile?.company_name || "Imóveis"}
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-[#1d1d1f]/85">
            {APPLE_NAV.map((item) =>
              item.to ? (
                <Link
                  key={item.id}
                  to={item.to}
                  className="hover:text-[#1d1d1f] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "corretores") {
                      document.getElementById("apple-broker")?.scrollIntoView({ behavior: "smooth" });
                    } else if (item.id === "contato") {
                      handleWhatsApp("Olá! Tenho interesse nos seus imóveis.");
                    } else if (item.id === "lancamentos") {
                      document.getElementById("apple-grid")?.scrollIntoView({ behavior: "smooth" });
                    } else {
                      setActiveCategory(item.id === "alugar" ? "aluguel" : "todos");
                      document.getElementById("apple-grid")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="hover:text-[#1d1d1f] transition-colors"
                >
                  {item.label}
                </button>
              ),
            )}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => document.getElementById("apple-search")?.scrollIntoView({ behavior: "smooth" })}
              className="text-[#1d1d1f]/85 hover:text-[#1d1d1f]"
              aria-label="Buscar"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => handleWhatsApp("Olá! Quero falar com um consultor.")}
              className="hidden sm:inline-flex items-center px-3.5 h-7 rounded-full bg-[#0071E3] text-white text-[12px] font-medium hover:bg-[#0077ED] transition-colors"
            >
              Falar com consultor
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────── 2. HERO ─────────────── */}
      <section className="pt-24 pb-16 bg-white">
        <div className="max-w-[980px] mx-auto px-6 text-center apple-fade-up">
          <h1 className="text-[44px] sm:text-[64px] leading-[1.05] font-semibold tracking-tight text-[#1d1d1f]">
            Encontre seu próximo imóvel.
          </h1>
          <p className="mt-4 text-[20px] sm:text-[24px] text-[#6e6e73] max-w-[720px] mx-auto leading-snug">
            Casas, apartamentos e oportunidades selecionadas com experiência premium.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[17px]">
            <button
              onClick={() => document.getElementById("apple-grid")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center px-6 h-11 rounded-full bg-[#0071E3] text-white font-medium hover:bg-[#0077ED] transition-colors"
            >
              Ver imóveis
            </button>
            <button
              onClick={() => handleWhatsApp("Olá! Quero falar com um consultor.")}
              className="inline-flex items-center gap-1 text-[#0071E3] font-medium hover:underline"
            >
              Falar com consultor <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="max-w-[1180px] mx-auto px-6 mt-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 0.61, 0.36, 1] }}
            className="rounded-[28px] overflow-hidden bg-[#f5f5f7] aspect-[16/9] relative"
          >
            <img
              src={heroImage}
              alt="Imóvel em destaque"
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <p className="text-[13px] font-medium uppercase tracking-[0.18em] opacity-80">
                Em destaque
              </p>
              <h3 className="mt-1 text-[28px] sm:text-[36px] font-semibold tracking-tight">
                {products?.[0]?.title || "Sua próxima conquista."}
              </h3>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────────── 3. SEARCH ─────────────── */}
      <section id="apple-search" className="py-14 bg-[#f5f5f7]">
        <div className="max-w-[1180px] mx-auto px-6">
          <h2 className="text-[28px] sm:text-[34px] font-semibold tracking-tight text-center text-[#1d1d1f]">
            Encontre o que importa para você.
          </h2>
          <div className="mt-8 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] p-3 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              {/* Cidade */}
              <div className="md:col-span-3 flex items-center gap-2 px-4 h-12 rounded-xl bg-[#f5f5f7]">
                <MapPin size={16} className="text-[#6e6e73]" />
                <select
                  value={filterCity || ""}
                  onChange={(e) => setFilterCity?.(e.target.value)}
                  className="flex-1 bg-transparent text-[14px] outline-none text-[#1d1d1f]"
                >
                  <option value="">Todas as cidades</option>
                  {availableCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {/* Tipo */}
              <div className="md:col-span-3 flex items-center px-4 h-12 rounded-xl bg-[#f5f5f7]">
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="w-full bg-transparent text-[14px] outline-none text-[#1d1d1f]"
                >
                  <option value="todos">Qualquer tipo</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="comercial">Comercial</option>
                  <option value="terreno">Terreno</option>
                  <option value="aluguel">Aluguel</option>
                </select>
              </div>
              {/* Faixa de preço (visual) */}
              <div className="md:col-span-3 flex items-center px-4 h-12 rounded-xl bg-[#f5f5f7]">
                <select className="w-full bg-transparent text-[14px] outline-none text-[#1d1d1f]" defaultValue="">
                  <option value="">Faixa de preço</option>
                  <option>Até R$ 300.000</option>
                  <option>R$ 300.000 – R$ 700.000</option>
                  <option>R$ 700.000 – R$ 1.500.000</option>
                  <option>Acima de R$ 1.500.000</option>
                </select>
              </div>
              {/* Quartos (visual) */}
              <div className="md:col-span-1 flex items-center px-4 h-12 rounded-xl bg-[#f5f5f7]">
                <select className="w-full bg-transparent text-[14px] outline-none text-[#1d1d1f]" defaultValue="">
                  <option value="">Quartos</option>
                  <option>1+</option><option>2+</option><option>3+</option><option>4+</option>
                </select>
              </div>
              {/* Buscar */}
              <button
                onClick={() => document.getElementById("apple-grid")?.scrollIntoView({ behavior: "smooth" })}
                className="md:col-span-2 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[#0071E3] text-white text-[14px] font-medium hover:bg-[#0077ED] transition-colors"
              >
                <Search size={16} /> Buscar
              </button>
            </div>

            <div className="mt-3 px-2 flex items-center gap-2 text-[#6e6e73]">
              <Search size={14} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por título, bairro ou cidade…"
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#86868b] py-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── 4. CATEGORIES ─────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-[28px] sm:text-[34px] font-semibold tracking-tight">
              Explore por categoria.
            </h2>
            <button
              onClick={() => document.getElementById("apple-grid")?.scrollIntoView({ behavior: "smooth" })}
              className="hidden sm:inline-flex items-center gap-1 text-[#0071E3] text-[15px] font-medium hover:underline"
            >
              Ver tudo <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {APPLE_CATEGORIES.map((cat) => {
              const isDark = cat.tone === "dark";
              return (
                <button
                  key={cat.slug}
                  onClick={() => {
                    setActiveCategory(cat.slug);
                    document.getElementById("apple-grid")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`text-left rounded-3xl p-7 h-[260px] flex flex-col justify-between transition-transform duration-500 hover:-translate-y-1 ${
                    isDark ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"
                  }`}
                >
                  <div>
                    <p className={`text-[12px] font-medium uppercase tracking-[0.18em] ${isDark ? "text-white/70" : "text-[#6e6e73]"}`}>
                      Categoria
                    </p>
                    <h3 className="mt-2 text-[26px] font-semibold tracking-tight">
                      {cat.name}
                    </h3>
                    <p className={`mt-2 text-[15px] ${isDark ? "text-white/75" : "text-[#6e6e73]"}`}>
                      {cat.tagline}
                    </p>
                  </div>
                  <div className={`inline-flex items-center gap-1 text-[14px] font-medium ${isDark ? "text-white" : "text-[#0071E3]"}`}>
                    Saiba mais <ChevronRight size={16} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────── 5. FEATURED GRID ─────────────── */}
      <section id="apple-grid" className="py-16 bg-[#fbfbfd]">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#6e6e73]">
                Em destaque
              </p>
              <h2 className="mt-1 text-[28px] sm:text-[34px] font-semibold tracking-tight">
                Imóveis selecionados para você.
              </h2>
            </div>
            <p className="text-[14px] text-[#6e6e73]">
              {visibleProducts.length} {visibleProducts.length === 1 ? "imóvel" : "imóveis"}
            </p>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="rounded-3xl bg-white p-16 text-center text-[#6e6e73]">
              Nenhum imóvel encontrado com os filtros atuais.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleProducts.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: Math.min(idx * 0.04, 0.3) }}
                  className="group rounded-3xl bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.05),0_18px_40px_rgba(0,0,0,0.08)] transition-shadow duration-500"
                >
                  <Link to={`/imovel/${p.slug || p.id}`} className="block">
                    <div className="aspect-[4/3] bg-[#f5f5f7] overflow-hidden">
                      <img
                        src={getProductImage(p)}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="p-6">
                      <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6e6e73]">
                        {p.category || "Imóvel"}
                      </p>
                      <h3 className="mt-1 text-[19px] font-semibold tracking-tight text-[#1d1d1f] line-clamp-1">
                        {p.title}
                      </h3>
                      {(p.neighborhood || p.city) && (
                        <p className="mt-1 text-[13px] text-[#6e6e73] flex items-center gap-1">
                          <MapPin size={12} />
                          {[p.neighborhood, p.city].filter(Boolean).join(" • ")}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-4 text-[13px] text-[#6e6e73]">
                        {p.bedrooms ? <span className="inline-flex items-center gap-1"><Bed size={13} />{p.bedrooms}</span> : null}
                        {p.bathrooms ? <span className="inline-flex items-center gap-1"><Bath size={13} />{p.bathrooms}</span> : null}
                        {p.area ? <span className="inline-flex items-center gap-1"><Ruler size={13} />{p.area}m²</span> : null}
                      </div>

                      <div className="mt-5 flex items-end justify-between">
                        <div>
                          <p className="text-[12px] text-[#6e6e73]">A partir de</p>
                          <p className="text-[22px] font-semibold tracking-tight text-[#1d1d1f]">
                            {p.price ? formatPrice(p.price) : "Sob consulta"}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[#0071E3] text-[14px] font-medium group-hover:gap-2 transition-all">
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
      <section className="py-20 bg-white">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="text-center max-w-[720px] mx-auto">
            <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#6e6e73]">
              Experiência diferenciada
            </p>
            <h2 className="mt-2 text-[32px] sm:text-[40px] font-semibold tracking-tight text-[#1d1d1f]">
              Comprar um imóvel devia ser assim.
            </h2>
            <p className="mt-3 text-[18px] text-[#6e6e73]">
              Tecnologia, transparência e atendimento humano em cada etapa.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {APPLE_BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="rounded-3xl bg-[#f5f5f7] p-7 h-full">
                  <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-[#0071E3] shadow-sm">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 text-[18px] font-semibold tracking-tight text-[#1d1d1f]">
                    {b.title}
                  </h3>
                  <p className="mt-1.5 text-[14px] text-[#6e6e73] leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────── 7. BROKER ─────────────── */}
      <section id="apple-broker" className="py-20 bg-[#f5f5f7]">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#6e6e73]">
              Corretor responsável
            </p>
            <h2 className="mt-2 text-[32px] sm:text-[40px] font-semibold tracking-tight text-[#1d1d1f]">
              Atendimento que faz diferença.
            </h2>
          </div>

          <div className="max-w-[680px] mx-auto rounded-3xl bg-white p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
            <div className="w-28 h-28 rounded-full bg-[#f5f5f7] overflow-hidden flex-shrink-0">
              {dbProfile?.logo_url ? (
                <img src={dbProfile.logo_url} alt={sellerDisplayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[28px] font-semibold text-[#6e6e73]">
                  {(sellerDisplayName || "I").slice(0, 1)}
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-[22px] font-semibold tracking-tight text-[#1d1d1f]">
                {sellerDisplayName || dbProfile?.full_name || "Especialista em imóveis"}
              </h3>
              {dbProfile?.creci && (
                <p className="mt-1 text-[14px] text-[#6e6e73]">CRECI {dbProfile.creci}</p>
              )}
              {dbProfile?.bio && (
                <p className="mt-3 text-[15px] text-[#6e6e73] leading-relaxed line-clamp-3">
                  {dbProfile.bio}
                </p>
              )}
              <div className="mt-5 flex flex-wrap justify-center sm:justify-start gap-3">
                <button
                  onClick={() => handleWhatsApp("Olá! Vim pelo seu site, gostaria de mais informações.")}
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-[#0071E3] text-white text-[14px] font-medium hover:bg-[#0077ED] transition-colors"
                >
                  <MessageCircle size={15} /> WhatsApp
                </button>
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-[#f5f5f7] text-[#1d1d1f] text-[14px] font-medium hover:bg-[#ececf0] transition-colors"
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
      <section className="py-20 bg-white">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="text-center max-w-[640px] mx-auto">
            <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#6e6e73]">
              Quem já viveu essa experiência
            </p>
            <h2 className="mt-2 text-[32px] sm:text-[40px] font-semibold tracking-tight text-[#1d1d1f]">
              Histórias reais de clientes reais.
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {APPLE_TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-3xl bg-[#f5f5f7] p-7">
                <div className="flex gap-0.5 text-[#0071E3]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-4 text-[16px] leading-relaxed text-[#1d1d1f]">
                  “{t.quote}”
                </p>
                <div className="mt-5">
                  <p className="text-[14px] font-semibold text-[#1d1d1f]">{t.name}</p>
                  <p className="text-[13px] text-[#6e6e73]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── 9. CTA ─────────────── */}
      <section className="py-24 bg-[#1d1d1f] text-white">
        <div className="max-w-[760px] mx-auto px-6 text-center">
          <h2 className="text-[34px] sm:text-[46px] font-semibold tracking-tight">
            Pronto para encontrar seu imóvel ideal?
          </h2>
          <p className="mt-4 text-[18px] text-white/70">
            Converse agora com um consultor e receba indicações personalizadas em minutos.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleWhatsApp("Olá! Estou pronto para encontrar meu imóvel ideal.")}
              className="inline-flex items-center px-6 h-11 rounded-full bg-[#0071E3] text-white text-[15px] font-medium hover:bg-[#0077ED] transition-colors"
            >
              Falar com consultor
            </button>
            <button
              onClick={() => document.getElementById("apple-grid")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center px-6 h-11 rounded-full bg-white/10 text-white text-[15px] font-medium hover:bg-white/15 transition-colors"
            >
              Ver imóveis
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────── 10. FOOTER ─────────────── */}
      <footer className="bg-[#f5f5f7] text-[#6e6e73]">
        <div className="max-w-[1180px] mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[13px]">
            <div>
              <p className="font-semibold text-[#1d1d1f] mb-3">Comprar</p>
              <ul className="space-y-2">
                <li><button onClick={() => setActiveCategory("casa")} className="hover:text-[#1d1d1f]">Casas</button></li>
                <li><button onClick={() => setActiveCategory("apartamento")} className="hover:text-[#1d1d1f]">Apartamentos</button></li>
                <li><button onClick={() => setActiveCategory("comercial")} className="hover:text-[#1d1d1f]">Comerciais</button></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#1d1d1f] mb-3">Alugar</p>
              <ul className="space-y-2">
                <li><button onClick={() => setActiveCategory("aluguel")} className="hover:text-[#1d1d1f]">Mensal</button></li>
                <li><button onClick={() => setActiveCategory("aluguel")} className="hover:text-[#1d1d1f]">Temporada</button></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#1d1d1f] mb-3">Para você</p>
              <ul className="space-y-2">
                <li><Link to="/anunciar" className="hover:text-[#1d1d1f]">Anunciar imóvel</Link></li>
                <li><button onClick={() => handleWhatsApp("Olá! Quero falar com um consultor.")} className="hover:text-[#1d1d1f]">Falar com consultor</button></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#1d1d1f] mb-3">Sobre</p>
              <ul className="space-y-2">
                <li><Link to="/privacidade" className="hover:text-[#1d1d1f]">Privacidade</Link></li>
                <li><Link to="/termos" className="hover:text-[#1d1d1f]">Termos</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px]">
            <p>© {new Date().getFullYear()} {sellerDisplayName || "Imóveis"}. Todos os direitos reservados.</p>
            <p>Feito com cuidado para encontrar o seu lar.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
