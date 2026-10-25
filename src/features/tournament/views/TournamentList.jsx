import { useTranslation } from 'react-i18next'
import { fmtDateTime } from '../../../lib/format'
import PageHeader from '../../../components/PageHeader'
import Icon from '../../../components/Icon'

export default function TournamentList({ tournaments, onBack, onCreate, onOpen, onDelete }) {
  const { t } = useTranslation()

  return (
    <div className="trn-list-screen">
      <PageHeader
        title={t('tournament.title')}
        subtitle={t('tournament.subtitle')}
        onBack={onBack}
        backLabel={t('tournament.home')}
        actions={tournaments.length > 0 && (
          <button className="btn-acc trn-new-btn" onClick={onCreate}>
            <Icon name="plus" size={18} />{t('tournament.newButton')}
          </button>
        )}
      />

      {tournaments.length === 0 ? (
        <div className="empty-state">
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
              <div key={tour.id} className="trn-item">
                <button className="trn-item-info" onClick={() => onOpen(tour)}>
                  <div className="trn-item-name">{tour.name}</div>
                  <div className="trn-item-meta">
                    {t('tournament.itemMeta', { format: formatLabel[tour.format], teams: tour.teams.length, done, total: allMatches.length })}
                    {tour.createdAt && <> · {fmtDateTime(tour.createdAt)}</>}
                  </div>
                </button>
                <button className="icon-btn danger" onClick={() => onDelete(tour.id)} title={t('common.delete')} aria-label={t('common.delete')}>
                  <Icon name="close" size={18} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
