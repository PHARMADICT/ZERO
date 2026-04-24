const CACHE_NAME = 'zero-file-qr-pwa-v1';
const ASSETS = ['./','./index.html','./style.css','./app.js','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
