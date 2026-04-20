// public/sw.js - Manual Service Worker

self.addEventListener("install", function(event) {
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", function(event) {
  var data = {
    title: "OtoAssistant 🔧",
    body: "Yeni bir bildiriminiz var.",
    url: "/dashboard"
  };
  if (event.data) {
    try {
      data = event.data.json();
    } catch(e) {
      data = {
        title: "OtoAssistant 🔧",
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