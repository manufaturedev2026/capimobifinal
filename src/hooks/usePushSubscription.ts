import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePushSubscription(sellerId?: string) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check if already subscribed
  useEffect(() => {
    if (!isSupported || !sellerId) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    }).catch(() => {});
  }, [isSupported, sellerId]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !sellerId) return false;
    setLoading(true);
    try {
      // Request permission first (iOS requires this before SW registration)
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setLoading(false);
        return false;
      }

      // Get VAPID public key from edge function
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke("get-vapid-key");
      if (vapidError || !vapidData?.publicKey) {
        console.error("Failed to get VAPID key:", vapidError);
        setLoading(false);
        return false;
      }

      // Register service worker
      let registration: ServiceWorkerRegistration;
      try {
        registration = await navigator.serviceWorker.register("/push-sw.js");
        // Wait for the SW to be ready with a timeout
        const readyPromise = navigator.serviceWorker.ready;
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("SW ready timeout")), 10000)
        );
        await Promise.race([readyPromise, timeoutPromise]);
      } catch (swErr) {
        console.error("Service Worker registration failed:", swErr);
        setLoading(false);
        return false;
      }

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subJson = subscription.toJSON();

      // Save to database
      await supabase.from("push_subscriptions" as any).upsert({
        seller_id: sellerId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh || "",
        auth: subJson.keys?.auth || "",
        user_agent: navigator.userAgent,
      }, { onConflict: "seller_id,endpoint" });

      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Push subscription failed:", err);
      setLoading(false);
      return false;
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
