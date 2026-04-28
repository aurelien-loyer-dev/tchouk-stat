import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { buildShotSeries } from '../lib/shotSeries'
import { playerTirsTotal, playerDerivedStats, playerTeamScore } from '../lib/playerStats'

// ── Utils ─────────────────────────────────────────────────────────────────────
function fmtDuration(totalSec) {
  const sec = Math.max(0, totalSec || 0)
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
}

function fmtDateTime(iso) {
  try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

function fileSafeName(name) {
  return String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '')
  const full  = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const n     = Number.parseInt(full, 16)
  if (Number.isNaN(n)) return { r: 31, g: 111, b: 235 }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function pct(num, den) {
  if (!den) return '—'
  return `${Math.round((num / den) * 100)} %`
}

// ── PDF : match stats / scoreur ───────────────────────────────────────────────
function generateStatsPdf(match) {
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
  doc.text('Feuille de match', left, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Export : ${fmtDateTime(new Date().toISOString())}  ·  Match du : ${fmtDateTime(playedAt)}`, left, 19)
  const hdrScore = teams.map(t => `${t.name} ${t.score}`).join('  —  ')
  doc.text(hdrScore, left, 25)
  doc.setTextColor(15, 23, 42)
  y = 34

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90, 100, 120)
  doc.text(`Format : ${settings?.halfCount}×${settings?.halfDurationMin} min  ·  Durée : ${fmtDuration(durationSec)}`, left, y)
  doc.setTextColor(15, 23, 42)
  y += 10

  // Team stats table
  const cols = [
    { label: 'Équipe',   w: 34, key: 'name' },
    { label: 'Score',    w: 12, key: 'score' },
    { label: 'Tirs',     w: 11, key: 'tirs' },
    { label: 'Gagnés',   w: 14, key: 'tGagne' },
    { label: 'Donnés',   w: 14, key: 'tDonne' },
    { label: 'Catchés',  w: 15, key: 'tCatche' },
    { label: 'F.Tir',    w: 11, key: 'tFaute' },
    { label: 'Fautes',   w: 12, key: 'fautes' },
    { label: 'Pos.',     w: 10, key: 'pos' },
    { label: 'Eff. %',   w: 14, key: '__eff' },
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

  teams.slice(0, n).forEach((t, ti) => {
    const c  = hexToRgb(settings?.teamColors?.[ti])
    const bg = ti % 2 === 0 ? [255, 255, 255] : [248, 250, 254]
    doc.setFillColor(...bg)
    doc.rect(left, y - 4, maxW, rowH, 'F')
    doc.setFillColor(c.r, c.g, c.b)
    doc.rect(left, y - 4, 2, rowH, 'F')
    sc.forEach((col, i) => {
      const val    = col.key === '__eff' ? (t.tirs > 0 ? `${Math.round((t.tGagne / t.tirs) * 100)} %` : '—') : String(t[col.key] ?? 0)
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
  const SHOT_LBL = { tGagne: 'Tir gagné', tDonne: 'Tir donné', tCatche: 'Tir catché', tFaute: 'Faute sur tir' }
  const evts = timeline.filter(e => e.category === 'tirs').slice(0, 50)
  if (evts.length > 0) {
    const evCols = [{ w: 22 }, { w: 45 }, { w: 65 }, { w: 40 }]
    const evLabels = ['Temps', 'Équipe', 'Action', 'Score']
    const evScale  = maxW / evCols.reduce((s, c) => s + c.w, 0)
    const evc      = evCols.map(c => ({ w: c.w * evScale }))
    function exOf(idx) { let x = left; for (let i = 0; i < idx; i++) x += evc[i].w; return x }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(70, 80, 100)
    doc.text('ÉVÉNEMENTS TIRS', left, y); y += 6

    doc.setFillColor(235, 240, 250); doc.rect(left, y - 4, maxW, 7, 'F')
    doc.setFontSize(6.5)
    evLabels.forEach((l, i) => doc.text(l, exOf(i) + 2, y + 0.5))
    y += 7

    evts.forEach((ev, idx) => {
      if (y > pageH - 14) return
      doc.setFillColor(...(idx % 2 === 0 ? [255, 255, 255] : [248, 250, 254]))
      doc.rect(left, y - 4, maxW, 6.5, 'F')
      const vals = [fmtDuration(ev.elapsedSec), ev.teamName || '', `${SHOT_LBL[ev.id] || ev.id} (${ev.d > 0 ? '+1' : '-1'})`, (ev.scores || []).join(' – ')]
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
  doc.text('Feuille de match · Stats joueurs', left, 12)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text(`Export : ${fmtDateTime(new Date().toISOString())}  ·  Match du : ${fmtDateTime(playedAt)}`, left, 19)
  const hdrScore = n === 2
    ? `${teams[0]?.name || ''} ${score0}  —  ${score1} ${teams[1]?.name || ''}`
    : `${teams[0]?.name || ''} : ${score0} pts`
  doc.text(hdrScore, left, 25)
  doc.setTextColor(15, 23, 42); y = 34

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90, 100, 120)
  doc.text(`Durée : ${fmtDuration(durationSec)}  ·  ${settings?.halfCount}×${settings?.halfDurationMin} min`, left, y)
  doc.setTextColor(15, 23, 42); y += 8

  const cols = [
    { label: 'Joueur',   w: 30, key: null },
    { label: 'Pts',      w: 9,  key: 'pointsMarques' },
    { label: 'Tirs Tot', w: 12, key: '__tirsTotal' },
    { label: 'T.N.Tr',   w: 11, key: 'tirsNonTransformes' },
    { label: 'Pt Dn',    w: 11, key: 'pointsDonnes' },
    { label: 'F.Tir',    w: 9,  key: 'fautesTir' },
    { label: 'Def Sol',  w: 12, key: 'defenseSolo' },
    { label: 'Part Df',  w: 11, key: 'participationDef' },
    { label: 'Def Rat',  w: 11, key: 'defenseRatee' },
    { label: 'P.Rat',    w: 9,  key: 'passesRatees' },
    { label: 'F.Tech',   w: 10, key: 'fautesTech' },
    { label: 'Sanct',    w: 10, key: 'sanctions' },
    { label: 'Eff Off',  w: 13, key: '__effOff' },
    { label: '% Don',    w: 10, key: '__pctDon' },
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
    ? [{ grp: players.filter(p => p.teamIdx === 0), name: teams[0]?.name || 'Équipe 1', c: c1 },
       { grp: players.filter(p => p.teamIdx === 1), name: teams[1]?.name || 'Équipe 2', c: c2 }]
    : [{ grp: players.filter(p => p.teamIdx === 0), name: teams[0]?.name || 'Équipe 1', c: c1 }]

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
    doc.text(`Tirs : ${totTirs}  ·  Pts marqués : ${totPM}  ·  Pts donnés : ${totPD}  ·  Déf. : ${totDef}  ·  Eff. : ${pct(totPM, totTirs)}`, left + 8, y + 14)
    doc.setTextColor(15, 23, 42); y += 18
    if (grp.length === 0) { doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.text('Aucun joueur.', left + 4, y); y += 8; return }
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

// ── Détail match stats / scoreur ──────────────────────────────────────────────
const SHOT_LABELS = { tGagne: 'Tir gagné', tDonne: 'Tir donné', tCatche: 'Tir catché', tFaute: 'Faute sur tir' }

function MatchDetail({ match, onClose }) {
  const { teams, timeline, settings } = match
  const shotEvents = (timeline || []).filter(e => e.category === 'tirs')

  return (
    <div className="hist-detail">
      <div className="hist-detail-header">
        <button className="btn-ghost hist-back" onClick={onClose}>← Retour</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="hist-detail-date">{fmtDateTime(match.playedAt)}</div>
          <button className="btn-mini" onClick={() => downloadMatchPdf(match)}>PDF ↓</button>
        </div>
      </div>

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
        <div className="si"><div className="si-l">Format</div><span className="si-v" style={{ fontSize: 14 }}>{match.settings?.halfCount}×{match.settings?.halfDurationMin} min</span></div>
        <div className="si"><div className="si-l">Durée réelle</div><span className="si-v" style={{ fontSize: 14 }}>{fmtDuration(match.durationSec)}</span></div>
        <div className="si"><div className="si-l">Événements tir</div><span className="si-v" style={{ fontSize: 14 }}>{match.shotEvents}</span></div>
      </div>

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
  const { players = [], teams = [], settings, numTeams: nt = 2, playedAt, durationSec } = match
  const n      = nt
  const score0 = playerTeamScore(players, 0, n)
  const score1 = n === 2 ? playerTeamScore(players, 1, n) : null

  const teamGroups = [
    { name: teams[0]?.name || 'Équipe 1', color: settings?.teamColors?.[0], grp: players.filter(p => p.teamIdx === 0) },
    ...(n === 2 ? [{ name: teams[1]?.name || 'Équipe 2', color: settings?.teamColors?.[1], grp: players.filter(p => p.teamIdx === 1) }] : []),
  ]

  return (
    <div className="hist-detail">
      <div className="hist-detail-header">
        <button className="btn-ghost hist-back" onClick={onClose}>← Retour</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="hist-detail-date">{fmtDateTime(playedAt)}</div>
          <button className="btn-mini" onClick={() => downloadMatchPdf(match)}>PDF ↓</button>
        </div>
      </div>

      <div className="rf" style={{ marginBottom: 8 }}>
        {n === 2 ? (
          <>
            <span style={{ color: settings?.teamColors?.[0] || 'var(--txt)' }}>{teams[0]?.name} {score0}</span>
            <span style={{ color: 'var(--s3)', fontWeight: 200 }}> – </span>
            <span style={{ color: settings?.teamColors?.[1] || 'var(--txt)' }}>{score1} {teams[1]?.name}</span>
          </>
        ) : (
          <span style={{ color: settings?.teamColors?.[0] || 'var(--txt)' }}>{teams[0]?.name} : {score0} pts</span>
        )}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="ctitle">Résumé</div>
        <div className="si"><div className="si-l">Format</div><span className="si-v" style={{ fontSize: 14 }}>{settings?.halfCount}×{settings?.halfDurationMin} min</span></div>
        <div className="si"><div className="si-l">Durée réelle</div><span className="si-v" style={{ fontSize: 14 }}>{fmtDuration(durationSec)}</span></div>
        <div className="si"><div className="si-l">Joueurs</div><span className="si-v" style={{ fontSize: 14 }}>{players.length}</span></div>
      </div>

      {teamGroups.map(({ name, color, grp }) => (
        <div className="card" key={name} style={{ marginBottom: 12, borderTop: `3px solid ${color || 'var(--acc)'}` }}>
          <div className="ctitle" style={{ color }}>{name}</div>
          {grp.length === 0
            ? <div style={{ color: 'var(--dim)', fontSize: 13 }}>Aucun joueur.</div>
            : (
              <div className="hist-player-table">
                <div className="hist-player-hd">
                  <span>Joueur</span>
                  <span>Pts</span>
                  <span>Tirs</span>
                  <span>Eff.</span>
                  <span>Déf.</span>
                  <span>Fautes</span>
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
export default function History({ history, onBack, onClear }) {
  const [selected, setSelected] = useState(null)

  if (selected) {
    return selected.mode === 'player'
      ? <PlayerMatchDetail match={selected} onClose={() => setSelected(null)} />
      : <MatchDetail match={selected} onClose={() => setSelected(null)} />
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
              <button className="hist-btn hist-item" key={m.id} onClick={() => setSelected(m)}>
                <div className="hist-top">
                  <span>{fmtDateTime(m.playedAt)}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>{m.settings?.halfCount}×{m.settings?.halfDurationMin}min</span>
                    <span
                      className="hist-pdf-btn"
                      role="button"
                      onClick={e => { e.stopPropagation(); downloadMatchPdf(m) }}
                    >
                      PDF ↓
                    </span>
                  </div>
                </div>
                <div className="hist-scoreline">
                  {(m.teams || []).map((t, i) => (
                    <span key={i}>
                      {i > 0 && <span style={{ color: 'var(--dim)', fontWeight: 200 }}> – </span>}
                      <span style={{ color: m.settings?.teamColors?.[i] || 'var(--txt)' }}>{t.name} {t.score}</span>
                    </span>
                  ))}
                </div>
                <div className="hist-stats">
                  {m.mode === 'player'
                    ? `${m.players?.length || 0} joueurs · stats joueurs`
                    : `${(m.teams || []).map(t => `${t.tirs ?? 0} tirs`).join(' · ')} · ${m.shotEvents ?? 0} evt`
                  }
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
