const CACHE_NAME = 'pachinko-calc-v1';

// キャッシュするリソース
const CACHE_URLS = [
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap'
];

// インストール時：リソースをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // メインHTMLは必須キャッシュ、外部リソースは失敗しても続行
      return cache.addAll(['./index.html']).then(() => {
        return Promise.allSettled(
          CACHE_URLS.slice(1).map(url =>
            cache.add(url).catch(() => console.log('Optional cache failed:', url))
          )
        );
      });
    }).then(() => self.skipWaiting())
  );
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// フェッチ時：キャッシュ優先、なければネット取得してキャッシュ
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // 正常なレスポンスのみキャッシュ
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // 完全オフライン時はキャッシュから最善を尽くす
        return caches.match('./index.html');
      });
    })
  );
});
