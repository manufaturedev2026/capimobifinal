import { useEffect, useState } from "react";
import { Bell, BellRing, CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePushSubscription } from "@/hooks/usePushSubscription";

interface AdminReceivePushTabProps {
  userId: string;
}

export default function AdminReceivePushTab({ userId }: AdminReceivePushTabProps) {
  const [adminPushSellerId, setAdminPushSellerId] = useState<string | undefined>();
  const push = usePushSubscription(adminPushSellerId);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled || !data?.id) return;

      setAdminPushSellerId(data.id);
      await supabase
        .from("platform_settings")
        .upsert({ key: "admin_push_seller_id", value: data.id, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BellRing className="w-5 h-5 text-primary" /> Receber Push
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ative neste dispositivo para receber notificações do painel admin, CRM, bots e leads.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Receber notificações neste aparelho</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Quem ativar aqui fica inscrito como recebedor principal dos pushes administrativos.
              </p>
            </div>
          </div>

          <Button
            onClick={() => push.subscribe()}
            disabled={!adminPushSellerId || !push.isSupported || push.loading || push.isSubscribed}
            className="gap-2 shrink-0"
            variant={push.isSubscribed ? "secondary" : "default"}
          >
            {push.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : push.isSubscribed ? <CheckCircle2 className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {push.isSubscribed ? "Recebendo push" : "Ativar recebimento"}
          </Button>
        </div>

        {!push.isSupported && push.unsupportedReason && (
          <div className="rounded-lg border border-border bg-secondary p-3 text-sm text-muted-foreground">
            {push.unsupportedReason}
          </div>
        )}
      </div>
    </div>
  );
}