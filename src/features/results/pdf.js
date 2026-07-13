import { jsPDF } from 'jspdf'
import { buildPointsSeries } from '../../lib/shotSeries'
import { fmtClock, fmtDateTime, hexToRgb, fileSafeName } from '../../lib/format'
import { drawPdfHeader, resetPdfTextColor } from '../../lib/pdf'

export function downloadResultsPdf({ teams, timeline, settings, summary, t }) {
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

  drawPdfHeader(doc, { title: pdf.sheetTitle, titleSize: 16 })
  doc.text(t('results.pdf.exportLabel', { date: fmtDateTime(new Date().toISOString()) }), left, 19)
  doc.text(summary.teams.map(team => `${team.name} ${team.score}`).join(' - '), left, 24)
  resetPdfTextColor(doc)
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
