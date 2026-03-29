import { useState } from 'react'
import { buildShotSeries } from '../lib/shotSeries'

function fmtDuration(totalSec) {
  const sec = Math.max(0, totalSec || 0)
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

function fmtDateTime(iso) {
  try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

const SHOT_LABELS = {
  tGagne: 'Tir gagné',
  tDonne: 'Tir donné',
  tCatche: 'Tir catché',
  tFaute: 'Faute sur tir',
}

function MiniTimeline({ timeline, settings, teams }) {
  const { series, maxT, maxV } = buildShotSeries(teams || [], timeline || [])
  const w = 800, h = 160, pl = 32, pr = 12, pt = 10, pb = 28
  const x = t => pl + (t / Math.max(1, maxT)) * (w - pl - pr)
  const y = v => h - pb - (v / Math.max(1, maxV)) * (h - pt - pb)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="tg-svg" style={{ marginTop: 8 }}>
      <line x1={pl} y1={h - pb} x2={w - pr} y2={h - pb} className="tg-axis" />
      <line x1={pl} y1={pt}     x2={pl}     y2={h - pb} className="tg-axis" />
      {[0, 0.25, 0.5, 0.75, 1].map(tick => {
        const tx = x(maxT * tick)
        return (
          <g key={tick}>
            <line x1={tx} y1={pt} x2={tx} y2={h - pb} className="tg-grid" />
            <text x={tx} y={h - 8} textAnchor="middle" className="tg-label">{fmtDuration(Math.round(maxT * tick))}</text>
          </g>
        )
      })}
      {series.map((pts, i) => {
        const color = settings?.teamColors?.[i] || (i === 0 ? '#0e9f8f' : '#d14343')
        const d = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${x(p.t)} ${y(p.v)}`).join(' ')
        return <path key={i} d={d} fill="none" stroke={color} strokeWidth="2.5" />
      })}
    </svg>
  )
}

function MatchDetail({ match, onClose }) {
  const { teams, timeline, settings } = match
  const shotEvents = (timeline || []).filter(e => e.category === 'tirs')

  return (
    <div className="hist-detail">
      <div className="hist-detail-header">
        <button className="btn-ghost hist-back" onClick={onClose}>← Retour</button>
        <div className="hist-detail-date">{fmtDateTime(match.playedAt)}</div>
      </div>

      {/* Score */}
      <div className="rf" style={{ marginBottom: 8 }}>
        {teams.map((t, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: 'var(--s3)', fontWeight: 200 }}> – </span>}
            <span style={{ color: settings?.teamColors?.[i] || 'var(--txt)' }}>{t.name} {t.score}</span>
          </span>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="ctitle">Résumé</div>
        <div className="si">
          <div className="si-l">Format</div>
          <span className="si-v" style={{ fontSize: 14 }}>{match.settings?.halfCount}×{match.settings?.halfDurationMin} min</span>
        </div>
        <div className="si">
          <div className="si-l">Durée réelle</div>
          <span className="si-v" style={{ fontSize: 14 }}>{fmtDuration(match.durationSec)}</span>
        </div>
        <div className="si">
          <div className="si-l">Événements tir</div>
          <span className="si-v" style={{ fontSize: 14 }}>{match.shotEvents}</span>
        </div>
      </div>

      {/* Per-team stats */}
      {teams.map((t, i) => (
        <div className="card" key={i} style={{ marginBottom: 12, borderTop: `3px solid ${settings?.teamColors?.[i] || 'var(--acc)'}` }}>
          <div className="ctitle" style={{ color: settings?.teamColors?.[i] }}>{t.name}</div>
          <div className="si"><div className="si-l">Score</div><span className="si-v">{t.score}</span></div>
          <div className="si"><div className="si-l">Tirs</div><span className="si-v" style={{ fontSize: 16 }}>{t.tirs}</span></div>
          <div className="si"><div className="si-l">Gagnés</div><span className="si-v" style={{ fontSize: 16 }}>{t.tGagne}</span></div>
          <div className="si"><div className="si-l">Donnés</div><span className="si-v" style={{ fontSize: 16 }}>{t.tDonne}</span></div>
          <div className="si"><div className="si-l">Catchés</div><span className="si-v" style={{ fontSize: 16 }}>{t.tCatche}</span></div>
          <div className="si"><div className="si-l">Fautes tir</div><span className="si-v" style={{ fontSize: 16 }}>{t.tFaute}</span></div>
          <div className="si"><div className="si-l">Fautes total</div><span className="si-v" style={{ fontSize: 16 }}>{t.fautes}</span></div>
          <div className="si"><div className="si-l">Possessions</div><span className="si-v" style={{ fontSize: 16 }}>{t.pos}</span></div>
          {t.tirs > 0 && (
            <div className="si">
              <div className="si-l">Efficacité offensive</div>
              <span className="si-v" style={{ fontSize: 16 }}>{Math.round((t.tGagne / t.tirs) * 100)}<span className="unit">%</span></span>
            </div>
          )}
        </div>
      ))}

      {/* Timeline graph */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="ctitle">Timeline des tirs</div>
        <MiniTimeline timeline={timeline} settings={settings} teams={(match.teamsSnapshot || []).map((t, i) => ({ ...t, name: teams[i]?.name || t.name }))} />
        <div className="tg-legend" style={{ marginTop: 8 }}>
          {teams.map((t, i) => (
            <div className="tg-leg-item" key={i}>
              <span className="tg-leg-dot" style={{ background: settings?.teamColors?.[i] || 'var(--dim)' }} />
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Events list */}
      {shotEvents.length > 0 && (
        <div className="card">
          <div className="ctitle">Événements ({shotEvents.length})</div>
          <div className="tl-list">
            {shotEvents.map((ev, i) => {
              const color = settings?.teamColors?.[ev.teamIdx] || 'var(--dim)'
              return (
                <div className="tl-item" key={`${ev.at}-${i}`}>
                  <div className="tl-time">{fmtDuration(ev.elapsedSec)}</div>
                  <div className="tl-main">
                    <div className="tl-label">
                      <span style={{ color, fontWeight: 700, marginRight: 4 }}>{ev.teamName}</span>
                      {SHOT_LABELS[ev.id] || ev.id}
                      <span className={`tl-delta ${ev.d > 0 ? 'pos' : 'neg'}`}>{ev.d > 0 ? '+1' : '-1'}</span>
                    </div>
                    {Array.isArray(ev.scores) && (
                      <div className="tl-score">{ev.scores.join(' – ')}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function History({ history, onBack, onClear }) {
  const [selected, setSelected] = useState(null)

  if (selected) {
    return <MatchDetail match={selected} onClose={() => setSelected(null)} />
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h1>Historique</h1>
        <button className="btn-ghost" style={{ padding: '8px 14px', fontSize: 14 }} onClick={onBack}>← Retour</button>
      </div>

      {history.length === 0 ? (
        <div className="card" style={{ color: 'var(--dim)', fontSize: 14, textAlign: 'center', padding: 32 }}>
          Aucun match enregistré pour le moment.
        </div>
      ) : (
        <>
          <div className="hist-list">
            {history.map(m => (
              <button
                className="hist-btn hist-item"
                key={m.id}
                onClick={() => setSelected(m)}
              >
                <div className="hist-top">
                  <span>{fmtDateTime(m.playedAt)}</span>
                  <span>{m.settings?.halfCount}×{m.settings?.halfDurationMin}min</span>
                </div>
                <div className="hist-scoreline">
                  {m.teams.map((t, i) => (
                    <span key={i}>
                      {i > 0 && <span style={{ color: 'var(--dim)', fontWeight: 200 }}> – </span>}
                      <span style={{ color: m.settings?.teamColors?.[i] || 'var(--txt)' }}>{t.name} {t.score}</span>
                    </span>
                  ))}
                </div>
                <div className="hist-stats">
                  {m.teams.map(t => `${t.tirs} tirs`).join(' · ')} · {m.shotEvents} evt
                </div>
              </button>
            ))}
          </div>

          <button
            className="btn-ghost"
            style={{ alignSelf: 'center', marginTop: 8, color: 'var(--c2)' }}
            onClick={() => { if (window.confirm('Effacer tout l\'historique ?')) onClear() }}
          >
            Effacer l'historique
          </button>
        </>
      )}
    </>
  )
}
