import { BellRing } from "lucide-react";
import { detectIOS, isStandaloneDisplayMode } from "@/lib/pwaInstall";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { usePwaInstall } from "@/hooks/usePwaInstall";

interface PushSubscribeButtonProps {
  sellerId: string;
  primaryColor?: string;
  /** When true, only show after the PWA is installed (gives priority to the Install button) */
  requireInstalled?: boolean;
  positionClassName?: string;
  scope?: "store" | "panel" | "admin_home";
}

export default function PushSubscribeButton({ sellerId, primaryColor, requireInstalled = true, positionClassName = "bottom-20 md:bottom-6", scope = "store" }: PushSubscribeButtonProps) {
  const { isSubscribed, isSupported, subscribe, loading } = usePushSubscription(sellerId, { scope });
  const { installed, isPreview } = usePwaInstall();

  const isIOSBrowser = detectIOS() && !isStandaloneDisplayMode();

  if (!isSupported || isSubscribed || isIOSBrowser) return null;
  // Wait for the user to install the app first
  if (requireInstalled && !installed && !isPreview) return null;

  return (
    <div className={`fixed right-4 z-40 ${positionClassName}`}>
      <button
        type="button"
        onClick={subscribe}
        disabled={loading}
        className="flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-70"
        style={{ background: primaryColor || "#3B82F6" }}
      >
        <BellRing className="h-4 w-4" />
        {loading ? "Ativando..." : "Ativar Notificações"}
      </button>
    </div>
  );
}
