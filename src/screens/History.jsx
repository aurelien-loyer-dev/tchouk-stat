import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { buildPointsSeries } from '../lib/shotSeries'
import { playerTirsTotal, playerDerivedStats, playerTeamScore } from '../lib/playerStats'
import { fmtClock, fmtDateTime, hexToRgb, fileSafeName, pct } from '../lib/format'
import { teamTextStyle, teamSwatchStyle, colorLum } from '../lib/teamColor'

// ── PDF : match stats / scoreur ───────────────────────────────────────────────
function generateStatsPdf(match) {
  const t = i18n.t
  const { teams = [], settings, timeline = [], playedAt, durationSec, numTeams: n = 2 } = match
  const doc   = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const left  = 14
  const maxW  = pageW - left * 2
  let y       = 0

  // Header
  doc.setFillColor(20, 30, 48)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(t('results.pdf.sheetTitle'), left, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(t('history.pdf.exportMatchLabel', { exportDate: fmtDateTime(new Date().toISOString()), playedDate: fmtDateTime(playedAt) }), left, 19)
  const hdrScore = teams.map(tm => `${tm.name} ${tm.score}`).join('  —  ')
  doc.text(hdrScore, left, 25)
  doc.setTextColor(15, 23, 42)
  y = 34

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90, 100, 120)
  doc.text(t('history.pdf.formatDuration', { halfCount: settings?.halfCount, halfDuration: settings?.halfDurationMin, time: fmtClock(durationSec) }), left, y)
  doc.setTextColor(15, 23, 42)
  y += 10

  // Team stats table
  const sCols = t('history.pdf.statsCols', { returnObjects: true })
  const cols = [
    { label: sCols.team,      w: 34, key: 'name' },
    { label: sCols.score,     w: 12, key: 'score' },
    { label: sCols.shots,     w: 11, key: 'tirs' },
    { label: sCols.won,       w: 14, key: 'tGagne' },
    { label: sCols.given,     w: 14, key: 'tDonne' },
    { label: sCols.caught,    w: 15, key: 'tCatche' },
    { label: sCols.shotFouls, w: 11, key: 'tFaute' },
    { label: sCols.fouls,     w: 12, key: 'fautes' },
    { label: sCols.pos,       w: 10, key: 'pos' },
    { label: sCols.eff,       w: 14, key: '__eff' },
  ]
  const scale = maxW / cols.reduce((s, c) => s + c.w, 0)
  const sc    = cols.map(c => ({ ...c, w: c.w * scale }))
  const rowH  = 8

  function xOf(idx) { let x = left; for (let i = 0; i < idx; i++) x += sc[i].w; return x }

  doc.setFillColor(235, 240, 250)
  doc.rect(left, y - 4, maxW, rowH, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(70, 80, 100)
  sc.forEach((col, i) => doc.text(col.label, i === 0 ? xOf(i) + 2 : xOf(i) + col.w / 2, y + 1, { align: i === 0 ? 'left' : 'center' }))
  y += rowH

  teams.slice(0, n).forEach((tm, ti) => {
    const c  = hexToRgb(settings?.teamColors?.[ti])
    const bg = ti % 2 === 0 ? [255, 255, 255] : [248, 250, 254]
    doc.setFillColor(...bg)
    doc.rect(left, y - 4, maxW, rowH, 'F')
    doc.setFillColor(c.r, c.g, c.b)
    doc.rect(left, y - 4, 2, rowH, 'F')
    sc.forEach((col, i) => {
      const val    = col.key === '__eff' ? (tm.tirs > 0 ? `${Math.round((tm.tGagne / tm.tirs) * 100)} %` : '—') : String(tm[col.key] ?? 0)
      const isBold = col.key === 'name' || col.key === 'score'
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      doc.setFontSize(isBold ? 8.5 : 8)
      doc.setTextColor(isBold ? 15 : 50, isBold ? 23 : 60, isBold ? 42 : 80)
      doc.text(val, i === 0 ? xOf(i) + 4 : xOf(i) + col.w / 2, y + 1, { align: i === 0 ? 'left' : 'center', maxWidth: col.w - 3 })
    })
    doc.setDrawColor(230, 235, 245)
    doc.line(left, y + rowH - 4, left + maxW, y + rowH - 4)
    y += rowH
  })

  y += 10

  // Events list (up to 50)
  const SHOT_LBL = t('results.pdf.shotLabels', { returnObjects: true })
  const evts = timeline.filter(e => e.category === 'tirs').slice(0, 50)
  if (evts.length > 0) {
    const evc2 = t('history.pdf.eventCols', { returnObjects: true })
    const evCols = [{ w: 22 }, { w: 45 }, { w: 65 }, { w: 40 }]
    const evLabels = [evc2.time, evc2.team, evc2.action, evc2.score]
    const evScale  = maxW / evCols.reduce((s, c) => s + c.w, 0)
    const evc      = evCols.map(c => ({ w: c.w * evScale }))
    function exOf(idx) { let x = left; for (let i = 0; i < idx; i++) x += evc[i].w; return x }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(70, 80, 100)
    doc.text(t('history.pdf.shotEventsTitle'), left, y); y += 6

    doc.setFillColor(235, 240, 250); doc.rect(left, y - 4, maxW, 7, 'F')
    doc.setFontSize(6.5)
    evLabels.forEach((l, i) => doc.text(l, exOf(i) + 2, y + 0.5))
    y += 7

    evts.forEach((ev, idx) => {
      if (y > pageH - 14) return
      doc.setFillColor(...(idx % 2 === 0 ? [255, 255, 255] : [248, 250, 254]))
      doc.rect(left, y - 4, maxW, 6.5, 'F')
      const vals = [fmtClock(ev.elapsedSec), ev.teamName || '', `${SHOT_LBL[ev.id] || ev.id} (${ev.d > 0 ? '+1' : '-1'})`, (ev.scores || []).join(' – ')]
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(50, 60, 80)
      vals.forEach((v, i) => doc.text(v, exOf(i) + 2, y + 0.5, { maxWidth: evc[i].w - 3 }))
      doc.setDrawColor(235, 240, 250); doc.line(left, y + 2.5, left + maxW, y + 2.5)
      y += 6.5
    })
  }

  const t1 = fileSafeName(teams[0]?.name) || 'equipe1'
  const t2 = fileSafeName(teams[1]?.name) || 'equipe2'
  doc.save(`match_${t1}vs${t2}_${String(playedAt).slice(0, 10)}.pdf`)
}

// ── PDF : match joueurs ───────────────────────────────────────────────────────
function generatePlayerMatchPdf(match) {
  const t = i18n.t
  const { players = [], teams = [], settings, numTeams: nt = 2, playedAt, durationSec } = match
  const n       = nt
  const score0  = playerTeamScore(players, 0, n)
  const score1  = n === 2 ? playerTeamScore(players, 1, n) : null

  const doc   = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const left  = 14
  const maxW  = pageW - left * 2
  const c1    = hexToRgb(settings?.teamColors?.[0] || '#0e9f8f')
  const c2    = hexToRgb(settings?.teamColors?.[1] || '#d14343')
  let y       = 0

  function ensurePage(need = 0) { if (y + need > pageH - 14) { doc.addPage(); y = 14 } }

  doc.setFillColor(20, 30, 48); doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(15)
  doc.text(t('history.pdf.playerSheetTitle'), left, 12)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text(t('history.pdf.exportMatchLabel', { exportDate: fmtDateTime(new Date().toISOString()), playedDate: fmtDateTime(playedAt) }), left, 19)
  const hdrScore = n === 2
    ? t('playerResults.scoreLineTwo', { team1: teams[0]?.name || '', score1: score0, score2: score1, team2: teams[1]?.name || '' })
    : t('playerResults.scoreLineOne', { team: teams[0]?.name || '', score: score0 })
  doc.text(hdrScore, left, 25)
  doc.setTextColor(15, 23, 42); y = 34

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90, 100, 120)
  doc.text(t('history.pdf.durationFormat', { time: fmtClock(durationSec), halfCount: settings?.halfCount, halfDuration: settings?.halfDurationMin }), left, y)
  doc.setTextColor(15, 23, 42); y += 8

  const cc = t('playerResults.columns', { returnObjects: true })
  const cols = [
    { label: cc.player,      w: 30, key: null },
    { label: cc.pts,         w: 9,  key: 'pointsMarques' },
    { label: cc.totalShots,  w: 12, key: '__tirsTotal' },
    { label: cc.missedShots, w: 11, key: 'tirsNonTransformes' },
    { label: cc.pointsGiven, w: 11, key: 'pointsDonnes' },
    { label: cc.shotFouls,   w: 9,  key: 'fautesTir' },
    { label: cc.soloDef,     w: 12, key: 'defenseSolo' },
    { label: cc.defAssist,   w: 11, key: 'participationDef' },
    { label: cc.failedDef,   w: 11, key: 'defenseRatee' },
    { label: cc.missedPass,  w: 9,  key: 'passesRatees' },
    { label: cc.techFoul,    w: 10, key: 'fautesTech' },
    { label: cc.sanctions,   w: 10, key: 'sanctions' },
    { label: cc.offEff,      w: 13, key: '__effOff' },
    { label: cc.pctGiven,    w: 10, key: '__pctDon' },
  ]
  const scale = maxW / cols.reduce((s, c) => s + c.w, 0)
  const sc    = cols.map(c => ({ ...c, w: c.w * scale }))
  const rowH  = 7
  function xOf(idx) { let x = left; for (let i = 0; i < idx; i++) x += sc[i].w; return x }

  function cellVal(player, key) {
    if (key === null)            return player.name
    if (key === '__tirsTotal')   return String(playerTirsTotal(player))
    if (key === '__effOff')      return pct(player.pointsMarques, playerTirsTotal(player))
    if (key === '__pctDon')      return pct(player.pointsDonnes,  playerTirsTotal(player))
    return String(player[key] ?? 0)
  }

  function drawHeader(y0) {
    doc.setFillColor(235, 240, 250); doc.rect(left, y0 - 4, maxW, rowH, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(70, 80, 100)
    sc.forEach((col, i) => doc.text(col.label, i === 0 ? xOf(i) + 2 : xOf(i) + col.w / 2, y0 + 1, { align: i === 0 ? 'left' : 'center', maxWidth: col.w - 2 }))
    doc.setTextColor(15, 23, 42); return y0 + rowH
  }

  function drawPlayerRow(player, idx, y0) {
    doc.setFillColor(...(idx % 2 === 0 ? [255, 255, 255] : [248, 250, 254])); doc.rect(left, y0 - 4, maxW, rowH, 'F')
    sc.forEach((col, i) => {
      const val = cellVal(player, col.key); const isBold = col.key === 'pointsMarques' || col.key === null
      doc.setFont('helvetica', isBold ? 'bold' : 'normal'); doc.setFontSize(isBold ? 8 : 7.5)
      doc.setTextColor(isBold ? 15 : 50, isBold ? 23 : 60, isBold ? 42 : 80)
      doc.text(val, i === 0 ? xOf(i) + 2 : xOf(i) + col.w / 2, y0 + 1, { align: i === 0 ? 'left' : 'center', maxWidth: col.w - 2 })
    })
    doc.setDrawColor(230, 235, 245); doc.line(left, y0 + rowH - 4, left + maxW, y0 + rowH - 4)
    return y0 + rowH
  }

  const teamGroups = n === 2
    ? [{ grp: players.filter(p => p.teamIdx === 0), name: teams[0]?.name || t('playerResults.defaultTeam1'), c: c1 },
       { grp: players.filter(p => p.teamIdx === 1), name: teams[1]?.name || t('playerResults.defaultTeam2'), c: c2 }]
    : [{ grp: players.filter(p => p.teamIdx === 0), name: teams[0]?.name || t('playerResults.defaultTeam1'), c: c1 }]

  teamGroups.forEach(({ grp, name, c }) => {
    ensurePage(22 + (grp.length + 2) * rowH)
    doc.setFillColor(c.r, c.g, c.b); doc.rect(left, y, 4, 12, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(15, 23, 42)
    doc.text(name, left + 8, y + 8)
    const totTirs = grp.reduce((a, p) => a + playerTirsTotal(p), 0)
    const totPM   = grp.reduce((a, p) => a + p.pointsMarques, 0)
    const totPD   = grp.reduce((a, p) => a + p.pointsDonnes, 0)
    const totDef  = grp.reduce((a, p) => a + p.defenseSolo + p.participationDef, 0)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(90, 100, 120)
    doc.text(t('history.pdf.teamSummaryLine', { totalShots: totTirs, scored: totPM, given: totPD, def: totDef, eff: pct(totPM, totTirs) }), left + 8, y + 14)
    doc.setTextColor(15, 23, 42); y += 18
    if (grp.length === 0) { doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.text(t('history.pdf.noPlayersShort'), left + 4, y); y += 8; return }
    y = drawHeader(y)
    grp.forEach((player, i) => { y = drawPlayerRow(player, i, y) })
    y += 8
  })

  const t1 = fileSafeName(teams[0]?.name) || 'equipe1'
  const t2 = n === 2 ? (fileSafeName(teams[1]?.name) || 'equipe2') : 'solo'
  doc.save(`${t1}vs${t2}_joueurs_${String(playedAt).slice(0, 10)}.pdf`)
}

function downloadMatchPdf(match) {
  if (match.mode === 'player') generatePlayerMatchPdf(match)
  else generateStatsPdf(match)
}

// ── MiniTimeline ──────────────────────────────────────────────────────────────
function MiniTimeline({ timeline, settings, teams }) {
  const { series, maxT, maxV } = buildPointsSeries(teams || [], timeline || [])
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
            <text x={tx} y={h - 8} textAnchor="middle" className="tg-label">{fmtClock(Math.round(maxT * tick))}</text>
          </g>
        )
      })}
      {series.map((pts, i) => {
        const color = settings?.teamColors?.[i] || (i === 0 ? '#0e9f8f' : '#d14343')
        const needsHalo = colorLum(color) < 0.22
        const d = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${x(p.t)} ${y(p.v)}`).join(' ')
        return (
          <g key={i}>
            {needsHalo && <path d={d} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="5.5" />}
            <path d={d} fill="none" stroke={color} strokeWidth="2.5" />
          </g>
        )
      })}
    </svg>
  )
}

// ── Détail match stats / scoreur ──────────────────────────────────────────────
function MatchDetail({ match, onClose }) {
  const { t } = useTranslation()
  const { teams, timeline, settings } = match
  const shotEvents = (timeline || []).filter(e => e.category === 'tirs')
  const isScorerOnly = match.mode === 'scorer'

  return (
    <div className="hist-detail">
      <div className="hist-detail-header">
        <button className="btn-ghost hist-back" onClick={onClose}>{t('common.back')}</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="hist-detail-date">{fmtDateTime(match.playedAt)}</div>
          <button className="btn-mini" onClick={() => downloadMatchPdf(match)}>{t('history.pdfBtn')}</button>
        </div>
      </div>

      <div className="mr-detail-names">
        {teams.map((tm, i) => (
          <span className="mr-name" key={i} style={{ fontSize: 15 }}>
            {settings?.teamColors?.[i] && <span className="team-dot" style={teamSwatchStyle(settings.teamColors[i])} />}
            {tm.name}
          </span>
        ))}
      </div>
      <div className="rf" style={{ marginBottom: 8 }}>
        {teams.map((tm, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: 'var(--s3)', fontWeight: 200 }}> – </span>}
            <span style={settings?.teamColors?.[i] ? teamTextStyle(settings.teamColors[i]) : { color: 'var(--txt)' }}>{tm.score}</span>
          </span>
        ))}
      </div>

      <div className="card" style={{ marginBottom: isScorerOnly ? 0 : 12 }}>
        <div className="ctitle">{t('history.summaryTitle')}</div>
        <div className="si"><div className="si-l">{t('results.ui.format')}</div><span className="si-v" style={{ fontSize: 14 }}>{match.settings?.halfCount}×{match.settings?.halfDurationMin} min</span></div>
        <div className="si"><div className="si-l">{t('history.actualDuration')}</div><span className="si-v" style={{ fontSize: 14 }}>{fmtClock(match.durationSec)}</span></div>
        {!isScorerOnly && (
          <div className="si"><div className="si-l">{t('history.shotEventsLabel')}</div><span className="si-v" style={{ fontSize: 14 }}>{match.shotEvents}</span></div>
        )}
      </div>

      {!isScorerOnly && teams.map((tm, i) => (
        <div className="card" key={i} style={{ marginBottom: 12, borderTop: `3px solid ${settings?.teamColors?.[i] || 'var(--acc)'}` }}>
          <div className="ctitle">
            {settings?.teamColors?.[i] && <span className="team-dot" style={teamSwatchStyle(settings.teamColors[i])} />}
            {tm.name}
          </div>
          <div className="si"><div className="si-l">{t('history.score')}</div><span className="si-v">{tm.score}</span></div>
          <div className="si"><div className="si-l">{t('results.ui.shotsTitle')}</div><span className="si-v" style={{ fontSize: 16 }}>{tm.tirs}</span></div>
          <div className="si"><div className="si-l">{t('results.ui.won')}</div><span className="si-v" style={{ fontSize: 16 }}>{tm.tGagne}</span></div>
          <div className="si"><div className="si-l">{t('results.ui.given')}</div><span className="si-v" style={{ fontSize: 16 }}>{tm.tDonne}</span></div>
          <div className="si"><div className="si-l">{t('results.ui.caught')}</div><span className="si-v" style={{ fontSize: 16 }}>{tm.tCatche}</span></div>
          <div className="si"><div className="si-l">{t('history.shotFoulsShort')}</div><span className="si-v" style={{ fontSize: 16 }}>{tm.tFaute}</span></div>
          <div className="si"><div className="si-l">{t('results.ui.totalFouls')}</div><span className="si-v" style={{ fontSize: 16 }}>{tm.fautes}</span></div>
          <div className="si"><div className="si-l">{t('results.ui.possessions')}</div><span className="si-v" style={{ fontSize: 16 }}>{tm.pos}</span></div>
          {tm.tirs > 0 && (
            <div className="si">
              <div className="si-l">{t('results.ui.offEff')}</div>
              <span className="si-v" style={{ fontSize: 16 }}>{Math.round((tm.tGagne / tm.tirs) * 100)}<span className="unit">%</span></span>
            </div>
          )}
        </div>
      ))}

      {!isScorerOnly && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="ctitle">{t('history.timelineTitle')}</div>
          <MiniTimeline timeline={timeline} settings={settings} teams={(match.teamsSnapshot || []).map((tm, i) => ({ ...tm, name: teams[i]?.name || tm.name }))} />
          <div className="tg-legend" style={{ marginTop: 8 }}>
            {teams.map((tm, i) => (
              <div className="tg-leg-item" key={i}>
                <span className="tg-leg-dot" style={settings?.teamColors?.[i] ? teamSwatchStyle(settings.teamColors[i]) : { background: 'var(--dim)' }} />
                <span>{tm.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isScorerOnly && shotEvents.length > 0 && (
        <div className="card">
          <div className="ctitle">{t('history.eventsTitle', { count: shotEvents.length })}</div>
          <div className="tl-list">
            {shotEvents.map((ev, i) => {
              const color = settings?.teamColors?.[ev.teamIdx]
              return (
                <div className="tl-item" key={`${ev.at}-${i}`}>
                  <div className="tl-time">{fmtClock(ev.elapsedSec)}</div>
                  <div className="tl-main">
                    <div className="tl-label">
                      {color && <span className="team-dot" style={teamSwatchStyle(color)} />}
                      <span style={{ fontWeight: 700, marginRight: 4 }}>{ev.teamName}</span>
                      {t(`shotLabels.${ev.id}`, ev.id)}
                      <span className={`tl-delta ${ev.d > 0 ? 'pos' : 'neg'}`}>{ev.d > 0 ? '+1' : '-1'}</span>
                    </div>
                    {Array.isArray(ev.scores) && <div className="tl-score">{ev.scores.join(' – ')}</div>}
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

// ── Détail match joueurs ──────────────────────────────────────────────────────
function PlayerMatchDetail({ match, onClose }) {
  const { t } = useTranslation()
  const { players = [], teams = [], settings, numTeams: nt = 2, playedAt, durationSec } = match
  const n      = nt
  const score0 = playerTeamScore(players, 0, n)
  const score1 = n === 2 ? playerTeamScore(players, 1, n) : null

  const teamGroups = [
    { name: teams[0]?.name || t('playerResults.defaultTeam1'), color: settings?.teamColors?.[0], grp: players.filter(p => p.teamIdx === 0) },
    ...(n === 2 ? [{ name: teams[1]?.name || t('playerResults.defaultTeam2'), color: settings?.teamColors?.[1], grp: players.filter(p => p.teamIdx === 1) }] : []),
  ]

  return (
    <div className="hist-detail">
      <div className="hist-detail-header">
        <button className="btn-ghost hist-back" onClick={onClose}>{t('common.back')}</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="hist-detail-date">{fmtDateTime(playedAt)}</div>
          <button className="btn-mini" onClick={() => downloadMatchPdf(match)}>{t('history.pdfBtn')}</button>
        </div>
      </div>

      <div className="mr-detail-names">
        <span className="mr-name" style={{ fontSize: 15 }}>
          {settings?.teamColors?.[0] && <span className="team-dot" style={teamSwatchStyle(settings.teamColors[0])} />}
          {teams[0]?.name}
        </span>
        {n === 2 && (
          <span className="mr-name" style={{ fontSize: 15 }}>
            {settings?.teamColors?.[1] && <span className="team-dot" style={teamSwatchStyle(settings.teamColors[1])} />}
            {teams[1]?.name}
          </span>
        )}
      </div>
      <div className="rf" style={{ marginBottom: 8 }}>
        {n === 2 ? (
          <>
            <span style={settings?.teamColors?.[0] ? teamTextStyle(settings.teamColors[0]) : { color: 'var(--txt)' }}>{score0}</span>
            <span style={{ color: 'var(--s3)', fontWeight: 200 }}> – </span>
            <span style={settings?.teamColors?.[1] ? teamTextStyle(settings.teamColors[1]) : { color: 'var(--txt)' }}>{score1}</span>
          </>
        ) : (
          <span style={settings?.teamColors?.[0] ? teamTextStyle(settings.teamColors[0]) : { color: 'var(--txt)' }}>{score0} pts</span>
        )}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="ctitle">{t('history.summaryTitle')}</div>
        <div className="si"><div className="si-l">{t('results.ui.format')}</div><span className="si-v" style={{ fontSize: 14 }}>{settings?.halfCount}×{settings?.halfDurationMin} min</span></div>
        <div className="si"><div className="si-l">{t('history.actualDuration')}</div><span className="si-v" style={{ fontSize: 14 }}>{fmtClock(durationSec)}</span></div>
        <div className="si"><div className="si-l">{t('history.playersLabel')}</div><span className="si-v" style={{ fontSize: 14 }}>{players.length}</span></div>
      </div>

      {teamGroups.map(({ name, color, grp }) => (
        <div className="card" key={name} style={{ marginBottom: 12, borderTop: `3px solid ${color || 'var(--acc)'}` }}>
          <div className="ctitle">
            {color && <span className="team-dot" style={teamSwatchStyle(color)} />}
            {name}
          </div>
          {grp.length === 0
            ? <div style={{ color: 'var(--dim)', fontSize: 13 }}>{t('history.noPlayersShort')}</div>
            : (
              <div className="hist-player-table">
                <div className="hist-player-hd">
                  <span>{t('history.playerTableCols.player')}</span>
                  <span>{t('history.playerTableCols.pts')}</span>
                  <span>{t('history.playerTableCols.shots')}</span>
                  <span>{t('history.playerTableCols.eff')}</span>
                  <span>{t('history.playerTableCols.def')}</span>
                  <span>{t('history.playerTableCols.fouls')}</span>
                </div>
                {grp.map(p => {
                  const d = playerDerivedStats(p)
                  return (
                    <div className="hist-player-row" key={p.id}>
                      <span className="hist-player-name">{p.name}</span>
                      <span><strong>{p.pointsMarques}</strong></span>
                      <span>{d.tirsTotal}</span>
                      <span>{d.tirsTotal > 0 ? `${Math.round(p.pointsMarques / d.tirsTotal * 100)}%` : '—'}</span>
                      <span>{d.defTotal}</span>
                      <span>{d.fautesTotal}</span>
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>
      ))}
    </div>
  )
}

// ── Liste historique ──────────────────────────────────────────────────────────
export default function History({ history, onBack, onClear, initialMatch }) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(initialMatch || null)

  if (selected) {
    return selected.mode === 'player'
      ? <PlayerMatchDetail match={selected} onClose={() => setSelected(null)} />
      : <MatchDetail match={selected} onClose={() => setSelected(null)} />
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h1>{t('history.title')}</h1>
        <button className="btn-ghost" style={{ padding: '8px 14px', fontSize: 14 }} onClick={onBack}>{t('common.back')}</button>
      </div>

      {history.length === 0 ? (
        <div className="card" style={{ color: 'var(--dim)', fontSize: 14, textAlign: 'center', padding: 32 }}>
          {t('history.noMatches')}
        </div>
      ) : (
        <>
          <div className="mr-list">
            {history.map(m => {
              const clickable = m.mode !== 'scorer'
              const CardTag = clickable ? 'button' : 'div'
              return (
                <CardTag className="mr-card" key={m.id} {...(clickable ? { onClick: () => setSelected(m) } : {})}>
                  <div className="mr-head">
                    <span>{fmtDateTime(m.playedAt)}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span>{m.settings?.halfCount}×{m.settings?.halfDurationMin}min</span>
                      <span
                        className="hist-pdf-btn"
                        role="button"
                        onClick={e => { e.stopPropagation(); downloadMatchPdf(m) }}
                      >
                        {t('history.pdfBtn')}
                      </span>
                    </div>
                  </div>
                  <div className="mr-names">
                    {(m.teams || []).map((tm, i) => (
                      <div className="mr-name" key={i}>
                        {m.settings?.teamColors?.[i] && <span className="team-dot" style={teamSwatchStyle(m.settings.teamColors[i])} />}
                        {tm.name}
                      </div>
                    ))}
                  </div>
                  <div className="mr-score">
                    {(m.teams || []).map((tm, i) => (
                      <span key={i} style={m.settings?.teamColors?.[i] ? teamTextStyle(m.settings.teamColors[i]) : { color: 'var(--txt)' }}>
                        {i > 0 && <span className="mr-score-sep">–</span>}
                        {tm.score}
                      </span>
                    ))}
                  </div>
                  {m.mode !== 'scorer' && (
                    <div className="mr-foot">
                      {m.mode === 'player'
                        ? t('history.footerPlayer', { count: m.players?.length || 0 })
                        : `${(m.teams || []).map(tm => t('history.footerStatsShots', { count: tm.tirs ?? 0 })).join(' · ')} · ${t('history.footerStatsEvents', { count: m.shotEvents ?? 0 })}`
                      }
                    </div>
                  )}
                </CardTag>
              )
            })}
          </div>

          <button
            className="btn-ghost"
            style={{ alignSelf: 'center', marginTop: 8, color: 'var(--err)' }}
            onClick={() => { if (window.confirm(t('history.clearConfirm'))) onClear() }}
          >
            {t('history.clearButton')}
          </button>
        </>
      )}
    </>
  )
}
