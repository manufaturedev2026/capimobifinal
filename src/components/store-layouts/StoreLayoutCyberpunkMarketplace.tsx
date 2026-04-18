import { useEffect, useState } from "react";
import StoreLayoutMarketplace from "./StoreLayoutMarketplace";
import type { StoreLayoutProps } from "./types";

/**
 * Cyberpunk Premium Layout
 *
 * Estética premium voltada à conversão de imóveis de alto padrão:
 * - Paleta: #0A0A0F base, neon azul #00F5FF + roxo #8A2EFF, verde luxo #00FF9D
 * - Glassmorphism nos cards, navbar com blur dinâmico ao rolar
 * - Tipografia tech (Orbitron títulos / Rajdhani corpo)
 * - Preços em verde neon, botões com gradiente azul→roxo + glow
 * - Partículas, grid digital, animações suaves
 */
export default function StoreLayoutCyberpunkMarketplace(props: StoreLayoutProps) {
  const [scrolled, setScrolled] = useState(false);

  // Premium cyber theme
  const cyberTheme = {
    ...props.storeTheme,
    bg: "#0A0A0F",
    card: "rgba(17, 17, 24, 0.55)",
    text: "#F5F5F5",
    textMuted: "#A0A0B8",
    primary: "#00F5FF",
    accent: "#8A2EFF",
    border: "rgba(0, 245, 255, 0.18)",
  };

  // Track scroll for navbar solidification
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Inject premium cyber styles
  useEffect(() => {
    const id = "cyberpunk-premium-styles";
    const fontsId = "cyberpunk-premium-fonts";

    if (!document.getElementById(fontsId)) {
      const link = document.createElement("link");
      link.id = fontsId;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }

    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes cp-grid-drift {
        0% { background-position: 0 0, 0 0; }
        100% { background-position: 80px 80px, 80px 80px; }
      }
      @keyframes cp-particle-rise {
        0% { transform: translateY(100vh) translateX(0); opacity: 0; }
        10% { opacity: 0.8; }
        90% { opacity: 0.6; }
        100% { transform: translateY(-10vh) translateX(40px); opacity: 0; }
      }
      @keyframes cp-pulse-glow {
        0%, 100% { box-shadow: 0 0 20px rgba(0, 245, 255, 0.25), 0 0 40px rgba(138, 46, 255, 0.15); }
        50% { box-shadow: 0 0 30px rgba(0, 245, 255, 0.4), 0 0 60px rgba(138, 46, 255, 0.25); }
      }
      @keyframes cp-scan {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      @keyframes cp-spin-slow {
        to { transform: rotate(360deg); }
      }

      /* ============= ROOT WRAPPER ============= */
      .cp-wrapper {
        position: relative;
        background: #0A0A0F;
        color: #F5F5F5;
        font-family: 'Rajdhani', 'Space Grotesk', system-ui, sans-serif;
        min-height: 100vh;
      }
      .cp-wrapper * {
        font-family: inherit;
      }
      .cp-wrapper h1, .cp-wrapper h2, .cp-wrapper h3 {
        font-family: 'Orbitron', 'Space Grotesk', sans-serif !important;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: #F5F5F5;
      }
      .cp-wrapper h1 { letter-spacing: 0.04em; }
      .cp-wrapper p, .cp-wrapper span, .cp-wrapper div, .cp-wrapper a, .cp-wrapper button {
        letter-spacing: 0.01em;
      }

      /* ============= BACKGROUND LAYERS ============= */
      .cp-grid {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background-image:
          linear-gradient(rgba(0, 245, 255, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(138, 46, 255, 0.04) 1px, transparent 1px);
        background-size: 80px 80px;
        animation: cp-grid-drift 30s linear infinite;
        mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
      }
      .cp-glow-orb {
        position: fixed;
        pointer-events: none;
        z-index: 0;
        border-radius: 50%;
        filter: blur(120px);
        opacity: 0.35;
      }
      .cp-orb-1 {
        top: -10%; left: -5%;
        width: 500px; height: 500px;
        background: radial-gradient(circle, #00F5FF 0%, transparent 70%);
      }
      .cp-orb-2 {
        bottom: -15%; right: -10%;
        width: 600px; height: 600px;
        background: radial-gradient(circle, #8A2EFF 0%, transparent 70%);
      }
      .cp-vignette {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        background: radial-gradient(ellipse at center, transparent 50%, rgba(10, 10, 15, 0.85) 100%);
      }

      /* ============= PARTICLES ============= */
      .cp-particles {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        overflow: hidden;
      }
      .cp-particle {
        position: absolute;
        bottom: -10px;
        width: 2px;
        height: 2px;
        background: #00F5FF;
        border-radius: 50%;
        box-shadow: 0 0 6px #00F5FF, 0 0 12px #00F5FF;
        animation: cp-particle-rise linear infinite;
      }
      .cp-particle:nth-child(odd) {
        background: #8A2EFF;
        box-shadow: 0 0 6px #8A2EFF, 0 0 12px #8A2EFF;
      }

      /* ============= MAIN CONTENT ABOVE BG ============= */
      .cp-wrapper > .cp-content {
        position: relative;
        z-index: 10;
      }

      /* ============= NAVBAR / HEADER ============= */
      .cp-wrapper header,
      .cp-wrapper [class*="navbar"],
      .cp-wrapper nav[class*="sticky"],
      .cp-wrapper nav[class*="fixed"] {
        background: ${scrolled ? "rgba(10, 10, 15, 0.92)" : "rgba(10, 10, 15, 0.4)"} !important;
        backdrop-filter: blur(${scrolled ? "20px" : "12px"}) saturate(180%);
        -webkit-backdrop-filter: blur(${scrolled ? "20px" : "12px"}) saturate(180%);
        border-bottom: 1px solid ${scrolled ? "rgba(0, 245, 255, 0.25)" : "rgba(0, 245, 255, 0.1)"} !important;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        ${scrolled ? "box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 245, 255, 0.08);" : ""}
      }

      /* ============= CARDS / GLASSMORPHISM ============= */
      .cp-wrapper [class*="card"],
      .cp-wrapper article,
      .cp-wrapper [data-property-card],
      .cp-wrapper .group {
        background: rgba(17, 17, 24, 0.55) !important;
        backdrop-filter: blur(16px) saturate(160%);
        -webkit-backdrop-filter: blur(16px) saturate(160%);
        border: 1px solid rgba(0, 245, 255, 0.12) !important;
        border-radius: 16px !important;
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                    border-color 0.4s ease !important;
        position: relative;
        overflow: hidden;
      }
      .cp-wrapper [class*="card"]:hover,
      .cp-wrapper article:hover,
      .cp-wrapper .group:hover {
        transform: translateY(-6px);
        border-color: rgba(0, 245, 255, 0.45) !important;
        box-shadow:
          0 20px 50px rgba(0, 0, 0, 0.6),
          0 0 30px rgba(0, 245, 255, 0.25),
          0 0 60px rgba(138, 46, 255, 0.15) !important;
      }

      /* ============= PRICES — GREEN NEON LUXURY ============= */
      .cp-wrapper [class*="price"],
      .cp-wrapper [data-price],
      .cp-wrapper .text-primary {
        color: #00FF9D !important;
        font-family: 'Orbitron', 'Space Grotesk', sans-serif !important;
        font-weight: 700 !important;
        letter-spacing: 0.02em;
        text-shadow: 0 0 12px rgba(0, 255, 157, 0.5), 0 0 24px rgba(0, 255, 157, 0.2);
      }

      /* ============= BUTTONS ============= */
      .cp-wrapper button,
      .cp-wrapper a[role="button"],
      .cp-wrapper [class*="btn"] {
        font-family: 'Rajdhani', sans-serif !important;
        font-weight: 600 !important;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        border-radius: 10px !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        position: relative;
        overflow: hidden;
      }

      /* Primary buttons: gradient blue→purple with glow */
      .cp-wrapper button[class*="bg-primary"],
      .cp-wrapper button[class*="bg-green"],
      .cp-wrapper a[class*="bg-primary"],
      .cp-wrapper button[type="submit"] {
        background: linear-gradient(135deg, #00F5FF 0%, #8A2EFF 100%) !important;
        color: #0A0A0F !important;
        border: none !important;
        font-weight: 700 !important;
        box-shadow: 0 4px 20px rgba(0, 245, 255, 0.35), 0 0 0 1px rgba(0, 245, 255, 0.4) inset;
      }
      .cp-wrapper button[class*="bg-primary"]:hover,
      .cp-wrapper button[class*="bg-green"]:hover,
      .cp-wrapper a[class*="bg-primary"]:hover,
      .cp-wrapper button[type="submit"]:hover {
        transform: translateY(-2px);
        box-shadow:
          0 8px 30px rgba(0, 245, 255, 0.55),
          0 0 40px rgba(138, 46, 255, 0.4),
          0 0 0 1px rgba(255, 255, 255, 0.3) inset !important;
        filter: brightness(1.1);
      }

      /* Secondary buttons: transparent + neon border */
      .cp-wrapper button[class*="outline"],
      .cp-wrapper button[class*="ghost"],
      .cp-wrapper button[variant="outline"] {
        background: rgba(0, 245, 255, 0.05) !important;
        border: 1px solid rgba(0, 245, 255, 0.5) !important;
        color: #00F5FF !important;
        backdrop-filter: blur(8px);
      }
      .cp-wrapper button[class*="outline"]:hover,
      .cp-wrapper button[class*="ghost"]:hover {
        background: rgba(0, 245, 255, 0.12) !important;
        border-color: #00F5FF !important;
        box-shadow: 0 0 20px rgba(0, 245, 255, 0.4), inset 0 0 20px rgba(0, 245, 255, 0.1) !important;
        text-shadow: 0 0 8px #00F5FF;
      }

      /* ============= INPUTS / SEARCH ============= */
      .cp-wrapper input,
      .cp-wrapper textarea,
      .cp-wrapper select,
      .cp-wrapper [class*="search"] input {
        background: rgba(17, 17, 24, 0.7) !important;
        border: 1px solid rgba(0, 245, 255, 0.25) !important;
        border-radius: 10px !important;
        color: #F5F5F5 !important;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease !important;
        font-family: 'Rajdhani', sans-serif !important;
      }
      .cp-wrapper input::placeholder,
      .cp-wrapper textarea::placeholder {
        color: #A0A0B8 !important;
      }
      .cp-wrapper input:focus,
      .cp-wrapper textarea:focus,
      .cp-wrapper select:focus {
        border-color: #00F5FF !important;
        box-shadow: 0 0 0 3px rgba(0, 245, 255, 0.15), 0 0 20px rgba(0, 245, 255, 0.25) !important;
        outline: none !important;
      }

      /* ============= BADGES & TAGS ============= */
      .cp-wrapper [class*="badge"] {
        background: rgba(138, 46, 255, 0.15) !important;
        border: 1px solid rgba(138, 46, 255, 0.4) !important;
        color: #C8A8FF !important;
        backdrop-filter: blur(8px);
        font-family: 'Rajdhani', sans-serif !important;
        font-weight: 600 !important;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      /* ============= TEXT COLORS ============= */
      .cp-wrapper .text-muted-foreground,
      .cp-wrapper [class*="text-gray"],
      .cp-wrapper [class*="text-muted"] {
        color: #A0A0B8 !important;
      }

      /* ============= SCROLLBAR ============= */
      .cp-wrapper ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      .cp-wrapper ::-webkit-scrollbar-track {
        background: rgba(17, 17, 24, 0.5);
      }
      .cp-wrapper ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #00F5FF, #8A2EFF);
        border-radius: 4px;
      }

      /* ============= LOADING SPINNER ============= */
      .cp-loader {
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        z-index: 99;
        width: 60px; height: 60px;
        border: 2px solid transparent;
        border-top: 2px solid #00F5FF;
        border-right: 2px solid #8A2EFF;
        border-radius: 50%;
        animation: cp-spin-slow 1s linear infinite;
        box-shadow: 0 0 30px rgba(0, 245, 255, 0.5);
        pointer-events: none;
        opacity: 0;
      }

      /* ============= IMAGE ENHANCEMENT ============= */
      .cp-wrapper img {
        filter: contrast(1.05) saturate(1.1);
      }

      /* ============= REMOVE OLD CHAOTIC EFFECTS ============= */
      .cp-wrapper .cyber-scanlines,
      .cp-wrapper .cyber-noise { display: none; }
    `;
    document.head.appendChild(style);
  }, [scrolled]);

  // Generate particles (memoized count)
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 15}s`,
    duration: `${15 + Math.random() * 15}s`,
    size: `${1 + Math.random() * 2}px`,
  }));

  return (
    <div className="cp-wrapper">
      {/* Background layers */}
      <div className="cp-glow-orb cp-orb-1" />
      <div className="cp-glow-orb cp-orb-2" />
      <div className="cp-grid" />
      <div className="cp-vignette" />

      {/* Floating particles */}
      <div className="cp-particles">
        {particles.map((p) => (
          <span
            key={p.id}
            className="cp-particle"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              width: p.size,
              height: p.size,
            }}
          />
        ))}
      </div>

      {/* Marketplace with overridden premium cyber theme */}
      <div className="cp-content">
        <StoreLayoutMarketplace {...props} storeTheme={cyberTheme} />
      </div>
    </div>
  );
}
