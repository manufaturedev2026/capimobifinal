import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StoreEffectsProps {
  sellerId: string;
}

type EffectType = "chuva" | "raios" | "poeira" | "brasas" | "vento" | "neblina" | "fumaca" | "dinheiro" | "particulas" | "estrelas" | "petalas" | "confetti" | "fogos" | "aurora" | "bolhas";

export default function StoreEffects({ sellerId }: StoreEffectsProps) {
  const [activeEffect, setActiveEffect] = useState<EffectType | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchEffect = async () => {
      try {
        const { data } = await supabase
          .from("store_effects")
          .select("*")
          .eq("seller_id", sellerId)
          .eq("is_active", true)
          .order("activated_at", { ascending: false })
          .limit(1);
        if (mounted) setActiveEffect(data && data.length > 0 ? (data[0] as any).effect_type as EffectType : null);
      } catch {
        // silently ignore network errors
      }
    };
    fetchEffect();
    // Refetch only when tab becomes visible again (saves Cloud reads on idle tabs)
    const onVisible = () => { if (document.visibilityState === "visible") fetchEffect(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { mounted = false; document.removeEventListener("visibilitychange", onVisible); };
  }, [sellerId]);

  // Show for 5 seconds then hide, repeat every 30s
  useEffect(() => {
    if (!activeEffect) { setVisible(false); return; }
    setVisible(true);
    const hideTimer = setTimeout(() => setVisible(false), 5000);
    const loopInterval = setInterval(() => {
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }, 30000);
    return () => { clearTimeout(hideTimer); clearInterval(loopInterval); };
  }, [activeEffect]);

  if (!activeEffect || !visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden animate-[effectFadeOut_5s_ease-in-out_forwards]">
      {activeEffect === "chuva" && <RainEffect />}
      {activeEffect === "raios" && <LightningEffect />}
      {activeEffect === "poeira" && <DustEffect />}
      {activeEffect === "brasas" && <EmbersEffect />}
      {activeEffect === "vento" && <WindEffect />}
      {activeEffect === "neblina" && <FogEffect />}
      {activeEffect === "fumaca" && <SmokeEffect />}
      {activeEffect === "dinheiro" && <MoneyEffect />}
      {activeEffect === "estrelas" && <ShootingStarsEffect />}
      {activeEffect === "petalas" && <PetalsEffect />}
      {activeEffect === "confetti" && <ConfettiEffect />}
      {activeEffect === "fogos" && <FireworksEffect />}
      {activeEffect === "aurora" && <AuroraEffect />}
      {activeEffect === "bolhas" && <BubblesEffect />}
      <style>{`
        @keyframes effectFadeOut {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ═══════════ CHUVA ═══════════ */
function RainEffect() {
  const drops = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 0.4 + Math.random() * 0.4,
    width: 1 + Math.random() * 1.5,
    height: 15 + Math.random() * 25,
    opacity: 0.2 + Math.random() * 0.4,
  })), []);

  return (
    <>
      {drops.map(d => (
        <div
          key={d.id}
          className="absolute rounded-full"
          style={{
            left: `${d.left}%`,
            top: "-40px",
            width: `${d.width}px`,
            height: `${d.height}px`,
            background: `linear-gradient(to bottom, transparent, rgba(150,200,255,${d.opacity}))`,
            animation: `rainDrop ${d.duration}s linear ${d.delay}s infinite`,
          }}
        />
      ))}
      {/* Splash overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-blue-400/5 to-transparent" />
      <style>{`
        @keyframes rainDrop {
          0% { transform: translateY(-40px) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(105vh) translateX(-20px); opacity: 0; }
        }
      `}</style>
    </>
  );
}

/* ═══════════ RAIOS ═══════════ */
function LightningEffect() {
  const [flash, setFlash] = useState(false);
  const [bolt, setBolt] = useState<{ left: number; path: string } | null>(null);

  useEffect(() => {
    const strike = () => {
      const left = 10 + Math.random() * 80;
      const segments = 5 + Math.floor(Math.random() * 4);
      let path = `M ${left} 0`;
      let x = left, y = 0;
      for (let i = 0; i < segments; i++) {
        x += (Math.random() - 0.5) * 12;
        y += (100 / segments);
        path += ` L ${x} ${y}`;
      }
      setBolt({ left, path });
      setFlash(true);
      setTimeout(() => setFlash(false), 100);
      setTimeout(() => {
        setFlash(true);
        setTimeout(() => setFlash(false), 60);
      }, 150);
      setTimeout(() => setBolt(null), 400);
    };

    const loop = () => {
      strike();
      const next = 2000 + Math.random() * 5000;
      return setTimeout(() => { const id = loop(); return id; }, next);
    };
    const id = loop();
    return () => clearTimeout(id);
  }, []);

  return (
    <>
      {flash && <div className="absolute inset-0 bg-white/15 transition-none" />}
      {bolt && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d={bolt.path}
            fill="none"
            stroke="rgba(200,220,255,0.9)"
            strokeWidth="0.4"
            filter="url(#glow)"
            className="animate-[boltFade_0.4s_ease-out_forwards]"
          />
          <path
            d={bolt.path}
            fill="none"
            stroke="white"
            strokeWidth="0.15"
            className="animate-[boltFade_0.4s_ease-out_forwards]"
          />
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
        </svg>
      )}
      <style>{`
        @keyframes boltFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}

/* ═══════════ POEIRA ═══════════ */
function DustEffect() {
  const particles = useMemo(() => Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 5,
    opacity: 0.15 + Math.random() * 0.25,
    driftX: (Math.random() - 0.5) * 60,
    driftY: (Math.random() - 0.5) * 40,
  })), []);

  return (
    <>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, rgba(200,180,150,${p.opacity}), transparent)`,
            animation: `dustFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
            "--dx": `${p.driftX}px`,
            "--dy": `${p.driftY}px`,
          } as any}
        />
      ))}
      <style>{`
        @keyframes dustFloat {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(var(--dx), var(--dy)) scale(1.2); opacity: 0.5; }
          50% { transform: translate(calc(var(--dx) * -0.5), calc(var(--dy) * 0.7)) scale(0.9); opacity: 0.2; }
          75% { transform: translate(calc(var(--dx) * 0.8), calc(var(--dy) * -0.4)) scale(1.1); opacity: 0.4; }
        }
      `}</style>
    </>
  );
}

