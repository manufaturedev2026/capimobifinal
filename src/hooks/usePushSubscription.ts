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
      // Check existing subscription
      navigator.serviceWorker.getRegistration("/push-sw.js").then(async (reg) => {
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) setIsSubscribed(true);
        }
      }).catch(() => {});
    }
  }, [sellerId]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !sellerId) return false;
    setLoading(true);
    try {
      // 1. Request permission first
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setLoading(false);
        return false;
      }

      // 2. Get VAPID key
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke("get-vapid-key");
      if (vapidError || !vapidData?.publicKey) {
        console.error("Failed to get VAPID key:", vapidError);
        setLoading(false);
        return false;
      }

      // 3. Register SW and wait for it to be active
      const registration = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
      
      // Wait for the SW to become active
      const sw = registration.installing || registration.waiting || registration.active;
      if (sw && sw.state !== "activated") {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("SW activation timeout")), 15000);
          sw.addEventListener("statechange", function handler() {
            if (sw.state === "activated") {
              clearTimeout(timeout);
              sw.removeEventListener("statechange", handler);
              resolve();
            } else if (sw.state === "redundant") {
              clearTimeout(timeout);
              sw.removeEventListener("statechange", handler);
              reject(new Error("SW became redundant"));
            }
          });
          if (sw.state === "activated") {
            clearTimeout(timeout);
            resolve();
          }
        });
      }

      // 4. Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subJson = subscription.toJSON();

      // 5. Save to database
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
