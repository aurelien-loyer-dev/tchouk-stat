import { useEffect, useMemo, useRef, useState } from 'react'
import { score, tirs } from '../lib/stats'
import { fmtClock } from '../lib/format'
import { teamTextStyle } from '../lib/teamColor'

// ── Définition des catégories et boutons ──────────────────────────────────────
const CATEGORIES = [
  {
    id: 'tirs',
    title: 'Tirs',
    deriveTotal: t => t.tGagne + t.tDonne + t.tCatche + t.tFaute,
    items: [
      { id: 'tGagne',  label: 'Gagné',           hl: true },
      { id: 'tDonne',  label: 'Donné',            color: 'red' },
      { id: 'tCatche', label: 'Catché' },
      { id: 'tFaute',  label: 'Cadre',            color: 'amber' },
    ],
  },
  {
    id: 'passes',
    title: 'Passes',
    deriveTotal: null,
    items: [
      { id: 'pRatee', label: 'Ratée', color: 'amber' },
    ],
  },
  {
    id: 'fautes',
    title: 'Fautes techniques',
    deriveTotal: null,
    items: [
      { id: 'fTech', label: 'Faute technique', color: 'red' },
    ],
  },
]

// ── Animated : bump CSS quand la valeur change ────────────────────────────────
function Animated({ value, className, style }) {
  const ref  = useRef(null)
  const prev = useRef(value)
  useEffect(() => {
    if (prev.current !== value && ref.current) {
      ref.current.classList.remove('bump')
      void ref.current.offsetWidth
      ref.current.classList.add('bump')
    }
    prev.current = value
  }, [value])
  return <div className={className} style={style} ref={ref}>{value}</div>
}

// ── StatRow ───────────────────────────────────────────────────────────────────
function StatRow({ label, count, hl, color, onInc, onDec }) {
  const cls = ['row', hl && 'hl', color && `row-${color}`].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      <div className="rl">{label}</div>
      <Animated value={count} className="rv" />
      <button className="ab m" onClick={onDec}>−</button>
      <button className="ab p" onClick={onInc}>+</button>
    </div>
  )
}

// ── CatHeader : titre de catégorie avec total dérivé optionnel ────────────────
function CatHeader({ title, total }) {
  return (
    <div className="cat-hd">
      <span>{title}</span>
      {total !== null && total !== undefined && (
        <span className="cat-total">{total}</span>
      )}
    </div>
  )
}

// ── Panel : une équipe ────────────────────────────────────────────────────────
function Panel({ team, teamIdx, numTeams, onAdj }) {
  const cls = numTeams === 2 ? `p${teamIdx}` : 'ps'

  return (
    <div className={`panel ${cls}`}>
      <div className="ph">{team.name}</div>

      {/* Possession */}
      <div className="cat-hd cat-first"><span>Possession</span></div>
      <StatRow
        label="Ballons"
        count={team.pos}
        onInc={() => onAdj(teamIdx, 'pos', 1)}
        onDec={() => onAdj(teamIdx, 'pos', -1)}
      />

      {/* Catégories */}
      {CATEGORIES.map(cat => (
        <div key={cat.id}>
          <CatHeader
            title={cat.title}
            total={cat.deriveTotal ? cat.deriveTotal(team) : null}
          />
          {cat.items.map(item => (
            <StatRow
              key={item.id}
              label={item.label}
              count={team[item.id]}
              hl={item.hl}
              color={item.color}
              onInc={() => onAdj(teamIdx, item.id, 1)}
              onDec={() => onAdj(teamIdx, item.id, -1)}
            />
          ))}
        </div>
      ))}

      {/* Score adverse (1 équipe uniquement) */}
      {numTeams === 1 && (
        <>
          <div className="cat-hd"><span>Adversaire</span></div>
          <StatRow
            label="Score adverse"
            count={team.padv}
            onInc={() => onAdj(teamIdx, 'padv', 1)}
            onDec={() => onAdj(teamIdx, 'padv', -1)}
          />
        </>
      )}
    </div>
  )
}

// ── Match screen ──────────────────────────────────────────────────────────────
export default function Match({ teams, numTeams, onAdj, onEnd, settings }) {
  const two = numTeams === 2
  const [elapsedSec, setElapsedSec] = useState(0)
  const [running, setRunning] = useState(false)

  const halfDurationMin = Math.max(1, Number(settings?.halfDurationMin) || 12)
  const halfCount = Math.max(1, Number(settings?.halfCount) || 2)

  const totalHalfSec = halfDurationMin * 60
  const totalMatchSec = totalHalfSec * halfCount

  const c1 = settings?.teamColors?.[0] || '#0e9f8f'
  const c2 = settings?.teamColors?.[1] || '#d14343'

  useEffect(() => {
    if (!running) return undefined
    const id = window.setInterval(() => {
      setElapsedSec(prev => {
        const next = prev + 1
        if (next >= totalMatchSec) {
          setRunning(false)
          return totalMatchSec
        }
        return next
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running, totalMatchSec])

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

  function handleEnd() {
    if (window.confirm('Terminer le match et voir les statistiques ?')) onEnd()
  }

  return (
    <>
      <div className="sb">
        <div className="sb-scores">
          {two ? (
            <>
              <div className="sb-t">
                <div className="sb-name" style={teamTextStyle(c1)}>{teams[0].name}</div>
                <Animated value={score(teams, numTeams, 0)} className="sb-score" style={teamTextStyle(c1)} />
              </div>
              <div className="sb-sep">–</div>
              <div className="sb-t">
                <Animated value={score(teams, numTeams, 1)} className="sb-score" style={teamTextStyle(c2)} />
                <div className="sb-name" style={teamTextStyle(c2)}>{teams[1].name}</div>
              </div>
            </>
          ) : (
            <div className="sb-t">
              <div className="sb-name">{teams[0].name}</div>
              <Animated value={score(teams, numTeams, 0)} className="sb-score" style={teamTextStyle(c1)} />
            </div>
          )}
        </div>

        <div className="clock-wrap">
          <div className="clock-main">{fmtClock(remainingHalfSec)}</div>
          <div className="clock-meta">
            Mi-temps {currentHalf}/{halfCount} · Restant match {fmtClock(remainingMatchSec)}
          </div>
          <div className="clock-ctrl">
            <button className="btn-mini" onClick={() => setRunning(v => !v)}>
              {running ? 'Pause' : elapsedSec > 0 ? 'Reprendre' : 'Démarrer'}
            </button>
            {currentHalf < halfCount && (
              <button className="btn-mini" onClick={handleSkipHalf} title="Passer à la mi-temps suivante">
                MT suiv.
              </button>
            )}
            <button className="btn-mini" onClick={handleResetCurrentHalf} title="Remet le chrono de cette mi-temps à zéro">
              Reset MT
            </button>
            <button className="btn-mini" onClick={handleResetAll} title="Remet le chrono complet à zéro">
              Reset tout
            </button>
          </div>
        </div>
      </div>

      <div className={`grid${two ? ' g2' : ''}`}>
        {teams.map((team, i) => (
          <Panel key={i} team={team} teamIdx={i} numTeams={numTeams} onAdj={onAdj} />
        ))}
      </div>

      <button className="btn-end" onClick={handleEnd}>
        Fin du match →
      </button>
    </>
  )
}
