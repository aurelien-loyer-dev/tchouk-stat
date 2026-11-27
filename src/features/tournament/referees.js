// ── Arbitrage par les équipes ─────────────────────────────────────────────
// tour.refereeing : true → chaque match est arbitré par une équipe au repos.
// tour.referees : { idMatch: équipe } — attributions figées dès qu'un match
// est sur un terrain (elles ne bougent plus ensuite, même si le planning change).
//
// Pour les autres matchs (créneaux à venir), l'attribution est recalculée à
// chaque affichage, créneau par créneau :
//  - jamais une équipe qui joue dans le même créneau ;
//  - de préférence une équipe qui ne joue ni juste avant ni juste après ;
//  - en équilibrant le nombre d'arbitrages de chacun.

const teamsOf = f => [f.match.team1, f.match.team2]

// plan : résultat de planCourts. → { byMatch: { id: équipe }, counts: { équipe: n } }
export function assignReferees(tour, plan) {
  const byMatch = {}
  const counts = Object.fromEntries(tour.teams.map(t => [t, 0]))
  if (!tour.refereeing || tour.teams.length < 3) return { byMatch, counts }

  const fixed = tour.referees || {}
  const live = new Set(plan.onCourt.filter(Boolean).map(f => f.match.id))
  // Matchs déjà joués ou sur un terrain : leurs arbitres comptent.
  Object.entries(fixed).forEach(([id, team]) => {
    if (team in counts) counts[team]++
    byMatch[id] = team
  })

  const groups = [plan.onCourt.filter(Boolean), ...plan.slots.map(sl => sl.map(s => s.fixture))]
  const order = new Map(tour.teams.map((t, i) => [t, i]))

  groups.forEach((group, gi) => {
    const playing = new Set(group.flatMap(teamsOf))
    const before = new Set((groups[gi - 1] || []).flatMap(teamsOf))
    const after = new Set((groups[gi + 1] || []).flatMap(teamsOf))
    const busy = new Set()
    group.forEach(f => { if (byMatch[f.match.id]) busy.add(byMatch[f.match.id]) })

    group.forEach(f => {
      if (byMatch[f.match.id] && (live.has(f.match.id) || !playing.has(byMatch[f.match.id]))) return
      const candidates = tour.teams.filter(t => !playing.has(t) && !busy.has(t))
      if (!candidates.length) return
      const cost = t => counts[t] * 10 + (after.has(t) ? 3 : 0) + (before.has(t) ? 2 : 0)
      const pick = candidates.reduce((best, t) => (cost(t) < cost(best) || (cost(t) === cost(best) && order.get(t) < order.get(best)) ? t : best))
      byMatch[f.match.id] = pick
      busy.add(pick)
      counts[pick]++
    })
  })
  return { byMatch, counts }
}

// Attributions à figer : celles des matchs actuellement sur un terrain.
export function refereesToFix(tour, plan, byMatch) {
  if (!tour.refereeing) return null
  const fixed = { ...(tour.referees || {}) }
  let changed = false
  plan.onCourt.filter(Boolean).forEach(f => {
    const ref = byMatch[f.match.id]
    if (ref && !fixed[f.match.id]) { fixed[f.match.id] = ref; changed = true }
  })
  return changed ? fixed : null
}

// Prochains arbitrages d'une équipe : [{ fixture, kind: 'now' | 'next', court }]
export function refereeDuties(team, plan, byMatch) {
  if (!team) return []
  const out = []
  plan.onCourt.forEach((f, i) => { if (f && byMatch[f.match.id] === team) out.push({ fixture: f, kind: 'now', court: plan.count > 1 ? i + 1 : null }) })
  ;(plan.slots[0] || []).forEach(s => { if (byMatch[s.fixture.match.id] === team) out.push({ fixture: s.fixture, kind: 'next', court: plan.count > 1 ? s.court : null }) })
  return out
}
