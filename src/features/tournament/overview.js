// Vue d'ensemble d'un tournoi, quel que soit son format : tous les matchs à plat
// avec leur contexte (poule, ronde, phase finale…) et la fonction qui enregistre
// leur score, les prochains matchs, les derniers résultats, la forme des équipes
// et l'action qui débloque la suite.
import i18n from '../../i18n'
import { bracketRounds, isRealMatch } from '../../lib/doubleElim'
import {
  addSwissRound, calcStandings, canStartFullPlacement, canStartKnockout,
  clearKnockoutScore, clearMatchScore, clearPlacementScore,
  isRoundComplete, setKnockoutScore, setMatchScore, setPlacementScore,
  startFullPlacement, startKnockout,
} from '../../lib/tournament'

export const isPlayed = m => m.score1 !== null && m.score2 !== null
const isTbd = m => m.team1 === 'TBD' || m.team2 === 'TBD'

// [{ match, label, stage, order, save(tour, s1, s2) → tour }]
export function listFixtures(tour) {
  const list = []
  // clear(tour) → tour : annule le résultat (voir clearMatchScore…).
  const push = (match, label, stage, save, clear = t => clearMatchScore(t, match.id)) => list.push({ match, label, stage, order: list.length, save, clear })

  const leg = (m, label) => (m.leg === 2 ? [label, i18n.t('tournament.schedule.returnLeg')].filter(Boolean).join(' · ') : label)
  if (tour.format === 'roundrobin') {
    tour.matches.forEach(m => push(m, leg(m, null), 'league', (t, a, b) => setMatchScore(t, m.id, a, b)))
  } else if (tour.format === 'groups') {
    // Les poules jouent en parallèle : on entrelace leurs matchs (A1, B1, A2, B2…).
    const longest = Math.max(0, ...tour.groups.map(g => g.matches.length))
    for (let i = 0; i < longest; i++) {
      tour.groups.forEach(g => {
        const m = g.matches[i]
        if (m) push(m, leg(m, g.name), 'group', (t, a, b) => setMatchScore(t, m.id, a, b))
      })
    }
  } else if (tour.format === 'swiss') {
    tour.rounds.forEach(r => r.matches.forEach(m => push(m, r.name, 'swiss', (t, a, b) => setMatchScore(t, m.id, a, b))))
  } else if (tour.format === 'double' && tour.bracket) {
    // Matchs réels seulement (pas d'exempt, pas de finale décisive inutile),
    // dans l'ordre où leurs équipes peuvent être connues. Pas de nul possible.
    bracketRounds(tour.bracket).forEach(({ round }) => round.matches.forEach(m => {
      if (isRealMatch(m)) push(m, round.name, 'knockout', (t, a, b) => setMatchScore(t, m.id, a, b))
    }))
  }

  tour.knockoutRounds?.forEach((r, ri) => r.matches.forEach((m, mi) =>
    push(m, r.name, 'knockout', (t, a, b) => setKnockoutScore(t, ri, mi, a, b), t => clearKnockoutScore(t, ri, mi))))
  tour.placementRounds?.forEach((r, ri) =>
    push(r.match, r.label, 'placement', (t, a, b) => setPlacementScore(t, ri, a, b), t => clearPlacementScore(t, ri)))

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
  // Double élimination : le tableau tient lieu de classement.
  if (tour.format === 'double') return []
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

// Enregistre un score par identifiant de match, quel que soit le format.
// Renvoie { tour } ou { error: 'missing' | 'draw' } (pas de nul en phase finale).
export function applyScore(tour, matchId, s1, s2) {
  const fx = listFixtures(tour).find(f => f.match.id === matchId)
  if (!fx) return { error: 'missing' }
  if (fx.stage === 'knockout' && s1 === s2) return { error: 'draw' }
  return { tour: fx.save(tour, s1, s2), fixture: fx }
}

// ── Terrains et planning ─────────────────────────────────────────────────
const teamsOf = f => [f.match.team1, f.match.team2]

// Répartit les matchs prêts sur `tour.courtCount` terrains.
// - Un match déjà sur un terrain y reste (tour.courts : id du match → n° de terrain).
// - Un terrain libre prend le prochain match dont aucune équipe ne joue déjà.
// - Le reste est rangé en créneaux, sans qu'une équipe joue deux fois dans le même.
// Résultat : { count, onCourt: [fixture|null par terrain], slots: [[{ fixture, court }]],
//              waiting: [fixtures dont les équipes ne sont pas encore connues], courts }
export function planCourts(tour, fixtures = listFixtures(tour)) {
  const count = Math.max(1, Math.min(32, Number(tour.courtCount) || 1))
  const pending = upcoming(fixtures)
  const kept = tour.courts || {}
  const onCourt = Array(count).fill(null)
  const used = new Set()
  const busy = new Set()
  const place = (f, i) => { onCourt[i] = f; used.add(f.match.id); teamsOf(f).forEach(tm => busy.add(tm)) }

  pending.forEach(f => {
    const c = kept[f.match.id]
    if (Number.isInteger(c) && c >= 1 && c <= count && !onCourt[c - 1] && !teamsOf(f).some(tm => busy.has(tm))) place(f, c - 1)
  })
  for (let i = 0; i < count; i++) {
    if (onCourt[i]) continue
    const f = pending.find(x => !used.has(x.match.id) && !teamsOf(x).some(tm => busy.has(tm)))
    if (f) place(f, i)
  }

  const slots = []
  let queue = pending.filter(f => !used.has(f.match.id))
  while (queue.length) {
    const slot = []
    const inSlot = new Set()
    for (const f of queue) {
      if (slot.length >= count) break
      if (teamsOf(f).some(tm => inSlot.has(tm))) continue
      slot.push({ fixture: f, court: slot.length + 1 })
      teamsOf(f).forEach(tm => inSlot.add(tm))
    }
    queue = queue.filter(f => !slot.some(s => s.fixture === f))
    slots.push(slot)
  }

  const waiting = fixtures.filter(f => !isPlayed(f.match) && isTbd(f.match))
  const courts = Object.fromEntries(onCourt.map((f, i) => f && [f.match.id, i + 1]).filter(Boolean))
  return { count, onCourt, slots, waiting, courts }
}

export const sameCourts = (a = {}, b = {}) => {
  const ka = Object.keys(a), kb = Object.keys(b)
  return ka.length === kb.length && ka.every(k => a[k] === b[k])
}

// ── Chrono informatif ────────────────────────────────────────────────────
// clock : { label, durationSec, remainingSec, endsAt (ms, si en marche), running }
export function clockRemainingMs(clock, now = Date.now()) {
  if (!clock?.durationSec) return null
  if (clock.running && clock.endsAt) return Math.max(0, clock.endsAt - now)
  return Math.max(0, (clock.remainingSec ?? clock.durationSec) * 1000)
}

// ── Horaires ─────────────────────────────────────────────────────────────
// tour.schedule : { startAt (ISO), halves, halfMin, halfBreakMin, changeMin }
// tour.courtsSince : id du match → heure (ISO) où il a été mis sur un terrain.
export const DEFAULT_SCHEDULE = { halves: 2, halfMin: 10, halfBreakMin: 2, changeMin: 3 }

const n0 = v => Math.max(0, Number(v) || 0)
export const matchMinutes = s => n0(s.halves) * n0(s.halfMin) + Math.max(0, n0(s.halves) - 1) * n0(s.halfBreakMin)
export const slotMinutes  = s => matchMinutes(s) + n0(s.changeMin)

// Créneaux des phases pas encore générées (phase finale, classement, rondes suisses).
// Les tours d'une phase finale se jouent l'un après l'autre.
function futureSlots(tour, courts) {
  const per = n => Math.ceil(n / courts)
  const pairs = Math.floor(tour.teams.length / 2)
  let slots = 0
  if (tour.knockoutSize && !tour.knockoutRounds) for (let n = tour.knockoutSize / 2; n >= 1; n /= 2) slots += per(n)
  if (tour.format === 'groups' && tour.fullPlacement && !tour.placementRounds) slots += per(pairs)
  if (tour.format === 'swiss') slots += Math.max(0, (tour.numSwissRounds || 0) - tour.rounds.length) * per(pairs)
  return slots
}

// Matchs dont les équipes ne sont pas encore connues : un groupe de créneaux par tour.
function waitingSlots(waiting, courts) {
  const byRound = new Map()
  waiting.forEach(f => byRound.set(f.label || '', (byRound.get(f.label || '') || 0) + 1))
  let slots = 0
  byRound.forEach(n => { slots += Math.ceil(n / courts) })
  return slots
}

// Estimation, recalculée avec l'avancement réel. null si pas d'horaires.
// { start, matchMin, slotMin, courtEnds[], slotStarts[], endAt, finished }
export function estimateSchedule(tour, plan, now = Date.now()) {
  const s = tour.schedule
  const start = s?.startAt ? Date.parse(s.startAt) : NaN
  if (Number.isNaN(start) || !matchMinutes(s)) return null
  const MIN = 60000
  const matchMs = matchMinutes(s) * MIN
  const slotMs = slotMinutes(s) * MIN
  const changeMs = n0(s.changeMin) * MIN
  const since = tour.courtsSince || {}

  const courtEnds = plan.onCourt.map(f => {
    if (!f) return null
    const placed = Date.parse(since[f.match.id])
    const began = Math.max(start, Number.isNaN(placed) ? Math.max(now, start) : placed)
    return Math.max(now, began + matchMs) // en retard : on considère qu'il finit maintenant
  })
  const ends = courtEnds.filter(v => v !== null)
  const nextFree = ends.length ? Math.max(...ends) + changeMs : Math.max(now, start)
  const slotStarts = plan.slots.map((_, k) => nextFree + k * slotMs)
  const remaining = plan.slots.length + waitingSlots(plan.waiting, plan.count) + futureSlots(tour, plan.count)
  const endAt = remaining ? nextFree + remaining * slotMs - changeMs : ends.length ? Math.max(...ends) : null

  return {
    start,
    matchMin: matchMinutes(s),
    slotMin: slotMinutes(s),
    courtEnds,
    slotStarts,
    endAt,
    finished: !ends.length && !remaining,
  }
}

export function fmtHour(ms) {
  if (ms == null) return ''
  return new Date(ms).toLocaleTimeString(i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })
}
