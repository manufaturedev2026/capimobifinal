import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Instagram, Smartphone, Globe, Sparkles, ArrowRight, Star, Zap, Shield,
  Layout, Palette, BarChart3, Share2, ChevronRight, Check, Crown, Eye, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import storePreviewApartment from "@/assets/store-preview-apartment.jpg";
import storePreviewHouse from "@/assets/store-preview-house.jpg";
import storePreviewLot from "@/assets/store-preview-lot.jpg";
import storePreviewPenthouse from "@/assets/store-preview-penthouse.jpg";

const HERO_PHONE_SLIDES = [
  {
    title: "Casa com piscina e gourmet",
    location: "Florianópolis, SC",
    price: "R$ 1.250.000",
    details: "4 quartos • 320m²",
    label: "Showcase",
    image: storePreviewHouse,
  },
  {
    title: "Apartamento alto padrão",
    location: "Belo Horizonte, MG",
    price: "R$ 890.000",
    details: "3 suítes • vista livre",
    label: "Premium",
    image: storePreviewApartment,
  },
  {
    title: "Cobertura com vista panorâmica",
    location: "Rio de Janeiro, RJ",
    price: "R$ 2.490.000",
    details: "Piscina privativa • 280m²",
    label: "Épico",
    image: storePreviewPenthouse,
  },
  {
    title: "Terreno em condomínio fechado",
    location: "Goiânia, GO",
    price: "R$ 320.000",
    details: "420m² • pronto para construir",
    label: "Novo",
    image: storePreviewLot,
  },
];

const STORE_GRID_ITEMS = [
  { img: storePreviewHouse, title: "Casa com piscina", price: "R$ 1.250.000" },
  { img: storePreviewApartment, title: "Apto alto padrão", price: "R$ 890.000" },
  { img: storePreviewPenthouse, title: "Cobertura premium", price: "R$ 2.490.000" },
  { img: storePreviewLot, title: "Terreno fechado", price: "R$ 320.000" },
  { img: storePreviewHouse, title: "Casa térrea moderna", price: "R$ 980.000" },
  { img: storePreviewApartment, title: "Living panorâmico", price: "R$ 760.000" },
];

const FEATURES = [
  { icon: Smartphone, title: "Mobile-First", desc: "Design 100% otimizado para celular — feito para o Instagram" },
  { icon: Palette, title: "8 Temas Premium", desc: "Escolha entre Rose Gold, Esmeralda, Midnight e mais" },
  { icon: Layout, title: "Catálogo Estilo Netflix", desc: "Cards verticais, filtros por categoria, modo cinema" },
  { icon: BarChart3, title: "Analytics Completo", desc: "Visualizações, cliques no WhatsApp, imóveis mais vistos" },
  { icon: Share2, title: "Link na Bio Perfeito", desc: "URL única para Instagram, TikTok, Facebook e qualquer rede" },
  { icon: Shield, title: "CRM Integrado", desc: "Gerencie seus leads com funil de vendas profissional" },
];

const PLANS_PREVIEW = [
  { name: "Básico", price: "Grátis", items: "5 anúncios", highlight: false },
  { name: "Start", price: "R$ 24,99", items: "25 anúncios", highlight: true },
  { name: "VIP", price: "R$ 59,99", items: "100 anúncios + Analytics", highlight: false },
];

