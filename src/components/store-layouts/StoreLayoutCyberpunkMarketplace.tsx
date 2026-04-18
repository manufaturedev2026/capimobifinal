import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, MapPin, Bed, Bath, Ruler, MessageCircle, ArrowRight,
  Home, Building2, Key, Trees, Store, Landmark, ShieldCheck, Sparkles,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";

/**
 * Cyberpunk Premium — Layout 100% próprio (não herda do Marketplace).
 * Estética: imobiliária high-end + tecnologia futurista elegante.
 */
const CATEGORIES = [
  { slug: "all", name: "Todos", icon: Sparkles },
  { slug: "casa", name: "Casas", icon: Home },
  { slug: "apartamento", name: "Apartamentos", icon: Building2 },
  { slug: "aluguel", name: "Aluguel", icon: Key },
  { slug: "terreno", name: "Terrenos", icon: Trees },
  { slug: "comercial", name: "Comerciais", icon: Store },
  { slug: "flat", name: "Flats", icon: Landmark },
];

export default function StoreLayoutCyberpunkMarketplace(props: StoreLayoutProps) {
  const {
    filteredProducts, activeCategory, setActiveCategory, dbProfile,
    handleWhatsApp, formatPrice, corretorSlug, sellerDisplayName,
    filterCity, setFilterCity, availableCities = [],
  } = props;

  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.body.classList.add("cp-active");
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.body.classList.remove("cp-active");
    };
  }, []);

  useEffect(() => {
    const fontsId = "cp-fonts";
    if (!document.getElementById(fontsId)) {
      const link = document.createElement("link");
      link.id = fontsId;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&family=Orbitron:wght@600;700;800&display=swap";
      document.head.appendChild(link);
    }

    const id = "cp-theme-styles";
    const existing = document.getElementById(id) as HTMLStyleElement | null;
    const style = existing ?? document.createElement("style");
    style.id = id;
    style.textContent = `
      /* ===== HIDE marketplace duplications (and remove from layout) ===== */
      body.cp-active [data-broker-card-section],
      body.cp-active [data-company-hero],
      body.cp-active [data-company-hero-mobile],
      body.cp-active [data-company-stats-bar] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      /* Hide the desktop sidebar (the empty-but-clickable column) */
      body.cp-active aside.hidden.lg\\:block,
      body.cp-active main aside { display: none !important; }
      /* Full bleed */
      body.cp-active main,
      body.cp-active [class*="max-w-"] { max-width: none !important; }
      body.cp-active { background: #0A0A0F; }

      /* ===== KEYFRAMES ===== */
      @keyframes cp-grid-move { 0%{background-position:0 0} 100%{background-position:60px 60px} }
      @keyframes cp-orb { 0%,100%{transform:translate(0,0) scale(1);opacity:.32} 50%{transform:translate(30px,-20px) scale(1.08);opacity:.42} }
      @keyframes cp-particle { 0%{transform:translateY(100vh);opacity:0} 10%{opacity:.6} 90%{opacity:.3} 100%{transform:translateY(-10vh);opacity:0} }
      @keyframes cp-scan { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }

      /* ===== Navbar override (sticky from CompanyProfile) ===== */
      body.cp-active header.sticky,
      body.cp-active header[class*="sticky"] {
        background: ${scrolled ? "rgba(10,10,15,0.92)" : "rgba(10,10,15,0.55)"} !important;
        backdrop-filter: blur(${scrolled ? "22px" : "14px"}) saturate(160%);
        -webkit-backdrop-filter: blur(${scrolled ? "22px" : "14px"}) saturate(160%);
        border-bottom: 1px solid ${scrolled ? "rgba(0,245,255,0.22)" : "rgba(255,255,255,0.06)"} !important;
        transition: all .4s cubic-bezier(.4,0,.2,1);
      }
      body.cp-active header.sticky * { color: #F5F5F5; }

      /* ===== Scrollbar ===== */
      .cp-root ::-webkit-scrollbar { width: 8px; height: 8px; }
      .cp-root ::-webkit-scrollbar-track { background: #0A0A0F; }
      .cp-root ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg,#00F5FF,#8A2EFF);
        border-radius: 4px;
      }
    `;
    if (!existing) document.head.appendChild(style);
  }, [scrolled]);

  const visibleProducts = useMemo(() => {
    if (!search.trim()) return filteredProducts;
    const q = search.toLowerCase();
    return filteredProducts.filter((p: any) =>
      (p.title || "").toLowerCase().includes(q) ||
      (p.city || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q)
    );
  }, [filteredProducts, search]);

  const particles = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 18}s`,
      duration: `${18 + Math.random() * 14}s`,
      cyan: i % 2 === 0,
    })),
    []
  );

  return (
    <div
      className="cp-root relative min-h-screen w-full overflow-x-hidden"
      style={{
        background: "#0A0A0F",
        color: "#F5F5F5",
        fontFamily: "'Space Grotesk', -apple-system, system-ui, sans-serif",
      }}
    >
      {/* Background layers */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,245,255,0.10), transparent 60%), radial-gradient(ellipse 60% 40% at 85% 100%, rgba(138,46,255,0.10), transparent 60%), #0A0A0F",
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse at center, black 25%, transparent 75%)",
        animation: "cp-grid-move 30s linear infinite",
      }} />
      <div className="pointer-events-none fixed z-0 rounded-full" style={{
        top: "-8%", left: "-6%", width: 520, height: 520,
        background: "radial-gradient(circle,#00F5FF 0%,transparent 70%)",
        filter: "blur(140px)", opacity: 0.18,
        animation: "cp-orb 14s ease-in-out infinite",
      }} />
      <div className="pointer-events-none fixed z-0 rounded-full" style={{
        bottom: "-10%", right: "-8%", width: 600, height: 600,
        background: "radial-gradient(circle,#8A2EFF 0%,transparent 70%)",
        filter: "blur(140px)", opacity: 0.18,
        animation: "cp-orb 14s ease-in-out -7s infinite",
      }} />
      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
        {particles.map((p) => (
          <span key={p.id} className="absolute bottom-0 rounded-full" style={{
            left: p.left, width: 1.5, height: 1.5,
            background: p.cyan ? "rgba(0,245,255,0.7)" : "rgba(138,46,255,0.6)",
            boxShadow: p.cyan ? "0 0 6px rgba(0,245,255,0.6)" : "0 0 6px rgba(138,46,255,0.5)",
            animation: `cp-particle ${p.duration} linear ${p.delay} infinite`,
          }} />
        ))}
      </div>

      {/* ===== HERO ===== */}
      <div className="relative z-10">
        <section className="relative pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00F5FF]/30 bg-[#00F5FF]/5 backdrop-blur-md mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D]" style={{ boxShadow: "0 0 8px #00FF9D" }} />
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#A0A0B8] font-medium">
                  {sellerDisplayName} · Imóveis selecionados
                </span>
              </div>

              <h1 className="font-bold tracking-tight text-[2.4rem] sm:text-5xl md:text-7xl leading-[1.05] mb-5" style={{
                fontFamily: "'Orbitron','Space Grotesk',sans-serif",
                background: "linear-gradient(180deg,#F5F5F5 0%,#A0A0B8 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
              }}>
                O futuro do{" "}
                <span style={{ background: "linear-gradient(90deg,#00F5FF,#8A2EFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  alto padrão
                </span>
                <br />começa aqui.
              </h1>

              <p className="max-w-xl mx-auto text-[#A0A0B8] text-base md:text-lg mb-10 leading-relaxed">
                Curadoria exclusiva de imóveis premium. Tecnologia, sofisticação e atendimento direto com especialista.
              </p>

              {/* SEARCH PANEL */}
              <div className="max-w-3xl mx-auto">
                <div className="relative rounded-2xl p-1.5 backdrop-blur-xl" style={{
                  background: "rgba(17,17,24,0.7)",
                  border: "1px solid rgba(0,245,255,0.18)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,245,255,0.08)",
                }}>
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <div className="absolute top-0 bottom-0 w-1/3" style={{
                      background: "linear-gradient(90deg,transparent,rgba(0,245,255,0.08),transparent)",
                      animation: "cp-scan 6s linear infinite",
                    }} />
                  </div>

                  <div className="relative flex flex-col md:flex-row gap-1.5">
                    <div className="flex-1 flex items-center gap-3 px-4 py-3.5">
                      <Search size={18} className="text-[#00F5FF] flex-shrink-0" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por imóvel, cidade ou bairro..."
                        className="w-full bg-transparent outline-none text-[#F5F5F5] placeholder-[#A0A0B8]/60 text-[15px]"
                      />
                    </div>

                    {availableCities.length > 0 && setFilterCity && (
                      <>
                        <div className="hidden md:block w-px my-3" style={{ background: "rgba(255,255,255,0.08)" }} />
                        <div className="flex items-center gap-2 px-4 py-3">
                          <MapPin size={16} className="text-[#8A2EFF]" />
                          <select
                            value={filterCity || ""}
                            onChange={(e) => setFilterCity(e.target.value)}
                            className="bg-transparent outline-none text-[#F5F5F5] text-sm cursor-pointer"
                          >
                            <option value="" className="bg-[#111118]">Todas as cidades</option>
                            {availableCities.map((c) => (
                              <option key={c} value={c} className="bg-[#111118]">{c}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => document.getElementById("cp-grid")?.scrollIntoView({ behavior: "smooth" })}
                      className="group relative px-6 py-3.5 rounded-xl font-semibold text-white text-sm overflow-hidden transition-all"
                      style={{
                        background: "linear-gradient(135deg,#00F5FF 0%,#8A2EFF 100%)",
                        boxShadow: "0 4px 18px rgba(0,245,255,0.3), 0 1px 0 rgba(255,255,255,0.2) inset",
                        fontFamily: "'Rajdhani',sans-serif",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <span className="relative z-10 inline-flex items-center gap-2">
                        BUSCAR <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-[12px] text-[#A0A0B8]">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-[#00FF9D]" /> Corretor verificado
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#00F5FF]" /> {filteredProducts.length} imóveis ativos
                  </span>
                  {availableCities.length > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#8A2EFF]" /> {availableCities.length} cidades
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ===== CATEGORIES ===== */}
        <section className="px-4 md:px-10 mb-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = activeCategory === cat.slug || (cat.slug === "all" && !activeCategory);
                return (
                  <button
                    key={cat.slug}
                    onClick={() => setActiveCategory(cat.slug === "all" ? "" : cat.slug)}
                    className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      fontFamily: "'Rajdhani',sans-serif",
                      letterSpacing: "0.04em",
                      background: active ? "linear-gradient(135deg,#00F5FF15,#8A2EFF15)" : "rgba(17,17,24,0.6)",
                      border: `1px solid ${active ? "rgba(0,245,255,0.5)" : "rgba(255,255,255,0.06)"}`,
                      color: active ? "#00F5FF" : "#A0A0B8",
                      boxShadow: active ? "0 0 20px rgba(0,245,255,0.18)" : "none",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <Icon size={15} />
                    {cat.name.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== GRID ===== */}
        <section id="cp-grid" className="px-4 md:px-10 pb-20">
          <div className="max-w-7xl mx-auto">
            {visibleProducts.length === 0 ? (
              <div className="text-center py-20 text-[#A0A0B8]">Nenhum imóvel encontrado.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {visibleProducts.map((p: any, idx: number) => {
                  const url = `/imoveis/produto/${p.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
                  const img = p.images?.[0] || p.image;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: Math.min(idx * 0.04, 0.4) }}
                    >
                      <Link
                        to={url}
                        className="group relative block rounded-2xl overflow-hidden transition-all duration-500"
                        style={{
                          background: "rgba(17,17,24,0.65)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          backdropFilter: "blur(18px) saturate(160%)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-6px)";
                          e.currentTarget.style.borderColor = "rgba(0,245,255,0.35)";
                          e.currentTarget.style.boxShadow =
                            "0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,245,255,0.18), 0 0 50px rgba(0,245,255,0.12)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                          e.currentTarget.style.boxShadow = "";
                        }}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          {img ? (
                            <img
                              src={img}
                              alt={p.title}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                              style={{ filter: "contrast(1.04) saturate(1.08)" }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#111118] to-[#0A0A0F]" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F]/80 via-transparent to-transparent" />

                          {p.tag && (
                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase" style={{
                              background: "rgba(138,46,255,0.18)",
                              border: "1px solid rgba(138,46,255,0.45)",
                              color: "#C9A8FF",
                              backdropFilter: "blur(8px)",
                              fontFamily: "'Rajdhani',sans-serif",
                            }}>
                              {p.tag}
                            </div>
                          )}

                          <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/50 backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D]" style={{ boxShadow: "0 0 6px #00FF9D" }} />
                            <span className="text-[9px] text-[#F5F5F5] font-medium tracking-wider">DISPONÍVEL</span>
                          </div>
                        </div>

                        <div className="p-5">
                          <h3 className="text-[15px] font-semibold text-[#F5F5F5] line-clamp-1 mb-1">{p.title}</h3>
                          {p.city && (
                            <p className="text-[12px] text-[#A0A0B8] flex items-center gap-1 mb-3">
                              <MapPin size={11} /> {p.city}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-[#A0A0B8] mb-4">
                            {p.bedrooms != null && (
                              <span className="inline-flex items-center gap-1">
                                <Bed size={12} className="text-[#00F5FF]" /> {p.bedrooms}
                              </span>
                            )}
                            {p.bathrooms != null && (
                              <span className="inline-flex items-center gap-1">
                                <Bath size={12} className="text-[#00F5FF]" /> {p.bathrooms}
                              </span>
                            )}
                            {p.area != null && (
                              <span className="inline-flex items-center gap-1">
                                <Ruler size={12} className="text-[#00F5FF]" /> {p.area}m²
                              </span>
                            )}
                          </div>

                          <div className="h-px w-full mb-4" style={{ background: "linear-gradient(90deg,transparent,rgba(0,245,255,0.25),transparent)" }} />

                          <div className="flex items-end justify-between gap-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.18em] text-[#A0A0B8] mb-0.5">
                                {p.price && p.price < 20000 ? "Aluguel" : "Valor"}
                              </p>
                              <p className="text-xl font-bold leading-none" style={{
                                color: "#00FF9D",
                                textShadow: "0 0 18px rgba(0,255,157,0.35)",
                                fontFamily: "'Orbitron','Rajdhani',sans-serif",
                                letterSpacing: "-0.01em",
                              }}>
                                {formatPrice(p.price)}
                                {p.price && p.price < 20000 && (
                                  <span className="text-[10px] text-[#A0A0B8] font-normal ml-1">/mês</span>
                                )}
                              </p>
                            </div>

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleWhatsApp(p.title, p.id);
                              }}
                              className="inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all"
                              style={{
                                background: "rgba(0,245,255,0.1)",
                                border: "1px solid rgba(0,245,255,0.4)",
                                color: "#00F5FF",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(0,245,255,0.2)";
                                e.currentTarget.style.boxShadow = "0 0 18px rgba(0,245,255,0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(0,245,255,0.1)";
                                e.currentTarget.style.boxShadow = "";
                              }}
                              aria-label="WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </button>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        {dbProfile?.phone && (
          <section className="px-4 md:px-10 pb-24">
            <div className="max-w-5xl mx-auto rounded-3xl p-8 md:p-14 text-center relative overflow-hidden" style={{
              background: "linear-gradient(135deg,rgba(0,245,255,0.06),rgba(138,46,255,0.08))",
              border: "1px solid rgba(0,245,255,0.18)",
              backdropFilter: "blur(20px)",
            }}>
              <div className="absolute inset-0 pointer-events-none opacity-40" style={{
                background:
                  "radial-gradient(circle at 30% 20%,rgba(0,245,255,0.15),transparent 50%), radial-gradient(circle at 70% 80%,rgba(138,46,255,0.15),transparent 50%)",
              }} />
              <div className="relative">
                <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{
                  fontFamily: "'Orbitron',sans-serif",
                  background: "linear-gradient(180deg,#F5F5F5,#A0A0B8)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.02em",
                }}>
                  Pronto para o próximo nível?
                </h2>
                <p className="text-[#A0A0B8] text-base md:text-lg max-w-xl mx-auto mb-8">
                  Atendimento direto e exclusivo. Encontre o imóvel certo, com quem entende do mercado.
                </p>
                <button
                  onClick={() => handleWhatsApp(sellerDisplayName)}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold transition-all"
                  style={{
                    background: "linear-gradient(135deg,#00F5FF 0%,#8A2EFF 100%)",
                    boxShadow: "0 8px 28px rgba(0,245,255,0.35), 0 1px 0 rgba(255,255,255,0.2) inset",
                    fontFamily: "'Rajdhani',sans-serif",
                    letterSpacing: "0.06em",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.filter = "brightness(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.filter = "";
                  }}
                >
                  <MessageCircle size={18} />
                  FALAR COM ESPECIALISTA
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
