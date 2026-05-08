import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { detectIOS, isIOSStandaloneApp } from "@/lib/pwaInstall";

type PushSubscriptionRow = Database["public"]["Tables"]["push_subscriptions"]["Row"];

const SUBSCRIPTION_TIMEOUT_MS = 60000;
const PERMISSION_TIMEOUT_MS = 20000;
const SUBSCRIBE_TIMEOUT_MS = 30000;
const SW_REGISTER_TIMEOUT_MS = 30000;
const PUSH_SW_URL = "/push-sw.js";
const PUSH_SW_SCOPE = "/push-notifications/";
// Dedicated scope keeps notification push separate from the main PWA/offline worker.

export function usePushSubscription(
  sellerId?: string,
  options: { successDescription?: string; scope?: "store" | "panel" | "admin_home" } = {}
) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [unsupportedReason, setUnsupportedReason] = useState<string | null>(null);

  useEffect(() => {
    const isPreviewHost = window.location.hostname.includes("id-preview--") || window.location.hostname.includes("lovableproject.com");
    const isEmbeddedPreview = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    if (isPreviewHost || isEmbeddedPreview) {
      setIsSupported(false);
      setUnsupportedReason("No preview do editor o push não ativa de forma confiável. Teste na versão publicada do app.");
      return;
    }

    if (detectIOS() && !isIOSStandaloneApp()) {
      setIsSupported(false);
      setUnsupportedReason("No iPhone o push só funciona com o app instalado na Tela Inicial.");
      return;
    }

    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    setUnsupportedReason(supported ? null : "Seu navegador não suporta notificações push.");

    if (!supported) return;

    setPermission(Notification.permission);

    // Check if THIS device is subscribed to THIS specific seller
    (async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        let currentEndpoint: string | null = null;
        for (const reg of registrations) {
          const url = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || "";
          if (url.includes("push-sw")) {
            const subscription = await reg.pushManager.getSubscription();
            if (subscription) {
              currentEndpoint = subscription.endpoint;
              break;
            }
          }
        }

        if (!currentEndpoint || !sellerId) {
          setIsSubscribed(false);
          return;
        }

        const scope = options.scope ?? "store";
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const currentUserId = currentUser?.id ?? null;

        // Check DB if this endpoint is already saved for this seller.
        // If it was saved before login (user_id null) or under an old scope,
        // repair it so private pushes (agenda/CRM) target the panel owner device.
        const { data } = await supabase
          .from("push_subscriptions")
          .select("id,user_id,scope")
          .eq("seller_id", sellerId)
          .eq("endpoint", currentEndpoint)
          .maybeSingle();

        const savedSubscription = data as Pick<PushSubscriptionRow, "id" | "user_id" | "scope"> | null;
        if (savedSubscription?.id && currentUserId && (savedSubscription.user_id !== currentUserId || savedSubscription.scope !== scope)) {
          await supabase
            .from("push_subscriptions")
            .update({ user_id: currentUserId, scope })
            .eq("id", savedSubscription.id);
        }

        setIsSubscribed(!!savedSubscription);
      } catch {
        setIsSubscribed(false);
      }
    })();
  }, [sellerId, options.scope]);

  const subscribe = useCallback(async () => {
    if (!sellerId) {
      console.warn("[Push] No sellerId");
      toast({ title: "Push indisponível", description: "ID do vendedor não encontrado.", variant: "destructive" });
      return false;
    }

    // Re-check support at call time (not just from initial useEffect)
    const hasPushApi = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!hasPushApi) {
      console.warn("[Push] Browser does not support push");
      toast({ title: "Push indisponível", description: "Seu navegador não suporta notificações push.", variant: "destructive" });
      return false;
    }

    setLoading(true);

    try {
      // Step 1: Request permission
      console.log("[Push] Requesting permission...");
      const perm = await withTimeout(
        Notification.requestPermission(),
        PERMISSION_TIMEOUT_MS,
        "O iPhone demorou demais para responder à permissão. Feche e abra o app, depois tente novamente."
      );
      setPermission(perm);

      if (perm !== "granted") {
        console.warn("[Push] Permission result:", perm);
        toast({ 
          title: "Permissão negada", 
          description: perm === "denied" 
            ? "Notificações foram bloqueadas. Vá nas configurações do navegador para permitir." 
            : "Toque em 'Permitir' quando o navegador solicitar a permissão.", 
          variant: "destructive" 
        });
        return false;
      }
      console.log("[Push] Permission granted");

      // Step 2: Get VAPID key
      console.log("[Push] Fetching VAPID key...");
      const { data: vapidData, error: vapidError } = await withTimeout<{
        data: { publicKey?: string } | null;
        error: { message?: string } | null;
      }>(
        supabase.functions.invoke("get-vapid-key") as Promise<{
          data: { publicKey?: string } | null;
          error: { message?: string } | null;
        }>,
        SUBSCRIPTION_TIMEOUT_MS,
        "Tempo esgotado ao carregar a configuração do push."
      );

      if (vapidError || !vapidData?.publicKey) {
        console.error("[Push] Failed to get VAPID key:", vapidError);
        toast({ title: "Erro ao configurar push", description: "Não foi possível obter a chave do servidor.", variant: "destructive" });
        return false;
      }
      console.log("[Push] VAPID key received");

      // Step 3: Register the dedicated push service worker.
      // iOS PWA can hang when repeatedly re-registering/unregistering workers,
      // so reuse any existing push worker before attempting a fresh register.
      console.log("[Push] Registering service worker...");
      let registration = await getExistingPushRegistration();
      try {
        registration = registration ?? await registerPushWorker();
      } catch (regErr) {
        console.warn("[Push] register() failed, cleaning up stale SWs and retrying:", regErr);
        try {
          await cleanupPushRegistrations();
        } catch {
          console.warn("[Push] Failed to clean stale push service workers before retry.");
        }
        registration = await registerPushWorker("Não foi possível registrar o app para push. Feche e abra o app, depois tente novamente.");
      }

      // Only wait for activation if not already active
      if (!registration.active && (registration.installing || registration.waiting)) {
        console.log("[Push] SW registered, waiting for activation...");
        await waitForActivation(registration);
      }
      console.log("[Push] push-sw state:", registration.active?.state);

      // Step 4: Subscribe to push
      if (!registration.active) {
        console.log("[Push] Waiting for push-sw to activate...");
        await waitForActivation(registration);
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
      let subscription = await withTimeout(
        registration.pushManager.getSubscription(),
        SUBSCRIPTION_TIMEOUT_MS,
        "Não foi possível verificar a inscrição atual deste dispositivo."
      );

      // If an existing subscription was created with a different VAPID key,
      // pushManager.subscribe() throws "Registration failed - A subscription
      // with a different applicationServerKey already exists". Unsubscribe stale.
      if (subscription) {
        const existingKey = subscription.options?.applicationServerKey;
        const sameKey = existingKey
          ? new Uint8Array(existingKey).every((b, i) => b === applicationServerKey[i]) &&
            new Uint8Array(existingKey).length === applicationServerKey.length
          : false;
        if (!sameKey) {
          console.log("[Push] Stale subscription with different VAPID key, unsubscribing...");
          try {
            await withTimeout(
              subscription.unsubscribe(),
              SUBSCRIPTION_TIMEOUT_MS,
              "Não foi possível limpar a inscrição antiga deste dispositivo."
            );
          } catch {
            console.warn("[Push] Failed to remove stale push subscription before retry.");
          }
          subscription = null;
        }
      }

      if (!subscription) {
        console.log("[Push] Creating new subscription...");
        try {
          subscription = await withTimeout(
            registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey,
            }),
            SUBSCRIBE_TIMEOUT_MS,
            "A inscrição no push demorou demais para responder."
          );
        } catch (subErr) {
          const m = subErr instanceof Error ? subErr.message : String(subErr);
          // Retry once after fully unregistering the SW (handles corrupt state on Android)
          console.warn("[Push] subscribe() failed, retrying after SW reset:", m);
          try {
            await withTimeout(
              registration.unregister(),
              SUBSCRIPTION_TIMEOUT_MS,
              "Não foi possível reiniciar o suporte a push deste dispositivo."
            );
          } catch {
            console.warn("[Push] Failed to unregister push service worker before retry.");
          }
          const fresh = await withTimeout(
            navigator.serviceWorker.register(PUSH_SW_URL),
            SW_REGISTER_TIMEOUT_MS,
            "Não foi possível registrar o app para push. Tente fechar e abrir o app."
          );
          await waitForActivation(fresh);
          subscription = await withTimeout(
            fresh.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey,
            }),
            SUBSCRIBE_TIMEOUT_MS,
            "A inscrição no push demorou demais para responder. Feche e abra o app, depois tente novamente."
          );
          registration = fresh;
        }
      }
      console.log("[Push] Subscription obtained:", subscription.endpoint.substring(0, 60) + "...");

      // Step 5: Save to database
      const subJson = subscription.toJSON();
      console.log("[Push] Saving to DB, seller_id:", sellerId);

      // Capture the currently logged-in user (if any) so private notifications
      // (like agenda visits) can be filtered to the owner's devices only.
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentUserId = currentUser?.id ?? null;
      const scope = options.scope ?? "store";

      // Upsert: update if endpoint exists, insert if new
      const { error: saveError } = await withTimeout<{ error: { message: string; code?: string } | null }>(
        Promise.resolve(
          supabase.from("push_subscriptions").upsert(
            {
              seller_id: sellerId,
              user_id: currentUserId,
              endpoint: subJson.endpoint,
              p256dh: subJson.keys?.p256dh || "",
              auth: subJson.keys?.auth || "",
              user_agent: navigator.userAgent,
              scope,
            },
            { onConflict: "endpoint" }
          )
        ) as Promise<{ error: { message: string; code?: string } | null }>,
        SUBSCRIPTION_TIMEOUT_MS,
        "O salvamento da inscrição demorou demais para responder."
      );

      if (saveError) {
        console.error("[Push] Failed to save subscription:", saveError.message, saveError.code);
        toast({ title: "Erro ao salvar inscrição", description: saveError.message, variant: "destructive" });
        return false;
      }

      console.log("[Push] Subscription saved successfully!");
      setIsSubscribed(true);
      toast({ title: "Notificações ativadas! 🔔", description: options.successDescription || "Você receberá notificações deste perfil." });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Push] Subscription failed:", msg);
      toast({ title: "Erro ao ativar push", description: msg, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [sellerId, options.successDescription, options.scope]);

  return { isSubscribed, isSupported, permission, subscribe, loading, unsupportedReason };
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

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

async function waitForActivation(registration: ServiceWorkerRegistration) {
  const worker = registration.installing || registration.waiting;
  if (!worker) return;
  if (worker.state === "activated" || worker.state === "activating") {
    // Already activating/activated — wait briefly for it to finish
    if (worker.state === "activating") {
      await new Promise<void>((resolve) => {
        const check = () => { if (worker.state === "activated") resolve(); };
        worker.addEventListener("statechange", check);
        setTimeout(resolve, 3000); // fallback
      });
    }
    return;
  }

  await withTimeout(
    new Promise<void>((resolve) => {
      worker.addEventListener("statechange", () => {
        if (worker.state === "activated") resolve();
      });
      // Also resolve if already activated by the time listener is added
      if (worker.state === "activated") resolve();
    }),
    10000,
    "O app demorou demais para ativar o suporte a notificações."
  );
}
