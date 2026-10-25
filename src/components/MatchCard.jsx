import { useTranslation } from 'react-i18next'
import { fmtDateTime } from '../lib/format'
import { teamTextStyle, teamSwatchStyle } from '../lib/teamColor'
import Icon from './Icon'
import './MatchCard.css'

// Ligne de match compacte — utilisée par le widget "Matchs récents" de Setup
// et par la liste principale de History. onDownloadPdf/showFooter sont omis
// par Setup, qui n'affiche ni bouton PDF ni détail de bas de ligne.
export default function MatchCard({ match, onClick, onDownloadPdf, showFooter = false }) {
  const { t } = useTranslation()
  const clickable = match.mode !== 'scorer' && !!onClick
  const MainTag = clickable ? 'button' : 'div'
  const colors = match.settings?.teamColors || []

  return (
    <div className="mr-card">
      <MainTag className="mr-main" {...(clickable ? { onClick: () => onClick(match) } : {})}>
        <div className="mr-head">
          <span>{fmtDateTime(match.playedAt)}</span>
          <span>{match.settings?.halfCount}×{match.settings?.halfDurationMin} min</span>
        </div>
        <div className="mr-body">
          <div className="mr-names">
            {(match.teams || []).map((tm, i) => (
              <div className="mr-name" key={i}>
                {colors[i] && <span className="team-dot" style={teamSwatchStyle(colors[i])} />}
                <span className="mr-name-txt">{tm.name}</span>
              </div>
            ))}
          </div>
          <div className="mr-score">
            {(match.teams || []).map((tm, i) => (
              <span key={i} style={colors[i] ? teamTextStyle(colors[i]) : undefined}>{tm.score}</span>
            ))}
          </div>
          {clickable && <Icon name="chevron" size={20} className="mr-chev" />}
        </div>
        {showFooter && match.mode !== 'scorer' && (
          <div className="mr-foot">
            {match.mode === 'player'
              ? t('history.footerPlayer', { count: match.players?.length || 0 })
              : `${(match.teams || []).map(tm => t('history.footerStatsShots', { count: tm.tirs ?? 0 })).join(' · ')} · ${t('history.footerStatsEvents', { count: match.shotEvents ?? 0 })}`
            }
          </div>
        )}
      </MainTag>
      {onDownloadPdf && (
        <button className="btn-mini mr-pdf" onClick={() => onDownloadPdf(match)}>
          <Icon name="download" size={16} />{t('history.pdfBtn')}
        </button>
      )}
    </div>
  )
}
