import { useTranslation } from 'react-i18next'

export default function PlayerCard({ player, teamColor, selectedStat, onAdj }) {
  const { t } = useTranslation()
  const statVal = selectedStat ? (player[selectedStat] ?? 0) : null

  return (
    <div
      className={`pm-player-card${selectedStat ? ' pm-player-active' : ''}`}
      style={{ borderColor: teamColor }}
    >
      <div className="pm-player-top">
        <div className="pm-player-name">{player.name}</div>
        <div className="pm-player-pts">
          {player.pointsMarques}
          <span className="pm-player-pts-lbl"> {t('playerMatch.ptsShort')}</span>
        </div>
      </div>
      {selectedStat && (
        <div className="pm-player-bottom">
          <span className="pm-stat-cur">{statVal}</span>
          <button className="pm-adj-btn pm-adj-p" onClick={() => onAdj(player, 1)}>+</button>
          <button className="pm-adj-btn pm-adj-m" onClick={() => onAdj(player, -1)}>−</button>
        </div>
      )}
    </div>
  )
}
