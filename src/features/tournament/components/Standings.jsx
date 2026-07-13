import { useTranslation } from 'react-i18next'
import { calcStandings } from '../../../lib/tournament'

export default function Standings({ teams, matches, qualifyN }) {
  const { t } = useTranslation()
  const s = t('tournament.standings', { returnObjects: true })
  const rows = calcStandings(teams, matches)
  return (
    <div className="trn-table-wrap">
      <table className="trn-table">
        <thead>
          <tr>
            <th>#</th><th className="trn-th-team">{s.team}</th>
            <th title={s.playedTitle}>{s.played}</th><th title={s.wonTitle}>{s.won}</th>
            <th title={s.drawnTitle}>{s.drawn}</th><th title={s.lostTitle}>{s.lost}</th>
            <th title={s.gfTitle}>{s.gf}</th><th title={s.gaTitle}>{s.ga}</th>
            <th title={s.diffTitle}>{s.diff}</th><th className="trn-th-pts">{s.pts}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team} className={qualifyN && i < qualifyN ? 'trn-qualified' : ''}>
              <td className="trn-rank">{i + 1}</td>
              <td className="trn-th-team">{r.team}</td>
              <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
              <td>{r.gf}</td><td>{r.ga}</td>
              <td className={r.gd > 0 ? 'trn-pos' : r.gd < 0 ? 'trn-neg' : ''}>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              <td className="trn-pts">{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
