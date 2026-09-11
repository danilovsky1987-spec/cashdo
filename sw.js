/* Service worker HomeDo — оффлайн-режим.

   Что делает: при первом открытии складывает файлы приложения в кэш
   телефона. Дальше страница берётся из кэша, интернет не нужен.

   ВАЖНО при обновлении сайта: поменяй число в VERSION (например
   v3 → v4). Иначе телефон продолжит показывать старую версию из кэша. */

const VERSION = "homedo-dengi-v5";
const SHELL = [
  "./",
  "./index.html",
  "./instrukciya.html",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

/* Старые кэши от прошлых версий подчищаем, чтобы место не копилось. */
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Сначала кэш — так приложение открывается мгновенно и без сети.
   Параллельно тихо тянем свежую копию на следующий запуск. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);

      return hit || net;
    })
  );
});
