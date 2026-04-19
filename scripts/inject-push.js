// scripts/inject-push.js
const fs = require("fs");
const path = require("path");

const swPath = path.join(__dirname, "..", "public", "sw.js");

const pushHandler = `

// ===== Push Notification Handlers =====
self.addEventListener("push", function(event) {
  var data = {
    title: "OtoAssistant \uD83D\uDD27",
    body: "Yeni bir bildiriminiz var.",
    url: "/dashboard"
  };
  if (event.data) {
    try {
      data = event.data.json();
    } catch(e) {
      data = {
        title: "OtoAssistant \uD83D\uDD27",
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
`;

if (!fs.existsSync(swPath)) {
  console.error("❌ sw.js not found at", swPath);
  process.exit(1);
}

const current = fs.readFileSync(swPath, "utf8");

if (current.includes('addEventListener("push"')) {
  console.log("✅ Push handler already present in sw.js — skipping.");
  process.exit(0);
}

fs.writeFileSync(swPath, current + pushHandler, "utf8");
console.log("✅ Push handler injected into sw.js successfully.");