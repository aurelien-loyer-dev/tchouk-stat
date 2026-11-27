import { useTranslation } from 'react-i18next'
import { teamSwatchStyle } from '../../../lib/teamColor'
import PlayerCard from './PlayerCard'

export default function TeamColumn({ teamName, teamColor, players, selectedStat, dimmed, onAdj, onSub, elapsedSec }) {
  const { t } = useTranslation()
  const tracked = players.some(p => Array.isArray(p.stints))
  const onCourt = players.filter(p => p.onCourt).length
  return (
    <div className={`pm-team-col${dimmed ? ' pm-col-dimmed' : ''}`}>
      <div className="pm-team-hd">
        <span className="team-dot" style={teamSwatchStyle(teamColor)} />{teamName}
        {tracked && <span className="pm-court-count">{t('subs.onCourtN', { count: onCourt })}</span>}
      </div>
      {players.length === 0 && <div className="pm-no-players">{t('playerMatch.noPlayers')}</div>}
      <div className="pm-players-grid-inner">
        {players.map(p => (
          <PlayerCard
            key={p.id}
            player={p}
            teamColor={teamColor}
            selectedStat={selectedStat}
            onAdj={onAdj}
            onSub={tracked ? onSub : null}
            elapsedSec={elapsedSec}
          />
        ))}
      </div>
    </div>
  )
}
