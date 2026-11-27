// Contenu des images à partager, à partir des données de l'app.
import i18n from '../i18n'
import { mvpScore, defScore } from '../features/playerResults/awards'
import { getTournamentEndState } from './tournament'
import { playerImage, podiumImage, scoreImage, slug } from './shareImage'

const fmtDate = iso => {
  const d = iso ? new Date(iso) : new Date()
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

const best = (players, fn) => {
  if (!players?.length) return null
  const top = Math.max(...players.map(fn))
  const who = players.filter(p => fn(p) === top)
  return { names: who.slice(0, 2).map(p => p.name).join(', ') + (who.length > 2 ? '…' : ''), top }
}

// Match terminé (résumé enregistré dans l'historique, tous modes).
export function matchShare(match, t, extraLines = []) {
  const n = match.numTeams ?? 2
  const colors = match.settings?.teamColors || []
  const teams = (match.teams || []).slice(0, n).map((tm, i) => ({ name: tm.name || t(i ? 'playerResults.defaultTeam2' : 'playerResults.defaultTeam1'), score: tm.score ?? 0, color: colors[i] }))
  const two = teams.length === 2
  const result = two ? (teams[0].score === teams[1].score ? t('history.draw') : t('history.winner', { team: teams[0].score > teams[1].score ? teams[0].name : teams[1].name })) : null
  const s = match.settings
  const meta = s?.halfCount && s?.halfDurationMin ? `${s.halfCount} × ${s.halfDurationMin} min` : null

  const lines = []
  if (match.mode === 'player' && match.players?.length) {
    const pl = match.players
    const sc = best(pl, p => p.pointsMarques || 0)
    if (sc && sc.top > 0) lines.push({ label: t('shareImg.topScorer'), value: `${sc.names} · ${sc.top} ${t('playerMatch.ptsShort')}` })
    const mvp = best(pl, mvpScore)
    if (mvp) lines.push({ label: t('shareImg.mvp'), value: mvp.names })
    const def = best(pl, defScore)
    if (def && def.top > 0) lines.push({ label: t('shareImg.bestDefender'), value: def.names })
  } else if (match.mode === 'stats' && two) {
    const [a, b] = match.teams
    lines.push({ label: t('shareImg.shots'), value: `${a.tirs ?? 0} – ${b.tirs ?? 0}` })
    lines.push({ label: t('shareImg.catches'), value: `${a.tCatche ?? 0} – ${b.tCatche ?? 0}` })
    lines.push({ label: t('shareImg.fouls'), value: `${a.fautes ?? 0} – ${b.fautes ?? 0}` })
  }

  lines.push(...extraLines)

  return {
    title: two ? `${teams[0].name} ${teams[0].score} – ${teams[1].score} ${teams[1].name}` : `${teams[0]?.name} ${teams[0]?.score}`,
    filename: `score-${slug(teams.map(x => x.name).join('-'))}.png`,
    build: () => scoreImage({ kicker: t('shareImg.finalScore'), date: fmtDate(match.playedAt), teams, result, meta, lines }),
  }
}

// Fiche joueur de la saison (Season → PlayerDetail).
export function playerShare(player, t) {
  const played = player.played || 0
  const one = x => (Math.round(x * 10) / 10).toLocaleString(i18n.language)
  const tiles = [
    { label: t('season.cols.played'), value: played },
    { label: t('season.cols.pts'), value: player.totals.pointsMarques },
    { label: t('season.cols.avg'), value: played ? one(player.totals.pointsMarques / played) : '0' },
    { label: t('season.cols.eff'), value: player.derived.effOff == null ? '—' : `${Math.round(player.derived.effOff * 100)} %` },
    { label: t('season.cols.def'), value: player.derived.defTotal },
    player.playSec != null
      ? { label: t('shareImg.minutes'), value: Math.round(player.playSec / 60) }
      : { label: t('season.cols.fouls'), value: player.derived.fautesTotal },
  ]
  return {
    title: player.name,
    filename: `joueur-${slug(player.name)}.png`,
    build: () => playerImage({
      kicker: t('shareImg.seasonKicker'), date: fmtDate(),
      name: player.name, team: player.teams.join(', '),
      tiles, series: player.matches.map(m => m.stats.pointsMarques || 0), seriesLabel: t('shareImg.pointsPerMatch'),
    }),
  }
}

// Tournoi terminé : podium et classement final.
export function tournamentShare(tour, t) {
  const { finalRanking, allMatches } = getTournamentEndState(tour)
  const played = allMatches.filter(m => m.score1 !== null && m.score2 !== null).length
  return {
    title: tour.name,
    filename: `tournoi-${slug(tour.name)}.png`,
    build: () => podiumImage({
      kicker: t('shareImg.tournamentKicker'), date: fmtDate(tour.createdAt),
      title: tour.name, championLabel: t('shareImg.champion'),
      meta: t('tournament.matchesTeamsMeta', { played, teams: tour.teams.length }),
      ranking: finalRanking.map(r => ({ team: r.team, value: r.pts != null ? `${r.pts} pts` : '' })),
    }),
  }
}

// Championnat : classement général.
export function leagueShare(league, standings, t) {
  const done = standings.days.filter(d => d.finished).length
  return {
    title: league.name,
    filename: `championnat-${slug(league.name)}.png`,
    build: () => podiumImage({
      kicker: t('shareImg.leagueKicker'), date: fmtDate(),
      title: league.name, championLabel: done === standings.days.length ? t('shareImg.champion') : t('shareImg.leader'),
      meta: t('shareImg.leagueMeta', { count: done, total: standings.days.length }),
      ranking: standings.rows.map(r => ({ team: r.team, value: `${r.pts} pts` })),
    }),
  }
}