export default function Index() {
  const { user } = useAuth();
  const [activeScreen, setActiveScreen] = useState(0);
  const [phoneScreen, setPhoneScreen] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreen((p) => (p + 1) % HERO_PHONE_SLIDES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhoneScreen((p) => (p + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Brokers Bio | Sua Loja de Imóveis no Instagram</title>
        <meta name="description" content="Crie sua loja de imóveis estilo Netflix e compartilhe no Instagram. Link na Bio profissional para corretores e imobiliárias de todo o Brasil." />
        <link rel="canonical" href="https://redeimoveisgb.lovable.app/" />
      </Helmet>

      {/* ═══════════ HERO — ÉPICO ═══════════ */}
      <section className="relative min-h-[90vh] md:min-h-screen overflow-hidden flex items-center">
        {/* BG layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--navy))] via-[hsl(212,80%,14%)] to-[hsl(var(--navy))]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.35),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(var(--accent)/0.18),transparent_50%)]" />

        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 right-[15%] w-64 h-64 rounded-full bg-primary/10 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute bottom-20 left-[10%] w-48 h-48 rounded-full bg-accent/10 blur-3xl"
        />

        <div className="container max-w-6xl mx-auto px-4 relative z-10 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Copy */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6"
              >
                <Instagram size={16} className="text-accent" />
                <span className="text-white/80 text-xs font-semibold tracking-wide">LINK NA BIO PROFISSIONAL</span>
              </motion.div>

              <h1 className="font-display font-extrabold text-4xl md:text-6xl lg:text-7xl text-white leading-[1.05] tracking-tight">
                Sua loja de
                <br />
                <span className="bg-gradient-to-r from-primary via-sky-400 to-accent bg-clip-text text-transparent">
                  imóveis épica
                </span>
                <br />
                no Instagram
              </h1>

              <p className="text-white/60 text-base md:text-lg mt-6 leading-relaxed max-w-lg">
                Crie uma vitrine profissional estilo Netflix, compartilhe o link na bio e
                transforme seguidores em clientes. Tudo pelo celular.
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                <Button asChild size="lg" className="gap-2 h-13 px-8 text-base font-bold rounded-xl shadow-lg shadow-primary/30">
                  <Link to="/entrar">
                    <Sparkles size={18} /> Criar Minha Loja Grátis
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="gap-2 h-13 px-6 text-white/70 hover:text-white hover:bg-white/10">
                  <Link to="/pacotes">
                    Ver Planos <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/10">
                <div>
                  <p className="font-display font-bold text-2xl text-white">500+</p>
                  <p className="text-white/40 text-xs">Lojas criadas</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="font-display font-bold text-2xl text-white">120+</p>
                  <p className="text-white/40 text-xs">Corretores ativos</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-white/40 text-xs ml-1">4.9</span>
                </div>
              </div>
            </motion.div>

            {/* Right — Phone mockup showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex justify-center"
            >
              <div className="relative">
                {/* Phone frame */}
                <div className="w-[248px] h-[500px] md:w-[280px] md:h-[560px] bg-gradient-to-b from-white/10 to-white/5 rounded-[3rem] border-2 border-white/15 backdrop-blur-sm p-3 shadow-2xl shadow-black/50">
                  <div className="w-full h-full rounded-[2.2rem] bg-[hsl(var(--navy))] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-20" />

                    {/* Screen content */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeScreen}
                        initial={{ opacity: 0, scale: 1.03 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                      >
                        <img
                          src={HERO_PHONE_SLIDES[activeScreen].image}
                          alt={HERO_PHONE_SLIDES[activeScreen].title}
                          className="w-full h-full object-cover"
                          width={768}
                          height={1344}
                          loading={activeScreen === 0 ? "eager" : "lazy"}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />

                        <div className="absolute top-10 left-4 right-4 flex items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-black/35 border border-white/10 backdrop-blur-md max-w-[11rem]">
                            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                              <span className="text-primary-foreground text-[9px] font-bold">BB</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-[10px] font-semibold truncate">BrokersBio</p>
                              <p className="text-white/60 text-[8px] truncate">Loja em tempo real</p>
                            </div>
                          </div>
                          <Badge className="bg-primary/90 text-primary-foreground border-0 text-[9px] px-2.5 py-1">
                            {HERO_PHONE_SLIDES[activeScreen].label}
                          </Badge>
                        </div>

                        <div className="absolute bottom-5 left-4 right-4 glass-card rounded-[1.6rem] p-4">
                          <p className="text-white/55 text-[9px] font-semibold uppercase tracking-[0.24em]">
                            Showcase da sua loja
                          </p>
                          <h4 className="text-white font-display font-extrabold text-lg leading-tight mt-2">
                            {HERO_PHONE_SLIDES[activeScreen].title}
                          </h4>
                          <div className="flex items-center gap-2 mt-2 text-white/70 text-[10px]">
                            <span>{HERO_PHONE_SLIDES[activeScreen].location}</span>
                            <span className="h-1 w-1 rounded-full bg-white/40" />
                            <span>{HERO_PHONE_SLIDES[activeScreen].details}</span>
                          </div>
                          <div className="flex items-end justify-between gap-3 mt-4">
                            <div>
                              <p className="font-display font-black text-xl text-white">
                                {HERO_PHONE_SLIDES[activeScreen].price}
                              </p>
                              <p className="text-white/55 text-[10px] mt-0.5">Link direto pro WhatsApp</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <span className="flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground">
                                <Eye size={11} /> Ver
                              </span>
                              <span className="flex items-center justify-center rounded-xl bg-white/10 px-3 py-2 text-[10px] font-bold text-white">
                                <MessageCircle size={11} />
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Bottom indicator */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                      {HERO_PHONE_SLIDES.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveScreen(i)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === activeScreen ? "w-6 bg-primary" : "w-1.5 bg-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -right-12 top-16 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <Crown size={18} className="text-amber-400" />
                    <div>
                      <p className="text-white text-xs font-bold">Plano VIP</p>
                      <p className="text-white/40 text-[10px]">100 anúncios</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -left-16 bottom-28 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-primary" />
                    <div>
                      <p className="text-white text-xs font-bold">Link na Bio</p>
                      <p className="text-white/40 text-[10px]">brokersbio.app/loja</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ COMO FUNCIONA ═══════════ */}
      <section className="px-4 py-16 md:py-24 bg-secondary/50">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">3 passos simples</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-foreground">
            Monte sua loja em <span className="text-primary">minutos</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              {
                step: "01",
                title: "Cadastre-se",
                desc: "Crie sua conta grátis e preencha seu perfil profissional com logo, CRECI e dados de contato.",
                icon: Sparkles,
                gradient: "from-primary/20 to-primary/5",
              },
              {
                step: "02",
                title: "Adicione seus imóveis",
                desc: "Cadastre seus imóveis com fotos, vídeos e detalhes. Sua loja estilo Netflix é criada automaticamente.",
                icon: Layout,
                gradient: "from-accent/20 to-accent/5",
              },
              {
                step: "03",
                title: "Compartilhe o link",
                desc: "Coloque o link na bio do Instagram e comece a receber contatos pelo WhatsApp integrado.",
                icon: Instagram,
                gradient: "from-emerald-500/20 to-emerald-500/5",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`relative bg-gradient-to-b ${item.gradient} border border-border rounded-3xl p-8 text-left group hover:border-primary/30 transition-colors`}
              >
                <span className="font-display font-black text-5xl text-primary/15 absolute top-4 right-4">{item.step}</span>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <item.icon size={22} className="text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ EXEMPLO DE LOJA ═══════════ */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-accent border-accent/30">Exemplo real</Badge>
            <h2 className="font-display font-bold text-2xl md:text-4xl text-foreground">
              Assim fica a sua <span className="text-accent">loja épica</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Uma vitrine profissional que impressiona seus clientes e gera contatos no WhatsApp
            </p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mt-5"
            >
              <Button asChild size="lg" className="gap-2 font-bold rounded-full shadow-lg shadow-primary/30 animate-pulse-glow">
                <Link to="/empresa/gabriel-imoveis">
                  <Eye size={18} /> Ver Exemplo Real ao Vivo
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Phone frame with auto-rotating store screens */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative max-w-[320px] mx-auto"
          >
            {/* Phone frame */}
            <div className="relative rounded-[3rem] border-[6px] border-foreground/20 bg-black shadow-2xl shadow-black/30 overflow-hidden">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-20" />

              {/* Screen content — carousel */}
              <div className="relative aspect-[9/19.5] overflow-hidden bg-[#0a0f1a]">
                <AnimatePresence mode="wait">
                  {(() => {
                    const screens = [
                      // Screen 1: Showcase hero
                      <motion.div key="screen-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0">
                        <img src={storePreviewHouse} alt="Loja showcase" className="w-full h-full object-cover" width={768} height={1344} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute top-10 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md">
                          <div className="w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center border border-white/20">
                            <span className="text-white font-bold text-[8px]">JR</span>
                          </div>
                          <span className="text-white text-[10px] font-semibold">João Imóveis</span>
                          <Badge className="bg-primary text-[7px] px-1 py-0">Premium</Badge>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 pb-5">
                          <h3 className="font-display font-extrabold text-lg text-white leading-tight">Casa 3 Quartos com Piscina</h3>
                          <p className="text-white/50 text-[10px] mt-1">📍 São Paulo, SP</p>
                          <p className="font-display font-extrabold text-xl text-emerald-400 mt-1">R$ 450.000</p>
                          <div className="flex gap-2 mt-3">
                            <span className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-primary text-white font-bold text-[11px]"><Eye size={12} /> Ver</span>
                            <span className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-[#25d366] text-white font-bold text-[11px]"><MessageCircle size={12} /></span>
                          </div>
                        </div>
                        <div className="absolute bottom-[5.5rem] left-1/2 -translate-x-1/2 flex gap-1">
                          <span className="h-0.5 w-4 rounded-full bg-white" />
                          <span className="h-0.5 w-1 rounded-full bg-white/40" />
                          <span className="h-0.5 w-1 rounded-full bg-white/40" />
                        </div>
                      </motion.div>,

                      // Screen 2: Grid catalog
                      <motion.div key="screen-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 bg-[#0a0f1a] pt-10 px-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center border border-primary/40">
                            <span className="text-white font-bold text-[9px]">JR</span>
                          </div>
                          <div>
                            <p className="text-white font-display font-bold text-xs">João Imóveis</p>
                            <p className="text-white/40 text-[9px]">6 imóveis</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 mb-3 overflow-hidden">
                          {["Todos", "Casas", "Aptos", "Terrenos"].map((f, i) => (
                            <span key={f} className={`px-2.5 py-1 rounded-lg text-[9px] font-medium whitespace-nowrap ${i === 0 ? "bg-primary text-white" : "bg-white/10 text-white/60"}`}>{f}</span>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {STORE_GRID_ITEMS.map((item) => (
                            <div key={item.title} className="rounded-lg overflow-hidden bg-white/5 border border-white/10">
                              <img src={item.img} alt={item.title} className="w-full aspect-[4/3] object-cover" loading="lazy" width={768} height={1344} />
                              <div className="p-1.5">
                                <p className="text-white font-semibold text-[9px] truncate">{item.title}</p>
                                <p className="text-emerald-400 font-bold text-[10px]">{item.price}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>,

                      // Screen 3: Property detail
                      <motion.div key="screen-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0">
                        <img src={storePreviewPenthouse} alt="Detalhe imóvel" className="w-full aspect-[16/10] object-cover" width={768} height={1344} />
                        <div className="bg-[#0a0f1a] px-4 pt-3 pb-4">
                          <Badge className="bg-accent/20 text-accent text-[8px] border-accent/30 mb-2">Premium</Badge>
                          <h3 className="font-display font-bold text-sm text-white">Cobertura Duplex 4 Suítes</h3>
                          <p className="text-white/40 text-[10px] mt-0.5">📍 Rio de Janeiro, RJ</p>
                          <p className="font-display font-extrabold text-lg text-emerald-400 mt-1">R$ 890.000</p>
                          <div className="flex gap-3 mt-3 text-white/60 text-[9px]">
                            <span>🛏 4 quartos</span>
                            <span>🚿 3 banheiros</span>
                            <span>📐 180m²</span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <span className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-[#25d366] text-white font-bold text-[10px]"><MessageCircle size={11} /> WhatsApp</span>
                            <span className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-primary text-white font-bold text-[10px]"><Share2 size={11} /> Compartilhar</span>
                          </div>
                          <div className="mt-3 p-2.5 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-white/80 text-[9px] leading-relaxed">Cobertura espetacular com vista panorâmica, 4 suítes sendo 1 master com closet e hidro. Ampla sala com pé-direito duplo...</p>
                          </div>
                        </div>
                      </motion.div>,

                      // Screen 4: Stories + profile
                      <motion.div key="screen-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 bg-[#0a0f1a] pt-10 px-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent p-[2px]">
                            <div className="w-full h-full rounded-full bg-[#0a0f1a] flex items-center justify-center">
                              <span className="text-white font-display font-bold text-sm">JR</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-white font-display font-bold text-sm">João Imóveis</p>
                            <p className="text-white/40 text-[10px]">CRECI 12345-ES · São Paulo</p>
                            <div className="flex gap-2 mt-1">
                              <Badge className="bg-primary/20 text-primary text-[7px] border-primary/30">Premium</Badge>
                              <Badge className="bg-white/10 text-white/60 text-[7px]">⭐ 4.9</Badge>
                            </div>
                          </div>
                        </div>
                        {/* Stories circles */}
                        <div className="flex gap-3 mb-4">
                          {[
                            storePreviewHouse,
                            storePreviewApartment,
                            storePreviewPenthouse,
                          ].map((src, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent p-[2px]">
                                <img src={src} alt="Story da loja" className="w-full h-full rounded-full object-cover" width={768} height={1344} />
                              </div>
                              <span className="text-white/40 text-[8px]">Novo</span>
                            </div>
                          ))}
                        </div>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {[
                            { label: "Imóveis", value: "6" },
                            { label: "Visualizações", value: "1.2k" },
                            { label: "Contatos", value: "48" },
                          ].map((s) => (
                            <div key={s.label} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                              <p className="text-white font-display font-bold text-sm">{s.value}</p>
                              <p className="text-white/40 text-[8px]">{s.label}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-white/60 text-[10px] leading-relaxed">Corretor especializado em imóveis de alto padrão em São Paulo. Mais de 10 anos de experiência no mercado imobiliário.</p>
                      </motion.div>,
                    ];
                    return screens[phoneScreen];
                  })()}
                </AnimatePresence>

                {/* Screen indicator dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {[0, 1, 2, 3].map((i) => (
                    <button
                      key={i}
                      onClick={() => setPhoneScreen(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${phoneScreen === i ? "w-5 bg-primary" : "w-1.5 bg-white/30"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Glow effect behind phone */}
            <div className="absolute -inset-8 -z-10 rounded-full bg-primary/10 blur-3xl" />
          </motion.div>

          <div className="text-center mt-8">
            <Button asChild size="lg" className="gap-2 font-bold rounded-xl shadow-lg shadow-primary/20">
              <Link to="/entrar">
                <Sparkles size={18} /> Quero Criar a Minha
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section className="px-4 py-16 md:py-24 bg-secondary/50">
        <div className="max-w-6xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">Tudo incluso</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-foreground">
            Uma loja <span className="text-primary">completa</span> no seu bolso
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-2xl p-6 text-left hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-display font-bold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PLANOS ═══════════ */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 text-accent border-accent/30">Preços simples</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-foreground">
            Comece grátis, <span className="text-accent">cresça</span> quando quiser
          </h2>

          <div className="grid md:grid-cols-3 gap-5 mt-12">
            {PLANS_PREVIEW.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-3xl p-6 border-2 transition-all ${
                  plan.highlight
                    ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-105"
                    : "border-border bg-card hover:border-primary/20"
                }`}
              >
                {plan.highlight && (
                  <Badge className="bg-primary text-primary-foreground mb-3">
                    <Star size={12} className="mr-1" /> Mais Popular
                  </Badge>
                )}
                <h3 className="font-display font-bold text-lg text-foreground">{plan.name}</h3>
                <p className="font-display font-extrabold text-3xl text-foreground mt-2">
                  {plan.price}
                  {plan.price !== "Grátis" && <span className="text-sm font-normal text-muted-foreground">/mês</span>}
                </p>
                <p className="text-sm text-muted-foreground mt-3">{plan.items}</p>
                <ul className="mt-4 space-y-2 text-left">
                  {["Loja estilo Netflix", "Link na Bio", "WhatsApp integrado"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check size={14} className="text-emerald-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="w-full mt-6"
                  variant={plan.highlight ? "default" : "outline"}
                >
                  <Link to="/pacotes">
                    {plan.highlight ? "Começar Agora" : "Ver Detalhes"}
                    <ChevronRight size={16} />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(var(--navy))] via-primary to-[hsl(var(--navy))] p-8 md:p-14 text-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 mb-6"
              >
                <Instagram size={28} className="text-white" />
              </motion.div>
              <h2 className="font-display font-extrabold text-2xl md:text-4xl text-white">
                Seu link na bio merece ser <span className="text-accent">épico</span>
              </h2>
              <p className="text-white/60 mt-3 max-w-lg mx-auto text-sm md:text-base">
                Pare de perder clientes com perfis amadores. Crie sua loja profissional agora e
                comece a receber contatos pelo WhatsApp hoje mesmo.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                <Button asChild size="lg" variant="secondary" className="gap-2 font-bold rounded-xl shadow-lg">
                  <Link to="/entrar">
                    <Sparkles size={18} /> Criar Minha Loja Grátis
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
