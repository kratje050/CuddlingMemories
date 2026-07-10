const CACHE_NAME = "cm-admin-pwa-v1";
const OFFLINE_URL = "/admin-app/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL])));
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
  }
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Cuddling Memories Admin", {
      body: data.body || "Nieuwe melding",
      icon: "/admin-app/icon-192.png",
      badge: "/admin-app/icon-192.png",
      data: data.url || "/admin-app/",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || "/admin-app/"));
});
