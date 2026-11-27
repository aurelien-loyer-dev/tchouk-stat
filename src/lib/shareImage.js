// Images à partager (format story 1080 × 1920) : score final, fiche joueur,
// podium d'un tournoi ou classement d'un championnat. Dessinées sur un canvas
// avec la police de l'app, puis partagées (feuille de partage du téléphone)
// ou téléchargées en PNG.

export const W = 1080
export const H = 1920
const PAD = 88

const INK = '#14171b'
const TXT = '#ffffff'
const DIM = 'rgba(255,255,255,0.62)'
const FAINT = 'rgba(255,255,255,0.14)'
const FONT = '"Archivo Variable", "Archivo", system-ui, sans-serif'

let fontsReady = null
function ensureFonts() {
  if (!fontsReady) {
    fontsReady = typeof document !== 'undefined' && document.fonts
      ? Promise.all([500, 650, 800].map(w => document.fonts.load(`${w} 64px "Archivo Variable"`))).catch(() => {})
      : Promise.resolve()
  }
  return fontsReady
}

let logoImg = null
function loadLogo() {
  if (!logoImg) {
    logoImg = new Promise(resolve => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = '/icons/logo.svg'
    })
  }
  return logoImg
}

function setFont(ctx, weight, size, wide = true) {
  ctx.font = `${weight} ${size}px ${FONT}`
  if ('fontStretch' in ctx) ctx.fontStretch = wide ? 'expanded' : 'normal'
}

// Réduit la taille jusqu'à ce que le texte tienne, puis tronque si besoin.
function fitFont(ctx, text, maxW, weight, size, min, wide = true) {
  let s = size
  setFont(ctx, weight, s, wide)
  while (s > min && ctx.measureText(text).width > maxW) { s -= 4; setFont(ctx, weight, s, wide) }
  return s
}

function ellipsize(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text
  let s = text
  while (s.length > 1 && ctx.measureText(`${s}…`).width > maxW) s = s.slice(0, -1)
  return `${s.trimEnd()}…`
}

// Coupe en lignes (au plus maxLines, la dernière tronquée).
function wrap(ctx, text, maxW, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let cur = ''
  for (let i = 0; i < words.length; i++) {
    const next = cur ? `${cur} ${words[i]}` : words[i]
    if (ctx.measureText(next).width <= maxW || !cur) { cur = next; continue }
    lines.push(cur)
    cur = words[i]
    if (lines.length === maxLines - 1) { cur = words.slice(i).join(' '); break }
  }
  if (cur) lines.push(cur)
  return lines.slice(0, maxLines).map((l, i, a) => (i === a.length - 1 ? ellipsize(ctx, l, maxW) : l))
}

function text(ctx, str, x, y, { weight = 500, size = 36, color = TXT, align = 'left', wide = true } = {}) {
  setFont(ctx, weight, size, wide)
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(str, x, y)
}

function hairline(ctx, y, x0 = PAD, x1 = W - PAD) {
  ctx.fillStyle = FAINT
  ctx.fillRect(x0, y, x1 - x0, 2)
}

// Cadre de tchoukball en filigrane, en haut à droite : rappel du logo.
function drawFrame(ctx) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.translate(W - 520, 40)
  ctx.scale(12, 12)
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.moveTo(29, 13); ctx.lineTo(50, 13); ctx.lineTo(53, 41); ctx.lineTo(26, 41); ctx.closePath()
  ctx.moveTo(30, 41); ctx.lineTo(28, 50); ctx.moveTo(49, 41); ctx.lineTo(51, 50)
  ctx.stroke()
  ctx.lineWidth = 0.9
  ctx.beginPath()
  ctx.moveTo(36, 13); ctx.lineTo(35, 41); ctx.moveTo(43, 13); ctx.lineTo(44, 41)
  ctx.moveTo(27.9, 22.3); ctx.lineTo(51, 22.3); ctx.moveTo(27, 31.7); ctx.lineTo(52, 31.7)
  ctx.stroke()
  ctx.restore()
}

