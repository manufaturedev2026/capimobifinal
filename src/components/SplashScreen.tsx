import { useEffect, useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function SplashScreen() {
  const { site_name, site_logo_url, site_splash_image_url, site_splash_enabled, site_splash_bg_color, loaded } = useSiteSettings();
  const [hidden, setHidden] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (loaded) {
      const t = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setHidden(true), 500);
      }, 900);
      return () => clearTimeout(t);
    }
  }, [loaded]);

  // Disabled by admin → don't render
  if (loaded && site_splash_enabled === "false") return null;
  if (hidden) return null;

  const displayName = site_name || "Capimobi";
  const splashImage = site_splash_image_url || site_logo_url || "/pwa-icon-512.png";

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background: site_splash_bg_color || "#FFFFFF",
      }}
      aria-hidden="true"
    >
      <div className="relative flex items-center justify-center">
        {/* Anel único girando ao redor da logo */}
        <div className="absolute h-52 w-52 rounded-full border-4 border-transparent border-t-primary border-r-primary/40 animate-spin" />
        {/* Logo central */}
        <div
          className="relative h-36 w-36 rounded-full shadow-xl flex items-center justify-center overflow-hidden px-4"
          style={{ backgroundColor: site_splash_bg_color || "#FFFFFF" }}
        >
          {splashImage ? (
            <img
              src={splashImage}
              alt={displayName}
              className="h-full w-full object-contain p-3 animate-pulse"
            />
          ) : (
            <span className="text-2xl font-bold whitespace-nowrap animate-pulse">
              <span className="text-accent">Cap</span>
              <span className="text-white">i</span>
              <span className="text-primary">mobi</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
