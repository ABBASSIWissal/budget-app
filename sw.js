const CACHE_NAME = 'mon-budget-v1';

const FILES_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/app.js',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function (cacheName) {
                        return cacheName !== CACHE_NAME;
                    })
                    .map(function (cacheName) {
                        return caches.delete(cacheName);
                    })
            );
        })
    );

    self.clients.claim();
});

self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function (cachedResponse) {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then(function (networkResponse) {
                const responseCopy =
                    networkResponse.clone();

                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(
                        event.request,
                        responseCopy
                    );
                });

                return networkResponse;
            });
        }).catch(function () {
            return caches.match('./index.html');
        })
    );
});