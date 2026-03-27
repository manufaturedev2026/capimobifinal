import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCustomDomain } from "@/hooks/useCustomDomain";

export function CustomDomainRedirect() {
  const { isCustomDomain, sellerId, loading } = useCustomDomain();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (loading || !isCustomDomain || !sellerId || redirected) return;

    // Redirect any root-level path to the store
    // Allow /empresa/ paths to pass through (already on the store)
    if (!location.pathname.startsWith("/empresa/")) {
      navigate(`/empresa/${sellerId}`, { replace: true });
      setRedirected(true);
    }
  }, [isCustomDomain, sellerId, loading, location.pathname, navigate, redirected]);

  return null;
}
