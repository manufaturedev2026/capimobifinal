import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, CloudRain, Zap, Wind, Flame, CloudFog, DollarSign, CircleDot, Star, Flower2, PartyPopper, Rainbow, Droplets } from "lucide-react";
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
};

const EFFECTS: EffectOption[] = [
  { type: "particulas", label: "Partículas", emoji: "✨", icon: Sparkles, description: "Partículas flutuando na cor do tema" },
  { type: "chuva", label: "Chuva", emoji: "💧", icon: CloudRain, description: "Gotas de chuva caindo na sua loja" },
  { type: "raios", label: "Raios", emoji: "⚡", icon: Zap, description: "Raios iluminando a tela" },
  { type: "poeira", label: "Poeira", emoji: "🌫️", icon: CloudFog, description: "Partículas de poeira flutuando" },
  { type: "brasas", label: "Brasas", emoji: "🔥", icon: Flame, description: "Brasas quentes subindo" },
  { type: "vento", label: "Vento", emoji: "🍃", icon: Wind, description: "Folhas voando ao vento" },
  { type: "neblina", label: "Neblina", emoji: "☁️", icon: CloudFog, description: "Neblina envolvente" },
  { type: "fumaca", label: "Fumaça", emoji: "💨", icon: CloudFog, description: "Fumaça misteriosa" },
  { type: "dinheiro", label: "Dinheiro", emoji: "💵", icon: DollarSign, description: "Dinheiro caindo do céu" },
  { type: "estrelas", label: "Estrelas Cadentes", emoji: "✨", icon: Star, description: "Estrelas cruzando o céu" },
  { type: "petalas", label: "Pétalas de Rosa", emoji: "🌸", icon: Flower2, description: "Pétalas voando ao vento" },
  { type: "confetti", label: "Confetti", emoji: "🎉", icon: PartyPopper, description: "Confete colorido em festa" },
  { type: "fogos", label: "Fogos de Artifício", emoji: "🎆", icon: Sparkles, description: "Fogos explodindo no céu" },
  { type: "aurora", label: "Aurora Boreal", emoji: "🌌", icon: Rainbow, description: "Luzes coloridas no topo" },
  { type: "bolhas", label: "Bolhas de Sabão", emoji: "🫧", icon: Droplets, description: "Bolhas flutuando pela tela" },
];

export default function StoreEffectsPicker({ userId, sellerId }: StoreEffectsPickerProps) {
  const { toast } = useToast();
  const [activeEffect, setActiveEffect] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  const fetchActiveEffect = async () => {
    const { data } = await supabase
      .from("store_effects")
      .select("*")
      .eq("seller_id", sellerId)
      .eq("is_active", true)
      .order("activated_at", { ascending: false })
      .limit(1);
    setActiveEffect(data && data.length > 0 ? data[0] : null);
  };

  useEffect(() => {
    fetchActiveEffect().then(() => setLoading(false));
    const interval = setInterval(fetchActiveEffect, 15000);
    return () => clearInterval(interval);
  }, [sellerId]);

  const activateEffect = async (effect: EffectOption) => {
    if (activeEffect) {
      toast({ title: "Efeito ativo!", description: "Desative o efeito atual antes de ativar outro.", variant: "destructive" });
      return;
    }

    setActivating(effect.type);
    const { error } = await supabase.from("store_effects").insert({
      seller_id: sellerId,
      user_id: userId,
      effect_type: effect.type,
      is_free: true,
    } as any);

    if (error) {
      toast({ title: "Erro ao ativar efeito", variant: "destructive" });
    } else {
      toast({ title: `${effect.emoji} Efeito "${effect.label}" ativado!`, description: "Ficará ativo até você desativar." });
      await fetchActiveEffect();
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
      toast({ title: "Efeito desativado" });
      setActiveEffect(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-display font-bold text-sm text-foreground mb-4 flex items-center gap-2">
        <Sparkles size={16} className="text-purple-500" /> Efeitos Visuais na Loja
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Ative um efeito visual na sua loja. Ele ficará ativo até você desativar. Apenas um efeito por vez.</p>

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
                  <p className="text-xs text-muted-foreground">Ativo permanentemente</p>
                </div>
              </div>
              <button
                onClick={cancelEffect}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors"
              >
                <X size={12} /> Desativar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Effects Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {EFFECTS.map((effect) => {
          const isActive = activeEffect?.effect_type === effect.type;
          const isDisabled = !!activeEffect;
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
