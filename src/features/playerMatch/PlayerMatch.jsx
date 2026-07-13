import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_STATS, STAT_GROUPS, playerTeamScore } from '../../lib/playerStats'
import { fmtClock } from '../../lib/format'
import { teamTextStyle, teamSwatchStyle } from '../../lib/teamColor'
import { useMatchClock } from '../../hooks/useMatchClock'
import TeamColumn from './components/TeamColumn'
import './playerMatch.css'

export default function PlayerMatch({ teams, players, numTeams, onPlayerAdj, onEnd, settings }) {
  const { t } = useTranslation()
  const [selectedStat, setSelectedStat] = useState(null)
  const [focusedTeam, setFocusedTeam]   = useState(null) // null = les deux, 0 = équipe 1, 1 = équipe 2

  const {
    elapsedSec, running, setRunning,
    halfCount, currentHalf, remainingHalfSec, remainingMatchSec,
    handleSkipHalf, handleResetCurrentHalf, handleResetAll,
  } = useMatchClock(settings)

  const n = numTeams ?? 2

  const c1 = settings?.teamColors?.[0] || '#0e9f8f'
  const c2 = settings?.teamColors?.[1] || '#d14343'

  const score0      = playerTeamScore(players, 0, n)
  const score1      = n === 2 ? playerTeamScore(players, 1, n) : null
  const team1Players = players.filter(p => p.teamIdx === 0)
  const team2Players = players.filter(p => p.teamIdx === 1)
  const selectedDef  = PLAYER_STATS.find(s => s.id === selectedStat)

  function handleStatClick(statId) {
    setSelectedStat(prev => {
      if (prev === statId) { setFocusedTeam(null); return null }
      return statId
    })
  }

  function handleTeamFocus(idx) {
    setFocusedTeam(prev => (prev === idx ? null : idx))
  }

  function handlePlayerAdj(player, d) {
    if (!selectedStat) return
    onPlayerAdj(player.id, selectedStat, d)
  }

  function handleEnd() {
    if (window.confirm(t('match.endConfirm'))) onEnd()
  }

  return (
    <>
      {/* ── Tableau de bord + Timer ── */}
      <div className="sb">
        <div className="sb-scores">
          {n === 2 ? (
            <>
              <div className="sb-t">
                <div className="sb-name"><span className="team-dot" style={teamSwatchStyle(c1)} />{teams[0]?.name}</div>
                <div className="sb-score" style={teamTextStyle(c1)}>{score0}</div>
              </div>
              <div className="sb-sep">–</div>
              <div className="sb-t">
                <div className="sb-score" style={teamTextStyle(c2)}>{score1}</div>
                <div className="sb-name"><span className="team-dot" style={teamSwatchStyle(c2)} />{teams[1]?.name}</div>
              </div>
            </>
          ) : (
            <div className="sb-t">
              <div className="sb-name"><span className="team-dot" style={teamSwatchStyle(c1)} />{teams[0]?.name}</div>
              <div className="sb-score" style={teamTextStyle(c1)}>{score0}</div>
            </div>
          )}
        </div>
        <div className="clock-wrap">
          <div className="clock-main">{fmtClock(remainingHalfSec)}</div>
          <div className="clock-meta">
            {t('playerMatch.clockMeta', { current: currentHalf, total: halfCount, time: fmtClock(remainingMatchSec) })}
          </div>
          <div className="clock-ctrl">
            <button className="btn-mini" onClick={() => setRunning(v => !v)}>
              {running ? t('match.pause') : elapsedSec > 0 ? t('match.resume') : t('match.start')}
            </button>
            {currentHalf < halfCount && (
              <button className="btn-mini" onClick={handleSkipHalf} title={t('match.nextHalfTitle')}>
                {t('match.nextHalfShort')}
              </button>
            )}
            <button className="btn-mini" onClick={handleResetCurrentHalf} title={t('match.resetHalfTitle')}>
              {t('match.resetHalfShort')}
            </button>
            <button className="btn-mini" onClick={handleResetAll} title={t('match.resetAllTitle')}>
              {t('match.resetAllShort')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sélecteur de stats ── */}
      <div className="pm-stats-panel">
        <div className={`pm-stats-hint${selectedDef ? ' pm-hint-active' : ''}`}>
          {selectedDef
            ? <>{t('playerMatch.statHintPrefix')}<strong>{t(selectedDef.labelKey)}</strong>{t('playerMatch.statHintSuffix')}</>
            : t('playerMatch.statHintDefault')}
        </div>
        <div className="pm-stat-groups">
          {STAT_GROUPS.map(group => {
            const stats = PLAYER_STATS.filter(s => s.group === group.id)
            return (
              <div key={group.id} className="pm-stat-group">
                <div className="pm-stat-group-label">{t(group.labelKey)}</div>
                <div className="pm-stat-grid">
                  {stats.map(stat => (
                    <button
                      key={stat.id}
                      className={[
                        'pm-stat-btn',
                        stat.color && `pm-stat-${stat.color}`,
                        selectedStat === stat.id && 'pm-stat-sel',
                      ].filter(Boolean).join(' ')}
                      onClick={() => handleStatClick(stat.id)}
                    >
                      <span className="pm-stat-label">{t(stat.labelKey)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Sélecteur d'équipe (visible quand une stat est active, 2 équipes) ── */}
      {selectedStat && n === 2 && (
        <div className="pm-team-selector">
          <button
            className={`pm-team-sel-btn${focusedTeam === 0 ? ' pm-team-sel-active' : ''}`}
            style={focusedTeam === 0 ? { borderColor: c1, color: 'var(--txt)' } : {}}
            onClick={() => handleTeamFocus(0)}
          >
            <span className="pm-team-sel-dot" style={teamSwatchStyle(c1)} />
            {teams[0]?.name}
          </button>

          <button className="pm-team-adv-btn" onClick={() => handleTeamFocus(focusedTeam === 0 ? 1 : 0)}>
            {t('playerMatch.opponent')}
          </button>

          <button
            className={`pm-team-sel-btn${focusedTeam === 1 ? ' pm-team-sel-active' : ''}`}
            style={focusedTeam === 1 ? { borderColor: c2, color: 'var(--txt)' } : {}}
            onClick={() => handleTeamFocus(1)}
          >
            <span className="pm-team-sel-dot" style={teamSwatchStyle(c2)} />
            {teams[1]?.name}
          </button>
        </div>
      )}

      {/* ── Joueurs en grille ── */}
      <div className={`pm-players-wrap${n === 1 ? ' pm-single-team' : ''}`}>
        <TeamColumn
          teamName={teams[0]?.name}
          teamColor={c1}
          players={team1Players}
          selectedStat={selectedStat}
          dimmed={selectedStat && n === 2 && focusedTeam === 1}
          onAdj={handlePlayerAdj}
        />
        {n === 2 && (
          <TeamColumn
            teamName={teams[1]?.name}
            teamColor={c2}
            players={team2Players}
            selectedStat={selectedStat}
            dimmed={selectedStat && focusedTeam === 0}
            onAdj={handlePlayerAdj}
          />
        )}
      </div>

      <button className="btn-end" onClick={handleEnd}>
        {t('match.endButton')}
      </button>
    </>
  )
}
