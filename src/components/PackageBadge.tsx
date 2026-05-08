import { Crown, Star, Zap, Building, Shield, Gem, Diamond } from "lucide-react";

interface PackageBadgeProps {
  tier: "start" | "basico" | "premium" | "prime" | "basico_empresa" | "essencial_empresa" | "premium_empresa" | "prime_empresa" | "fundador_corretor" | "fundador_empresa" | "fundador_construtora" | "imob_basico" | "imob_start" | "imob_pro" | "imob_elite" | "const_basico" | "const_start" | "const_pro" | "const_master";
  size?: "sm" | "md" | "lg";
}

const styles: Record<string, { bg: string; icon: any; label: string; labelFull?: string; glow?: string; anim?: string; shine?: boolean }> = {
  start: {
    bg: "bg-gradient-to-r from-emerald-500 to-teal-500",
    icon: Zap,
    label: "Start",
    anim: "animate-badge-glow-soft",
  },
  premium: {
    bg: "bg-gradient-to-r from-amber-500 to-orange-500",
    icon: Star,
    label: "Premium",
    glow: "shadow-amber-500/30",
    anim: "animate-badge-glow-soft",
    shine: true,
  },
  prime: {
    bg: "bg-gradient-to-r from-purple-600 to-indigo-600",
    icon: Crown,
    label: "Prime",
    glow: "shadow-purple-500/30",
    anim: "animate-badge-glow-strong",
    shine: true,
  },
  vip: {
    bg: "bg-gradient-to-r from-purple-600 to-indigo-600",
    icon: Crown,
    label: "Prime",
    glow: "shadow-purple-500/30",
    anim: "animate-badge-glow-strong",
    shine: true,
  },
  essencial_empresa: {
    bg: "bg-gradient-to-r from-rose-600 to-red-600",
    icon: Shield,
    label: "Exclusive",
    glow: "shadow-rose-500/30",
    anim: "animate-badge-glow-soft",
    shine: true,
  },
  premium_empresa: {
    bg: "bg-gradient-to-r from-sky-600 to-blue-700",
    icon: Gem,
    label: "Premium Empresa",
    glow: "shadow-sky-500/30",
    anim: "animate-badge-glow-soft",
    shine: true,
  },
  prime_empresa: {
    bg: "bg-gradient-to-r from-zinc-800 to-zinc-950",
    icon: Diamond,
    label: "Black",
    glow: "shadow-zinc-500/30",
    anim: "animate-badge-glow-strong",
    shine: true,
  },
  basico_empresa: {
    bg: "bg-slate-500",
    icon: Zap,
    label: "Básico Empresa",
  },
  fundador_corretor: {
    bg: "bg-gradient-to-r from-amber-500 to-orange-500",
    icon: Crown,
    label: "Fundador",
    glow: "shadow-amber-500/40",
    anim: "animate-badge-glow-strong",
    shine: true,
  },
  fundador_empresa: {
    bg: "bg-gradient-to-r from-amber-600 to-yellow-700",
    icon: Crown,
    label: "Fundador",
    labelFull: "Fundador Empresa",
    glow: "shadow-amber-500/40",
    anim: "animate-badge-glow-strong",
    shine: true,
  },
  fundador_construtora: {
    bg: "bg-gradient-to-r from-amber-600 to-yellow-700",
    icon: Crown,
    label: "Fundador",
    labelFull: "Fundador Construtora",
    glow: "shadow-amber-500/40",
    anim: "animate-badge-glow-strong",
    shine: true,
  },
  imob_basico: { bg: "bg-slate-500", icon: Building, label: "Imob Grátis" },
  imob_start: { bg: "bg-gradient-to-r from-emerald-500 to-teal-500", icon: Building, label: "Imob Start", anim: "animate-badge-glow-soft" },
  imob_pro: { bg: "bg-gradient-to-r from-amber-500 to-orange-500", icon: Building, label: "Imob Pro", glow: "shadow-amber-500/30", anim: "animate-badge-glow-soft", shine: true },
  imob_elite: { bg: "bg-gradient-to-r from-purple-600 to-indigo-600", icon: Crown, label: "Imob Elite", glow: "shadow-purple-500/30", anim: "animate-badge-glow-strong", shine: true },
  const_basico: { bg: "bg-slate-500", icon: Building, label: "Construtora Grátis" },
  const_start: { bg: "bg-gradient-to-r from-emerald-600 to-teal-700", icon: Building, label: "Construtora Start", anim: "animate-badge-glow-soft" },
  const_pro: { bg: "bg-gradient-to-r from-amber-500 to-orange-600", icon: Building, label: "Construtora Pro", glow: "shadow-amber-500/30", anim: "animate-badge-glow-soft", shine: true },
  const_master: { bg: "bg-gradient-to-r from-zinc-800 to-zinc-950", icon: Diamond, label: "Construtora Master", glow: "shadow-zinc-500/30", anim: "animate-badge-glow-strong", shine: true },
};

export default function PackageBadge({ tier, size = "sm" }: PackageBadgeProps) {
  if (tier === "basico" || tier === "basico_empresa" || tier === "imob_basico" || tier === "const_basico") return null;

  const config = styles[tier];
  if (!config) return null;
  const Icon = config.icon;

  const isFounder = tier.startsWith("fundador");

  const shineOverlay = config.shine ? (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] animate-badge-shine"
      style={{
        background:
          "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
        backgroundSize: "200% 100%",
        mixBlendMode: "overlay",
      }}
    />
  ) : null;

  if (size === "lg") {
    return (
      <span className={`relative overflow-hidden inline-flex items-center gap-2 ${config.bg} text-white font-bold rounded-xl px-4 py-2 text-sm shadow-lg ${config.glow || ""} ${config.anim || ""}`}>
        <Icon size={18} />
        <span className="relative z-10">{config.labelFull || config.label}</span>
        {shineOverlay}
      </span>
    );
  }

  const sizeClasses = size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-xs";

  // On mobile (sm), founder badges show only "Fundador" to avoid cropping
  if (isFounder && size === "sm") {
    return (
      <span className={`relative overflow-hidden inline-flex items-center ${config.bg} text-white font-bold rounded-md px-1.5 py-0.5 text-[9px] shadow-sm ${config.glow || ""} ${config.anim || ""}`}>
        <span className="relative z-10">Fundador</span>
        {shineOverlay}
      </span>
    );
  }

  return (
    <span className={`relative overflow-hidden inline-flex items-center gap-0.5 ${config.bg} text-white font-bold rounded-md ${sizeClasses} shadow-sm ${config.glow || ""} ${config.anim || ""}`}>
      <Icon size={size === "sm" ? 8 : 12} />
      <span className="relative z-10">{config.label}</span>
      {config.labelFull && <span className="relative z-10 hidden md:inline">&nbsp;{config.labelFull.replace(config.label, "").trim()}</span>}
      {shineOverlay}
    </span>
  );
}
