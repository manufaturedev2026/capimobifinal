import { Crown, Star, Zap, Building, Shield, Gem, Diamond } from "lucide-react";

interface PackageBadgeProps {
  tier: "start" | "basico" | "premium" | "vip" | "basico_empresa" | "essencial_empresa" | "premium_empresa" | "prime_empresa";
  size?: "sm" | "md" | "lg";
}

const styles: Record<string, { bg: string; icon: any; label: string; glow?: string }> = {
  start: {
    bg: "bg-gradient-to-r from-emerald-500 to-teal-500",
    icon: Zap,
    label: "Start",
  },
  premium: {
    bg: "bg-gradient-to-r from-amber-500 to-orange-500",
    icon: Star,
    label: "VIP",
    glow: "shadow-amber-500/30",
  },
  vip: {
    bg: "bg-gradient-to-r from-purple-600 to-indigo-600",
    icon: Crown,
    label: "Premium",
    glow: "shadow-purple-500/30",
  },
  essencial_empresa: {
    bg: "bg-gradient-to-r from-rose-600 to-red-600",
    icon: Shield,
    label: "Exclusive",
    glow: "shadow-rose-500/30",
  },
  premium_empresa: {
    bg: "bg-gradient-to-r from-sky-600 to-blue-700",
    icon: Gem,
    label: "Prime",
    glow: "shadow-sky-500/30",
  },
  prime_empresa: {
    bg: "bg-gradient-to-r from-zinc-800 to-zinc-950",
    icon: Diamond,
    label: "Black",
    glow: "shadow-zinc-500/30",
  },
};

export default function PackageBadge({ tier, size = "sm" }: PackageBadgeProps) {
  if (tier === "basico") return null;

  const config = styles[tier];
  if (!config) return null;
  const Icon = config.icon;

  if (size === "lg") {
    return (
      <span className={`inline-flex items-center gap-2 ${config.bg} text-white font-bold rounded-xl px-4 py-2 text-sm shadow-lg ${config.glow || ""} animate-pulse-slow`}>
        <Icon size={18} />
        {config.label}
      </span>
    );
  }

  const sizeClasses = size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-xs";

  return (
    <span className={`inline-flex items-center gap-0.5 ${config.bg} text-white font-bold rounded-md ${sizeClasses} shadow-sm ${config.glow || ""}`}>
      <Icon size={size === "sm" ? 8 : 12} />
      {config.label}
    </span>
  );
}
