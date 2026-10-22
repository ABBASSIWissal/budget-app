const CACHE_NAME = 'mon-budget-v2';

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

// Stratégie Network First : va chercher en priorité sur GitHub / Réseau
// pour mettre à jour l'application sur tous les appareils dès qu'il y a une connexion.
self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function (networkResponse) {
                if (networkResponse && networkResponse.status === 200) {
                    const responseCopy = networkResponse.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, responseCopy);
                    });
                }
                return networkResponse;
            })
            .catch(function () {
                return caches.match(event.request).then(function (cachedResponse) {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return caches.match('./index.html');
                });
            })
    );
});
