import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { score } from '../../lib/stats'
import { fmtClock } from '../../lib/format'
import { teamTextStyle, teamSwatchStyle } from '../../lib/teamColor'
import { useMatchClock } from '../../hooks/useMatchClock'
import AnimScore from './components/AnimScore'
import './scorer.css'

export default function Scorer({ teams, numTeams, onAdj, onFinish, onNewMatch, onReset, settings, logos }) {
  const { t } = useTranslation()
  const two = numTeams === 2
  const [halfSnapshots, setHalfSnapshots] = useState([[0, 0]])
  const [matchEnded, setMatchEnded] = useState(false)

  const {
    elapsedSec, setElapsedSec, running, setRunning,
    halfCount, totalHalfSec, currentHalf, elapsedInHalf, remainingHalfSec,
    handleSkipHalf, handleResetCurrentHalf,
  } = useMatchClock(settings, { stopAtHalfEnd: true })

  const c1 = settings?.teamColors?.[0] || '#5de8d6'
  const c2 = settings?.teamColors?.[1] || '#ff7272'

  const s0 = score(teams, numTeams, 0)
  const s1 = two ? score(teams, numTeams, 1) : null

  const s0Ref = useRef(s0)
  const s1Ref = useRef(s1)
  s0Ref.current = s0
  s1Ref.current = s1
  const prevHalfRef = useRef(1)

  // Capture snapshot when half changes (half 1→2, 2→3…)
  useEffect(() => {
    if (currentHalf !== prevHalfRef.current) {
      prevHalfRef.current = currentHalf
      setHalfSnapshots(prev => [...prev, [s0Ref.current, s1Ref.current ?? 0]])
    }
  }, [currentHalf])

  // Current half's start scores = last snapshot
  const halfStart  = halfSnapshots[halfSnapshots.length - 1]
  const halfScore0 = s0 - halfStart[0]
  const halfScore1 = two ? (s1 ?? 0) - halfStart[1] : null

  // Build per-half score rows for the end screen
  function buildEndRows(finalS0, finalS1) {
    const snaps = [...halfSnapshots, [finalS0, finalS1 ?? 0]]
    const rows  = []
    for (let h = 1; h <= halfCount; h++) {
      const start = snaps[h - 1]
      const end   = snaps[h]
      if (!start || !end) break
      rows.push({ half: h, t0: end[0] - start[0], t1: end[1] - start[1] })
    }
    return rows
  }

  function adjScore(teamIdx, d) {
    onAdj(teamIdx, 'tGagne', d)
  }

  function handleEnd() {
    setRunning(false)
    setMatchEnded(true)
    onFinish?.()
  }

  function handleResetScorer() {
    setRunning(false)
    setElapsedSec(0)
    setHalfSnapshots([[0, 0]])
    setMatchEnded(false)
    prevHalfRef.current = 1
    onReset?.()
  }

  const clockPct = totalHalfSec > 0 ? (elapsedInHalf / totalHalfSec) * 100 : 0
  const isLast10 = remainingHalfSec <= 10 && remainingHalfSec > 0 && running

  // ── End screen ──────────────────────────────────────────────────────────────
  if (matchEnded) {
    const endRows = buildEndRows(s0, s1)
    return (
      <div className="sc-root sc-end-root">
        <div className="sc-topbar">
          <div className="sc-half-badge">{t('scorer.matchEnded')}</div>
          <button className="sc-ctrl-btn" style={{ fontSize: 13 }} onClick={handleResetScorer}>
            {t('scorer.replay')}
          </button>
        </div>

        <div className="sc-end-body">
          {/* Final score */}
          <div className="sc-end-final">
            <div className="sc-end-team">
              <div className="sc-end-logo-wrap">
                {logos?.[0]
                  ? <img src={logos[0]} className="sc-logo" alt={teams[0]?.name} />
                  : <div className="sc-logo-placeholder" style={{ background: c1 + '22', ...teamTextStyle(c1) }}>{(teams[0]?.name || 'E')[0].toUpperCase()}</div>
                }
              </div>
              <div className="sc-end-name">{teams[0]?.name}</div>
              <div className="sc-end-score" style={teamTextStyle(c1)}>{s0}</div>
            </div>
            {two && (
              <div className="sc-end-team">
                <div className="sc-end-logo-wrap">
                  {logos?.[1]
                    ? <img src={logos[1]} className="sc-logo" alt={teams[1]?.name} />
                    : <div className="sc-logo-placeholder" style={{ background: c2 + '22', ...teamTextStyle(c2) }}>{(teams[1]?.name || 'E')[0].toUpperCase()}</div>
                  }
                </div>
                <div className="sc-end-name">{teams[1]?.name}</div>
                <div className="sc-end-score" style={teamTextStyle(c2)}>{s1}</div>
              </div>
            )}
          </div>

          {/* Per-half breakdown */}
          {endRows.length > 0 && (
            <div className="sc-end-halves">
              <div className="sc-halves-title">{t('scorer.halfScores')}</div>
              <div className="sc-end-halves-grid">
                <span className="sc-halves-label" />
                <span className="sc-end-col-hd"><span className="team-dot" style={teamSwatchStyle(c1)} />{teams[0]?.name}</span>
                {two && <span className="sc-end-col-hd"><span className="team-dot" style={teamSwatchStyle(c2)} />{teams[1]?.name}</span>}
              </div>
              {endRows.map(({ half, t0, t1 }) => (
                <div key={half} className="sc-end-halves-grid">
                  <span className="sc-halves-label">{t('scorer.halfRowLabel', { n: half })}</span>
                  <span className="sc-end-half-val" style={teamTextStyle(c1)}>+{t0}</span>
                  {two && <span className="sc-end-half-val" style={teamTextStyle(c2)}>+{t1}</span>}
                </div>
              ))}
              <div className="sc-end-halves-grid sc-end-total-row">
                <span className="sc-halves-label">{t('scorer.total')}</span>
                <span className="sc-end-half-val" style={teamTextStyle(c1)}>{s0}</span>
                {two && <span className="sc-end-half-val" style={teamTextStyle(c2)}>{s1}</span>}
              </div>
            </div>
          )}

          <button className="btn-acc sc-end-cta" onClick={onNewMatch}>
            {t('scorer.newMatch')}
          </button>
        </div>
      </div>
    )
  }

  // ── Main scorer screen ───────────────────────────────────────────────────────
  return (
    <div className="sc-root">

      {/* Top bar */}
      <div className="sc-topbar">
        <div className="sc-half-badge">{t('scorer.halfBadge', { current: currentHalf, total: halfCount })}</div>
        <button className="sc-end-btn" onClick={handleEnd}>{t('scorer.end')}</button>
      </div>

      {/* Clock progress bar */}
      <div className="sc-progress-track">
        <div className="sc-progress-fill" style={{ width: `${clockPct}%`, background: isLast10 ? '#ff5252' : 'var(--acc)' }} />
      </div>

      {/* Big centered clock */}
      <div className="sc-clock-wrap">
        <div className={`sc-clock${isLast10 ? ' sc-clock-urgent' : ''}`} onClick={() => setRunning(v => !v)} title={t('scorer.clockTitle')}>
          {fmtClock(remainingHalfSec)}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="sc-board">
        <div className="sc-team sc-team-left" style={{ '--tc': c1 }}>
          <div className="sc-logo-wrap">
            {logos?.[0]
              ? <img src={logos[0]} className="sc-logo" alt={teams[0]?.name} />
              : <div className="sc-logo-placeholder" style={{ background: c1 + '22', ...teamTextStyle(c1) }}>
                  {(teams[0]?.name || 'E')[0].toUpperCase()}
                </div>
            }
          </div>
          <div className="sc-team-name">{teams[0]?.name}</div>
          <AnimScore value={s0} color={c1} />
          <div className="sc-half-score" style={teamTextStyle(c1)}>+{halfScore0}</div>
          <div className="sc-actions">
            <button className="sc-btn-score" style={{ background: c1 }} onClick={() => adjScore(0, 1)}>+1</button>
            <button className="sc-btn-neg" onClick={() => adjScore(0, -1)}>-1</button>
          </div>
        </div>

        {two && (
          <div className="sc-team sc-team-right" style={{ '--tc': c2 }}>
            <div className="sc-logo-wrap">
              {logos?.[1]
                ? <img src={logos[1]} className="sc-logo" alt={teams[1]?.name} />
                : <div className="sc-logo-placeholder" style={{ background: c2 + '22', ...teamTextStyle(c2) }}>
                    {(teams[1]?.name || 'E')[0].toUpperCase()}
                  </div>
              }
            </div>
            <div className="sc-team-name">{teams[1]?.name}</div>
            <AnimScore value={s1} color={c2} />
            <div className="sc-half-score" style={teamTextStyle(c2)}>+{halfScore1}</div>
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
          {running ? t('scorer.pause') : elapsedSec > 0 ? t('scorer.resume') : t('scorer.start')}
        </button>
        {currentHalf < halfCount && (
          <button className="sc-ctrl-btn" onClick={handleSkipHalf} title={t('scorer.nextHalfTitle')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 15,12 5,21"/><rect x="16" y="3" width="3" height="18"/></svg>
            {t('scorer.nextHalf')}
          </button>
        )}
        <button className="sc-ctrl-btn" onClick={handleResetCurrentHalf} title={t('scorer.resetHalfTitle')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          {t('scorer.resetHalf')}
        </button>
        <button className="sc-ctrl-btn" onClick={handleResetScorer} title={t('scorer.resetAllTitle')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          {t('scorer.resetAll')}
        </button>
      </div>
    </div>
  )

}
