// Service worker de Tchoukball Assistant (généré au build par le plugin `pwa`
// de vite.config.js, qui remplace __PRECACHE__ et __VERSION__).
//
// - Tout le site (HTML, JS, CSS, polices, icônes) est mis en cache à
//   l'installation : l'app s'ouvre et fonctionne sans réseau.
// - Pages : réseau d'abord (pour avoir la dernière version), cache si le
//   réseau ne répond pas en 3 s.
// - Fichiers du build (/assets/…, nom unique) : cache d'abord.
// - /api/… et les autres domaines (Supabase) : jamais mis en cache.
// - Une nouvelle version attend que l'utilisateur accepte de recharger
//   (message SKIP_WAITING envoyé par l'app), pour ne pas couper un match.

const VERSION = __VERSION__
const CACHE = `tchouk-${VERSION}`
const PRECACHE = __PRECACHE__
const NAV_TIMEOUT_MS = 3000

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)))
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(k => k.startsWith('tchouk-') && k !== CACHE).map(k => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

async function fromNetworkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NAV_TIMEOUT_MS)),
    ])
    if (response.ok) cache.put('/index.html', response.clone())
    return response
  } catch {
    return (await cache.match('/index.html')) || Response.error()
  }
}

async function fromCacheFirst(request) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok && response.type === 'basic') cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return
  if (request.mode === 'navigate') {
    event.respondWith(fromNetworkFirst(request))
    return
  }
  event.respondWith(fromCacheFirst(request))
})

// Toucher une alerte « ton équipe joue bientôt » ramène sur la page ouverte.
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const page = all.find(c => new URL(c.url).pathname.startsWith('/live/')) || all[0]
    if (page) return page.focus()
    return self.clients.openWindow('/')
  })())
})
