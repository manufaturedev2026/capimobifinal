import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, TrendingUp, Calendar, Flame, Zap, BarChart3, Trophy, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TOOL_LABELS: Record<string, string> = {
  monthly_plan_reset: "Créditos do plano",
  credit_purchase: "Compra de créditos",
  capture_ad_copy: "Texto de captação",
  property_valuation: "Avaliação IA",
  valuation_ad: "Anúncio da avaliação",
  photo_analysis: "Análise de fotos",
  platform_help_chat: "Assistente IA",
  capture_bot_chat: "Atendimento Bot Captação",
  agenda_bot_chat: "Atendimento Bot Agenda",
  invite_chat: "Atendimento Bot Convite",
};

type Tx = { id: string; tool_key: string; amount: number; created_at: string; transaction_type: string };

export default function AiCreditsUsageModal({
  open,
  onClose,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userId?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    if (!open || !userId) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - 31);
      const { data } = await (supabase as any)
        .from("ai_credit_transactions")
        .select("id, tool_key, amount, created_at, transaction_type")
        .eq("user_id", userId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);
      if (!cancel) {
        setTxs((data || []) as Tx[]);
        setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [open, userId]);

  const stats = useMemo(() => {
    // Only consumption (negative amounts)
    const consumption = txs.filter((t) => t.amount < 0);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const start7 = new Date(startToday);
    start7.setDate(start7.getDate() - 6);

    const used = (from: Date) =>
      consumption
        .filter((t) => new Date(t.created_at) >= from)
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    const usedToday = used(startToday);
    const used7 = used(start7);
    const usedMonth = used(startMonth);

    // Daily breakdown last 7 days
    const days: { label: string; date: Date; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startToday);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const total = consumption
        .filter((t) => {
          const ts = new Date(t.created_at);
          return ts >= d && ts < next;
        })
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);
      days.push({
        label: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        date: d,
        total,
      });
    }
    const maxDay = Math.max(1, ...days.map((d) => d.total));

    // Top tools (last 7 days)
    const toolMap: Record<string, number> = {};
    consumption
      .filter((t) => new Date(t.created_at) >= start7)
      .forEach((t) => {
        const key = t.tool_key || "outros";
        toolMap[key] = (toolMap[key] || 0) + Math.abs(t.amount);
      });
    const topTools = Object.entries(toolMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const avgDay = used7 / 7;

    return { usedToday, used7, usedMonth, days, maxDay, topTools, avgDay };
  }, [txs]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-primary/30 bg-gradient-to-br from-background via-background to-primary/5 shadow-2xl"
          >
            {/* Hero header */}
            <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-primary via-primary/90 to-accent p-6 md:p-8">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
              <div className="relative flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/80">Painel da IA</p>
                  <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-tight">
                    Seus créditos em ação
                  </h2>
                  <p className="text-white/80 text-sm mt-0.5">Veja como sua IA está trabalhando para você</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Carregando dados...</div>
            ) : (
              <div className="p-5 md:p-7 space-y-6">
                {/* Big stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      label: "Hoje",
                      value: stats.usedToday,
                      icon: Flame,
                      grad: "from-orange-500 to-red-500",
                      hint: "créditos usados",
                    },
                    {
                      label: "Últimos 7 dias",
                      value: stats.used7,
                      icon: TrendingUp,
                      grad: "from-primary to-accent",
                      hint: `média ${stats.avgDay.toFixed(1)}/dia`,
                    },
                    {
                      label: "Este mês",
                      value: stats.usedMonth,
                      icon: Calendar,
                      grad: "from-purple-500 to-pink-500",
                      hint: "consumo total",
                    },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="relative overflow-hidden rounded-2xl border border-border bg-card p-4"
                    >
                      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${s.grad} opacity-20 blur-2xl`} />
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-md mb-3`}>
                        <s.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                      <p className="font-display font-extrabold text-3xl text-foreground leading-tight mt-1">
                        {s.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.hint}</p>
                    </motion.div>
                  ))}
                </div>

                {/* 7 day chart */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-foreground">Consumo diário</h3>
                      <p className="text-[11px] text-muted-foreground">Últimos 7 dias</p>
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-2 h-40">
                    {stats.days.map((d, i) => {
                      const h = d.total === 0 ? 4 : Math.max(8, (d.total / stats.maxDay) * 100);
                      const isToday = i === stats.days.length - 1;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-[10px] font-bold text-foreground">{d.total}</span>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
                            className={`w-full rounded-t-lg ${
                              isToday
                                ? "bg-gradient-to-t from-primary to-accent shadow-lg shadow-primary/30"
                                : d.total > 0
                                ? "bg-gradient-to-t from-primary/60 to-primary/40"
                                : "bg-muted"
                            }`}
                          />
                          <span className={`text-[10px] font-medium ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                            {d.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top tools */}
                {stats.topTools.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-foreground">Ferramentas mais usadas</h3>
                        <p className="text-[11px] text-muted-foreground">Últimos 7 dias</p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {stats.topTools.map(([tool, total], i) => {
                        const pct = (total / stats.topTools[0][1]) * 100;
                        return (
                          <div key={tool}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                                  {i + 1}
                                </span>
                                {TOOL_LABELS[tool] || tool}
                              </span>
                              <span className="text-sm font-bold text-primary">{total}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: 0.2 + i * 0.06, duration: 0.6 }}
                                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer note */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3 border border-border">
                  <Activity className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>
                    Os créditos são renovados todo mês conforme seu plano. Compre créditos extras quando precisar de mais
                    poder de IA.
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
