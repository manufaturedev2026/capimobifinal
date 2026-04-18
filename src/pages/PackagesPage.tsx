import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Crown, Star, Zap, ArrowLeft, Settings, Shield, Gem, Diamond } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, PACKAGE_CONFIG } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const individualTiers = ["start", "premium", "vip"] as const;
const enterpriseTiers = ["essencial_empresa", "premium_empresa", "prime_empresa"] as const;
const tierIcons: Record<string, any> = { basico: Zap, start: Zap, premium: Star, vip: Crown, essencial_empresa: Shield, premium_empresa: Gem, prime_empresa: Diamond };

export default function PackagesPage() {
  const { user, profile } = useAuth();
  const { subscription, currentTier, config: activeConfig, refetch } = useSubscription(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selecting, setSelecting] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

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

  const handleSelect = async (tier: "basico" | "start" | "premium" | "vip") => {
    if (!user || !profile) {
      navigate("/login");
      return;
    }
    setSelecting(tier);

    try {
      if (tier === "basico") {
        // Free tier - handle locally
        if (subscription) {
          await supabase
            .from("seller_subscriptions")
            .update({ is_active: false } as any)
            .eq("id", subscription.id);
        }
        const config = PACKAGE_CONFIG[tier];
        const { error } = await supabase.from("seller_subscriptions").insert({
          user_id: user.id,
          seller_id: profile.id,
          tier,
          max_items: config.maxItems,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_method: "gratis",
          payment_status: "confirmado",
        } as any);
        if (error) throw error;
        await refetch();
        toast({ title: "Pacote Básico ativado!", description: "Você pode começar a anunciar agora." });
      } else {
        // Paid tier - redirect to Stripe Checkout
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: { tier },
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
        {/* Individual Plans */}
        <h2 className="font-display font-extrabold text-xl text-foreground mb-4">Planos Individuais</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {individualTiers.map((tier, i) => {
            const config = PACKAGE_CONFIG[tier];
            const Icon = tierIcons[tier];
            const isCurrent = currentTier === tier;
            const isPopular = tier === "premium";

            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-card border-2 rounded-3xl overflow-hidden shadow-lg transition-all hover:shadow-2xl ${
                  isCurrent ? "border-primary ring-4 ring-primary/20" : isPopular ? "border-amber-400" : "border-border"
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-bl-xl">
                    POPULAR
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-0 left-0 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-br-xl">
                    ATUAL
                  </div>
                )}

                <div className={`p-6 bg-gradient-to-br ${config.color} text-white`}>
                  <Icon size={32} className="mb-3" />
                  <h2 className="font-display font-extrabold text-2xl">{config.name}</h2>
                  <div className="mt-2">
                    <span className="font-display font-bold text-3xl">R$ {config.price.toFixed(2).replace(".", ",")}</span>
                    <span className="text-white/70 text-sm">/mês</span>
                    {config.setupFee > 0 && (
                      <div className="mt-2 px-3 py-1.5 bg-white/15 rounded-xl text-center">
                        <span className="text-white text-xs font-bold">
                          ✨ 7 dias grátis
                        </span>
                        <span className="text-white/70 text-xs block">teste sem compromisso</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <ul className="space-y-3">
                    {config.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                        <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelect(tier as any)}
                    disabled={isCurrent || selecting === tier}
                    className={`w-full mt-3 py-3 rounded-xl font-bold text-sm transition-all ${
                      isCurrent
                        ? "bg-muted text-muted-foreground cursor-default"
                        : `bg-gradient-to-r ${config.color} text-white hover:opacity-90 shadow-lg`
                    }`}
                  >
                    {selecting === tier
                      ? "Processando..."
                      : isCurrent
                      ? "Plano Atual"
                      : "Contratar"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Enterprise Plans */}
        <h2 className="font-display font-extrabold text-xl text-foreground mt-10 mb-4">Planos Empresariais</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {enterpriseTiers.map((tier, i) => {
            const config = PACKAGE_CONFIG[tier];
            const Icon = tierIcons[tier];
            const isCurrent = currentTier === tier;

            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                className={`relative bg-card border-2 rounded-3xl overflow-hidden shadow-lg transition-all hover:shadow-2xl ${
                  isCurrent ? "border-primary ring-4 ring-primary/20" : "border-border"
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-0 left-0 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-br-xl">
                    ATUAL
                  </div>
                )}

                <div className={`p-6 bg-gradient-to-br ${config.color} text-white`}>
                  <Icon size={32} className="mb-3" />
                  <h2 className="font-display font-extrabold text-2xl">{config.name}</h2>
                  <div className="mt-2">
                    <span className="font-display font-bold text-3xl">R$ {config.price.toFixed(2).replace(".", ",")}</span>
                    <span className="text-white/70 text-sm">/mês</span>
                  </div>
                  <div className="mt-3 px-3 py-2 bg-white/15 rounded-xl text-center">
                    <span className="text-white font-bold text-sm">
                      {tier === "essencial_empresa" ? "Até 5" : tier === "premium_empresa" ? "Até 10" : "∞"} Parceiros Vinculados
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <ul className="space-y-3">
                    {config.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                        <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelect(tier as any)}
                    disabled={isCurrent || selecting === tier}
                    className={`w-full mt-3 py-3 rounded-xl font-bold text-sm transition-all ${
                      isCurrent
                        ? "bg-muted text-muted-foreground cursor-default"
                        : `bg-gradient-to-r ${config.color} text-white hover:opacity-90 shadow-lg`
                    }`}
                  >
                    {selecting === tier
                      ? "Processando..."
                      : isCurrent
                      ? "Plano Atual"
                      : "Contratar"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {subscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-card border-2 border-primary/30 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${activeConfig.color}`}>
                  {(() => { const ActiveIcon = tierIcons[currentTier as keyof typeof tierIcons] || Zap; return <ActiveIcon size={24} className="text-white" />; })()}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Plano Ativo</p>
                  <h3 className="font-display font-extrabold text-xl text-foreground">{activeConfig.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentTier === "basico" ? "Grátis" : `R$ ${activeConfig.price.toFixed(2).replace(".", ",")}/mês`}
                    {subscription.expires_at && (
                      <span className="ml-2">
                        · {currentTier === "basico" ? "Válido até" : "Renova em"} {new Date(subscription.expires_at).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {currentTier !== "basico" && (
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
