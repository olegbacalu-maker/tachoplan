/* TachoPlan Fleet service worker — offline-first PWA.
   Navigations: network-first (app updates arrive as soon as you're online),
   falling back to cache offline. Static assets & fonts: cache-first. */
"use strict";
const CACHE = "tachoplan-v2.0.0";
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

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
  const url = new URL(req.url);
  const isFont = FONT_HOSTS.includes(url.host);
  if (url.origin !== location.origin && !isFont) return;

  if (req.mode === "navigate") {
    // network-first so a deployed update is picked up immediately
    e.respondWith(
      fetch(req)
        .then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put("./", cp)); return res; })
        .catch(() => caches.match("./"))
    );
    return;
  }
  // assets & fonts: cache-first, populate on first fetch
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) {
        const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp));
      }
      return res;
    }))
  );
});
