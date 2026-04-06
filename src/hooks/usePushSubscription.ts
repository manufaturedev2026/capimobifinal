import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SUBSCRIPTION_TIMEOUT_MS = 15000;

export function usePushSubscription(sellerId?: string) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission);

    navigator.serviceWorker
      .getRegistration()
      .then(async (registration) => {
        if (!registration) return;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      })
      .catch(() => {});
  }, [sellerId]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !sellerId) {
      console.warn("[Push] Not supported or no sellerId");
      toast({ title: "Push não suportado", description: "Seu navegador não suporta notificações push.", variant: "destructive" });
      return false;
    }

    setLoading(true);

    try {
      // Step 1: Request permission
      console.log("[Push] Requesting permission...");
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        console.warn("[Push] Permission denied:", perm);
        toast({ title: "Permissão negada", description: "Você precisa permitir notificações no navegador.", variant: "destructive" });
        return false;
      }
      console.log("[Push] Permission granted");

      // Step 2: Get VAPID key
      console.log("[Push] Fetching VAPID key...");
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke("get-vapid-key");

      if (vapidError || !vapidData?.publicKey) {
        console.error("[Push] Failed to get VAPID key:", vapidError);
        toast({ title: "Erro ao configurar push", description: "Não foi possível obter a chave do servidor.", variant: "destructive" });
        return false;
      }
      console.log("[Push] VAPID key received");

      // Step 3: Register service worker
      console.log("[Push] Registering service worker...");
      let registration = await navigator.serviceWorker.getRegistration("/");
      if (!registration) {
        registration = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
        console.log("[Push] SW registered, waiting for activation...");
        // Wait for the SW to be active
        if (registration.installing || registration.waiting) {
          await new Promise<void>((resolve) => {
            const sw = registration!.installing || registration!.waiting;
            if (!sw) { resolve(); return; }
            sw.addEventListener("statechange", () => {
              if (sw.state === "activated") resolve();
            });
            // Fallback timeout
            setTimeout(resolve, 5000);
          });
        }
      }
      console.log("[Push] SW ready, state:", registration.active?.state);

      // Step 4: Subscribe to push
      const readyRegistration = await Promise.race<ServiceWorkerRegistration>([
        navigator.serviceWorker.ready,
        new Promise<ServiceWorkerRegistration>((_, reject) =>
          setTimeout(() => reject(new Error("SW ready timeout")), SUBSCRIPTION_TIMEOUT_MS),
        ),
      ]);

      const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
      let subscription = await readyRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log("[Push] Creating new subscription...");
        subscription = await readyRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }
      console.log("[Push] Subscription obtained:", subscription.endpoint.substring(0, 60) + "...");

      // Step 5: Save to database
      const subJson = subscription.toJSON();
      console.log("[Push] Saving to DB, seller_id:", sellerId);
      
      // Upsert: update if endpoint exists, insert if new
      const { error: saveError } = await supabase.from("push_subscriptions" as any).upsert(
        {
          seller_id: sellerId,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh || "",
          auth: subJson.keys?.auth || "",
          user_agent: navigator.userAgent,
        },
        { onConflict: "endpoint" }
      );

      if (saveError) {
        console.error("[Push] Failed to save subscription:", saveError.message, saveError.code);
        toast({ title: "Erro ao salvar inscrição", description: saveError.message, variant: "destructive" });
        return false;
      }

      console.log("[Push] Subscription saved successfully!");
      setIsSubscribed(true);
      toast({ title: "Notificações ativadas! 🔔", description: "Você receberá notificações deste corretor." });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Push] Subscription failed:", msg);
      toast({ title: "Erro ao ativar push", description: msg, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, sellerId]);

  return { isSubscribed, isSupported, permission, subscribe, loading };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
