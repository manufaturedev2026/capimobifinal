import { useState } from "react";
import { Bell, BellRing, X } from "lucide-react";
import { usePushSubscription } from "@/hooks/usePushSubscription";

interface PushSubscribeButtonProps {
  sellerId: string;
  primaryColor?: string;
}

export default function PushSubscribeButton({ sellerId, primaryColor }: PushSubscribeButtonProps) {
  const { isSubscribed, isSupported, permission, subscribe, loading } = usePushSubscription(sellerId);
  const [dismissed, setDismissed] = useState(false);

  // Don't show if not supported, already subscribed, denied, or dismissed
  if (!isSupported || isSubscribed || permission === "denied" || dismissed) return null;

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (!ok && permission !== "granted") {
      setDismissed(true);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="fixed bottom-20 md:bottom-6 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-white text-xs font-bold animate-bounce hover:animate-none transition-all active:scale-95"
      style={{ background: primaryColor || "#3B82F6" }}
    >
      <BellRing className="w-4 h-4" />
      {loading ? "Ativando..." : "Ativar Notificações"}
      <button
        onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
        className="ml-1 p-0.5 rounded-full hover:bg-white/20"
      >
        <X className="w-3 h-3" />
      </button>
    </button>
  );
}
