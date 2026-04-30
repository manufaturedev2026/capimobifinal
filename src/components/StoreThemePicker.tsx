import { motion } from "framer-motion";
import { Check, Sun, Moon, Palette } from "lucide-react";
import { MARKETPLACE_THEMES } from "@/lib/marketplaceThemes";

export interface StoreTheme {
  id: string;
  name: string;
  icon: string;
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  primary: string;
  accent: string;
  border: string;
  preview: {
    heroBg: string;
    cardBg: string;
    btnBg: string;
    btnText: string;
  };
}

const BASE_STORE_THEMES: StoreTheme[] = [
  {
    id: "default",
    name: "Padrão",
    icon: "🎨",
    bg: "#f5f7fa",
    card: "#ffffff",
    text: "#0a1e3d",
    textMuted: "#6b7a8d",
    primary: "#00aeef",
    accent: "#d4708f",
    border: "#e5e8ec",
    preview: { heroBg: "linear-gradient(135deg, #002F6C, #00AEEF)", cardBg: "#ffffff", btnBg: "#00aeef", btnText: "#fff" },
  },
  {
    id: "dark",
    name: "Escuro",
    icon: "🌙",
    bg: "#0f1623",
    card: "#1a2236",
    text: "#e8ecf1",
    textMuted: "#7a8899",
    primary: "#00aeef",
    accent: "#d4708f",
    border: "#2a3448",
    preview: { heroBg: "linear-gradient(135deg, #0a0f1a, #1a2236)", cardBg: "#1a2236", btnBg: "#00aeef", btnText: "#fff" },
  },
  {
    id: "rose",
    name: "Rose Gold",
    icon: "🌸",
    bg: "#fdf2f4",
    card: "#ffffff",
    text: "#4a2030",
    textMuted: "#9b7082",
    primary: "#e8587a",
    accent: "#f5a0b8",
    border: "#f5d5dc",
    preview: { heroBg: "linear-gradient(135deg, #8b2252, #e8587a)", cardBg: "#ffffff", btnBg: "#e8587a", btnText: "#fff" },
  },
  {
    id: "emerald",
    name: "Esmeralda",
    icon: "🍀",
    bg: "#f0faf5",
    card: "#ffffff",
    text: "#0f3d2a",
    textMuted: "#5e8a74",
    primary: "#10b981",
    accent: "#6ee7b7",
    border: "#d0efe0",
    preview: { heroBg: "linear-gradient(135deg, #064e3b, #10b981)", cardBg: "#ffffff", btnBg: "#10b981", btnText: "#fff" },
  },
  {
    id: "ocean",
    name: "Oceano",
    icon: "🌊",
    bg: "#f0f5ff",
    card: "#ffffff",
    text: "#1a2744",
    textMuted: "#6478a0",
    primary: "#3b82f6",
    accent: "#93c5fd",
    border: "#d0dfff",
    preview: { heroBg: "linear-gradient(135deg, #1e3a5f, #3b82f6)", cardBg: "#ffffff", btnBg: "#3b82f6", btnText: "#fff" },
  },
  {
    id: "sunset",
    name: "Pôr do Sol",
    icon: "🌅",
    bg: "#fff8f0",
    card: "#ffffff",
    text: "#3d2010",
    textMuted: "#9a7560",
    primary: "#f97316",
    accent: "#fbbf24",
    border: "#fde0c0",
    preview: { heroBg: "linear-gradient(135deg, #7c2d12, #f97316, #fbbf24)", cardBg: "#ffffff", btnBg: "#f97316", btnText: "#fff" },
  },
  {
    id: "luxury",
    name: "Luxo",
    icon: "👑",
    bg: "#111111",
    card: "#1c1c1c",
    text: "#f0e6d3",
    textMuted: "#9a8a70",
    primary: "#d4a853",
    accent: "#f0d78c",
    border: "#333333",
    preview: { heroBg: "linear-gradient(135deg, #0a0a0a, #2a2010, #d4a853)", cardBg: "#1c1c1c", btnBg: "#d4a853", btnText: "#111" },
  },
  {
    id: "grape",
    name: "Uva",
    icon: "🍇",
    bg: "#f5f0ff",
    card: "#ffffff",
    text: "#2d1b4e",
    textMuted: "#7a5fa0",
    primary: "#8b5cf6",
    accent: "#c4b5fd",
    border: "#ddd0ff",
    preview: { heroBg: "linear-gradient(135deg, #3b0764, #8b5cf6)", cardBg: "#ffffff", btnBg: "#8b5cf6", btnText: "#fff" },
  },
  {
    id: "neon_pink",
    name: "Neon Pink",
    icon: "💖",
    bg: "#0d0d0d",
    card: "#1a1a1a",
    text: "#f0f0f0",
    textMuted: "#a080a0",
    primary: "#ff2d95",
    accent: "#ff6ec7",
    border: "#2a1a2a",
    preview: { heroBg: "linear-gradient(135deg, #1a0010, #330022, #ff2d95)", cardBg: "#1a1a1a", btnBg: "#ff2d95", btnText: "#fff" },
  },
  {
    id: "neon_cyan",
    name: "Neon Cyan",
    icon: "💎",
    bg: "#0a0a0f",
    card: "#121220",
    text: "#e8f0ff",
    textMuted: "#6080b0",
    primary: "#00f0ff",
    accent: "#00b8d4",
    border: "#1a2040",
    preview: { heroBg: "linear-gradient(135deg, #000820, #001a33, #00f0ff)", cardBg: "#121220", btnBg: "#00f0ff", btnText: "#000" },
  },
  {
    id: "neon_green",
    name: "Neon Lime",
    icon: "🟢",
    bg: "#0a0d0a",
    card: "#141a14",
    text: "#e0f0e0",
    textMuted: "#60a060",
    primary: "#39ff14",
    accent: "#7fff00",
    border: "#1a2a1a",
    preview: { heroBg: "linear-gradient(135deg, #001a00, #0a2f0a, #39ff14)", cardBg: "#141a14", btnBg: "#39ff14", btnText: "#000" },
  },
  {
    id: "neon_purple",
    name: "Neon Purple",
    icon: "🔮",
    bg: "#0d0a14",
    card: "#16102a",
    text: "#e8e0ff",
    textMuted: "#8070b0",
    primary: "#bf00ff",
    accent: "#9d4edd",
    border: "#2a1a40",
    preview: { heroBg: "linear-gradient(135deg, #0a0020, #1a0040, #bf00ff)", cardBg: "#16102a", btnBg: "#bf00ff", btnText: "#fff" },
  },
  {
    id: "neon_red",
    name: "Neon Red",
    icon: "🔴",
    bg: "#0a0a0a",
    card: "#1a1010",
    text: "#f0e0e0",
    textMuted: "#b06060",
    primary: "#ff1a1a",
    accent: "#ff4d4d",
    border: "#2a1515",
    preview: { heroBg: "linear-gradient(135deg, #1a0000, #330000, #ff1a1a)", cardBg: "#1a1010", btnBg: "#ff1a1a", btnText: "#fff" },
  },
];

