import { useState } from "react";
import { BellRing, X } from "lucide-react";
import { usePushSubscription } from "@/hooks/usePushSubscription";

interface PushSubscribeButtonProps {
  sellerId: string;
  primaryColor?: string;
}

export default function PushSubscribeButton({ sellerId, primaryColor }: PushSubscribeButtonProps) {
  const { isSubscribed, isSupported, permission, subscribe, loading } = usePushSubscription(sellerId);
  const [dismissed, setDismissed] = useState(false);

  // Detect iOS (iPhone/iPad)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Don't show if not supported, already subscribed, denied, dismissed, or iOS
  if (!isSupported || isSubscribed || permission === "denied" || dismissed || isIOS) return null;

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (!ok && permission !== "granted") {
      setDismissed(true);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-40 flex items-center gap-2">
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-70"
        style={{ background: primaryColor || "#3B82F6" }}
      >
        <BellRing className="w-4 h-4" />
        {loading ? "Ativando..." : "Ativar Notificações"}
      </button>

      <button
        type="button"
        aria-label="Fechar aviso de notificações"
        onClick={() => setDismissed(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg backdrop-blur-sm"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
