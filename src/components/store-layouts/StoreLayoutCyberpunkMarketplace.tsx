import { useEffect, useState } from "react";
import StoreLayoutMarketplace from "./StoreLayoutMarketplace";
import type { StoreLayoutProps } from "./types";

/**
 * Cyberpunk Premium Layout — Apple × Cyberpunk
 *
 * Estética: minimalismo premium da Apple unido à tecnologia cyberpunk elegante.
 * Foco em conversão de imóveis de alto padrão. Sutil, sofisticado, futurista.
 */
export default function StoreLayoutCyberpunkMarketplace(props: StoreLayoutProps) {
  const [scrolled, setScrolled] = useState(false);

  const cyberTheme = {
    ...props.storeTheme,
    bg: "#050505",
    card: "#111118",
    text: "#FFFFFF",
    textMuted: "#B8B8C5",
    primary: "#00D9FF",
    accent: "#7B2CFF",
    border: "rgba(255, 255, 255, 0.08)",
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = "cp-apple-styles";
    const fontsId = "cp-apple-fonts";

    if (!document.getElementById(fontsId)) {
      const link = document.createElement("link");
      link.id = fontsId;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&family=Sora:wght@300;400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    }

    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes cp-particle-float {
        0% { transform: translateY(100vh) translateX(0); opacity: 0; }
        10% { opacity: 0.5; }
        90% { opacity: 0.3; }
        100% { transform: translateY(-10vh) translateX(20px); opacity: 0; }
      }
      @keyframes cp-orb-pulse {
        0%, 100% { transform: scale(1); opacity: 0.25; }
        50% { transform: scale(1.1); opacity: 0.35; }
      }
      @keyframes cp-shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      /* ============= ROOT ============= */
      .cp-wrapper {
        position: relative;
        background: #050505;
        color: #FFFFFF;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Space Grotesk', system-ui, sans-serif;
        font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        min-height: 100vh;
      }
      .cp-wrapper * { font-family: inherit; }
      .cp-wrapper h1, .cp-wrapper h2, .cp-wrapper h3, .cp-wrapper h4 {
        font-family: 'Sora', -apple-system, 'Inter', sans-serif !important;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #FFFFFF;
      }
      .cp-wrapper h1 { font-weight: 800; letter-spacing: -0.03em; }
      .cp-wrapper p, .cp-wrapper span, .cp-wrapper div, .cp-wrapper a, .cp-wrapper button {
        letter-spacing: -0.005em;
      }

      /* ============= BACKGROUND ============= */
      .cp-bg-base {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background:
          radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0, 217, 255, 0.08), transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 100%, rgba(123, 44, 255, 0.06), transparent 60%),
          #050505;
      }
      .cp-orb {
        position: fixed;
        pointer-events: none;
        z-index: 0;
        border-radius: 50%;
        filter: blur(140px);
        animation: cp-orb-pulse 12s ease-in-out infinite;
      }
      .cp-orb-1 {
        top: -8%; left: -5%;
        width: 480px; height: 480px;
        background: radial-gradient(circle, #00D9FF 0%, transparent 70%);
        opacity: 0.18;
      }
      .cp-orb-2 {
        bottom: -10%; right: -8%;
        width: 560px; height: 560px;
        background: radial-gradient(circle, #7B2CFF 0%, transparent 70%);
        opacity: 0.18;
        animation-delay: -6s;
      }

      /* Subtle grid (Apple-like, very faint) */
      .cp-grid {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
        background-size: 64px 64px;
        mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%);
      }

      /* ============= PARTICLES (very subtle) ============= */
      .cp-particles {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        overflow: hidden;
      }
      .cp-particle {
        position: absolute;
        bottom: -10px;
        width: 1.5px; height: 1.5px;
        background: rgba(0, 217, 255, 0.6);
        border-radius: 50%;
        box-shadow: 0 0 4px rgba(0, 217, 255, 0.5);
        animation: cp-particle-float linear infinite;
      }
      .cp-particle:nth-child(3n) {
        background: rgba(123, 44, 255, 0.5);
        box-shadow: 0 0 4px rgba(123, 44, 255, 0.4);
      }

      .cp-content { position: relative; z-index: 10; }

      /* ============= NAVBAR ============= */
      .cp-wrapper header,
      .cp-wrapper nav[class*="sticky"],
      .cp-wrapper nav[class*="fixed"],
      .cp-wrapper [class*="navbar"] {
        background: ${scrolled ? "rgba(5, 5, 5, 0.85)" : "rgba(5, 5, 5, 0.4)"} !important;
        backdrop-filter: blur(${scrolled ? "24px" : "16px"}) saturate(180%);
        -webkit-backdrop-filter: blur(${scrolled ? "24px" : "16px"}) saturate(180%);
        border-bottom: 1px solid ${scrolled ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.04)"} !important;
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* ============= CARDS — GLASSMORPHISM PREMIUM ============= */
      .cp-wrapper [class*="card"],
      .cp-wrapper article,
      .cp-wrapper .group {
        background: rgba(17, 17, 24, 0.6) !important;
        backdrop-filter: blur(20px) saturate(160%);
        -webkit-backdrop-filter: blur(20px) saturate(160%);
        border: 1px solid rgba(255, 255, 255, 0.06) !important;
        border-radius: 20px !important;
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                    box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                    border-color 0.5s ease !important;
        position: relative;
        overflow: hidden;
      }
      .cp-wrapper [class*="card"]:hover,
      .cp-wrapper article:hover,
      .cp-wrapper .group:hover {
        transform: translateY(-4px);
        border-color: rgba(0, 217, 255, 0.25) !important;
        box-shadow:
          0 24px 60px rgba(0, 0, 0, 0.5),
          0 0 0 1px rgba(0, 217, 255, 0.15),
          0 0 40px rgba(0, 217, 255, 0.08) !important;
      }

      /* Image zoom inside cards */
      .cp-wrapper [class*="card"] img,
      .cp-wrapper article img,
      .cp-wrapper .group img {
        transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) !important;
        border-radius: 16px;
      }
      .cp-wrapper [class*="card"]:hover img,
      .cp-wrapper article:hover img,
      .cp-wrapper .group:hover img {
        transform: scale(1.04);
      }

      /* ============= PRICES — GREEN NEON ============= */
      .cp-wrapper [class*="price"],
      .cp-wrapper [data-price],
      .cp-wrapper .text-primary {
        color: #00FF9D !important;
        font-family: 'Sora', -apple-system, 'Inter', sans-serif !important;
        font-weight: 700 !important;
        letter-spacing: -0.01em;
        text-shadow: 0 0 16px rgba(0, 255, 157, 0.35);
      }

      /* ============= BUTTONS ============= */
      .cp-wrapper button,
      .cp-wrapper a[role="button"] {
        font-family: 'Inter', -apple-system, sans-serif !important;
        font-weight: 600 !important;
        letter-spacing: -0.01em;
        border-radius: 12px !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        position: relative;
        overflow: hidden;
      }

      /* Primary: gradient blue → purple */
      .cp-wrapper button[class*="bg-primary"],
      .cp-wrapper button[class*="bg-green"],
      .cp-wrapper a[class*="bg-primary"],
      .cp-wrapper button[type="submit"] {
        background: linear-gradient(135deg, #00D9FF 0%, #7B2CFF 100%) !important;
        color: #FFFFFF !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        font-weight: 600 !important;
        box-shadow:
          0 4px 16px rgba(0, 217, 255, 0.25),
          0 1px 0 rgba(255, 255, 255, 0.15) inset;
      }
      .cp-wrapper button[class*="bg-primary"]:hover,
      .cp-wrapper button[class*="bg-green"]:hover,
      .cp-wrapper a[class*="bg-primary"]:hover,
      .cp-wrapper button[type="submit"]:hover {
        transform: translateY(-1px);
        box-shadow:
          0 8px 28px rgba(0, 217, 255, 0.4),
          0 0 30px rgba(123, 44, 255, 0.25),
          0 1px 0 rgba(255, 255, 255, 0.2) inset !important;
        filter: brightness(1.08);
      }

      /* Secondary: transparent + neon border */
      .cp-wrapper button[class*="outline"],
      .cp-wrapper button[class*="ghost"] {
        background: rgba(255, 255, 255, 0.02) !important;
        border: 1px solid rgba(0, 217, 255, 0.35) !important;
        color: #00D9FF !important;
        backdrop-filter: blur(10px);
      }
      .cp-wrapper button[class*="outline"]:hover,
      .cp-wrapper button[class*="ghost"]:hover {
        background: rgba(0, 217, 255, 0.08) !important;
        border-color: #00D9FF !important;
        box-shadow: 0 0 24px rgba(0, 217, 255, 0.3) !important;
      }

      /* ============= INPUTS — APPLE STYLE ============= */
      .cp-wrapper input,
      .cp-wrapper textarea,
      .cp-wrapper select {
        background: rgba(17, 17, 24, 0.7) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 12px !important;
        color: #FFFFFF !important;
        backdrop-filter: blur(12px);
        font-family: 'Inter', -apple-system, sans-serif !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .cp-wrapper input::placeholder,
      .cp-wrapper textarea::placeholder {
        color: #B8B8C5 !important;
      }
      .cp-wrapper input:focus,
      .cp-wrapper textarea:focus,
      .cp-wrapper select:focus {
        border-color: rgba(0, 217, 255, 0.5) !important;
        background: rgba(17, 17, 24, 0.9) !important;
        box-shadow:
          0 0 0 4px rgba(0, 217, 255, 0.1),
          0 0 24px rgba(0, 217, 255, 0.15) !important;
        outline: none !important;
      }

      /* ============= BADGES ============= */
      .cp-wrapper [class*="badge"] {
        background: rgba(123, 44, 255, 0.12) !important;
        border: 1px solid rgba(123, 44, 255, 0.3) !important;
        color: #C9A8FF !important;
        backdrop-filter: blur(8px);
        font-family: 'Inter', sans-serif !important;
        font-weight: 500 !important;
        letter-spacing: 0.02em;
        border-radius: 8px !important;
      }

      /* ============= TEXT COLORS ============= */
      .cp-wrapper .text-muted-foreground,
      .cp-wrapper [class*="text-gray"],
      .cp-wrapper [class*="text-muted"] {
        color: #B8B8C5 !important;
      }

      /* ============= SCROLLBAR ============= */
      .cp-wrapper ::-webkit-scrollbar {
        width: 8px; height: 8px;
      }
      .cp-wrapper ::-webkit-scrollbar-track {
        background: rgba(13, 13, 18, 0.5);
      }
      .cp-wrapper ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(0, 217, 255, 0.5), rgba(123, 44, 255, 0.5));
        border-radius: 4px;
      }
      .cp-wrapper ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #00D9FF, #7B2CFF);
      }

      /* ============= IMAGE ENHANCEMENT ============= */
      .cp-wrapper img {
        filter: contrast(1.03) saturate(1.08);
      }

      /* Smooth scroll */
      html { scroll-behavior: smooth; }
    `;
    document.head.appendChild(style);
  }, [scrolled]);

  // Subtle particles
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 20}s`,
    duration: `${20 + Math.random() * 20}s`,
  }));

  return (
    <div className="cp-wrapper">
      <div className="cp-bg-base" />
      <div className="cp-orb cp-orb-1" />
      <div className="cp-orb cp-orb-2" />
      <div className="cp-grid" />

      <div className="cp-particles">
        {particles.map((p) => (
          <span
            key={p.id}
            className="cp-particle"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      <div className="cp-content">
        <StoreLayoutMarketplace {...props} storeTheme={cyberTheme} />
      </div>
    </div>
  );
}
