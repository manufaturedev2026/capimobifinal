import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  TrendingUp,
  Users,
  Eye,
  Shield,
  Star,
  BarChart3,
  Megaphone,
  CheckCircle2,
  Zap,
  Globe,
  Award,
  Building,
  Sparkles,
  Monitor,
  Smartphone,
} from "lucide-react";
import heroImg from "@/assets/hero-anunciar.jpg";
import lojaPreviewImg from "@/assets/loja-preview-anunciar.jpg";
import painelPreviewImg from "@/assets/painel-preview-anunciar.jpg";
import avatarCorretorImg from "@/assets/avatar-corretor.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const benefits = [
  {
    icon: Eye,
    title: "Máxima Visibilidade",
    description: "Seus imóveis são exibidos para milhares de compradores ativos em todo o Brasil.",
  },
  {
    icon: TrendingUp,
    title: "Mais Vendas",
    description: "Corretores que anunciam no Capimobi vendem até 3x mais rápido que em plataformas tradicionais.",
    accent: true,
  },
  {
    icon: Shield,
    title: "Perfil Verificado",
    description: "Selo de CRECI verificado que transmite confiança e credibilidade para seus clientes.",
  },
  {
    icon: BarChart3,
    title: "Painel Analítico",
    description: "Acompanhe visualizações, cliques e contatos em tempo real pelo seu painel exclusivo.",
  },
  {
    icon: Megaphone,
    title: "Marketing Integrado",
    description: "Ferramentas de impulsionamento e destaque para seus anúncios alcançarem mais pessoas.",
    accent: true,
  },
  {
    icon: Globe,
    title: "Loja Virtual Própria",
    description: "Tenha sua vitrine online personalizada com logo, contato e portfólio completo de imóveis.",
  },
];

const stats = [
  { value: "10.000+", label: "Visitantes mensais" },
  { value: "500+", label: "Corretores cadastrados" },
  { value: "2.000+", label: "Imóveis anunciados" },
  { value: "78+", label: "Cidades atendidas" },
];

const plans = [
  { name: "Start", price: "R$ 24,99/mês", items: "Até 10 anúncios", features: ["Loja estilo Marketplace", "2 Stories por 24h", "Painel do vendedor completo", "Destaque normal na listagem", "Estatísticas básicas"] },
  { name: "VIP", price: "R$ 59,99/mês", items: "Até 25 anúncios", features: ["Selo Premium nos anúncios", "3 Stories por 24h", "Destaque no topo da listagem", "4 Layouts de loja", "Estatísticas avançadas", "Suporte prioritário", "Botão Modo Cinema na loja"], highlight: true },
  { name: "Premium", price: "R$ 114,99/mês", items: "Até 50 anúncios", features: ["Selo VIP exclusivo", "4 Stories por 24h", "Destaque no topo da listagem", "Estatísticas completas", "Suporte VIP dedicado", "Anúncios via Google Ads", "Instagram na loja", "Botão Modo Cinema na loja"] },
];

