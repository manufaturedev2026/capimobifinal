import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, Crown, X, ArrowRight, Flame } from "lucide-react";
import heroImg from "@/assets/plan-limit-hero.jpg";
import { usePlanUsage, getUsagePercent } from "@/hooks/usePlanUsage";

interface Props {
  userId?: string;
  userName?: string;
  planName?: string;
  /** Limite percentual a partir do qual o popup aparece (default 80) */
  threshold?: number;
}

/**
 * Popup épico exibido quando o usuário se aproxima do limite do plano.
 * Mostra apenas 1x por dia por métrica (anúncios, fotos, storage, visitas).
 */
export default function PlanLimitWarningPopup({
  userId,
  userName,
  planName,
  threshold = 80,
}: Props) {
  const navigate = useNavigate();
  const { usage } = usePlanUsage(userId);
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState<{ label: string; used: number; limit: number; percent: number } | null>(null);

  useEffect(() => {
    if (!usage || !userId) return;

    const candidates = [
      {
        key: "items",
        label: "anúncios ativos",
        used: usage.usage.active_items,
        limit: usage.limits.max_items,
      },
      {
        key: "visits",
        label: "visitas mensais",
        used: usage.usage.monthly_visits,
        limit: usage.limits.monthly_visits_limit,
      },
      {
        key: "storage",
        label: "armazenamento",
        used: Math.round(usage.usage.storage_mb),
        limit: usage.limits.storage_mb,
      },
      {
        key: "credits",
        label: "créditos de IA",
        used: Math.max(0, usage.limits.ai_credits_per_month - usage.usage.ai_credits_balance),
        limit: usage.limits.ai_credits_per_month,
      },
    ];

    const triggered = candidates
      .map((c) => ({ ...c, percent: getUsagePercent(c.used, c.limit) }))
      .filter((c) => c.limit > 0 && c.limit < 9999 && c.percent >= threshold)
      .sort((a, b) => b.percent - a.percent)[0];

    if (!triggered) return;

    const today = new Date().toISOString().slice(0, 10);
    const storageKey = `plan_limit_popup:${userId}:${triggered.key}:${today}`;
    if (localStorage.getItem(storageKey)) return;

    setMetric(triggered);
    setOpen(true);
    localStorage.setItem(storageKey, "1");
  }, [usage, userId, threshold]);

  if (!open || !metric) return null;

  const firstName = (userName || "").split(" ")[0] || "Você";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-card shadow-[0_30px_120px_-20px_rgba(0,0,0,0.7)] border border-white/10"
          >
            {/* Hero com imagem */}
            <div className="relative h-56 sm:h-72 overflow-hidden">
              <img
                src={heroImg}
                alt="Seu negócio crescendo"
                className="absolute inset-0 w-full h-full object-cover"
                width={1280}
                height={768}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-orange-600/30 mix-blend-overlay" />

              {/* Botão fechar */}
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Badge percentual flutuante */}
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", damping: 12 }}
                className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-white font-bold shadow-xl"
              >
                <Flame className="h-4 w-4" />
                <span className="text-sm">{metric.percent}% usado</span>
              </motion.div>

              {/* Sparkles decorativos */}
              <Sparkles className="absolute top-10 right-16 h-6 w-6 text-amber-300 animate-pulse" />
              <Sparkles className="absolute bottom-20 left-20 h-4 w-4 text-yellow-200 animate-pulse" style={{ animationDelay: "0.5s" }} />
            </div>

            {/* Conteúdo */}
            <div className="relative px-6 sm:px-10 pb-8 -mt-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Seus negócios estão decolando
                </div>

                <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-foreground leading-tight mb-3">
                  {firstName}, você está chegando<br />
                  no <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">limite do seu plano!</span>
                </h2>

                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-2">
                  Você já usou <strong className="text-foreground">{metric.used} de {metric.limit}</strong> {metric.label} do plano{" "}
                  {planName && <strong className="text-foreground">{planName}</strong>}.
                </p>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-6">
                  Isso é um ótimo sinal — significa que seus negócios estão indo <strong className="text-foreground">muito bem</strong>! 🚀
                  Não fique limitado: faça upgrade e desbloqueie todo seu potencial.
                </p>

                {/* Barra de progresso */}
                <div className="max-w-md mx-auto mb-6">
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.percent}%` }}
                      transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full"
                    />
                  </div>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate("/planos");
                    }}
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold text-base shadow-[0_10px_40px_-10px_rgba(251,146,60,0.6)] hover:shadow-[0_15px_50px_-10px_rgba(251,146,60,0.8)] hover:scale-[1.02] transition-all"
                  >
                    <Crown className="h-5 w-5" />
                    Fazer Upgrade Agora
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="px-6 py-4 rounded-2xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm font-medium"
                  >
                    Lembrar depois
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
