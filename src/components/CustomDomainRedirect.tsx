import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCustomDomain } from "@/hooks/useCustomDomain";
import { supabase } from "@/integrations/supabase/client";

export function CustomDomainRedirect() {
  const { isCustomDomain, sellerId, loading } = useCustomDomain();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !isCustomDomain || !sellerId) return;

    // Only redirect if user is on the homepage
    if (location.pathname === "/") {
      // Find profile id to build the store URL
      supabase
        .from("profiles")
        .select("id, seller_type")
        .eq("id", sellerId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const prefix = data.seller_type === "automoveis" ? "automoveis" : "imoveis";
            navigate(`/empresa/${data.id}`, { replace: true });
          }
        });
    }
  }, [isCustomDomain, sellerId, loading, location.pathname, navigate]);

  return null;
}
