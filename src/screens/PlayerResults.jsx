import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { useTranslation } from 'react-i18next'
import { PLAYER_STATS, playerTeamScore, playerDerivedStats, playerTirsTotal } from '../lib/playerStats'
import { fmtClock, fmtDateTime, hexToRgb, fileSafeName, pct } from '../lib/format'
import { teamTextStyle } from '../lib/teamColor'

// ── Algorithmes de scoring automatique ───────────────────────────────────────
//
// BOPM : attaque pure — pts marqués, efficacité, pénalise pts donnés et fautes tir
// BDPM : défense pure — actions défensives, pénalise passes ratées et fautes tech
// MVP  : bilan global — pondère attaque + défense + toutes les fautes
//
function offScore(p) {
  const tt  = p.pointsMarques + p.pointsDonnes + p.fautesTir
  const eff = tt > 0 ? p.pointsMarques / tt : 0
  return p.pointsMarques * 2 - p.pointsDonnes * 2 - p.fautesTir + eff * 8
}

function defScore(p) {
  return p.defenseSolo * 3 + p.participationDef * 1.5 - p.passesRatees * 0.5 - p.fautesTech
}

function mvpScore(p) {
  const tt  = p.pointsMarques + p.pointsDonnes + p.fautesTir
  const eff = tt > 0 ? p.pointsMarques / tt : 0
  return (
    p.pointsMarques * 2
    - p.pointsDonnes * 2
    - p.fautesTir
    + p.defenseSolo * 2
    + p.participationDef
    - p.passesRatees * 0.5
    - p.fautesTech * 1.5
    + eff * 8
  )
}

// Retourne les groupes du top N, avec ex aequo groupés ensemble
// Ex: [{rank:1, players:[A,B]}, {rank:2, players:[C]}, {rank:3, players:[D,E]}]
function topPlayers(players, scoreFn, limit = 3) {
  if (!players || players.length === 0) return []
  const sorted = [...players].sort((a, b) => scoreFn(b) - scoreFn(a))
  const groups = []
  for (const p of sorted) {
    const s    = scoreFn(p)
    const last = groups[groups.length - 1]
    if (last && last.score === s) {
      last.players.push(p)
    } else {
      if (groups.length === limit) break
      groups.push({ rank: groups.length + 1, score: s, players: [p] })
    }
  }
  return groups
}

const AWARDS = [
  {
    key:      'bopm',
    labelKey: 'awards.bopmLabel',
    full:     'Best Offensive Player of the Match',
    descKey:  'awards.bopmDesc',
    fn:       offScore,
    color:    '#d97706',
    pdfRgb:   [217, 119, 6],
    hint: (p, pctFn, t) => {
      const tt = p.pointsMarques + p.pointsDonnes + p.fautesTir
      return t('awards.hintBopm', { scored: p.pointsMarques, eff: pctFn(p.pointsMarques, tt), given: p.pointsDonnes })
    },
  },
  {
    key:      'bdpm',
    labelKey: 'awards.bdpmLabel',
    full:     'Best Defensive Player of the Match',
    descKey:  'awards.bdpmDesc',
    fn:       defScore,
    color:    '#1f6feb',
    pdfRgb:   [31, 111, 235],
    hint: (p, pctFn, t) => t('awards.hintBdpm', { solo: p.defenseSolo, part: p.participationDef }),
  },
  {
    key:      'mvp',
    labelKey: 'awards.mvpLabel',
    full:     'Most Valuable Player',
    descKey:  'awards.mvpDesc',
    fn:       mvpScore,
    color:    '#eab308',
    pdfRgb:   [234, 179, 8],
    hint: (p, pctFn, t) => {
      const tt = p.pointsMarques + p.pointsDonnes + p.fautesTir
      return t('awards.hintMvp', { pts: p.pointsMarques, eff: pctFn(p.pointsMarques, tt), def: p.defenseSolo + p.participationDef, fouls: p.fautesTir + p.fautesTech })
    },
  },
]

