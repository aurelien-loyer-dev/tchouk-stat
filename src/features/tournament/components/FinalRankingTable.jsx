import { useTranslation } from 'react-i18next'

export default function FinalRankingTable({ ranking, hasKnockout }) {
  const { t } = useTranslation()
  return (
    <div className="trn-table-wrap">
      <table className="trn-table">
        <thead>
          <tr>
            <th>#</th>
            <th className="trn-th-team">{t('tournament.standings.team')}</th>
            <th title={t('tournament.standings.pts')}>{t('tournament.standings.pts')}</th>
            <th title={t('tournament.standings.diffTitle')}>{t('tournament.standings.diff')}</th>
            <th title={t('tournament.standings.gfTitle')}>{t('tournament.standings.gf')}</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.team} className={i === 0 ? 'trn-rank-first' : i === 1 ? 'trn-rank-second' : i === 2 ? 'trn-rank-third' : ''}>
              <td className="trn-rank">{i + 1}</td>
              <td className="trn-th-team">{r.team}</td>
              <td className="trn-pts">{r.pts}</td>
              <td className={r.gd > 0 ? 'trn-pos' : r.gd < 0 ? 'trn-neg' : ''}>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              <td>{r.gf}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasKnockout && (
        <div className="trn-ranking-note">{t('tournament.finalRankingNote')}</div>
      )}
    </div>
  )
}
