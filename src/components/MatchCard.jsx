import { useTranslation } from 'react-i18next'
import { fmtClock, fmtTime, fmtWhen } from '../lib/format'
import Icon from './Icon'
import './MatchCard.css'

// Carte de match — widget "Matchs récents" de Setup (date relative) et liste
// de History (heure seule, la date est dans l'en-tête du groupe). Les actions
// PDF / suppression ne s'affichent que si leurs callbacks sont fournis.
export default function MatchCard({ match, onClick, onDownloadPdf, onDelete, timeOnly = false }) {
  const { t } = useTranslation()
  const teams  = match.teams || []
  const colors = match.settings?.teamColors || []
  const mode   = match.mode || 'stats'
  const two    = teams.length === 2
  const winner = two && teams[0].score !== teams[1].score ? (teams[0].score > teams[1].score ? 0 : 1) : null
  const MainTag = onClick ? 'button' : 'div'

  const details = [
    `${match.settings?.halfCount}×${match.settings?.halfDurationMin} min`,
    match.durationSec ? fmtClock(match.durationSec) : null,
    mode === 'player' ? t('history.footerPlayer', { count: match.players?.length || 0 }) : null,
    mode === 'stats' ? t('history.footerStatsEvents', { count: match.shotEvents ?? 0 }) : null,
  ].filter(Boolean)

  return (
    <article className="mc">
      <MainTag className="mc-main" {...(onClick ? { onClick: () => onClick(match) } : {})}>
        <div className="mc-top">
          <span className={`mode-badge mode-${mode}`}>{t(`history.modesShort.${mode}`)}</span>
          <span className="mc-when">{timeOnly ? fmtTime(match.playedAt) : fmtWhen(match.playedAt)}</span>
        </div>
        <div className="mc-teams">
          {teams.map((tm, i) => (
            <div key={i} className={`mc-team${winner === i ? ' win' : ''}${winner !== null && winner !== i ? ' lose' : ''}`}>
              <span className="mc-bar" style={{ background: colors[i] || 'var(--s3)' }} />
              <span className="mc-name">{tm.name}</span>
              <span className="mc-score">{tm.score}</span>
            </div>
          ))}
        </div>
        <div className="mc-foot">{details.join(' · ')}</div>
      </MainTag>
      {(onDownloadPdf || onDelete) && (
        <div className="mc-actions">
          {onDownloadPdf && (
            <button className="mc-act" onClick={() => onDownloadPdf(match)}>
              <Icon name="download" size={16} />{t('history.pdfBtn')}
            </button>
          )}
          {onDelete && (
            <button className="mc-act mc-act-danger" onClick={() => onDelete(match)} title={t('history.delete')} aria-label={t('history.delete')}>
              <Icon name="trash" size={16} />
            </button>
          )}
        </div>
      )}
    </article>
  )
}
