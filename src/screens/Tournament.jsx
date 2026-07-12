import { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import {
  mkTournament, calcStandings, setMatchScore, setKnockoutScore,
  startKnockout, canStartKnockout, addSwissRound, isRoundComplete,
  canStartFullPlacement, startFullPlacement, setPlacementScore,
} from '../lib/tournament'
import { fmtDateTime, fileSafeName } from '../lib/format'

const TOURNAMENT_UI_KEY = 'tchouk_tournament_ui'

function loadTournamentUi() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TOURNAMENT_UI_KEY) || '{}')
    return {
      view: parsed.view === 'setup' || parsed.view === 'detail' || parsed.view === 'list' ? parsed.view : 'list',
      activeId: typeof parsed.activeId === 'string' ? parsed.activeId : null,
    }
  } catch {
    return { view: 'list', activeId: null }
  }
}

// ── Score input pour un match ─────────────────────────────────────────────────
function MatchRow({ match, onScore, compact }) {
  const [s1, setS1] = useState(match.score1 !== null ? String(match.score1) : '')
  const [s2, setS2] = useState(match.score2 !== null ? String(match.score2) : '')
  const played = match.score1 !== null && match.score2 !== null

  useEffect(() => {
    setS1(match.score1 !== null ? String(match.score1) : '')
    setS2(match.score2 !== null ? String(match.score2) : '')
  }, [match.score1, match.score2])

  function save(v1, v2) {
    const n1 = parseInt(v1), n2 = parseInt(v2)
    if (!isNaN(n1) && !isNaN(n2) && n1 >= 0 && n2 >= 0) onScore(n1, n2)
  }

  const winner1 = played && match.score1 > match.score2
  const winner2 = played && match.score2 > match.score1

  return (
    <div className={`trn-match${played ? ' trn-match-done' : ''}${compact ? ' trn-match-compact' : ''}`}>
      <div className={`trn-mt${winner1 ? ' trn-mt-win' : ''}`}>{match.team1}</div>
      <div className="trn-score-wrap">
        <input className="trn-si" type="number" min="0" value={s1}
          onChange={e => setS1(e.target.value)}
          onBlur={e => save(e.target.value, s2)}
          onKeyDown={e => e.key === 'Enter' && save(s1, s2)}
        />
        <span className="trn-dash">–</span>
        <input className="trn-si" type="number" min="0" value={s2}
          onChange={e => setS2(e.target.value)}
          onBlur={e => save(s1, e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save(s1, s2)}
        />
      </div>
      <div className={`trn-mt trn-mt-r${winner2 ? ' trn-mt-win' : ''}`}>{match.team2}</div>
    </div>
  )
}

// ── Tableau de classement ─────────────────────────────────────────────────────
function Standings({ teams, matches, qualifyN }) {
  const { t } = useTranslation()
  const s = t('tournament.standings', { returnObjects: true })
  const rows = calcStandings(teams, matches)
  return (
    <div className="trn-table-wrap">
      <table className="trn-table">
        <thead>
          <tr>
            <th>#</th><th className="trn-th-team">{s.team}</th>
            <th title={s.playedTitle}>{s.played}</th><th title={s.wonTitle}>{s.won}</th>
            <th title={s.drawnTitle}>{s.drawn}</th><th title={s.lostTitle}>{s.lost}</th>
            <th title={s.gfTitle}>{s.gf}</th><th title={s.gaTitle}>{s.ga}</th>
            <th title={s.diffTitle}>{s.diff}</th><th className="trn-th-pts">{s.pts}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team} className={qualifyN && i < qualifyN ? 'trn-qualified' : ''}>
              <td className="trn-rank">{i + 1}</td>
              <td className="trn-th-team">{r.team}</td>
              <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
              <td>{r.gf}</td><td>{r.ga}</td>
              <td className={r.gd > 0 ? 'trn-pos' : r.gd < 0 ? 'trn-neg' : ''}>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              <td className="trn-pts">{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Bracket knockout ──────────────────────────────────────────────────────────
function KnockoutBracket({ rounds, onScore }) {
  return (
    <div className="trn-bracket">
      {rounds.map((round, ri) => (
        <div key={ri} className="trn-bround">
          <div className="trn-bround-name">{round.name}</div>
          <div className="trn-bround-matches">
            {round.matches.map((m, mi) =>
              m.team1 === 'TBD' || m.team2 === 'TBD' ? (
                <div key={m.id} className="trn-match trn-match-tbd">
                  <span className="trn-mt">{m.team1}</span>
                  <span className="trn-dash">–</span>
                  <span className="trn-mt">{m.team2}</span>
                </div>
              ) : (
                <MatchRow
                  key={m.id + m.score1 + m.score2}
                  match={m}
                  compact
                  onScore={(s1, s2) => onScore(ri, mi, s1, s2)}
                />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tableau croisé (round-robin / poule) ─────────────────────────────────────
function CrossTable({ teams, matches }) {
  const map = {}
  matches.forEach(m => {
    map[`${m.team1}||${m.team2}`] = m
    map[`${m.team2}||${m.team1}`] = { score1: m.score2, score2: m.score1 }
  })

  return (
    <div className="trn-xt-wrap">
      <div className="trn-xt-scroll">
        <table className="trn-xt">
          <thead>
            <tr>
              <th className="trn-xt-corner" />
              {teams.map((_, j) => (
                <th key={j} className="trn-xt-ch">{j + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((rowTeam, i) => (
              <tr key={i}>
                <td className="trn-xt-rh">
                  <span className="trn-xt-rnum">{i + 1}</span>
                  <span className="trn-xt-rname">{rowTeam}</span>
                </td>
                {teams.map((colTeam, j) => {
                  if (i === j) return <td key={j} className="trn-xt-self">×</td>
                  const m = map[`${rowTeam}||${colTeam}`]
                  if (!m || m.score1 === null) return <td key={j} className="trn-xt-empty">·</td>
                  const cls = m.score1 > m.score2 ? 'trn-xt-w' : m.score1 < m.score2 ? 'trn-xt-l' : 'trn-xt-d'
                  return <td key={j} className={`trn-xt-cell ${cls}`}>{m.score1}–{m.score2}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Barre de progression ──────────────────────────────────────────────────────
function Progress({ done, total, label }) {
  const { t } = useTranslation()
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="trn-prog">
      <div className="trn-prog-label">{label || t('tournament.matchesPlayed', { done, total })}</div>
      <div className="trn-prog-track"><div className="trn-prog-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

function getTournamentMatches(tournament) {
  if (tournament.format === 'groups') return tournament.groups?.flatMap(g => g.matches) || []
  if (tournament.format === 'swiss') return tournament.rounds?.flatMap(r => r.matches) || []
  return tournament.matches || []
}

function isAllPlayed(matches) {
  return matches.length > 0 && matches.every(m => m.score1 !== null && m.score2 !== null)
}

function buildFinalRanking(tournament) {
  const allGroupMatches = getTournamentMatches(tournament)
  const groupStandings  = calcStandings(tournament.teams, allGroupMatches)
  const groupStatsOf    = t => groupStandings.find(s => s.team === t) ?? { pts: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 }

  // ── Classement complet (placement rounds) ──────────────────────────────────
  if (tournament.placementRounds?.length) {
    const n = tournament.teams.length
    const result = new Array(n).fill(null)

    tournament.placementRounds.forEach(({ forPos, match }) => {
      const [wp, lp] = forPos
      if (match.score1 !== null && match.score2 !== null) {
        const winner = match.score1 >= match.score2 ? match.team1 : match.team2
        const loser  = match.score1 >= match.score2 ? match.team2 : match.team1
        result[wp - 1] = { ...groupStatsOf(winner), team: winner }
        result[lp - 1] = { ...groupStatsOf(loser),  team: loser  }
      } else {
        // Match pas encore joué : remplit avec l'ordre de poule
        if (!result[wp - 1]) result[wp - 1] = { ...groupStatsOf(match.team1), team: match.team1 }
        if (!result[lp - 1]) result[lp - 1] = { ...groupStatsOf(match.team2), team: match.team2 }
      }
    })

    // Remplit les trous restants (byes, équipes non appariées)
    const placed = new Set(result.filter(Boolean).map(r => r.team))
    const unplaced = groupStandings.filter(s => !placed.has(s.team))
    let ui = 0
    for (let i = 0; i < n; i++) {
      if (!result[i] && unplaced[ui]) result[i] = unplaced[ui++]
    }
    return result.filter(Boolean)
  }

  // ── Knockout (phase finale) ────────────────────────────────────────────────
  const rounds = tournament.knockoutRounds
  if (!rounds || rounds.length === 0) return groupStandings

  const finalMatch = rounds[rounds.length - 1]?.matches?.[0]
  const koComplete = finalMatch?.score1 !== null && finalMatch?.score2 !== null
    && finalMatch.score1 !== finalMatch.score2
  if (!koComplete) return groupStandings

  const placed = new Set()
  const ranked = []

  const groupRankOf = t => groupStandings.findIndex(s => s.team === t)
  const add = t => { if (!placed.has(t)) { ranked.push({ ...groupStatsOf(t), team: t }); placed.add(t) } }

  // 1er : vainqueur de la finale
  add(finalMatch.score1 > finalMatch.score2 ? finalMatch.team1 : finalMatch.team2)
  // 2ème : finaliste
  add(finalMatch.score1 < finalMatch.score2 ? finalMatch.team1 : finalMatch.team2)

  // 3ème+ : perdants de chaque tour précédent (du plus récent au plus ancien)
  for (let ri = rounds.length - 2; ri >= 0; ri--) {
    const losers = rounds[ri].matches
      .filter(m => m.score1 !== null && m.score2 !== null && m.score1 !== m.score2)
      .map(m => m.score1 < m.score2 ? m.team1 : m.team2)
      .filter(t => !placed.has(t))
      .sort((a, b) => groupRankOf(a) - groupRankOf(b))
    losers.forEach(add)
  }

  // Restants : équipes éliminées en phase de poules, ordre classement de poule
  groupStandings.forEach(s => { if (!placed.has(s.team)) add(s.team) })

  return ranked
}

function getTournamentEndState(tournament) {
  const allMatches = getTournamentMatches(tournament)
  const knockoutDone = tournament.knockoutRounds
    ? tournament.knockoutRounds.every(r => r.matches.every(m => m.score1 !== null && m.score2 !== null && m.score1 !== m.score2))
    : false
  const placementDone = tournament.placementRounds?.length > 0
    && tournament.placementRounds.every(r => r.match.score1 !== null && r.match.score2 !== null)
  const finished = tournament.format === 'swiss'
    ? isRoundComplete(tournament.rounds?.[tournament.rounds.length - 1]) && tournament.rounds.length >= tournament.numSwissRounds
    : tournament.placementRounds
    ? isAllPlayed(allMatches) && placementDone
    : tournament.knockoutRounds
    ? isAllPlayed(allMatches) && knockoutDone
    : isAllPlayed(allMatches)

  const finalRanking = buildFinalRanking(tournament)
  const winner = finalRanking[0]?.team || null

  return { finished, finalRanking, winner, allMatches }
}

function downloadTournamentPdf(tournament) {
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

  doc.setFillColor(20, 30, 48)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(t('tournament.pdf.title'), left, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(t('tournament.pdf.exportLabel', { date: fmtDateTime(new Date().toISOString()), name: tournament.name }), left, 19)
  doc.text(t('tournament.pdf.teamsFormat', { count: tournament.teams.length, format: t(`tournament.formatLabel.${tournament.format === 'groups' ? 'groups' : tournament.format === 'swiss' ? 'swiss' : 'roundrobin'}`) }), left, 25)
  doc.setTextColor(15, 23, 42)
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
  const scale = maxW / cols.reduce((sum, col) => sum + col.w, 0)
  const sc = cols.map(col => ({ ...col, w: col.w * scale }))
  const rowH = 7
  function xOf(idx) { let x = left; for (let i = 0; i < idx; i++) x += sc[i].w; return x }

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

function FinalRankingTable({ ranking, hasKnockout }) {
  const { t } = useTranslation()
  return (
    <div className="trn-table-wrap">
      <table className="trn-table">
        <thead>
          <tr>
            <th>#</th>
            <th className="trn-th-team">{t('tournament.standings.team')}</th>
            <th title={t('tournament.standings.pts')}>{t('tournament.standings.pts')}</th>
            <th title={t('tournament.standings.diffTitle')}>{t('tournament.standings.diff')}</th>
            <th title={t('tournament.standings.gfTitle')}>{t('tournament.standings.gf')}</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.team} className={i === 0 ? 'trn-rank-first' : i === 1 ? 'trn-rank-second' : i === 2 ? 'trn-rank-third' : ''}>
              <td className="trn-rank">{i + 1}</td>
              <td className="trn-th-team">{r.team}</td>
              <td className="trn-pts">{r.pts}</td>
              <td className={r.gd > 0 ? 'trn-pos' : r.gd < 0 ? 'trn-neg' : ''}>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              <td>{r.gf}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasKnockout && (
        <div className="trn-ranking-note">{t('tournament.finalRankingNote')}</div>
      )}
    </div>
  )
}

function TournamentEnd({ tournament, onBack }) {
  const { t } = useTranslation()
  const { finalRanking, winner, allMatches } = getTournamentEndState(tournament)
  const topThree   = finalRanking.slice(0, 3)
  const totalPlayed = allMatches.filter(m => m.score1 !== null && m.score2 !== null).length
  const hasKnockout = !!tournament.knockoutRounds

  return (
    <div className="trn-end">
      <div className="trn-end-hero">
        <div className="trn-end-title">{t('tournament.finished')}</div>
        <div className="trn-end-subtitle">
          {winner ? t('tournament.winnerLabel', { winner }) : t('tournament.rankingAvailable')}
        </div>
        <div className="trn-end-meta">
          {t('tournament.matchesTeamsMeta', { played: totalPlayed, teams: tournament.teams.length })}
        </div>
      </div>

      <div className="trn-section">{t('tournament.podium')}</div>
      <div className="trn-podium">
        {topThree.map((row, i) => (
          <div key={row.team} className={`trn-podium-card trn-podium-${i + 1}`}>
            <div className="trn-podium-rank">#{i + 1}</div>
            <div className="trn-podium-team">{row.team}</div>
            <div className="trn-podium-points">{row.pts} pts</div>
          </div>
        ))}
      </div>

      <div className="trn-section">{t('tournament.finalRanking')}</div>
      <FinalRankingTable ranking={finalRanking} hasKnockout={hasKnockout} />

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-mini" onClick={() => downloadTournamentPdf(tournament)}>{t('history.pdfBtn')}</button>
        <button className="btn-acc trn-end-btn" onClick={onBack}>{t('tournament.backToList')}</button>
      </div>
    </div>
  )
}

function ValidationBanner({ onValidate }) {
  const { t } = useTranslation()
  return (
    <div className="trn-validate-banner">
      <div>
        <div className="trn-validate-title">{t('tournament.validateTitle')}</div>
        <div className="trn-validate-text">{t('tournament.validateText')}</div>
      </div>
      <button className="btn-acc trn-validate-btn" onClick={onValidate}>
        {t('tournament.validateButton')}
      </button>
    </div>
  )
}

// ── Vue Tous contre tous ──────────────────────────────────────────────────────
function RoundRobinView({ tournament, onUpdate, finished, onValidate }) {
  const { t } = useTranslation()
  const done = tournament.matches.filter(m => m.score1 !== null).length
  const perGroup = tournament.knockoutSize ?? 0

  return (
    <>
      <Progress done={done} total={tournament.matches.length} />
      <div className="trn-section">{t('tournament.crossTable')}</div>
      <CrossTable teams={tournament.teams} matches={tournament.matches} />

      <div className="trn-section">{t('tournament.standingsTitle')}</div>
      <Standings teams={tournament.teams} matches={tournament.matches} qualifyN={perGroup} />

      <div className="trn-section">{t('tournament.matches')}</div>
      <div className="trn-matches-list">
        {tournament.matches.map(m => (
          <MatchRow key={m.id + m.score1 + m.score2} match={m}
            onScore={(s1, s2) => onUpdate(setMatchScore(tournament, m.id, s1, s2))} />
        ))}
      </div>

      {canStartKnockout(tournament) && (
        <button className="btn-acc trn-ko-btn" onClick={() => onUpdate(startKnockout(tournament))}>
          {t('tournament.startKnockout')}
        </button>
      )}
      {tournament.knockoutRounds && (
        <>
          <div className="trn-section">{t('tournament.pdf.knockoutStage')}</div>
          <KnockoutBracket rounds={tournament.knockoutRounds}
            onScore={(ri, mi, s1, s2) => onUpdate(setKnockoutScore(tournament, ri, mi, s1, s2))} />
        </>
      )}

      {finished && (
        <ValidationBanner onValidate={onValidate} />
      )}
    </>
  )
}

// ── Vue Poules ────────────────────────────────────────────────────────────────
function GroupsView({ tournament, onUpdate, finished, onValidate }) {
  const { t } = useTranslation()
  const allMatches = tournament.groups.flatMap(g => g.matches)
  const done = allMatches.filter(m => m.score1 !== null).length
  const perGroup = tournament.knockoutSize ? Math.ceil(tournament.knockoutSize / tournament.groups.length) : 0

  return (
    <>
      <Progress done={done} total={allMatches.length} />

      <div className="trn-groups-grid">
        {tournament.groups.map(g => (
          <div key={g.id} className="trn-group">
            <div className="trn-group-hd">{g.name}</div>
            <CrossTable teams={g.teams} matches={g.matches} />
            <Standings teams={g.teams} matches={g.matches} qualifyN={perGroup} />
            <div className="trn-matches-list">
              {g.matches.map(m => (
                <MatchRow key={m.id + m.score1 + m.score2} match={m} compact
                  onScore={(s1, s2) => onUpdate(setMatchScore(tournament, m.id, s1, s2))} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {canStartKnockout(tournament) && (
        <button className="btn-acc trn-ko-btn" onClick={() => onUpdate(startKnockout(tournament))}>
          {t('tournament.startKnockout')}
        </button>
      )}
      {tournament.knockoutRounds && (
        <>
          <div className="trn-section">{t('tournament.pdf.knockoutStage')}</div>
          <KnockoutBracket rounds={tournament.knockoutRounds}
            onScore={(ri, mi, s1, s2) => onUpdate(setKnockoutScore(tournament, ri, mi, s1, s2))} />
        </>
      )}

      {canStartFullPlacement(tournament) && (
        <button className="btn-acc trn-ko-btn" onClick={() => onUpdate(startFullPlacement(tournament))}>
          {t('tournament.startPlacement')}
        </button>
      )}
      {tournament.placementRounds?.length > 0 && (
        <>
          <div className="trn-section">{t('tournament.placementMatchesTitle')}</div>
          <div className="trn-placement-list">
            {tournament.placementRounds.map((r, ri) => (
              <div key={r.id} className="trn-placement-row">
                <div className="trn-placement-label">{r.label}</div>
                <MatchRow
                  key={r.match.id + r.match.score1 + r.match.score2}
                  match={r.match}
                  onScore={(s1, s2) => onUpdate(setPlacementScore(tournament, ri, s1, s2))}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {finished && (
        <ValidationBanner onValidate={onValidate} />
      )}
    </>
  )
}

// ── Vue Ronde suisse ──────────────────────────────────────────────────────────
function SwissView({ tournament, onUpdate, finished, onValidate }) {
  const { t } = useTranslation()
  const allMatches = tournament.rounds.flatMap(r => r.matches)
  const currentRound = tournament.rounds[tournament.rounds.length - 1]
  const roundDone = isRoundComplete(currentRound)
  const canNext = roundDone && tournament.rounds.length < tournament.numSwissRounds
  const roundFinished = roundDone && tournament.rounds.length >= tournament.numSwissRounds;

  return (
    <>
      <div className="trn-prog-label" style={{ marginBottom: 4 }}>
        {t('tournament.roundLabel', { current: tournament.rounds.length, total: tournament.numSwissRounds })}
      </div>
      <div className="trn-prog-track" style={{ marginBottom: 12 }}>
        <div className="trn-prog-fill" style={{ width: `${Math.round(tournament.rounds.length / tournament.numSwissRounds * 100)}%` }} />
      </div>

      <div className="trn-section">{t('tournament.standingsTitle')}</div>
      <Standings teams={tournament.teams} matches={allMatches} />

      {tournament.rounds.map((round, ri) => (
        <div key={ri}>
          <div className="trn-section">{round.name}</div>
          <div className="trn-matches-list">
            {round.matches.map(m => (
              <MatchRow key={m.id + m.score1 + m.score2} match={m}
                onScore={(s1, s2) => onUpdate(setMatchScore(tournament, m.id, s1, s2))} />
            ))}
          </div>
        </div>
      ))}

      {canNext && (
        <button className="btn-acc trn-ko-btn" onClick={() => onUpdate(addSwissRound(tournament))}>
          {t('tournament.nextRound', { n: tournament.rounds.length + 1 })}
        </button>
      )}
      {finished && roundFinished && <ValidationBanner onValidate={onValidate} />}
    </>
  )
}

// ── Formulaire de création ────────────────────────────────────────────────────
const KNOCKOUT_OPTIONS = [
  { value: null, labelKey: 'tournament.knockoutOptions.none' },
  { value: 2,   labelKey: 'tournament.knockoutOptions.final' },
  { value: 4,   labelKey: 'tournament.knockoutOptions.semis' },
  { value: 8,   labelKey: 'tournament.knockoutOptions.quarters' },
  { value: 16,  labelKey: 'tournament.knockoutOptions.roundOf16' },
  { value: 32,  labelKey: 'tournament.knockoutOptions.roundOf32' },
]

function TournamentSetup({ onStart, onCancel }) {
  const { t } = useTranslation()
  const [name, setName]               = useState('')
  const [format, setFormat]           = useState('roundrobin')
  const [teamInput, setTeamInput]     = useState('')
  const [teams, setTeams]             = useState([])
  const [numGroups, setNumGroups]     = useState(2)
  const [knockoutSize, setKoSize]     = useState(null)
  const [swissRounds, setSwissRounds] = useState(5)
  const [fullPlacement, setFull]      = useState(false)

  function addTeam() {
    const name = teamInput.trim()
    if (name && !teams.includes(name)) { setTeams(p => [...p, name]); setTeamInput('') }
  }

  function handleStart() {
    if (teams.length < 2) return
    const n = name.trim() || t('tournament.setup.defaultName', { date: new Date().toLocaleDateString(i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR') })
    onStart(mkTournament({
      name: n, format, teams,
      numGroups: Number(numGroups),
      knockoutSize: fullPlacement ? null : knockoutSize,
      fullPlacement: format === 'groups' ? fullPlacement : false,
      numSwissRounds: Number(swissRounds),
    }))
  }

  const showKo = (format === 'roundrobin' || format === 'groups') && !fullPlacement

  return (
    <>
      <div className="trn-topbar">
        <button className="btn-mini" onClick={onCancel}>{t('tournament.setup.cancel')}</button>
        <div className="trn-topbar-title">{t('tournament.setup.title')}</div>
      </div>

      <div className="trn-setup">
        <div className="trn-field">
          <div className="flabel">{t('tournament.setup.nameLabel')}</div>
          <input type="text" placeholder={t('tournament.setup.namePlaceholder')} value={name}
            onChange={e => setName(e.target.value)} autoFocus />
        </div>

        <div className="trn-field">
          <div className="flabel">{t('tournament.setup.formatLabelField')}</div>
          <div className="seg">
            <button className={format === 'roundrobin' ? 'on' : ''} onClick={() => setFormat('roundrobin')}>{t('tournament.formatLabel.roundrobin')}</button>
            <button className={format === 'groups' ? 'on' : ''} onClick={() => setFormat('groups')}>{t('tournament.formatLabel.groups')}</button>
            <button className={format === 'swiss' ? 'on' : ''} onClick={() => setFormat('swiss')}>{t('tournament.formatLabel.swiss')}</button>
          </div>
        </div>

        {format === 'groups' && (
          <div className="trn-field">
            <div className="flabel">{t('tournament.setup.groupsCountLabel')}</div>
            <select className="sel" value={numGroups} onChange={e => { setNumGroups(e.target.value); setFull(false) }}>
              {[2, 3, 4, 6, 8].map(n => <option key={n} value={n}>{t('tournament.setup.groupsOption', { n })}</option>)}
            </select>
          </div>
        )}

        {format === 'groups' && (
          <label className="trn-toggle">
            <input type="checkbox" checked={fullPlacement} onChange={e => { setFull(e.target.checked); if (e.target.checked) setKoSize(null) }} />
            <span className="trn-toggle-track"><span className="trn-toggle-thumb" /></span>
            <span>{t('tournament.setup.fullPlacementLabel')}</span>
          </label>
        )}

        {format === 'swiss' && (
          <div className="trn-field">
            <div className="flabel">{t('tournament.setup.swissRoundsLabel')}</div>
            <input type="number" min="2" max="15" value={swissRounds}
              onChange={e => setSwissRounds(e.target.value)} />
          </div>
        )}

        {showKo && (
          <div className="trn-field">
            <div className="flabel">{t('tournament.setup.knockoutOptional')}</div>
            <select className="sel" value={knockoutSize === null ? 'null' : String(knockoutSize)}
              onChange={e => setKoSize(e.target.value === 'null' ? null : Number(e.target.value))}>
              {KNOCKOUT_OPTIONS.map(o => (
                <option key={String(o.value)} value={String(o.value)}>{t(o.labelKey)}</option>
              ))}
            </select>
          </div>
        )}

        <div className="trn-field">
          <div className="flabel">{t('tournament.setup.teamsLabel', { count: teams.length })}</div>
          <div className="trn-team-row">
            <input type="text" placeholder={t('tournament.setup.teamNamePlaceholder')} value={teamInput}
              onChange={e => setTeamInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTeam()} />
            <button className="btn-mini" onClick={addTeam}>{t('tournament.setup.addTeam')}</button>
          </div>
          {teams.length > 0 && (
            <div className="trn-chips">
              {teams.map(tm => (
                <div key={tm} className="trn-chip">
                  <span>{tm}</span>
                  <button onClick={() => setTeams(p => p.filter(x => x !== tm))}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="btn-acc" onClick={handleStart} disabled={teams.length < 2}>
          {t('tournament.setup.start')}
        </button>
      </div>
    </>
  )
}

// ── Détail d'un tournoi ───────────────────────────────────────────────────────
function TournamentDetail({ tournament, onUpdate, onBack, onValidate, validated }) {
  const { t } = useTranslation()
  const formatLabel = t('tournament.formatLabel', { returnObjects: true })
  const { finished } = getTournamentEndState(tournament)
  if (validated) {
    return (
      <div className="trn-detail">
        <div className="trn-topbar">
          <button className="btn-mini" onClick={onBack}>{t('tournament.back')}</button>
          <div>
            <div className="trn-topbar-title">{tournament.name}</div>
            <div className="trn-topbar-meta">
              {formatLabel[tournament.format]} · {t('tournament.teamsCount', { count: tournament.teams.length })}
            </div>
          </div>
        </div>

        <TournamentEnd tournament={tournament} onBack={onBack} />
      </div>
    )
  }

  return (
    <div className="trn-detail">
      <div className="trn-topbar">
        <button className="btn-mini" onClick={onBack}>{t('tournament.back')}</button>
        <div>
          <div className="trn-topbar-title">{tournament.name}</div>
          <div className="trn-topbar-meta">
            {formatLabel[tournament.format]} · {t('tournament.teamsCount', { count: tournament.teams.length })}
          </div>
        </div>
      </div>

      {tournament.format === 'roundrobin' && <RoundRobinView tournament={tournament} onUpdate={onUpdate} finished={finished} onValidate={() => onValidate(tournament.id)} />}
      {tournament.format === 'groups'     && <GroupsView     tournament={tournament} onUpdate={onUpdate} finished={finished} onValidate={() => onValidate(tournament.id)} />}
      {tournament.format === 'swiss'      && <SwissView      tournament={tournament} onUpdate={onUpdate} finished={finished} onValidate={() => onValidate(tournament.id)} />}
    </div>
  )
}

// ── Écran principal Tournois ──────────────────────────────────────────────────
export default function Tournament({ tournaments, onSave, onBack }) {
  const { t } = useTranslation()
  const initialUi = loadTournamentUi()
  const [view, setView]       = useState(initialUi.view)
  const [active, setActive]   = useState(() => tournaments.find(t => t.id === initialUi.activeId) || null)
  const [validatedIds, setValidatedIds] = useState([])

  useEffect(() => {
    if (!active) return
    const nextActive = tournaments.find(t => t.id === active.id)
    if (!nextActive) {
      setActive(null)
      setView('list')
      setValidatedIds(ids => ids.filter(id => id !== active.id))
      return
    }
    if (nextActive !== active) setActive(nextActive)
  }, [tournaments, active])

  useEffect(() => {
    if (view !== 'detail' || active) return
    const restored = tournaments.find(t => t.id === initialUi.activeId)
    if (restored) setActive(restored)
  }, [view, active, tournaments, initialUi.activeId])

  useEffect(() => {
    try {
      localStorage.setItem(TOURNAMENT_UI_KEY, JSON.stringify({
        view,
        activeId: active?.id || null,
      }))
    } catch {}
  }, [view, active])

  function handleStart(t) {
    const next = [t, ...tournaments]
    onSave(next); setActive(t); setView('detail')
  }

  function handleUpdate(updated) {
    const next = tournaments.map(t => t.id === updated.id ? updated : t)
    onSave(next); setActive(updated)
    setValidatedIds(ids => ids.filter(id => id !== updated.id))
  }

  function handleValidate(id) {
    setValidatedIds(ids => ids.includes(id) ? ids : [id, ...ids])
  }

  function handleDelete(id) {
    if (!window.confirm(t('tournament.deleteConfirm'))) return
    onSave(tournaments.filter(t => t.id !== id))
    setValidatedIds(ids => ids.filter(vId => vId !== id))
    if (active?.id === id) setView('list')
  }

  if (view === 'setup')
    return <TournamentSetup onStart={handleStart} onCancel={() => setView('list')} />

  if (view === 'detail' && active)
    return (
      <TournamentDetail
        tournament={active}
        onUpdate={handleUpdate}
        onBack={() => setView('list')}
        onValidate={handleValidate}
        validated={validatedIds.includes(active.id)}
      />
    )

  return (
    <div className="trn-list-screen">
      <div className="trn-topbar">
        <button className="btn-mini" onClick={onBack}>{t('tournament.home')}</button>
        <div>
          <div className="trn-topbar-title">{t('tournament.title')}</div>
          <div className="trn-topbar-meta">{t('tournament.subtitle')}</div>
        </div>
        <button className="btn-acc trn-new-btn" onClick={() => setView('setup')}>{t('tournament.newButton')}</button>
      </div>

      {tournaments.length === 0 ? (
        <div className="trn-empty">
          <div>{t('tournament.empty')}</div>
          <button className="btn-acc" onClick={() => setView('setup')}>{t('tournament.createButton')}</button>
        </div>
      ) : (
        <div className="trn-list">
          {tournaments.map(tour => {
            const allMatches = tour.format === 'groups'
              ? tour.groups?.flatMap(g => g.matches) ?? []
              : tour.format === 'swiss'
              ? tour.rounds?.flatMap(r => r.matches) ?? []
              : tour.matches ?? []
            const done = allMatches.filter(m => m.score1 !== null).length
            const formatLabel = t('tournament.formatLabel', { returnObjects: true })
            return (
              <div key={tour.id} className="trn-item" onClick={() => { setActive(tour); setView('detail') }}>
                <div className="trn-item-info">
                  <div className="trn-item-name">{tour.name}</div>
                  <div className="trn-item-meta">
                    {t('tournament.itemMeta', { format: formatLabel[tour.format], teams: tour.teams.length, done, total: allMatches.length })}
                    {tour.createdAt && <> · {fmtDateTime(tour.createdAt)}</>}
                  </div>
                </div>
                <button className="trn-item-del" onClick={e => { e.stopPropagation(); handleDelete(tour.id) }}>×</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
