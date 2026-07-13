import { useTranslation } from 'react-i18next'
import { teamSwatchStyle } from '../../../lib/teamColor'
import PlayerCard from './PlayerCard'

export default function TeamColumn({ teamName, teamColor, players, selectedStat, dimmed, onAdj }) {
  const { t } = useTranslation()
  return (
    <div className={`pm-team-col${dimmed ? ' pm-col-dimmed' : ''}`}>
      <div className="pm-team-hd"><span className="team-dot" style={teamSwatchStyle(teamColor)} />{teamName}</div>
      {players.length === 0 && <div className="pm-no-players">{t('playerMatch.noPlayers')}</div>}
      <div className="pm-players-grid-inner">
        {players.map(p => (
          <PlayerCard
            key={p.id}
            player={p}
            teamColor={teamColor}
            selectedStat={selectedStat}
            onAdj={onAdj}
          />
        ))}
      </div>
    </div>
  )
}
