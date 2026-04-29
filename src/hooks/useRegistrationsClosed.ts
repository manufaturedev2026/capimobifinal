import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let cached: boolean | null = null;
let inflight: Promise<boolean> | null = null;
const listeners = new Set<(v: boolean) => void>();

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
