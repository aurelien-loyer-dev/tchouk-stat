import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { score, tirs, pointAdv, tirAdvMarques, tirsAdv, catchsNous, fautesTotal } from '../lib/stats'

const SHOT_LABELS = {
  tGagne: 'Tir gagné',
  tDonne: 'Tir donné',
  tCatche: 'Tir catché',
  tFaute: 'Faute sur tir',
}

function fmtDuration(totalSec) {
  const sec = Math.max(0, totalSec || 0)
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

function fmtDateTime(iso) {
  try {
    return new Date(iso).toLocaleString('fr-FR')
  } catch {
    return ''
  }
}

// ── Helpers d'affichage ───────────────────────────────────────────────────────
function N({ v }) {
  if (v === null || v === undefined) return <span className="si-v na">—</span>
  return <span className="si-v">{v}</span>
}

function Pct({ num, den }) {
  if (!den || isNaN(num / den)) return <span className="si-v na">—</span>
  return (
    <span className="si-v">
      {Math.round((num / den) * 100)}
      <span className="unit">%</span>
    </span>
  )
}

function Ratio({ num, den }) {
  if (!den || isNaN(num / den)) return <span className="si-v na">—</span>
  return <span className="si-v">{(num / den).toFixed(2).replace('.', ',')}</span>
}

function Row({ label, sub, children }) {
  return (
    <div className="si">
      <div className="si-l">
        {label}
        {sub && <small>{sub}</small>}
      </div>
      {children}
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="card">
      <div className="ctitle">{title}</div>
      {children}
    </div>
  )
}

// ── Results screen ────────────────────────────────────────────────────────────
export default function Results({
  teams,
  numTeams,
  timeline,
  settings,
  summary,
  onNew,
}) {
  const [tab, setTab] = useState(0)

  if (!teams || teams.length === 0) return null

  const t   = teams[tab]
  const n   = numTeams
  const ti  = tirs(teams, n, tab)
  const pa  = pointAdv(teams, n, tab)
  const tam = tirAdvMarques(teams, n, tab)
  const ta  = tirsAdv(teams, n, tab)   // tirs adverses total (2-team only)
  const cn  = catchsNous(teams, n, tab) // nos catches défensifs
  const ft  = fautesTotal(t)

  const shotEvents = (timeline || []).filter(e => e.teamIdx === tab && e.category === 'tirs')

  function handleDownloadSheet() {
    if (!summary) return

    const now = new Date()
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()

    let y = 15
    const left = 14
    const maxW = pageW - left * 2

    function addLine(text, size = 11, weight = 'normal', space = 6) {
      doc.setFont('helvetica', weight)
      doc.setFontSize(size)
      const lines = doc.splitTextToSize(text, maxW)
      lines.forEach(line => {
        if (y > pageH - 12) {
          doc.addPage()
          y = 15
        }
        doc.text(line, left, y)
        y += space
      })
    }

    addLine('Feuille de match - Tchoukball', 17, 'bold', 7)
    addLine(`Date du match: ${fmtDateTime(summary.playedAt)}`, 11, 'normal', 5)
    addLine(`Duree: ${fmtDuration(summary.durationSec)} | Equipes: ${summary.numTeams}`, 11, 'normal', 7)

    if (Array.isArray(summary.teams)) {
      addLine('Score final', 13, 'bold', 6)
      addLine(summary.teams.map(team => `${team.name} ${team.score}`).join(' - '), 12, 'normal', 7)

      addLine('Stats equipes', 13, 'bold', 6)
      summary.teams.forEach(team => {
        addLine(`${team.name}:`, 11, 'bold', 5)
        addLine(`  Tirs ${team.tirs} | Gagnes ${team.tGagne} | Donnes ${team.tDonne} | Catches ${team.tCatche} | Fautes tir ${team.tFaute}`, 10, 'normal', 5)
        addLine(`  Fautes total ${team.fautes} | Possessions ${team.pos}`, 10, 'normal', 6)
      })
    }

    addLine('Parametres match', 13, 'bold', 6)
    addLine(`Mi-temps: ${settings?.halfCount || '-'} x ${settings?.halfDurationMin || '-'} min`, 10, 'normal', 6)

    addLine('Timeline des tirs', 13, 'bold', 6)
    if (!timeline || timeline.length === 0) {
      addLine('Aucun evenement enregistre.', 10, 'normal', 6)
    } else {
      timeline
        .filter(ev => ev.category === 'tirs')
        .forEach(ev => {
          const label = SHOT_LABELS[ev.id] || ev.id
          const scoreLine = Array.isArray(ev.scores) ? ` | Score: ${ev.scores.join(' - ')}` : ''
          addLine(`${fmtDuration(ev.elapsedSec)} - ${ev.teamName} - ${label} (${ev.d > 0 ? '+1' : '-1'})${scoreLine}`, 10, 'normal', 5)
        })
    }

    doc.save(`feuille-match-${stamp}.pdf`)
  }

  return (
    <>
      {/* Score final */}
      <div className="rf">
        {n === 1 ? (
          <span style={{ color: 'var(--c1)' }}>{score(teams, n, 0)}</span>
        ) : (
          <>
            <span style={{ color: 'var(--c1)' }}>{score(teams, n, 0)}</span>
            <span style={{ color: 'var(--s3)', fontWeight: 200 }}> – </span>
            <span style={{ color: 'var(--c2)' }}>{score(teams, n, 1)}</span>
          </>
        )}
      </div>

      {/* Onglets équipes */}
      {n === 2 && (
        <div className="tabs">
          {teams.map((team, i) => (
            <button
              key={i}
              className={`tab${i === tab ? ` a${i}` : ''}`}
              onClick={() => setTab(i)}
            >
              {team.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Tirs ── */}
      <Card title="Tirs">
        <Row label="Tirs total"><N v={ti} /></Row>
        <Row label="Gagnés" sub="points marqués"><N v={t.tGagne} /></Row>
        <Row label="Donnés" sub="points adverses offerts"><N v={t.tDonne} /></Row>
        <Row label="Catchés" sub="possession perdue"><N v={t.tCatche} /></Row>
        <Row label="Fautes sur tir" sub="hors catégorie fautes techniques"><N v={t.tFaute} /></Row>
      </Card>

      {/* ── Passes ── */}
      <Card title="Passes">
        <Row label="Passes total"><N v={t.pReussie + t.pRatee} /></Row>
        <Row label="Ratées"><N v={t.pRatee} /></Row>
      </Card>

      {/* ── Fautes techniques ── */}
      <Card title="Fautes techniques">
        <Row label="Total fautes" sub="tir + zone + marche + autre"><N v={ft} /></Row>
        <Row label="Fautes sur tir"><span className="si-v sub">{t.tFaute}</span></Row>
        <Row label="Zones"><span className="si-v sub">{t.fZone}</span></Row>
        <Row label="Marches"><span className="si-v sub">{t.fMarche}</span></Row>
        <Row label="Autres"><span className="si-v sub">{t.fAutre}</span></Row>
      </Card>

      {/* ── Données adverses ── */}
      <Card title="Données adverses">
        <Row label="Score adverse total"><N v={pa} /></Row>
        <Row label="Tirs adverses marqués" sub="score adv. − points donnés">
          <N v={tam} />
        </Row>
        {n === 2 && (
          <Row label="Tirs adverses total"><N v={ta} /></Row>
        )}
        <Row
          label="Nos catches défensifs"
          sub={n === 2 ? 'tirs adverses que nous avons catchés' : null}
        >
          <N v={cn} />
        </Row>
        <Row label="Possessions"><N v={t.pos} /></Row>
      </Card>

      {/* ── Ratios ── */}
      <Card title="Ratios &amp; efficacité">
        <Row label="Efficacité offensive" sub="gagnés / tirs total">
          <Pct num={t.tGagne} den={ti} />
        </Row>
        <Row label="Efficacité défensive" sub={n === 2 ? 'nos catches / tirs adverses total' : 'nos catches / tirs adverses marqués'}>
          <Pct num={cn} den={n === 2 ? ta : tam} />
        </Row>
        <Row label="Conversion d'action" sub="tirs / possessions">
          <Ratio num={ti} den={t.pos} />
        </Row>
        <Row label="Points offerts (tirs donnés)" sub="donnés / tirs total">
          <Pct num={t.tDonne} den={ti} />
        </Row>
      </Card>

      {/* ── Timeline des tirs ── */}
      <Card title="Timeline des tirs">
        {shotEvents.length === 0 ? (
          <div className="tl-empty">Aucun événement de tir enregistré.</div>
        ) : (
          <div className="tl-list">
            {shotEvents.map((ev, i) => (
              <div className="tl-item" key={`${ev.at}-${i}`}>
                <div className="tl-time">{fmtDuration(ev.elapsedSec)}</div>
                <div className="tl-main">
                  <div className="tl-label">
                    {SHOT_LABELS[ev.id] || ev.id}
                    <span className={`tl-delta ${ev.d > 0 ? 'pos' : 'neg'}`}>{ev.d > 0 ? '+1' : '-1'}</span>
                  </div>
                  {n === 2 && Array.isArray(ev.scores) && ev.scores.length >= 2 && (
                    <div className="tl-score">
                      Score: {teams[0].name} {ev.scores[0]} - {ev.scores[1]} {teams[1].name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <button
        className="btn-ghost"
        style={{ alignSelf: 'center', minWidth: 260, marginTop: 4 }}
        onClick={handleDownloadSheet}
      >
        Telecharger la feuille de match (PDF)
      </button>

      <button
        className="btn-ghost"
        style={{ alignSelf: 'center', minWidth: 200, marginTop: 8 }}
        onClick={onNew}
      >
        ← Nouveau match
      </button>
    </>
  )
}
