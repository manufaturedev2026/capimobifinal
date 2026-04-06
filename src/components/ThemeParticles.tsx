import { useMemo } from "react";

interface ThemeParticlesProps {
  /** Primary color in hex, e.g. "#d4a853" */
  color: string;
  /** Optional secondary/glow color. Defaults to a slightly different shade of color */
  glowColor?: string;
  /** Number of particles (default 35) */
  count?: number;
}

export default function ThemeParticles({ color, glowColor, count = 35 }: ThemeParticlesProps) {
  const glow = glowColor || adjustBrightness(color, -20);

  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 8,
    size: 2 + Math.random() * 3,
    opacity: 0.2 + Math.random() * 0.5,
    drift: -30 + Math.random() * 60,
  })), [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      <style>{`
        @keyframes themeFloatUp {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: var(--tp-opacity); }
          90% { opacity: 0.3; }
          100% { transform: translateY(-100vh) translateX(var(--tp-drift)) scale(0.2); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: "-4px",
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, ${color} 0%, ${glow} 60%, transparent 100%)`,
            boxShadow: `0 0 ${p.size + 2}px ${color}80`,
            ["--tp-opacity" as any]: p.opacity,
            ["--tp-drift" as any]: `${p.drift}px`,
            animation: `themeFloatUp ${p.duration}s ${p.delay}s ease-in infinite`,
          }}
        />
      ))}
    </div>
  );
}

function adjustBrightness(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  const r = Math.min(255, Math.max(0, parseInt(c.substring(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(c.substring(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(c.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
