import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useActiveSubscriptions } from "@/hooks/useActiveSubscriptions";
import { CalendarDays, Layers, Image as ImageIcon, HardDrive, Sparkles, Eye, Users, Plus } from "lucide-react";

function daysLeft(iso?: string | null) {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function fmt(n: number) {
  if (n >= 9999) return "Ilimitado";
  return n.toLocaleString("pt-BR");
}

export function ActivePlansPanel({ userId }: { userId?: string }) {
  const { subscriptions, aggregate, count, loading } = useActiveSubscriptions(userId);
  if (!userId || loading || count === 0) return null;

  return (
    <Card className="p-5 md:p-6 mb-8 border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background shadow-lg">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Seus planos vigentes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Você tem <strong>{count}</strong> {count === 1 ? "plano ativo" : "planos ativos"}. Os limites <strong>somam automaticamente</strong> e cada compra mantém sua própria validade.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          <Plus className="w-3 h-3 mr-1" /> Comprar mais um plano acumula
        </Badge>
      </div>

      {/* Lista de assinaturas vigentes */}
      <div className="space-y-2 mb-5">
        {subscriptions.map((s) => {
          const dl = daysLeft(s.expires_at);
          return (
            <div
              key={s.id}
              className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-lg bg-muted/40 border border-border/60"
            >
              <div className="flex items-center gap-3">
                <Badge className="bg-primary text-primary-foreground">{s.name || s.tier}</Badge>
                <span className="text-xs text-muted-foreground">
                  {s.billing_period === "annual" ? "Anual" : s.billing_period === "founder" ? "Fundador" : "Mensal"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" /> {fmt(s.max_items)} imóveis
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {fmt(s.ai_credits_per_month)} créditos IA
                </span>
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <CalendarDays className="w-3 h-3" />
                  {dl !== null ? `${dl} ${dl === 1 ? "dia restante" : "dias restantes"}` : "Sem expiração"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totais agregados */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-semibold">
          Total acumulado disponível
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat icon={<Layers className="w-4 h-4" />} label="Imóveis ativos" value={fmt(aggregate.max_items)} />
          <Stat icon={<ImageIcon className="w-4 h-4" />} label="Fotos / imóvel" value={fmt(aggregate.max_photos_per_listing)} hint="usa o maior" />
          <Stat icon={<Sparkles className="w-4 h-4" />} label="Créditos IA / mês" value={fmt(aggregate.ai_credits_per_month)} />
          <Stat icon={<HardDrive className="w-4 h-4" />} label="Storage" value={`${fmt(aggregate.storage_mb)} MB`} />
          <Stat icon={<Eye className="w-4 h-4" />} label="Visitas / mês" value={fmt(aggregate.monthly_visits_limit)} />
          <Stat icon={<Users className="w-4 h-4" />} label="Corretores" value={fmt(aggregate.max_team_members)} />
        </div>
      </div>
    </Card>
  );
}

function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-base font-bold">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}