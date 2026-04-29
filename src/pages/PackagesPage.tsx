import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Crown, Star, Zap, ArrowLeft, Shield, Gem, Diamond, Coins, Ticket, X, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useActivePlans, type Plan } from "@/hooks/usePlans";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const tierIcons: Record<string, any> = {
  basico: Zap, start: Zap, premium: Star, vip: Crown,
  essencial_empresa: Shield, premium_empresa: Gem, prime_empresa: Diamond,
};

const aiMonthlyCredits: Record<string, number> = {
  basico: 25,
  start: 250,
  premium: 600,
  vip: 1000,
  essencial_empresa: 2000,
  premium_empresa: 2000,
  prime_empresa: 3500,
  fundador_corretor: 500,
  fundador_empresa: 1750,
};

interface FounderLot {
  id: string;
  category: "individual" | "enterprise";
  lot_number: number;
  price: number;
  total_slots: number;
  used_slots: number;
  is_active: boolean;
  inherited_tier: string;
  ia_credits: number;
}

const TIER_LABEL: Record<string, string> = {
  start: "Start",
  premium: "Premium",
  vip: "VIP",
  essencial_empresa: "Essencial Empresa",
  premium_empresa: "Premium Empresa",
  prime_empresa: "Prime Empresa (Black)",
};

const formatCredits = (credits: number) => credits.toLocaleString("pt-BR");

type BillingPeriod = "monthly" | "annual" | "founder";

interface AppliedCoupon {
  id: string;
  code: string;
  discount_percent: number;
  description: string | null;
}

