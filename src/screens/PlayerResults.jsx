import { jsPDF } from 'jspdf'
import { PLAYER_STATS, playerTeamScore, playerDerivedStats, playerTirsTotal } from '../lib/playerStats'

function fmtDuration(totalSec) {
  const sec = Math.max(0, totalSec || 0)
  const m   = String(Math.floor(sec / 60)).padStart(2, '0')
  const s   = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

function fmtDateTime(iso) {
  try { return new Date(iso).toLocaleString('fr-FR') } catch { return '' }
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
  const full  = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const n     = Number.parseInt(full, 16)
  if (Number.isNaN(n)) return { r: 31, g: 111, b: 235 }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function pct(num, den) {
  if (!den || den === 0) return '—'
  return `${Math.round((num / den) * 100)} %`
}

// ── Carte stats d'un joueur (écran résultats) ─────────────────────────────────
function PlayerStatCard({ player, teamColor, teamName, onDownload }) {
  const d = playerDerivedStats(player)

  return (
    <div className="pr-player-card" style={{ borderColor: teamColor }}>
      <div className="pr-player-header">
        <div>
          <div className="pr-player-name">{player.name}</div>
          <div className="pr-player-team">{teamName}</div>
        </div>
        <div className="pr-player-pts-big">{player.pointsMarques}</div>
      </div>

      {/* Stats brutes */}
      <div className="pr-stat-section-title">Statistiques</div>
      <div className="pr-stat-list">
        {PLAYER_STATS.map(stat => (
          <div className="pr-stat-row" key={stat.id}>
            <span className="pr-stat-label">{stat.label}</span>
            <span className="pr-stat-val">{player[stat.id] ?? 0}</span>
          </div>
        ))}
      </div>

      {/* Totaux & ratios */}
      <div className="pr-stat-section-title">Totaux &amp; ratios</div>
      <div className="pr-stat-list">
        <div className="pr-stat-row">
          <span className="pr-stat-label">Tirs total <small>pts marqués + donnés + fautes tir</small></span>
          <span className="pr-stat-val">{d.tirsTotal}</span>
        </div>
        <div className="pr-stat-row">
          <span className="pr-stat-label pr-ratio-lbl">Efficacité offensive <small>pts marqués / tirs</small></span>
          <span className="pr-stat-val pr-stat-ratio">{pct(player.pointsMarques, d.tirsTotal)}</span>
        </div>
        <div className="pr-stat-row">
          <span className="pr-stat-label pr-ratio-lbl">% points offerts <small>pts donnés / tirs</small></span>
          <span className="pr-stat-val pr-stat-ratio">{pct(player.pointsDonnes, d.tirsTotal)}</span>
        </div>
        <div className="pr-stat-row">
          <span className="pr-stat-label">Actions défensives <small>solo + participation</small></span>
          <span className="pr-stat-val">{d.defTotal}</span>
        </div>
        <div className="pr-stat-row">
          <span className="pr-stat-label">Total fautes <small>tir + techniques</small></span>
          <span className="pr-stat-val">{d.fautesTotal}</span>
        </div>
      </div>

      <button className="btn-mini pr-dl-btn" onClick={() => onDownload(player)}>
        PDF joueur ↓
      </button>
    </div>
  )
}

// ── Écran résultats joueurs ───────────────────────────────────────────────────
export default function PlayerResults({ teams, players, numTeams, settings, summary, onNew }) {
  const n = numTeams ?? 2

  const score0       = playerTeamScore(players, 0, n)
  const score1       = n === 2 ? playerTeamScore(players, 1, n) : null
  const team1Players = players.filter(p => p.teamIdx === 0)
  const team2Players = n === 2 ? players.filter(p => p.teamIdx === 1) : []

  // ── PDF d'un seul joueur ──────────────────────────────────────────────────
  function generatePlayerPdf(player) {
    const teamName = player.teamIdx === 0 ? (teams[0]?.name || 'Équipe 1') : (teams[1]?.name || 'Équipe 2')
    const d        = playerDerivedStats(player)
    const doc      = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW    = doc.internal.pageSize.getWidth()
    const left     = 14
    const maxW     = pageW - left * 2
    let y          = 0

    // En-tête
    doc.setFillColor(20, 30, 48)
    doc.rect(0, 0, pageW, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('Stats Joueur', left, 12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Export : ${fmtDateTime(new Date().toISOString())}`, left, 19)
    const hdrScore = n === 2
      ? `${teams[0]?.name || ''} ${score0} — ${score1} ${teams[1]?.name || ''}`
      : `${teams[0]?.name || ''} : ${score0} pts`
    doc.text(hdrScore, left, 24)
    doc.setTextColor(15, 23, 42)
    y = 36

    // Nom + équipe
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text(player.name, left, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(100, 110, 130)
    doc.text(teamName, left, y)
    doc.setTextColor(15, 23, 42)
    y += 12

    // Bloc points marqués
    doc.setFillColor(240, 245, 255)
    doc.roundedRect(left, y - 5, maxW, 14, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Points marqués', left + 4, y + 4)
    doc.setFontSize(14)
    doc.text(String(player.pointsMarques), left + maxW - 4, y + 4, { align: 'right' })
    y += 18

    function sectionHeader(title, y0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(100, 110, 130)
      doc.text(title.toUpperCase(), left, y0)
      doc.setTextColor(15, 23, 42)
      return y0 + 5
    }

    function statRow(label, val, sub, idx, y0) {
      const rh = sub ? 11 : 8
      const bg = idx % 2 === 0 ? [252, 253, 255] : [255, 255, 255]
      doc.setFillColor(...bg)
      doc.rect(left, y0 - 4, maxW, rh, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(60, 70, 90)
      doc.text(label, left + 3, y0 + 1)
      if (sub) {
        doc.setFontSize(8)
        doc.setTextColor(150, 160, 175)
        doc.text(sub, left + 3, y0 + 5)
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42)
      doc.text(String(val), left + maxW - 3, y0 + 1, { align: 'right' })
      doc.setDrawColor(230, 235, 245)
      doc.line(left, y0 + rh - 4, left + maxW, y0 + rh - 4)
      return y0 + rh
    }

    y = sectionHeader('Statistiques', y)
    PLAYER_STATS.forEach((stat, idx) => {
      y = statRow(stat.label, player[stat.id] ?? 0, stat.sub, idx, y)
    })

    y += 6
    y = sectionHeader('Totaux & ratios', y)
    const derived = [
      { label: 'Tirs total',           val: d.tirsTotal,                         sub: 'pts marqués + donnés + fautes tir' },
      { label: 'Efficacité offensive', val: pct(player.pointsMarques, d.tirsTotal), sub: 'pts marqués / tirs total' },
      { label: '% points offerts',     val: pct(player.pointsDonnes,  d.tirsTotal), sub: 'pts donnés / tirs total' },
      { label: 'Actions défensives',   val: d.defTotal,                           sub: 'défense solo + participation' },
      { label: 'Total fautes',         val: d.fautesTotal,                        sub: 'fautes de tir + techniques' },
    ]
    derived.forEach((row, idx) => {
      y = statRow(row.label, row.val, row.sub, idx, y)
    })

    doc.save(`stats_${fileSafeName(player.name)}.pdf`)
  }

  // ── PDF complet ───────────────────────────────────────────────────────────
  function generateFullPdf() {
    const doc   = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const left  = 14
    const maxW  = pageW - left * 2
    const c1    = hexToRgb(settings?.teamColors?.[0] || '#0e9f8f')
    const c2    = hexToRgb(settings?.teamColors?.[1] || '#d14343')
    let y       = 0

    function ensurePage(need = 0) {
      if (y + need > pageH - 14) { doc.addPage(); y = 14 }
    }

    // En-tête
    doc.setFillColor(20, 30, 48)
    doc.rect(0, 0, pageW, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text('Feuille de match', left, 12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Export : ${fmtDateTime(new Date().toISOString())}`, left, 19)
    const hdrScore = n === 2
      ? `${teams[0]?.name || ''} ${score0}  —  ${score1} ${teams[1]?.name || ''}`
      : `${teams[0]?.name || ''} : ${score0} pts`
    doc.text(hdrScore, left, 24)
    doc.setTextColor(15, 23, 42)
    y = 34

    if (summary) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(90, 100, 120)
      doc.text(
        `Date : ${fmtDateTime(summary.playedAt)}  ·  Durée : ${fmtDuration(summary.durationSec)}  ·  ${settings?.halfCount}×${settings?.halfDurationMin} min`,
        left, y
      )
      doc.setTextColor(15, 23, 42)
      y += 8
    }

    // Définition des colonnes
    const cols = [
      { label: 'Joueur',   w: 30, key: null },
      { label: 'Pts',      w: 9,  key: 'pointsMarques' },
      { label: 'Tirs Tot', w: 12, key: '__tirsTotal' },
      { label: 'T.Réus',   w: 11, key: 'tirsReussis' },
      { label: 'Pt Dn',    w: 11, key: 'pointsDonnes' },
      { label: 'F.Tir',    w: 9,  key: 'fautesTir' },
      { label: 'Def Sol',  w: 12, key: 'defenseSolo' },
      { label: 'Part Df',  w: 11, key: 'participationDef' },
      { label: 'P.Rat',    w: 9,  key: 'passesRatees' },
      { label: 'F.Tech',   w: 10, key: 'fautesTech' },
      { label: 'Eff Off',  w: 13, key: '__effOff' },
      { label: '% Don',    w: 10, key: '__pctDon' },
    ]
    const totalW = cols.reduce((s, c) => s + c.w, 0)
    const scale  = maxW / totalW
    const sc     = cols.map(c => ({ ...c, w: c.w * scale }))
    const rowH   = 7

    function xOf(idx) {
      let x = left
      for (let i = 0; i < idx; i++) x += sc[i].w
      return x
    }

    function cellVal(player, key) {
      if (key === null) return player.name
      if (key === '__tirsTotal')  return String(playerTirsTotal(player))
      if (key === '__effOff')     return pct(player.pointsMarques, playerTirsTotal(player))
      if (key === '__pctDon')     return pct(player.pointsDonnes,  playerTirsTotal(player))
      return String(player[key] ?? 0)
    }

    function drawHeader(y0) {
      doc.setFillColor(235, 240, 250)
      doc.rect(left, y0 - 4, maxW, rowH, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(70, 80, 100)
      sc.forEach((col, i) => {
        const isFirst = i === 0
        const x = isFirst ? xOf(i) + 2 : xOf(i) + col.w / 2
        doc.text(col.label, x, y0 + 1, {
          align: isFirst ? 'left' : 'center',
          maxWidth: col.w - 2,
        })
      })
      doc.setTextColor(15, 23, 42)
      return y0 + rowH
    }

    function drawPlayerRow(player, idx, y0) {
      const bg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 254]
      doc.setFillColor(...bg)
      doc.rect(left, y0 - 4, maxW, rowH, 'F')
      sc.forEach((col, i) => {
        const val     = cellVal(player, col.key)
        const isFirst = i === 0
        const isBold  = col.key === 'pointsMarques' || col.key === null
        const x       = isFirst ? xOf(i) + 2 : xOf(i) + col.w / 2
        doc.setFont('helvetica', isBold ? 'bold' : 'normal')
        doc.setFontSize(isBold ? 8 : 7.5)
        doc.setTextColor(isBold ? 15 : 50, isBold ? 23 : 60, isBold ? 42 : 80)
        doc.text(val, x, y0 + 1, {
          align: isFirst ? 'left' : 'center',
          maxWidth: col.w - 2,
        })
      })
      doc.setDrawColor(230, 235, 245)
      doc.line(left, y0 + rowH - 4, left + maxW, y0 + rowH - 4)
      return y0 + rowH
    }

    const teamGroups = n === 2
      ? [
          { grp: team1Players, name: teams[0]?.name || 'Équipe 1', c: c1 },
          { grp: team2Players, name: teams[1]?.name || 'Équipe 2', c: c2 },
        ]
      : [{ grp: team1Players, name: teams[0]?.name || 'Équipe 1', c: c1 }]

    teamGroups.forEach(({ grp, name, c }) => {
      ensurePage(22 + (grp.length + 2) * rowH)

      doc.setFillColor(c.r, c.g, c.b)
      doc.rect(left, y, 4, 12, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(15, 23, 42)
      doc.text(name, left + 8, y + 8)

      const totTirs = grp.reduce((a, p) => a + playerTirsTotal(p), 0)
      const totPM   = grp.reduce((a, p) => a + p.pointsMarques, 0)
      const totPD   = grp.reduce((a, p) => a + p.pointsDonnes, 0)
      const totDef  = grp.reduce((a, p) => a + p.defenseSolo + p.participationDef, 0)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(90, 100, 120)
      doc.text(
        `Tirs total : ${totTirs}  ·  Pts marqués : ${totPM}  ·  Pts donnés : ${totPD}  ·  Déf. : ${totDef}  ·  Eff. off. : ${pct(totPM, totTirs)}`,
        left + 8, y + 14
      )
      doc.setTextColor(15, 23, 42)
      y += 18

      if (grp.length === 0) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.text('Aucun joueur enregistré.', left + 4, y)
        y += 8
        return
      }

      y = drawHeader(y)
      grp.forEach((player, i) => { y = drawPlayerRow(player, i, y) })
      y += 8
    })

    const t1 = fileSafeName(teams[0]?.name) || 'equipe1'
    const t2 = n === 2 ? (fileSafeName(teams[1]?.name) || 'equipe2') : 'solo'
    doc.save(`${t1}vs${t2}_joueurs.pdf`)
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="rf">
        {n === 2 ? (
          <>
            <span style={{ color: 'var(--c1)' }}>{score0}</span>
            <span style={{ color: 'var(--s3)', fontWeight: 200 }}> – </span>
            <span style={{ color: 'var(--c2)' }}>{score1}</span>
          </>
        ) : (
          <span style={{ color: 'var(--c1)' }}>{score0}</span>
        )}
      </div>

      <div className="card">
        <div className="ctitle" style={{ color: 'var(--c1)' }}>{teams[0]?.name || 'Équipe 1'}</div>
        {team1Players.length === 0 && <div className="pr-no-players">Aucun joueur</div>}
        <div className="pr-players-list">
          {team1Players.map(p => (
            <PlayerStatCard
              key={p.id}
              player={p}
              teamColor="var(--c1)"
              teamName={teams[0]?.name || 'Équipe 1'}
              onDownload={generatePlayerPdf}
            />
          ))}
        </div>
      </div>

      {n === 2 && (
        <div className="card">
          <div className="ctitle" style={{ color: 'var(--c2)' }}>{teams[1]?.name || 'Équipe 2'}</div>
          {team2Players.length === 0 && <div className="pr-no-players">Aucun joueur</div>}
          <div className="pr-players-list">
            {team2Players.map(p => (
              <PlayerStatCard
                key={p.id}
                player={p}
                teamColor="var(--c2)"
                teamName={teams[1]?.name || 'Équipe 2'}
                onDownload={generatePlayerPdf}
              />
            ))}
          </div>
        </div>
      )}

      <button
        className="btn-ghost"
        style={{ alignSelf: 'center', minWidth: 280, marginTop: 4 }}
        onClick={generateFullPdf}
      >
        Télécharger feuille complète (PDF)
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
