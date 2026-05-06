// Minimal SW required for Android PWA install criteria (beforeinstallprompt).
// No caching — passthrough fetch handler only.
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => { /* passthrough, no cache */ });
