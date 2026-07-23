const CACHE_NAME = 'bloc-notas-v1';
const ARCHIVOS = [
    '/mi-block-de-notas/',
    '/mi-block-de-notas/index.html',
    '/mi-block-de-notas/style.css',
    '/mi-block-de-notas/app.js',
    '/mi-block-de-notas/manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ARCHIVOS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request)
            .then(res => res || fetch(e.request))
    );
});
