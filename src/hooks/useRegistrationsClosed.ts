import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "registrations_closed_cache_v1";
const TTL_MS = 10 * 60 * 1000;

let cached: boolean | null = null;
let inflight: Promise<boolean> | null = null;
const listeners = new Set<(v: boolean) => void>();

// Hydrate from sessionStorage on module load
try {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed?.expiresAt && Date.now() < parsed.expiresAt && typeof parsed.value === "boolean") {
      cached = parsed.value;
    }
  }
} catch {
  // ignore
}

async function fetchClosed(force = false): Promise<boolean> {
  if (!force && cached !== null) return cached;
  if (!force && inflight) return inflight;
  inflight = (async () => {
    try {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "registrations_closed")
        .maybeSingle();
      const v = String((data as any)?.value || "false").toLowerCase() === "true";
      cached = v;
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ value: v, expiresAt: Date.now() + TTL_MS })
        );
      } catch {
        // ignore
      }
      listeners.forEach((l) => l(v));
      return v;
    } catch {
      cached = false;
      return false;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function invalidateRegistrationsClosed() {
  cached = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  fetchClosed(true);
}

export function useRegistrationsClosed() {
  const [closed, setClosed] = useState<boolean>(cached ?? false);
  const [loading, setLoading] = useState<boolean>(cached === null);

  useEffect(() => {
    let mounted = true;
    const listener = (v: boolean) => {
      if (mounted) setClosed(v);
    };
    listeners.add(listener);
    fetchClosed().then((v) => {
      if (mounted) {
        setClosed(v);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return { closed, loading };
}