async function base({ kicker, date }) {
  await ensureFonts()
  const logo = await loadLogo()
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = INK
  ctx.fillRect(0, 0, W, H)
  drawFrame(ctx)

  if (logo) ctx.drawImage(logo, PAD, 104, 72, 72)
  text(ctx, 'Tchoukball Assistant', PAD + 96, 152, { weight: 650, size: 34 })
  if (kicker) text(ctx, kicker, PAD, 330, { weight: 650, size: 40, color: DIM })
  if (date) text(ctx, date, W - PAD, 330, { weight: 500, size: 34, color: DIM, align: 'right', wide: false })

  const host = typeof location !== 'undefined' ? location.host : ''
  hairline(ctx, H - 170)
  if (host) text(ctx, host, PAD, H - 100, { weight: 500, size: 32, color: DIM, wide: false })
  return { canvas, ctx }
}

function rows(ctx, list, y0, { size = 36, gap = 92 } = {}) {
  let y = y0
  for (const r of list) {
    hairline(ctx, y - size - 30)
    setFont(ctx, 650, size)
    const valW = Math.min(ctx.measureText(r.value).width, W - 2 * PAD - 260)
    text(ctx, r.label, PAD, y, { weight: 500, size, color: DIM, wide: false })
    setFont(ctx, 650, size)
    ctx.fillStyle = TXT
    ctx.textAlign = 'right'
    ctx.fillText(ellipsize(ctx, r.value, valW), W - PAD, y)
    y += gap
  }
  return y
}

// ── Score final ──────────────────────────────────────────────────────────────
// teams : [{ name, score, color }] ; result : « Victoire de … » ; lines : [{ label, value }]
export async function scoreImage({ kicker, date, teams, result, meta, lines = [] }) {
  const { canvas, ctx } = await base({ kicker, date })
  const two = teams.length === 2
  const winner = two && teams[0].score !== teams[1].score ? (teams[0].score > teams[1].score ? 0 : 1) : null
  const scoreSize = two ? 240 : 320
  let y = 440

  teams.forEach((tm, i) => {
    const lost = winner !== null && winner !== i
    ctx.globalAlpha = lost ? 0.5 : 1
    setFont(ctx, 650, 60)
    const nameLines = wrap(ctx, tm.name || '', W - 2 * PAD - 48, 2)
    nameLines.forEach((l, k) => text(ctx, l, PAD + 48, y + 60 + k * 70, { weight: 650, size: 60 }))
    const base = y + 60 + (nameLines.length - 1) * 70 + 52 + Math.round(scoreSize * 0.74)
    text(ctx, String(tm.score ?? 0), PAD + 40, base, { weight: 800, size: scoreSize })
    ctx.fillStyle = tm.color || TXT
    ctx.fillRect(PAD, y + 12, 16, base - y - 12)
    ctx.globalAlpha = 1
    y = base + 90
  })

  if (result) {
    setFont(ctx, 650, 48)
    text(ctx, ellipsize(ctx, result, W - 2 * PAD), PAD, y, { weight: 650, size: 48 })
    y += 60
  }
  if (meta) { text(ctx, meta, PAD, y, { weight: 500, size: 34, color: DIM, wide: false }); y += 40 }
  const first = y + 120
  const room = Math.max(0, Math.floor((H - 230 - first) / 92) + 1)
  if (lines.length && room) rows(ctx, lines.slice(0, room), first)
  return canvas
}

