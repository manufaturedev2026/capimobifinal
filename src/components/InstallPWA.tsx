import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xl flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center shrink-0">
          <Download size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-foreground">Instalar Brokers App</p>
          <p className="text-xs text-muted-foreground">Acesse rápido pelo celular!</p>
        </div>
        <button onClick={handleInstall} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shrink-0">
          Instalar
        </button>
        <button onClick={() => setDismissed(true)} className="p-1 text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
