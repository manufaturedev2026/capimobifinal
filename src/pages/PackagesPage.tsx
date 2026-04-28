import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Crown, Star, Zap, ArrowLeft, Settings, Shield, Gem, Diamond, Coins } from "lucide-react";
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
};

const formatCredits = (credits: number) => credits.toLocaleString("pt-BR");

export default function PackagesPage() {
  const { user, profile } = useAuth();
  const { subscription, currentTier, refetch } = useSubscription(user?.id);
  const { plans, loading: plansLoading } = useActivePlans();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selecting, setSelecting] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const individualPlans = plans.filter((p) => p.category === "individual" || p.category === "free");
  const enterprisePlans = plans.filter((p) => p.category === "enterprise");
  const activePlan = plans.find((p) => p.tier === currentTier);

  const handleManageSubscription = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("URL do portal não retornada");
      }
    } catch (err: any) {
      toast({ title: "Erro ao abrir portal", description: err.message || "Tente novamente.", variant: "destructive" });
    }
    setOpeningPortal(false);
  };

  const handleSelect = async (plan: Plan) => {
    if (!user || !profile) {
      navigate("/login");
      return;
    }
    setSelecting(plan.tier);

    try {
      if (plan.price === 0) {
        // Free tier - handle locally
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
        // Paid tier - redirect to Stripe Checkout
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: { tier: plan.tier },
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
          <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-bl-xl">
            POPULAR
          </div>
        )}
        {isCurrent && (
          <div className="absolute top-0 left-0 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-br-xl">
            ATUAL
          </div>
        )}

        <div className={`p-6 bg-gradient-to-br ${plan.color} text-white`}>
          <Icon size={32} className="mb-3" />
          <h2 className="font-display font-extrabold text-2xl">{plan.name}</h2>
          <div className="mt-2">
            <span className="font-display font-bold text-3xl">R$ {plan.price.toFixed(2).replace(".", ",")}</span>
            <span className="text-white/70 text-sm">/mês</span>
          </div>
          {opts.showPartners && (
            <div className="mt-3 px-3 py-2 bg-white/15 rounded-xl text-center">
              <span className="text-white font-bold text-sm">
                {plan.tier === "essencial_empresa" ? "Até 5" : plan.tier === "premium_empresa" ? "Até 10" : "Até 30"} Parceiros Vinculados
              </span>
            </div>
          )}
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-center">
            <Coins size={16} className="text-white" />
            <span className="text-sm font-bold text-white">{formatCredits(credits)} créditos IA/mês</span>
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
                  <h3 className="font-display font-extrabold text-xl text-foreground">{activePlan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {activePlan.price === 0 ? "Grátis" : `R$ ${activePlan.price.toFixed(2).replace(".", ",")}/mês`}
                    {subscription.expires_at && (
                      <span className="ml-2">
                        · {activePlan.price === 0 ? "Válido até" : "Renova em"} {new Date(subscription.expires_at).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {activePlan.price > 0 && (
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={handleManageSubscription}
                    disabled={openingPortal}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-muted border border-border rounded-xl text-foreground font-semibold text-sm hover:bg-accent transition-all"
                  >
                    <Settings size={16} />
                    {openingPortal ? "Abrindo..." : "Gerenciar"}
                  </button>
                  <button
                    onClick={handleManageSubscription}
                    disabled={openingPortal}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-destructive/30 rounded-xl text-destructive font-semibold text-sm hover:bg-destructive/10 transition-all"
                  >
                    {openingPortal ? "Abrindo..." : "Cancelar Plano"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="mt-10 bg-card border border-border rounded-2xl p-6">
          <h3 className="font-display font-bold text-lg text-foreground mb-3">Como funciona?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">1. Escolha seu plano</strong>
              <p className="mt-1">Selecione o pacote que melhor atende suas necessidades.</p>
            </div>
            <div>
              <strong className="text-foreground">2. Pagamento seguro</strong>
              <p className="mt-1">Para planos pagos, você será redirecionado ao checkout seguro do Stripe para pagamento com cartão.</p>
            </div>
            <div>
              <strong className="text-foreground">3. Ativação instantânea</strong>
              <p className="mt-1">Após o pagamento, seu plano é ativado automaticamente e você já pode anunciar!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
