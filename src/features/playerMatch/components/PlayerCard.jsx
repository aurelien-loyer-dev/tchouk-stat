import { useTranslation } from 'react-i18next'
import Icon from '../../../components/Icon'
import { fmtPlay, playSeconds } from '../../../lib/playerStats'

// Carte d'un joueur : points, temps de jeu et bouton terrain / banc
// (remplacement), puis − / + quand une stat est choisie.
export default function PlayerCard({ player, teamColor, selectedStat, onAdj, onSub, elapsedSec }) {
  const { t } = useTranslation()
  const statVal = selectedStat ? (player[selectedStat] ?? 0) : null
  const bench = onSub && !player.onCourt

  return (
    <div className={`pm-player-card${selectedStat ? ' pm-player-active' : ''}${bench ? ' pm-bench' : ''}`} style={{ '--tc': teamColor }}>
      <div className="pm-player-top">
        <div className="pm-player-name">{player.name}</div>
        <div className="pm-player-pts">
          {player.pointsMarques}
          <span className="pm-player-pts-lbl"> {t('playerMatch.ptsShort')}</span>
        </div>
      </div>
      {onSub && (
        <div className="pm-player-court">
          <button className={`pm-court-btn${player.onCourt ? ' on' : ''}`} onClick={() => onSub(player.id)}
                  aria-pressed={!!player.onCourt}
                  title={player.onCourt ? t('subs.takeOut', { name: player.name }) : t('subs.bringIn', { name: player.name })}>
            <Icon name="swap" size={14} />
            {player.onCourt ? t('subs.onCourt') : t('subs.bench')}
          </button>
          <span className="pm-play-time" title={t('subs.playTime')}>{fmtPlay(playSeconds(player, elapsedSec))}</span>
        </div>
      )}
      {selectedStat && (
        <div className="pm-player-bottom">
          <button className="pm-adj-btn pm-adj-m" onClick={() => onAdj(player, -1)} disabled={!statVal} aria-label={`${player.name} −1`}>
            <Icon name="minus" size={18} />
          </button>
          <span className="pm-stat-cur">{statVal}</span>
          <button className="pm-adj-btn pm-adj-p" onClick={() => onAdj(player, 1)} aria-label={`${player.name} +1`}>
            <Icon name="plus" size={20} />
          </button>
        </div>
      )}
    </div>
  )
}
