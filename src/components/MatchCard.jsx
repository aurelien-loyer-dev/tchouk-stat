import { useTranslation } from 'react-i18next'
import { fmtDateTime } from '../lib/format'
import { teamTextStyle, teamSwatchStyle } from '../lib/teamColor'
import './MatchCard.css'

// Carte de match compacte — utilisée par le widget "Matchs récents" de Setup
// et par la liste principale de History. onDownloadPdf/showFooter sont omis
// par Setup, qui n'affiche ni bouton PDF ni détail de bas de carte.
export default function MatchCard({ match, onClick, onDownloadPdf, showFooter = false }) {
  const { t } = useTranslation()
  const clickable = match.mode !== 'scorer' && !!onClick
  const CardTag = clickable ? 'button' : 'div'

  return (
    <CardTag className="mr-card" {...(clickable ? { onClick: () => onClick(match) } : {})}>
      <div className="mr-head">
        <span>{fmtDateTime(match.playedAt)}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>{match.settings?.halfCount}×{match.settings?.halfDurationMin}min</span>
          {onDownloadPdf && (
            <span
              className="hist-pdf-btn"
              role="button"
              onClick={e => { e.stopPropagation(); onDownloadPdf(match) }}
            >
              {t('history.pdfBtn')}
            </span>
          )}
        </div>
      </div>
      <div className="mr-names">
        {(match.teams || []).map((tm, i) => (
          <div className="mr-name" key={i}>
            {match.settings?.teamColors?.[i] && <span className="team-dot" style={teamSwatchStyle(match.settings.teamColors[i])} />}
            {tm.name}
          </div>
        ))}
      </div>
      <div className="mr-score">
        {(match.teams || []).map((tm, i) => (
          <span key={i} style={match.settings?.teamColors?.[i] ? teamTextStyle(match.settings.teamColors[i]) : { color: 'var(--txt)' }}>
            {i > 0 && <span className="mr-score-sep">–</span>}
            {tm.score}
          </span>
        ))}
      </div>
      {showFooter && match.mode !== 'scorer' && (
        <div className="mr-foot">
          {match.mode === 'player'
            ? t('history.footerPlayer', { count: match.players?.length || 0 })
            : `${(match.teams || []).map(tm => t('history.footerStatsShots', { count: tm.tirs ?? 0 })).join(' · ')} · ${t('history.footerStatsEvents', { count: match.shotEvents ?? 0 })}`
          }
        </div>
      )}
    </CardTag>
  )
}
