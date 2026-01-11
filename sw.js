const CACHE_NAME = 'med-doc-v4.4-cache';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// インストール時：キャッシュできるものはしておく
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// リクエスト時：ネットワーク優先 (Network First)
// 常に最新のHTMLを取りに行き、オフラインの時だけキャッシュを使う
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 正常に取得できたらキャッシュを更新して、そのレスポンスを返す
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // オフラインやエラー時はキャッシュを返す
        return caches.match(event.request);
      })
  );
});

// 更新時：古いキャッシュを削除
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});