/* ═══════════ BRASAS ═══════════ */
function EmbersEffect() {
  const embers = useMemo(() => Array.from({ length: 35 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 3 + Math.random() * 5,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 4,
    sway: (Math.random() - 0.5) * 80,
    hue: 10 + Math.random() * 30,
  })), []);

  return (
    <>
      {embers.map(e => (
        <div
          key={e.id}
          className="absolute rounded-full"
          style={{
            left: `${e.left}%`,
            bottom: "-10px",
            width: `${e.size}px`,
            height: `${e.size}px`,
            background: `radial-gradient(circle, hsla(${e.hue},100%,60%,0.9), hsla(${e.hue},100%,40%,0.3), transparent)`,
            boxShadow: `0 0 ${e.size * 2}px hsla(${e.hue},100%,50%,0.4)`,
            animation: `emberRise ${e.duration}s ease-out ${e.delay}s infinite`,
            "--sway": `${e.sway}px`,
          } as any}
        />
      ))}
      <style>{`
        @keyframes emberRise {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 1; }
          30% { opacity: 1; }
          100% { transform: translateY(-105vh) translateX(var(--sway)) scale(0.2); opacity: 0; }
        }
      `}</style>
    </>
  );
}

/* ═══════════ VENTO ═══════════ */
function WindEffect() {
  const leaves = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    top: Math.random() * 80,
    size: 8 + Math.random() * 12,
    duration: 3 + Math.random() * 3,
    delay: Math.random() * 5,
    rotation: Math.random() * 720,
    yDrift: (Math.random() - 0.5) * 100,
    hue: [100, 120, 50, 30][Math.floor(Math.random() * 4)],
    sat: 40 + Math.random() * 40,
  })), []);

  return (
    <>
      {leaves.map(l => (
        <div
          key={l.id}
          className="absolute"
          style={{
            right: "-30px",
            top: `${l.top}%`,
            width: `${l.size}px`,
            height: `${l.size * 0.6}px`,
            borderRadius: "50% 0 50% 0",
            background: `hsla(${l.hue},${l.sat}%,40%,0.7)`,
            animation: `leafBlow ${l.duration}s ease-in-out ${l.delay}s infinite`,
            "--rot": `${l.rotation}deg`,
            "--yDrift": `${l.yDrift}px`,
          } as any}
        />
      ))}
      {/* Wind streaks */}
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={`streak-${i}`}
          className="absolute"
          style={{
            right: "-100px",
            top: `${10 + Math.random() * 70}%`,
            width: `${60 + Math.random() * 100}px`,
            height: "1px",
            background: "linear-gradient(to left, transparent, rgba(200,200,200,0.15), transparent)",
            animation: `windStreak ${1.5 + Math.random() * 1.5}s linear ${Math.random() * 3}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes leafBlow {
          0% { transform: translateX(0) translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.6; }
          100% { transform: translateX(-110vw) translateY(var(--yDrift)) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes windStreak {
          0% { transform: translateX(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(-110vw); opacity: 0; }
        }
      `}</style>
    </>
  );
}