// ── Fiche joueur ─────────────────────────────────────────────────────────────
// tiles : [{ label, value }] (6 au plus) ; series : points match après match
export async function playerImage({ kicker, date, name, team, tiles, series = [], seriesLabel }) {
  const { canvas, ctx } = await base({ kicker, date })
  const size = fitFont(ctx, name, W - 2 * PAD, 800, 120, 72)
  const nameLines = wrap(ctx, name, W - 2 * PAD, 2)
  nameLines.forEach((l, k) => text(ctx, l, PAD, 520 + k * (size + 10), { weight: 800, size }))
  let y = 520 + (nameLines.length - 1) * (size + 10) + 70
  if (team) { setFont(ctx, 500, 40); text(ctx, ellipsize(ctx, team, W - 2 * PAD), PAD, y, { weight: 500, size: 40, color: DIM }); }

  y += 90
  const colW = (W - 2 * PAD) / 2
  tiles.slice(0, 6).forEach((tile, i) => {
    const cx = PAD + (i % 2) * colW
    const cy = y + Math.floor(i / 2) * 230
    if (i % 2 === 0) hairline(ctx, cy)
    text(ctx, tile.label, cx, cy + 62, { weight: 500, size: 32, color: DIM, wide: false })
    text(ctx, String(tile.value), cx, cy + 190, { weight: 800, size: 116 })
  })
  y += Math.ceil(Math.min(tiles.length, 6) / 2) * 230 + 40

  const pts = series.slice(-14)
  const chartTop = y + 70
  const chartH = H - 260 - chartTop
  if (pts.length > 1 && chartH > 140) {
    hairline(ctx, y)
    if (seriesLabel) text(ctx, seriesLabel, PAD, y + 56, { weight: 500, size: 32, color: DIM, wide: false })
    const max = Math.max(1, ...pts)
    const gap = 14
    const bw = Math.min(64, (W - 2 * PAD - gap * (pts.length - 1)) / pts.length)
    const barTop = chartTop + 50
    const barH = chartH - 60
    pts.forEach((v, i) => {
      const h = Math.max(6, (v / max) * barH)
      ctx.fillStyle = i === pts.length - 1 ? TXT : 'rgba(255,255,255,0.45)'
      ctx.fillRect(PAD + i * (bw + gap), barTop + barH - h, bw, h)
    })
  }
  return canvas
}

// ── Podium / classement ──────────────────────────────────────────────────────
// ranking : [{ team, value }] dans l'ordre ; title : nom du tournoi ou du championnat
export async function podiumImage({ kicker, date, title, meta, ranking, championLabel }) {
  const { canvas, ctx } = await base({ kicker, date })
  const size = fitFont(ctx, title, W - 2 * PAD, 800, 96, 64)
  const titleLines = wrap(ctx, title, W - 2 * PAD, 2)
  titleLines.forEach((l, k) => text(ctx, l, PAD, 500 + k * (size + 8), { weight: 800, size }))
  let y = 500 + (titleLines.length - 1) * (size + 8) + 64
  if (meta) { text(ctx, meta, PAD, y, { weight: 500, size: 34, color: DIM, wide: false }) }
  y += 120

  const top = ranking.slice(0, 3)
  top.forEach((r, i) => {
    hairline(ctx, y - 10)
    const big = i === 0
    const rankSize = big ? 180 : 120
    const rowH = big ? 260 : 190
    ctx.globalAlpha = big ? 1 : 0.85
    text(ctx, String(i + 1), PAD, y + rankSize * 0.82, { weight: 800, size: rankSize })
    const x = PAD + (big ? 170 : 130)
    if (big && championLabel) text(ctx, championLabel, x, y + 60, { weight: 500, size: 32, color: DIM, wide: false })
    const nameSize = fitFont(ctx, r.team, W - PAD - x, 800, big ? 76 : 56, 40)
    setFont(ctx, 800, nameSize)
    const nameY = big ? y + 150 : y + 92
    text(ctx, ellipsize(ctx, r.team, W - PAD - x), x, nameY, { weight: 800, size: nameSize })
    if (r.value) text(ctx, r.value, x, nameY + (big ? 62 : 52), { weight: 500, size: 34, color: DIM, wide: false })
    ctx.globalAlpha = 1
    y += rowH
  })

  const rest = ranking.slice(3)
  const room = Math.floor((H - 260 - y) / 84)
  if (rest.length && room > 0) {
    rows(ctx, rest.slice(0, room).map((r, k) => ({ label: `${k + 4}. ${r.team}`, value: r.value || '' })), y + 60, { size: 34, gap: 84 })
  }
  return canvas
}

// ── Partage ──────────────────────────────────────────────────────────────────
export function canvasBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'))
}

export function canShareFiles() {
  try {
    const f = new File([new Blob()], 'x.png', { type: 'image/png' })
    return typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [f] })
  } catch { return false }
}

export async function shareBlob(blob, filename, title) {
  const file = new File([blob], filename, { type: 'image/png' })
  try {
    await navigator.share({ files: [file], title })
    return 'shared'
  } catch (e) {
    return e?.name === 'AbortError' ? 'cancelled' : 'failed'
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function slug(s) {
  return String(s || 'tchouk').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'tchouk'
}
