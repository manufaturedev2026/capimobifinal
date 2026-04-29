import { Link } from "react-router-dom";
import { Home, Camera, HardDrive, Sparkles, ArrowUpRight, Eye } from "lucide-react";
import { usePlanUsage, getUsagePercent, getUsageColor } from "@/hooks/usePlanUsage";

function formatStorage(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

function formatLimit(value: number): string {
  if (!value || value >= 9999) return "Ilimitado";
  return value.toLocaleString("pt-BR");
}

export default function PlanLimitsCard({ userId }: { userId?: string }) {
  const { usage, loading } = usePlanUsage(userId);

  if (loading || !usage) {
    return (
      <div className="rounded-2xl border bg-card p-5 animate-pulse h-48" />
    );
  }

  const items = [
    {
      icon: Home,
      label: "Anúncios ativos",
      used: usage.usage.active_items,
      limit: usage.limits.max_items,
      formatUsed: (n: number) => n.toLocaleString("pt-BR"),
      formatLimit,
    },
    {
      icon: Camera,
      label: "Fotos totais",
      used: usage.usage.total_photos,
      limit: usage.limits.max_items * usage.limits.max_photos_per_listing,
      formatUsed: (n: number) => n.toLocaleString("pt-BR"),
      formatLimit,
      hint: `máx ${usage.limits.max_photos_per_listing}/anúncio`,
    },
    {
      icon: HardDrive,
      label: "Storage",
      used: usage.usage.storage_mb,
      limit: usage.limits.storage_mb,
      formatUsed: formatStorage,
      formatLimit: formatStorage,
    },
    {
      icon: Sparkles,
      label: "Créditos IA restantes",
      used: usage.usage.ai_credits_balance,
      limit: usage.limits.ai_credits_per_month,
      formatUsed: (n: number) => n.toLocaleString("pt-BR"),
      formatLimit: (n: number) => `${n.toLocaleString("pt-BR")}/mês`,
      reverse: true,
    },
    {
      icon: Eye,
      label: "Visitas no mês",
      used: usage.usage.monthly_visits ?? 0,
      limit: usage.limits.monthly_visits_limit ?? 3000,
      formatUsed: (n: number) => n.toLocaleString("pt-BR"),
      formatLimit: (n: number) => `${n.toLocaleString("pt-BR")}/mês`,
      hint: "recomendado",
    },
  ];

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-extrabold text-lg text-foreground">Meus Limites</h3>
          <p className="text-xs text-muted-foreground">Plano <span className="font-semibold">{usage.plan_name}</span></p>
        </div>
        <Link
          to="/pacotes"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          Upgrade <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const Icon = item.icon;
          const percent = item.reverse
            ? getUsagePercent(Math.max(0, item.limit - item.used), item.limit)
            : getUsagePercent(item.used, item.limit);
          const displayPercent = item.reverse ? 100 - percent : percent;
          const color = item.reverse
            ? (item.used <= item.limit * 0.05 ? "bg-red-500" : item.used <= item.limit * 0.2 ? "bg-amber-500" : "bg-emerald-500")
            : getUsageColor(displayPercent);
          const isUnlimited = !item.limit || item.limit >= 9999;

          return (
            <div key={item.label}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <div className="flex items-center gap-2 text-foreground">
                  <Icon size={14} className="text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                  {item.hint && <span className="text-xs text-muted-foreground">({item.hint})</span>}
                </div>
                <span className="font-bold text-foreground tabular-nums">
                  {item.formatUsed(item.used)} <span className="text-muted-foreground font-normal">/ {item.formatLimit(item.limit)}</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all ${isUnlimited ? "bg-emerald-500" : color}`}
                  style={{ width: isUnlimited ? "8%" : `${displayPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}