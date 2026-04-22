import { useState } from "react";
import { Download } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import PwaInstallGuide from "@/components/PwaInstallGuide";

interface Props {
  primaryColor?: string;
}

/**
 * Floating "Install App" button that mirrors the PushSubscribeButton style.
 * Shown only when the PWA is NOT installed yet. After install it disappears
 * and the PushSubscribeButton (notifications) takes over.
 */
export default function InstallAppFloatingButton({ primaryColor }: Props) {
  const { canPrompt, guideMode, installed, isIOS, isPreview, requestInstall } = usePwaInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hide only if already installed. In preview we still show the action and open the guide.
  if (installed) return null;

  // On iOS we show the guide because there's no install prompt
  // On other platforms we need either canPrompt or fall back to manual guide
  const handleClick = async () => {
    if (isPreview || isIOS || !canPrompt) {
      setShowGuide(true);
      return;
    }
    setLoading(true);
    try {
      const result = await requestInstall();
      if (result.outcome === "unavailable") setShowGuide(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-70"
          style={{ background: primaryColor || "#3B82F6" }}
        >
          <Download className="h-4 w-4" />
          {loading ? "Abrindo..." : "Instalar App"}
        </button>
      </div>

      <PwaInstallGuide open={showGuide} onClose={() => setShowGuide(false)} mode={guideMode} />
    </>
  );
}
