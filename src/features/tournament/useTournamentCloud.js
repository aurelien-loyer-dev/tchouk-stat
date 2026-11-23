import { useCallback, useEffect, useRef, useState } from 'react'
import { canEdit, createShare, fetchShared, pushShared, removeShared } from './cloud'

const POLL_MS  = 4000
const RETRY_MS = 5000

// Synchronise les tournois partagés avec le serveur :
// - envoie chaque modification d'un organisateur (une requête à la fois par tournoi,
//   la plus récente gagne) ;
// - interroge le serveur toutes les 4 s pour le tournoi ouvert, et une fois pour
//   la liste, et applique les versions plus récentes.
// `save` accepte une fonction (liste précédente → liste suivante).
export function useTournamentCloud({ tournaments, save, activeId, view }) {
  const [sync, setSync]     = useState({})   // id → 'saving' | 'ok' | 'offline'
  const [notice, setNotice] = useState(null) // { kind, id }

  const latest = useRef(tournaments)
  latest.current = tournaments
  const revs   = useRef({})        // id → dernière révision connue (avant re-render)
  const queues = useRef(new Map()) // id → { running, pending }
  const dirty  = useRef(new Set()) // ids à renvoyer après une coupure

  const setStatus = (id, s) => setSync(prev => (prev[id] === s ? prev : { ...prev, [id]: s }))

  const patch = useCallback((id, fn) => {
    save(list => list.map(t => (t.id === id ? fn(t) : t)))
  }, [save])

  // La révision la plus récente connue, qu'elle vienne d'ici ou d'un envoi fait ailleurs (App).
  const knownRev = tour => Math.max(revs.current[tour.id] ?? 0, tour.share?.rev ?? 0)

  const applyRemote = useCallback((id, remote) => {
    revs.current[id] = remote.rev
    patch(id, t => ({ ...remote.data, share: { ...t.share, rev: remote.rev, updatedAt: remote.updatedAt } }))
  }, [patch])

  const push = useCallback(async tour => {
    if (!canEdit(tour)) return
    const q = queues.current.get(tour.id) || { running: false, pending: null }
    queues.current.set(tour.id, q)
    q.pending = tour
    if (q.running) return
    q.running = true

    while (q.pending) {
      const next = q.pending
      q.pending = null
      const share = { ...next.share, rev: knownRev(next) }
      setStatus(next.id, 'saving')
      const r = await pushShared(share, next)

      if (r.ok) {
        revs.current[next.id] = r.rev
        dirty.current.delete(next.id)
        patch(next.id, t => ({ ...t, share: { ...t.share, rev: r.rev, updatedAt: r.updatedAt, dirty: false } }))
        setStatus(next.id, 'ok')
      } else if (r.status === 409) {
        // Quelqu'un d'autre a modifié entre-temps : on reprend sa version.
        q.pending = null
        const remote = await fetchShared(share.code)
        if (remote.ok) applyRemote(next.id, remote)
        setNotice({ kind: 'conflict', id: next.id })
        setStatus(next.id, 'ok')
      } else if (r.status === 403) {
        patch(next.id, t => ({ ...t, share: { ...t.share, key: null } }))
        setNotice({ kind: 'forbidden', id: next.id })
        setStatus(next.id, 'ok')
      } else if (r.status === 404) {
        patch(next.id, t => ({ ...t, share: null }))
        setNotice({ kind: 'gone', id: next.id })
      } else {
        dirty.current.add(next.id)
        setStatus(next.id, 'offline')
        break
      }
    }
    q.running = false
  }, [patch, applyRemote])

  const refresh = useCallback(async tour => {
    if (!tour?.share) return
    const q = queues.current.get(tour.id)
    if (q?.running) return
    // Score reporté depuis un match pendant une coupure : à renvoyer.
    if (tour.share.dirty && tour.share.key) dirty.current.add(tour.id)
    if (dirty.current.has(tour.id)) return push(tour)

    const r = await fetchShared(tour.share.code)
    if (r.ok) {
      if (r.rev > knownRev(tour)) applyRemote(tour.id, r)
      setStatus(tour.id, 'ok')
    } else if (r.status === 404) {
      patch(tour.id, t => ({ ...t, share: null }))
      setNotice({ kind: 'gone', id: tour.id })
    } else {
      setStatus(tour.id, 'offline')
    }
  }, [applyRemote, patch, push])

  // Tournoi ouvert : suivi en direct.
  useEffect(() => {
    if (view !== 'detail' || !activeId) return
    let timer
    const tick = async () => {
      const tour = latest.current.find(t => t.id === activeId)
      if (tour?.share && document.visibilityState === 'visible') await refresh(tour)
      const again = dirty.current.has(activeId) ? RETRY_MS : POLL_MS
      timer = setTimeout(tick, again)
    }
    tick()
    const onVisible = () => { if (document.visibilityState === 'visible') { clearTimeout(timer); tick() } }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [view, activeId, refresh])

  // Liste : une mise à jour à l'ouverture.
  useEffect(() => {
    if (view !== 'list') return
    latest.current.filter(t => t.share).forEach(refresh)
  }, [view, refresh])

  const share = useCallback(async tour => {
    const r = await createShare(tour)
    if (!r.ok) return r
    revs.current[tour.id] = r.rev
    patch(tour.id, t => ({ ...t, share: { code: r.code, key: r.key, rev: r.rev, updatedAt: r.updatedAt } }))
    setStatus(tour.id, 'ok')
    return r
  }, [patch])

  const unshare = useCallback(async tour => {
    const r = await removeShared(tour.share)
    if (!r.ok && r.status !== 404) return r
    delete revs.current[tour.id]
    patch(tour.id, t => ({ ...t, share: null }))
    return { ok: true }
  }, [patch])

  // Ouvre un tournoi partagé par son code (et sa clé pour un organisateur).
  // Renvoie { ok, id } ou { ok: false, status }.
  const join = useCallback(async (code, key) => {
    const r = await fetchShared(code)
    if (!r.ok) return r
    const id = r.data.id
    revs.current[id] = r.rev
    save(list => {
      const existing = list.find(t => t.id === id)
      const shareInfo = {
        code: r.code,
        key: key || (existing?.share?.code === r.code ? existing.share.key : null) || null,
        rev: r.rev,
        updatedAt: r.updatedAt,
      }
      const tour = { ...r.data, share: shareInfo }
      return existing ? list.map(t => (t.id === id ? tour : t)) : [tour, ...list]
    })
    setStatus(id, 'ok')
    return { ok: true, id }
  }, [save])

  return { sync, notice, clearNotice: () => setNotice(null), push, share, unshare, join }
}
