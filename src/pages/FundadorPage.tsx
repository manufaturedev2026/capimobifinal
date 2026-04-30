import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Crown, Check, Sparkles, Shield, Trophy, Flame,
  ArrowRight, Loader2, Users, TrendingUp, Award, Diamond, Building2, Clock, Lock,
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
import founderBadge from "@/assets/founder-badge.png";

interface FounderLot {
  id: string;
  category: "corretor" | "empresa" | "construtora";
  lot_number: number;
  price: number;
  monthly_price: number | null;
  total_slots: number;
  used_slots: number;
  is_active: boolean;
  inherited_tier: string;
  ia_credits: number;
  ia_credits_monthly: number;
}

const TIER_LABEL: Record<string, string> = {
  start: "Plano Start",
  premium: "Plano Premium",
  vip: "Plano VIP",
  prime: "Plano Prime",
  essencial_empresa: "Plano Essencial Empresa",
  premium_empresa: "Plano Premium Empresa",
  prime_empresa: "Plano Prime Empresa (Black)",
  imob_elite: "Plano Imob Elite",
  const_pro: "Plano Construtora Pro",
  const_master: "Plano Construtora Master",
};

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

// Contador regressivo: 48h fixas (campanha de urgência)
function useCountdown(hoursAhead = 48) {
  const target = useMemo(() => {
    const stored = localStorage.getItem("founder_deadline");
    if (stored) return parseInt(stored, 10);
    const t = Date.now() + hoursAhead * 3600 * 1000;
    localStorage.setItem("founder_deadline", String(t));
    return t;
  }, [hoursAhead]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s, expired: diff === 0 };
}

