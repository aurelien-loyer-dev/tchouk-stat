import { jsPDF } from 'jspdf'
import i18n from '../../i18n'
import { playerTirsTotal, playerTeamScore } from '../../lib/playerStats'
import { fmtClock, fmtDateTime, hexToRgb, fileSafeName, pct } from '../../lib/format'
import { drawPdfHeader, resetPdfTextColor, scaleCols, xOfFactory } from '../../lib/pdf'

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

  drawPdfHeader(doc, { title: t('results.pdf.sheetTitle') })
  doc.text(t('history.pdf.exportMatchLabel', { exportDate: fmtDateTime(new Date().toISOString()), playedDate: fmtDateTime(playedAt) }), left, 19)
  const hdrScore = teams.map(tm => `${tm.name} ${tm.score}`).join('  —  ')
  doc.text(hdrScore, left, 25)
  resetPdfTextColor(doc)
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
  const sc   = scaleCols(cols, maxW)
  const rowH = 8
  const xOf  = xOfFactory(sc, left)

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
    const evc = scaleCols(evCols, maxW)
    const exOf = xOfFactory(evc, left)

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

  drawPdfHeader(doc, { title: t('history.pdf.playerSheetTitle') })
  doc.text(t('history.pdf.exportMatchLabel', { exportDate: fmtDateTime(new Date().toISOString()), playedDate: fmtDateTime(playedAt) }), left, 19)
  const hdrScore = n === 2
    ? t('playerResults.scoreLineTwo', { team1: teams[0]?.name || '', score1: score0, score2: score1, team2: teams[1]?.name || '' })
    : t('playerResults.scoreLineOne', { team: teams[0]?.name || '', score: score0 })
  doc.text(hdrScore, left, 25)
  resetPdfTextColor(doc); y = 34

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
  const sc   = scaleCols(cols, maxW)
  const rowH = 7
  const xOf  = xOfFactory(sc, left)

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

export function downloadMatchPdf(match) {
  if (match.mode === 'player') generatePlayerMatchPdf(match)
  else generateStatsPdf(match)
}
