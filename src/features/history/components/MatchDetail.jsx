import { useTranslation } from 'react-i18next'
import { fmtClock, fmtDateTime } from '../../../lib/format'
import { teamTextStyle, teamSwatchStyle } from '../../../lib/teamColor'
import PageHeader from '../../../components/PageHeader'
import Icon from '../../../components/Icon'
import { downloadMatchPdf } from '../pdf'
import MiniTimeline from './MiniTimeline'

export default function MatchDetail({ match, onClose }) {
  const { t } = useTranslation()
  const { teams, timeline, settings } = match
  const shotEvents = (timeline || []).filter(e => e.category === 'tirs')
  const isScorerOnly = match.mode === 'scorer'

  return (
    <div className="hist-detail">
      <PageHeader
        title={fmtDateTime(match.playedAt)}
        onBack={onClose}
        actions={(
          <button className="btn-mini" onClick={() => downloadMatchPdf(match)}>
            <Icon name="download" size={16} />{t('history.pdfBtn')}
          </button>
        )}
      />

      <div className="mr-detail-names">
        {teams.map((tm, i) => (
          <span className="mr-name" key={i}>
            {settings?.teamColors?.[i] && <span className="team-dot" style={teamSwatchStyle(settings.teamColors[i])} />}
            {tm.name}
          </span>
        ))}
      </div>
      <div className="rf">
        {teams.map((tm, i) => (
          <span key={i}>
            {i > 0 && <span className="rf-sep">–</span>}
            <span style={settings?.teamColors?.[i] ? teamTextStyle(settings.teamColors[i]) : undefined}>{tm.score}</span>
          </span>
        ))}
      </div>

      <div className="card">
        <div className="ctitle">{t('history.summaryTitle')}</div>
        <div className="si"><div className="si-l">{t('results.ui.format')}</div><span className="si-v sub">{match.settings?.halfCount}×{match.settings?.halfDurationMin} min</span></div>
        <div className="si"><div className="si-l">{t('history.actualDuration')}</div><span className="si-v sub">{fmtClock(match.durationSec)}</span></div>
        {!isScorerOnly && (
          <div className="si"><div className="si-l">{t('history.shotEventsLabel')}</div><span className="si-v sub">{match.shotEvents}</span></div>
        )}
      </div>

      {!isScorerOnly && teams.map((tm, i) => (
        <div className="card card-team" key={i}>
          <div className="ctitle">
            {settings?.teamColors?.[i] && <span className="team-dot" style={teamSwatchStyle(settings.teamColors[i])} />}
            {tm.name}
          </div>
          <div className="si"><div className="si-l">{t('history.score')}</div><span className="si-v">{tm.score}</span></div>
          <div className="si"><div className="si-l">{t('results.ui.shotsTitle')}</div><span className="si-v sub">{tm.tirs}</span></div>
          <div className="si"><div className="si-l">{t('results.ui.won')}</div><span className="si-v sub">{tm.tGagne}</span></div>
          <div className="si"><div className="si-l">{t('results.ui.given')}</div><span className="si-v sub">{tm.tDonne}</span></div>
          <div className="si"><div className="si-l">{t('results.ui.caught')}</div><span className="si-v sub">{tm.tCatche}</span></div>
          <div className="si"><div className="si-l">{t('history.shotFoulsShort')}</div><span className="si-v sub">{tm.tFaute}</span></div>
          <div className="si"><div className="si-l">{t('results.ui.totalFouls')}</div><span className="si-v sub">{tm.fautes}</span></div>
          <div className="si"><div className="si-l">{t('results.ui.possessions')}</div><span className="si-v sub">{tm.pos}</span></div>
          {tm.tirs > 0 && (
            <div className="si">
              <div className="si-l">{t('results.ui.offEff')}</div>
              <span className="si-v sub">{Math.round((tm.tGagne / tm.tirs) * 100)}<span className="unit">%</span></span>
            </div>
          )}
        </div>
      ))}

      {!isScorerOnly && (
        <div className="card">
          <div className="ctitle">{t('history.timelineTitle')}</div>
          <MiniTimeline timeline={timeline} settings={settings} teams={(match.teamsSnapshot || []).map((tm, i) => ({ ...tm, name: teams[i]?.name || tm.name }))} />
          <div className="tg-legend">
            {teams.map((tm, i) => (
              <div className="tg-leg-item" key={i}>
                <span className="tg-leg-dot" style={settings?.teamColors?.[i] ? teamSwatchStyle(settings.teamColors[i]) : { background: 'var(--dim)' }} />
                <span>{tm.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isScorerOnly && shotEvents.length > 0 && (
        <div className="card">
          <div className="ctitle">{t('history.eventsTitle', { count: shotEvents.length })}</div>
          <div className="tl-list">
            {shotEvents.map((ev, i) => {
              const color = settings?.teamColors?.[ev.teamIdx]
              return (
                <div className="tl-item" key={`${ev.at}-${i}`}>
                  <div className="tl-time">{fmtClock(ev.elapsedSec)}</div>
                  <div className="tl-main">
                    <div className="tl-label">
                      {color && <span className="team-dot" style={teamSwatchStyle(color)} />}
                      <span className="tl-team">{ev.teamName}</span>
                      {t(`shotLabels.${ev.id}`, ev.id)}
                      <span className={`tl-delta ${ev.d > 0 ? 'pos' : 'neg'}`}>{ev.d > 0 ? '+1' : '-1'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
