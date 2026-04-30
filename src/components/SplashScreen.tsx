import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * The actual splash markup lives in index.html (#initial-splash) so it appears
 * instantly before React boots. This component just fades it out once mounted.
 */
export default function SplashScreen() {
  const { site_splash_enabled, site_splash_bg_color, site_splash_image_url, loaded } = useSiteSettings();

  useEffect(() => {
    const el = document.getElementById("initial-splash");
    if (!el) return;

    // If admin disabled it, hide immediately
    if (loaded && site_splash_enabled === "false") {
      el.remove();
      return;
    }

    // Apply admin-configured background color
    if (loaded && site_splash_bg_color) {
      (el as HTMLElement).style.background = site_splash_bg_color;
    }

    // Apply admin-configured splash image
    if (loaded && site_splash_image_url) {
      const img = el.querySelector("img");
      if (img && img.getAttribute("src") !== site_splash_image_url) {
        img.setAttribute("src", site_splash_image_url);
      }
    }

    const t = setTimeout(() => {
      el.classList.add("hide");
      setTimeout(() => el.remove(), 500);
    }, 700);

    return () => clearTimeout(t);
  }, [loaded, site_splash_enabled, site_splash_bg_color, site_splash_image_url]);

  return null;
}
