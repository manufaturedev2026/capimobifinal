self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

function normalizeNotificationData(raw) {
  const fallback = { title: "Nova notificação", body: "", url: "/", image: undefined };

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
  event.waitUntil((async function () {
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

    const options = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      vibrate: [100, 50, 100],
      data: { url: data.url || "/" },
      actions: [{ action: "open", title: "Abrir" }],
    };

    if (data.image) {
      options.image = data.image;
    }

    await self.registration.showNotification(data.title || "Nova notificação", options);
  })());
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

  event.waitUntil(clients.openWindow(targetUrl));
});