/* ═══════════ NEBLINA ═══════════ */
function FogEffect() {
  const layers = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
    id: i,
    top: 15 + i * 15 + Math.random() * 10,
    duration: 15 + Math.random() * 10,
    delay: Math.random() * 8,
    opacity: 0.06 + Math.random() * 0.08,
    height: 20 + Math.random() * 15,
    direction: i % 2 === 0 ? 1 : -1,
  })), []);

  return (
    <>
      {layers.map(l => (
        <div
          key={l.id}
          className="absolute w-[200%]"
          style={{
            top: `${l.top}%`,
            left: l.direction === 1 ? "-100%" : "0",
            height: `${l.height}%`,
            background: `radial-gradient(ellipse 80% 50% at center, rgba(200,210,220,${l.opacity * 3}), transparent)`,
            filter: "blur(30px)",
            animation: `fogDrift${l.direction === 1 ? "R" : "L"} ${l.duration}s ease-in-out ${l.delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes fogDriftR {
          0% { transform: translateX(0); }
          100% { transform: translateX(50%); }
        }
        @keyframes fogDriftL {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </>
  );
}

/* ═══════════ FUMAÇA ═══════════ */
function SmokeEffect() {
  const puffs = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: 20 + Math.random() * 60,
    size: 80 + Math.random() * 120,
    duration: 6 + Math.random() * 5,
    delay: Math.random() * 6,
    drift: (Math.random() - 0.5) * 100,
  })), []);

  return (
    <>
      {puffs.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: "-50px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, rgba(120,120,120,0.12), rgba(100,100,100,0.04), transparent)`,
            filter: "blur(20px)",
            animation: `smokeRise ${p.duration}s ease-out ${p.delay}s infinite`,
            "--drift": `${p.drift}px`,
          } as any}
        />
      ))}
      <style>{`
        @keyframes smokeRise {
          0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
          20% { opacity: 0.6; }
          100% { transform: translateY(-110vh) translateX(var(--drift)) scale(2.5); opacity: 0; }
        }
      `}</style>
    </>
  );
}

/* ═══════════ DINHEIRO ═══════════ */
function MoneyEffect() {
  const bills = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    duration: 3 + Math.random() * 3,
    delay: Math.random() * 4,
    rotation: Math.random() * 360,
    sway: (Math.random() - 0.5) * 60,
    size: 18 + Math.random() * 14,
  })), []);

  return (
    <>
      {bills.map(b => (
        <div
          key={b.id}
          className="absolute"
          style={{
            left: `${b.left}%`,
            top: "-40px",
            width: `${b.size}px`,
            height: `${b.size * 0.45}px`,
            borderRadius: "2px",
            background: "linear-gradient(135deg, #2d8b4e, #45b36b, #3a9e5c)",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "inset 0 0 4px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.15)",
            animation: `moneyFall ${b.duration}s ease-in-out ${b.delay}s infinite`,
            "--sway": `${b.sway}px`,
            "--rot": `${b.rotation}deg`,
          } as any}
        >
          <div
            className="absolute inset-0 flex items-center justify-center font-bold text-white/50"
            style={{ fontSize: `${b.size * 0.3}px` }}
          >
            $
          </div>
        </div>
      ))}
      <style>{`
        @keyframes moneyFall {
          0% { transform: translateY(-40px) translateX(0) rotateX(0) rotateY(0) rotate(0); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(50vh) translateX(var(--sway)) rotateX(180deg) rotateY(90deg) rotate(var(--rot)); }
          85% { opacity: 0.8; }
          100% { transform: translateY(105vh) translateX(calc(var(--sway) * -0.5)) rotateX(360deg) rotateY(180deg) rotate(calc(var(--rot) * 2)); opacity: 0; }
        }
      `}</style>
    </>
  );
}

