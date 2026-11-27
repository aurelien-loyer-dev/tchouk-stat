// Saison : cumul des stats de chaque joueur sur tous les matchs joués en mode
// « stats joueurs » de l'historique. Un joueur est reconnu par son nom (sans
// tenir compte des majuscules ni des espaces en trop).
import { PLAYER_STATS, playSeconds, playerDerivedStats } from './playerStats'

export const STAT_IDS = PLAYER_STATS.map(s => s.id)
export const playerKey = name => String(name || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr')

const zero = () => Object.fromEntries(STAT_IDS.map(id => [id, 0]))

// history : liste normalisée (récent → ancien). since : date ISO (facultatif).
// → [{ key, name, teams: [nom…] (la plus récente d'abord), matches: [{ id,
//    playedAt, team, opponent, result: 'W'|'D'|'L'|null, stats }],
//    totals, derived, played, perMatch }]
export function seasonPlayers(history, { since = null } = {}) {
  const byKey = new Map()
  const games = [...history].filter(m => m.mode === 'player' && m.players?.length)
    .filter(m => !since || (m.playedAt && m.playedAt >= since))
    .sort((a, b) => String(a.playedAt).localeCompare(String(b.playedAt))) // ancien → récent

  for (const m of games) {
    for (const p of m.players) {
      const key = playerKey(p.name)
      if (!key) continue
      const team = m.teams[p.teamIdx]
      const opp = m.teams.length === 2 ? m.teams[1 - p.teamIdx] : null
      const result = opp && team ? (team.score > opp.score ? 'W' : team.score < opp.score ? 'L' : 'D') : null
      const stats = Object.fromEntries(STAT_IDS.map(id => [id, Number(p[id]) || 0]))
      if (!byKey.has(key)) byKey.set(key, { key, name: p.name.trim(), teams: [], matches: [], totals: zero() })
      const entry = byKey.get(key)
      entry.name = p.name.trim() // casse du match le plus récent
      if (team?.name) entry.teams = [team.name, ...entry.teams.filter(n => n !== team.name)]
      const playSec = playSeconds(p)
      entry.matches.push({ id: m.id, playedAt: m.playedAt, team: team?.name || '', opponent: opp?.name || null, result, stats, playSec })
      if (playSec != null) { entry.playSec = (entry.playSec || 0) + playSec; entry.timedMatches = (entry.timedMatches || 0) + 1 }
      STAT_IDS.forEach(id => { entry.totals[id] += stats[id] })
    }
  }

  return [...byKey.values()].map(e => ({
    ...e,
    played: e.matches.length,
    derived: playerDerivedStats(e.totals),
    perMatch: e.matches.length ? e.totals.pointsMarques / e.matches.length : 0,
  }))
}

// Début de la saison sportive en cours (1er septembre).
export function seasonStart(now = new Date()) {
  const y = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return new Date(y, 8, 1).toISOString()
}
