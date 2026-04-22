import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import InstallAppFloatingButton from "@/components/InstallAppFloatingButton";
import PushSubscribeButton from "@/components/PushSubscribeButton";
import { usePwaInstall } from "@/hooks/usePwaInstall";

/**
 * Floating actions for the public homepage:
 *  1. "Instalar App" — shown until the PWA is installed
 *  2. "Ativar Notificações" — shown after install; subscribes to the ADMIN
 *     seller_id. The seller_id is auto-resolved: first checks
 *     platform_settings.admin_push_seller_id, otherwise falls back to the
 *     first admin profile found (so any admin can broadcast from /admin).
 */
export default function HomePwaActions({ primaryColor }: { primaryColor?: string }) {
  const [adminSellerId, setAdminSellerId] = useState<string | null>(null);
  const { installed, isPreview } = usePwaInstall();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Try the explicit setting first
      const { data: setting } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "admin_push_seller_id")
        .maybeSingle();

      if (!cancelled && setting?.value) {
        setAdminSellerId(setting.value);
        return;
      }

      // 2. Fallback: pick the oldest admin's profile id automatically
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();

      if (!adminRole?.user_id) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", adminRole.user_id)
        .maybeSingle();

      if (!cancelled && profile?.id) setAdminSellerId(profile.id);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      {!installed && <InstallAppFloatingButton primaryColor={primaryColor} />}
      {adminSellerId && (
        <PushSubscribeButton
          sellerId={adminSellerId}
          primaryColor={primaryColor}
          requireInstalled={false}
          positionClassName="bottom-6"
        />
      )}
    </>
  );
}
