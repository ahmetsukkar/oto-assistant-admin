// scripts/inject-push.js
// Runs automatically after `npm run build` via the "postbuild" npm hook
// Appends push notification handlers to the generated public/sw.js

const fs = require("fs");
const path = require("path");

const swPath = path.join(__dirname, "../public/sw.js");

if (!fs.existsSync(swPath)) {
  console.error("[inject-push] ❌ public/sw.js not found. Run `npm run build` first.");
  process.exit(1);
}

const pushHandlers = `

// ─── Push Notification Handlers (injected by scripts/inject-push.js) ────────

self.addEventListener("push", function (event) {
  var data = {
    title: "OtoAssistant 🔧",
    body: "Yeni bir bildiriminiz var.",
    url: "/dashboard",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: "OtoAssistant 🔧",
        body: event.data.text() || "Yeni bir bildiriminiz var.",
        url: "/dashboard",
      };
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: { url: data.url || "/dashboard" },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
`;

let content = fs.readFileSync(swPath, "utf8");

if (content.includes("inject-push.js")) {
  console.log("[inject-push] ✅ Push handlers already present, skipping.");
  process.exit(0);
}

fs.writeFileSync(swPath, content + pushHandlers, "utf8");
console.log("[inject-push] ✅ Push handlers successfully injected into public/sw.js");