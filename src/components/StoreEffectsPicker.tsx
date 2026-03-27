import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Clock, CloudRain, Zap, Wind, Flame, CloudFog, DollarSign, Egg, CircleDot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StoreEffectsPickerProps {
  userId: string;
  sellerId: string;
}

type EffectOption = {
  type: string;
  label: string;
  emoji: string;
  icon: React.ElementType;
  description: string;
  free?: boolean;
  oneTime?: boolean;
};

const EFFECTS: EffectOption[] = [
  { type: "chuva", label: "Chuva", emoji: "💧", icon: CloudRain, description: "Gotas de chuva caindo na sua loja" },
  { type: "raios", label: "Raios", emoji: "⚡", icon: Zap, description: "Raios iluminando a tela" },
  { type: "poeira", label: "Poeira", emoji: "🌫️", icon: CloudFog, description: "Partículas de poeira flutuando" },
  { type: "brasas", label: "Brasas", emoji: "🔥", icon: Flame, description: "Brasas quentes subindo" },
  { type: "vento", label: "Vento", emoji: "🍃", icon: Wind, description: "Folhas voando ao vento" },
  { type: "neblina", label: "Neblina", emoji: "☁️", icon: CloudFog, description: "Neblina envolvente" },
  { type: "fumaca", label: "Fumaça", emoji: "💨", icon: CloudFog, description: "Fumaça misteriosa" },
  { type: "dinheiro", label: "Dinheiro", emoji: "💵", icon: DollarSign, description: "Dinheiro caindo do céu" },
  { type: "pascoa", label: "Páscoa", emoji: "🥚", icon: Egg, description: "Ovos e coelhinhos de páscoa", free: true, oneTime: true },
];

export default function StoreEffectsPicker({ userId, sellerId }: StoreEffectsPickerProps) {
  const { toast } = useToast();
  const [activeEffect, setActiveEffect] = useState<any>(null);
  const [usedPascoa, setUsedPascoa] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  const fetchActiveEffect = async () => {
    const { data } = await supabase
      .from("store_effects")
      .select("*")
      .eq("seller_id", sellerId)
      .eq("is_active", true)
      .gte("expires_at", new Date().toISOString())
      .order("activated_at", { ascending: false })
      .limit(1);
    setActiveEffect(data && data.length > 0 ? data[0] : null);
  };

  const checkPascoaUsed = async () => {
    const { count } = await supabase
      .from("store_effects")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", sellerId)
      .eq("effect_type", "pascoa");
    setUsedPascoa((count || 0) > 0);
  };

  useEffect(() => {
    Promise.all([fetchActiveEffect(), checkPascoaUsed()]).then(() => setLoading(false));
    const interval = setInterval(fetchActiveEffect, 15000);
    return () => clearInterval(interval);
  }, [sellerId]);

  const activateEffect = async (effect: EffectOption) => {
    if (activeEffect) {
      toast({ title: "Efeito ativo!", description: "Cancele o efeito atual antes de ativar outro.", variant: "destructive" });
      return;
    }
    if (effect.oneTime && effect.type === "pascoa" && usedPascoa) {
      toast({ title: "Já utilizado", description: "O efeito Páscoa só pode ser usado uma vez.", variant: "destructive" });
      return;
    }

    setActivating(effect.type);
    const { error } = await supabase.from("store_effects").insert({
      seller_id: sellerId,
      user_id: userId,
      effect_type: effect.type,
      is_free: effect.free || false,
    } as any);

    if (error) {
      toast({ title: "Erro ao ativar efeito", variant: "destructive" });
    } else {
      toast({ title: `${effect.emoji} Efeito "${effect.label}" ativado!`, description: "Válido por 1 hora na sua loja." });
      await fetchActiveEffect();
      if (effect.type === "pascoa") setUsedPascoa(true);
    }
    setActivating(null);
  };

  const cancelEffect = async () => {
    if (!activeEffect) return;
    const { error } = await supabase
      .from("store_effects")
      .update({ is_active: false } as any)
      .eq("id", activeEffect.id);
    if (!error) {
      toast({ title: "Efeito cancelado" });
      setActiveEffect(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  }

  const expiresIn = activeEffect ? Math.max(0, Math.ceil((new Date(activeEffect.expires_at).getTime() - Date.now()) / (1000 * 60))) : 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-display font-bold text-sm text-foreground mb-4 flex items-center gap-2">
        <Sparkles size={16} className="text-purple-500" /> Efeitos Visuais na Loja
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Ative um efeito visual que será exibido na sua loja por <strong>1 hora</strong>. Apenas um efeito por vez.</p>

      {/* Active Effect */}
      <AnimatePresence>
        {activeEffect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{EFFECTS.find(e => e.type === activeEffect.effect_type)?.emoji || "✨"}</span>
                <div>
                  <p className="font-bold text-sm text-foreground">
                    {EFFECTS.find(e => e.type === activeEffect.effect_type)?.label || activeEffect.effect_type} ativo
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={10} /> Expira em {expiresIn}min
                  </p>
                </div>
              </div>
              <button
                onClick={cancelEffect}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors"
              >
                <X size={12} /> Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Effects Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {EFFECTS.map((effect) => {
          const isActive = activeEffect?.effect_type === effect.type;
          const isDisabled = !!activeEffect || (effect.oneTime && effect.type === "pascoa" && usedPascoa);
          const isActivating = activating === effect.type;

          return (
            <motion.button
              key={effect.type}
              whileHover={!isDisabled ? { scale: 1.03 } : {}}
              whileTap={!isDisabled ? { scale: 0.97 } : {}}
              onClick={() => !isDisabled && activateEffect(effect)}
              disabled={isDisabled || isActivating}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                isActive
                  ? "border-purple-500 bg-purple-500/10"
                  : isDisabled
                  ? "border-border bg-muted/50 opacity-50 cursor-not-allowed"
                  : "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
              }`}
            >
              <span className="text-2xl">{effect.emoji}</span>
              <span className="font-bold text-xs text-foreground">{effect.label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{effect.description}</span>
              {effect.free && (
                <span className="absolute top-1 right-1 text-[9px] bg-green-500/20 text-green-600 px-1.5 py-0.5 rounded-full font-bold">GRÁTIS</span>
              )}
              {effect.oneTime && usedPascoa && (
                <span className="absolute top-1 right-1 text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-bold">USADO</span>
              )}
              {isActivating && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
