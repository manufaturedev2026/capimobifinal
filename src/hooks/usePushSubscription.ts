import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { detectIOS, isIOSStandaloneApp } from "@/lib/pwaInstall";

const SUBSCRIPTION_TIMEOUT_MS = 20000;
const PUSH_SW_URL = "/push-sw.js";
const PUSH_SW_SCOPE = "/push-sw-scope/";

export function usePushSubscription(
  sellerId?: string,
  options: { successDescription?: string } = {}
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

        // Check DB if this endpoint is already saved for this seller
        const { data } = await supabase
          .from("push_subscriptions" as any)
          .select("id")
          .eq("seller_id", sellerId)
          .eq("endpoint", currentEndpoint)
          .maybeSingle();

        setIsSubscribed(!!data);
      } catch {
        setIsSubscribed(false);
      }
    })();
  }, [sellerId]);

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
      const perm = await Notification.requestPermission();
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

      // Step 3: Register the dedicated push service worker
      console.log("[Push] Registering service worker...");
      let registration: ServiceWorkerRegistration | undefined;

      // Look for existing push-sw registration
      const allRegs = await navigator.serviceWorker.getRegistrations();
      registration = allRegs.find((r) => {
        const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
        return url.includes("push-sw");
      });

      if (!registration) {
        console.log("[Push] No push-sw found, registering...");
        registration = await withTimeout(
          navigator.serviceWorker.register(PUSH_SW_URL, { scope: PUSH_SW_SCOPE }),
          SUBSCRIPTION_TIMEOUT_MS,
          "Tempo esgotado ao registrar o app para push."
        );
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
      
      if (!subscription) {
        console.log("[Push] Creating new subscription...");
        subscription = await withTimeout(
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          }),
          SUBSCRIPTION_TIMEOUT_MS,
          "A inscrição no push demorou demais para responder."
        );
      }
      console.log("[Push] Subscription obtained:", subscription.endpoint.substring(0, 60) + "...");

      // Step 5: Save to database
      const subJson = subscription.toJSON();
      console.log("[Push] Saving to DB, seller_id:", sellerId);

      // Capture the currently logged-in user (if any) so private notifications
      // (like agenda visits) can be filtered to the owner's devices only.
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentUserId = currentUser?.id ?? null;

      // Upsert: update if endpoint exists, insert if new
      const { error: saveError } = await withTimeout<{ error: { message: string; code?: string } | null }>(
        Promise.resolve(
          supabase.from("push_subscriptions" as any).upsert(
            {
              seller_id: sellerId,
              user_id: currentUserId,
              endpoint: subJson.endpoint,
              p256dh: subJson.keys?.p256dh || "",
              auth: subJson.keys?.auth || "",
              user_agent: navigator.userAgent,
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
  }, [sellerId, options.successDescription]);

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
