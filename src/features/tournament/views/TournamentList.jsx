import { useTranslation } from 'react-i18next'
import { fmtDateTime } from '../../../lib/format'

export default function TournamentList({ tournaments, onBack, onCreate, onOpen, onDelete }) {
  const { t } = useTranslation()

  return (
    <div className="trn-list-screen">
      <div className="trn-topbar">
        <button className="btn-mini" onClick={onBack}>{t('tournament.home')}</button>
        <div>
          <div className="trn-topbar-title">{t('tournament.title')}</div>
          <div className="trn-topbar-meta">{t('tournament.subtitle')}</div>
        </div>
        <button className="btn-acc trn-new-btn" onClick={onCreate}>{t('tournament.newButton')}</button>
      </div>

      {tournaments.length === 0 ? (
        <div className="trn-empty">
          <div>{t('tournament.empty')}</div>
          <button className="btn-acc" onClick={onCreate}>{t('tournament.createButton')}</button>
        </div>
      ) : (
        <div className="trn-list">
          {tournaments.map(tour => {
            const allMatches = tour.format === 'groups'
              ? tour.groups?.flatMap(g => g.matches) ?? []
              : tour.format === 'swiss'
              ? tour.rounds?.flatMap(r => r.matches) ?? []
              : tour.matches ?? []
            const done = allMatches.filter(m => m.score1 !== null).length
            const formatLabel = t('tournament.formatLabel', { returnObjects: true })
            return (
              <div key={tour.id} className="trn-item" onClick={() => onOpen(tour)}>
                <div className="trn-item-info">
                  <div className="trn-item-name">{tour.name}</div>
                  <div className="trn-item-meta">
                    {t('tournament.itemMeta', { format: formatLabel[tour.format], teams: tour.teams.length, done, total: allMatches.length })}
                    {tour.createdAt && <> · {fmtDateTime(tour.createdAt)}</>}
                  </div>
                </div>
                <button className="trn-item-del" onClick={e => { e.stopPropagation(); onDelete(tour.id) }}>×</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
