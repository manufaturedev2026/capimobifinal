import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Home, Users, Search, Shield, Zap, ArrowRight, Building2, Plus, Star, TrendingUp, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-secondary/50">
      <Helmet>
        <title>ES Corretores | Marketplace de Captação de Imóveis</title>
        <meta name="description" content="Plataforma de captação de imóveis. Proprietários anunciam grátis, corretores captam e vendem." />
        <link rel="canonical" href="https://redeimoveisgb.lovable.app/" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(var(--navy))] via-primary to-[hsl(var(--navy))] py-16 md:py-24 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.05),transparent_40%)]" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold mb-6 backdrop-blur-sm border border-white/10">
                <Star size={14} className="text-amber-400" /> Marketplace de Captação
              </span>
              <h1 className="font-display font-bold text-3xl md:text-5xl text-white leading-tight">
                Conectamos <span className="text-accent">proprietários</span> a <span className="text-accent">corretores</span>
              </h1>
              <p className="text-white/70 text-base md:text-lg mt-4 leading-relaxed">
                Proprietários cadastram seus imóveis gratuitamente. Corretores qualificados captam e vendem com agilidade.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Button asChild size="lg" className="gap-2 h-12 px-8 text-base font-bold rounded-xl">
                  <Link to="/anunciar-proprietario">
                    <Plus size={18} /> Anunciar Grátis
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2 h-12 px-8 text-base font-bold rounded-xl border-white/20 text-white hover:bg-white/10">
                  <Link to="/captacao">
                    <Search size={18} /> Área do Corretor
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden md:block"
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Home, label: "Imóveis cadastrados", value: "500+", color: "from-primary to-sky-400" },
                  { icon: Users, label: "Corretores ativos", value: "120+", color: "from-accent to-pink-400" },
                  { icon: TrendingUp, label: "Vendas este mês", value: "35+", color: "from-emerald-500 to-teal-400" },
                  { icon: Key, label: "Captações realizadas", value: "200+", color: "from-amber-500 to-orange-400" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                      <stat.icon size={20} className="text-white" />
                    </div>
                    <p className="font-display font-bold text-2xl text-white">{stat.value}</p>
                    <p className="text-white/50 text-xs mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground text-center mb-10">
            Como funciona
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Owner flow */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Home size={24} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-2">Para Proprietários</h3>
              <p className="text-muted-foreground text-sm mb-6">Cadastre seu imóvel gratuitamente e receba propostas de corretores.</p>
              <ol className="space-y-4">
                {[
                  "Cadastre seu imóvel com fotos e descrição",
                  "Seu imóvel fica visível para corretores qualificados",
                  "Corretores interessados captam e entram em contato",
                  "Acompanhe o status da venda pelo painel",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
              <Button asChild className="w-full mt-6 gap-2">
                <Link to="/anunciar-proprietario">
                  <Plus size={16} /> Anunciar Grátis
                </Link>
              </Button>
            </div>

            {/* Broker flow */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <Users size={24} className="text-accent" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-2">Para Corretores</h3>
              <p className="text-muted-foreground text-sm mb-6">Capte imóveis e amplie seu portfólio com planos acessíveis.</p>
              <ol className="space-y-4">
                {[
                  "Cadastre-se e escolha seu plano",
                  "Navegue pelos imóveis disponíveis com filtros",
                  "Clique em \"Quero vender este imóvel\" para captar",
                  "Receba o contato do proprietário e feche o negócio",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
              <Button asChild variant="outline" className="w-full mt-6 gap-2">
                <Link to="/captacao">
                  <Search size={16} /> Ver Imóveis Disponíveis
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Plans preview */}
      <section className="px-4 py-12 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">
            Planos para Corretores
          </h2>
          <p className="text-muted-foreground mb-8">Escolha o plano ideal para o seu volume de captação</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { name: "Básico", price: "Grátis", captures: "1 captação/mês", highlight: false },
              { name: "Start", price: "R$ 24,99/mês", captures: "20 captações/mês", highlight: true },
              { name: "VIP", price: "R$ 59,99/mês", captures: "50 captações/mês", highlight: false },
            ].map((plan) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl p-6 border ${plan.highlight ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-card"}`}
              >
                {plan.highlight && (
                  <Badge className="bg-primary text-primary-foreground mb-3">Mais Popular</Badge>
                )}
                <h3 className="font-display font-bold text-lg text-foreground">{plan.name}</h3>
                <p className="font-display font-bold text-2xl text-foreground mt-2">{plan.price}</p>
                <p className="text-sm text-muted-foreground mt-2">{plan.captures}</p>
                <p className="text-sm text-muted-foreground">+ Loja própria</p>
              </motion.div>
            ))}
          </div>

          <Button asChild variant="outline" className="mt-8 gap-2">
            <Link to="/pacotes">Ver todos os planos <ArrowRight size={16} /></Link>
          </Button>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Shield, title: "Seguro e Confiável", desc: "Dados protegidos" },
            { icon: Zap, title: "Captação Rápida", desc: "Contato imediato" },
            { icon: Building2, title: "Todos os Tipos", desc: "Casas, aptos, terrenos" },
            { icon: Star, title: "Corretores Premium", desc: "Profissionais verificados" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-display font-semibold text-sm text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-10">
        <div className="max-w-6xl mx-auto gradient-hero rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_50%)]" />
          <div className="relative z-10 text-center md:text-left">
            <h2 className="font-display font-bold text-xl md:text-3xl text-white">Tem um imóvel para vender?</h2>
            <p className="text-white/80 text-sm md:text-base mt-1">Cadastre gratuitamente e receba propostas de corretores</p>
          </div>
          <Button asChild size="lg" variant="secondary" className="relative z-10 gap-2 font-bold">
            <Link to="/anunciar-proprietario">
              <Plus size={18} /> Anunciar Grátis
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
