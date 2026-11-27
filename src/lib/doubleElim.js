// ── Double élimination ───────────────────────────────────────────────────
// Toutes les équipes commencent dans le tableau principal (upper). Une défaite
// envoie dans le tableau des perdants (lower) ; une deuxième élimine. Les
// vainqueurs des deux tableaux se retrouvent en grande finale. Si l'équipe
// venue du tableau des perdants la gagne, chacune a une défaite : une finale
// décisive est rejouée (« reset »), si l'option est active.
//
// Tous les matchs sont créés dès le départ. Chaque emplacement dit d'où vient
// son équipe (src) : tête de série, exempt, ou vainqueur / perdant d'un autre
// match. propagate() recalcule les équipes à partir des scores : corriger un
// score en amont met à jour la suite (et efface les scores devenus faux).
//
// Valeurs spéciales d'équipe : 'TBD' (pas encore connue), 'BYE' (exempt : le
// match n'existe pas vraiment, l'adversaire passe sans jouer).

import { newId } from './format'
import i18n from '../i18n'

export const BYE = 'BYE'
const TBD = 'TBD'

const nextPow2 = n => { let p = 1; while (p < n) p *= 2; return p }

// Positions de têtes de série classiques : 1 contre 8, 4 contre 5, 2 contre 7…
// (les meilleures ne se croisent qu'au plus tard, les exempts vont aux premières).
function seedOrder(size) {
  let order = [1]
  while (order.length < size) {
    const n = order.length * 2 + 1
    order = order.flatMap(s => [s, n - s])
  }
  return order
}

function mkSlotMatch(bracket, src1, src2) {
  return { id: newId(), bracket, team1: TBD, team2: TBD, score1: null, score2: null, src1, src2 }
}

function upperName(roundIdx, total) {
  const left = 2 ** (total - roundIdx) // équipes encore en lice dans ce tour
  if (left === 2) return i18n.t('tournamentGen.double.upperFinal')
  if (left === 4) return i18n.t('tournamentGen.double.upperSemis')
  return i18n.t('tournamentGen.double.upperRound', { n: roundIdx + 1 })
}

function lowerName(roundIdx, total) {
  if (roundIdx === total - 1) return i18n.t('tournamentGen.double.lowerFinal')
  return i18n.t('tournamentGen.double.lowerRound', { n: roundIdx + 1 })
}

// teams : dans l'ordre des têtes de série (la 1re est la mieux classée).
export function genDoubleElim(teams, { reset = true } = {}) {
  const size = Math.max(4, nextPow2(teams.length))
  const k = Math.log2(size)
  const order = seedOrder(size)
  const seedSrc = seed => (seed <= teams.length ? { team: teams[seed - 1] } : { bye: true })

  // Tableau principal : k tours.
  const upper = []
  const first = []
  for (let i = 0; i < size / 2; i++) first.push(mkSlotMatch('W', seedSrc(order[2 * i]), seedSrc(order[2 * i + 1])))
  upper.push(first)
  for (let r = 1; r < k; r++) {
    const prev = upper[r - 1]
    upper.push(Array.from({ length: prev.length / 2 }, (_, i) =>
      mkSlotMatch('W', { m: prev[2 * i].id, r: 'W' }, { m: prev[2 * i + 1].id, r: 'W' })))
  }

  // Tableau des perdants : 2(k−1) tours. Tour 1 : perdants du 1er tour entre eux.
  // Ensuite, en alternance : les survivants accueillent les perdants du tour
  // suivant du tableau principal (ordre inversé un tour sur deux pour éviter de
  // retrouver tout de suite le même adversaire), puis se rencontrent entre eux.
  const lower = []
  lower.push(Array.from({ length: size / 4 }, (_, i) =>
    mkSlotMatch('L', { m: first[2 * i].id, r: 'L' }, { m: first[2 * i + 1].id, r: 'L' })))
  for (let j = 1; j < k; j++) {
    const survivors = lower[lower.length - 1]
    const dropping = upper[j]
    const n = survivors.length
    lower.push(Array.from({ length: n }, (_, i) => {
      const di = j % 2 === 1 ? n - 1 - i : i
      return mkSlotMatch('L', { m: survivors[i].id, r: 'W' }, { m: dropping[di].id, r: 'L' })
    }))
    if (j < k - 1) {
      const prev = lower[lower.length - 1]
      lower.push(Array.from({ length: prev.length / 2 }, (_, i) =>
        mkSlotMatch('L', { m: prev[2 * i].id, r: 'W' }, { m: prev[2 * i + 1].id, r: 'W' })))
    }
  }

  // Grande finale (team1 = vainqueur du tableau principal), puis finale décisive.
  const gf = mkSlotMatch('F', { m: upper[k - 1][0].id, r: 'W' }, { m: lower[lower.length - 1][0].id, r: 'W' })
  const final = [{ name: i18n.t('tournamentGen.double.grandFinal'), matches: [gf] }]
  if (reset) {
    final.push({
      name: i18n.t('tournamentGen.double.reset'),
      matches: [{ ...mkSlotMatch('F', { m: gf.id, r: 'W' }, { m: gf.id, r: 'L' }), resetOf: gf.id }],
    })
  }

  return propagate({
    upper: upper.map((matches, r) => ({ name: upperName(r, k), matches })),
    lower: lower.map((matches, r) => ({ name: lowerName(r, lower.length), matches })),
    final,
  })
}