/** Convert marketplace themes to store themes (for ones not already in base) */
function marketplaceToStoreTheme(mt: typeof MARKETPLACE_THEMES[number]): StoreTheme {
  const isLight = mt.primary === "#FBBF24" || mt.primary === "#F97316" || mt.primary === "#22D3EE" || mt.primary === "#39ff14" || mt.primary === "#38BDF8" || mt.primary === "#A3E635";
  return {
    id: `mp_${mt.id}`,
    name: mt.name,
    icon: mt.icon,
    bg: mt.darkBase,
    card: mt.cardBg,
    text: mt.text,
    textMuted: mt.textMuted,
    primary: mt.primary,
    accent: mt.promoAccent || mt.primary,
    border: mt.border,
    preview: {
      heroBg: mt.dashboardGradient,
      cardBg: mt.cardBg,
      btnBg: mt.primary,
      btnText: isLight ? "#000" : "#fff",
    },
  };
}

export const STORE_THEMES: StoreTheme[] = [
  ...BASE_STORE_THEMES,
  ...MARKETPLACE_THEMES.map(marketplaceToStoreTheme),
];

export function getStoreTheme(themeId: string | null | undefined): StoreTheme {
  return STORE_THEMES.find((t) => t.id === themeId) || STORE_THEMES[0];
}

/** Theme is locked for Básico tier (only default allowed). */
export function isThemeAllowed(themeId: string, tier: string): boolean {
  // Todos os temas liberados para todos os planos. Diferença entre planos = só limites numéricos.
  return true;
}

interface StoreThemePickerProps {
  selected: string;
  onChange: (themeId: string) => void;
  tier?: string;
  onLocked?: () => void;
}

