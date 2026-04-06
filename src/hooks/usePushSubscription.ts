import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    if (!isSupported || !sellerId) return false;

    setLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        return false;
      }

      const { data: vapidData, error: vapidError } = await supabase.functions.invoke("get-vapid-key");

      if (vapidError || !vapidData?.publicKey) {
        console.error("Failed to get VAPID key:", vapidError);
        return false;
      }

      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
      }

      const readyRegistration = await Promise.race<ServiceWorkerRegistration>([
        navigator.serviceWorker.ready,
        new Promise<ServiceWorkerRegistration>((_, reject) =>
          setTimeout(() => reject(new Error("SW ready timeout")), SUBSCRIPTION_TIMEOUT_MS),
        ),
      ]);

      const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
      const existingSubscription = await readyRegistration.pushManager.getSubscription();
      const subscription =
        existingSubscription ||
        (await readyRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        }));

      const subJson = subscription.toJSON();
      const { error: saveError } = await supabase.from("push_subscriptions" as any).insert(
        {
          seller_id: sellerId,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh || "",
          auth: subJson.keys?.auth || "",
          user_agent: navigator.userAgent,
        },
      );

      if (saveError && saveError.code !== "23505") {
        console.error("Failed to save push subscription:", saveError);
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscription failed:", err);
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
