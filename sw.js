// =============================================================================
//  Paragraphe · service worker
//  Garde une copie du site sur l'appareil : ouverture plus rapide, et pages
//  visibles même sans connexion. Les données (Supabase) ne sont jamais mises en cache.
//  À chaque nouvelle version du site, on change VERSION pour tout rafraîchir.
// =============================================================================
const VERSION = 'paragraphe-v9';
const FICHIERS = [
  "./",
  "404.html",
  "accessibilite.html",
  "ajouter.html",
  "compte.html",
  "confidentialite.html",
  "connexion.html",
  "guide.html",
  "index.html",
  "inscription.html",
  "lecture.html",
  "mot-de-passe.html",
  "statistiques.html",
  "accessibilite.js?v=9",
  "ajouter.js?v=9",
  "app.js?v=9",
  "bibliotheque.js?v=9",
  "compte.js?v=9",
  "connexion.js?v=9",
  "guide.js?v=9",
  "inscription.js?v=9",
  "lecture.js?v=9",
  "mot-de-passe.js?v=9",
  "simple.js?v=9",
  "statistiques.js?v=9",
  "style.css?v=9",
  "polices.css?v=9",
  "supabase.js",
  "marque.js",
  "site.webmanifest",
  "favicon.svg",
  "apple-touch-icon.png",
  "icone-192.png",
  "icone-512.png",
  "icone-maskable-192.png",
  "icone-maskable-512.png",
  "cormorant-garamond-latin-500-normal.woff2",
  "cormorant-garamond-latin-600-normal.woff2",
  "cormorant-garamond-latin-ext-500-normal.woff2",
  "cormorant-garamond-latin-ext-600-normal.woff2",
  "nunito-sans-latin-400-normal.woff2",
  "nunito-sans-latin-600-normal.woff2",
  "nunito-sans-latin-700-normal.woff2",
  "nunito-sans-latin-ext-400-normal.woff2",
  "nunito-sans-latin-ext-600-normal.woff2",
  "nunito-sans-latin-ext-700-normal.woff2"
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((cache) => Promise.all(FICHIERS.map((f) => cache.add(f).catch(() => null)))).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c.startsWith('paragraphe-') && c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // On ne touche qu'aux fichiers du site lui-même (pas à Supabase, ni aux sources de livres).
  if (url.origin !== self.location.origin) return;

  // Pages et configuration : d'abord le réseau (pour avoir la dernière version), sinon la copie.
  if (req.mode === 'navigate' || url.pathname.endsWith('/config.js')) {
    e.respondWith(
      fetch(req)
        .then((rep) => {
          if (rep.ok) {
            const copie = rep.clone();
            caches.open(VERSION).then((c) => c.put(req.mode === 'navigate' ? url.pathname : req, copie));
          }
          return rep;
        })
        .catch(async () => (await caches.match(req.mode === 'navigate' ? url.pathname : req, { ignoreSearch: true })) ?? (await caches.match('index.html')) ?? Response.error()),
    );
    return;
  }

  // Styles, scripts, polices, icônes : la copie d'abord (ils changent de nom à chaque version).
  e.respondWith(
    caches.match(req).then(
      (copie) =>
        copie ??
        fetch(req).then((rep) => {
          if (rep.ok) {
            const c2 = rep.clone();
            caches.open(VERSION).then((c) => c.put(req, c2));
          }
          return rep;
        }),
    ),
  );
});
