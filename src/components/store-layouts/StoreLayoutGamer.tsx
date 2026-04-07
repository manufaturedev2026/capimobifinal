import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, MessageCircle, Eye, Shield, ChevronLeft, ChevronRight,
  Phone, Mail, User, Bed, Bath, Car, Maximize, Building2, Home,
} from "lucide-react";
import type { StoreLayoutProps } from "./types";

/* ─── Portrait orientation warning ─── */
function PortraitWarning() {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(orientation: portrait) and (max-width: 1024px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsPortrait(e.matches);
    handler(mql);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white gap-6 p-8">
      <motion.div
        animate={{ rotate: [0, 90, 90, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        className="text-6xl"
      >
        📱
      </motion.div>
      <p className="text-xl font-bold text-center">
        🔄 Vire o celular para melhor experiência
      </p>
      <p className="text-sm text-white/50 text-center max-w-xs">
        Este layout foi projetado para tela na horizontal (paisagem)
      </p>
    </div>
  );
}

/* ─── Nav dots ─── */
function NavDots({
  total,
  current,
  onDot,
  color,
}: {
  total: number;
  current: number;
  onDot: (i: number) => void;
  color: string;
}) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDot(i)}
          className="w-3 h-3 rounded-full transition-all duration-300 border border-white/30"
          style={{
            background: i === current ? color : "rgba(255,255,255,0.15)",
            transform: i === current ? "scale(1.4)" : "scale(1)",
            boxShadow: i === current ? `0 0 12px ${color}80` : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Stat pill for properties ─── */
function Stat({ icon: Icon, value }: { icon: any; value: string | number }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur text-white text-xs font-medium">
      <Icon size={13} className="text-white/60" /> {value}
    </span>
  );
}

/* ─── Main layout ─── */
export default function StoreLayoutGamer({
  filteredProducts,
  storeTheme,
  corretorSlug,
  dbProfile,
  handleWhatsApp,
  storiesBar,
}: StoreLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const properties = filteredProducts.filter((p: any) => p.status !== "vendido");
  const totalSlides = 1 + properties.length + 1; // profile + properties + contact

  const scrollToSlide = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActiveSlide(idx);
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        scrollToSlide(Math.min(activeSlide + 1, totalSlides - 1));
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        scrollToSlide(Math.max(activeSlide - 1, 0));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeSlide, totalSlides]);

  const accent = storeTheme.primary;
  const company = dbProfile;

  return (
    <>
      <PortraitWarning />

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex w-screen h-screen overflow-x-auto overflow-y-hidden snap-x snap-mandatory"
        style={{
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* ═══════ SLIDE 1: Broker Profile ═══════ */}
        <section
          className="flex-shrink-0 w-screen h-screen snap-start relative flex items-center justify-center overflow-hidden"
          style={{ background: "#0a0a0a" }}
        >
          {/* Ambient glow */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(ellipse at 30% 50%, ${accent}40 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, ${accent}20 0%, transparent 50%)`,
            }}
          />
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(${accent}40 1px, transparent 1px), linear-gradient(90deg, ${accent}40 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative z-10 flex items-center gap-16 px-16 max-w-7xl w-full">
            {/* Photo */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex-shrink-0"
            >
              {company?.logo_url ? (
                <div className="relative">
                  <img
                    src={company.logo_url}
                    alt={company.full_name}
                    className="w-72 h-72 rounded-2xl object-cover shadow-2xl"
                    style={{ border: `3px solid ${accent}40` }}
                  />
                  <div
                    className="absolute -inset-2 rounded-2xl -z-10 blur-xl opacity-30"
                    style={{ background: accent }}
                  />
                </div>
              ) : (
                <div
                  className="w-72 h-72 rounded-2xl flex items-center justify-center shadow-2xl"
                  style={{ background: `${accent}15`, border: `3px solid ${accent}40` }}
                >
                  <User size={80} className="text-white/20" />
                </div>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="flex-1 min-w-0"
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.3em] px-3 py-1 rounded-full"
                  style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}
                >
                  {company?.seller_category === "corretor" ? "Corretor(a)" : company?.seller_category === "imobiliaria" ? "Imobiliária" : company?.seller_category === "construtora" ? "Construtora" : "Profissional"}
                </span>
                {company?.creci && (
                  <span className="flex items-center gap-1 text-xs text-white/50">
                    <Shield size={12} /> {company.creci}
                  </span>
                )}
              </div>

              <h1 className="font-bold text-5xl text-white leading-tight mb-4">
                {company?.full_name || company?.company_name || "Corretor"}
              </h1>

              {company?.bio && (
                <p className="text-white/50 text-lg leading-relaxed max-w-lg mb-8 line-clamp-4">
                  {company.bio}
                </p>
              )}

              {company?.city && (
                <p className="flex items-center gap-2 text-white/40 text-sm mb-8">
                  <MapPin size={14} style={{ color: accent }} />
                  {company.address ? `${company.address}, ` : ""}{company.city}{company.state ? ` - ${company.state}` : ""}
                </p>
              )}

              <div className="flex items-center gap-4">
                {company?.phone && (
                  <button
                    onClick={() => handleWhatsApp(company.full_name || "Contato")}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 hover:shadow-xl active:scale-95"
                    style={{
                      background: `linear-gradient(135deg, #25d366, #128C7E)`,
                      boxShadow: "0 8px 30px rgba(37,211,102,0.3)",
                    }}
                  >
                    <MessageCircle size={18} /> WhatsApp
                  </button>
                )}
                <button
                  onClick={() => scrollToSlide(1)}
                  className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 border"
                  style={{ borderColor: `${accent}40`, background: `${accent}10` }}
                >
                  <Eye size={18} /> Ver Imóveis
                </button>
              </div>

              {storiesBar && <div className="mt-6">{storiesBar}</div>}
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.div
            className="absolute bottom-8 right-8 flex items-center gap-2 text-white/30 text-xs"
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Deslize <ChevronRight size={14} />
          </motion.div>
        </section>

        {/* ═══════ PROPERTY SLIDES ═══════ */}
        {properties.map((product: any, i: number) => {
          const productLink = `/imoveis/produto/${product.slug || product.id}${corretorSlug ? `?corretor=${corretorSlug}` : ""}`;
          const isActive = activeSlide === i + 1;

          return (
            <section
              key={product.id}
              className="flex-shrink-0 w-screen h-screen snap-start relative overflow-hidden"
            >
              {/* Background image */}
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s]"
                  style={{ transform: isActive ? "scale(1.05)" : "scale(1)" }}
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0" style={{ background: "#111" }} />
              )}

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-end p-12 pb-20 max-w-3xl">
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      {/* Counter */}
                      <span className="text-white/30 text-xs font-mono mb-4 block">
                        {String(i + 1).padStart(2, "0")} / {String(properties.length).padStart(2, "0")}
                      </span>

                      {/* Category badge */}
                      {product.category && (
                        <span
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4"
                          style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}
                        >
                          {product.category === "casa" && <><Home size={11} /> Casa</>}
                          {product.category === "apartamento" && <><Building2 size={11} /> Apartamento</>}
                          {product.category === "terreno" && "🏞️ Terreno"}
                          {product.category === "comercial" && "🏪 Comercial"}
                          {!["casa", "apartamento", "terreno", "comercial"].includes(product.category) && product.category}
                        </span>
                      )}

                      <h2 className="font-bold text-4xl lg:text-5xl text-white leading-tight mb-4">
                        {product.title}
                      </h2>

                      {product.city && (
                        <p className="flex items-center gap-2 text-white/50 text-sm mb-4">
                          <MapPin size={14} />
                          {product.neighborhood ? `${product.neighborhood}, ` : ""}{product.city}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        <Stat icon={Bed} value={product.bedrooms ? `${product.bedrooms} quartos` : ""} />
                        <Stat icon={Bath} value={product.bathrooms ? `${product.bathrooms} banheiros` : ""} />
                        <Stat icon={Car} value={product.parking_spots ? `${product.parking_spots} vagas` : ""} />
                        <Stat icon={Maximize} value={product.area ? `${product.area}m²` : ""} />
                      </div>

                      {/* Price */}
                      {product.price > 0 && (
                        <p className="text-4xl font-black mb-8" style={{ color: accent }}>
                          R$ {product.price.toLocaleString("pt-BR")}
                          {(product.finality === "aluguel" || product.category === "aluguel") && (
                            <span className="text-lg font-normal text-white/40">/mês</span>
                          )}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-4">
                        <Link
                          to={productLink}
                          className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95"
                          style={{
                            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                            boxShadow: `0 8px 30px ${accent}40`,
                          }}
                        >
                          <Eye size={18} /> Ver Detalhes
                        </Link>
                        <button
                          onClick={() => handleWhatsApp(product.title, product.id)}
                          className="flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-sm text-white bg-[#25d366] hover:bg-[#22c55e] transition-all hover:scale-105 active:scale-95"
                        >
                          <MessageCircle size={18} /> WhatsApp
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation arrows */}
              {i > 0 && (
                <button
                  onClick={() => scrollToSlide(i)}
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft size={22} />
                </button>
              )}
              {i < properties.length - 1 && (
                <button
                  onClick={() => scrollToSlide(i + 2)}
                  className="absolute right-20 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight size={22} />
                </button>
              )}
            </section>
          );
        })}

        {/* ═══════ LAST SLIDE: Contact ═══════ */}
        <section
          className="flex-shrink-0 w-screen h-screen snap-start relative flex items-center justify-center overflow-hidden"
          style={{ background: "#0a0a0a" }}
        >
          <div
            className="absolute inset-0 opacity-15"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${accent}30 0%, transparent 60%)`,
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(${accent}40 1px, transparent 1px), linear-gradient(90deg, ${accent}40 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 text-center max-w-lg px-8"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Agende sua <span style={{ color: accent }}>visita</span>
            </h2>
            <p className="text-white/50 text-lg mb-10">
              Entre em contato e encontre o imóvel ideal para você
            </p>

            <div className="flex flex-col gap-4 items-center">
              {company?.phone && (
                <button
                  onClick={() => handleWhatsApp(company.full_name || "Contato")}
                  className="w-full max-w-sm flex items-center justify-center gap-3 px-8 py-5 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95 text-lg"
                  style={{
                    background: "linear-gradient(135deg, #25d366, #128C7E)",
                    boxShadow: "0 8px 30px rgba(37,211,102,0.3)",
                  }}
                >
                  <MessageCircle size={22} /> Agendar Visita
                </button>
              )}

              {company?.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="w-full max-w-sm flex items-center justify-center gap-3 px-8 py-5 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 border"
                  style={{ borderColor: `${accent}40`, background: `${accent}10` }}
                >
                  <Phone size={22} /> Ligar Agora
                </a>
              )}

              {company?.email && (
                <a
                  href={`mailto:${company.email}`}
                  className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors mt-4"
                >
                  <Mail size={16} /> {company.email}
                </a>
              )}
            </div>

            {/* Back to start */}
            <button
              onClick={() => scrollToSlide(0)}
              className="mt-12 text-white/30 text-xs hover:text-white/60 transition-colors flex items-center gap-2 mx-auto"
            >
              <ChevronLeft size={14} /> Voltar ao início
            </button>
          </motion.div>
        </section>
      </div>

      {/* Nav dots */}
      <NavDots total={totalSlides} current={activeSlide} onDot={scrollToSlide} color={accent} />
    </>
  );
}
