import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { isIOSStandaloneApp } from "@/lib/pwaInstall";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    if (isIOSStandaloneApp()) {
      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(scrollToTop);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    scrollToTop();
  }, [pathname]);

  return null;
}
