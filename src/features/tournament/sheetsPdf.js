// Feuilles de match à imprimer : une par match du tournoi encore à jouer,
// deux par page A4 (format A5 paysage une fois coupée). Pré-remplies avec le
// tournoi, la phase, le terrain, l'heure estimée et l'arbitre, avec la grille
// de points, le score par mi-temps et les signatures.
import { jsPDF } from 'jspdf'
import i18n from '../../i18n'
import { fileSafeName } from '../../lib/format'
import { estimateSchedule, fmtHour, listFixtures, planCourts } from './overview'
import { assignReferees } from './referees'

const INK = [20, 23, 27]
const DIM = [100, 108, 118]
const LINE = [190, 196, 204]
const TINT = [243, 244, 246]

// Matchs à jouer dans l'ordre du planning, avec leur terrain et leur heure.
export function sheetFixtures(tour) {
  const fixtures = listFixtures(tour)
  const plan = planCourts(tour, fixtures)
  const est = estimateSchedule(tour, plan, Date.now())
  const refs = assignReferees(tour, plan).byMatch
  const out = []
  plan.onCourt.forEach((f, i) => f && out.push({ fixture: f, court: plan.count > 1 ? i + 1 : null, time: null, referee: refs[f.match.id] }))
  plan.slots.forEach((sl, si) => sl.forEach(({ fixture, court }) => out.push({ fixture, court: plan.count > 1 ? court : null, time: est?.slotStarts?.[si] ?? null, referee: refs[fixture.match.id] })))
  plan.waiting.forEach(f => out.push({ fixture: f, court: null, time: null, referee: null }))
  return out
}

