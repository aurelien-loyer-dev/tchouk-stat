import { newId } from './format'

export function mkMatch(team1, team2) {
  return { id: newId(), team1, team2, score1: null, score2: null }
}

// Algorithme de Berger (méthode du cercle) :
// génère des rondes où chaque équipe joue exactement une fois → zéro back-to-back au sein d'une ronde.
// Pour n impair, un "bye" fictif est ajouté puis retiré.
export function genRoundRobinMatches(teams) {
  const n = teams.length
  if (n < 2) return []

  const circle = n % 2 === 0 ? [...teams] : [...teams, null]
  const N = circle.length
  const rounds = []

  for (let r = 0; r < N - 1; r++) {
    const round = []
    for (let i = 0; i < N / 2; i++) {
      const t1 = circle[i]
      const t2 = circle[N - 1 - i]
      if (t1 !== null && t2 !== null) round.push(mkMatch(t1, t2))
    }
    rounds.push(round)
    // Rotation : fixe circle[0], décale circle[1..N-1] d'un cran
    const last = circle[N - 1]
    for (let i = N - 1; i > 1; i--) circle[i] = circle[i - 1]
    circle[1] = last
  }

  return rounds.flat()
}

export function genGroups(teams, numGroups) {
  const shuffled = [...teams].sort(() => Math.random() - 0.5)
  const groups = Array.from({ length: numGroups }, (_, i) => ({
    id: newId(),
    name: `Poule ${String.fromCharCode(65 + i)}`,
    teams: [],
    matches: [],
  }))
  shuffled.forEach((t, i) => groups[i % numGroups].teams.push(t))
  groups.forEach(g => { g.matches = genRoundRobinMatches(g.teams) })
  return groups
}

