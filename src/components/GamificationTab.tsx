import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Gift, Clock, CheckCircle2, Star, Flame, Eye, Zap, Sparkles, Target, Lock } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import StoreEffectsPicker from "@/components/StoreEffectsPicker";
import { useToast } from "@/hooks/use-toast";

interface GamificationTabProps {
  userId: string;
  sellerId: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function GamificationTab({ userId, sellerId }: GamificationTabProps) {
  const { achievements, activeRewards, stats, claimReward, loading } = useGamification(userId, sellerId);
  const { toast } = useToast();
  const [claiming, setClaiming] = useState<string | null>(null);

  const handleClaim = async (achievement: (typeof achievements)[0]) => {
    setClaiming(achievement.id);
    const result = await claimReward(achievement);
    if (result === "conflict") {
      toast({
        title: "Recompensa ativa",
        description: "Aguarde a recompensa atual expirar antes de ativar outra.",
        variant: "destructive",
      });
    } else if (result === true) {
      const dur = achievement.reward_duration_ms >= 3600000
        ? `${Math.round(achievement.reward_duration_ms / 3600000)} hora(s)`
        : `${Math.round(achievement.reward_duration_ms / 60000)} minutos`;
      toast({
        title: `🎉 Recompensa resgatada!`,
        description: `${achievement.reward_label} ativada por ${dur}!`,
      });
    } else {
      toast({ title: "Erro ao resgatar", variant: "destructive" });
    }
    setClaiming(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const completedCount = achievements.filter((a) => a.completed).length;
  const progressPercent = Math.round((completedCount / achievements.length) * 100);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl translate-y-8 -translate-x-8" />

        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Trophy size={28} className="text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-2xl text-foreground">Eventos & Conquistas</h2>
              <p className="text-sm text-muted-foreground">Complete missões e desbloqueie recompensas exclusivas</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Eye, value: stats.totalViews, label: "Visualizações", color: "text-primary" },
              { icon: Flame, value: stats.totalListings, label: "Anúncios", color: "text-accent" },
              { icon: Star, value: `${completedCount}/${achievements.length}`, label: "Conquistas", color: "text-primary" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="bg-card/80 backdrop-blur-sm rounded-xl p-4 text-center border border-border/50 hover:border-primary/30 transition-colors"
              >
                <stat.icon size={20} className={`mx-auto ${stat.color} mb-1.5`} />
                <p className="font-display font-black text-xl text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground font-medium">Progresso geral</span>
              <span className="font-display font-bold text-foreground">{progressPercent}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent animate-pulse" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Store Effects */}
      <StoreEffectsPicker userId={userId} sellerId={sellerId} />

      {/* Active Rewards */}
      <AnimatePresence>
        {activeRewards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-primary/20 rounded-2xl p-5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
            <div className="relative">
              <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                <Zap size={16} className="text-primary" /> Recompensas Ativas
              </h3>
              <div className="space-y-2">
                {activeRewards.map((r) => {
                  const expiresIn = Math.max(0, Math.ceil((new Date(r.expires_at).getTime() - Date.now()) / (1000 * 60)));
                  const timeLabel = expiresIn >= 60 ? `${Math.floor(expiresIn / 60)}h ${expiresIn % 60}min` : `${expiresIn}min`;
                  return (
                    <div key={r.id} className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-3.5 border border-primary/20">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-lg">
                        {(r.reward_type === "black_tag_24h" || r.reward_type === "black_tag_1h") ? "🏴" : "⭐"}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-foreground">
                          {(r.reward_type === "black_tag_24h" || r.reward_type === "black_tag_1h") ? "Tag Black Ativa" : "Destaque Ativo"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={10} /> Expira em {timeLabel}
                        </p>
                      </div>
                      <span className="text-xs bg-primary/15 text-primary px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                        <Sparkles size={10} /> ATIVO
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievements List */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display font-bold text-foreground mb-5 flex items-center gap-2">
          <Target size={18} className="text-accent" /> Missões & Recompensas
        </h3>
        <div className="space-y-3">
          {achievements.map((a, i) => {
            const progress = Math.min(100, Math.round((a.current / a.threshold) * 100));
            const canClaim = a.completed && !a.claimed;

            return (
              <motion.div
                key={a.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className={`group relative rounded-2xl p-4 transition-all duration-300 border ${
                  a.claimed
                    ? "border-primary/20 bg-primary/5"
                    : canClaim
                    ? "border-accent/40 bg-gradient-to-r from-accent/10 to-primary/10 shadow-lg shadow-accent/10 hover:shadow-xl hover:shadow-accent/15"
                    : "border-border hover:border-primary/20 hover:bg-secondary/30"
                }`}
              >
                {canClaim && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/5 to-primary/5 animate-pulse" />
                )}
                <div className="relative flex items-start gap-4">
                  <div className={`text-3xl w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    a.claimed ? "bg-primary/10" : canClaim ? "bg-accent/15" : "bg-secondary"
                  }`}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-display font-bold text-foreground">{a.title}</h4>
                      {a.claimed && <CheckCircle2 size={15} className="text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{a.description}</p>

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span className="font-medium">{a.current} / {a.threshold}</span>
                        <span className="font-bold">{progress}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                          className={`h-full rounded-full ${
                            a.completed
                              ? "bg-gradient-to-r from-primary to-accent"
                              : "bg-primary/60"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Reward label */}
                    <div className="mt-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                        a.reward_type === "black_tag_24h"
                          ? "bg-foreground text-background"
                          : "bg-accent/15 text-accent"
                      }`}>
                        <Gift size={10} /> {a.reward_label}
                      </span>
                    </div>
                  </div>

                  {/* Claim Button */}
                  <div className="flex-shrink-0 self-center">
                    {a.claimed ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 size={12} /> Resgatado
                      </span>
                    ) : canClaim ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleClaim(a)}
                        disabled={claiming === a.id}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-accent/25"
                      >
                        {claiming === a.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-foreground" />
                        ) : (
                          <span className="flex items-center gap-1.5"><Sparkles size={12} /> Resgatar</span>
                        )}
                      </motion.button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-2.5 py-1.5 rounded-lg">
                        <Lock size={10} /> Bloqueado
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-primary" /> Como funciona?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "01", title: "Complete missões", desc: "Publique anúncios, complete seu perfil e conquiste visualizações.", color: "from-primary/15 to-primary/5" },
            { step: "02", title: "Resgate recompensas", desc: "Ao completar uma missão, clique em \"Resgatar\" para ativar.", color: "from-accent/15 to-accent/5" },
            { step: "03", title: "Aproveite!", desc: "Use recompensas para destacar seus anúncios e vender mais!", color: "from-primary/15 to-accent/5" },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className={`bg-gradient-to-br ${item.color} rounded-xl p-4 border border-border/50`}
            >
              <span className="font-display font-black text-2xl text-primary/30">{item.step}</span>
              <h4 className="font-display font-bold text-sm text-foreground mt-1">{item.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
