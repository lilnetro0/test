/* Nexus PWA service worker — caches app shell for offline reopen. */
const CACHE = "nexus-shell-v2";
const SHELL = ["/", "/site.webmanifest", "/favicon.ico", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for navigations; cache-first for shell icons/manifest
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          void caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match("/") || caches.match(req)),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && (url.pathname.startsWith("/icons/") || url.pathname.endsWith(".webmanifest"))) {
        const copy = res.clone();
        void caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    })),
  );
});

/** Phase 11 — Web Push payload from Nexus (see docs/PUSH.md). */
self.addEventListener("push", (event) => {
  let data = { title: "Nexus", body: "", href: "/notifications", tag: "nexus" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    try {
      const text = event.data && event.data.text();
      if (text) data.body = text;
    } catch {
      /* ignore */
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Nexus", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "nexus",
      data: { href: data.href || "/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href =
    (event.notification.data && event.notification.data.href) || "/notifications";
  const url = new URL(href, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          void client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
