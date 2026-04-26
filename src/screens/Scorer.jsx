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
  // halfSnapshots[i] = cumulative scores [t0, t1] at the START of half (i+1)
  // halfSnapshots[0] = [0, 0] always; halfSnapshots[1] = scores when half 1 ended; etc.
  const [halfSnapshots, setHalfSnapshots] = useState([[0, 0]])

  const halfDurationMin = Math.max(1, Number(settings?.halfDurationMin) || 12)
  const halfCount       = Math.max(1, Number(settings?.halfCount) || 2)
  const totalHalfSec    = halfDurationMin * 60
  const totalMatchSec   = totalHalfSec * halfCount

  const c1 = settings?.teamColors?.[0] || '#5de8d6'
  const c2 = settings?.teamColors?.[1] || '#ff7272'

  // Stop at end of each half, not just end of match
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setElapsedSec(prev => {
        const next = prev + 1
        const currentHalfEnd = (Math.floor(prev / totalHalfSec) + 1) * totalHalfSec
        const stop = Math.min(currentHalfEnd, totalMatchSec)
        if (next >= stop) { setRunning(false); return stop }
        return next
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running, totalMatchSec, totalHalfSec])

  const currentHalf = useMemo(() => {
    if (elapsedSec >= totalMatchSec) return halfCount
    return Math.min(halfCount, Math.floor(elapsedSec / totalHalfSec) + 1)
  }, [elapsedSec, totalHalfSec, totalMatchSec, halfCount])

  const elapsedInHalf    = elapsedSec >= totalMatchSec ? totalHalfSec : elapsedSec % totalHalfSec
  const remainingHalfSec = Math.max(0, totalHalfSec - elapsedInHalf)

  const s0 = score(teams, numTeams, 0)
  const s1 = two ? score(teams, numTeams, 1) : null

  const s0Ref = useRef(s0)
  const s1Ref = useRef(s1)
  s0Ref.current = s0
  s1Ref.current = s1
  const prevHalfRef   = useRef(1)
  const matchDoneRef  = useRef(false)

  // Capture snapshot when half changes (half 1→2, 2→3…)
  useEffect(() => {
    if (currentHalf !== prevHalfRef.current) {
      prevHalfRef.current = currentHalf
      const snap = [s0Ref.current, s1Ref.current ?? 0]
      setHalfSnapshots(prev => [...prev, snap])
    }
  }, [currentHalf])

  // Capture final snapshot when the last half ends (currentHalf doesn't change for the last half)
  useEffect(() => {
    if (elapsedSec >= totalMatchSec && !matchDoneRef.current) {
      matchDoneRef.current = true
      setHalfSnapshots(prev => {
        if (prev.length <= halfCount) {
          return [...prev, [s0Ref.current, s1Ref.current ?? 0]]
        }
        return prev
      })
    }
  }, [elapsedSec, totalMatchSec, halfCount])

  // Current half's start scores = last snapshot
  const halfStart   = halfSnapshots[halfSnapshots.length - 1]
  const halfScore0  = s0 - halfStart[0]
  const halfScore1  = two ? (s1 ?? 0) - halfStart[1] : null

  // Build per-half score rows for the summary panel
  const halfSummaryRows = useMemo(() => {
    const rows = []
    for (let h = 1; h <= halfCount; h++) {
      const start = halfSnapshots[h - 1]
      const end   = halfSnapshots[h]
      if (!start) break
      if (end) {
        rows.push({ half: h, t0: end[0] - start[0], t1: end[1] - start[1], done: true })
      } else if (h === currentHalf) {
        rows.push({ half: h, t0: s0 - start[0], t1: (s1 ?? 0) - start[1], done: false })
      }
    }
    return rows
  }, [halfSnapshots, currentHalf, s0, s1, halfCount])

  const showSummary = halfSnapshots.length > 1 // at least one half completed

  function adjScore(teamIdx, d) {
    onAdj(teamIdx, 'tGagne', d)
  }

  function handleEnd() {
    if (window.confirm('Terminer le match ?')) onEnd()
  }

  function handleResetCurrentHalf() {
    setRunning(false)
    setElapsedSec((currentHalf - 1) * totalHalfSec)
  }

  function handleSkipHalf() {
    if (currentHalf >= halfCount) return
    setRunning(false)
    setElapsedSec(currentHalf * totalHalfSec)
  }

  function handleResetScorer() {
    setRunning(false)
    setElapsedSec(0)
    setHalfSnapshots([[0, 0]])
    prevHalfRef.current  = 1
    matchDoneRef.current = false
    onReset?.()
  }

  const clockPct = totalHalfSec > 0 ? (elapsedInHalf / totalHalfSec) * 100 : 0
  const isLast10 = remainingHalfSec <= 10 && remainingHalfSec > 0 && running
  const matchOver = elapsedSec >= totalMatchSec

  return (
    <div className="sc-root">

      {/* Top bar */}
      <div className="sc-topbar">
        <div className="sc-half-badge">
          MT {currentHalf}/{halfCount}
        </div>
        <button className="sc-end-btn" onClick={handleEnd}>Fin</button>
      </div>

      {/* Clock progress bar */}
      <div className="sc-progress-track">
        <div className="sc-progress-fill" style={{ width: `${clockPct}%`, background: isLast10 ? '#ff5252' : 'var(--acc)' }} />
      </div>

      {/* Big centered clock */}
      <div className="sc-clock-wrap">
        <div className={`sc-clock${isLast10 ? ' sc-clock-urgent' : ''}`} onClick={() => setRunning(v => !v)} title="Cliquer pour pause/reprise">
          {fmtClock(remainingHalfSec)}
        </div>
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
          <div className="sc-half-score" style={{ color: c1 }}>+{halfScore0}</div>
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
            <div className="sc-half-score" style={{ color: c2 }}>+{halfScore1}</div>
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
        {currentHalf < halfCount && (
          <button className="sc-ctrl-btn" onClick={handleSkipHalf} title="Passer à la mi-temps suivante">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 15,12 5,21"/><rect x="16" y="3" width="3" height="18"/></svg>
            MT suivante
          </button>
        )}
        <button className="sc-ctrl-btn" onClick={handleResetCurrentHalf} title="Remet le chrono de cette mi-temps à zéro">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Reset MT
        </button>
        <button className="sc-ctrl-btn" onClick={handleResetScorer} title="Remet le scoreur complet à zéro">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Reset tout
        </button>
      </div>

      {/* Per-half score summary — appears once at least one half is completed */}
      {showSummary && (
        <div className="sc-halves-summary">
          <div className="sc-halves-title">
            {matchOver ? 'Récap du match' : 'Mi-temps'}
          </div>
          <div className="sc-halves-header">
            <span />
            <span style={{ color: c1 }}>{teams[0]?.name}</span>
            {two && <span style={{ color: c2 }}>{teams[1]?.name}</span>}
          </div>
          {halfSummaryRows.map(({ half, t0, t1, done }) => (
            <div key={half} className={`sc-halves-row${done ? '' : ' sc-halves-row-live'}`}>
              <span className="sc-halves-label">MT{half}</span>
              <span className="sc-halves-score" style={{ color: c1 }}>+{t0}</span>
              {two && <span className="sc-halves-score" style={{ color: c2 }}>+{t1}</span>}
              {!done && <span className="sc-halves-live">en cours</span>}
            </div>
          ))}
          {matchOver && (
            <div className="sc-halves-row sc-halves-total">
              <span className="sc-halves-label">Total</span>
              <span className="sc-halves-score" style={{ color: c1 }}>{s0}</span>
              {two && <span className="sc-halves-score" style={{ color: c2 }}>{s1}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