export default function StoreThemePicker({ selected, onChange, tier = "premium", onLocked }: StoreThemePickerProps) {
  const isBasico = tier === "basico";
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Palette size={18} className="text-primary" />
        <h2 className="font-display font-bold text-foreground">Tema da Loja</h2>
        {isBasico && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/30">
            Upgrade para Start
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {isBasico
          ? "Plano Básico inclui apenas o tema Padrão. Faça upgrade para Start e desbloqueie todos os temas."
          : "Escolha o tema visual da sua loja. Os visitantes verão sua loja com essas cores."}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STORE_THEMES.map((theme) => {
          const isSelected = selected === theme.id;
          const allowed = isThemeAllowed(theme.id, tier);
          return (
            <motion.button
              key={theme.id}
              onClick={() => {
                if (allowed) onChange(theme.id);
                else onLocked?.();
              }}
              whileHover={allowed ? { scale: 1.03 } : undefined}
              whileTap={allowed ? { scale: 0.97 } : undefined}
              className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                isSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
              } ${!allowed ? "opacity-40 cursor-not-allowed grayscale" : ""}`}
            >
              {/* Mini preview */}
              <div className="flex flex-col">
                {/* Hero preview */}
                <div
                  className="h-12 w-full relative"
                  style={{ background: theme.preview.heroBg }}
                >
                  <div className="absolute bottom-1 left-2 flex items-center gap-1">
                    <div className="w-4 h-4 rounded-md" style={{ background: theme.preview.btnBg }} />
                    <div className="h-1.5 w-10 rounded-full bg-white/60" />
                  </div>
                </div>
                {/* Card preview */}
                <div className="p-2 space-y-1.5" style={{ background: theme.bg }}>
                  <div className="flex gap-1.5">
                    <div className="w-8 h-6 rounded" style={{ background: theme.preview.cardBg, border: `1px solid ${theme.border}` }} />
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 rounded-full w-3/4" style={{ background: theme.text, opacity: 0.7 }} />
                      <div className="h-1 rounded-full w-1/2" style={{ background: theme.textMuted, opacity: 0.5 }} />
                    </div>
                  </div>
                  <div
                    className="h-4 rounded-md flex items-center justify-center"
                    style={{ background: theme.preview.btnBg }}
                  >
                    <span className="text-[6px] font-bold" style={{ color: theme.preview.btnText }}>WhatsApp</span>
                  </div>
                </div>
              </div>

              {/* Selected check */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check size={12} className="text-primary-foreground" />
                </motion.div>
              )}

              {/* Label */}
              <div className="px-2 py-1.5 text-center border-t border-border bg-card">
                <span className="text-[10px] font-semibold text-foreground">{theme.icon} {theme.name}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Bigger preview */}
      {(() => {
        const theme = getStoreTheme(selected);
        return (
          <div className="mt-4 rounded-2xl overflow-hidden border border-border">
            <div className="text-[10px] font-bold text-muted-foreground px-3 py-1.5 bg-muted">
              Preview — {theme.icon} {theme.name}
            </div>
            <div style={{ background: theme.bg }} className="p-0">
              {/* Hero */}
              <div className="h-28 relative" style={{ background: theme.preview.heroBg }}>
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg" style={{ background: theme.primary, opacity: 0.8 }} />
                    <div>
                      <div className="h-2.5 w-24 rounded-full bg-white/90 mb-1" />
                      <div className="h-1.5 w-16 rounded-full bg-white/50" />
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <div className="h-5 px-3 rounded-md flex items-center" style={{ background: "#25d366" }}>
                      <span className="text-[7px] text-white font-bold">WhatsApp</span>
                    </div>
                    <div className="h-5 px-3 rounded-md flex items-center" style={{ background: theme.preview.btnBg }}>
                      <span className="text-[7px] font-bold" style={{ color: theme.preview.btnText }}>Compartilhar</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Cards grid */}
              <div className="p-3 grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg overflow-hidden" style={{ background: theme.preview.cardBg, border: `1px solid ${theme.border}` }}>
                    <div className="h-10" style={{ background: `${theme.primary}20` }} />
                    <div className="p-1.5 space-y-1">
                      <div className="h-1.5 rounded-full w-3/4" style={{ background: theme.text, opacity: 0.6 }} />
                      <div className="h-1 rounded-full w-1/2" style={{ background: theme.textMuted, opacity: 0.4 }} />
                      <div className="h-2 w-10 rounded" style={{ background: theme.primary, opacity: 0.8 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
