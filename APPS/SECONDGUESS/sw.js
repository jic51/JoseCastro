const CACHE_NAME = 'secondguess-v1';
const urlsToCache = [
  '.',
  './css/style.css',
  './js/i18n.js',
  './js/questions.js',
  './js/security.js',
  './js/ui.js',
  './js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});