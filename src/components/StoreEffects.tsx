import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StoreEffectsProps {
  sellerId: string;
}

type EffectType = "chuva" | "raios" | "poeira" | "brasas" | "vento" | "neblina" | "fumaca" | "dinheiro" | "pascoa";

const EFFECT_CONFIG: Record<EffectType, { emoji: string; count: number; speed: number; className: string }> = {
  chuva: { emoji: "💧", count: 40, speed: 1.2, className: "drop-shadow-[0_0_3px_rgba(59,130,246,0.5)]" },
  raios: { emoji: "⚡", count: 8, speed: 2.5, className: "drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" },
  poeira: { emoji: "🌫️", count: 25, speed: 3, className: "opacity-60" },
  brasas: { emoji: "🔥", count: 20, speed: 2, className: "drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]" },
  vento: { emoji: "🍃", count: 15, speed: 2.5, className: "" },
  neblina: { emoji: "☁️", count: 12, speed: 5, className: "opacity-40 blur-[1px]" },
  fumaca: { emoji: "💨", count: 18, speed: 3, className: "opacity-50" },
  dinheiro: { emoji: "💵", count: 25, speed: 2, className: "drop-shadow-[0_0_4px_rgba(34,197,94,0.5)]" },
  pascoa: { emoji: "🥚", count: 20, speed: 2.5, className: "" },
};

const PASCOA_EMOJIS = ["🥚", "🐰", "🐣", "🍫", "🌸"];

export default function StoreEffects({ sellerId }: StoreEffectsProps) {
  const [activeEffect, setActiveEffect] = useState<EffectType | null>(null);

  useEffect(() => {
    const fetchEffect = async () => {
      const { data } = await supabase
        .from("store_effects")
        .select("*")
        .eq("seller_id", sellerId)
        .eq("is_active", true)
        .gte("expires_at", new Date().toISOString())
        .order("activated_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setActiveEffect((data[0] as any).effect_type as EffectType);
      } else {
        setActiveEffect(null);
      }
    };
    fetchEffect();
    const interval = setInterval(fetchEffect, 30000);
    return () => clearInterval(interval);
  }, [sellerId]);

  const particles = useMemo(() => {
    if (!activeEffect || !EFFECT_CONFIG[activeEffect]) return [];
    const cfg = EFFECT_CONFIG[activeEffect];
    return Array.from({ length: cfg.count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * cfg.speed,
      duration: cfg.speed + Math.random() * 2,
      size: 14 + Math.random() * 14,
      emoji: activeEffect === "pascoa"
        ? PASCOA_EMOJIS[Math.floor(Math.random() * PASCOA_EMOJIS.length)]
        : cfg.emoji,
    }));
  }, [activeEffect]);

  if (!activeEffect || !EFFECT_CONFIG[activeEffect]) return null;

  const cfg = EFFECT_CONFIG[activeEffect];

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className={`absolute animate-[effectFall_linear_infinite] ${cfg.className}`}
          style={{
            left: `${p.left}%`,
            top: "-30px",
            fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
      <style>{`
        @keyframes effectFall {
          0% { transform: translateY(-30px) rotate(0deg); opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
