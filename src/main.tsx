import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { handleVitePreloadError } from "@/lib/chunkRecovery";
import { initPwaInstall } from "@/lib/pwaInstall";

handleVitePreloadError();
initPwaInstall();

// Register a minimal service worker so Android Chrome shows the native
// "Add to Home Screen" prompt (beforeinstallprompt requires a controlling SW).
// Skipped inside Lovable preview iframes to avoid stale caches.
if (
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  window.self === window.top &&
  !window.location.hostname.includes("lovableproject.com") &&
  !window.location.hostname.includes("id-preview--")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[PWA] SW registration failed:", err);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
