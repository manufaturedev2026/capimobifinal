import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Crown, Star, Zap, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, PACKAGE_CONFIG } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const tiers = ["start", "premium", "vip"] as const;
const tierIcons = { basico: Zap, start: Zap, premium: Star, vip: Crown };

export default function PackagesPage() {
  const { user, profile } = useAuth();
  const { subscription, currentTier, refetch } = useSubscription(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selecting, setSelecting] = useState<string | null>(null);

  const handleSelect = async (tier: "basico" | "start" | "premium" | "vip") => {
    if (!user || !profile) {
      navigate("/entrar");
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => {
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
                    {config.setupFee > 0 ? (
                      <>
                        <span className="font-display font-bold text-3xl">
                          R$ {((config.price + config.setupFee / 12)).toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-white/70 text-sm">/mês</span>
                        <div className="mt-2 px-3 py-1.5 bg-white/15 rounded-xl text-center">
                          <span className="text-white/90 text-xs font-semibold">
                            R$ {config.price.toFixed(2).replace(".", ",")}/mês + Implementação em 12x
                          </span>
                          <span className="text-white/60 text-xs block">
                            12x de R$ {(config.setupFee / 12).toFixed(2).replace(".", ",")} (total R$ {config.setupFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                          </span>
                          <span className="text-white/50 text-[10px] block mt-0.5">
                            Após 12 meses: R$ {config.price.toFixed(2).replace(".", ",")}/mês
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-display font-bold text-3xl">R$ {config.price.toFixed(2).replace(".", ",")}</span>
                        <span className="text-white/70 text-sm">/mês</span>
                      </>
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