export default function PackagesPage() {
  const { user, profile } = useAuth();
  const { subscription, currentTier, refetch } = useSubscription(user?.id);
  const { plans, loading: plansLoading } = useActivePlans();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selecting, setSelecting] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [searchParams, setSearchParams] = useSearchParams();
  const confirmedSessionRef = useRef<string | null>(null);
  const [annualDiscount, setAnnualDiscount] = useState<number>(20);
  const [couponInput, setCouponInput] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [founderLots, setFounderLots] = useState<FounderLot[]>([]);
  const [founderEnabled, setFounderEnabled] = useState<boolean>(true);

  // Carrega o desconto anual configurado pelo admin
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("platform_settings")
        .select("value")
        .eq("key", "annual_discount_percent")
        .maybeSingle();
      if (data?.value) setAnnualDiscount(parseInt(data.value) || 20);
    })();
  }, []);

  // Carrega lotes Fundador ativos + setting global
  useEffect(() => {
    (async () => {
      const [{ data: lots }, { data: settings }] = await Promise.all([
        (supabase as any)
          .from("founder_lots")
          .select("id, category, lot_number, price, total_slots, used_slots, is_active, inherited_tier, ia_credits")
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
    })();
  }, []);

  const isImobiliaria = profile?.seller_category === "imobiliaria" || profile?.seller_category === "construtora";
  const isFounderTier = (t: string) => t === "fundador_corretor" || t === "fundador_empresa";
  const individualPlans = isImobiliaria || billingPeriod === "founder"
    ? []
    : plans.filter((p) =>
        !isFounderTier(p.tier) && (billingPeriod === "annual"
          ? p.category === "individual" && p.price > 0
          : p.category === "individual" || p.category === "free")
      );
  const enterprisePlans = isImobiliaria && billingPeriod !== "founder"
    ? plans.filter((p) => !isFounderTier(p.tier) && p.category === "enterprise" && (billingPeriod === "monthly" || p.price > 0))
    : [];
  const activePlan = plans.find((p) => p.tier === currentTier);

  // Calcula preço final com descontos cumulativos
  const calculateFinalPrice = (basePrice: number, tier: string) => {
    let price = basePrice;
    let totalDiscount = 0;
    if (billingPeriod === "annual" && annualDiscount > 0) {
      totalDiscount += annualDiscount;
    }
    if (appliedCoupon) {
      const tiersAllowed = appliedCoupon as any;
      // O cupom já foi validado server-side, aplica direto
      totalDiscount += appliedCoupon.discount_percent;
    }
    if (totalDiscount > 0) {
      price = price * (1 - Math.min(totalDiscount, 95) / 100);
    }
    return { final: price, discount: totalDiscount };
  };

  const validateCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      toast({ title: "Digite um código de cupom", variant: "destructive" });
      return;
    }
    setValidatingCoupon(true);
    try {
      const { data, error } = await (supabase as any)
        .from("discount_coupons")
        .select("id, code, discount_percent, description, applies_to, applicable_tiers, max_uses, uses_count, valid_until, is_active")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({ title: "Cupom inválido", description: "Esse código não existe ou foi desativado.", variant: "destructive" });
        return;
      }

      // Validações client-side
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        toast({ title: "Cupom expirado", description: "Esse cupom não está mais válido.", variant: "destructive" });
        return;
      }
      if (data.max_uses && data.uses_count >= data.max_uses) {
        toast({ title: "Cupom esgotado", description: "Esse cupom já atingiu o limite de usos.", variant: "destructive" });
        return;
      }
      if (data.applies_to === "monthly" && billingPeriod === "annual") {
        toast({ title: "Cupom não aplicável", description: "Esse cupom só vale para planos mensais. Mude para a aba Mensal.", variant: "destructive" });
        return;
      }
      if (data.applies_to === "annual" && billingPeriod === "monthly") {
        toast({ title: "Cupom não aplicável", description: "Esse cupom só vale para planos anuais. Mude para a aba Anual.", variant: "destructive" });
        return;
      }

      setAppliedCoupon({
        id: data.id,
        code: data.code,
        discount_percent: data.discount_percent,
        description: data.description,
      });
      setCouponInput("");
      toast({ title: `🎉 Cupom aplicado!`, description: `${data.discount_percent}% de desconto adicional.` });
    } catch (err: any) {
      toast({ title: "Erro ao validar cupom", description: err.message, variant: "destructive" });
    }
    setValidatingCoupon(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast({ title: "Cupom removido" });
  };

  // Handler de retorno do checkout: confirma pagamento e ativa o plano
  useEffect(() => {
    const status = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (status === "cancelled") {
      toast({ title: "Pagamento cancelado", description: "Você pode tentar novamente quando quiser." });
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
      return;
    }
    if (status !== "success" || !sessionId || !user) return;
    if (confirmedSessionRef.current === sessionId) return;
    confirmedSessionRef.current = sessionId;
    (async () => {
      setConfirming(true);
      try {
        const { data, error } = await supabase.functions.invoke("confirm-checkout", {
          body: { session_id: sessionId },
        });
        if (error) throw error;
        if (data?.ok) {
          await refetch();
          toast({
            title: data.already_processed ? "Plano já ativo" : "🎉 Plano ativado!",
            description: data.already_processed
              ? "Esta compra já havia sido processada."
              : `Seu novo plano está ativo até ${new Date(data.expires_at).toLocaleDateString("pt-BR")}. Créditos IA somados ao seu saldo.`,
          });
        } else {
          toast({ title: "Pagamento ainda processando", description: "Aguarde alguns instantes e atualize a página.", variant: "destructive" });
        }
      } catch (err: any) {
        toast({ title: "Erro ao confirmar pagamento", description: err.message, variant: "destructive" });
      } finally {
        setConfirming(false);
        searchParams.delete("checkout");
        searchParams.delete("session_id");
        setSearchParams(searchParams, { replace: true });
      }
    })();
  }, [searchParams, user]);

  const handleSelect = async (plan: Plan) => {
    if (!user || !profile) {
      navigate("/login");
      return;
    }

    // Se cupom aplicado restringe a planos específicos, validar aqui também
    if (appliedCoupon) {
      const { data: cpn } = await (supabase as any)
        .from("discount_coupons")
        .select("applicable_tiers")
        .eq("id", appliedCoupon.id)
        .maybeSingle();
      if (cpn?.applicable_tiers && cpn.applicable_tiers.length > 0 && !cpn.applicable_tiers.includes(plan.tier)) {
        toast({
          title: "Cupom não vale para este plano",
          description: `O cupom ${appliedCoupon.code} é válido apenas para: ${cpn.applicable_tiers.join(", ")}`,
          variant: "destructive",
        });
        return;
      }
    }

    setSelecting(plan.tier);
    try {
      if (plan.price === 0) {
        if (subscription) {
          await supabase
            .from("seller_subscriptions")
            .update({ is_active: false } as any)
            .eq("id", subscription.id);
        }
        const { error } = await supabase.from("seller_subscriptions").insert({
          user_id: user.id,
          seller_id: profile.id,
          tier: plan.tier,
          max_items: plan.max_items,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_method: "gratis",
          payment_status: "confirmado",
        } as any);
        if (error) throw error;
        await refetch();
        toast({ title: `Pacote ${plan.name} ativado!`, description: "Você pode começar a anunciar agora." });
      } else {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: {
            tier: plan.tier,
            billing_period: billingPeriod,
            coupon_code: appliedCoupon?.code || null,
          },
        });
        if (error) throw error;
        if (data?.url) {
          window.open(data.url, "_blank");
        } else {
          throw new Error("URL de checkout não retornada");
        }
      }
    } catch (err: any) {
      toast({ title: "Erro ao processar", description: err.message || "Tente novamente.", variant: "destructive" });
    }
    setSelecting(null);
  };

  // Lote ativo (próximo a vender) e tier de Fundador para a categoria do usuário
  const founderCategory: "individual" | "enterprise" = isImobiliaria ? "enterprise" : "individual";
  const founderTier = isImobiliaria ? "fundador_empresa" : "fundador_corretor";
  const activeFounderLot = founderLots
    .filter((l) => l.category === founderCategory && l.is_active && l.used_slots < l.total_slots)
    .sort((a, b) => a.lot_number - b.lot_number)[0];
  // Plano herdado configurado no lote ativo (Start, VIP, Prime, etc.)
  const inheritedTier = activeFounderLot?.inherited_tier;
  const founderPlan = plans.find((p) => p.tier === inheritedTier) || plans.find((p) => p.tier === founderTier);

  const handleSelectFounder = async () => {
    if (!user || !profile) {
      navigate("/auth");
      return;
    }
    if (!activeFounderLot || !founderPlan) {
      toast({ title: "Plano Fundador esgotado", description: "Todos os lotes foram vendidos.", variant: "destructive" });
      return;
    }
    setSelecting(founderTier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          tier: founderTier,
          billing_period: "annual",
          founder_lot_id: activeFounderLot.id,
        },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
      else throw new Error("URL de checkout não retornada");
    } catch (err: any) {
      toast({ title: "Erro ao processar", description: err.message || "Tente novamente.", variant: "destructive" });
    }
    setSelecting(null);
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const renderCard = (plan: Plan, idx: number, opts: { showPartners?: boolean } = {}) => {
    const Icon = tierIcons[plan.tier] || Zap;
    const isCurrent = currentTier === plan.tier;
    const credits = aiMonthlyCredits[plan.tier] ?? 25;
    const { final, discount } = calculateFinalPrice(plan.price, plan.tier);
    const hasDiscount = discount > 0 && plan.price > 0;

    return (
      <motion.div
        key={plan.id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.1 }}
        className={`relative bg-card border-2 rounded-3xl overflow-hidden shadow-lg transition-all hover:shadow-2xl ${
          isCurrent ? "border-primary ring-4 ring-primary/20" : plan.is_popular ? "border-amber-400" : "border-border"
        }`}
      >
        {plan.is_popular && !isCurrent && (
          <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-bl-xl z-10">
            POPULAR
          </div>
        )}
        {isCurrent && (
          <div className="absolute top-0 left-0 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-br-xl z-10">
            ATUAL
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-emerald-500 text-white text-xs font-extrabold rounded-full shadow-lg flex items-center gap-1 z-10">
            <Sparkles size={12} /> -{discount}%
          </div>
        )}

        <div className={`p-6 bg-gradient-to-br ${plan.color} text-white`}>
          <Icon size={32} className="mb-3" />
          <h2 className="font-display font-extrabold text-2xl">{plan.name}</h2>
          <div className="mt-2">
            {hasDiscount && (
              <div className="text-white/60 text-sm line-through">
                R$ {plan.price.toFixed(2).replace(".", ",")}
              </div>
            )}
            <div className="flex items-baseline gap-1">
              <span className="font-display font-bold text-3xl">R$ {final.toFixed(2).replace(".", ",")}</span>
              <span className="text-white/70 text-sm">/mês</span>
            </div>
            {billingPeriod === "annual" && plan.price > 0 && (
              <div className="text-white/80 text-xs mt-1">
                Cobrado anualmente · R$ {(final * 12).toFixed(2).replace(".", ",")}/ano
              </div>
            )}
          </div>
          {opts.showPartners && (
            <div className="mt-3 px-3 py-2 bg-white/15 rounded-xl text-center">
              <span className="text-white font-bold text-sm">
                {plan.tier === "basico_empresa" ? "Até 1" : plan.tier === "essencial_empresa" ? "Até 5" : plan.tier === "premium_empresa" ? "Até 10" : "Até 30"} Parceiros Vinculados
              </span>
            </div>
          )}
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-center">
            <Coins size={16} className="text-white" />
            <span className="text-sm font-bold text-white">
              {billingPeriod === "annual"
                ? `${formatCredits(credits * 12)} créditos IA/ano`
                : `${formatCredits(credits)} créditos IA/mês`}
            </span>
          </div>
        </div>

        <div className="p-6">
          <ul className="space-y-3">
            {plan.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleSelect(plan)}
            disabled={isCurrent || selecting === plan.tier}
            className={`w-full mt-3 py-3 rounded-xl font-bold text-sm transition-all ${
              isCurrent
                ? "bg-muted text-muted-foreground cursor-default"
                : `bg-gradient-to-r ${plan.color} text-white hover:opacity-90 shadow-lg`
            }`}
          >
            {selecting === plan.tier
              ? "Processando..."
              : isCurrent
              ? "Plano Atual"
              : "Contratar"}
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {confirming && (
        <div className="fixed inset-0 z-[200] bg-background/90 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card border-2 border-primary/30 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
            <h3 className="font-display font-extrabold text-xl text-foreground">Confirmando pagamento...</h3>
            <p className="text-sm text-muted-foreground text-center">Estamos ativando seu plano e somando os créditos IA ao seu saldo.</p>
          </div>
        </div>
      )}
      <div className="gradient-hero py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <Link to="/painel" className="inline-flex items-center gap-2 text-white/70 text-sm mb-4 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Voltar ao Painel
          </Link>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white">Pacotes Premium</h1>
          <p className="text-white/70 mt-2">Escolha o plano ideal para impulsionar seus anúncios</p>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 -mt-8 relative z-10 pb-24 lg:pb-16">
        {/* Toggle Mensal / Anual */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-card border-2 border-border rounded-2xl p-1.5 shadow-lg">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-5 sm:px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${
                billingPeriod === "monthly"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-5 sm:px-8 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                billingPeriod === "annual"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Anual
              {annualDiscount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                  billingPeriod === "annual" ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-600"
                }`}>
                  -{annualDiscount}%
                </span>
              )}
            </button>
            {founderEnabled && (
              <button
                onClick={() => setBillingPeriod("founder")}
                className={`px-5 sm:px-8 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  billingPeriod === "founder"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                    : "text-amber-600 hover:text-amber-700"
                }`}
              >
                <Crown size={14} />
                Fundador
              </button>
            )}
          </div>
        </div>

        {/* Campo de cupom (não se aplica ao Fundador) */}
        <div className={`max-w-md mx-auto mb-8 ${billingPeriod === "founder" ? "hidden" : ""}`}>
          <AnimatePresence mode="wait">
            {appliedCoupon ? (
              <motion.div
                key="applied"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30"
              >
                <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground">
                    Cupom <code className="font-mono text-emerald-600">{appliedCoupon.code}</code> aplicado
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {appliedCoupon.discount_percent}% de desconto{appliedCoupon.description ? ` · ${appliedCoupon.description}` : ""}
                  </p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-600"
                  title="Remover cupom"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="input"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-stretch gap-2"
              >
                <div className="relative flex-1">
                  <Ticket size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
                    placeholder="Tem um cupom? Digite aqui"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-border bg-card text-foreground text-sm font-mono uppercase tracking-wider focus:border-primary outline-none"
                  />
                </div>
                <button
                  onClick={validateCoupon}
                  disabled={validatingCoupon || !couponInput.trim()}
                  className="px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {validatingCoupon ? "..." : "Aplicar"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {individualPlans.length > 0 && (
          <>
            <h2 className="font-display font-extrabold text-xl text-foreground mb-4">Planos Individuais</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {individualPlans.map((p, i) => renderCard(p, i))}
            </div>
          </>
        )}

        {enterprisePlans.length > 0 && (
          <>
            <h2 className="font-display font-extrabold text-xl text-foreground mt-10 mb-4">Planos Empresariais</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {enterprisePlans.map((p, i) => renderCard(p, i, { showPartners: true }))}
            </div>
          </>
        )}

        {/* ===== Plano Fundador (apenas na aba Anual) ===== */}
        {billingPeriod === "founder" && activeFounderLot && founderPlan && (() => {
          const slotsLeft = activeFounderLot.total_slots - activeFounderLot.used_slots;
          const pct = (activeFounderLot.used_slots / activeFounderLot.total_slots) * 100;
          const credits = activeFounderLot.ia_credits ?? aiMonthlyCredits[founderTier];
          const isCurrent = String(currentTier) === founderTier;
          const inheritedLabel = TIER_LABEL[activeFounderLot.inherited_tier] || (isImobiliaria ? "Black Empresa" : "VIP");
          return (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 relative overflow-hidden rounded-3xl border-2 border-amber-400/60 shadow-[0_20px_60px_-15px_rgba(245,158,11,0.5)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />

              <div className="relative p-6 md:p-10 text-white">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-extrabold uppercase tracking-wider">
                    <Crown size={14} /> Oferta Fundador
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-black/30 backdrop-blur-sm rounded-full text-xs font-bold">
                    Lote {activeFounderLot.lot_number}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/90 rounded-full text-xs font-extrabold">
                    {slotsLeft} de {activeFounderLot.total_slots} vagas restantes
                  </span>
                </div>

                <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
                  <div>
                    <h2 className="font-display font-extrabold text-3xl md:text-4xl leading-tight">
                      Seja um {isImobiliaria ? "Imobiliária" : "Corretor"} Fundador
                    </h2>
                    <p className="mt-3 text-white/90 text-base md:text-lg max-w-xl">
                      Pagamento único, acesso por <strong>1 ano completo</strong> aos benefícios do plano{" "}
                      <strong>{inheritedLabel}</strong> + selo exclusivo de Membro Fundador.
                    </p>

                    <ul className="mt-5 grid sm:grid-cols-2 gap-2.5 text-sm">
                      {founderPlan.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-white mt-0.5 flex-shrink-0" />
                          <span className="text-white/95">{b}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/30 backdrop-blur-sm">
                      <Coins size={18} className="text-amber-200" />
                      <span className="font-bold text-white">{formatCredits(credits)} créditos IA</span>
                      <span className="text-white/70 text-xs">· não renováveis</span>
                    </div>
                  </div>

                  <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl p-6 text-center">
                    <p className="text-white/80 text-sm font-semibold uppercase tracking-wider">Pagamento único</p>
                    <div className="mt-2 flex items-baseline justify-center gap-1">
                      <span className="text-white/70 text-2xl font-bold">R$</span>
                      <span className="font-display font-extrabold text-6xl">
                        {Number(activeFounderLot.price).toFixed(0)}
                      </span>
                    </div>
                    <p className="text-white/80 text-xs mt-1">à vista · sem renovação automática</p>

                    <div className="mt-4">
                      <div className="h-2 w-full rounded-full bg-black/30 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                      <p className="text-white/80 text-xs mt-2">
                        {activeFounderLot.used_slots} fundadores já garantiram
                      </p>
                    </div>

                    <button
                      onClick={handleSelectFounder}
                      disabled={isCurrent || selecting === founderTier}
                      className="mt-5 w-full py-3.5 rounded-xl bg-white text-amber-700 font-extrabold text-base hover:bg-amber-50 transition-all shadow-xl disabled:opacity-60"
                    >
                      {selecting === founderTier
                        ? "Processando..."
                        : isCurrent
                        ? "Você é Fundador 🏆"
                        : `🏆 Garantir minha vaga`}
                    </button>

                    {founderLots.filter((l) => l.category === founderCategory).length > 1 && (
                      <p className="text-white/70 text-[11px] mt-3">
                        Próximos lotes:{" "}
                        {founderLots
                          .filter((l) => l.category === founderCategory && l.lot_number > activeFounderLot.lot_number)
                          .map((l) => `Lote ${l.lot_number} R$ ${Number(l.price).toFixed(0)}`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {billingPeriod === "founder" && !activeFounderLot && (
          <div className="mt-12 text-center bg-card border-2 border-dashed border-border rounded-3xl p-12">
            <Crown size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display font-extrabold text-2xl text-foreground">Lotes Fundador esgotados</h3>
            <p className="text-muted-foreground mt-2">Todas as vagas de fundador foram preenchidas. Confira os planos Mensal ou Anual.</p>
          </div>
        )}

        {subscription && activePlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-card border-2 border-primary/30 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${activePlan.color}`}>
                  {(() => { const ActiveIcon = tierIcons[currentTier] || Zap; return <ActiveIcon size={24} className="text-white" />; })()}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Plano Ativo</p>
                  {(() => {
                    const isFounder = isFounderTier(currentTier);
                    // Para Fundador: busca o lote correspondente à categoria do usuário (preço e tier herdado)
                    const founderLotForUser = isFounder
                      ? founderLots
                          .filter((l) => l.category === founderCategory)
                          .sort((a, b) => b.lot_number - a.lot_number)[0]
                      : null;
                    const inheritedPlan = founderLotForUser?.inherited_tier
                      ? plans.find((p) => p.tier === founderLotForUser.inherited_tier)
                      : null;
                    const displayName = isFounder
                      ? `Fundador${inheritedPlan ? ` ${inheritedPlan.name}` : ""}`
                      : activePlan.name;
                    const displayPrice = isFounder
                      ? (founderLotForUser?.price ?? activePlan.price)
                      : activePlan.price;
                    const suffix = isFounder ? "/ano" : "/mês";
                    return (
                      <>
                        <h3 className="font-display font-extrabold text-xl text-foreground">{displayName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {activePlan.price === 0 && !isFounder
                            ? "Grátis"
                            : `R$ ${Number(displayPrice).toFixed(2).replace(".", ",")}${suffix}`}
                          {subscription.expires_at && (
                            <span className="ml-2">
                              · Válido até {new Date(subscription.expires_at).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </p>
                      </>
                    );
                  })()}
                  {activePlan.price > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ✨ Sem renovação automática · Troque de plano quando quiser
                    </p>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-10 bg-card border border-border rounded-2xl p-6">
          <h3 className="font-display font-bold text-lg text-foreground mb-3">Como funciona?</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">1. Escolha seu plano</strong>
              <p className="mt-1">Mensal (30 dias) ou Anual (12 meses), aplique cupom se tiver.</p>
            </div>
            <div>
              <strong className="text-foreground">2. Pagamento único</strong>
              <p className="mt-1">Pagamento via Stripe, à vista no cartão. <strong>Sem renovação automática.</strong></p>
            </div>
            <div>
              <strong className="text-foreground">3. Ativação instantânea</strong>
              <p className="mt-1">Plano ativo na hora e seus créditos IA somam ao saldo atual.</p>
            </div>
            <div>
              <strong className="text-foreground">4. Troque quando quiser</strong>
              <p className="mt-1">Sem amarrações. Compre outro plano e ele substitui o atual mantendo seus créditos.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
