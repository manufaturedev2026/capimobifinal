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
    <div className="min-h-screen text-white overflow-x-hidden relative" style={{ ...themeVars, background: theme.darkBase }}>
      <Helmet>
        <title>Seja Fundador Capimobi · Pagamento único válido por 1 ano</title>
        <meta
          name="description"
          content="Garanta 12 meses de acesso premium à plataforma Capimobi com pagamento único. Vagas limitadas — quando o lote esgota, o preço sobe automaticamente."
        />
      </Helmet>

      {/* ✨ Partículas globais épicas (cobrem a página inteira) */}
      <ThemeParticles color={theme.primary} glowColor={theme.promoAccent} count={90} />

      {/* Keyframes épicos locais */}
      <style>{`
        @keyframes epicPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.15); }
        }
        @keyframes epicFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes epicSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes epicGlowRing {
          0%, 100% { box-shadow: 0 0 40px var(--epic-glow), 0 0 80px var(--epic-glow), inset 0 0 20px var(--epic-glow); }
          50% { box-shadow: 0 0 80px var(--epic-glow), 0 0 160px var(--epic-glow), inset 0 0 40px var(--epic-glow); }
        }
        @keyframes epicShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes epicRayRotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .epic-shimmer-text {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          animation: epicShimmer 3s linear infinite;
        }
      `}</style>

      <MarketplaceNavbar theme={theme} user={user} />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10 min-h-[90vh] flex items-center">
        {/* Raios de luz rotacionando */}
        <div
          className="absolute top-1/2 left-1/2 w-[200%] h-[200%] pointer-events-none opacity-20"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, ${theme.primary}40 20deg, transparent 40deg, transparent 180deg, ${theme.promoAccent || theme.primary}30 200deg, transparent 220deg)`,
            animation: "epicRayRotate 30s linear infinite",
          }}
        />

        {/* Grid radial */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Orbs flutuantes */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.primary}25, transparent 60%, ${theme.promoAccent || theme.primary}20)` }} />
        <div
          className="absolute top-20 left-1/4 w-64 md:w-96 h-64 md:h-96 rounded-full blur-[120px]"
          style={{ background: `${theme.primary}40`, animation: "epicPulse 5s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-52 md:w-80 h-52 md:h-80 rounded-full blur-[100px]"
          style={{ background: `${theme.promoAccent || theme.primary}30`, animation: "epicPulse 7s ease-in-out infinite", animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 right-10 w-32 md:w-48 h-32 md:h-48 rounded-full blur-[80px]"
          style={{ background: `${theme.primary}30`, animation: "epicFloat 8s ease-in-out infinite" }}
        />

        {/* Coroas decorativas flutuantes */}
        <div className="absolute top-32 left-10 opacity-10 hidden md:block" style={{ animation: "epicFloat 6s ease-in-out infinite" }}>
          <Crown className="w-16 h-16" style={{ color: theme.primary }} />
        </div>
        <div className="absolute bottom-40 right-10 opacity-10 hidden md:block" style={{ animation: "epicFloat 9s ease-in-out infinite", animationDelay: "2s" }}>
          <Diamond className="w-14 h-14" style={{ color: theme.promoAccent || theme.primary }} />
        </div>
        <div className="absolute top-1/3 right-1/4 opacity-10 hidden md:block" style={{ animation: "epicFloat 7s ease-in-out infinite", animationDelay: "1s" }}>
          <Sparkles className="w-10 h-10" style={{ color: theme.primary }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 lg:py-28 text-center w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm mb-6 relative"
            style={{
              background: `${theme.primary}25`,
              border: `1px solid ${theme.primary}80`,
              ["--epic-glow" as any]: `${theme.primary}60`,
              animation: "epicGlowRing 3s ease-in-out infinite",
            }}
          >
            <Crown className="w-4 h-4" style={{ color: theme.primary, animation: "epicPulse 2s ease-in-out infinite" }} />
            <span className="text-sm font-bold uppercase tracking-wider" style={{ color: theme.primary }}>
              Edição Fundador · Vagas Limitadas
            </span>
            <Sparkles className="w-4 h-4" style={{ color: theme.promoAccent || theme.primary, animation: "epicPulse 2s ease-in-out infinite", animationDelay: "0.5s" }} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.1] text-white"
          >
            Pague <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>uma vez</span>.
            <br />
            Use por <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>12 meses</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/65 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Seja um <strong className="text-white">Membro Fundador Capimobi</strong> e tenha 1 ano completo de acesso a todas as funções premium da plataforma — pagamento único, sem mensalidades, sem surpresas.
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
                <s.icon className="w-6 h-6 mx-auto mb-2" style={{ color: theme.primary }} />
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/50 uppercase tracking-wide">
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
              className="text-white font-bold h-14 px-8 text-base shadow-xl"
              style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})`, boxShadow: `0 15px 35px ${theme.primary}50` }}
            >
              <Crown className="w-5 h-5 mr-2" />
              Ver lote atual
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById("comparativo")?.scrollIntoView({ behavior: "smooth" })}
              className="h-14 px-8 rounded-xl border-white/20 text-white/80 hover:text-white hover:bg-white/5 bg-transparent"
            >
              Comparar com mensalidade
            </Button>
          </motion.div>
        </div>
      </section>

      {/* LOTES */}
      <section id="lotes" className="py-16 lg:py-24 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-white">
              Escolha seu lote Fundador
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
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
      <section id="comparativo" className="py-16 lg:py-24 border-y border-white/10 relative" style={{ background: `linear-gradient(180deg, ${theme.primary}08, transparent)` }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: `${theme.primary}20`, color: theme.primary }}>
              <TrendingUp className="w-3.5 h-3.5" /> ECONOMIA REAL
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-white">
              Quanto você economiza sendo Fundador?
            </h2>
            <p className="text-white/60 text-lg">
              Comparativo entre o pagamento único Fundador e a mensalidade do plano equivalente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Corretor */}
            {individualLot && vipPlan && (
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-8 h-8" style={{ color: theme.primary }} />
                  <div>
                    <h3 className="text-xl font-bold text-white">Corretor</h3>
                    <p className="text-xs text-white/50">VIP vs Fundador</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-white/60">Plano VIP mensal</span>
                    <span className="font-bold text-white">R$ {vipPlan.price.toFixed(0)}/mês</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-white/60">Custo em 12 meses</span>
                    <span className="font-bold text-red-400">R$ {(vipPlan.price * 12).toFixed(0)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-4 flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-white/80">Fundador (12 meses)</span>
                    <span className="text-2xl font-extrabold text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>
                      R$ {individualLot.price.toFixed(0)}
                    </span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                    <div className="text-xs text-emerald-300 font-semibold mb-1">
                      ECONOMIA EM 12 MESES
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-400">
                      R$ {(vipPlan.price * 12 - individualLot.price).toLocaleString("pt-BR")}
                    </div>
                    <div className="text-xs text-white/50 mt-1">
                      ({Math.round(((vipPlan.price * 12 - individualLot.price) / (vipPlan.price * 12)) * 100)}% mais barato)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empresa */}
            {enterpriseLot && blackPlan && (
              <div className="bg-black/40 backdrop-blur-xl border rounded-2xl p-6 lg:p-8 relative" style={{ borderColor: `${theme.primary}50` }}>
                <div className="absolute -top-3 left-6 px-3 py-1 rounded-full text-white text-xs font-bold" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>
                  MAIOR ECONOMIA
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <Diamond className="w-8 h-8" style={{ color: theme.primary }} />
                  <div>
                    <h3 className="text-xl font-bold text-white">Imobiliária</h3>
                    <p className="text-xs text-white/50">Black vs Fundador</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-white/60">Plano Black mensal</span>
                    <span className="font-bold text-white">R$ {blackPlan.price.toFixed(0)}/mês</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-white/60">Custo em 12 meses</span>
                    <span className="font-bold text-red-400">R$ {(blackPlan.price * 12).toFixed(0)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-4 flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-white/80">Fundador (12 meses)</span>
                    <span className="text-2xl font-extrabold text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>
                      R$ {enterpriseLot.price.toFixed(0)}
                    </span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                    <div className="text-xs text-emerald-300 font-semibold mb-1">
                      ECONOMIA EM 12 MESES
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-400">
                      R$ {(blackPlan.price * 12 - enterpriseLot.price).toLocaleString("pt-BR")}
                    </div>
                    <div className="text-xs text-white/50 mt-1">
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
      <section className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-white">
              Tudo que está incluído
            </h2>
            <p className="text-white/60 text-lg">
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
                className="flex items-start gap-3 p-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:shadow-lg transition-all"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${theme.primary}25, ${theme.promoAccent || theme.primary}20)` }}>
                  <Check className="w-5 h-5" style={{ color: theme.primary }} />
                </div>
                <span className="font-semibold pt-1.5 text-white/90">{b}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 lg:py-24 border-t border-white/10 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.primary}25, transparent 60%, ${theme.promoAccent || theme.primary}20)` }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[120px]" style={{ background: `${theme.primary}25` }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <Crown className="w-16 h-16 mx-auto mb-6" style={{ color: theme.primary }} />
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-white">
            Sua vaga não espera você decidir.
          </h2>
          <p className="text-lg text-white/65 mb-8">
            A cada novo membro Fundador, restam menos vagas no lote atual. Quando esgota,
            o preço sobe automaticamente. Garanta o seu agora.
          </p>
          <Button
            size="lg"
            onClick={() => handlePurchase(isImobiliaria ? "enterprise" : "individual")}
            disabled={!!purchasing}
            className="text-white font-bold h-16 px-10 text-lg shadow-xl"
            style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})`, boxShadow: `0 20px 50px ${theme.primary}50` }}
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
          <p className="text-xs text-white/50 mt-6">
            Pagamento seguro via Stripe · Acesso liberado imediatamente após confirmação
          </p>
        </div>
      </section>
    </div>
  );
}
