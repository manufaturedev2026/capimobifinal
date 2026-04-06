import { useMemo } from "react";

export default function LuxuryGoldDust() {
  const particles = useMemo(() => Array.from({ length: 35 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 8,
    size: 2 + Math.random() * 3,
    opacity: 0.2 + Math.random() * 0.5,
    drift: -30 + Math.random() * 60,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      <style>{`
        @keyframes goldFloatUp {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: var(--gd-opacity); }
          90% { opacity: 0.3; }
          100% { transform: translateY(-100vh) translateX(var(--gd-drift)) scale(0.2); opacity: 0; }
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
            background: `radial-gradient(circle, #d4a853 0%, #b8860b 60%, transparent 100%)`,
            boxShadow: `0 0 ${p.size + 2}px #d4a85380`,
            ["--gd-opacity" as any]: p.opacity,
            ["--gd-drift" as any]: `${p.drift}px`,
            animation: `goldFloatUp ${p.duration}s ${p.delay}s ease-in infinite`,
          }}
        />
      ))}
    </div>
  );
}
