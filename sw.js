const SCOPE = self.registration.scope;
const PREFIX = 'med-doc-gen:' + SCOPE + ':';
const CACHE_NAME = PREFIX + '5.5.0';
const assets = ['./', 'index.html', 'manifest.json', 'icon.png', 'compare.html'].map(path => new URL(path, SCOPE).href);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(assets.map(url => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(PREFIX) && name !== CACHE_NAME) await caches.delete(name);
      if (name === 'med-doc-v4.4-cache') {
        const old = await caches.open(name);
        for (const request of await old.keys()) {
          if (request.url.startsWith(SCOPE)) await old.delete(request);
        }
        if ((await old.keys()).length === 0) await caches.delete(name);
      }
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const page = url.origin + url.pathname;
  if (request.mode === 'navigate' && (page === SCOPE || page === assets[1])) {
    event.respondWith(fetch(request, { cache: 'no-cache' }).catch(async () =>
      (await caches.open(CACHE_NAME)).match(assets[1])));
  } else if (assets.includes(request.url)) {
    event.respondWith((async () => (await (await caches.open(CACHE_NAME)).match(request)) || fetch(request))());
  }
});
