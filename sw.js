/* LetterCracker — Service Worker (PWA basics)
   Caches core pages for offline fallback.
   Version bump CACHE_NAME to force refresh when deploying major updates. */

const CACHE_NAME = 'lc-cache-v2';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/shared.js',
  '/main.js',
  '/words-db.js',
  '/anagram.html',
  '/wordle.html',
  '/dictionary.html',
  '/word-scramble.html',
  '/random-word.html',
  '/404.html',
  /* Word shards — cached on first use, served from cache on repeat visits */
  '/word-shards/wd-2-4.js',
  '/word-shards/wd-5-6.js',
  '/word-shards/wd-7.js',
  '/word-shards/wd-8.js',
  '/word-shards/wd-9.js',
  '/word-shards/wd-10.js',
  '/word-shards/wd-11-12.js',
  '/word-shards/wd-13-15.js',
  '/word-shards/wd-16up.js',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap'
];

/* Install — cache core assets */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* Activate — delete old caches */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Fetch — network first, fall back to cache */
self.addEventListener('fetch', event => {
  /* Only handle GET requests */
  if (event.request.method !== 'GET') return;
  /* Skip admin pages — always fetch live */
  if (event.request.url.includes('admin')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        /* Cache successful responses */
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        /* Network failed — serve from cache */
        return caches.match(event.request)
          .then(cached => cached || caches.match('/404.html'));
      })
  );
});
