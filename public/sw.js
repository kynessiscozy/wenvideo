/* 问问大师 PWA：离线可用 + 秒开的缓存策略。
   静态资源带 hash，可长期缓存；HTML 走 network-first 保证更新及时。 */
const CACHE = 'wenda-cache-v70';
const BASE = './';

const OPTIONAL_ASSETS = [
  'art/swing-cinema3d.webp', 'art/swing-cinema3d-avatar.webp', 'art/swing-cinema3d-blink.webp', 'art/swing-cinema3d-speak.webp',
  'art/swing-hall-wide.webp', 'art/swing-hall-mobile.webp',
  'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png',
  'icon-twins-128.png', 'icon-twins-192.png', 'icon-twins-512.png',
  'icon-twins-maskable-192.png', 'icon-twins-maskable-512.png', 'apple-touch-icon-twins.png',
  'art/master-twin-indigo.webp', 'art/master-twin-rose.webp',
  'art/master-twin-indigo-avatar.webp', 'art/master-twin-rose-avatar.webp',
  // Funnel entry: the cat master's poster stays readable offline even
  // when the (large) MP4s are not cached.
  'art/swing-lord.webp',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Never replace a working offline version unless the new HTML is available.
    await cache.add(BASE);
    // funnel.html is a separate navigation target (the fallback surface links
    // back to it). Keep its own cached copy instead of serving index.html.
    await cache.add(BASE + 'funnel.html');
    await cache.add(BASE + 'index.html');
    // Production emits a manifest of hashed application chunks. Fetch them at
    // install time so a first visit can be used offline after activation.
    try {
      const response = await fetch(BASE + 'offline-assets.json', { cache: 'no-store' });
      if (response.ok) {
        const text = await response.text();
        // Vite's dev server responds to unknown URLs with its HTML fallback.
        const assets = text.trimStart().startsWith('<') ? [] : JSON.parse(text);
        if (Array.isArray(assets)) await Promise.all(assets.filter(asset => /^assets\/[\w.\-]+\.(?:js|css)$/.test(asset)).map(asset => cache.add(BASE + asset)));
      }
    } catch (error) {
      // Do not replace a working version with an incomplete installation.
      throw error;
    }
    await Promise.all(OPTIONAL_ASSETS.map(async (asset) => {
      const url = BASE + asset;
      try {
        await cache.add(url);
      } catch {
        // Keep a previous offline copy if a nonessential asset is unavailable.
        const previous = await caches.match(url);
        if (previous) await cache.put(url, previous);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('wenda-cache-') && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 只缓存本站，AI API 等外部请求不碰

  // HTML: never replace a usable offline page with an error response.
  if (req.mode === 'navigate') {
    const isRoot = url.pathname === new URL(BASE, self.location.href).pathname;
    const network = fetch(req);
    e.waitUntil(network.then((res) => {
      if (res.ok) {
        // Cache each navigation under its own URL: caching funnel.html under
        // BASE would make offline visits to the app root open the funnel page.
        return caches.open(CACHE).then((cache) => cache.put(isRoot ? BASE : req, res.clone()));
      }
    }).catch(() => {}));
    const offline = () => caches.match(req).then(async (hit) => {
      if (hit) return hit;
      // Query strings (e.g. ?stats or ?panel=guide) do not change the shell.
      // Never turn an offline funnel navigation into the app's index page.
      const path = url.pathname.slice(new URL(BASE, self.location.href).pathname.length);
      if (path === 'funnel.html') return caches.match(BASE + 'funnel.html');
      if (isRoot || path === 'index.html') return (await caches.match(BASE + 'index.html')) || caches.match(BASE);
      return caches.match(BASE);
    });
    e.respondWith(network.then((res) => {
      if (res.ok) return res;
      return offline().then((hit) => hit || res);
    }).catch(offline));
    return;
  }

  const basePath = new URL(BASE, self.location.href).pathname;
  const relativePath = url.pathname.startsWith(basePath) ? url.pathname.slice(basePath.length) : '';

  // Vite's development modules and styles reuse URLs as files change. Never
  // serve them from CacheStorage; a stale module can break a newly loaded page.
  if (/^(?:src\/|@vite\/|@id\/|node_modules\/\.vite\/)/.test(relativePath)) return;

  // Artwork keeps readable, un-hashed names. Prefer fresh artwork online while
  // keeping the pre-cached copy available for offline use.
  if (relativePath.startsWith('art/')) {
    const network = fetch(req);
    e.waitUntil(network.then((res) => {
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone();
        return caches.open(CACHE).then((c) => c.put(req, copy));
      }
    }).catch(() => {}));
    e.respondWith(network.then((res) => {
      if (res.ok) return res;
      return caches.match(req).then((hit) => hit || res);
    }).catch(() => caches.match(req)));
    return;
  }

  // 带 hash 的资源与其他静态：cache-first，miss 再网络并回填
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