export default function FundadorPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plans, loading: plansLoading } = useActivePlans();
  const countdown = useCountdown(48);

  const [founderLots, setFounderLots] = useState<FounderLot[]>([]);
  const [founderEnabled, setFounderEnabled] = useState<boolean>(true);
  const [loadingLots, setLoadingLots] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [billingByCat, setBillingByCat] = useState<Record<string, "annual" | "monthly">>({
    corretor: "monthly",
    empresa: "monthly",
    construtora: "monthly",
  });

  const [themeId, setThemeId] = useState(() => localStorage.getItem("marketplace_theme") || "azul");
  useEffect(() => {
    supabase.from("platform_settings").select("value").eq("key", "homepage_theme").maybeSingle().then(({ data }) => {
      if (data?.value) {
        setThemeId(data.value);
        localStorage.setItem("marketplace_theme", data.value);
      }
    });
  }, []);
  const theme = getMarketplaceTheme(themeId);
  const themeVars = getMarketplaceThemeCssVars(theme);

  const isImobiliaria = profile?.seller_category === "imobiliaria";

  useEffect(() => {
    (async () => {
      const [{ data: lots }, { data: settings }] = await Promise.all([
        (supabase as any)
          .from("founder_lots")
          .select("id, category, lot_number, price, monthly_price, total_slots, used_slots, is_active, inherited_tier, ia_credits, ia_credits_monthly")
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

  const getActiveLot = (cat: "corretor" | "empresa" | "construtora") =>
    founderLots
      .filter((l) => l.category === cat && l.is_active && l.used_slots < l.total_slots)
      .sort((a, b) => a.lot_number - b.lot_number)[0];

  const individualLot = getActiveLot("corretor");
  const enterpriseLot = getActiveLot("empresa");
  const construtoraLot = getActiveLot("construtora");

  const getNextLots = (cat: "corretor" | "empresa" | "construtora") =>
    founderLots
      .filter((l) => l.category === cat && (!getActiveLot(cat) || l.lot_number > getActiveLot(cat).lot_number))
      .sort((a, b) => a.lot_number - b.lot_number)
      .slice(0, 1);

  const vipPlan = plans.find((p) => p.tier === "prime");
  const blackPlan = plans.find((p) => p.tier === "imob_elite");

  const handlePurchase = async (category: "corretor" | "empresa" | "construtora") => {
    if (!user || !profile) {
      toast({
        title: "Faça login para garantir sua vaga",
        description: "Você será redirecionado para criar sua conta.",
      });
      navigate("/auth?redirect=/fundador");
      return;
    }

    const lot =
      category === "corretor" ? individualLot :
      category === "empresa" ? enterpriseLot :
      construtoraLot;
    const tier =
      category === "corretor" ? "fundador_corretor" :
      category === "empresa" ? "fundador_empresa" :
      "fundador_construtora";

    if (!lot) {
      toast({ title: "Lote esgotado", description: "Aguarde a abertura do próximo lote.", variant: "destructive" });
      return;
    }

    const billing = billingByCat[category] || "monthly";
    if (billing === "monthly" && (!lot.monthly_price || Number(lot.monthly_price) <= 0)) {
      toast({ title: "Mensalidade Fundador indisponível", description: "Este lote não tem preço mensal cadastrado.", variant: "destructive" });
      return;
    }

    setPurchasing(tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { tier, billing_period: billing, founder_lot_id: lot.id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
      else throw new Error("URL de checkout não retornada");
    } catch (err: any) {
      toast({ title: "Erro ao processar", description: err.message || "Tente novamente.", variant: "destructive" });
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
          <p className="text-muted-foreground mb-8">Esta campanha não está mais disponível no momento.</p>
          <Button asChild size="lg"><Link to="/planos">Ver planos disponíveis</Link></Button>
        </div>
      </div>
    );
  }

  const renderLotCard = (
    category: "corretor" | "empresa" | "construtora",
    lot: FounderLot | undefined,
    label: string,
    fallbackPlan: string,
    icon: typeof Crown,
    highlight = false,
  ) => {
    const Icon = icon;
    const tier =
      category === "corretor" ? "fundador_corretor" :
      category === "empresa" ? "fundador_empresa" :
      "fundador_construtora";
    const billing = billingByCat[category] || "monthly";
    const hasMonthly = !!(lot?.monthly_price && Number(lot.monthly_price) > 0);
    const equivalentPlan = lot?.inherited_tier
      ? (TIER_LABEL[lot.inherited_tier] || fallbackPlan)
      : fallbackPlan;
    const credits = billing === "monthly"
      ? (lot?.ia_credits_monthly ?? 0)
      : (lot?.ia_credits ?? (category === "corretor" ? 1000 : 3500));
    const inheritedPlan = lot?.inherited_tier
      ? plans.find((p) => p.tier === lot.inherited_tier)
      : null;
    const planBenefits: string[] = (inheritedPlan?.benefits as string[]) || [];
    const remaining = lot ? lot.total_slots - lot.used_slots : 0;
    const percentSold = lot ? (lot.used_slots / lot.total_slots) * 100 : 100;
    const nextLots = getNextLots(category);

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`relative bg-black/40 backdrop-blur-xl border rounded-3xl flex flex-col ${
          highlight ? "lg:scale-105 lg:-translate-y-2 z-10" : ""
        }`}
        style={{
          borderColor: highlight ? `${theme.primary}80` : "rgba(255,255,255,0.1)",
          boxShadow: highlight
            ? `0 30px 80px ${theme.primary}40, 0 0 0 1px ${theme.primary}30`
            : `0 20px 50px ${theme.primary}15`,
        }}
      >
        {highlight && (
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full text-white text-[11px] font-extrabold uppercase tracking-wider z-30 shadow-lg whitespace-nowrap pointer-events-none"
            style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}
          >
            ⭐ Mais escolhido
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${theme.primary}10, transparent, ${theme.promoAccent || theme.primary}10)` }} />

        {/* Header compacto */}
        <div className="relative p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white leading-tight">{label}</h3>
              <p className="text-xs text-white/50 truncate">Equivale ao {equivalentPlan}</p>
            </div>
          </div>
        </div>

        <div className="relative p-6 space-y-5 flex-1 flex flex-col">
          {lot ? (
            <>
              {/* Toggle billing */}
              {hasMonthly && (
                <div className="inline-flex p-1 rounded-full bg-white/10 border border-white/15 self-start">
                  <button
                    onClick={() => setBillingByCat((s) => ({ ...s, [category]: "monthly" }))}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${billing === "monthly" ? "bg-white text-black" : "text-white/70 hover:text-white"}`}
                  >Mensal</button>
                  <button
                    onClick={() => setBillingByCat((s) => ({ ...s, [category]: "annual" }))}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${billing === "annual" ? "bg-white text-black" : "text-white/70 hover:text-white"}`}
                  >Anual</button>
                </div>
              )}

              {/* Preço */}
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-4xl font-extrabold text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>
                    R$ {billing === "monthly" && lot.monthly_price ? Number(lot.monthly_price).toFixed(2).replace(".", ",") : lot.price.toFixed(0)}
                  </span>
                  <span className="text-white/60 text-sm">{billing === "monthly" ? "/mês" : "/ano"}</span>
                </div>
                <p className="text-[11px] text-white/45 mt-1">
                  Lote {lot.lot_number} · {billing === "monthly" ? "Cancele quando quiser" : "Pagamento único · 12 meses"}
                </p>
              </div>

              {/* Vagas */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold flex items-center gap-1 text-white/80">
                    <Flame className="w-3.5 h-3.5" style={{ color: theme.promoAccent || theme.primary }} />
                    Restam <strong style={{ color: theme.primary }}>{remaining}</strong>/{lot.total_slots}
                  </span>
                  <span className="text-white/50">{percentSold.toFixed(0)}% vendido</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percentSold}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full"
                    style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}
                  />
                </div>
              </div>

              {/* Créditos IA */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl border border-white/10" style={{ background: `linear-gradient(to right, ${theme.primary}15, ${theme.promoAccent || theme.primary}10)` }}>
                <Sparkles className="w-4 h-4 shrink-0" style={{ color: theme.primary }} />
                <div className="text-xs text-white/80">
                  <strong style={{ color: theme.primary }}>+{credits.toLocaleString("pt-BR")} créditos IA</strong>
                  <span className="text-white/55"> de bônus</span>
                </div>
              </div>

              {/* Top 4 benefícios resumidos */}
              <ul className="space-y-1.5 text-sm">
                {[
                  "Acesso premium por 12 meses",
                  "Selo Fundador 🏆 exclusivo",
                  "Prioridade na exibição",
                  "Suporte VIP prioritário",
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/80">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: theme.primary }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {/* Detalhes do plano herdado */}
              {planBenefits.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-semibold text-white/60 hover:text-white transition-colors list-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform">▸</span>
                    Ver tudo do {equivalentPlan} ({planBenefits.length})
                  </summary>
                  <ul className="space-y-1.5 mt-3 pl-2 border-l-2" style={{ borderColor: `${theme.primary}40` }}>
                    {planBenefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/65 pl-2">
                        <Check className="w-3 h-3 shrink-0 mt-0.5" style={{ color: theme.promoAccent || theme.primary }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="flex-1" />

              {/* CTA */}
              <Button
                onClick={() => handlePurchase(category)}
                disabled={purchasing === tier}
                size="lg"
                className="w-full text-white font-bold h-12 shadow-lg"
                style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})`, boxShadow: `0 10px 25px ${theme.primary}40` }}
              >
                {purchasing === tier ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processando...</>
                ) : (
                  <><Crown className="w-4 h-4 mr-2" />Garantir vaga<ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>

              {nextLots.length > 0 && (
                <p className="text-[11px] text-white/50 text-center">
                  Próximo lote: <strong style={{ color: theme.primary }}>R$ {nextLots[0].price.toFixed(0)}</strong>
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-12 flex-1 flex flex-col justify-center">
              <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="font-semibold mb-1 text-white">Lotes esgotados</p>
              <p className="text-sm text-white/50">Aguarde a próxima abertura.</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative" style={{ ...themeVars, background: theme.darkBase }}>
      <Helmet>
        <title>Seja Fundador Capimobi · Pagamento único, 12 meses de premium</title>
        <meta name="description" content="Pague uma vez. Use 12 meses. Garanta sua vaga de Membro Fundador Capimobi com preço travado e bônus exclusivos." />
      </Helmet>

      <ThemeParticles color={theme.primary} glowColor={theme.promoAccent} count={70} />

      <style>{`
        @keyframes epicPulse { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.15); } }
        @keyframes epicFloat { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
        @keyframes epicGlowRing {
          0%,100% { box-shadow: 0 0 40px var(--epic-glow), 0 0 80px var(--epic-glow); }
          50% { box-shadow: 0 0 80px var(--epic-glow), 0 0 160px var(--epic-glow); }
        }
        @keyframes epicRayRotate { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes badgeFloat { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-15px) rotate(2deg); } }
      `}</style>

      <MarketplaceNavbar theme={theme} user={user} />

      {/* HERO – mais limpo e direto */}
      <section className="relative overflow-hidden border-b border-white/10 min-h-[85vh] flex items-center">
        <div
          className="absolute top-1/2 left-1/2 w-[200%] h-[200%] pointer-events-none opacity-15"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, ${theme.primary}40 20deg, transparent 40deg, transparent 180deg, ${theme.promoAccent || theme.primary}30 200deg, transparent 220deg)`,
            animation: "epicRayRotate 30s linear infinite",
          }}
        />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.primary}25, transparent 60%, ${theme.promoAccent || theme.primary}20)` }} />
        <div className="absolute top-20 left-1/4 w-64 md:w-96 h-64 md:h-96 rounded-full blur-[120px]" style={{ background: `${theme.primary}40`, animation: "epicPulse 5s ease-in-out infinite" }} />
        <div className="absolute bottom-0 right-1/4 w-52 md:w-80 h-52 md:h-80 rounded-full blur-[100px]" style={{ background: `${theme.promoAccent || theme.primary}30`, animation: "epicPulse 7s ease-in-out infinite", animationDelay: "1s" }} />

        <div className="relative max-w-6xl mx-auto px-4 py-20 lg:py-24 text-center w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm mb-6"
            style={{
              background: `${theme.primary}25`,
              border: `1px solid ${theme.primary}80`,
              ["--epic-glow" as any]: `${theme.primary}40`,
              animation: "epicGlowRing 3s ease-in-out infinite",
            }}
          >
            <Crown className="w-4 h-4" style={{ color: theme.primary }} />
            <span className="text-sm font-bold uppercase tracking-wider" style={{ color: theme.primary }}>
              Edição Fundador · Vagas Limitadas
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.05] text-white"
            style={{ textShadow: `0 0 60px ${theme.primary}60` }}
          >
            Pague <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>uma vez</span>.
            <br />Use por <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>12 meses</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/65 max-w-2xl mx-auto mb-8"
          >
            Acesso completo às funções premium da Capimobi por 1 ano ou 1 mês, sem renovação automática, com 50% de desconto nos planos mensais ou anuais.
          </motion.p>

          {/* Contador regressivo */}
          {!countdown.expired && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/50 backdrop-blur border border-white/15 mb-8"
            >
              <Clock className="w-4 h-4" style={{ color: theme.promoAccent || theme.primary }} />
              <span className="text-xs text-white/60 uppercase tracking-wide font-semibold">Oferta termina em</span>
              <div className="flex items-center gap-1 font-mono font-bold text-lg">
                <span className="px-2 py-0.5 rounded bg-white/10 text-white tabular-nums">{String(countdown.h).padStart(2, "0")}</span>
                <span className="text-white/40">:</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white tabular-nums">{String(countdown.m).padStart(2, "0")}</span>
                <span className="text-white/40">:</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white tabular-nums">{String(countdown.s).padStart(2, "0")}</span>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 md:gap-12 mb-10"
          >
            {[
              { icon: Users, label: "Vagas por lote", value: "500" },
              { icon: TrendingUp, label: "Aumento por lote", value: "+R$30" },
              { icon: Shield, label: "Validade", value: "12 meses" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <s.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: theme.primary }} />
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-[11px] text-white/50 uppercase tracking-wide">{s.label}</div>
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
              <Crown className="w-5 h-5 mr-2" />Garantir minha vaga
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById("comparativo")?.scrollIntoView({ behavior: "smooth" })}
              className="h-14 px-8 rounded-xl border-white/20 text-white/80 hover:text-white hover:bg-white/5 bg-transparent"
            >
              Ver economia real
            </Button>
          </motion.div>
        </div>
      </section>

      {/* LOTES – 3 colunas com destaque central */}
      <section id="lotes" className="py-16 lg:py-24 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-3 text-white">
              Escolha seu plano Fundador
            </h2>
            <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
              3 planos exclusivos. Cada lote tem vagas limitadas — quando esgota, o preço sobe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 lg:items-stretch">
          {renderLotCard("corretor", individualLot, "Corretor Fundador", "Plano VIP", Award)}
          {renderLotCard("empresa", enterpriseLot, "Imobiliária Fundadora", "Plano Imob Elite", Diamond, true)}
            {renderLotCard("construtora", construtoraLot, "Construtora Fundadora", "Plano Construtora Pro", Building2)}
          </div>
        </div>
      </section>

      {/* SELO CERTIFICADO */}
      <section className="py-20 lg:py-28 border-y border-white/10 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at center, ${theme.primary}20, transparent 70%)` }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-40" style={{ background: theme.primary }} />

        <div className="relative max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative flex justify-center order-2 lg:order-1"
          >
            <div
              className="absolute inset-0 rounded-full blur-3xl opacity-50"
              style={{ background: `radial-gradient(circle, ${theme.primary}80, transparent 70%)` }}
            />
            <img
              src={founderBadge}
              alt="Selo Membro Fundador Capimobi"
              width={1024}
              height={1024}
              loading="lazy"
              className="relative w-full max-w-md drop-shadow-2xl"
              style={{ animation: "badgeFloat 6s ease-in-out infinite", filter: `drop-shadow(0 30px 60px ${theme.primary}80)` }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: `${theme.primary}20`, color: theme.primary }}>
              <Award className="w-3.5 h-3.5" /> RECONHECIMENTO PERMANENTE
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 text-white leading-tight">
              Você ganha um <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>selo de Fundador</span>
            </h2>
            <p className="text-white/65 text-lg mb-8 leading-relaxed">
              Um certificado digital exclusivo que aparece no seu perfil público, na sua loja e nos seus anúncios. Compradores reconhecem na hora quem chegou primeiro.
            </p>

            <div className="space-y-3">
              {[
                { icon: Crown, text: "Selo visível no seu perfil público e loja" },
                { icon: Shield, text: "Mostra autoridade e credibilidade ao cliente" },
                { icon: Lock, text: "Exclusivo dos primeiros 500 de cada categoria" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${theme.primary}25` }}>
                    <item.icon className="w-4 h-4" style={{ color: theme.primary }} />
                  </div>
                  <span className="text-white/85 text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* COMPARATIVO */}
      <section id="comparativo" className="py-16 lg:py-24 relative" style={{ background: `linear-gradient(180deg, ${theme.primary}08, transparent)` }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: `${theme.primary}20`, color: theme.primary }}>
              <TrendingUp className="w-3.5 h-3.5" /> ECONOMIA REAL
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-white">
              O quanto você economiza
            </h2>
            <p className="text-white/60 text-lg">Comparativo direto: pagamento único Fundador × mensalidade do plano equivalente.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {individualLot && vipPlan && (
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-7 h-7" style={{ color: theme.primary }} />
                  <div>
                    <h3 className="text-xl font-bold text-white">Corretor</h3>
                    <p className="text-xs text-white/50">VIP × Fundador</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-white/60">VIP mensal × 12</span>
                    <span className="font-bold text-red-400">R$ {(vipPlan.price * 12).toFixed(0)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-white/80">Fundador (12 meses)</span>
                    <span className="text-2xl font-extrabold text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>
                      R$ {individualLot.price.toFixed(0)}
                    </span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center mt-4">
                    <div className="text-xs text-emerald-300 font-semibold mb-1">VOCÊ ECONOMIZA</div>
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

            {enterpriseLot && blackPlan && (
              <div className="bg-black/40 backdrop-blur-xl border rounded-2xl p-6 lg:p-8 relative" style={{ borderColor: `${theme.primary}50` }}>
                <div className="absolute -top-3 left-6 px-3 py-1 rounded-full text-white text-xs font-bold" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>
                  MAIOR ECONOMIA
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <Diamond className="w-7 h-7" style={{ color: theme.primary }} />
                  <div>
                     <h3 className="text-xl font-bold text-white">Imobiliária</h3>
                    <p className="text-xs text-white/50">Imob Elite × Fundador</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                     <span className="text-sm text-white/60">Imob Elite mensal × 12</span>
                    <span className="font-bold text-red-400">R$ {(blackPlan.price * 12).toFixed(0)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-white/80">Fundador (12 meses)</span>
                    <span className="text-2xl font-extrabold text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})` }}>
                      R$ {enterpriseLot.price.toFixed(0)}
                    </span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center mt-4">
                    <div className="text-xs text-emerald-300 font-semibold mb-1">VOCÊ ECONOMIZA</div>
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

      {/* TUDO INCLUÍDO */}
      <section className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-3 text-white">Tudo que está incluído</h2>
            <p className="text-white/60 text-lg">1 ano completo de premium com benefícios exclusivos de Fundador.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {FOUNDER_BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${theme.primary}25, ${theme.promoAccent || theme.primary}20)` }}>
                  <Check className="w-4 h-4" style={{ color: theme.primary }} />
                </div>
                <span className="font-medium pt-1.5 text-white/90 text-sm">{b}</span>
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
          <Crown className="w-14 h-14 mx-auto mb-5" style={{ color: theme.primary }} />
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 text-white">
            Sua vaga não espera você decidir.
          </h2>
          <p className="text-lg text-white/65 mb-8">
            A cada novo Fundador, restam menos vagas. Quando o lote esgota, o preço sobe.
          </p>
          <Button
            size="lg"
            onClick={() => handlePurchase(isImobiliaria ? "empresa" : "corretor")}
            disabled={!!purchasing}
            className="text-white font-bold h-16 px-10 text-lg shadow-xl"
            style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.promoAccent || theme.primary})`, boxShadow: `0 20px 50px ${theme.primary}50` }}
          >
            {purchasing ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" />Processando...</>
            ) : (
              <><Crown className="w-6 h-6 mr-2" />Quero ser Fundador<ArrowRight className="w-6 h-6 ml-2" /></>
            )}
          </Button>
          <p className="text-xs text-white/50 mt-6">Pagamento seguro · Acesso liberado imediatamente</p>
        </div>
      </section>
    </div>
  );
}