/* ═══════════ ESTRELAS CADENTES ═══════════ */
function ShootingStarsEffect() {
  const stars = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    id: i,
    top: 5 + Math.random() * 40,
    left: Math.random() * 80,
    duration: 1 + Math.random() * 1.5,
    delay: Math.random() * 6,
    length: 80 + Math.random() * 120,
    angle: 25 + Math.random() * 20,
  })), []);

  return (
    <>
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.length}px`,
            height: "2px",
            background: "linear-gradient(to right, transparent, rgba(255,255,255,0.1), rgba(255,255,255,0.8), white)",
            borderRadius: "2px",
            transform: `rotate(${s.angle}deg)`,
            boxShadow: "0 0 6px rgba(255,255,255,0.6), 0 0 12px rgba(200,220,255,0.3)",
            animation: `shootingStar ${s.duration}s ease-in ${s.delay}s infinite`,
          }}
        >
          {/* Head glow */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: "6px",
              height: "6px",
              background: "white",
              boxShadow: "0 0 10px 4px rgba(200,220,255,0.8), 0 0 20px 8px rgba(150,180,255,0.3)",
            }}
          />
        </div>
      ))}
      {/* Background twinkle stars */}
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={`twinkle-${i}`}
          className="absolute rounded-full"
          style={{
            top: `${Math.random() * 60}%`,
            left: `${Math.random() * 100}%`,
            width: "2px",
            height: "2px",
            background: "white",
            boxShadow: "0 0 4px rgba(255,255,255,0.5)",
            animation: `twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 3}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes shootingStar {
          0% { transform: rotate(var(--angle, 30deg)) translateX(0); opacity: 0; }
          5% { opacity: 1; }
          30% { opacity: 1; }
          100% { transform: rotate(var(--angle, 30deg)) translateX(300px); opacity: 0; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </>
  );
}

/* ═══════════ PÉTALAS DE ROSA ═══════════ */
function PetalsEffect() {
  const petals = useMemo(() => Array.from({ length: 25 }, (_, i) => {
    const pinks = [
      ["#ffb6c1", "#ff69b4"],
      ["#ffc0cb", "#ff85a2"],
      ["#f8a4c8", "#e75480"],
      ["#ffcce5", "#ff99cc"],
      ["#ffd6e7", "#ffadd2"],
    ];
    const color = pinks[Math.floor(Math.random() * pinks.length)];
    return {
      id: i,
      left: Math.random() * 100,
      size: 10 + Math.random() * 12,
      duration: 4 + Math.random() * 4,
      delay: Math.random() * 5,
      sway: (Math.random() - 0.5) * 120,
      rotation: Math.random() * 540,
      color1: color[0],
      color2: color[1],
      wobble: 2 + Math.random() * 3,
    };
  }), []);

  return (
    <>
      {petals.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: "-20px",
            width: `${p.size}px`,
            height: `${p.size * 0.7}px`,
            borderRadius: "50% 0 50% 0",
            background: `linear-gradient(135deg, ${p.color1}, ${p.color2})`,
            boxShadow: `inset -1px -1px 3px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.05)`,
            animation: `petalFall ${p.duration}s ease-in-out ${p.delay}s infinite`,
            "--sway": `${p.sway}px`,
            "--rot": `${p.rotation}deg`,
            "--wobble": `${p.wobble}s`,
          } as any}
        >
          {/* Vein line */}
          <div className="absolute" style={{
            top: "50%",
            left: "20%",
            width: "60%",
            height: "1px",
            background: `linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)`,
            transform: "rotate(-10deg)",
          }} />
        </div>
      ))}
      <style>{`
        @keyframes petalFall {
          0% { transform: translateY(-20px) translateX(0) rotate(0) scale(1); opacity: 0; }
          10% { opacity: 0.9; }
          25% { transform: translateY(25vh) translateX(calc(var(--sway) * 0.5)) rotate(calc(var(--rot) * 0.3)) scale(0.95); }
          50% { transform: translateY(50vh) translateX(var(--sway)) rotate(calc(var(--rot) * 0.6)) scale(1.05); }
          75% { transform: translateY(75vh) translateX(calc(var(--sway) * 0.3)) rotate(calc(var(--rot) * 0.8)) scale(0.9); opacity: 0.7; }
          100% { transform: translateY(105vh) translateX(calc(var(--sway) * -0.2)) rotate(var(--rot)) scale(0.8); opacity: 0; }
        }
      `}</style>
    </>
  );
}

