import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CustomDomainResult {
  isCustomDomain: boolean;
  sellerId: string | null;
  loading: boolean;
}

// Known app domains that should NOT trigger custom domain redirect
const APP_DOMAINS = [
  "localhost",
  "lovable.app",
  "lovableproject.com",
  "lovable.dev",
  "webcontainer.io",
];

function isAppDomain(hostname: string): boolean {
  return APP_DOMAINS.some((d) => hostname.includes(d));
}

let cachedResult: { hostname: string; sellerId: string | null } | null = null;

export function useCustomDomain(): CustomDomainResult {
  const [sellerId, setSellerId] = useState<string | null>(cachedResult?.sellerId ?? null);
  const [loading, setLoading] = useState(!cachedResult);
  const [isCustomDomain, setIsCustomDomain] = useState(cachedResult ? !!cachedResult.sellerId : false);

  useEffect(() => {
    const hostname = window.location.hostname;

    if (isAppDomain(hostname)) {
      setLoading(false);
      return;
    }

    if (cachedResult && cachedResult.hostname === hostname) {
      setSellerId(cachedResult.sellerId);
      setIsCustomDomain(!!cachedResult.sellerId);
      setLoading(false);
      return;
    }

    // Clean hostname (remove www.)
    const cleanHost = hostname.replace(/^www\./, "");

    supabase
      .from("store_domains")
      .select("seller_id")
      .or(`domain.eq.${cleanHost},domain.eq.www.${cleanHost}`)
      .eq("is_active", true)
      .limit(1)
      .then(({ data }) => {
        const found = data && data.length > 0 ? data[0].seller_id : null;
        cachedResult = { hostname, sellerId: found };
        setSellerId(found);
        setIsCustomDomain(!!found);
        setLoading(false);
      });
  }, []);

  return { isCustomDomain, sellerId, loading };
}
