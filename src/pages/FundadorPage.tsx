import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Crown, Check, Sparkles, Zap, Shield, Trophy, Flame,
  ArrowRight, Loader2, Users, TrendingUp, Award, Diamond,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MarketplaceNavbar from "@/components/MarketplaceNavbar";
import ThemeParticles from "@/components/ThemeParticles";
import { getMarketplaceTheme } from "@/lib/marketplaceThemes";
import { getMarketplaceThemeCssVars } from "@/lib/marketplaceThemeCssVars";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useActivePlans } from "@/hooks/usePlans";

interface FounderLot {
  id: string;
  category: "individual" | "enterprise";
  lot_number: number;
  price: number;
  total_slots: number;
  used_slots: number;
  is_active: boolean;
}

const FOUNDER_BENEFITS = [
  "Pagamento único válido por 12 meses",
  "Selo exclusivo de Membro Fundador 🏆",
  "Acesso a TODAS as funções premium por 1 ano",
  "Bônus generoso em créditos de Inteligência Artificial",
  "Prioridade na exibição dos seus imóveis",
  "Suporte VIP prioritário",
  "Acesso antecipado a novas funções",
  "Preço de fundador travado por todo o período",
];

export default function FundadorPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plans, loading: plansLoading } = useActivePlans();

  const [founderLots, setFounderLots] = useState<FounderLot[]>([]);
  const [founderEnabled, setFounderEnabled] = useState<boolean>(true);
  const [loadingLots, setLoadingLots] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const theme = getMarketplaceTheme("luxury");
  const themeVars = getMarketplaceThemeCssVars(theme);

  const isImobiliaria =
    profile?.seller_category === "imobiliaria" ||
    profile?.seller_category === "construtora";

  useEffect(() => {
    (async () => {
      const [{ data: lots }, { data: settings }] = await Promise.all([
        (supabase as any)
          .from("founder_lots")
          .select("id, category, lot_number, price, total_slots, used_slots, is_active")
          .eq("is_active", true)
          .order("category")
          .order("lot_number"),
        (supabase as any)
          .from("founder_settings")
          .select("is_enabled")
          .eq("id", 1)
          .maybeSingle(),
      ]);
      if (lots) setFounderLots(lots as FounderLot[]);
      if (settings) setFounderEnabled(settings.is_enabled !== false);
      setLoadingLots(false);
    })();
  }, []);

  // Lote ativo por categoria
  const getActiveLot = (cat: "individual" | "enterprise") =>
    founderLots
      .filter((l) => l.category === cat && l.is_active && l.used_slots < l.total_slots)
      .sort((a, b) => a.lot_number - b.lot_number)[0];

  const individualLot = getActiveLot("individual");
  const enterpriseLot = getActiveLot("enterprise");

  // Próximos lotes (preview do aumento)
  const getNextLots = (cat: "individual" | "enterprise") =>
    founderLots
      .filter((l) => l.category === cat && (!getActiveLot(cat) || l.lot_number > getActiveLot(cat).lot_number))
      .sort((a, b) => a.lot_number - b.lot_number)
      .slice(0, 2);

  const vipPlan = plans.find((p) => p.tier === "vip");
  const blackPlan = plans.find((p) => p.tier === "prime_empresa");

  const handlePurchase = async (category: "individual" | "enterprise") => {
    if (!user || !profile) {
      toast({
        title: "Faça login para garantir sua vaga",
        description: "Você será redirecionado para criar sua conta.",
      });
      navigate("/auth?redirect=/fundador");
      return;
    }

    const lot = category === "individual" ? individualLot : enterpriseLot;
    const tier = category === "individual" ? "fundador_corretor" : "fundador_empresa";

    if (!lot) {
      toast({
        title: "Lote esgotado",
        description: "Aguarde a abertura do próximo lote.",
        variant: "destructive",
      });
      return;
    }

    setPurchasing(tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          tier,
          billing_period: "annual",
          founder_lot_id: lot.id,
        },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
      else throw new Error("URL de checkout não retornada");
    } catch (err: any) {
      toast({
        title: "Erro ao processar",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    }
    setPurchasing(null);
  };

  if (plansLoading || loadingLots) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!founderEnabled) {
    return (
      <div className="min-h-screen bg-background">
        <MarketplaceNavbar theme={theme} user={user} />
        <div className="max-w-2xl mx-auto px-4 py-32 text-center">
          <Crown className="w-16 h-16 text-primary mx-auto mb-6 opacity-50" />
          <h1 className="text-3xl font-bold mb-4">Campanha Fundador encerrada</h1>
          <p className="text-muted-foreground mb-8">
            Esta campanha não está mais disponível no momento.
          </p>
          <Button asChild size="lg">
            <Link to="/planos">Ver planos disponíveis</Link>
          </Button>
        </div>
      </div>
    );
  }

  const renderLotCard = (
    category: "individual" | "enterprise",
    lot: FounderLot | undefined,
    label: string,
    equivalentPlan: string,
    icon: typeof Crown,
  ) => {
    const Icon = icon;
    const tier = category === "individual" ? "fundador_corretor" : "fundador_empresa";
    const credits = category === "individual" ? 500 : 1750;
    const remaining = lot ? lot.total_slots - lot.used_slots : 0;
    const percentSold = lot ? (lot.used_slots / lot.total_slots) * 100 : 100;
    const nextLots = getNextLots(category);

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        style={{ boxShadow: `0 25px 60px ${theme.primary}20` }}
      >
        {/* Brilho de borda */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${theme.primary}10, transparent, ${theme.promoAccent || theme.primary}10)` }} />

        {/* Header */}
        <div className="relative p-8 border-b border-white/10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 text-white" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>
            <Crown size={14} /> OFERTA FUNDADOR
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{label}</h3>
              <p className="text-sm text-white/60">
                Equivalente por 1 ano ao <strong className="text-white/80">{equivalentPlan}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Preço + barra de vagas */}
        <div className="relative p-8 space-y-6">
          {lot ? (
            <>
              <div>
                <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                  <span className="text-sm text-white/50">Lote {lot.lot_number} ·</span>
                  <span className="text-5xl font-extrabold text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>
                    R$ {lot.price.toFixed(0)}
                  </span>
                  <span className="text-white/60">/ano</span>
                </div>
                <p className="text-xs text-white/50">
                  Pagamento único · Válido por 12 meses · Sem mensalidades
                </p>
              </div>

              {/* Barra de vagas */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold flex items-center gap-1.5 text-white/80">
                    <Flame className="w-4 h-4" style={{ color: theme.promoAccent || theme.primary }} />
                    Restam <strong style={{ color: theme.primary }}>{remaining}</strong> de {lot.total_slots} vagas
                  </span>
                  <span className="text-white/50">{percentSold.toFixed(0)}% vendido</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentSold}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full"
                    style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}
                  />
                </div>
              </div>

              {/* Créditos IA */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-white/10" style={{ background: `linear-gradient(to right, ${theme.primary}15, ${theme.promoAccent || theme.primary}10)` }}>
                <Sparkles className="w-5 h-5 shrink-0" style={{ color: theme.primary }} />
                <div className="text-sm text-white/80">
                  <strong style={{ color: theme.primary }}>
                    +{credits.toLocaleString("pt-BR")} créditos de IA
                  </strong>{" "}
                  <span className="text-white/60">como bônus de boas-vindas</span>
                </div>
              </div>

              {/* Benefícios resumidos */}
              <ul className="space-y-2">
                {FOUNDER_BENEFITS.slice(0, 6).map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/75">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: theme.primary }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                onClick={() => handlePurchase(category)}
                disabled={purchasing === tier}
                size="lg"
                className="w-full text-white font-bold text-lg h-14 shadow-lg"
                style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})`, boxShadow: `0 10px 25px ${theme.primary}40` }}
              >
                {purchasing === tier ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    Garantir minha vaga Fundador
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {/* Próximos lotes */}
              {nextLots.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-white/60 mb-2 font-semibold">
                    ⚠️ Quando esgotar, o preço sobe:
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {nextLots.map((l) => (
                      <div
                        key={l.id}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70"
                      >
                        Lote {l.lot_number}:{" "}
                        <strong style={{ color: theme.primary }}>R$ {l.price.toFixed(0)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="font-semibold mb-1 text-white">Todos os lotes esgotados</p>
              <p className="text-sm text-white/50">
                Aguarde a abertura de novos lotes.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background" style={themeVars}>
      <Helmet>
        <title>Seja Fundador Capimobi · Pagamento único válido por 1 ano</title>
        <meta
          name="description"
          content="Garanta 12 meses de acesso premium à plataforma Capimobi com pagamento único. Vagas limitadas — quando o lote esgota, o preço sobe automaticamente."
        />
      </Helmet>

      <MarketplaceNavbar theme={theme} user={user} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/10 border-b border-primary/20">
        <ThemeParticles color={theme.primary} glowColor={theme.promoAccent} count={40} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_70%)]" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 lg:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/40 backdrop-blur-sm mb-6"
          >
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary uppercase tracking-wider">
              Edição Fundador · Vagas Limitadas
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight"
          >
            Pague <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">uma vez</span>.
            <br />
            Use por <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">12 meses</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10"
          >
            Seja um <strong className="text-foreground">Membro Fundador Capimobi</strong> e tenha 1 ano completo de acesso a todas as funções premium da plataforma — pagamento único, sem mensalidades, sem surpresas.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 md:gap-12 mb-10"
          >
            {[
              { icon: Users, label: "Vagas por lote", value: "500" },
              { icon: TrendingUp, label: "Preço sobe a cada lote", value: "+R$30" },
              { icon: Shield, label: "Validade do acesso", value: "12 meses" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <s.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              size="lg"
              onClick={() => document.getElementById("lotes")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold h-14 px-8 text-base shadow-xl shadow-primary/30"
            >
              <Crown className="w-5 h-5 mr-2" />
              Ver lote atual
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById("comparativo")?.scrollIntoView({ behavior: "smooth" })}
              className="h-14 px-8"
            >
              Comparar com mensalidade
            </Button>
          </motion.div>
        </div>
      </section>

      {/* LOTES */}
      <section id="lotes" className="py-16 lg:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Escolha seu lote Fundador
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Cada lote tem vagas limitadas. Quando esgota, o próximo abre automaticamente
              com preço maior. Quem entra antes paga menos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {renderLotCard("individual", individualLot, "Corretor Fundador", "Plano VIP", Award)}
            {renderLotCard("enterprise", enterpriseLot, "Imobiliária Fundadora", "Plano Black Empresa", Diamond)}
          </div>
        </div>
      </section>

      {/* COMPARATIVO */}
      <section id="comparativo" className="py-16 lg:py-24 bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
              <TrendingUp className="w-3.5 h-3.5" /> ECONOMIA REAL
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Quanto você economiza sendo Fundador?
            </h2>
            <p className="text-muted-foreground text-lg">
              Comparativo entre o pagamento único Fundador e a mensalidade do plano equivalente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Corretor */}
            {individualLot && vipPlan && (
              <div className="bg-card border-2 border-border rounded-2xl p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">Corretor</h3>
                    <p className="text-xs text-muted-foreground">VIP vs Fundador</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Plano VIP mensal</span>
                    <span className="font-bold">R$ {vipPlan.price.toFixed(0)}/mês</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Custo em 12 meses</span>
                    <span className="font-bold text-red-500">R$ {(vipPlan.price * 12).toFixed(0)}</span>
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between items-baseline">
                    <span className="text-sm font-semibold">Fundador (12 meses)</span>
                    <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      R$ {individualLot.price.toFixed(0)}
                    </span>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                    <div className="text-xs text-green-700 dark:text-green-400 font-semibold mb-1">
                      ECONOMIA EM 12 MESES
                    </div>
                    <div className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                      R$ {(vipPlan.price * 12 - individualLot.price).toLocaleString("pt-BR")}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ({Math.round(((vipPlan.price * 12 - individualLot.price) / (vipPlan.price * 12)) * 100)}% mais barato)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empresa */}
            {enterpriseLot && blackPlan && (
              <div className="bg-card border-2 border-primary/50 rounded-2xl p-6 lg:p-8 relative">
                <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold">
                  MAIOR ECONOMIA
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <Diamond className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">Imobiliária</h3>
                    <p className="text-xs text-muted-foreground">Black vs Fundador</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Plano Black mensal</span>
                    <span className="font-bold">R$ {blackPlan.price.toFixed(0)}/mês</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Custo em 12 meses</span>
                    <span className="font-bold text-red-500">R$ {(blackPlan.price * 12).toFixed(0)}</span>
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between items-baseline">
                    <span className="text-sm font-semibold">Fundador (12 meses)</span>
                    <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      R$ {enterpriseLot.price.toFixed(0)}
                    </span>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                    <div className="text-xs text-green-700 dark:text-green-400 font-semibold mb-1">
                      ECONOMIA EM 12 MESES
                    </div>
                    <div className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                      R$ {(blackPlan.price * 12 - enterpriseLot.price).toLocaleString("pt-BR")}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ({Math.round(((blackPlan.price * 12 - enterpriseLot.price) / (blackPlan.price * 12)) * 100)}% mais barato)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TODOS OS BENEFÍCIOS */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Tudo que está incluído
            </h2>
            <p className="text-muted-foreground text-lg">
              1 ano completo de acesso premium com benefícios exclusivos só para Fundadores.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {FOUNDER_BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-lg transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold pt-1.5">{b}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/20 via-background to-accent/10 border-t border-primary/20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Crown className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Sua vaga não espera você decidir.
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            A cada novo membro Fundador, restam menos vagas no lote atual. Quando esgota,
            o preço sobe automaticamente. Garanta o seu agora.
          </p>
          <Button
            size="lg"
            onClick={() => handlePurchase(isImobiliaria ? "enterprise" : "individual")}
            disabled={!!purchasing}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold h-16 px-10 text-lg shadow-xl shadow-primary/40"
          >
            {purchasing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              <>
                <Crown className="w-6 h-6 mr-2" />
                Quero ser Fundador
                <ArrowRight className="w-6 h-6 ml-2" />
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-6">
            Pagamento seguro via Stripe · Acesso liberado imediatamente após confirmação
          </p>
        </div>
      </section>
    </div>
  );
}
