import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCode, isViewer, normalizeCode } from '../cloud'
import { fmtDateTime } from '../../../lib/format'
import { Link } from '../../../lib/router'
import { getTournamentMatches } from '../../../lib/tournament'
import PageHeader from '../../../components/PageHeader'
import Icon from '../../../components/Icon'

function JoinForm({ onJoin, joinState }) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const clean = normalizeCode(code)
  const loading = joinState === 'loading'

  function submit(e) {
    e.preventDefault()
    if (clean.length === 6 && !loading) onJoin(clean)
  }

  return (
    <form className="shr-join" onSubmit={submit}>
      <label className="field">
        <span className="flabel">{t('tournament.share.joinLabel')}</span>
        <div className="shr-join-row">
          <input type="text" value={code} maxLength={9} autoCapitalize="characters" autoComplete="off" spellCheck={false}
                 placeholder="K7M-Q2P" onChange={e => setCode(e.target.value)} />
          <button type="submit" className="btn-ghost" disabled={clean.length !== 6 || loading}>
            {loading ? t('tournament.share.joining') : t('tournament.share.join')}
          </button>
        </div>
      </label>
      {joinState?.error && <p className="shr-error">{t(`tournament.share.joinError.${joinState.error}`)}</p>}
    </form>
  )
}

export default function TournamentList({ tournaments, onBack, onCreate, onDelete, onJoin, joinState }) {
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

      <JoinForm onJoin={onJoin} joinState={joinState} />

      {tournaments.length === 0 ? (
        <div className="empty-state">
          <div>{t('tournament.empty')}</div>
          <button className="btn-acc" onClick={onCreate}>{t('tournament.createButton')}</button>
        </div>
      ) : (
        <div className="trn-list">
          {tournaments.map(tour => {
            const allMatches = getTournamentMatches(tour)
            const done = allMatches.filter(m => m.score1 !== null).length
            const formatLabel = t('tournament.formatLabel', { returnObjects: true })
            return (
              <div key={tour.id} className="trn-item">
                <Link className="trn-item-info" to={isViewer(tour) ? `/live/${tour.share.code}` : `/tournaments/${tour.id}`}>
                  <div className="trn-item-name">
                    {tour.name}
                    {tour.share && (
                      <span className={`shr-badge${isViewer(tour) ? ' shr-badge-view' : ''}`}>
                        {isViewer(tour) ? t('tournament.share.badgeViewer') : t('tournament.share.badgeShared')} · {formatCode(tour.share.code)}
                      </span>
                    )}
                  </div>
                  <div className="trn-item-meta">
                    {t('tournament.itemMeta', { format: formatLabel[tour.format], teams: tour.teams.length, done, total: allMatches.length })}
                    {tour.createdAt && <> · {fmtDateTime(tour.createdAt)}</>}
                  </div>
                </Link>
                <button className="icon-btn danger" onClick={() => onDelete(tour.id)} title={t('common.delete')} aria-label={`${t('common.delete')} : ${tour.name}`}>
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
