import { useState } from "react";
import { Download } from "lucide-react";

import PwaInstallGuide from "@/components/PwaInstallGuide";
import { usePwaInstall } from "@/hooks/usePwaInstall";

interface StoreInstallButtonProps {
  variant?: "default" | "hero-light" | "hero-dark";
}

export default function StoreInstallButton({ variant = "default" }: StoreInstallButtonProps) {
  const { guideMode, installed, requestInstall } = usePwaInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (installed) return null;

  const handleClick = async () => {
    const result = await requestInstall();

    if (result.outcome === "unavailable") {
      setShowGuide(true);
    }
  };

  const btnClass = variant === "hero-light"
    ? "flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 text-white text-xs font-medium active:scale-95 transition-transform"
    : variant === "hero-dark"
    ? "flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md text-white text-xs font-medium active:scale-95 transition-transform"
    : "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors";

  return (
    <>
      <button type="button" onClick={handleClick} className={btnClass}>
        <Download size={variant === "default" ? 14 : 13} />
        Instalar APP
      </button>
      <PwaInstallGuide open={showGuide} onClose={() => setShowGuide(false)} mode={guideMode} />
    </>
  );
}
