import { newId } from './format'
import i18n from '../i18n'

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
    name: i18n.t('tournamentGen.group', { letter: String.fromCharCode(65 + i) }),
    teams: [],
    matches: [],
  }))
  shuffled.forEach((t, i) => groups[i % numGroups].teams.push(t))
  groups.forEach(g => { g.matches = genRoundRobinMatches(g.teams) })
  return groups
}

// Calcule les stats de confrontation directe entre deux équipes
function headToHeadStats(team1, team2, matches) {
  const h2h = { won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0, played: 0 }
  matches.forEach(m => {
    if (m.score1 === null || m.score2 === null) return
    const { score1: s1, score2: s2 } = m
    if (m.team1 === team1 && m.team2 === team2) {
      h2h.played++; h2h.gf += s1; h2h.ga += s2
      if (s1 > s2)      { h2h.won++; h2h.pts += 3 }
      else if (s2 > s1) { h2h.lost++; h2h.pts += 0 }
      else              { h2h.drawn++; h2h.pts += 1 }
    }
    if (m.team1 === team2 && m.team2 === team1) {
      h2h.played++; h2h.gf += s2; h2h.ga += s1
      if (s2 > s1)      { h2h.won++; h2h.pts += 3 }
      else if (s1 > s2) { h2h.lost++; h2h.pts += 0 }
      else              { h2h.drawn++; h2h.pts += 1 }
    }
  })
  return h2h
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
  const standings = Object.values(s)
    .map(r => ({ ...r, gd: r.gf - r.ga }))

  // Trier avec tiebreaker complet sur confrontations directes et cas extremes
  return standings.sort((a, b) => {
    // 1. Trier par points
    if (b.pts !== a.pts) return b.pts - a.pts
    
    // 2. Si même nombre de points, comparer confrontations directes
    const h2hA = headToHeadStats(a.team, b.team, matches)
    const h2hB = headToHeadStats(b.team, a.team, matches)
    
    // 2.1 Points en confrontation directe
    if (h2hA.pts !== h2hB.pts) return h2hB.pts - h2hA.pts
    
    // 2.2 Si elles se sont affrontées, utiliser la confrontation directe pour départager
    if (h2hA.played > 0) {
      const h2hGdA = h2hA.gf - h2hA.ga
      const h2hGdB = h2hB.gf - h2hB.ga
      if (h2hGdA !== h2hGdB) return h2hGdB - h2hGdA
      if (h2hA.gf !== h2hB.gf) return h2hB.gf - h2hA.gf
    }
    
    // 3. Différence buts générale
    if (b.gd !== a.gd) return b.gd - a.gd
    
    // 4. Buts marqués généraux
    if (b.gf !== a.gf) return b.gf - a.gf
    
    // 5. Nombre de victoires (cas extrême : même pts, même différence buts, même BP)
    if (b.won !== a.won) return b.won - a.won
    
    // 6. Nombre de matchs joués (équipes avec byes/moins de matchs)
    if (b.played !== a.played) return b.played - a.played
    
    // 7. Buts concédés (meilleure défense en cas d'égalité complète)
    if (a.ga !== b.ga) return a.ga - b.ga
    
    // 8. Ordre alphabétique en dernier recours
    return a.team.localeCompare(b.team)
  })
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

function roundNames() {
  return { 32: i18n.t('tournamentGen.roundOf16'), 16: i18n.t('tournamentGen.roundOf8'), 8: i18n.t('tournamentGen.quarterFinals'), 4: i18n.t('tournamentGen.semiFinals'), 2: i18n.t('tournamentGen.final') }
}

export function genKnockoutBracket(seededTeams, size) {
  const rounds = []
  let n = size
  while (n >= 2) {
    const name = roundNames()[n] || i18n.t('tournamentGen.roundOf', { n })
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

// ── Classement complet : chaque rang de toutes les poules s'affronte ────────
// Ex : 2 poules de 4 → 4 matchs : 1A vs 1B (1re/2e place), 2A vs 2B (3e/4e)…
export function genPlacementMatches(groups) {
  const standings = groups.map(g => calcStandings(g.teams, g.matches))
  const maxRank   = Math.max(...standings.map(s => s.length))
  const rounds    = []
  let pos = 1

  for (let rank = 0; rank < maxRank; rank++) {
    const teamsAtRank = standings.map(s => s[rank]?.team).filter(Boolean)
    for (let i = 0; i + 1 < teamsAtRank.length; i += 2) {
      rounds.push({
        id:     newId(),
        label:  i18n.t('tournamentGen.placementLabel', { pos1: pos, pos2: pos + 1 }),
        forPos: [pos, pos + 1],
        match:  mkMatch(teamsAtRank[i], teamsAtRank[i + 1]),
      })
      pos += 2
    }
    if (teamsAtRank.length % 2 !== 0) pos++ // bye si nombre impair de poules
  }
  return rounds
}

export function canStartFullPlacement(t) {
  return !!(t.fullPlacement && !t.placementRounds && t.format === 'groups'
    && t.groups.every(g => g.matches.every(m => m.score1 !== null)))
}

export function startFullPlacement(tournament) {
  return { ...tournament, placementRounds: genPlacementMatches(tournament.groups) }
}

export function setPlacementScore(tournament, roundIdx, score1, score2) {
  return {
    ...tournament,
    placementRounds: tournament.placementRounds.map((r, ri) =>
      ri !== roundIdx ? r : { ...r, match: { ...r.match, score1, score2 } }
    ),
  }
}

export function mkTournament({ name, format, teams, numGroups, knockoutSize, fullPlacement, numSwissRounds }) {
  const base = { id: newId(), name, format, teams, createdAt: new Date().toISOString() }
  if (format === 'roundrobin')
    return { ...base, matches: genRoundRobinMatches(teams), knockoutSize: knockoutSize || null, knockoutRounds: null }
  if (format === 'groups')
    return { ...base, groups: genGroups(teams, numGroups || 2), knockoutSize: knockoutSize || null, knockoutRounds: null, fullPlacement: !!fullPlacement, placementRounds: null }
  if (format === 'swiss') {
    const standings = teams.map(t => ({ team: t, pts: 0, gd: 0 }))
    return {
      ...base,
      numSwissRounds: numSwissRounds || Math.max(5, Math.ceil(Math.log2(teams.length)) + 1),
      rounds: [{ name: i18n.t('tournamentGen.round', { n: 1 }), matches: pairSwissRound(standings, []) }],
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
  return { ...tournament, rounds: [...tournament.rounds, { name: i18n.t('tournamentGen.round', { n }), matches: pairSwissRound(standings, allMatches) }] }
}

export function isRoundComplete(round) {
  return round.matches.length > 0 && round.matches.every(m => m.score1 !== null && m.score2 !== null)
}

// ── Lecture de l'état d'un tournoi (matchs à plat, classement final, fin) ────
export function getTournamentMatches(tournament) {
  if (tournament.format === 'groups') return tournament.groups?.flatMap(g => g.matches) || []
  if (tournament.format === 'swiss') return tournament.rounds?.flatMap(r => r.matches) || []
  return tournament.matches || []
}

export function isAllPlayed(matches) {
  return matches.length > 0 && matches.every(m => m.score1 !== null && m.score2 !== null)
}

export function buildFinalRanking(tournament) {
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

export function getTournamentEndState(tournament) {
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
