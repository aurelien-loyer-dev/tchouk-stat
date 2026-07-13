import { jsPDF } from 'jspdf'
import i18n from '../../i18n'
import { getTournamentEndState } from '../../lib/tournament'
import { fmtDateTime, fileSafeName } from '../../lib/format'
import { drawPdfHeader, resetPdfTextColor, scaleCols, xOfFactory } from '../../lib/pdf'

export function downloadTournamentPdf(tournament) {
  const t = i18n.t
  const { finalRanking, winner, allMatches } = getTournamentEndState(tournament)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const left = 14
  const maxW = pageW - left * 2
  let y = 0

  function ensurePage(need = 0) {
    if (y + need > pageH - 14) {
      doc.addPage()
      y = 14
    }
  }

  function section(title, gap = 6) {
    ensurePage(12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(70, 80, 100)
    doc.text(title, left, y)
    y += gap
  }

  drawPdfHeader(doc, { title: t('tournament.pdf.title') })
  doc.text(t('tournament.pdf.exportLabel', { date: fmtDateTime(new Date().toISOString()), name: tournament.name }), left, 19)
  doc.text(t('tournament.pdf.teamsFormat', { count: tournament.teams.length, format: t(`tournament.formatLabel.${tournament.format === 'groups' ? 'groups' : tournament.format === 'swiss' ? 'swiss' : 'roundrobin'}`) }), left, 25)
  resetPdfTextColor(doc)
  y = 34

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(tournament.name, left, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90, 100, 120)
  doc.text(t('tournament.pdf.winnerLine', { winner: winner || t('tournament.pdf.noWinner'), played: allMatches.filter(m => m.score1 !== null && m.score2 !== null).length, total: allMatches.length }), left, y)
  doc.setTextColor(15, 23, 42)
  y += 10

  section(finalRanking.length > 0 && (tournament.knockoutRounds || tournament.placementRounds)
    ? t('tournament.pdf.finalRanking')
    : t('tournament.pdf.currentRanking'))

  const cols = [
    { label: '#', w: 12 },
    { label: t('tournament.standings.team'), w: 72 },
    { label: t('tournament.standings.pts'), w: 16 },
    { label: t('tournament.standings.diff'), w: 18 },
    { label: t('tournament.standings.gf'), w: 16 },
  ]
  const sc = scaleCols(cols, maxW)
  const rowH = 7
  const xOf = xOfFactory(sc, left)

  ensurePage(12 + (finalRanking.length + 1) * rowH)
  doc.setFillColor(235, 240, 250)
  doc.rect(left, y - 4, maxW, rowH, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(70, 80, 100)
  sc.forEach((col, i) => doc.text(col.label, i === 1 ? xOf(i) + 2 : xOf(i) + col.w / 2, y + 1, { align: i === 1 ? 'left' : 'center' }))
  y += rowH

  finalRanking.forEach((row, index) => {
    ensurePage(rowH)
    doc.setFillColor(...(index % 2 === 0 ? [255, 255, 255] : [248, 250, 254]))
    doc.rect(left, y - 4, maxW, rowH, 'F')
    doc.setFont('helvetica', index < 3 ? 'bold' : 'normal')
    doc.setFontSize(index < 3 ? 8.5 : 8)
    doc.setTextColor(15, 23, 42)
    const values = [String(index + 1), row.team, String(row.pts ?? 0), row.gd > 0 ? `+${row.gd}` : String(row.gd ?? 0), String(row.gf ?? 0)]
    values.forEach((value, i) => {
      const align = i === 1 ? 'left' : 'center'
      const x = i === 1 ? xOf(i) + 2 : xOf(i) + sc[i].w / 2
      doc.text(value, x, y + 1, { align, maxWidth: sc[i].w - 3 })
    })
    doc.setDrawColor(230, 235, 245)
    doc.line(left, y + rowH - 4, left + maxW, y + rowH - 4)
    y += rowH
  })

  if (tournament.knockoutRounds?.length) {
    y += 6
    section(t('tournament.pdf.knockoutStage'))
    tournament.knockoutRounds.forEach(round => {
      ensurePage(10)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(15, 23, 42)
      doc.text(round.name, left, y)
      y += 5
      round.matches.forEach(match => {
        ensurePage(8)
        const played = match.score1 !== null && match.score2 !== null
        const label = match.team1 === 'TBD' || match.team2 === 'TBD'
          ? `${match.team1}  –  ${match.team2}`
          : `${match.team1} ${played ? `${match.score1} - ${match.score2}` : '–'} ${match.team2}`
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(50, 60, 80)
        doc.text(label, left + 2, y)
        y += 5.5
      })
      y += 2
    })
  }

  if (tournament.placementRounds?.length) {
    y += 6
    section(t('tournament.pdf.placementMatches'))
    tournament.placementRounds.forEach(({ label, match }) => {
      ensurePage(8)
      const played = match.score1 !== null && match.score2 !== null
      const matchLabel = `${label} : ${match.team1} ${played ? `${match.score1} - ${match.score2}` : '–'} ${match.team2}`
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(50, 60, 80)
      doc.text(matchLabel, left + 2, y)
      y += 5.5
    })
  }

  const safeName = fileSafeName(tournament.name) || 'tournoi'
  doc.save(`${safeName}_${String(tournament.createdAt || new Date().toISOString()).slice(0, 10)}.pdf`)
}