/* ═══════════ CONFETTI ═══════════ */
function ConfettiEffect() {
  const pieces = useMemo(() => Array.from({ length: 50 }, (_, i) => {
    const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bcb", "#ff9f43", "#a55eea", "#0abde3", "#ee5a24", "#10ac84"];
    return {
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      width: 6 + Math.random() * 6,
      height: 4 + Math.random() * 8,
      duration: 2.5 + Math.random() * 3,
      delay: Math.random() * 4,
      sway: (Math.random() - 0.5) * 80,
      rotX: Math.random() * 720,
      rotY: Math.random() * 720,
      rotZ: Math.random() * 360,
      shape: Math.floor(Math.random() * 3), // 0=rect, 1=circle, 2=strip
    };
  }), []);

  return (
    <>
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: "-20px",
            width: `${p.width}px`,
            height: p.shape === 2 ? `${p.height * 2}px` : `${p.height}px`,
            borderRadius: p.shape === 1 ? "50%" : p.shape === 2 ? "1px" : "1px",
            background: p.color,
            boxShadow: `0 1px 3px rgba(0,0,0,0.15)`,
            animation: `confettiFall ${p.duration}s ease-in-out ${p.delay}s infinite`,
            "--sway": `${p.sway}px`,
            "--rx": `${p.rotX}deg`,
            "--ry": `${p.rotY}deg`,
            "--rz": `${p.rotZ}deg`,
          } as any}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) translateX(0) rotateX(0) rotateY(0) rotateZ(0); opacity: 0; }
          8% { opacity: 1; }
          25% { transform: translateY(25vh) translateX(calc(var(--sway) * 0.6)) rotateX(calc(var(--rx) * 0.3)) rotateY(calc(var(--ry) * 0.3)) rotateZ(calc(var(--rz) * 0.3)); }
          50% { transform: translateY(50vh) translateX(var(--sway)) rotateX(calc(var(--rx) * 0.6)) rotateY(calc(var(--ry) * 0.6)) rotateZ(calc(var(--rz) * 0.6)); }
          75% { opacity: 0.8; }
          100% { transform: translateY(105vh) translateX(calc(var(--sway) * -0.3)) rotateX(var(--rx)) rotateY(var(--ry)) rotateZ(var(--rz)); opacity: 0; }
        }
      `}</style>
    </>
  );
}

/* ── Fireworks Effect ── */
function FireworksEffect() {
  const fireworks = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const cx = 15 + Math.random() * 70;
    const cy = 15 + Math.random() * 50;
    const colors = ["#ff4444", "#ffaa00", "#44ff44", "#4488ff", "#ff44ff", "#ffff44", "#00ffcc", "#ff6622"];
    const color = colors[i % colors.length];
    const particles = Array.from({ length: 24 }, (_, j) => {
      const angle = (j / 24) * Math.PI * 2;
      const dist = 60 + Math.random() * 80;
      return {
        id: j,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        size: 2 + Math.random() * 3,
      };
    });
    return { id: i, cx, cy, color, delay: i * 0.5 + Math.random() * 0.5, particles };
  }), []);

  return (
    <>
      {fireworks.map(fw => (
        <div key={fw.id} className="absolute" style={{ left: `${fw.cx}%`, top: `${fw.cy}%` }}>
          {/* Trail going up */}
          <div
            className="absolute w-[2px] bg-white/80"
            style={{
              left: "0",
              bottom: "0",
              height: "0",
              animation: `fwTrail 0.4s ease-out ${fw.delay}s forwards`,
              boxShadow: `0 0 4px ${fw.color}`,
            }}
          />
          {/* Explosion particles */}
          {fw.particles.map(p => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: fw.color,
                boxShadow: `0 0 6px ${fw.color}, 0 0 12px ${fw.color}80`,
                animation: `fwBurst 1.2s ease-out ${fw.delay + 0.4}s forwards`,
                "--dx": `${p.dx}px`,
                "--dy": `${p.dy}px`,
                opacity: 0,
              } as any}
            />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes fwTrail {
          0% { height: 0; opacity: 1; transform: translateY(30vh); }
          80% { opacity: 1; }
          100% { height: 30vh; opacity: 0; transform: translateY(0); }
        }
        @keyframes fwBurst {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          30% { opacity: 1; transform: translate(calc(var(--dx) * 0.5), calc(var(--dy) * 0.5)) scale(1.2); }
          100% { transform: translate(var(--dx), calc(var(--dy) + 40px)) scale(0); opacity: 0; }
        }
      `}</style>
    </>
  );
}

