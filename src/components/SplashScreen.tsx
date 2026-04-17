import { useEffect, useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function SplashScreen() {
  const { site_name, site_logo_url, loaded } = useSiteSettings();
  const [hidden, setHidden] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Mostra por no mínimo 900ms para experiência fluida
    const minTimer = setTimeout(() => {
      if (loaded) startFade();
    }, 900);

    return () => clearTimeout(minTimer);
  }, [loaded]);

  useEffect(() => {
    if (loaded) {
      const t = setTimeout(startFade, 900);
      return () => clearTimeout(t);
    }
  }, [loaded]);

  const startFade = () => {
    setFadeOut(true);
    setTimeout(() => setHidden(true), 500);
  };

  if (hidden) return null;

  const displayName = site_name || "Capimobi";

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <div className="relative flex items-center justify-center">
        {/* Anel girando externo */}
        <div className="absolute h-56 w-56 rounded-full border-4 border-transparent border-t-primary border-r-primary/60 animate-spin" />
        {/* Anel girando interno (sentido contrário) */}
        <div
          className="absolute h-44 w-44 rounded-full border-4 border-transparent border-b-accent border-l-accent/60"
          style={{ animation: "spin 1.5s linear infinite reverse" }}
        />
        {/* Logo central */}
        <div className="relative h-36 w-36 rounded-full bg-card shadow-lg flex items-center justify-center overflow-hidden px-4">
          {site_logo_url ? (
            <img
              src={site_logo_url}
              alt={displayName}
              className="h-full w-full object-contain p-3 animate-pulse"
            />
          ) : (
            <span className="text-xl font-bold whitespace-nowrap animate-pulse">
              <span className="text-primary">Cap</span>
              <span className="text-foreground">i</span>
              <span className="text-primary">mobi</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
