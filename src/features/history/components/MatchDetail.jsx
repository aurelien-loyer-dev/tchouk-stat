import { useTranslation } from 'react-i18next'
import { fmtClock, fmtDayLabel, fmtTime } from '../../../lib/format'
import { teamSwatchStyle } from '../../../lib/teamColor'
import PageHeader from '../../../components/PageHeader'
import ScoreHero from '../../../components/ScoreHero'
import Icon from '../../../components/Icon'
import { downloadMatchPdf } from '../pdf'
import MiniTimeline from './MiniTimeline'

export function DetailActions({ match, onDelete }) {
  const { t } = useTranslation()
  return (
    <>
      <button className="btn-mini" onClick={() => downloadMatchPdf(match)}>
        <Icon name="download" size={16} />{t('history.pdfBtn')}
      </button>
      <button className="btn-mini btn-mini-danger" onClick={() => onDelete(match)}>
        <Icon name="trash" size={16} />{t('history.delete')}
      </button>
    </>
  )
}

export default function MatchDetail({ match, onClose, onDelete }) {
  const { t } = useTranslation()
  const { teams, timeline, settings } = match
  const shotEvents = (timeline || []).filter(e => e.category === 'tirs')
  const isScorerOnly = match.mode === 'scorer'
  const colors = settings?.teamColors || []

  return (
    <div className="hist-detail">
      <PageHeader
        title={t(`history.modes.${match.mode || 'stats'}`)}
        subtitle={`${fmtDayLabel(match.playedAt)} · ${fmtTime(match.playedAt)}`}
        onBack={onClose}
        actions={<DetailActions match={match} onDelete={onDelete} />}
      />

      <ScoreHero
        teams={teams.map((tm, i) => ({ name: tm.name, score: tm.score, color: colors[i] }))}
        meta={`${settings?.halfCount}×${settings?.halfDurationMin} min · ${t('history.duration')} ${fmtClock(match.durationSec)}`}
      />

      {isScorerOnly && <p className="hist-note">{t('history.scorerOnlyNote')}</p>}

      {!isScorerOnly && teams.map((tm, i) => (
        <div className="card card-team" key={i}>
          <div className="ctitle">
            {colors[i] && <span className="team-dot" style={teamSwatchStyle(colors[i])} />}
            {tm.name}
          </div>
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

      {shotEvents.length > 0 && (
        <div className="card">
          <div className="ctitle">{t('history.timelineTitle')}</div>
          <MiniTimeline timeline={timeline} settings={settings} teams={(match.teamsSnapshot || []).map((tm, i) => ({ ...tm, name: teams[i]?.name || tm.name }))} />
          <div className="tg-legend">
            {teams.map((tm, i) => (
              <div className="tg-leg-item" key={i}>
                <span className="tg-leg-dot" style={colors[i] ? teamSwatchStyle(colors[i]) : { background: 'var(--dim)' }} />
                <span>{tm.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {shotEvents.length > 0 && (
        <div className="card">
          <div className="ctitle">{t('history.eventsTitle', { count: shotEvents.length })}</div>
          <div className="tl-list">
            {shotEvents.map((ev, i) => {
              const color = colors[ev.teamIdx]
              return (
                <div className="tl-item" key={`${ev.at}-${i}`}>
                  <div className="tl-time">{fmtClock(ev.elapsedSec)}</div>
                  <div className="tl-main">
                    <div className="tl-label">
                      {color && <span className="team-dot" style={teamSwatchStyle(color)} />}
                      <span className="tl-team">{ev.teamName}</span>
                      {t(`shotLabels.${ev.id}`, ev.id)}
                      <span className={`tl-delta ${ev.d > 0 ? 'pos' : 'neg'}`}>{ev.d > 0 ? '+1' : '-1'}</span>
                      {ev.scores && <span className="tl-score">{ev.scores.join('–')}</span>}
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
