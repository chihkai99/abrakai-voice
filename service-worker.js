const CACHE_NAME = 'abrakai-cache-v4.8';
const urlsToCache = ['./index.html?v=4.8','./manifest.json?v=4.8'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME && n.startsWith('abrakai-cache-')).map(n => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.searchParams.has('v') || event.request.method !== 'GET') { event.respondWith(fetch(event.request)); return; }
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
