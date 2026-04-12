// self.addEventListener("push", function (event) {
//   if (!event.data) return;

//   let data;
//   try {
//     data = event.data.json();
//   } catch {
//     data = { title: "OtoAssistant", body: event.data.text(), url: "/dashboard" };
//   }

//   const options = {
//     body: data.body,
//     icon: "/icons/icon-192x192.png",
//     badge: "/icons/icon-192x192.png",
//     data: { url: data.url ?? "/dashboard" },
//     vibrate: [200, 100, 200],
//   };

//   event.waitUntil(
//     self.registration.showNotification(data.title, options)
//   );
// });

// self.addEventListener("notificationclick", function (event) {
//   event.notification.close();
//   const url = event.notification.data?.url ?? "/dashboard";
//   event.waitUntil(
//     clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
//       for (const client of clientList) {
//         if (client.url.includes(url) && "focus" in client) {
//           return client.focus();
//         }
//       }
//       if (clients.openWindow) {
//         return clients.openWindow(url);
//       }
//     })
//   );
// });