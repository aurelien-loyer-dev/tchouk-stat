import { useEffect, useMemo, useRef, useState } from 'react'
import { score } from '../lib/stats'

function fmtClock(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

function AnimScore({ value, color }) {
  const ref  = useRef(null)
  const prev = useRef(value)
  useEffect(() => {
    if (prev.current !== value && ref.current) {
      ref.current.classList.remove('sc-bump')
      void ref.current.offsetWidth
      ref.current.classList.add('sc-bump')
    }
    prev.current = value
  }, [value])
  return <div ref={ref} className="sc-score" style={{ color }}>{value}</div>
}

export default function Scorer({ teams, numTeams, onAdj, onEnd, onReset, settings, logos }) {
  const two = numTeams === 2
  const [elapsedSec, setElapsedSec] = useState(0)
  const [running, setRunning] = useState(false)

  const halfDurationMin = Math.max(1, Number(settings?.halfDurationMin) || 12)
  const halfCount       = Math.max(1, Number(settings?.halfCount) || 2)
  const totalHalfSec    = halfDurationMin * 60
  const totalMatchSec   = totalHalfSec * halfCount

  const c1 = settings?.teamColors?.[0] || '#5de8d6'
  const c2 = settings?.teamColors?.[1] || '#ff7272'

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setElapsedSec(prev => {
        const next = prev + 1
        if (next >= totalMatchSec) { setRunning(false); return totalMatchSec }
        return next
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running, totalMatchSec])

  const currentHalf = useMemo(() => {
    if (elapsedSec >= totalMatchSec) return halfCount
    return Math.min(halfCount, Math.floor(elapsedSec / totalHalfSec) + 1)
  }, [elapsedSec, totalHalfSec, totalMatchSec, halfCount])

  const elapsedInHalf    = elapsedSec >= totalMatchSec ? totalHalfSec : elapsedSec % totalHalfSec
  const remainingHalfSec = Math.max(0, totalHalfSec - elapsedInHalf)

  function adjScore(teamIdx, d) {
    onAdj(teamIdx, 'tGagne', d)
  }

  function handleEnd() {
    if (window.confirm('Terminer le match ?')) onEnd()
  }

  function handleResetScorer() {
    setRunning(false)
    setElapsedSec(0)
    onReset?.()
  }

  const s0 = score(teams, numTeams, 0)
  const s1 = two ? score(teams, numTeams, 1) : null

  const clockPct = totalHalfSec > 0 ? (elapsedInHalf / totalHalfSec) * 100 : 0
  const isLast10 = remainingHalfSec <= 10 && remainingHalfSec > 0 && running

  return (
    <div className="sc-root">

      {/* Top bar */}
      <div className="sc-topbar">
        <div className="sc-half-badge">
          MT {currentHalf}/{halfCount}
        </div>
        <div className={`sc-clock${isLast10 ? ' sc-clock-urgent' : ''}`} onClick={() => setRunning(v => !v)} title="Cliquer pour pause/reprise">
          {fmtClock(remainingHalfSec)}
        </div>
        <button className="sc-end-btn" onClick={handleEnd}>Fin</button>
      </div>

      {/* Clock progress bar */}
      <div className="sc-progress-track">
        <div className="sc-progress-fill" style={{ width: `${clockPct}%`, background: isLast10 ? '#ff5252' : 'var(--acc)' }} />
      </div>

      {/* Scoreboard */}
      <div className="sc-board">
        {/* Team 1 */}
        <div className="sc-team sc-team-left" style={{ '--tc': c1 }}>
          <div className="sc-logo-wrap">
            {logos?.[0]
              ? <img src={logos[0]} className="sc-logo" alt={teams[0]?.name} />
              : <div className="sc-logo-placeholder" style={{ background: c1 + '22', color: c1 }}>
                  {(teams[0]?.name || 'E')[0].toUpperCase()}
                </div>
            }
          </div>
          <div className="sc-team-name">{teams[0]?.name}</div>
          <AnimScore value={s0} color={c1} />

          {/* Score buttons */}
          <div className="sc-actions">
            <button className="sc-btn-score" style={{ background: c1 }} onClick={() => adjScore(0, 1)}>+1</button>
            <button className="sc-btn-neg" onClick={() => adjScore(0, -1)}>-1</button>
          </div>
        </div>

        {/* Team 2 (only in 2-team mode) */}
        {two && (
          <div className="sc-team sc-team-right" style={{ '--tc': c2 }}>
            <div className="sc-logo-wrap">
              {logos?.[1]
                ? <img src={logos[1]} className="sc-logo" alt={teams[1]?.name} />
                : <div className="sc-logo-placeholder" style={{ background: c2 + '22', color: c2 }}>
                    {(teams[1]?.name || 'E')[0].toUpperCase()}
                  </div>
              }
            </div>
            <div className="sc-team-name">{teams[1]?.name}</div>
            <AnimScore value={s1} color={c2} />

            <div className="sc-actions">
              <button className="sc-btn-score" style={{ background: c2 }} onClick={() => adjScore(1, 1)}>+1</button>
              <button className="sc-btn-neg" onClick={() => adjScore(1, -1)}>-1</button>
            </div>
          </div>
        )}
      </div>

      {/* Clock controls */}
      <div className="sc-ctrl">
        <button className={`sc-ctrl-btn${running ? ' active' : ''}`} onClick={() => setRunning(v => !v)}>
          {running
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          }
          {running ? 'Pause' : elapsedSec > 0 ? 'Reprendre' : 'Démarrer'}
        </button>
        <button className="sc-ctrl-btn" onClick={handleResetScorer}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Reset scoreur
        </button>
      </div>
    </div>
  )
}
