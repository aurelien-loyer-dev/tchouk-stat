import { useEffect, useState } from 'react'
import { fetchShared } from './cloud'
import { alertsEnabled } from './useTeamAlert'

const POLL_MS = 4000
const HIDDEN_POLL_MS = 15000 // onglet en arrière-plan, alertes actives

// Tournoi partagé, rafraîchi toutes les 4 s (page publique, écran de salle).
// → { status: 'loading' | 'ok' | 'notFound' | 'notConfigured' | 'offline', tournament, updatedAt, offline }
export function useSharedTournament(code) {
  const [state, setState] = useState({ status: 'loading' }) // loading | ok | notFound | notConfigured | offline

  useEffect(() => {
    let alive = true
    let timer
    let lastRev = 0
    let tourId = null
    async function load() {
      // En arrière-plan, on ne rafraîchit que si l'utilisateur attend une alerte.
      const hidden = document.visibilityState !== 'visible'
      if (!hidden || (tourId && alertsEnabled(tourId))) {
        const r = await fetchShared(code)
        if (!alive) return
        if (r.ok) {
          if (r.rev !== lastRev) {
            lastRev = r.rev
            tourId = r.data?.id || null
            setState({ status: 'ok', tournament: r.data, updatedAt: r.updatedAt })
          } else {
            setState(s => (s.offline ? { ...s, offline: false } : s))
          }
        } else if (r.status === 404) {
          setState({ status: 'notFound' })
          return
        } else {
          setState(s => (s.status === 'ok' ? { ...s, offline: true } : { status: r.status === 503 ? 'notConfigured' : 'offline' }))
        }
      }
      timer = setTimeout(load, document.visibilityState === 'visible' ? POLL_MS : HIDDEN_POLL_MS)
    }
    load()
    const onVisible = () => { if (document.visibilityState === 'visible') { clearTimeout(timer); load() } }
    document.addEventListener('visibilitychange', onVisible)
    return () => { alive = false; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [code])

  return state
}
