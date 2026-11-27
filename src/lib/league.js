// ── Championnat sur plusieurs journées ───────────────────────────────────
// Un championnat regroupe des tournois (une journée chacun). Chaque journée
// rapporte des points selon le classement final de l'équipe ce jour-là ; le
// classement général additionne les journées. Équipes reconnues par leur nom.
import { getTournamentEndState } from './tournament'

export const SCALES = {
  // Dernier = 1 point, avant-dernier = 2… (s'adapte au nombre d'équipes du jour)
  rank: (rank, n) => Math.max(1, n - rank + 1),
  // Barème fixe façon circuit : 10, 8, 6, 5, 4, 3, 2, puis 1 point de participation
  fixed: rank => [10, 8, 6, 5, 4, 3, 2][rank - 1] ?? 1,
}

const teamKey = name => String(name || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr')

// → { days: [{ tournament, finished, ranking: [team…] }], rows: [{ team, pts,
//     played, best, results: [{ rank, pts } | null] (une par journée) }] }
export function leagueStandings(league, tournaments) {
  const scale = SCALES[league.scale] || SCALES.rank
  const days = league.tournamentIds
    .map(id => tournaments.find(t => t.id === id))
    .filter(Boolean)
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
    .map(tournament => {
      const { finished, finalRanking } = getTournamentEndState(tournament)
      return { tournament, finished, ranking: finalRanking.map(r => r.team) }
    })

  const byKey = new Map()
  days.forEach((day, di) => {
    const n = day.ranking.length
    day.ranking.forEach((team, i) => {
      const key = teamKey(team)
      if (!byKey.has(key)) byKey.set(key, { team, pts: 0, played: 0, best: Infinity, places: [], results: days.map(() => null) })
      const row = byKey.get(key)
      row.team = team // nom de la journée la plus récente
      const rank = i + 1
      const pts = scale(rank, n)
      row.results[di] = { rank, pts, provisional: !day.finished }
      row.pts += pts
      row.played++
      row.best = Math.min(row.best, rank)
      row.places.push(rank)
    })
  })

  // Égalité : plus de victoires de journée, puis de 2es places…, puis meilleur rang.
  const rows = [...byKey.values()].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    for (let r = 1; r <= 8; r++) {
      const ca = a.places.filter(p => p === r).length, cb = b.places.filter(p => p === r).length
      if (ca !== cb) return cb - ca
    }
    return a.best - b.best || a.team.localeCompare(b.team)
  })
  return { days, rows }
}

const KEY = 'tchouk_leagues'
export function loadLeagues() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
export function saveLeagues(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch {}
}