// Tous les matchs, dans l'ordre où leurs équipes peuvent être connues :
// tour r du principal, puis tour r−1 du tableau des perdants, etc.
export function bracketRounds(bracket) {
  const out = []
  const k = bracket.upper.length
  for (let t = 0; t <= k + bracket.lower.length; t++) {
    if (bracket.upper[t]) out.push({ side: 'upper', round: bracket.upper[t] })
    if (bracket.lower[t - 1]) out.push({ side: 'lower', round: bracket.lower[t - 1] })
  }
  bracket.final.forEach(round => out.push({ side: 'final', round }))
  return out
}

export const allBracketMatches = bracket => bracketRounds(bracket).flatMap(x => x.round.matches)

// Issue d'un match : { winner, loser } (équipes, 'BYE' ou 'TBD'), ou null.
export function outcome(m) {
  if (m.team1 === TBD || m.team2 === TBD) return null
  if (m.team1 === BYE && m.team2 === BYE) return { winner: BYE, loser: BYE }
  if (m.team2 === BYE) return { winner: m.team1, loser: BYE }
  if (m.team1 === BYE) return { winner: m.team2, loser: BYE }
  if (m.score1 === null || m.score2 === null || m.score1 === m.score2) return null
  return m.score1 > m.score2 ? { winner: m.team1, loser: m.team2 } : { winner: m.team2, loser: m.team1 }
}

// Recalcule les équipes de chaque match d'après les résultats en amont.
// Un match dont une équipe change perd son score (il n'opposait pas les mêmes).
export function propagate(bracket) {
  const byId = new Map()
  const resolve = src => {
    if (src.team) return src.team
    if (src.bye) return BYE
    const from = byId.get(src.m)
    const res = from && outcome(from)
    if (!res) return TBD
    return src.r === 'W' ? res.winner : res.loser
  }
  const fix = m => {
    let team1 = resolve(m.src1)
    let team2 = resolve(m.src2)
    if (m.resetOf) {
      // Finale décisive seulement si le vainqueur du tableau des perdants a gagné.
      const gf = byId.get(m.resetOf)
      const res = gf && outcome(gf)
      if (!res) { team1 = TBD; team2 = TBD }
      else if (res.winner === gf.team1) { team1 = BYE; team2 = BYE }
      else { team1 = gf.team1; team2 = gf.team2 }
    }
    const same = team1 === m.team1 && team2 === m.team2
    const next = same ? m : { ...m, team1, team2, score1: null, score2: null, playedAt: null }
    byId.set(m.id, next)
    return next
  }
  const mapRounds = rounds => rounds.map(r => ({ ...r, matches: r.matches.map(fix) }))
  // Ordre de calcul = ordre de dépendance (voir bracketRounds).
  const upper = [], lower = []
  const k = bracket.upper.length
  for (let t = 0; t <= k + bracket.lower.length; t++) {
    if (bracket.upper[t]) upper[t] = mapRounds([bracket.upper[t]])[0]
    if (bracket.lower[t - 1]) lower[t - 1] = mapRounds([bracket.lower[t - 1]])[0]
  }
  const final = mapRounds(bracket.final)
  return { upper, lower, final }
}

export function setBracketScore(bracket, matchId, score1, score2) {
  const stamp = score1 === null ? null : new Date().toISOString()
  const set = rounds => rounds.map(r => ({
    ...r,
    matches: r.matches.map(m => (m.id === matchId ? { ...m, score1, score2, playedAt: stamp } : m)),
  }))
  return propagate({ upper: set(bracket.upper), lower: set(bracket.lower), final: set(bracket.final) })
}

// Matchs réels (ni exempt, ni finale décisive devenue inutile).
export const isRealMatch = m => m.team1 !== BYE && m.team2 !== BYE

export function bracketFinished(bracket) {
  return allBracketMatches(bracket).every(m => outcome(m) !== null)
}

// Classement : 1er et 2e d'après la dernière finale jouée ; ensuite, plus une
// équipe a été éliminée tard dans le tableau des perdants, mieux elle est
// classée. À égalité de tour, `statsOf` départage (points, différence…).
export function bracketRanking(bracket, teams, standings) {
  const statsRank = t => { const i = standings.findIndex(s => s.team === t); return i === -1 ? Infinity : i }
  const ranked = []
  const placed = new Set()
  const add = list => list
    .filter(t => t && t !== BYE && t !== TBD && !placed.has(t))
    .sort((a, b) => statsRank(a) - statsRank(b))
    .forEach(t => { placed.add(t); ranked.push(t) })

  const finals = bracket.final.flatMap(r => r.matches).filter(isRealMatch)
  const decided = [...finals].reverse().find(m => outcome(m))
  if (decided && bracketFinished(bracket)) {
    const res = outcome(decided)
    add([res.winner]); add([res.loser])
  }
  for (let r = bracket.lower.length - 1; r >= 0; r--) {
    add(bracket.lower[r].matches.map(m => outcome(m)?.loser))
  }
  add(teams) // pas encore éliminées (tournoi en cours) : ordre des stats
  return ranked
}
