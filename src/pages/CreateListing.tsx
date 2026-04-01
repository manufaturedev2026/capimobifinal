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
} from "lucide-react";
import heroImg from "@/assets/hero-anunciar.jpg";

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
    description: "Seus imóveis são exibidos para milhares de compradores ativos no Espírito Santo todos os dias.",
  },
  {
    icon: TrendingUp,
    title: "Mais Vendas",
    description: "Corretores que anunciam no ES Corretores vendem até 3x mais rápido que em plataformas tradicionais.",
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
  { value: "78+", label: "Cidades no ES" },
];

const plans = [
  { name: "Start", price: "R$ 24,99/mês", items: "Até 10 anúncios", features: ["Loja estilo Netflix", "2 Stories por 24h", "Painel do vendedor completo", "Destaque normal na listagem", "Estatísticas básicas"] },
  { name: "VIP", price: "R$ 59,99/mês", items: "Até 25 anúncios", features: ["Selo Premium nos anúncios", "3 Stories por 24h", "Destaque no topo da listagem", "Loja estilo Netflix", "Estatísticas avançadas", "Suporte prioritário", "Botão Modo Cinema na loja"], highlight: true },
  { name: "Premium", price: "R$ 114,99/mês", items: "Até 50 anúncios", features: ["Selo VIP exclusivo", "4 Stories por 24h", "Destaque no topo da listagem", "Estatísticas completas", "Suporte VIP dedicado", "Anúncios via Google Ads", "Instagram na loja", "Botão Modo Cinema na loja"] },
];

const companyPlans = [
  { name: "Essencial Empresa", price: "R$ 539,90/mês", items: "Anúncios ilimitados", features: ["Selo Empresa Verificada", "5 Stories por 24h", "Destaque na homepage", "Destaque no topo da listagem", "Estatísticas completas", "Campanha dedicada de Google Ads", "Gerente de conta dedicado", "Suporte VIP dedicado", "Instagram na loja", "Botão Modo Cinema na loja", "Até 6 corretores vinculados"] },
  { name: "Premium Empresa", price: "R$ 999,90/mês", items: "Anúncios ilimitados", features: ["Selo Empresa Verificada", "6 Stories por 24h", "Destaque na homepage", "Destaque no topo da listagem", "Estatísticas completas", "Campanha Google Ads ampliada", "Anúncios Dinâmicos Google Ads", "Gerente de conta dedicado", "Suporte VIP dedicado", "Instagram na loja", "Botão Modo Cinema na loja", "Até 15 corretores vinculados"], highlight: true },
  { name: "Black Empresa", price: "R$ 1.899,00/mês", items: "Anúncios ilimitados", features: ["Selo Empresa Verificada", "10 Stories por 24h", "Destaque na homepage", "Destaque no topo da listagem", "Estatísticas completas", "Campanha Google Ads ampliada", "Anúncios Dinâmicos Google ADS", "Gerente de conta dedicado", "Suporte VIP dedicado", "Instagram na loja", "Botão Modo Cinema na loja", "Até 30 corretores vinculados", "Prioridade total em destaque"] },
];
export default function CreateListing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-[70vh] md:h-[80vh] overflow-hidden">
        <img src={heroImg} alt="Anuncie no ES Corretores" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 pb-16 md:pb-24">
          <div className="container max-w-6xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-6">
                <Zap size={14} /> Plataforma #1 do ES
              </span>
              <h1 className="font-display font-black text-4xl md:text-6xl lg:text-7xl text-foreground leading-[1.1] mb-4">
                Anuncie seus<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">imóveis</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-4">
                O maior marketplace de imóveis do Espírito Santo. Alcance milhares de compradores e acelere suas vendas.
              </p>

              {/* 7 dias grátis badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 mb-8">
                <Star size={18} className="text-green-400" />
                <span className="text-green-400 font-bold text-sm">7 Dias Grátis</span>
                <span className="text-muted-foreground text-xs">em todos os planos pagos</span>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link to="/entrar" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">
                  Cadastrar e Testar 7 Dias Grátis <ArrowRight size={16} />
                </Link>
                <a href="#beneficios" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80 transition-all border border-border">
                  Ver Benefícios
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
                <div className="font-display font-black text-3xl md:text-4xl text-primary">{stat.value}</div>
                <div className="text-muted-foreground text-sm mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="py-16 md:py-24">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-3">
              Por que anunciar no <span className="text-accent">ES Corretores</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Tudo que você precisa para vender mais imóveis em um só lugar.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((item, i) => (
              <motion.div key={item.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className={`rounded-2xl p-6 border transition-all hover:shadow-xl ${
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

      {/* Plans Preview - Corretores */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-3">Planos para Corretores</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Comece com 7 dias grátis e evolua conforme sua carteira cresce.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={plan.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className={`rounded-2xl p-6 border text-center ${plan.highlight ? "bg-gradient-to-b from-primary/10 to-accent/10 border-primary/30 shadow-xl scale-105" : "bg-card border-border"}`}>
                {plan.highlight && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold mb-4">
                    <Star size={12} /> Mais popular
                  </span>
                )}
                <h3 className="font-display font-bold text-xl text-foreground">{plan.name}</h3>
                <div className="font-display font-black text-3xl text-primary my-3">{plan.price}</div>
                <p className="text-muted-foreground text-sm mb-4">{plan.items}</p>
                <ul className="space-y-2 text-sm text-left">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-foreground/80">
                      <CheckCircle2 size={14} className="text-accent shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/entrar" className="block mt-5 w-full py-3 rounded-xl bg-accent text-accent-foreground text-center font-bold text-sm hover:bg-accent/90 transition-all">
                  Testar 7 Dias Grátis
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Preview - Imobiliárias */}
      <section className="py-16 md:py-24">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-4">
              <Building size={14} /> Exclusivo para Imobiliárias
            </span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-3">Planos para Imobiliárias</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Soluções completas para sua imobiliária crescer com tecnologia e marketing integrado.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {companyPlans.map((plan, i) => (
              <motion.div key={plan.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className={`rounded-2xl p-6 border text-center ${plan.highlight ? "bg-gradient-to-b from-accent/10 to-primary/10 border-accent/30 shadow-xl scale-105" : "bg-card border-border"}`}>
                {plan.highlight && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold mb-4">
                    <Star size={12} /> Mais completo
                  </span>
                )}
                <h3 className="font-display font-bold text-xl text-foreground">{plan.name}</h3>
                <div className="font-display font-black text-3xl text-primary my-3">{plan.price}</div>
                <p className="text-muted-foreground text-sm mb-4">{plan.items}</p>
                <ul className="space-y-2 text-sm text-left">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-foreground/80">
                      <CheckCircle2 size={14} className="text-accent shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/entrar" className="block mt-5 w-full py-3 rounded-xl bg-accent text-accent-foreground text-center font-bold text-sm hover:bg-accent/90 transition-all">
                  Testar 7 Dias Grátis
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-primary/20 via-card to-accent/20 rounded-3xl p-10 md:p-16 border border-border">
            <Award size={48} className="text-accent mx-auto mb-6" />
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Pronto para vender <span className="text-accent">mais</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Cadastre-se gratuitamente e comece a anunciar seus imóveis no maior marketplace do Espírito Santo.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-accent text-accent-foreground font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">
              Criar Conta Grátis <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
