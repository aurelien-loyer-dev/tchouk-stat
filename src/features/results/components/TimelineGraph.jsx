import { useTranslation } from 'react-i18next'
import { buildPointsSeries } from '../../../lib/shotSeries'
import { fmtClock } from '../../../lib/format'
import { teamSwatchStyle, colorLum } from '../../../lib/teamColor'

export default function TimelineGraph({ teams, timeline, settings }) {
  const { t } = useTranslation()
  const { series, maxT, maxV, hasData } = buildPointsSeries(teams, timeline)
  const w = 980
  const h = 260
  const pl = 58
  const pr = 20
  const pt = 18
  const pb = 36

  const x = t => pl + (t / maxT) * (w - pl - pr)
  const y = v => h - pb - (v / maxV) * (h - pt - pb)

  return (
    <div className="tg-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="tg-svg" role="img" aria-label={t('results.ui.timelineTitle')}>
        <line x1={pl} y1={h - pb} x2={w - pr} y2={h - pb} className="tg-axis" />
        <line x1={pl} y1={pt} x2={pl} y2={h - pb} className="tg-axis" />

        {[0, 0.25, 0.5, 0.75, 1].map(tick => {
          const tx = x(maxT * tick)
          return (
            <g key={`x-${tick}`}>
              <line x1={tx} y1={pt} x2={tx} y2={h - pb} className="tg-grid" />
              <text x={tx} y={h - 12} textAnchor="middle" className="tg-label">{fmtClock(Math.round(maxT * tick))}</text>
            </g>
          )
        })}

        {Array.from({ length: maxV + 1 }, (_, i) => i).map(v => {
          const ty = y(v)
          return (
            <g key={`y-${v}`}>
              <line x1={pl} y1={ty} x2={w - pr} y2={ty} className="tg-grid" />
              <text x={pl - 8} y={ty + 4} textAnchor="end" className="tg-label">{v}</text>
            </g>
          )
        })}

        {series.map((pts, i) => {
          const color = settings?.teamColors?.[i] || (i === 0 ? '#0e9f8f' : '#d14343')
          const needsHalo = colorLum(color) < 0.22
          const d = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${x(p.t)} ${y(p.v)}`).join(' ')
          return (
            <g key={`line-${i}`}>
              {needsHalo && <path d={d} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="6" />}
              <path d={d} fill="none" stroke={color} strokeWidth="3" />
            </g>
          )
        })}
      </svg>

      <div className="tg-legend">
        {teams.map((team, i) => {
          const color = settings?.teamColors?.[i] || (i === 0 ? '#0e9f8f' : '#d14343')
          return (
            <div className="tg-leg-item" key={team.name + i}>
              <span className="tg-leg-dot" style={teamSwatchStyle(color)} />
              <span>{team.name}</span>
            </div>
          )
        })}
      </div>

      {!hasData && <div className="tl-empty">{t('results.ui.noPoints')}</div>}
    </div>
  )
}
