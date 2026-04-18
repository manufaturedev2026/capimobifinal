import { useEffect } from "react";
import StoreLayoutMarketplace from "./StoreLayoutMarketplace";
import type { StoreLayoutProps } from "./types";

/**
 * Cyberpunk Marketplace Layout
 *
 * Wraps the Marketplace layout in a full-on Cyberpunk 2077 aesthetic:
 * Matrix green (#39ff14) + neon purple (#bf00ff) palette, scanlines,
 * glitch animations, neon borders, mono font, and a corner HUD.
 *
 * Forces the theme override via CSS variables on a scoped wrapper so
 * any color usage inside Marketplace inherits the cyber palette.
 */
export default function StoreLayoutCyberpunkMarketplace(props: StoreLayoutProps) {
  // Force the cyberpunk theme regardless of user's saved theme
  const cyberTheme = {
    ...props.storeTheme,
    bg: "#05080a",
    card: "rgba(15, 25, 18, 0.6)",
    text: "#d8ffd8",
    textMuted: "#7faf7f",
    primary: "#39ff14",
    accent: "#bf00ff",
    border: "#1a3a1a",
  };

  // Inject keyframes once
  useEffect(() => {
    const id = "cyberpunk-mp-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes cyber-scanline {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100vh); }
      }
      @keyframes cyber-glitch {
        0%, 100% { transform: translate(0); filter: hue-rotate(0deg); }
        20% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
        40% { transform: translate(2px, -1px); filter: hue-rotate(-90deg); }
        60% { transform: translate(-1px, -1px); filter: hue-rotate(45deg); }
        80% { transform: translate(1px, 1px); filter: hue-rotate(-45deg); }
      }
      @keyframes cyber-flicker {
        0%, 100% { opacity: 1; }
        45% { opacity: 1; }
        50% { opacity: 0.4; }
        55% { opacity: 1; }
        70% { opacity: 0.7; }
        72% { opacity: 1; }
      }
      @keyframes cyber-pulse-border {
        0%, 100% { box-shadow: inset 0 0 0 1px #39ff14, 0 0 12px #39ff1480, 0 0 24px #bf00ff40; }
        50% { box-shadow: inset 0 0 0 1px #bf00ff, 0 0 20px #bf00ff80, 0 0 40px #39ff1440; }
      }
      .cyber-wrapper {
        position: relative;
        background: #05080a;
        font-family: 'JetBrains Mono', 'Courier New', ui-monospace, monospace;
      }
      .cyber-wrapper * {
        font-family: inherit !important;
      }
      .cyber-wrapper h1, .cyber-wrapper h2, .cyber-wrapper h3 {
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .cyber-scanlines {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 50;
        background: repeating-linear-gradient(
          0deg,
          transparent 0,
          transparent 2px,
          rgba(57, 255, 20, 0.04) 2px,
          rgba(57, 255, 20, 0.04) 3px
        );
        mix-blend-mode: overlay;
      }
      .cyber-scan-beam {
        position: fixed;
        left: 0;
        right: 0;
        height: 80px;
        pointer-events: none;
        z-index: 51;
        background: linear-gradient(180deg, transparent, rgba(57, 255, 20, 0.08), transparent);
        animation: cyber-scanline 6s linear infinite;
      }
      .cyber-vignette {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 49;
        background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.7) 100%);
      }
      .cyber-noise {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 48;
        opacity: 0.05;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      }
      .cyber-hud {
        position: fixed;
        bottom: 12px;
        right: 12px;
        z-index: 52;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        color: #39ff14;
        background: rgba(0, 0, 0, 0.7);
        border: 1px solid #39ff14;
        padding: 6px 10px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        animation: cyber-flicker 4s infinite;
        box-shadow: 0 0 12px #39ff1460;
      }
      .cyber-hud-tl {
        position: fixed;
        top: 80px;
        left: 12px;
        z-index: 52;
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        color: #bf00ff;
        background: rgba(0, 0, 0, 0.7);
        border: 1px solid #bf00ff;
        padding: 4px 8px;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        box-shadow: 0 0 8px #bf00ff60;
      }
      .cyber-wrapper button:hover,
      .cyber-wrapper a:hover {
        text-shadow: 0 0 8px currentColor;
      }
      .cyber-wrapper [class*="rounded"] {
        position: relative;
      }
      .cyber-glitch-text {
        animation: cyber-glitch 3s infinite;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="cyber-wrapper">
      {/* Top-left HUD */}
      <div className="cyber-hud-tl">
        ◆ NETRUNNER://{props.sellerDisplayName?.slice(0, 12).toUpperCase().replace(/\s/g, "_") || "ANON"}
      </div>

      {/* Bottom-right HUD */}
      <div className="cyber-hud">
        ▲ SYS.OK · {props.products.length} ASSETS · {new Date().getFullYear()}
      </div>

      {/* Marketplace layout with overridden theme */}
      <StoreLayoutMarketplace {...props} storeTheme={cyberTheme} />

      {/* Overlays - rendered last so they sit on top */}
      <div className="cyber-noise" />
      <div className="cyber-vignette" />
      <div className="cyber-scanlines" />
      <div className="cyber-scan-beam" />
    </div>
  );
}
