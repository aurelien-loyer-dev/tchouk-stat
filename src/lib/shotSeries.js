// Série du score de chaque équipe au fil du match (et non du nombre de tirs
// tentés) : on rejoue les événements dans l'ordre et on lit le score déjà
// calculé à chaque étape (ev.scores), la même valeur affichée en direct.
export function buildPointsSeries(teams, timeline) {
  const n = teams.length
  const events = (timeline || [])
    .filter(ev => ev.category === 'tirs' && typeof ev.elapsedSec === 'number' && Array.isArray(ev.scores))
    .sort((a, b) => a.elapsedSec - b.elapsedSec)

  const series = Array.from({ length: n }, () => [{ t: 0, v: 0 }])
  let maxT = 1

  events.forEach(ev => {
    const t = Math.max(0, ev.elapsedSec)
    maxT = Math.max(maxT, t)
    for (let i = 0; i < n; i++) {
      series[i].push({ t, v: ev.scores[i] ?? 0 })
    }
  })

  const maxV = Math.max(1, ...series.flat().map(p => p.v))
  return { series, maxT, maxV, hasData: events.length > 0 }
}
