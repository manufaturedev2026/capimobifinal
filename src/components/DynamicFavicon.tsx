import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Applies the admin-configured favicon (site_favicon_url) to the document head
 * by replacing the existing <link rel="icon"> tags. Falls back to /favicon.png.
 */
export default function DynamicFavicon() {
  const { site_favicon_url, loaded } = useSiteSettings();

  useEffect(() => {
    if (!loaded) return;
    const url = site_favicon_url?.trim() || "/favicon.png";

    // Remove existing icon links to avoid duplicates / browser using the old one
    document
      .querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
      .forEach((el) => el.parentNode?.removeChild(el));

    const addLink = (rel: string) => {
      const link = document.createElement("link");
      link.rel = rel;
      link.href = url;
      // Hint browsers about format when possible
      if (/\.png(\?|$)/i.test(url)) link.type = "image/png";
      else if (/\.svg(\?|$)/i.test(url)) link.type = "image/svg+xml";
      else if (/\.ico(\?|$)/i.test(url)) link.type = "image/x-icon";
      else if (/\.jpe?g(\?|$)/i.test(url)) link.type = "image/jpeg";
      document.head.appendChild(link);
    };

    addLink("icon");
    addLink("shortcut icon");
    addLink("apple-touch-icon");
  }, [site_favicon_url, loaded]);

  return null;
}
