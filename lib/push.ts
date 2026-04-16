// lib/push.ts
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  console.log("🔔 subscribeToPush called");

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications not supported in this browser.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log("Permission result:", permission);

    if (permission !== "granted") {
      console.warn("Push notification permission denied.");
      return null;
    }

    // Get the existing registration first
    let registration = await navigator.serviceWorker.getRegistration("/");

    // If no registration found, wait for it with a longer timeout
    if (!registration) {
      registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Service worker not found after 10s")),
            10_000,
          ),
        ),
      ]) as ServiceWorkerRegistration;
    }

    // If SW is installed but not yet active, wait for it to activate
    if (!registration.active) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("SW activation timeout")),
          10_000,
        );
        const sw = registration!.installing ?? registration!.waiting;
        if (!sw) {
          clearTimeout(timeout);
          resolve();
          return;
        }
        sw.addEventListener("statechange", (e) => {
          if ((e.target as ServiceWorker).state === "activated") {
            clearTimeout(timeout);
            resolve();
          }
        });
      });
    }

    console.log("SW ready:", registration.active?.scriptURL);

    // Reuse existing subscription if present
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      console.log("✅ Reusing existing subscription:", existing.endpoint);
      return existing;
    }

    // Create new subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log("✅ New subscription created:", subscription.endpoint);
    return subscription;

  } catch (err) {
    console.error("❌ Push subscription failed:", err);
    return null;
  }
}

export async function sendSubscriptionToBackend(
  subscription: PushSubscription,
): Promise<void> {
  const adminKey =
    typeof window !== "undefined"
      ? (sessionStorage.getItem("admin_key") ?? "")
      : "";

  const json = subscription.toJSON();

  console.log("📡 Sending subscription to backend...");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/push/subscribe`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Key": adminKey,
      },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Push subscribe failed: HTTP ${res.status}`);
  }

  console.log("✅ Subscription saved to backend!");
}