// ── Écran résultats joueurs ───────────────────────────────────────────────────
export default function PlayerResults({ teams, players, numTeams, settings, summary, onNew }) {
  const { t } = useTranslation()
  const n = numTeams ?? 2

  const c1 = settings?.teamColors?.[0] || '#0e9f8f'
  const c2 = settings?.teamColors?.[1] || '#d14343'

  const score0       = playerTeamScore(players, 0, n)
  const score1       = n === 2 ? playerTeamScore(players, 1, n) : null
  const team1Players = players.filter(p => p.teamIdx === 0)
  const team2Players = n === 2 ? players.filter(p => p.teamIdx === 1) : []

  const [showPicker, setShowPicker] = useState(false)

  // Top 3 par distinction, avec gestion des ex aequo
  const computedAwards = {
    bopm: topPlayers(players, offScore),
    bdpm: topPlayers(players, defScore),
    mvp:  topPlayers(players, mvpScore),
  }

  function teamName(p) {
    return p.teamIdx === 0 ? (teams[0]?.name || t('playerResults.defaultTeam1')) : (teams[1]?.name || t('playerResults.defaultTeam2'))
  }

  // ── PDF d'un seul joueur ──────────────────────────────────────────────────
  function generatePlayerPdf(player) {
    const tName = teamName(player)
    const d     = playerDerivedStats(player)
    const doc   = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const left  = 14
    const maxW  = pageW - left * 2
    let y       = 0

    doc.setFillColor(20, 30, 48)
    doc.rect(0, 0, pageW, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(t('playerResults.pdfPlayerTitle'), left, 12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(t('playerResults.exportLabel', { date: fmtDateTime(new Date().toISOString()) }), left, 19)
    const hdrScore = n === 2
      ? t('playerResults.scoreLineTwo', { team1: teams[0]?.name || '', score1: score0, score2: score1, team2: teams[1]?.name || '' })
      : t('playerResults.scoreLineOne', { team: teams[0]?.name || '', score: score0 })
    doc.text(hdrScore, left, 24)
    doc.setTextColor(15, 23, 42)
    y = 36

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text(player.name, left, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(100, 110, 130)
    doc.text(tName, left, y)
    doc.setTextColor(15, 23, 42)
    y += 12

    doc.setFillColor(240, 245, 255)
    doc.roundedRect(left, y - 5, maxW, 14, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(t('playerResults.pointsMarquesTitle'), left + 4, y + 4)
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

    y = sectionHeader(t('playerResults.statsSectionTitle'), y)
    PLAYER_STATS.forEach((stat, idx) => {
      y = statRow(t(stat.labelKey), player[stat.id] ?? 0, null, idx, y)
    })

    y += 6
    y = sectionHeader(t('playerResults.totalsSectionTitle'), y)
    const derived = [
      { label: t('playerResults.totalShots'), val: d.tirsTotal,                            sub: t('playerResults.totalShotsSub') },
      { label: t('playerResults.offEff'),     val: pct(player.pointsMarques, d.tirsTotal), sub: t('playerResults.offEffSub') },
      { label: t('playerResults.pctGiven'),   val: pct(player.pointsDonnes,  d.tirsTotal), sub: t('playerResults.pctGivenSub') },
      { label: t('playerResults.defActions'), val: d.defTotal,                             sub: t('playerResults.defActionsSub') },
      { label: t('playerResults.totalFouls'), val: d.fautesTotal,                          sub: t('playerResults.totalFoulsSub') },
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

    doc.setFillColor(20, 30, 48)
    doc.rect(0, 0, pageW, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text(t('playerResults.fullSheetTitle'), left, 12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(t('playerResults.exportLabel', { date: fmtDateTime(new Date().toISOString()) }), left, 19)
    const hdrScore = n === 2
      ? t('playerResults.scoreLineTwo', { team1: teams[0]?.name || '', score1: score0, score2: score1, team2: teams[1]?.name || '' })
      : t('playerResults.scoreLineOne', { team: teams[0]?.name || '', score: score0 })
    doc.text(hdrScore, left, 24)
    doc.setTextColor(15, 23, 42)
    y = 34

    if (summary) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(90, 100, 120)
      doc.text(
        t('playerResults.dateDurationFormat', {
          date: fmtDateTime(summary.playedAt),
          time: fmtClock(summary.durationSec),
          halfCount: settings?.halfCount,
          halfDuration: settings?.halfDurationMin,
        }),
        left, y
      )
      doc.setTextColor(15, 23, 42)
      y += 8
    }

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
      if (key === null)            return player.name
      if (key === '__tirsTotal')   return String(playerTirsTotal(player))
      if (key === '__effOff')      return pct(player.pointsMarques, playerTirsTotal(player))
      if (key === '__pctDon')      return pct(player.pointsDonnes,  playerTirsTotal(player))
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
        doc.text(col.label, x, y0 + 1, { align: isFirst ? 'left' : 'center', maxWidth: col.w - 2 })
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
        doc.text(val, x, y0 + 1, { align: isFirst ? 'left' : 'center', maxWidth: col.w - 2 })
      })
      doc.setDrawColor(230, 235, 245)
      doc.line(left, y0 + rowH - 4, left + maxW, y0 + rowH - 4)
      return y0 + rowH
    }

    const teamGroups = n === 2
      ? [
          { grp: team1Players, name: teams[0]?.name || t('playerResults.defaultTeam1'), c: c1 },
          { grp: team2Players, name: teams[1]?.name || t('playerResults.defaultTeam2'), c: c2 },
        ]
      : [{ grp: team1Players, name: teams[0]?.name || t('playerResults.defaultTeam1'), c: c1 }]

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
        t('playerResults.teamSummaryLine', { totalShots: totTirs, scored: totPM, given: totPD, def: totDef, eff: pct(totPM, totTirs) }),
        left + 8, y + 14
      )
      doc.setTextColor(15, 23, 42)
      y += 18

      if (grp.length === 0) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.text(t('playerResults.noPlayers'), left + 4, y)
        y += 8
        return
      }

      y = drawHeader(y)
      grp.forEach((player, i) => { y = drawPlayerRow(player, i, y) })
      y += 8
    })

    // ── Distinctions du match ──────────────────────────────────────────────
    if (players.length > 0) {
      const totalRows = AWARDS.reduce((s, a) => {
        const gs = computedAwards[a.key] || []
        return s + gs.reduce((s2, g) => s2 + g.players.length, 0)
      }, 0)
      ensurePage(20 + totalRows * 9 + AWARDS.length * 14)

      doc.setFillColor(235, 240, 250)
      doc.rect(left, y, maxW, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(70, 80, 100)
      doc.text(t('awards.pdfSectionTitle'), left + 4, y + 5.5)
      doc.setTextColor(15, 23, 42)
      y += 12

      AWARDS.forEach(award => {
        const groups = computedAwards[award.key]
        if (!groups || groups.length === 0) return

        ensurePage(12)
        doc.setFillColor(...award.pdfRgb)
        doc.rect(left, y - 2, 3, 10, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...award.pdfRgb)
        doc.text(t(award.labelKey), left + 6, y + 4)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(90, 100, 120)
        doc.text(`— ${award.full}`, left + 22, y + 4)
        y += 11

        groups.forEach(({ rank, players: gPlayers }) => {
          gPlayers.forEach((p, i) => {
            ensurePage(9)

            // Numéro de rang (seulement pour le premier du groupe)
            if (i === 0) {
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(8)
              const [r, g2, b] = rank === 1 ? award.pdfRgb : [100, 110, 130]
              doc.setTextColor(r, g2, b)
              doc.text(String(rank), left + 6, y + 3)
            }

            // Nom du joueur
            doc.setFont('helvetica', rank === 1 ? 'bold' : 'normal')
            doc.setFontSize(9)
            const [nr, ng, nb] = rank === 1 ? award.pdfRgb : [15, 23, 42]
            doc.setTextColor(nr, ng, nb)
            doc.text(p.name, left + 14, y + 3)

            // Ex aequo
            if (i > 0) {
              doc.setFont('helvetica', 'italic')
              doc.setFontSize(7)
              doc.setTextColor(150, 160, 175)
              const nameW = doc.getTextWidth(p.name)
              doc.text(t('awards.exAequo'), left + 14 + nameW + 3, y + 3)
            }

            // Stats hint (droite)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(7.5)
            doc.setTextColor(90, 100, 120)
            doc.text(award.hint(p, pct, t), left + maxW, y + 3, { align: 'right' })

            doc.setDrawColor(235, 240, 250)
            doc.line(left + 10, y + 6, left + maxW, y + 6)
            y += 9
          })
        })
        y += 6
      })
    }

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
            <span style={teamTextStyle(c1)}>{score0}</span>
            <span style={{ color: 'var(--s3)', fontWeight: 200 }}> – </span>
            <span style={teamTextStyle(c2)}>{score1}</span>
          </>
        ) : (
          <span style={teamTextStyle(c1)}>{score0}</span>
        )}
      </div>

      {/* ── Distinctions automatiques ── */}
      {players.length > 0 && (
        <div className="card awards-card">
          <div className="ctitle">{t('awards.sectionTitle')}</div>
          {AWARDS.map(award => {
            const groups = computedAwards[award.key]
            if (!groups || groups.length === 0) return null
            return (
              <div key={award.key} className="award-section">
                <div className="award-header">
                  <span className="award-badge" style={{ background: award.color }}>{t(award.labelKey)}</span>
                  <div className="award-info">
                    <span className="award-full">{award.full}</span>
                    <span className="award-desc">{t(award.descKey)}</span>
                  </div>
                </div>
                <div className="award-ranking">
                  {groups.map(({ rank, players: gPlayers }) =>
                    gPlayers.map((p, i) => (
                      <div key={p.id} className="award-rank-row">
                        <span
                          className="award-rank-num"
                          style={{ color: rank === 1 ? award.color : undefined }}
                        >
                          {i === 0 ? rank : ''}
                        </span>
                        <span
                          className="award-rank-name"
                          style={{ color: rank === 1 && i === 0 ? award.color : undefined, fontWeight: rank === 1 ? 900 : 600 }}
                        >
                          {p.name}
                        </span>
                        {i > 0 && <span className="award-eq-badge">{t('awards.exAequo')}</span>}
                        <span className="award-rank-hint">{award.hint(p, pct, t)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── PDF stats d'un joueur (sélecteur) ── */}
      {players.length > 0 && (
        <div className="player-pdf-wrap">
          <button
            className="btn-ghost player-pdf-btn"
            onClick={() => setShowPicker(s => !s)}
          >
            {t('playerResults.pdfPlayerStatsBtn')} {showPicker ? '▲' : '▼'}
          </button>
          {showPicker && (
            <div className="player-pdf-panel">
              {players.map(p => (
                <button
                  key={p.id}
                  className="player-pdf-item"
                  onClick={() => { generatePlayerPdf(p); setShowPicker(false) }}
                >
                  <span className="player-pdf-name">{p.name}</span>
                  <span className="player-pdf-team">{teamName(p)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        className="btn-ghost"
        style={{ alignSelf: 'center', minWidth: 280, marginTop: 4 }}
        onClick={generateFullPdf}
      >
        {t('playerResults.downloadFullPdf')}
      </button>

      <button
        className="btn-ghost"
        style={{ alignSelf: 'center', minWidth: 200, marginTop: 8 }}
        onClick={onNew}
      >
        {t('playerResults.newMatch')}
      </button>
    </>
  )
}
