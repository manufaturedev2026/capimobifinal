import { useEffect, useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Splash exibido ao entrar em /painel (navegação interna SPA).
 * Reaproveita o estilo do splash inicial (logo + ring giratório).
 */
export default function PanelSplash() {
  const { site_splash_enabled, loaded } = useSiteSettings();
  const [visible, setVisible] = useState(true);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (loaded && site_splash_enabled === "false") {
      setVisible(false);
      return;
    }
    const t1 = setTimeout(() => setHiding(true), 800);
    const t2 = setTimeout(() => setVisible(false), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loaded, site_splash_enabled]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, hsl(var(--background)), hsl(var(--primary) / 0.12), hsl(var(--background)))",
        opacity: hiding ? 0 : 1,
        pointerEvents: hiding ? "none" : "auto",
        transition: "opacity .4s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "13rem",
          height: "13rem",
          borderRadius: "9999px",
          border: "4px solid transparent",
          borderTopColor: "hsl(var(--primary))",
          borderRightColor: "hsl(var(--primary) / 0.35)",
          animation: "spin 1s linear infinite",
        }}
      />
      <img
        src="/pwa-icon-512.png"
        alt="Capimobi"
        style={{
          width: "9rem",
          height: "9rem",
          objectFit: "contain",
          animation: "pulse 1.4s ease-in-out infinite",
        }}
      />
    </div>
  );
}
