import { useEffect, useMemo, useState } from 'react'

// Chrono de match partagé par Match/PlayerMatch (court jusqu'à la fin du
// match) et Scorer (s'arrête à la fin de chaque mi-temps via stopAtHalfEnd).
export function useMatchClock(settings, { stopAtHalfEnd = false } = {}) {
  const [elapsedSec, setElapsedSec] = useState(0)
  const [running, setRunning] = useState(false)

  const halfDurationMin = Math.max(1, Number(settings?.halfDurationMin) || 12)
  const halfCount = Math.max(1, Number(settings?.halfCount) || 2)
  const totalHalfSec = halfDurationMin * 60
  const totalMatchSec = totalHalfSec * halfCount

  useEffect(() => {
    if (!running) return undefined
    const id = window.setInterval(() => {
      setElapsedSec(prev => {
        const next = prev + 1
        const stop = stopAtHalfEnd
          ? Math.min((Math.floor(prev / totalHalfSec) + 1) * totalHalfSec, totalMatchSec)
          : totalMatchSec
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
