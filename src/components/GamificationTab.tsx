import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Gift, Clock, CheckCircle2, Star, Flame, Eye, Zap } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import StoreEffectsPicker from "@/components/StoreEffectsPicker";
import { useToast } from "@/hooks/use-toast";

interface GamificationTabProps {
  userId: string;
  sellerId: string;
}

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
      {/* Header Stats */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Trophy size={24} className="text-white" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-foreground">Eventos & Conquistas</h2>
            <p className="text-sm text-muted-foreground">Complete missões e ganhe recompensas exclusivas</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card/60 backdrop-blur rounded-xl p-3 text-center">
            <Eye size={18} className="mx-auto text-blue-500 mb-1" />
            <p className="font-display font-bold text-lg text-foreground">{stats.totalViews}</p>
            <p className="text-[10px] text-muted-foreground">Visualizações</p>
          </div>
          <div className="bg-card/60 backdrop-blur rounded-xl p-3 text-center">
            <Flame size={18} className="mx-auto text-orange-500 mb-1" />
            <p className="font-display font-bold text-lg text-foreground">{stats.totalListings}</p>
            <p className="text-[10px] text-muted-foreground">Anúncios</p>
          </div>
          <div className="bg-card/60 backdrop-blur rounded-xl p-3 text-center">
            <Star size={18} className="mx-auto text-amber-500 mb-1" />
            <p className="font-display font-bold text-lg text-foreground">{completedCount}/{achievements.length}</p>
            <p className="text-[10px] text-muted-foreground">Conquistas</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progresso geral</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Active Rewards */}
      {activeRewards.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2">
            <Zap size={16} className="text-amber-500" /> Recompensas Ativas
          </h3>
          <div className="space-y-2">
            {activeRewards.map((r) => {
              const expiresIn = Math.max(0, Math.ceil((new Date(r.expires_at).getTime() - Date.now()) / (1000 * 60)));
              const timeLabel = expiresIn >= 60 ? `${Math.floor(expiresIn / 60)}h ${expiresIn % 60}min` : `${expiresIn}min`;
              return (
                <div key={r.id} className="flex items-center gap-3 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    {(r.reward_type === "black_tag_24h" || r.reward_type === "black_tag_1h") ? "🏴" : "⭐"}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">
                      {(r.reward_type === "black_tag_24h" || r.reward_type === "black_tag_1h") ? "Tag Black Ativa" : "Destaque Ativo"}
                    </p>
                    <p className="text-xs text-white/60 flex items-center gap-1">
                      <Clock size={10} /> Expira em {timeLabel}
                    </p>
                  </div>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-lg font-bold">ATIVO</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements List */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-4 flex items-center gap-2">
          <Gift size={16} className="text-purple-500" /> Missões & Recompensas
        </h3>
        <div className="space-y-3">
          <AnimatePresence>
            {achievements.map((a, i) => {
              const progress = Math.min(100, Math.round((a.current / a.threshold) * 100));
              const canClaim = a.completed && !a.claimed;

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border rounded-xl p-4 transition-all ${
                    a.claimed
                      ? "border-green-500/30 bg-green-500/5"
                      : canClaim
                      ? "border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/10"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{a.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-sm text-foreground">{a.title}</h4>
                        {a.claimed && <CheckCircle2 size={14} className="text-green-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>

                      {/* Progress */}
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>{a.current}/{a.threshold}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              a.completed ? "bg-green-500" : "bg-primary"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Reward label */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          a.reward_type === "black_tag_24h"
                            ? "bg-zinc-900 text-white"
                            : "bg-amber-500/20 text-amber-600"
                        }`}>
                          🎁 {a.reward_label}
                        </span>
                      </div>
                    </div>

                    {/* Claim Button */}
                    <div className="flex-shrink-0">
                      {a.claimed ? (
                        <span className="text-xs text-green-500 font-bold">Resgatado ✓</span>
                      ) : canClaim ? (
                        <button
                          onClick={() => handleClaim(a)}
                          disabled={claiming === a.id}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-lg animate-pulse"
                        >
                          {claiming === a.id ? "..." : "Resgatar!"}
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">🔒 Bloqueado</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display font-bold text-sm text-foreground mb-3">Como funciona?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="bg-secondary/50 rounded-xl p-3">
            <strong className="text-foreground">1. Complete missões</strong>
            <p className="mt-1">Publique anúncios, complete seu perfil e conquiste visualizações.</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3">
            <strong className="text-foreground">2. Resgate recompensas</strong>
            <p className="mt-1">Ao completar uma missão, clique em "Resgatar" para ativar sua recompensa.</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3">
            <strong className="text-foreground">3. Aproveite!</strong>
            <p className="mt-1">Recompensas duram 24h. Use-as para destacar seus anúncios!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
