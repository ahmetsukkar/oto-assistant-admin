// public/sw.js - Manual Service Worker
// Bump CACHE_VERSION on every deploy so old caches are cleaned out and
// users don't get stuck on stale JS chunks.
const CACHE_VERSION = "assistly-v1";

self.addEventListener("install", function(event) {
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  // Delete any old caches whose name doesn't match the current version.
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_VERSION; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return clients.claim(); })
  );
});

self.addEventListener("push", function(event) {
  var data = {
    title: "Assistly",
    body: "Yeni bir bildiriminiz var.",
    url: "/dashboard"
  };
  if (event.data) {
    try {
      data = event.data.json();
    } catch(e) {
      data = {
        title: "Assistly",
        body: event.data.text() || "Yeni bir bildiriminiz var.",
        url: "/dashboard"
      };
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      data: { url: data.url || "/dashboard" },
      vibrate: [200, 100, 200],
      requireInteraction: false
    })
  );
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