export function calcStandings(teamNames, matches) {
  const s = Object.fromEntries(
    teamNames.map(t => [t, { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 }])
  )
  matches.forEach(m => {
    if (m.score1 === null || m.score2 === null) return
    const { score1: s1, score2: s2 } = m
    s[m.team1].played++; s[m.team1].gf += s1; s[m.team1].ga += s2
    s[m.team2].played++; s[m.team2].gf += s2; s[m.team2].ga += s1
    if (s1 > s2)      { s[m.team1].won++; s[m.team1].pts += 3; s[m.team2].lost++ }
    else if (s2 > s1) { s[m.team2].won++; s[m.team2].pts += 3; s[m.team1].lost++ }
    else              { s[m.team1].drawn++; s[m.team1].pts++; s[m.team2].drawn++; s[m.team2].pts++ }
  })
  return Object.values(s)
    .map(r => ({ ...r, gd: r.gf - r.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team))
}

function hasPlayed(t1, t2, matches) {
  return matches.some(m =>
    (m.team1 === t1 && m.team2 === t2) || (m.team1 === t2 && m.team2 === t1)
  )
}

export function pairSwissRound(standings, allMatches) {
  const used = new Set()
  const ordered = [...standings].sort((a, b) => b.pts - a.pts || b.gd - a.gd)
  const pairs = []

  for (let i = 0; i < ordered.length; i++) {
    if (used.has(ordered[i].team)) continue
    let found = false
    for (let j = i + 1; j < ordered.length; j++) {
      if (used.has(ordered[j].team)) continue
      if (!hasPlayed(ordered[i].team, ordered[j].team, allMatches)) {
        pairs.push(mkMatch(ordered[i].team, ordered[j].team))
        used.add(ordered[i].team); used.add(ordered[j].team)
        found = true; break
      }
    }
    if (!found) {
      for (let j = i + 1; j < ordered.length; j++) {
        if (!used.has(ordered[j].team)) {
          pairs.push(mkMatch(ordered[i].team, ordered[j].team))
          used.add(ordered[i].team); used.add(ordered[j].team)
          break
        }
      }
    }
  }
  return pairs
}

const ROUND_NAMES = { 32: '16èmes de finale', 16: '8èmes de finale', 8: 'Quarts de finale', 4: 'Demi-finales', 2: 'Finale' }

export function genKnockoutBracket(seededTeams, size) {
  const rounds = []
  let n = size
  while (n >= 2) {
    const name = ROUND_NAMES[n] || `Tour de ${n}`
    const isFirst = rounds.length === 0
    const matches = Array.from({ length: n / 2 }, (_, i) =>
      isFirst
        ? mkMatch(seededTeams[i * 2] || 'TBD', seededTeams[i * 2 + 1] || 'TBD')
        : mkMatch('TBD', 'TBD')
    )
    rounds.push({ name, matches })
    n = n / 2
  }
  return rounds
}

export function advanceKnockout(rounds, roundIdx, matchIdx) {
  const m = rounds[roundIdx].matches[matchIdx]
  if (m.score1 === null || m.score2 === null || m.score1 === m.score2) return rounds
  const winner = m.score1 > m.score2 ? m.team1 : m.team2
  const next = rounds[roundIdx + 1]
  if (!next) return rounds
  const nmi = Math.floor(matchIdx / 2)
  const slot = matchIdx % 2 === 0 ? 'team1' : 'team2'
  return rounds.map((r, ri) => ri !== roundIdx + 1 ? r : {
    ...r,
    matches: r.matches.map((nm, mi) => mi !== nmi ? nm : { ...nm, [slot]: winner, score1: null, score2: null })
  })
}

export function mkTournament({ name, format, teams, numGroups, knockoutSize, numSwissRounds }) {
  const base = { id: newId(), name, format, teams, createdAt: new Date().toISOString() }
  if (format === 'roundrobin')
    return { ...base, matches: genRoundRobinMatches(teams), knockoutSize: knockoutSize || null, knockoutRounds: null }
  if (format === 'groups')
    return { ...base, groups: genGroups(teams, numGroups || 2), knockoutSize: knockoutSize || null, knockoutRounds: null }
  if (format === 'swiss') {
    const standings = teams.map(t => ({ team: t, pts: 0, gd: 0 }))
    return {
      ...base,
      numSwissRounds: numSwissRounds || Math.max(5, Math.ceil(Math.log2(teams.length)) + 1),
      rounds: [{ name: 'Ronde 1', matches: pairSwissRound(standings, []) }],
    }
  }
  return base
}

export function setMatchScore(tournament, matchId, score1, score2) {
  if (tournament.format === 'roundrobin')
    return { ...tournament, matches: tournament.matches.map(m => m.id === matchId ? { ...m, score1, score2 } : m) }
  if (tournament.format === 'groups')
    return { ...tournament, groups: tournament.groups.map(g => ({ ...g, matches: g.matches.map(m => m.id === matchId ? { ...m, score1, score2 } : m) })) }
  if (tournament.format === 'swiss')
    return { ...tournament, rounds: tournament.rounds.map(r => ({ ...r, matches: r.matches.map(m => m.id === matchId ? { ...m, score1, score2 } : m) })) }
  return tournament
}

export function setKnockoutScore(tournament, roundIdx, matchIdx, score1, score2) {
  const updated = tournament.knockoutRounds.map((r, ri) =>
    ri !== roundIdx ? r : { ...r, matches: r.matches.map((m, mi) => mi !== matchIdx ? m : { ...m, score1, score2 }) }
  )
  return { ...tournament, knockoutRounds: advanceKnockout(updated, roundIdx, matchIdx) }
}

export function canStartKnockout(t) {
  if (!t.knockoutSize || t.knockoutRounds) return false
  if (t.format === 'roundrobin') return t.matches.every(m => m.score1 !== null)
  if (t.format === 'groups') return t.groups.every(g => g.matches.every(m => m.score1 !== null))
  return false
}

export function startKnockout(tournament) {
  let seeded = []
  if (tournament.format === 'roundrobin') {
    seeded = calcStandings(tournament.teams, tournament.matches).map(s => s.team)
  } else if (tournament.format === 'groups') {
    const size = tournament.knockoutSize
    const perGroup = Math.ceil(size / tournament.groups.length)
    tournament.groups.forEach(g => {
      seeded.push(...calcStandings(g.teams, g.matches).slice(0, perGroup).map(s => s.team))
    })
    while (seeded.length < size) seeded.push('TBD')
    seeded = seeded.slice(0, size)
  }
  return { ...tournament, knockoutRounds: genKnockoutBracket(seeded, tournament.knockoutSize) }
}

export function addSwissRound(tournament) {
  const allMatches = tournament.rounds.flatMap(r => r.matches)
  const standings = calcStandings(tournament.teams, allMatches)
  const n = tournament.rounds.length + 1
  return { ...tournament, rounds: [...tournament.rounds, { name: `Ronde ${n}`, matches: pairSwissRound(standings, allMatches) }] }
}

export function isRoundComplete(round) {
  return round.matches.length > 0 && round.matches.every(m => m.score1 !== null && m.score2 !== null)
}
