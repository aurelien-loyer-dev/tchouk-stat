import { useCallback, useEffect, useRef, useState } from 'react'
import { lastClock, subscribeClock } from '../../lib/clockBus'
import { createLive, loadLiveShare, pushLive, removeLive, saveLiveShare } from './liveCloud'

const DEBOUNCE_MS = 250
const RETRY_MS = 5000

// Diffusion du match en cours. `payload` : état sans le chrono ({ kind, teams,
// mode, label, finished }), ou null s'il n'y a pas de match. Le chrono est
// ajouté depuis clockBus ; il n'est renvoyé que s'il change de façon visible
// (départ, pause, mi-temps, remise à zéro) : les écrans le font tourner seuls.
// status : 'off' | 'starting' | 'ok' | 'saving' | 'offline' | 'error'
export function useLiveShare(payload) {
  const [share, setShare] = useState(loadLiveShare)
  const [status, setStatus] = useState(share ? 'saving' : 'off')
  const payloadRef = useRef(payload)
  const sent = useRef({ json: null, clock: null })
  const timer = useRef(null)
  payloadRef.current = payload

  const buildData = useCallback(() => {
    const p = payloadRef.current
    if (!p) return null
    const c = lastClock()
    return {
      ...p,
      clock: c ? { remainingSec: c.remainingHalfSec, running: c.running, half: c.currentHalf, halves: c.halfCount } : null,
    }
  }, [])

  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    const current = loadLiveShare()
    const data = buildData()
    if (!current || !data) return
    setStatus('saving')
    const r = await pushLive(current, data)
    if (r.ok) {
      sent.current = { json: JSON.stringify(payloadRef.current), clock: { ...data.clock, at: Date.now() } }
      setStatus('ok')
    } else if (r.status === 404 || r.status === 403) {
      // Diffusion effacée (expirée) ou clé invalide : on arrête proprement.
      saveLiveShare(null); setShare(null); setStatus('off')
    } else {
      setStatus('offline')
      timer.current = setTimeout(flush, RETRY_MS)
    }
  }, [buildData])

  const schedule = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, DEBOUNCE_MS)
  }, [flush])

  // Score, équipes, fin du match : renvoyés à chaque changement.
  const json = payload ? JSON.stringify(payload) : null
  useEffect(() => {
    if (share && json && json !== sent.current.json) schedule()
  }, [share, json, schedule])

  // Chrono : seulement quand ce que voit l'écran deviendrait faux.
  useEffect(() => {
    if (!share) return undefined
    return subscribeClock(c => {
      const prev = sent.current.clock
      if (!prev) { schedule(); return }
      const expected = prev.running ? prev.remainingSec - (Date.now() - prev.at) / 1000 : prev.remainingSec
      if (c.running !== prev.running || c.currentHalf !== prev.half || Math.abs(expected - c.remainingHalfSec) > 1.5) schedule()
    })
  }, [share, schedule])

  useEffect(() => () => clearTimeout(timer.current), [])

  const start = useCallback(async () => {
    const data = buildData()
    if (!data) return { ok: false }
    setStatus('starting')
    const r = await createLive(data)
    if (!r.ok) { setStatus('error'); return r }
    const next = { code: r.code, key: r.key }
    saveLiveShare(next)
    setShare(next)
    sent.current = { json: JSON.stringify(payloadRef.current), clock: { ...data.clock, at: Date.now() } }
    setStatus('ok')
    return r
  }, [buildData])

  const stop = useCallback(async () => {
    const current = loadLiveShare()
    clearTimeout(timer.current)
    saveLiveShare(null)
    setShare(null)
    setStatus('off')
    if (current) await removeLive(current)
  }, [])

  return { share, status, start, stop }
}
