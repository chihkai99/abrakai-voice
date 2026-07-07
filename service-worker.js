const CACHE_NAME = 'abrakai-cache-v5.7';
const urlsToCache = ['./index.html?v=5.7','./manifest.json?v=5.7'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).catch(() => undefined));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE_NAME && n.startsWith('abrakai-cache-')).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) { return; }
  const req = event.request;
  const url = new URL(req.url);

  // 不攔截外部 API / Cloudflare Worker / AI 供應商請求，避免把後端連線錯誤變成 Service Worker 錯誤。
  if (url.origin !== self.location.origin) return;
  if (req.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  // HTML 採 network-first，失敗才回快取，讓 GitHub Pages 更新比較容易被手機拿到。
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone)).catch(() => undefined);
        return res;
      }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html?v=5.7')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, clone)).catch(() => undefined);
      return res;
    })).catch(() => new Response('', {status: 504, statusText: 'Network unavailable'}))
  );
});
