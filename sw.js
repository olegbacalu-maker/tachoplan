/* TachoPlan Fleet service worker — offline-first PWA.
   Navigations: network-first (app updates arrive as soon as you're online),
   falling back to cache offline. Static assets: cache-first. */
"use strict";
const CACHE = "tachoplan-v3.3.3";
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "./fonts/inter-latin.woff2", "./fonts/inter-latin-ext.woff2",
  "./fonts/inter-cyrillic.woff2", "./fonts/inter-cyrillic-ext.woff2"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Everything this app needs is served from its own origin — the Inter files
  // are bundled — so a cross-origin request is never ours to cache.
  if (new URL(req.url).origin !== location.origin) return;

  if (req.mode === "navigate") {
    // network-first so a deployed update is picked up immediately
    e.respondWith(
      fetch(req)
        .then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put("./", cp)); return res; })
        .catch(() => caches.match("./"))
    );
    return;
  }
  // assets: cache-first, populated on first fetch
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) {
        const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp));
      }
      return res;
    }))
  );
});
