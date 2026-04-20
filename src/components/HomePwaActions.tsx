import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import InstallAppFloatingButton from "@/components/InstallAppFloatingButton";
import PushSubscribeButton from "@/components/PushSubscribeButton";

/**
 * Floating actions for the public homepage:
 *  1. "Instalar App" — shown until the PWA is installed
 *  2. "Ativar Notificações" — shown after install; subscribes to the ADMIN
 *     seller_id configured in platform_settings.admin_push_seller_id
 */
export default function HomePwaActions({ primaryColor }: { primaryColor?: string }) {
  const [adminSellerId, setAdminSellerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "admin_push_seller_id")
        .maybeSingle();
      if (!cancelled && data?.value) setAdminSellerId(data.value);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <InstallAppFloatingButton primaryColor={primaryColor} />
      {adminSellerId && (
        <PushSubscribeButton sellerId={adminSellerId} primaryColor={primaryColor} />
      )}
    </>
  );
}
