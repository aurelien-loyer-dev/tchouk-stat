import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { useTranslation } from 'react-i18next'
import { score, tirs, pointAdv, tirAdvMarques, tirsAdv, catchsNous, fautesTotal } from '../lib/stats'
import { buildPointsSeries } from '../lib/shotSeries'
import { fmtClock, fmtDateTime, hexToRgb, fileSafeName } from '../lib/format'
import { teamTextStyle, teamSwatchStyle, colorLum } from '../lib/teamColor'

function TimelineGraph({ teams, timeline, settings }) {
  const { t } = useTranslation()
  const { series, maxT, maxV, hasData } = buildPointsSeries(teams, timeline)
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
      <svg viewBox={`0 0 ${w} ${h}`} className="tg-svg" role="img" aria-label={t('results.ui.timelineTitle')}>
        <line x1={pl} y1={h - pb} x2={w - pr} y2={h - pb} className="tg-axis" />
        <line x1={pl} y1={pt} x2={pl} y2={h - pb} className="tg-axis" />

        {[0, 0.25, 0.5, 0.75, 1].map(tick => {
          const tx = x(maxT * tick)
          return (
            <g key={`x-${tick}`}>
              <line x1={tx} y1={pt} x2={tx} y2={h - pb} className="tg-grid" />
              <text x={tx} y={h - 12} textAnchor="middle" className="tg-label">{fmtClock(Math.round(maxT * tick))}</text>
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
          const needsHalo = colorLum(color) < 0.22
          const d = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${x(p.t)} ${y(p.v)}`).join(' ')
          return (
            <g key={`line-${i}`}>
              {needsHalo && <path d={d} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="6" />}
              <path d={d} fill="none" stroke={color} strokeWidth="3" />
            </g>
          )
        })}
      </svg>

      <div className="tg-legend">
        {teams.map((team, i) => {
          const color = settings?.teamColors?.[i] || (i === 0 ? '#0e9f8f' : '#d14343')
          return (
            <div className="tg-leg-item" key={team.name + i}>
              <span className="tg-leg-dot" style={teamSwatchStyle(color)} />
              <span>{team.name}</span>
            </div>
          )
        })}
      </div>

      {!hasData && <div className="tl-empty">{t('results.ui.noPoints')}</div>}
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
  onNew,
}) {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)

  if (!teams || teams.length === 0) return null

  const c1 = settings?.teamColors?.[0] || '#0e9f8f'
  const c2 = settings?.teamColors?.[1] || '#d14343'

  const activeTeam = teams[tab]
  const n   = numTeams
  const ti  = tirs(teams, n, tab)
  const pa  = pointAdv(teams, n, tab)
  const tam = tirAdvMarques(teams, n, tab)
  const ta  = tirsAdv(teams, n, tab)   // tirs adverses total (2-team only)
  const cn  = catchsNous(teams, n, tab) // nos catches défensifs
  const ft  = fautesTotal(activeTeam)

  const shotEvents = (timeline || []).filter(e => e.teamIdx === tab && e.category === 'tirs')

  function handleDownloadSheet() {
    if (!summary) return

    const team1 = fileSafeName(teams?.[0]?.name) || 'equipe1'
    const team2 = fileSafeName(teams?.[1]?.name) || 'equipe2'
    const pdfName = `${team1}vs${team2}.pdf`
    const pdf = t('results.pdf', { returnObjects: true })
    const pdfShotLabels = pdf.shotLabels

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const c1 = hexToRgb(settings?.teamColors?.[0] || '#0e9f8f')
    const c2 = hexToRgb(settings?.teamColors?.[1] || '#d14343')
    const { series, maxT, maxV } = buildPointsSeries(teams, timeline)

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
    doc.text(pdf.sheetTitle, left, 12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(t('results.pdf.exportLabel', { date: fmtDateTime(new Date().toISOString()) }), left, 19)
    doc.text(summary.teams.map(team => `${team.name} ${team.score}`).join(' - '), left, 24)
    doc.setTextColor(15, 23, 42)
    y = 34

    addCard(pdf.summaryTitle, [
      t('results.pdf.matchDate', { date: fmtDateTime(summary.playedAt) }),
      t('results.pdf.duration', { time: fmtClock(summary.durationSec) }),
      t('results.pdf.format', { count: summary.numTeams }),
      t('results.pdf.halves', { count: settings?.halfCount || '-', duration: settings?.halfDurationMin || '-' }),
    ])

    if (Array.isArray(summary.teams)) {
      summary.teams.forEach((team, idx) => {
        addCard(t('results.pdf.statsTitle', { name: team.name }), [
          t('results.pdf.score', { score: team.score }),
          t('results.pdf.shotsLine', { total: team.tirs, won: team.tGagne, given: team.tDonne }),
          t('results.pdf.caughtLine', { caught: team.tCatche, shotFouls: team.tFaute }),
          t('results.pdf.foulsLine', { fouls: team.fautes, pos: team.pos }),
          t('results.pdf.teamColor', { color: idx === 0 ? '#' + ((1 << 24) + (c1.r << 16) + (c1.g << 8) + c1.b).toString(16).slice(1) : '#' + ((1 << 24) + (c2.r << 16) + (c2.g << 8) + c2.b).toString(16).slice(1) }),
        ])
      })
    }

    ensurePage(70)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(pdf.timelineTitle, left, y)
    y += 4

    const gx = left
    const gy = y + 2
    const gw = maxW
    const gh = 52
    const gpl = gx + 10
    const gpr = gx + gw - 4
    const gpt = gy + 4
    const gpb = gy + gh - 8
    const mapX = xt => gpl + (xt / Math.max(1, maxT)) * (gpr - gpl)
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

    addLine(pdf.eventsDetailTitle, 11, 'bold', 6)
    const events = (timeline || []).filter(ev => ev.category === 'tirs')
    if (events.length === 0) {
      addLine(pdf.noEvents, 10, 'normal', 5)
    } else {
      events.forEach(ev => {
        const label = pdfShotLabels[ev.id] || ev.id
        const scoreLine = Array.isArray(ev.scores) ? `${pdf.scoreSep}${ev.scores.join(' - ')}` : ''
        addLine(`${fmtClock(ev.elapsedSec)} - ${ev.teamName} - ${label} (${ev.d > 0 ? '+1' : '-1'})${scoreLine}`, 9, 'normal', 4.5)
      })
    }

    doc.save(pdfName)
  }

  return (
    <>
      {/* Score final */}
      <div className="rf">
        {n === 1 ? (
          <span style={teamTextStyle(c1)}>{score(teams, n, 0)}</span>
        ) : (
          <>
            <span style={teamTextStyle(c1)}>{score(teams, n, 0)}</span>
            <span style={{ color: 'var(--s3)', fontWeight: 200 }}> – </span>
            <span style={teamTextStyle(c2)}>{score(teams, n, 1)}</span>
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
        <Card title={t('results.ui.summaryTitle')}>
          <Row label={t('results.ui.date')}>
            <span className="si-v sub">{fmtDateTime(summary.playedAt)}</span>
          </Row>
          <Row label={t('results.ui.totalDuration')}>
            <span className="si-v sub">{fmtClock(summary.durationSec)}</span>
          </Row>
          <Row label={t('results.ui.format')}>
            <span className="si-v sub">{t('results.ui.formatTeams', { count: summary.numTeams })}</span>
          </Row>
          <Row label={t('results.ui.halves')}>
            <span className="si-v sub">{settings?.halfCount || '-'} x {settings?.halfDurationMin || '-'} min</span>
          </Row>
          <Row label={t('results.ui.shotEventsRecorded')}>
            <span className="si-v sub">{summary.shotEvents ?? 0}</span>
          </Row>
        </Card>
      )}

      {/* ── Tirs ── */}
      <Card title={t('results.ui.shotsTitle')}>
        <Row label={t('results.ui.totalShots')}><N v={ti} /></Row>
        <Row label={t('results.ui.won')} sub={t('results.ui.wonSub')}><N v={activeTeam.tGagne} /></Row>
        <Row label={t('results.ui.given')} sub={t('results.ui.givenSub')}><N v={activeTeam.tDonne} /></Row>
        <Row label={t('results.ui.caught')} sub={t('results.ui.caughtSub')}><N v={activeTeam.tCatche} /></Row>
        <Row label={t('results.ui.shotFouls')} sub={t('results.ui.shotFoulsSub')}><N v={activeTeam.tFaute} /></Row>
      </Card>

      {/* ── Passes ── */}
      <Card title={t('results.ui.passesTitle')}>
        <Row label={t('results.ui.totalPasses')}><N v={activeTeam.pReussie + activeTeam.pRatee} /></Row>
        <Row label={t('results.ui.missedPasses')}><N v={activeTeam.pRatee} /></Row>
      </Card>

      {/* ── Fautes techniques ── */}
      <Card title={t('results.ui.techFoulsTitle')}>
        <Row label={t('results.ui.totalFouls')}><N v={ft} /></Row>
        <Row label={t('results.ui.shotFouls')}><span className="si-v sub">{activeTeam.tFaute}</span></Row>
        <Row label={t('results.ui.techFouls')}><span className="si-v sub">{(activeTeam.fTech ?? 0) + (activeTeam.fZone ?? 0) + (activeTeam.fMarche ?? 0) + (activeTeam.fAutre ?? 0)}</span></Row>
      </Card>

      {/* ── Données adverses ── */}
      <Card title={t('results.ui.opponentDataTitle')}>
        <Row label={t('results.ui.opponentScoreTotal')}><N v={pa} /></Row>
        <Row label={t('results.ui.opponentShotsScored')} sub={t('results.ui.opponentShotsScoredSub')}>
          <N v={tam} />
        </Row>
        {n === 2 && (
          <Row label={t('results.ui.opponentShotsTotal')}><N v={ta} /></Row>
        )}
        <Row
          label={t('results.ui.ourCatches')}
          sub={n === 2 ? t('results.ui.ourCatchesSub2') : null}
        >
          <N v={cn} />
        </Row>
        <Row label={t('results.ui.possessions')}><N v={activeTeam.pos} /></Row>
      </Card>

      {/* ── Ratios ── */}
      <Card title={t('results.ui.ratiosTitle')}>
        <Row label={t('results.ui.offEff')} sub={t('results.ui.offEffSub')}>
          <Pct num={activeTeam.tGagne} den={ti} />
        </Row>
        <Row label={t('results.ui.defEff')} sub={n === 2 ? t('results.ui.defEffSub2') : t('results.ui.defEffSub1')}>
          <Pct num={cn} den={n === 2 ? ta : tam} />
        </Row>
        <Row label={t('results.ui.actionConversion')} sub={t('results.ui.actionConversionSub')}>
          <Ratio num={ti} den={activeTeam.pos} />
        </Row>
        <Row label={t('results.ui.pointsGiven')} sub={t('results.ui.pointsGivenSub')}>
          <Pct num={activeTeam.tDonne} den={ti} />
        </Row>
      </Card>

      {/* ── Timeline des points ── */}
      <Card title={t('results.ui.timelineTitle')}>
        <TimelineGraph teams={teams} timeline={timeline} settings={settings} />

        {shotEvents.length > 0 && (
          <div className="tl-list">
            {shotEvents.map((ev, i) => (
              <div className="tl-item" key={`${ev.at}-${i}`}>
                <div className="tl-time">{fmtClock(ev.elapsedSec)}</div>
                <div className="tl-main">
                  <div className="tl-label">
                    {t(`shotLabels.${ev.id}`, ev.id)}
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
        {t('results.ui.downloadPdf')}
      </button>

      <button
        className="btn-ghost"
        style={{ alignSelf: 'center', minWidth: 200, marginTop: 8 }}
        onClick={onNew}
      >
        {t('results.ui.newMatch')}
      </button>
    </>
  )
}
