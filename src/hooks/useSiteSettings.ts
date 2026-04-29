import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  site_name: string;
  site_logo_url: string;
  site_favicon_url: string;
  site_footer_text: string;
  site_terms_html: string;
  site_privacy_html: string;
  site_splash_image_url: string;
  site_splash_enabled: string; // "true" | "false"
  site_splash_bg_color: string; // hex color
}

const DEFAULTS: SiteSettings = {
  site_name: "Capimobi",
  site_logo_url: "",
  site_favicon_url: "",
  site_footer_text: "",
  site_terms_html: "",
  site_privacy_html: "",
  site_splash_image_url: "/pwa-icon-512.png",
  site_splash_enabled: "true",
  site_splash_bg_color: "#FFFFFF",
};

let cachedSettings: SiteSettings | null = null;
let fetchPromise: Promise<SiteSettings> | null = null;
const listeners = new Set<(s: SiteSettings) => void>();

function fetchSettings(force = false): Promise<SiteSettings> {
  if (!force && cachedSettings) return Promise.resolve(cachedSettings);
  if (!force && fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", Object.keys(DEFAULTS));
    const s = { ...DEFAULTS };
    data?.forEach((row) => {
      if (row.key in s) (s as any)[row.key] = row.value || (DEFAULTS as any)[row.key];
    });
    cachedSettings = s;
    fetchPromise = null;
    listeners.forEach((cb) => cb(s));
    return s;
  })();
  return fetchPromise;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings || DEFAULTS);
  const [loaded, setLoaded] = useState(!!cachedSettings);

  useEffect(() => {
    fetchSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
    const cb = (s: SiteSettings) => {
      setSettings(s);
      setLoaded(true);
    };
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  return { ...settings, loaded };
}

/** Invalidate cache (call after admin saves) and notify all mounted components */
export function invalidateSiteSettings() {
  cachedSettings = null;
  fetchPromise = null;
  fetchSettings(true);
}
