// Vue d'ensemble d'un tournoi, quel que soit son format : tous les matchs à plat
// avec leur contexte (poule, ronde, phase finale…) et la fonction qui enregistre
// leur score, les prochains matchs, les derniers résultats, la forme des équipes
// et l'action qui débloque la suite.
import {
  addSwissRound, calcStandings, canStartFullPlacement, canStartKnockout,
  isRoundComplete, setKnockoutScore, setMatchScore, setPlacementScore,
  startFullPlacement, startKnockout,
} from '../../lib/tournament'

export const isPlayed = m => m.score1 !== null && m.score2 !== null
const isTbd = m => m.team1 === 'TBD' || m.team2 === 'TBD'

// [{ match, label, stage, order, save(tour, s1, s2) → tour }]
export function listFixtures(tour) {
  const list = []
  const push = (match, label, stage, save) => list.push({ match, label, stage, order: list.length, save })

  if (tour.format === 'roundrobin') {
    tour.matches.forEach(m => push(m, null, 'league', (t, a, b) => setMatchScore(t, m.id, a, b)))
  } else if (tour.format === 'groups') {
    // Les poules jouent en parallèle : on entrelace leurs matchs (A1, B1, A2, B2…).
    const longest = Math.max(0, ...tour.groups.map(g => g.matches.length))
    for (let i = 0; i < longest; i++) {
      tour.groups.forEach(g => {
        const m = g.matches[i]
        if (m) push(m, g.name, 'group', (t, a, b) => setMatchScore(t, m.id, a, b))
      })
    }
  } else if (tour.format === 'swiss') {
    tour.rounds.forEach(r => r.matches.forEach(m => push(m, r.name, 'swiss', (t, a, b) => setMatchScore(t, m.id, a, b))))
  }

  tour.knockoutRounds?.forEach((r, ri) => r.matches.forEach((m, mi) =>
    push(m, r.name, 'knockout', (t, a, b) => setKnockoutScore(t, ri, mi, a, b))))
  tour.placementRounds?.forEach((r, ri) =>
    push(r.match, r.label, 'placement', (t, a, b) => setPlacementScore(t, ri, a, b)))

  return list
}

// Matchs prêts à être joués (équipes connues, pas encore de score), dans l'ordre.
export const upcoming = fixtures => fixtures.filter(f => !isPlayed(f.match) && !isTbd(f.match))

// Matchs joués, du plus récent au plus ancien.
export function recentResults(fixtures) {
  return fixtures
    .filter(f => isPlayed(f.match))
    .sort((a, b) => String(b.match.playedAt || '').localeCompare(String(a.match.playedAt || '')) || b.order - a.order)
}

export const involves = (f, team) => !team || f.match.team1 === team || f.match.team2 === team

// Derniers résultats d'une équipe, du plus ancien au plus récent : 'W' | 'D' | 'L'.
export function teamForm(team, fixtures, n = 5) {
  return recentResults(fixtures)
    .filter(f => involves(f, team))
    .slice(0, n)
    .reverse()
    .map(({ match: m }) => {
      const mine = m.team1 === team ? m.score1 : m.score2
      const theirs = m.team1 === team ? m.score2 : m.score1
      return mine > theirs ? 'W' : mine < theirs ? 'L' : 'D'
    })
}

// Tableaux de classement à afficher : un par poule, ou un seul.
export function standingTables(tour) {
  if (tour.format === 'groups') {
    const perGroup = tour.knockoutSize ? Math.ceil(tour.knockoutSize / tour.groups.length) : 0
    return tour.groups.map(g => ({ id: g.id, title: g.name, rows: calcStandings(g.teams, g.matches), qualifyN: perGroup, matches: g.matches, teams: g.teams }))
  }
  const matches = tour.format === 'swiss' ? tour.rounds.flatMap(r => r.matches) : tour.matches
  return [{ id: 'all', title: null, rows: calcStandings(tour.teams, matches), qualifyN: tour.knockoutSize || 0, matches, teams: tour.teams }]
}

// Étape suivante qui dépend de l'organisateur, ou null.
export function nextStep(tour) {
  if (canStartKnockout(tour)) return { kind: 'knockout', apply: startKnockout }
  if (canStartFullPlacement(tour)) return { kind: 'placement', apply: startFullPlacement }
  if (tour.format === 'swiss') {
    const current = tour.rounds[tour.rounds.length - 1]
    if (isRoundComplete(current) && tour.rounds.length < tour.numSwissRounds) {
      return { kind: 'swissRound', n: tour.rounds.length + 1, apply: addSwissRound }
    }
  }
  return null
}

// Phase en cours, pour l'en-tête.
export function currentPhase(tour, fixtures) {
  const next = upcoming(fixtures)[0]
  if (next) return next.label
  return null
}