function drawSheet(doc, { tour, item, top, height, halves, index, total }) {
  const t = i18n.t
  const W = doc.internal.pageSize.getWidth()
  const L = 12, R = W - 12, w = R - L
  const m = item.fixture.match
  const name = team => (team === 'TBD' ? '' : team)
  let y = top + 10

  // En-tête : tournoi, phase, n° de feuille
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
  doc.text(tour.name, L, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...DIM)
  doc.text(t('tournament.sheets.sheetN', { n: index + 1, total }), R, y, { align: 'right' })
  y += 6
  const meta = [
    item.fixture.label,
    item.court ? t('tournament.courts.court', { n: item.court }) : null,
    item.time ? t('tournament.sheets.around', { time: fmtHour(item.time) }) : null,
  ].filter(Boolean).join('  ·  ')
  if (meta) { doc.setFontSize(10); doc.text(meta, L, y); y += 5 }

  // Équipes
  y += 3
  const colW = (w - 10) / 2
  ;[m.team1, m.team2].forEach((team, i) => {
    const x = L + i * (colW + 10)
    doc.setFontSize(8); doc.setTextColor(...DIM)
    doc.text(i === 0 ? t('tournament.sheets.teamA') : t('tournament.sheets.teamB'), x, y)
    doc.setDrawColor(...LINE); doc.line(x, y + 9, x + colW, y + 9)
    if (name(team)) { doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...INK); doc.text(name(team), x, y + 7, { maxWidth: colW }) }
    doc.setFont('helvetica', 'normal')
  })
  y += 15

  // Grille de points : on barre une case par point marqué
  doc.setFontSize(8); doc.setTextColor(...DIM)
  doc.text(t('tournament.sheets.tally'), L, y)
  y += 2.5
  const cells = 60, cw = colW / 15, ch = 5
  ;[0, 1].forEach(i => {
    const x0 = L + i * (colW + 10)
    for (let k = 0; k < cells; k++) {
      const cx = x0 + (k % 15) * cw, cy = y + Math.floor(k / 15) * ch
      doc.setDrawColor(...LINE); doc.rect(cx, cy, cw, ch)
      doc.setFontSize(6); doc.setTextColor(...LINE); doc.text(String(k + 1), cx + cw / 2, cy + ch - 1.6, { align: 'center' })
    }
  })
  y += ch * 4 + 6

  // Score par mi-temps + total
  doc.setFontSize(8); doc.setTextColor(...DIM)
  doc.text(t('tournament.sheets.byHalf'), L, y)
  y += 2.5
  const cols = halves + 1
  const sw = Math.min(26, (w - 40) / cols)
  const labelW = 40
  const head = Array.from({ length: halves }, (_, h) => t('scorer.halfRowLabel', { n: h + 1 })).concat(t('scorer.total'))
  doc.setFillColor(...TINT); doc.rect(L, y, labelW + sw * cols, 6, 'F')
  doc.setFontSize(8); doc.setTextColor(...INK)
  head.forEach((h, k) => doc.text(h, L + labelW + sw * k + sw / 2, y + 4.2, { align: 'center' }))
  ;[m.team1, m.team2].forEach((team, i) => {
    const ry = y + 6 + i * 9
    doc.setDrawColor(...LINE)
    doc.rect(L, ry, labelW, 9)
    doc.setTextColor(...INK); doc.setFontSize(9)
    doc.text(name(team) || (i === 0 ? t('tournament.sheets.teamA') : t('tournament.sheets.teamB')), L + 2, ry + 5.8, { maxWidth: labelW - 4 })
    for (let k = 0; k < cols; k++) {
      doc.setLineWidth(k === cols - 1 ? 0.5 : 0.2)
      doc.rect(L + labelW + sw * k, ry, sw, 9)
    }
    doc.setLineWidth(0.2)
  })
  const sideX = L + labelW + sw * cols + 8
  doc.setFontSize(8); doc.setTextColor(...DIM)
  doc.text(t('tournament.sheets.winner'), sideX, y + 9)
  doc.setDrawColor(...LINE); doc.line(sideX, y + 17, R, y + 17)
  if (item.referee) { doc.text(t('tournament.sheets.referee'), sideX, y + 22); doc.setTextColor(...INK); doc.setFontSize(10); doc.text(item.referee, sideX, y + 27) }
  else { doc.text(t('tournament.sheets.referee'), sideX, y + 22); doc.line(sideX, y + 28, R, y + 28) }
  y += 6 + 18 + 5

  // Remarques (fautes, sanctions) et signatures
  doc.setFontSize(8); doc.setTextColor(...DIM)
  doc.text(t('tournament.sheets.notes'), L, y)
  doc.setDrawColor(...LINE); doc.line(L, y + 6, R, y + 6)
  y += 11
  const sigW = (w - 12) / 3
  ;[t('tournament.sheets.captainA'), t('tournament.sheets.captainB'), t('tournament.sheets.refereeSign')].forEach((lbl, k) => {
    const x = L + k * (sigW + 6)
    doc.text(lbl, x, y)
    doc.rect(x, y + 2, sigW, 12)
  })

  // Pied : où saisir le résultat
  doc.setFontSize(7); doc.setTextColor(...DIM)
  doc.text(t('tournament.sheets.footer'), L, top + height - 5)
}

export function downloadMatchSheets(tour) {
  const items = sheetFixtures(tour)
  if (!items.length) return false
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const H = doc.internal.pageSize.getHeight()
  const W = doc.internal.pageSize.getWidth()
  const half = H / 2
  const halves = Math.max(1, Math.min(4, Number(tour.schedule?.halves) || 2))
  items.forEach((item, i) => {
    if (i > 0 && i % 2 === 0) doc.addPage()
    const top = i % 2 === 0 ? 0 : half
    drawSheet(doc, { tour, item, top, height: half, halves, index: i, total: items.length })
    if (i % 2 === 0) {
      // Trait de coupe entre les deux feuilles
      doc.setDrawColor(...LINE); doc.setLineDashPattern([1.5, 1.5], 0); doc.line(6, half, W - 6, half); doc.setLineDashPattern([], 0)
    }
  })
  doc.save(`${fileSafeName(tour.name) || 'tournoi'}_${i18n.t('tournament.sheets.file')}.pdf`)
  return true
}
