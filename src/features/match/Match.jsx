import { useTranslation } from 'react-i18next'
import { score } from '../../lib/stats'
import { fmtClock } from '../../lib/format'
import { teamTextStyle, teamSwatchStyle } from '../../lib/teamColor'
import { useMatchClock } from '../../hooks/useMatchClock'
import Animated from './components/Animated'
import Panel from './components/Panel'
import './match.css'

export default function Match({ teams, numTeams, onAdj, onEnd, settings }) {
  const { t } = useTranslation()
  const two = numTeams === 2

  const {
    elapsedSec, running, setRunning,
    halfCount, currentHalf, remainingHalfSec, remainingMatchSec,
    handleSkipHalf, handleResetCurrentHalf, handleResetAll,
  } = useMatchClock(settings)

  const c1 = settings?.teamColors?.[0] || '#0e9f8f'
  const c2 = settings?.teamColors?.[1] || '#d14343'

  function handleEnd() {
    if (window.confirm(t('match.endConfirm'))) onEnd()
  }

  return (
    <>
      <div className="sb">
        <div className="sb-scores">
          {two ? (
            <>
              <div className="sb-t">
                <div className="sb-name"><span className="team-dot" style={teamSwatchStyle(c1)} />{teams[0].name}</div>
                <Animated value={score(teams, numTeams, 0)} className="sb-score" style={teamTextStyle(c1)} />
              </div>
              <div className="sb-sep">–</div>
              <div className="sb-t">
                <Animated value={score(teams, numTeams, 1)} className="sb-score" style={teamTextStyle(c2)} />
                <div className="sb-name"><span className="team-dot" style={teamSwatchStyle(c2)} />{teams[1].name}</div>
              </div>
            </>
          ) : (
            <div className="sb-t">
              <div className="sb-name">{teams[0].name}</div>
              <Animated value={score(teams, numTeams, 0)} className="sb-score" style={teamTextStyle(c1)} />
            </div>
          )}
        </div>

        <div className="clock-wrap">
          <div className="clock-main">{fmtClock(remainingHalfSec)}</div>
          <div className="clock-meta">
            {t('match.clockMeta', { current: currentHalf, total: halfCount, time: fmtClock(remainingMatchSec) })}
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

      <div className={`grid${two ? ' g2' : ''}`}>
        {teams.map((team, i) => (
          <Panel key={i} team={team} teamIdx={i} numTeams={numTeams} onAdj={onAdj} />
        ))}
      </div>

      <button className="btn-end" onClick={handleEnd}>
        {t('match.endButton')}
      </button>
    </>
  )
}
