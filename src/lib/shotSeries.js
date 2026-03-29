export function buildShotSeries(teams, timeline) {
  const n = teams.length
  const events = (timeline || [])
    .filter(ev => ev.category === 'tirs' && typeof ev.elapsedSec === 'number')
    .sort((a, b) => a.elapsedSec - b.elapsedSec)

  const counts = Array.from({ length: n }, () => 0)
  const series = Array.from({ length: n }, () => [{ t: 0, v: 0 }])
  let maxT = 1

  events.forEach(ev => {
    const idx = ev.teamIdx
    if (idx >= 0 && idx < n) {
      counts[idx] = Math.max(0, counts[idx] + (ev.d || 0))
    }
    const t = Math.max(0, ev.elapsedSec)
    maxT = Math.max(maxT, t)
    for (let i = 0; i < n; i++) {
      series[i].push({ t, v: counts[i] })
    }
  })

  const maxV = Math.max(1, ...series.flat().map(p => p.v))
  return { series, maxT, maxV, hasData: events.length > 0 }
}
