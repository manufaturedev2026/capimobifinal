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

const STORAGE_KEY = "site_settings_cache_v1";
const TTL_MS = 10 * 60 * 1000;

let cachedSettings: SiteSettings | null = null;
let fetchPromise: Promise<SiteSettings> | null = null;
const listeners = new Set<(s: SiteSettings) => void>();

// Hydrate from sessionStorage on module load
try {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed?.expiresAt && Date.now() < parsed.expiresAt && parsed.value) {
      cachedSettings = parsed.value as SiteSettings;
    }
  }
} catch {
  // ignore
}

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
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value: s, expiresAt: Date.now() + TTL_MS })
      );
    } catch {
      // ignore quota errors
    }
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
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  fetchSettings(true);
}
