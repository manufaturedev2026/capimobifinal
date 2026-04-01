import { useState } from "react";
import { Download, X } from "lucide-react";

import PwaInstallGuide from "@/components/PwaInstallGuide";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export default function InstallPWA() {
  const { canPrompt, guideMode, installed, isIOS, requestInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  if (installed || dismissed || (!canPrompt && !isIOS)) return null;

  const handleInstall = async () => {
    const result = await requestInstall();

    if (result.outcome === "unavailable") {
      setShowGuide(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-[60] animate-in slide-in-from-bottom-4 md:left-auto md:right-6 md:max-w-sm">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl">
          <div className="gradient-hero flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
            <Download size={20} className="text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-foreground">Instalar Brokers App</p>
            <p className="text-xs text-muted-foreground">Acesse rápido pelo celular!</p>
          </div>
          <button
            type="button"
            onClick={handleInstall}
            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            Instalar
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <PwaInstallGuide open={showGuide} onClose={() => setShowGuide(false)} mode={guideMode} />
    </>
  );
}
