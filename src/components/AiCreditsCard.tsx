import { Coins, CreditCard, History, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAiCredits } from "@/hooks/useAiCredits";

const TOOL_LABELS: Record<string, string> = {
  monthly_plan_reset: "Créditos do plano",
  credit_purchase: "Compra de créditos",
  capture_ad_copy: "Texto de captação",
  property_valuation: "Avaliação IA",
  valuation_ad: "Anúncio da avaliação",
  photo_analysis: "Análise de fotos",
  platform_help_chat: "Assistente IA",
  capture_bot_chat: "Bot de captação",
  agenda_bot_chat: "Bot de agenda",
  invite_chat: "Bot de convite",
};

export default function AiCreditsCard({ userId, sellerId }: { userId?: string; sellerId?: string }) {
  const { toast } = useToast();
  const { balance, monthlyPlanCredits, transactions, loading, creditPriceCents } = useAiCredits(userId, sellerId);

  const handleBuyCredits = () => {
    toast({
      title: "Compra de créditos em preparação",
      description: "O saldo já está pronto. Falta ativar o pagamento para vender créditos a R$ 0,25 cada.",
    });
  };

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/10 -translate-y-1/2 translate-x-1/3" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Créditos IA</p>
            <div className="flex items-end gap-2">
              <span className="font-display text-3xl font-extrabold text-foreground">{loading ? "..." : balance}</span>
              <span className="pb-1 text-xs text-muted-foreground">disponíveis</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:min-w-[300px]">
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Limite do plano
            </div>
            <p className="font-bold text-foreground">{monthlyPlanCredits} créditos</p>
          </div>
          <Button onClick={handleBuyCredits} className="h-full rounded-xl">
            <CreditCard className="h-4 w-4" /> Comprar R$ {(creditPriceCents / 100).toFixed(2).replace(".", ",")}
          </Button>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="relative mt-4 rounded-xl border border-border bg-background/50 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <History className="h-3.5 w-3.5" /> Últimos usos
          </div>
          <div className="space-y-1.5">
            {transactions.slice(0, 4).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-muted-foreground">{TOOL_LABELS[tx.tool_key] || tx.notes || tx.tool_key}</span>
                <span className={tx.amount >= 0 ? "font-bold text-primary" : "font-bold text-destructive"}>
                  {tx.amount >= 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
