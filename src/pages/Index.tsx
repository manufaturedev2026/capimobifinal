import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import {
  Instagram, Smartphone, Globe, Sparkles, ArrowRight, Star, Zap, Shield,
  Layout, Palette, BarChart3, Share2, ChevronRight, ChevronLeft, Check, Crown, Eye, MessageCircle,
  Download, Layers, Users, Building2, Briefcase, AppWindow, Rocket, Heart, Clapperboard, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import HomePwaActions from "@/components/HomePwaActions";
import { useSiteSettings } from "@/hooks/useSiteSettings";

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
  { icon: AppWindow, title: "Seu Próprio APP", desc: "Aplicativo instalável no celular dos seus clientes — como um app da App Store, sem custos extras" },
  { icon: Instagram, title: "Bio Link Épico", desc: "URL única e profissional para colocar na bio do Instagram, TikTok e qualquer rede social" },
  { icon: Layout, title: "7 Layouts Premium", desc: "Netflix, Marketplace, Showcase, Minimal, Magazine, Gallery e Elegant — escolha o seu estilo" },
  { icon: BarChart3, title: "Analytics + CRM", desc: "Painel completo de visualizações, leads e um CRM com funil de vendas integrado" },
  { icon: Palette, title: "8 Temas de Cores", desc: "Personalize com Rose Gold, Esmeralda, Midnight, Oceano e muito mais" },
  { icon: Shield, title: "PWA Instalável", desc: "Seus clientes instalam seu app direto do navegador — funciona offline, rápido e profissional" },
];

const TARGET_AUDIENCE = [
  { icon: Briefcase, title: "Corretores", desc: "Tenha seu próprio app de imóveis com sua marca pessoal e link profissional na bio" },
  { icon: Building2, title: "Imobiliárias", desc: "App completo com equipe de corretores, analytics por membro e gestão centralizada" },
  { icon: Layers, title: "Construtoras", desc: "Vitrine digital para lançamentos, empreendimentos e portfólio de obras com vídeos" },
];

const PLANS_PREVIEW = [
  {
    name: "Start",
    price: "R$ 24,99",
    setupFee: "R$ 299",
    items: "25 anúncios",
    layouts: "1 Layout (Netflix)",
    highlight: false,
    color: "from-emerald-500 to-teal-600",
    icon: Zap,
  },
  {
    name: "VIP",
    price: "R$ 59,99",
    setupFee: "R$ 719",
    items: "60 anúncios",
    layouts: "4 Layouts",
    highlight: true,
    color: "from-amber-500 to-orange-600",
    icon: Star,
    benefits: ["Selo VIP", "Destaque no topo", "Analytics avançado", "Modo Cinema"],
  },
  {
    name: "Premium",
    price: "R$ 114,99",
    setupFee: "R$ 1.379",
    items: "115 anúncios",
    layouts: "7 Layouts (todos)",
    highlight: false,
    color: "from-purple-600 to-indigo-700",
    icon: Crown,
    benefits: ["Selo Premium", "SEO Otimizado", "Suporte VIP", "Instagram na loja", "Modo Cinema"],
  },
];

