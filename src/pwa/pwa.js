// État de la PWA, partagé par l'app : mise à jour disponible, installation
// possible, connexion. Lu dans React avec usePwa() (useSyncExternalStore).
import { useSyncExternalStore } from 'react'

let state = {
  updateReady: false, // une nouvelle version attend d'être activée
  canInstall: false,  // le navigateur propose l'installation (Chrome, Edge, Android)
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
}
let waiting = null
let installEvent = null
const listeners = new Set()

function set(patch) {
  state = { ...state, ...patch }
  listeners.forEach(l => l())
}

export function usePwa() {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb) }, () => state, () => state)
}

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

// Active la nouvelle version, puis recharge quand elle a pris la main.
export function applyUpdate() {
  if (!waiting) { window.location.reload(); return }
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
  waiting.postMessage('SKIP_WAITING')
}

export async function promptInstall() {
  if (!installEvent) return false
  installEvent.prompt()
  const { outcome } = await installEvent.userChoice
  installEvent = null
  set({ canInstall: false })
  return outcome === 'accepted'
}

export function initPwa() {
  window.addEventListener('online', () => set({ online: true }))
  window.addEventListener('offline', () => set({ online: false }))
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    installEvent = e
    set({ canInstall: true })
  })
  window.addEventListener('appinstalled', () => { installEvent = null; set({ canInstall: false }) })

  // Service worker : seulement sur le site construit (pas en développement).
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const track = worker => {
        worker?.addEventListener('statechange', () => {
          // « installed » avec un service worker déjà actif = mise à jour prête.
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            waiting = worker
            set({ updateReady: true })
          }
        })
      }
      if (reg.waiting && navigator.serviceWorker.controller) { waiting = reg.waiting; set({ updateReady: true }) }
      reg.addEventListener('updatefound', () => track(reg.installing))
      // Vérifie les mises à jour quand l'app revient au premier plan.
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}) })
    } catch {}
  })
}
