self.addEventListener("install", function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

function normalizeNotificationData(raw) {
  const fallback = { title: "Nova notificação", body: "Você recebeu uma nova mensagem", url: "/", image: undefined };

  if (!raw) return fallback;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return {
        title: parsed?.title || fallback.title,
        body: parsed?.body || fallback.body,
        url: parsed?.url || fallback.url,
        image: parsed?.image || undefined,
      };
    } catch {
      return { ...fallback, body: raw };
    }
  }

  return {
    title: raw?.title || fallback.title,
    body: raw?.body || fallback.body,
    url: raw?.url || fallback.url,
    image: raw?.image || undefined,
  };
}

self.addEventListener("push", function (event) {
  const showPromise = (async function () {
    let data = normalizeNotificationData(null);

    try {
      data = normalizeNotificationData(event.data ? event.data.json() : null);
    } catch {
      try {
        data = normalizeNotificationData(event.data ? event.data.text() : null);
      } catch {
        data = normalizeNotificationData(null);
      }
    }

    console.log("[push-sw] payload received:", JSON.stringify(data));

    const options = {
      body: data.body || "Você recebeu uma nova mensagem",
      icon: "/pwa-icon-192.png",
      badge: "/pwa-icon-192.png",
      vibrate: [200, 100, 200],
      tag: "capimobi-push-" + Date.now(),
      renotify: true,
      requireInteraction: false,
      silent: false,
      data: { url: data.url || "/" },
    };

    if (data.image) {
      options.image = data.image;
    }

    try {
      await self.registration.showNotification(data.title || "Nova notificação", options);
      console.log("[push-sw] notification shown");
    } catch (err) {
      console.error("[push-sw] showNotification failed:", err);
      // Fallback minimal notification
      await self.registration.showNotification(data.title || "Nova notificação", {
        body: data.body || "",
        icon: "/pwa-icon-192.png",
      });
    }
  })();

  event.waitUntil(showPromise);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const rawUrl = event.notification.data?.url || "/";
  let targetUrl = "/";

  try {
    targetUrl = new URL(rawUrl, self.location.origin).toString();
  } catch {
    targetUrl = new URL("/", self.location.origin).toString();
  }

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })()
  );
});