export default function Index() {
  const { user } = useAuth();
  const [activeScreen, setActiveScreen] = useState(0);
  const [phoneScreen, setPhoneScreen] = useState(0);
  const [cinemaMode, setCinemaMode] = useState<number | null>(null);
  const [cinemaItems, setCinemaItems] = useState<any[]>([]);

  const selectedCity = typeof window !== "undefined" ? localStorage.getItem("selectedCity") || "" : "";

  // Fetch properties for cinema mode
  useEffect(() => {
    const fetchCinemaItems = async () => {
      let query = supabase
        .from("seller_items")
        .select("id, title, slug, price, city, state, photos, bedrooms, bathrooms, area, seller_id, finality")
        .eq("status", "ativo")
        .not("photos", "is", null)
        .limit(30);
      if (selectedCity) query = query.ilike("city", `%${selectedCity}%`);
      const { data } = await query;
      const items = (data || []).filter((i: any) => i.photos?.length > 0);
      // Shuffle
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      setCinemaItems(items);
    };
    fetchCinemaItems();
  }, [selectedCity]);

  // Fullscreen for cinema mode
  useEffect(() => {
    if (cinemaMode !== null) {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    } else {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
  }, [cinemaMode]);

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
        <title>Capimobi | Crie Seu Próprio App de Imóveis</title>
        <meta name="description" content="Monte seu próprio app de imóveis em minutos. Perfeito para corretores, imobiliárias e construtoras. Link profissional na bio do Instagram, PWA instalável e CRM integrado." />
        <link rel="canonical" href="https://redeimoveisgb.lovable.app/" />
      </Helmet>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[90vh] md:min-h-screen overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--navy))] via-[hsl(212,80%,14%)] to-[hsl(var(--navy))]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.35),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(var(--accent)/0.18),transparent_50%)]" />

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
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6"
              >
                <Rocket size={16} className="text-accent" />
                <span className="text-white/80 text-xs font-semibold tracking-wide">SEU PRÓPRIO APP DE IMÓVEIS</span>
              </motion.div>

              <h1 className="font-display font-extrabold text-4xl md:text-6xl lg:text-7xl text-white leading-[1.05] tracking-tight">
                Seu app de
                <br />
                <span className="bg-gradient-to-r from-primary via-sky-400 to-accent bg-clip-text text-transparent">
                  imóveis pronto
                </span>
                <br />
                em até 24 Horas
              </h1>

              <p className="text-white/60 text-base md:text-lg mt-6 leading-relaxed max-w-lg">
                Crie seu próprio aplicativo de imóveis, instale no celular dos seus clientes e
                tenha o link perfeito para a bio do Instagram. Tudo sem programar.
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                <Button asChild size="lg" className="gap-2 h-13 px-8 text-base font-bold rounded-xl shadow-lg shadow-primary/30">
                  <a href="https://wa.me/5527995055993?text=Ol%C3%A1%21%20Quero%20criar%20meu%20APP%20de%20im%C3%B3veis" target="_blank" rel="noopener noreferrer">
                    <Sparkles size={18} /> Quero Criar meu APP
                  </a>
                </Button>
                <Button asChild size="lg" variant="ghost" className="gap-2 h-13 px-6 text-white/70 hover:text-white hover:bg-white/10">
                  <Link to="/pacotes">
                    Ver Planos <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>


              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-white/10">
                <div>
                  <p className="font-display font-bold text-2xl text-white">500+</p>
                  <p className="text-white/40 text-xs">Apps criados</p>
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

            {/* Phone mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="w-[248px] h-[500px] md:w-[280px] md:h-[560px] bg-gradient-to-b from-white/10 to-white/5 rounded-[3rem] border-2 border-white/15 backdrop-blur-sm p-3 shadow-2xl shadow-black/50">
                  <div className="w-full h-full rounded-[2.2rem] bg-[hsl(var(--navy))] overflow-hidden relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-20" />

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
                              <span className="text-primary-foreground text-[9px] font-bold">CM</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-[10px] font-semibold truncate">Capimobi</p>
                              <p className="text-white/60 text-[8px] truncate">Seu app instalado</p>
                            </div>
                          </div>
                          <Badge className="bg-primary/90 text-primary-foreground border-0 text-[9px] px-2.5 py-1">
                            {HERO_PHONE_SLIDES[activeScreen].label}
                          </Badge>
                        </div>

                        <div className="absolute bottom-5 left-4 right-4 glass-card rounded-[1.6rem] p-4">
                          <p className="text-white/55 text-[9px] font-semibold uppercase tracking-[0.24em]">
                            Seu app imobiliário
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
                              <p className="text-white/55 text-[10px] mt-0.5">WhatsApp integrado</p>
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

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -right-12 top-16 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <Download size={18} className="text-primary" />
                    <div>
                      <p className="text-white text-xs font-bold">PWA Instalável</p>
                      <p className="text-white/40 text-[10px]">App no celular</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -left-16 bottom-28 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <Instagram size={18} className="text-accent" />
                    <div>
                      <p className="text-white text-xs font-bold">Bio Link</p>
                      <p className="text-white/40 text-[10px]">capimobi.com/loja</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

        {/* Cinema Mode Button - bottom right of hero */}
        {cinemaItems.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            onClick={() => setCinemaMode(0)}
            className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white font-semibold text-sm hover:bg-white/20 transition-all hover:scale-105 shadow-xl"
          >
            <Clapperboard size={18} className="text-primary" /> Modo Cinema
          </motion.button>
        )}
        </div>
      </section>

      {/* ═══════════ PARA QUEM É ═══════════ */}
      <section className="px-4 py-16 md:py-24 bg-secondary/50">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 text-accent border-accent/30">Para quem é</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-foreground">
            Feito para quem vende <span className="text-accent">imóveis</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Seja você um corretor autônomo, uma imobiliária ou uma construtora — crie seu app profissional hoje mesmo
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {TARGET_AUDIENCE.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative bg-card border border-border rounded-3xl p-8 text-left group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <item.icon size={26} className="text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ COMO FUNCIONA ═══════════ */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">3 passos simples</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-foreground">
            Monte seu app em <span className="text-primary">minutos</span>
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
                desc: "Cadastre imóveis com fotos e detalhes. Seu app com estilo Netflix, Marketplace ou Showcase é criado automaticamente.",
                icon: Layout,
                gradient: "from-accent/20 to-accent/5",
              },
              {
                step: "03",
                title: "Compartilhe & Instale",
                desc: "Coloque o link na bio do Instagram, envie para clientes e eles podem instalar seu app direto no celular.",
                icon: Download,
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

      {/* ═══════════ PWA SECTION ═══════════ */}
      <section className="px-4 py-16 md:py-24 bg-secondary/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">
                <Download size={12} className="mr-1" /> PWA Technology
              </Badge>
              <h2 className="font-display font-bold text-2xl md:text-4xl text-foreground">
                Um app <span className="text-primary">real</span> sem App Store
              </h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Seu app é instalável direto pelo navegador — tanto no Android quanto no iPhone. 
                Funciona offline, carrega rápido e aparece na tela inicial do celular como um app nativo.
              </p>

              <div className="mt-6 space-y-4">
                {[
                  { text: "Instalável em Android, iPhone e Desktop", icon: Smartphone },
                  { text: "Funciona offline e carrega instantaneamente", icon: Zap },
                  { text: "Ícone na tela inicial — como um app real", icon: AppWindow },
                  { text: "Sem taxas de App Store ou Play Store", icon: Heart },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon size={16} className="text-primary" />
                    </div>
                    <p className="text-foreground text-sm font-medium">{item.text}</p>
                  </div>
                ))}
              </div>

            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="relative w-[260px] h-[520px] bg-gradient-to-b from-white/10 to-white/5 rounded-[3rem] border-2 border-border backdrop-blur-sm p-3 shadow-2xl">
                <div className="w-full h-full rounded-[2.2rem] bg-[hsl(var(--navy))] overflow-hidden relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-20" />
                  <AnimatePresence mode="wait">
                    {(() => {
                      const screens = [
                        <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                          <img src={storePreviewHouse} alt="App preview" className="w-full h-full object-cover" width={768} height={1344} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          <div className="absolute top-10 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md">
                            <div className="w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center border border-white/20">
                              <span className="text-white font-bold text-[8px]">JR</span>
                            </div>
                            <span className="text-white text-[10px] font-semibold">João Imóveis</span>
                            <Badge className="bg-primary text-[7px] px-1 py-0">Premium</Badge>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 pb-5">
                            <h3 className="font-display font-extrabold text-lg text-white leading-tight">Casa 3 Quartos</h3>
                            <p className="text-white/50 text-[10px] mt-1">📍 São Paulo, SP</p>
                            <p className="font-display font-extrabold text-xl text-emerald-400 mt-1">R$ 450.000</p>
                            <div className="flex gap-2 mt-3">
                              <span className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-primary text-white font-bold text-[11px]"><Eye size={12} /> Ver</span>
                              <span className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-[#25d366] text-white font-bold text-[11px]"><MessageCircle size={12} /></span>
                            </div>
                          </div>
                        </motion.div>,
                        <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0a0f1a] pt-10 px-3">
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
                            {STORE_GRID_ITEMS.slice(0, 4).map((item) => (
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
                      ];
                      return screens[phoneScreen % 2];
                    })()}
                  </AnimatePresence>
                </div>
              </div>
              <div className="absolute -inset-8 -z-10 rounded-full bg-primary/10 blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ BIO LINK SECTION ═══════════ */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-accent border-accent/30">
              <Instagram size={12} className="mr-1" /> Link na Bio
            </Badge>
            <h2 className="font-display font-bold text-2xl md:text-4xl text-foreground">
              A bio mais <span className="text-accent">profissional</span> do Instagram
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Pare de usar links genéricos. Com o Capimobi, seu link na bio abre diretamente
              o seu app de imóveis — com sua marca, seus imóveis e contato direto pelo WhatsApp.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: "URL Única", desc: "Compre o seu domínio e implemente como quiser — 100% seu, 100% profissional" },
              { icon: Share2, title: "Multiplataforma", desc: "Funciona perfeitamente no Instagram, TikTok, Facebook, LinkedIn e qualquer rede" },
              { icon: Users, title: "Equipe Completa", desc: "Imobiliárias podem ter lojas individuais para cada corretor da equipe" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 text-center hover:border-accent/30 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon size={22} className="text-accent" />
                </div>
                <h3 className="font-display font-bold text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section className="px-4 py-16 md:py-24 bg-secondary/50">
        <div className="max-w-6xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">Tudo incluso</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-foreground">
            Um app <span className="text-primary">completo</span> no seu bolso
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

      {/* ═══════════ EXEMPLO DE LOJA ═══════════ */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 text-accent border-accent/30">Exemplo real</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-foreground">
            Veja um app <span className="text-accent">real</span> funcionando
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Clique abaixo e veja como seu app pode ficar — navegue, explore imóveis e teste no celular
          </p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-5 flex flex-wrap justify-center gap-3"
          >
            <Button asChild size="lg" className="gap-2 font-bold rounded-full shadow-lg shadow-primary/30 animate-pulse-glow">
              <Link to="/empresa/gabriel-imoveis">
                <Eye size={18} /> Ver App Exemplo ao Vivo
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ PLANOS ═══════════ */}
      <section className="px-4 py-16 md:py-24 bg-secondary/50">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 text-accent border-accent/30">Preços simples</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-foreground">
            Escolha o plano ideal para <span className="text-accent">seu negócio</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {PLANS_PREVIEW.map((plan, i) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-3xl overflow-hidden border-2 transition-all ${
                    plan.highlight
                      ? "border-amber-400 shadow-2xl shadow-amber-500/15 scale-[1.03]"
                      : "border-border bg-card hover:border-primary/20 hover:shadow-lg"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-bl-xl z-10">
                      POPULAR
                    </div>
                  )}

                  <div className={`p-6 bg-gradient-to-br ${plan.color} text-white`}>
                    <Icon size={28} className="mb-2" />
                    <h3 className="font-display font-extrabold text-xl">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="font-display font-bold text-3xl">{plan.price}</span>
                      <span className="text-white/70 text-sm">/mês</span>
                    </div>
                    <div className="mt-2 px-3 py-1.5 bg-white/15 rounded-xl text-center">
                      <span className="text-white/90 text-xs font-semibold">Implementação: {plan.setupFee}</span>
                      <span className="text-white/50 text-[10px] block mt-0.5">cobrado à vista</span>
                    </div>
                  </div>

                  <div className="p-6 bg-card">
                    <p className="text-sm font-semibold text-foreground">{plan.items}</p>
                    <p className="text-xs text-muted-foreground mt-1">{plan.layouts}</p>

                    <ul className="mt-4 space-y-2 text-left">
                      {["App instalável (PWA)", "Link na Bio profissional", "WhatsApp integrado", "CRM de leads"].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                          <Check size={14} className="text-emerald-500 flex-shrink-0" /> {f}
                        </li>
                      ))}
                      {plan.benefits?.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-foreground">
                          <Check size={14} className="text-primary flex-shrink-0" /> {b}
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      className={`w-full mt-6 ${plan.highlight ? "shadow-lg" : ""}`}
                      variant={plan.highlight ? "default" : "outline"}
                    >
                      <Link to="/pacotes">
                        {plan.highlight ? "Criar Meu App" : "Ver Detalhes"}
                        <ChevronRight size={16} />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
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
                <Smartphone size={28} className="text-white" />
              </motion.div>
              <h2 className="font-display font-extrabold text-2xl md:text-4xl text-white">
                Crie seu app de imóveis <span className="text-accent">agora</span>
              </h2>
              <p className="text-white/60 mt-3 max-w-lg mx-auto text-sm md:text-base">
                Seu próprio aplicativo, link profissional na bio do Instagram e 
                clientes instalando seu app no celular. Tudo gratuito para começar.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                <Button asChild size="lg" variant="secondary" className="gap-2 font-bold rounded-xl shadow-lg">
                  <Link to="/login">
                    <Sparkles size={18} /> Criar Meu App Grátis
                  </Link>
                </Button>
                
              </div>
            </div>
          </motion.div>
        </div>
      </section>




      <AnimatePresence>
        {cinemaMode !== null && cinemaItems.length > 0 && (() => {
          const total = cinemaItems.length;
          const current = cinemaItems[cinemaMode];
          if (!current) return null;
          const img = current.photos?.[0];
          const PRIMARY = "hsl(var(--primary))";

          return (
            <motion.div
              key="cinema-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="fixed inset-0 z-[9999] bg-black flex flex-col"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`cinema-img-${cinemaMode}`}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <img src={img} alt={current.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
                </motion.div>
              </AnimatePresence>

              <button
                onClick={() => setCinemaMode(null)}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white text-lg hover:bg-black/60 transition-colors"
              >
                ✕
              </button>

              <button
                onClick={() => setCinemaMode((prev) => (prev! - 1 + total) % total)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={() => setCinemaMode((prev) => (prev! + 1) % total)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <ChevronRight size={24} />
              </button>

              <div className="absolute bottom-0 left-0 right-0 z-40 p-6 md:p-10">
                <motion.div
                  key={`cinema-info-${cinemaMode}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h2 className="text-white font-display font-black text-2xl md:text-4xl leading-tight max-w-2xl">
                    {current.title}
                  </h2>
                  <div className="flex items-center gap-4 mt-3">
                    {current.price && (
                      <span className="text-xl md:text-2xl font-bold text-primary">
                        R$ {Number(current.price).toLocaleString("pt-BR")}
                        {current.finality === "aluguel" ? "/mês" : ""}
                      </span>
                    )}
                    {current.city && (
                      <span className="text-white/50 text-sm flex items-center gap-1">
                        <MapPin size={13} /> {current.city}{current.state ? `, ${current.state}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-white/40 text-xs">
                    {current.bedrooms && <span>{current.bedrooms} quartos</span>}
                    {current.bathrooms && <span>• {current.bathrooms} banheiros</span>}
                    {current.area && <span>• {current.area}m²</span>}
                  </div>
                  <Link
                    to={`/imoveis/produto/${current.slug || current.id}`}
                    onClick={() => setCinemaMode(null)}
                    className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 rounded-xl text-sm font-bold text-primary-foreground bg-primary transition-all hover:scale-105 shadow-lg"
                  >
                    Ver detalhes <ArrowRight size={14} />
                  </Link>
                </motion.div>
              </div>

              <div className="absolute top-5 left-5 z-50">
                <p className="text-white/40 text-xs">{cinemaMode + 1} de {total}</p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-50">
                <motion.div
                  key={`cinema-progress-${cinemaMode}`}
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 8, ease: "linear" }}
                  onAnimationComplete={() => setCinemaMode((prev) => (prev! + 1) % total)}
                />
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <HomePwaActions />
    </div>
  );
}
