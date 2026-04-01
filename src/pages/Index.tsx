import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Instagram, Smartphone, Globe, Sparkles, ArrowRight, Star, Zap, Shield,
  Layout, Palette, BarChart3, Share2, ChevronRight, Play, Check, Crown, Eye, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

const SHOWCASE_SCREENS = [
  {
    title: "Hero Banner Épico",
    desc: "Carrossel cinematográfico com seus melhores imóveis",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    title: "Catálogo Netflix",
    desc: "Cards premium com filtros por categoria e cidade",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    title: "Perfil Profissional",
    desc: "Logo, CRECI, Instagram e contato direto",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    title: "Stories Imersivos",
    desc: "Poste fotos e vídeos que expiram em 24h",
    gradient: "from-amber-500 to-orange-600",
  },
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
  { name: "Start", price: "R$ 24,99", items: "25 anúncios + Stories", highlight: true },
  { name: "VIP", price: "R$ 59,99", items: "100 anúncios + Analytics", highlight: false },
];

export default function Index() {
  const { user } = useAuth();
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreen((p) => (p + 1) % SHOWCASE_SCREENS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>ES Corretores | Sua Loja de Imóveis no Instagram</title>
        <meta name="description" content="Crie sua loja de imóveis estilo Netflix e compartilhe no Instagram. Link na Bio profissional para corretores e imobiliárias." />
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
              className="hidden lg:flex justify-center"
            >
              <div className="relative">
                {/* Phone frame */}
                <div className="w-[280px] h-[560px] bg-gradient-to-b from-white/10 to-white/5 rounded-[3rem] border-2 border-white/15 backdrop-blur-sm p-3 shadow-2xl shadow-black/50">
                  <div className="w-full h-full rounded-[2.2rem] bg-[hsl(var(--navy))] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-20" />

                    {/* Screen content */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeScreen}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 flex flex-col items-center justify-center p-6"
                      >
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${SHOWCASE_SCREENS[activeScreen].gradient} flex items-center justify-center mb-4 shadow-lg`}>
                          <Play size={24} className="text-white" />
                        </div>
                        <h4 className="text-white font-display font-bold text-lg text-center">
                          {SHOWCASE_SCREENS[activeScreen].title}
                        </h4>
                        <p className="text-white/50 text-xs text-center mt-2 leading-relaxed">
                          {SHOWCASE_SCREENS[activeScreen].desc}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    {/* Bottom indicator */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                      {SHOWCASE_SCREENS.map((_, i) => (
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
                      <p className="text-white/40 text-[10px]">escoretores.app/loja</p>
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
          </div>

          {/* Mock store preview — Showcase style */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl shadow-black/10 max-w-sm mx-auto"
          >
            {/* Showcase Hero Banner */}
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=1000&fit=crop"
                alt="Casa premium"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

              {/* Profile badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
                  <span className="text-white font-display font-bold text-[10px]">JR</span>
                </div>
                <span className="text-white text-xs font-semibold">João Imóveis</span>
              </div>

              {/* Tag */}
              <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] shadow-lg">
                Destaque
              </Badge>

              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
                <h3 className="font-display font-extrabold text-xl text-white drop-shadow-lg leading-tight">
                  Casa 3 quartos com piscina
                </h3>
                <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                  📍 Vila Velha, ES
                </p>
                <p className="font-display font-extrabold text-2xl text-emerald-400 mt-2 drop-shadow-lg">
                  R$ 450.000
                </p>
                <div className="flex gap-2 mt-4">
                  <span className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm">
                    <Eye size={16} /> Ver Detalhes
                  </span>
                  <span className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#25d366] text-white font-bold text-sm">
                    <MessageCircle size={16} />
                  </span>
                </div>
              </div>

              {/* Navigation arrows */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white">
                <ChevronRight size={16} className="rotate-180" />
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white">
                <ChevronRight size={16} />
              </div>

              {/* Progress dots */}
              <div className="absolute bottom-[6.5rem] left-1/2 -translate-x-1/2 flex gap-1.5">
                <span className="h-1 w-5 rounded-full bg-white" />
                <span className="h-1 w-1.5 rounded-full bg-white/40" />
                <span className="h-1 w-1.5 rounded-full bg-white/40" />
                <span className="h-1 w-1.5 rounded-full bg-white/40" />
              </div>
            </div>

            {/* Grid of other properties */}
            <div className="p-3">
              <p className="font-display font-bold text-xs text-foreground mb-2 px-1">Todos os Imóveis <span className="font-normal text-muted-foreground">(6)</span></p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { title: "Apto 2 quartos", price: "R$ 320.000", tag: "Novo", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop" },
                  { title: "Terreno 300m²", price: "R$ 180.000", tag: null, img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop" },
                  { title: "Cobertura Duplex", price: "R$ 890.000", tag: "Premium", img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop" },
                  { title: "Sala Comercial", price: "R$ 210.000", tag: null, img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop" },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl overflow-hidden bg-secondary/50 border border-border">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                      {item.tag && (
                        <Badge className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[8px] px-1.5 py-0.5">
                          {item.tag}
                        </Badge>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="font-display font-semibold text-[11px] text-foreground truncate">{item.title}</p>
                      <p className="text-emerald-500 font-display font-bold text-xs mt-0.5">{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
