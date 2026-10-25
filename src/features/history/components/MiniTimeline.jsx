import { buildPointsSeries } from '../../../lib/shotSeries'
import { fmtClock } from '../../../lib/format'

export default function MiniTimeline({ timeline, settings, teams }) {
  const { series, maxT, maxV } = buildPointsSeries(teams || [], timeline || [])
  const w = 800, h = 160, pl = 32, pr = 12, pt = 10, pb = 28
  const x = t => pl + (t / Math.max(1, maxT)) * (w - pl - pr)
  const y = v => h - pb - (v / Math.max(1, maxV)) * (h - pt - pb)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="tg-svg">
      <line x1={pl} y1={h - pb} x2={w - pr} y2={h - pb} className="tg-axis" />
      <line x1={pl} y1={pt}     x2={pl}     y2={h - pb} className="tg-axis" />
      {[0, 0.25, 0.5, 0.75, 1].map(tick => {
        const tx = x(maxT * tick)
        return (
          <g key={tick}>
            <line x1={tx} y1={pt} x2={tx} y2={h - pb} className="tg-grid" />
            <text x={tx} y={h - 8} textAnchor={tick === 0 ? 'start' : tick === 1 ? 'end' : 'middle'} className="tg-label">{fmtClock(Math.round(maxT * tick))}</text>
          </g>
        )
      })}
      {series.map((pts, i) => {
        const color = settings?.teamColors?.[i] || (i === 0 ? '#0e9f8f' : '#d14343')
        const d = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${x(p.t)} ${y(p.v)}`).join(' ')
        return (
          <g key={i}>
            <path d={d} fill="none" className="tg-under" strokeWidth="6.5" strokeLinejoin="round" />
            <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
          </g>
        )
      })}
    </svg>
  )
}
