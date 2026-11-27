import { useCallback, useEffect, useState } from 'react'
import { newId } from '../../lib/format'
import { loadLeagues, saveLeagues } from '../../lib/league'

const EVENT = 'tchouk:leagues'

// Championnats enregistrés sur l'appareil (localStorage). Chaque écriture est
// faite tout de suite (un nouveau championnat existe avant d'ouvrir sa page),
// et prévient les autres écrans ouverts, dans cet onglet comme dans les autres.
export function useLeagues() {
  const [leagues, setLeagues] = useState(loadLeagues)

  useEffect(() => {
    const refresh = () => setLeagues(loadLeagues())
    const onStorage = e => { if (e.key === 'tchouk_leagues') refresh() }
    window.addEventListener('storage', onStorage)
    window.addEventListener(EVENT, refresh)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener(EVENT, refresh) }
  }, [])

  const commit = useCallback(fn => {
    const next = fn(loadLeagues())
    saveLeagues(next)
    setLeagues(next)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  const create = useCallback(name => {
    const league = { id: newId(), name, scale: 'rank', tournamentIds: [], createdAt: new Date().toISOString() }
    commit(list => [league, ...list])
    return league
  }, [commit])
  const update = useCallback((id, patch) => commit(list => list.map(l => (l.id === id ? { ...l, ...patch } : l))), [commit])
  const remove = useCallback(id => commit(list => list.filter(l => l.id !== id)), [commit])

  return { leagues, create, update, remove }
}
