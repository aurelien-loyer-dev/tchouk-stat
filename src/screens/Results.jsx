import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { score, tirs, pointAdv, tirAdvMarques, tirsAdv, catchsNous, fautesTotal } from '../lib/stats'
import { buildShotSeries } from '../lib/shotSeries'

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

function fileSafeName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean
  const n = Number.parseInt(full, 16)
  if (Number.isNaN(n)) return { r: 31, g: 111, b: 235 }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}


function TimelineGraph({ teams, timeline, settings }) {
  const { series, maxT, maxV, hasData } = buildShotSeries(teams, timeline)
  const w = 980
  const h = 260
  const pl = 58
  const pr = 20
  const pt = 18
  const pb = 36

  const x = t => pl + (t / maxT) * (w - pl - pr)
  const y = v => h - pb - (v / maxV) * (h - pt - pb)

  return (
    <div className="tg-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="tg-svg" role="img" aria-label="Timeline des tirs">
        <line x1={pl} y1={h - pb} x2={w - pr} y2={h - pb} className="tg-axis" />
        <line x1={pl} y1={pt} x2={pl} y2={h - pb} className="tg-axis" />

        {[0, 0.25, 0.5, 0.75, 1].map(tick => {
          const tx = x(maxT * tick)
          return (
            <g key={`x-${tick}`}>
              <line x1={tx} y1={pt} x2={tx} y2={h - pb} className="tg-grid" />
              <text x={tx} y={h - 12} textAnchor="middle" className="tg-label">{fmtDuration(Math.round(maxT * tick))}</text>
            </g>
          )
        })}

        {Array.from({ length: maxV + 1 }, (_, i) => i).map(v => {
          const ty = y(v)
          return (
            <g key={`y-${v}`}>
              <line x1={pl} y1={ty} x2={w - pr} y2={ty} className="tg-grid" />
              <text x={pl - 8} y={ty + 4} textAnchor="end" className="tg-label">{v}</text>
            </g>
          )
        })}

        {series.map((pts, i) => {
          const color = settings?.teamColors?.[i] || (i === 0 ? '#0e9f8f' : '#d14343')
          const d = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${x(p.t)} ${y(p.v)}`).join(' ')
          return <path key={`line-${i}`} d={d} fill="none" stroke={color} strokeWidth="3" />
        })}
      </svg>

      <div className="tg-legend">
        {teams.map((team, i) => {
          const color = settings?.teamColors?.[i] || (i === 0 ? '#0e9f8f' : '#d14343')
          return (
            <div className="tg-leg-item" key={team.name + i}>
              <span className="tg-leg-dot" style={{ background: color }} />
              <span>{team.name}</span>
            </div>
          )
        })}
      </div>

      {!hasData && <div className="tl-empty">Aucun tir enregistre pour le moment.</div>}
    </div>
  )
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
  mode,
  logos,
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

  if (mode === 'scorer') {
    return (
      <>
        <div className="res-simple-msg">Bien joué !</div>

        <div className="res-simple-board">
          {teams.slice(0, 2).map((team, i) => (
            <div className="res-simple-team" key={team.name + i}>
              <div className="res-simple-logo-wrap">
                {logos?.[i]
                  ? <img src={logos[i]} alt={team.name} className="res-simple-logo" />
                  : <div className="res-simple-logo-ph">{(team.name || 'E')[0].toUpperCase()}</div>
                }
              </div>
              <div className="res-simple-name">{team.name}</div>
              <div className="res-simple-score" style={{ color: i === 0 ? 'var(--c1)' : 'var(--c2)' }}>
                {score(teams, numTeams, i)}
              </div>
            </div>
          ))}
        </div>

        <button
          className="btn-ghost"
          style={{ alignSelf: 'center', minWidth: 220, marginTop: 10 }}
          onClick={onNew}
        >
          ← Nouveau match
        </button>
      </>
    )
  }

  function handleDownloadSheet() {
    if (!summary) return

    const team1 = fileSafeName(teams?.[0]?.name) || 'equipe1'
    const team2 = fileSafeName(teams?.[1]?.name) || 'equipe2'
    const pdfName = `${team1}vs${team2}.pdf`

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const c1 = hexToRgb(settings?.teamColors?.[0] || '#0e9f8f')
    const c2 = hexToRgb(settings?.teamColors?.[1] || '#d14343')
    const { series, maxT, maxV } = buildShotSeries(teams, timeline)

    let y = 12
    const left = 14
    const maxW = pageW - left * 2

    function ensurePage(space = 0) {
      if (y + space > pageH - 14) {
        doc.addPage()
        y = 14
      }
    }

    function addLine(text, size = 10, weight = 'normal', space = 5) {
      doc.setFont('helvetica', weight)
      doc.setFontSize(size)
      const lines = doc.splitTextToSize(text, maxW)
      lines.forEach(line => {
        ensurePage(space)
        doc.text(line, left, y)
        y += space
      })
    }

    function addCard(title, rows) {
      const cardX = left
      const cardW = maxW
      const cardH = 10 + rows.length * 5 + 4
      ensurePage(cardH + 4)
      doc.setDrawColor(215, 221, 231)
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(cardX, y, cardW, cardH, 2, 2, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(title, cardX + 4, y + 7)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      rows.forEach((row, i) => {
        doc.text(row, cardX + 4, y + 13 + i * 5)
      })
      y += cardH + 4
    }

    doc.setFillColor(20, 30, 48)
    doc.rect(0, 0, pageW, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('Feuille de match', left, 12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Export: ${fmtDateTime(new Date().toISOString())}`, left, 19)
    doc.text(summary.teams.map(team => `${team.name} ${team.score}`).join(' - '), left, 24)
    doc.setTextColor(15, 23, 42)
    y = 34

    addCard('Resume', [
      `Date du match: ${fmtDateTime(summary.playedAt)}`,
      `Duree: ${fmtDuration(summary.durationSec)}`,
      `Format: ${summary.numTeams} equipe(s)`,
      `Mi-temps: ${settings?.halfCount || '-'} x ${settings?.halfDurationMin || '-'} min`,
    ])

    if (Array.isArray(summary.teams)) {
      summary.teams.forEach((team, idx) => {
        addCard(`Stats - ${team.name}`, [
          `Score: ${team.score}`,
          `Tirs: ${team.tirs} | Gagnes: ${team.tGagne} | Donnes: ${team.tDonne}`,
          `Catches: ${team.tCatche} | Fautes tir: ${team.tFaute}`,
          `Fautes total: ${team.fautes} | Possessions: ${team.pos}`,
          `Couleur equipe: ${idx === 0 ? '#' + ((1 << 24) + (c1.r << 16) + (c1.g << 8) + c1.b).toString(16).slice(1) : '#' + ((1 << 24) + (c2.r << 16) + (c2.g << 8) + c2.b).toString(16).slice(1)}`,
        ])
      })
    }

    ensurePage(70)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Timeline des tirs (graphique)', left, y)
    y += 4

    const gx = left
    const gy = y + 2
    const gw = maxW
    const gh = 52
    const gpl = gx + 10
    const gpr = gx + gw - 4
    const gpt = gy + 4
    const gpb = gy + gh - 8
    const mapX = t => gpl + (t / Math.max(1, maxT)) * (gpr - gpl)
    const mapY = v => gpb - (v / Math.max(1, maxV)) * (gpb - gpt)

    doc.setDrawColor(220, 226, 235)
    doc.roundedRect(gx, gy, gw, gh, 2, 2)
    doc.line(gpl, gpb, gpr, gpb)
    doc.line(gpl, gpt, gpl, gpb)

    series.forEach((pts, idx) => {
      const c = idx === 0 ? c1 : c2
      doc.setDrawColor(c.r, c.g, c.b)
      doc.setLineWidth(0.7)
      for (let i = 1; i < pts.length; i++) {
        doc.line(mapX(pts[i - 1].t), mapY(pts[i - 1].v), mapX(pts[i].t), mapY(pts[i].v))
      }
    })
    y += gh + 8

    addLine('Details des evenements de tir', 11, 'bold', 6)
    const events = (timeline || []).filter(ev => ev.category === 'tirs')
    if (events.length === 0) {
      addLine('Aucun evenement enregistre.', 10, 'normal', 5)
    } else {
      events.forEach(ev => {
        const label = SHOT_LABELS[ev.id] || ev.id
        const scoreLine = Array.isArray(ev.scores) ? ` | Score: ${ev.scores.join(' - ')}` : ''
        addLine(`${fmtDuration(ev.elapsedSec)} - ${ev.teamName} - ${label} (${ev.d > 0 ? '+1' : '-1'})${scoreLine}`, 9, 'normal', 4.5)
      })
    }

    doc.save(pdfName)
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

      {/* ── Resume ── */}
      {summary && (
        <Card title="Resume du match">
          <Row label="Date">
            <span className="si-v sub">{fmtDateTime(summary.playedAt)}</span>
          </Row>
          <Row label="Duree totale">
            <span className="si-v sub">{fmtDuration(summary.durationSec)}</span>
          </Row>
          <Row label="Format">
            <span className="si-v sub">{summary.numTeams} equipes</span>
          </Row>
          <Row label="Mi-temps">
            <span className="si-v sub">{settings?.halfCount || '-'} x {settings?.halfDurationMin || '-'} min</span>
          </Row>
          <Row label="Evenements tirs enregistres">
            <span className="si-v sub">{summary.shotEvents ?? 0}</span>
          </Row>
        </Card>
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
        <Row label="Total fautes"><N v={ft} /></Row>
        <Row label="Fautes sur tir"><span className="si-v sub">{t.tFaute}</span></Row>
        <Row label="Fautes techniques"><span className="si-v sub">{(t.fTech ?? 0) + (t.fZone ?? 0) + (t.fMarche ?? 0) + (t.fAutre ?? 0)}</span></Row>
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
      <Card title="Timeline des tirs (graphique)">
        <TimelineGraph teams={teams} timeline={timeline} settings={settings} />

        {shotEvents.length > 0 && (
          <div className="tl-list">
            {shotEvents.map((ev, i) => (
              <div className="tl-item" key={`${ev.at}-${i}`}>
                <div className="tl-time">{fmtDuration(ev.elapsedSec)}</div>
                <div className="tl-main">
                  <div className="tl-label">
                    {SHOT_LABELS[ev.id] || ev.id}
                    <span className={`tl-delta ${ev.d > 0 ? 'pos' : 'neg'}`}>{ev.d > 0 ? '+1' : '-1'}</span>
                  </div>
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
        Télécharger la feuille de match (PDF)
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