/* ── Aurora Effect ── */
function AuroraEffect() {
  return (
    <>
      <div className="absolute inset-0">
        <div className="absolute w-full h-[60%] top-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,255,128,0.08) 0%, rgba(0,200,255,0.06) 30%, rgba(128,0,255,0.04) 60%, transparent 100%)",
            animation: "auroraShift 4s ease-in-out infinite alternate",
          }}
        />
        <div className="absolute w-full h-[50%] top-0"
          style={{
            background: "linear-gradient(180deg, rgba(128,0,255,0.06) 0%, rgba(0,255,200,0.05) 40%, transparent 100%)",
            animation: "auroraShift 5s ease-in-out 1s infinite alternate-reverse",
          }}
        />
        <div className="absolute w-full h-[40%] top-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,200,255,0.05) 0%, rgba(255,0,128,0.03) 50%, transparent 100%)",
            animation: "auroraShift 3.5s ease-in-out 0.5s infinite alternate",
          }}
        />
      </div>
      <style>{`
        @keyframes auroraShift {
          0% { transform: translateX(-5%) scaleY(1); filter: hue-rotate(0deg); }
          50% { transform: translateX(5%) scaleY(1.15); filter: hue-rotate(30deg); }
          100% { transform: translateX(-3%) scaleY(0.9); filter: hue-rotate(-20deg); }
        }
      `}</style>
    </>
  );
}

/* ── Bubbles Effect ── */
function BubblesEffect() {
  const bubbles = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 8 + Math.random() * 30,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 4,
    sway: (Math.random() - 0.5) * 60,
  })), []);

  return (
    <>
      {bubbles.map(b => (
        <div
          key={b.id}
          className="absolute rounded-full"
          style={{
            left: `${b.left}%`,
            bottom: "-40px",
            width: `${b.size}px`,
            height: `${b.size}px`,
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), rgba(100,200,255,0.15) 60%, rgba(100,200,255,0.05))`,
            border: "1px solid rgba(255,255,255,0.25)",
            boxShadow: "inset 0 -2px 4px rgba(255,255,255,0.1), 0 0 8px rgba(100,200,255,0.1)",
            animation: `bubbleRise ${b.duration}s ease-out ${b.delay}s infinite`,
            "--bsway": `${b.sway}px`,
          } as any}
        />
      ))}
      <style>{`
        @keyframes bubbleRise {
          0% { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
          10% { opacity: 0.7; transform: translateY(-10vh) translateX(calc(var(--bsway) * 0.2)) scale(0.8); }
          50% { opacity: 0.5; transform: translateY(-50vh) translateX(var(--bsway)) scale(1); }
          80% { opacity: 0.3; }
          100% { transform: translateY(-105vh) translateX(calc(var(--bsway) * -0.5)) scale(1.1); opacity: 0; }
        }
      `}</style>
    </>
  );
}
