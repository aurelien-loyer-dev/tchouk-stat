import { useEffect, useMemo, useState } from 'react'
import { loadClock, saveClock } from '../lib/liveMatch'

// Point d'arrêt du chrono : fin du match, ou fin de la mi-temps en cours
// pour le scoreur (stopAtHalfEnd).
function stopFor(prev, totalHalfSec, totalMatchSec, stopAtHalfEnd) {
  return stopAtHalfEnd
    ? Math.min((Math.floor(prev / totalHalfSec) + 1) * totalHalfSec, totalMatchSec)
    : totalMatchSec
}

// Chrono restauré depuis la sauvegarde ; s'il tournait, il rattrape le temps
// écoulé pendant que la page était fermée.
function restoreClock(totalHalfSec, totalMatchSec, stopAtHalfEnd) {
  const saved = loadClock()
  if (!saved || typeof saved.elapsedSec !== 'number') return { elapsedSec: 0, running: false }
  if (!saved.running) return { elapsedSec: saved.elapsedSec, running: false }
  const stop = stopFor(saved.elapsedSec, totalHalfSec, totalMatchSec, stopAtHalfEnd)
  const caughtUp = saved.elapsedSec + Math.floor((Date.now() - (saved.savedAt || Date.now())) / 1000)
  return caughtUp >= stop ? { elapsedSec: stop, running: false } : { elapsedSec: caughtUp, running: true }
}

// Chrono de match partagé par Match/PlayerMatch (court jusqu'à la fin du
// match) et Scorer (s'arrête à la fin de chaque mi-temps via stopAtHalfEnd).
// Son état est sauvegardé à chaque seconde pour survivre à un rechargement.
export function useMatchClock(settings, { stopAtHalfEnd = false } = {}) {
  const halfDurationMin = Math.max(1, Number(settings?.halfDurationMin) || 12)
  const halfCount = Math.max(1, Number(settings?.halfCount) || 2)
  const totalHalfSec = halfDurationMin * 60
  const totalMatchSec = totalHalfSec * halfCount

  const [initial] = useState(() => restoreClock(totalHalfSec, totalMatchSec, stopAtHalfEnd))
  const [elapsedSec, setElapsedSec] = useState(initial.elapsedSec)
  const [running, setRunning] = useState(initial.running)

  useEffect(() => { saveClock(elapsedSec, running) }, [elapsedSec, running])

  useEffect(() => {
    if (!running) return undefined
    const id = window.setInterval(() => {
      setElapsedSec(prev => {
        const next = prev + 1
        const stop = stopFor(prev, totalHalfSec, totalMatchSec, stopAtHalfEnd)
        if (next >= stop) { setRunning(false); return stop }
        return next
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running, totalMatchSec, totalHalfSec, stopAtHalfEnd])

  const currentHalf = useMemo(() => {
    if (elapsedSec >= totalMatchSec) return halfCount
    return Math.min(halfCount, Math.floor(elapsedSec / totalHalfSec) + 1)
  }, [elapsedSec, totalHalfSec, totalMatchSec, halfCount])

  const elapsedInHalf = elapsedSec >= totalMatchSec ? totalHalfSec : elapsedSec % totalHalfSec
  const remainingHalfSec = Math.max(0, totalHalfSec - elapsedInHalf)
  const remainingMatchSec = Math.max(0, totalMatchSec - elapsedSec)

  function handleSkipHalf() {
    if (currentHalf >= halfCount) return
    setRunning(false)
    setElapsedSec(currentHalf * totalHalfSec)
  }

  function handleResetCurrentHalf() {
    setRunning(false)
    setElapsedSec((currentHalf - 1) * totalHalfSec)
  }

  function handleResetAll() {
    setRunning(false)
    setElapsedSec(0)
  }

  return {
    elapsedSec, setElapsedSec, running, setRunning,
    halfDurationMin, halfCount, totalHalfSec, totalMatchSec,
    currentHalf, elapsedInHalf, remainingHalfSec, remainingMatchSec,
    handleSkipHalf, handleResetCurrentHalf, handleResetAll,
  }
}
