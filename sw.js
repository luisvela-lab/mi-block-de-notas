const CACHE_NAME = 'bloc-notas-v1';
const ARCHIVOS = [
    '/mi-bloque-de-notas/',
    '/mi-bloque-de-notas/index.html',
    '/mi-bloque-de-notas/style.css',
    '/mi-bloque-de-notas/app.js',
    '/mi-bloque-de-notas/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ARCHIVOS))
            .then(() => self.skipWaiting())
    );
});

// Activar Service Worker
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

// Interceptar peticiones
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request)
            .then(res => res || fetch(e.request))
    );
});
