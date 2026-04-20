if(!self.define){let e,s={};const a=(a,n)=>(a=new URL(a+".js",n).href,s[a]||new Promise(s=>{if("document"in self){const e=document.createElement("script");e.src=a,e.onload=s,document.head.appendChild(e)}else e=a,importScripts(a),s()}).then(()=>{let e=s[a];if(!e)throw new Error(`Module ${a} didn’t register its module`);return e}));self.define=(n,t)=>{const i=e||("document"in self?document.currentScript.src:"")||location.href;if(s[i])return;let c={};const r=e=>a(e,i),d={module:{uri:i},exports:c,require:r};s[i]=Promise.all(n.map(e=>d[e]||r(e))).then(e=>(t(...e),c))}}define(["./workbox-f1770938"],function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/0cBZLu9tfrbb2gbswgqiC/_buildManifest.js",revision:"c9cbbb3815df2d54071ac09020c2f365"},{url:"/_next/static/0cBZLu9tfrbb2gbswgqiC/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/17-e1fe250815b8d9dc.js",revision:"e1fe250815b8d9dc"},{url:"/_next/static/chunks/188-7fcafdbca12e29db.js",revision:"7fcafdbca12e29db"},{url:"/_next/static/chunks/411-73940a59ca0f95a4.js",revision:"73940a59ca0f95a4"},{url:"/_next/static/chunks/4bd1b696-215e5051988c3dde.js",revision:"215e5051988c3dde"},{url:"/_next/static/chunks/527-8ddc715d87c889eb.js",revision:"8ddc715d87c889eb"},{url:"/_next/static/chunks/570-2c9fd0695a2c7e93.js",revision:"2c9fd0695a2c7e93"},{url:"/_next/static/chunks/677-8a4d3cb31807aae4.js",revision:"8a4d3cb31807aae4"},{url:"/_next/static/chunks/899.1813981119fa1f8a.js",revision:"1813981119fa1f8a"},{url:"/_next/static/chunks/912-ca9188cd835687ce.js",revision:"ca9188cd835687ce"},{url:"/_next/static/chunks/928-d4661670a3668a04.js",revision:"d4661670a3668a04"},{url:"/_next/static/chunks/966.1775eb621d8d3e09.js",revision:"1775eb621d8d3e09"},{url:"/_next/static/chunks/app/(protected)/appointments/page-31fa1d85e901397e.js",revision:"31fa1d85e901397e"},{url:"/_next/static/chunks/app/(protected)/customers/page-5358b911b9c47a0b.js",revision:"5358b911b9c47a0b"},{url:"/_next/static/chunks/app/(protected)/dashboard/page-6e5702f1f1ca2bda.js",revision:"6e5702f1f1ca2bda"},{url:"/_next/static/chunks/app/(protected)/layout-fab68c3de2b3476f.js",revision:"fab68c3de2b3476f"},{url:"/_next/static/chunks/app/(protected)/services/page-d17df9d025e7c135.js",revision:"d17df9d025e7c135"},{url:"/_next/static/chunks/app/(protected)/settings/page-9209c172ed5b6bb1.js",revision:"9209c172ed5b6bb1"},{url:"/_next/static/chunks/app/_global-error/page-a3d4f8e832675edd.js",revision:"a3d4f8e832675edd"},{url:"/_next/static/chunks/app/_not-found/page-35a7c6a3ab832630.js",revision:"35a7c6a3ab832630"},{url:"/_next/static/chunks/app/layout-7cc3d9e5f7f7ed0b.js",revision:"7cc3d9e5f7f7ed0b"},{url:"/_next/static/chunks/app/page-55dbb2bf3efd7012.js",revision:"55dbb2bf3efd7012"},{url:"/_next/static/chunks/framework-93cda6578f6c76ec.js",revision:"93cda6578f6c76ec"},{url:"/_next/static/chunks/main-aa266eeeb55853eb.js",revision:"aa266eeeb55853eb"},{url:"/_next/static/chunks/main-app-abe22b181fb578e2.js",revision:"abe22b181fb578e2"},{url:"/_next/static/chunks/next/dist/client/components/builtin/app-error-a3d4f8e832675edd.js",revision:"a3d4f8e832675edd"},{url:"/_next/static/chunks/next/dist/client/components/builtin/forbidden-a3d4f8e832675edd.js",revision:"a3d4f8e832675edd"},{url:"/_next/static/chunks/next/dist/client/components/builtin/global-error-589032b165fda290.js",revision:"589032b165fda290"},{url:"/_next/static/chunks/next/dist/client/components/builtin/not-found-a3d4f8e832675edd.js",revision:"a3d4f8e832675edd"},{url:"/_next/static/chunks/next/dist/client/components/builtin/unauthorized-a3d4f8e832675edd.js",revision:"a3d4f8e832675edd"},{url:"/_next/static/chunks/polyfills-42372ed130431b0a.js",revision:"846118c33b2c0e922d7b3a7676f81f6f"},{url:"/_next/static/chunks/webpack-fe9dd80b6e85074f.js",revision:"fe9dd80b6e85074f"},{url:"/_next/static/css/933a73ee32c675cd.css",revision:"933a73ee32c675cd"},{url:"/_next/static/media/4cf2300e9c8272f7-s.p.woff2",revision:"18bae71b1e1b2bb25321090a3b563103"},{url:"/_next/static/media/8d697b304b401681-s.woff2",revision:"cc728f6c0adb04da0dfcb0fc436a8ae5"},{url:"/_next/static/media/ba015fad6dcf6784-s.woff2",revision:"8ea4f719af3312a055caf09f34c89a77"},{url:"/file.svg",revision:"d09f95206c3fa0bb9bd9fefabfd0ea71"},{url:"/globe.svg",revision:"2aaafa6a49b6563925fe440891e32717"},{url:"/icons/icon-192x192.png",revision:"53d19014e3b25c0f5831f2ee3cb2dd4d"},{url:"/icons/icon-512x512.png",revision:"9d123998ed144dd8ffb2614b579fc287"},{url:"/manifest.json",revision:"12d9a0cad2624e7f6cb28b0b63e922a0"},{url:"/next.svg",revision:"8e061864f388b47f33a1c3780831193e"},{url:"/vercel.svg",revision:"c0af2f507b369b085b35ef4bbe3bcf1e"},{url:"/window.svg",revision:"a2760511c65806022ad20adf74370ff3"}],{ignoreURLParametersMatching:[/^utm_/,/^fbclid$/]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({response:e})=>e&&"opaqueredirect"===e.type?new Response(e.body,{status:200,statusText:"OK",headers:e.headers}):e}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:2592e3})]}),"GET"),e.registerRoute(/\/_next\/static.+\.js$/i,new e.CacheFirst({cacheName:"next-static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4|webm)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:48,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({sameOrigin:e,url:{pathname:s}})=>!(!e||s.startsWith("/api/auth/callback")||!s.startsWith("/api/")),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({request:e,url:{pathname:s},sameOrigin:a})=>"1"===e.headers.get("RSC")&&"1"===e.headers.get("Next-Router-Prefetch")&&a&&!s.startsWith("/api/"),new e.NetworkFirst({cacheName:"pages-rsc-prefetch",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({request:e,url:{pathname:s},sameOrigin:a})=>"1"===e.headers.get("RSC")&&a&&!s.startsWith("/api/"),new e.NetworkFirst({cacheName:"pages-rsc",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({url:{pathname:e},sameOrigin:s})=>s&&!e.startsWith("/api/"),new e.NetworkFirst({cacheName:"pages",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({sameOrigin:e})=>!e,new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET"),self.__WB_DISABLE_DEV_LOGS=!0});


// ===== Push Notification Handlers =====
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