const companyPlans = [
  { name: "Essencial Empresa", price: "R$ 539,90/mês", items: "Anúncios ilimitados", features: ["Selo Empresa Verificada", "5 Stories por 24h", "Destaque na homepage", "Destaque no topo da listagem", "Estatísticas completas", "Campanha dedicada de Google Ads", "Gerente de conta dedicado", "Suporte VIP dedicado", "Instagram na loja", "Botão Modo Cinema na loja", "Até 6 corretores vinculados"] },
  { name: "Premium Empresa", price: "R$ 999,90/mês", items: "Anúncios ilimitados", features: ["Selo Empresa Verificada", "6 Stories por 24h", "Destaque na homepage", "Destaque no topo da listagem", "Estatísticas completas", "Campanha Google Ads ampliada", "Anúncios Dinâmicos Google Ads", "Gerente de conta dedicado", "Suporte VIP dedicado", "Instagram na loja", "Botão Modo Cinema na loja", "Até 15 corretores vinculados"], highlight: true },
  { name: "Black Empresa", price: "R$ 1.899,00/mês", items: "Anúncios ilimitados", features: ["Selo Empresa Verificada", "10 Stories por 24h", "Destaque na homepage", "Destaque no topo da listagem", "Estatísticas completas", "Campanha Google Ads ampliada", "Anúncios Dinâmicos Google ADS", "Gerente de conta dedicado", "Suporte VIP dedicado", "Instagram na loja", "Botão Modo Cinema na loja", "Até 30 corretores vinculados", "Prioridade total em destaque"] },
];
export default function CreateListing() {
  const { site_name } = useSiteSettings();
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-[55vh] sm:h-[65vh] md:h-[80vh] overflow-hidden">
        <img src={heroImg} alt={`Anuncie no ${site_name}`} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 pb-8 sm:pb-12 md:pb-24">
          <div className="container max-w-6xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-accent/20 text-accent text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-4 sm:mb-6">
                <Zap size={12} className="sm:w-3.5 sm:h-3.5" /> Plataforma #1 do ES
              </span>
              <h1 className="font-display font-black text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-foreground leading-[1.1] mb-3 sm:mb-4">
                Anuncie seus<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">imóveis</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-lg md:text-xl max-w-2xl mb-3 sm:mb-4">
                O maior marketplace de imóveis do Brasil. Alcance milhares de compradores e acelere suas vendas.
              </p>

              {/* 7 dias grátis badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-primary/15 border border-primary/30 mb-5 sm:mb-8">
                <Star size={14} className="text-primary sm:w-[18px] sm:h-[18px]" />
                <span className="text-primary font-bold text-xs sm:text-sm">7 Dias Grátis</span>
                <span className="text-muted-foreground text-[10px] sm:text-xs">em todos os planos pagos</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link to="/login?trial=7" className="inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-3 sm:py-4 rounded-xl bg-accent text-accent-foreground font-bold text-xs sm:text-sm hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">
                  Cadastrar e Testar 7 Dias Grátis <ArrowRight size={14} />
                </Link>
                <a href="#beneficios" className="inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-3 sm:py-4 rounded-xl bg-secondary text-foreground font-bold text-xs sm:text-sm hover:bg-secondary/80 transition-all border border-border">
                  Ver Benefícios
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <section className="py-8 sm:py-12 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
                <div className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-primary">{stat.value}</div>
                <div className="text-muted-foreground text-xs sm:text-sm mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="py-10 sm:py-16 md:py-24">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-foreground mb-3">
              Por que anunciar no <span className="text-accent">{site_name}</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Tudo que você precisa para vender mais imóveis em um só lugar.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {benefits.map((item, i) => (
              <motion.div key={item.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className={`rounded-2xl p-4 sm:p-6 border transition-all hover:shadow-xl ${
                  item.accent ? "bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20" : "bg-card border-border hover:border-primary/30"
                }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.accent ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"}`}>
                  <item.icon size={24} />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Store Preview - Netflix Style */}
      <section className="py-10 sm:py-16 md:py-24 bg-secondary/40 overflow-hidden">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-accent/15 text-accent text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 border border-accent/20">
                <Sparkles size={12} /> Exclusivo
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl md:text-5xl leading-tight mb-4 sm:mb-5 text-foreground">
                Sua Loja Estilo
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Netflix</span>
              </h2>
              <p className="text-muted-foreground text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8">
                Cada corretor ganha uma loja personalizada com visual moderno. Seus imóveis exibidos em carrosséis elegantes, stories e modo cinema.
              </p>
              <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {["Carrosséis com fotos em alta qualidade", "Stories interativos por 24h", "Modo Cinema imersivo", "Link exclusivo para compartilhar", "Estatísticas de visualizações"].map((b, i) => (
                  <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} className="text-accent" />
                    </div>
                    <span className="text-muted-foreground text-sm">{b}</span>
                  </motion.div>
                ))}
              </div>
              <Link to="/login?trial=7" className="group inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-3 sm:py-4 rounded-2xl bg-accent text-accent-foreground font-bold text-xs sm:text-sm hover:bg-accent/90 transition-all shadow-2xl shadow-accent/30 hover:scale-105 w-full sm:w-auto">
                <Sparkles size={14} /> Testar Grátis por 7 Dias <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1 }} className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 rounded-[2rem] blur-3xl opacity-50" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border border-border">
                <img src={lojaPreviewImg} alt="Loja estilo Netflix" loading="lazy" className="w-full h-auto" width={1280} height={800} />
              </div>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-2 left-2 sm:-bottom-4 sm:-left-4 md:bottom-4 md:left-4 bg-card/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-border shadow-xl max-w-[200px] sm:max-w-none">
                <div className="flex items-center gap-2 sm:gap-3">
                  <img src={avatarCorretorImg} alt="Corretor" className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl object-cover shadow-md" />
                  <div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Corretor verificado</div>
                    <div className="font-display font-bold text-xs sm:text-sm text-foreground">Sua loja pronta 24/7</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-10 sm:py-16 md:py-24 overflow-hidden">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1 }} className="relative order-2 lg:order-1">
              <div className="absolute -inset-6 bg-gradient-to-br from-accent/15 via-primary/10 to-accent/15 rounded-[2rem] blur-3xl opacity-50" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-accent/20 border border-border">
                <img src={painelPreviewImg} alt="Painel de estatísticas" loading="lazy" className="w-full h-auto" width={1280} height={800} />
              </div>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-2 right-2 sm:-bottom-4 sm:-right-4 md:bottom-4 md:right-4 bg-card/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-border shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <TrendingUp size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Visualizações hoje</div>
                    <div className="font-display font-black text-xl text-foreground">+578</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-primary/15 text-primary text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 border border-primary/20">
                <BarChart3 size={12} /> Painel Completo
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl md:text-5xl leading-tight mb-4 sm:mb-5 text-foreground">
                Acompanhe seus
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">resultados</span>
              </h2>
              <p className="text-muted-foreground text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8">
                Painel profissional com estatísticas em tempo real. Saiba quais anúncios performam melhor e otimize sua estratégia.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {[
                  { icon: Eye, label: "Visualizações", value: "Em tempo real" },
                  { icon: Smartphone, label: "Contatos", value: "Via WhatsApp" },
                  { icon: BarChart3, label: "Gráficos", value: "Detalhados" },
                  { icon: TrendingUp, label: "Performance", value: "Por anúncio" },
                ].map((stat, i) => (
                  <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                    className="bg-secondary/50 rounded-xl p-3 sm:p-4 border border-border">
                    <stat.icon size={18} className="text-primary mb-1.5 sm:mb-2" />
                    <div className="text-foreground text-xs sm:text-sm font-bold">{stat.label}</div>
                    <div className="text-muted-foreground text-[10px] sm:text-xs">{stat.value}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Plans Preview - Corretores */}
      <section className="py-10 sm:py-16 md:py-24 bg-secondary/30">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-foreground mb-3">Planos para Corretores</h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">Comece com 7 dias grátis e evolua conforme sua carteira cresce.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={plan.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className={`rounded-2xl p-5 sm:p-6 border text-center ${plan.highlight ? "bg-gradient-to-b from-primary/10 to-accent/10 border-primary/30 shadow-xl sm:scale-105" : "bg-card border-border"}`}>
                {plan.highlight && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold mb-4">
                    <Star size={12} /> Mais popular
                  </span>
                )}
                <h3 className="font-display font-bold text-lg sm:text-xl text-foreground">{plan.name}</h3>
                <div className="font-display font-black text-2xl sm:text-3xl text-primary my-2 sm:my-3">{plan.price}</div>
                <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">{plan.items}</p>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-left">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-foreground/80">
                      <CheckCircle2 size={12} className="text-accent shrink-0 sm:w-3.5 sm:h-3.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="block mt-4 sm:mt-5 w-full py-2.5 sm:py-3 rounded-xl bg-accent text-accent-foreground text-center font-bold text-xs sm:text-sm hover:bg-accent/90 transition-all">
                  Testar 7 Dias Grátis
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Preview - Imobiliárias */}
      <section className="py-10 sm:py-16 md:py-24">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-accent/20 text-accent text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-4">
              <Building size={12} /> Exclusivo para Imobiliárias
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-foreground mb-3">Planos para Imobiliárias</h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">Soluções completas para sua imobiliária crescer com tecnologia e marketing integrado.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {companyPlans.map((plan, i) => (
              <motion.div key={plan.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className={`rounded-2xl p-5 sm:p-6 border text-center ${plan.highlight ? "bg-gradient-to-b from-accent/10 to-primary/10 border-accent/30 shadow-xl sm:scale-105" : "bg-card border-border"}`}>
                {plan.highlight && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold mb-4">
                    <Star size={12} /> Mais completo
                  </span>
                )}
                <h3 className="font-display font-bold text-lg sm:text-xl text-foreground">{plan.name}</h3>
                <div className="font-display font-black text-2xl sm:text-3xl text-primary my-2 sm:my-3">{plan.price}</div>
                <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">{plan.items}</p>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-left">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-foreground/80">
                      <CheckCircle2 size={12} className="text-accent shrink-0 sm:w-3.5 sm:h-3.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="block mt-4 sm:mt-5 w-full py-2.5 sm:py-3 rounded-xl bg-accent text-accent-foreground text-center font-bold text-xs sm:text-sm hover:bg-accent/90 transition-all">
                  Testar 7 Dias Grátis
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-primary/20 via-card to-accent/20 rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-16 border border-border">
            <Award size={36} className="text-accent mx-auto mb-4 sm:mb-6 sm:w-12 sm:h-12" />
            <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-foreground mb-3 sm:mb-4">
              Pronto para vender <span className="text-accent">mais</span>?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8 max-w-lg mx-auto">
              Cadastre-se gratuitamente e teste por 7 dias grátis no {site_name}.
            </p>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 px-6 sm:px-10 py-3 sm:py-4 rounded-xl bg-accent text-accent-foreground font-bold text-xs sm:text-sm hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 w-full sm:w-auto">
              Cadastrar e Testar 7 Dias Grátis <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
