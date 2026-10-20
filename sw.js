// medbasha - Service Worker para BusTalk_v 2.9.42
const CACHE_NAME = 'bustalk-v2-9-42';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-152.png'
];

// 1. INSTALACIÓN
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// 2. ACTIVACIÓN Y LIMPIEZA DE CACHÉS ANTIGUOS
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME && cache.startsWith('bustalk-')) {
                        console.log('[Service Worker] Eliminando caché obsoleta:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. ESTRATEGIA DE RED CON RESPALDO EN CACHÉ (NETWORK FIRST)
self.addEventListener('fetch', (event) => {
    // Excluir peticiones en tiempo real a Firebase, Firestore y llamadas no-GET
    if (event.request.url.includes('firestore.googleapis.com') || 
        event.request.url.includes('firebasedatabase.app') ||
        event.request.url.includes('firebase') || 
        event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
