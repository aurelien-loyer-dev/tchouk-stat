import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { score, tirs, pointAdv, tirAdvMarques, tirsAdv, catchsNous, fautesTotal } from '../../lib/stats'
import { fmtClock, fmtDateTime } from '../../lib/format'
import { teamTextStyle } from '../../lib/teamColor'
import TimelineGraph from './components/TimelineGraph'
import { N, Pct, Ratio, Row, Card } from './components/StatDisplay'
import { downloadResultsPdf } from './pdf'
import './results.css'

export default function Results({
  teams,
  numTeams,
  timeline,
  settings,
  summary,
  onNew,
}) {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)

  if (!teams || teams.length === 0) return null

  const c1 = settings?.teamColors?.[0] || '#0e9f8f'
  const c2 = settings?.teamColors?.[1] || '#d14343'

  const activeTeam = teams[tab]
  const n   = numTeams
  const ti  = tirs(teams, n, tab)
  const pa  = pointAdv(teams, n, tab)
  const tam = tirAdvMarques(teams, n, tab)
  const ta  = tirsAdv(teams, n, tab)   // tirs adverses total (2-team only)
  const cn  = catchsNous(teams, n, tab) // nos catches défensifs
  const ft  = fautesTotal(activeTeam)

  const shotEvents = (timeline || []).filter(e => e.teamIdx === tab && e.category === 'tirs')

  function handleDownloadSheet() {
    downloadResultsPdf({ teams, timeline, settings, summary, t })
  }

  return (
    <>
      {/* Score final */}
      <div className="rf">
        {n === 1 ? (
          <span style={teamTextStyle(c1)}>{score(teams, n, 0)}</span>
        ) : (
          <>
            <span style={teamTextStyle(c1)}>{score(teams, n, 0)}</span>
            <span style={{ color: 'var(--s3)', fontWeight: 200 }}> – </span>
            <span style={teamTextStyle(c2)}>{score(teams, n, 1)}</span>
          </>
        )}
      </div>

      {/* Onglets équipes */}
      {n === 2 && (
        <div className="tabs">
          {teams.map((team, i) => (
            <button
              key={i}
              className={`tab${i === tab ? ` a${i}` : ''}`}
              onClick={() => setTab(i)}
            >
              {team.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Resume ── */}
      {summary && (
        <Card title={t('results.ui.summaryTitle')}>
          <Row label={t('results.ui.date')}>
            <span className="si-v sub">{fmtDateTime(summary.playedAt)}</span>
          </Row>
          <Row label={t('results.ui.totalDuration')}>
            <span className="si-v sub">{fmtClock(summary.durationSec)}</span>
          </Row>
          <Row label={t('results.ui.format')}>
            <span className="si-v sub">{t('results.ui.formatTeams', { count: summary.numTeams })}</span>
          </Row>
          <Row label={t('results.ui.halves')}>
            <span className="si-v sub">{settings?.halfCount || '-'} x {settings?.halfDurationMin || '-'} min</span>
          </Row>
          <Row label={t('results.ui.shotEventsRecorded')}>
            <span className="si-v sub">{summary.shotEvents ?? 0}</span>
          </Row>
        </Card>
      )}

      {/* ── Tirs ── */}
      <Card title={t('results.ui.shotsTitle')}>
        <Row label={t('results.ui.totalShots')}><N v={ti} /></Row>
        <Row label={t('results.ui.won')} sub={t('results.ui.wonSub')}><N v={activeTeam.tGagne} /></Row>
        <Row label={t('results.ui.given')} sub={t('results.ui.givenSub')}><N v={activeTeam.tDonne} /></Row>
        <Row label={t('results.ui.caught')} sub={t('results.ui.caughtSub')}><N v={activeTeam.tCatche} /></Row>
        <Row label={t('results.ui.shotFouls')} sub={t('results.ui.shotFoulsSub')}><N v={activeTeam.tFaute} /></Row>
      </Card>

      {/* ── Passes ── */}
      <Card title={t('results.ui.passesTitle')}>
        <Row label={t('results.ui.totalPasses')}><N v={activeTeam.pReussie + activeTeam.pRatee} /></Row>
        <Row label={t('results.ui.missedPasses')}><N v={activeTeam.pRatee} /></Row>
      </Card>

      {/* ── Fautes techniques ── */}
      <Card title={t('results.ui.techFoulsTitle')}>
        <Row label={t('results.ui.totalFouls')}><N v={ft} /></Row>
        <Row label={t('results.ui.shotFouls')}><span className="si-v sub">{activeTeam.tFaute}</span></Row>
        <Row label={t('results.ui.techFouls')}><span className="si-v sub">{(activeTeam.fTech ?? 0) + (activeTeam.fZone ?? 0) + (activeTeam.fMarche ?? 0) + (activeTeam.fAutre ?? 0)}</span></Row>
      </Card>

      {/* ── Données adverses ── */}
      <Card title={t('results.ui.opponentDataTitle')}>
        <Row label={t('results.ui.opponentScoreTotal')}><N v={pa} /></Row>
        <Row label={t('results.ui.opponentShotsScored')} sub={t('results.ui.opponentShotsScoredSub')}>
          <N v={tam} />
        </Row>
        {n === 2 && (
          <Row label={t('results.ui.opponentShotsTotal')}><N v={ta} /></Row>
        )}
        <Row
          label={t('results.ui.ourCatches')}
          sub={n === 2 ? t('results.ui.ourCatchesSub2') : null}
        >
          <N v={cn} />
        </Row>
        <Row label={t('results.ui.possessions')}><N v={activeTeam.pos} /></Row>
      </Card>

      {/* ── Ratios ── */}
      <Card title={t('results.ui.ratiosTitle')}>
        <Row label={t('results.ui.offEff')} sub={t('results.ui.offEffSub')}>
          <Pct num={activeTeam.tGagne} den={ti} />
        </Row>
        <Row label={t('results.ui.defEff')} sub={n === 2 ? t('results.ui.defEffSub2') : t('results.ui.defEffSub1')}>
          <Pct num={cn} den={n === 2 ? ta : tam} />
        </Row>
        <Row label={t('results.ui.actionConversion')} sub={t('results.ui.actionConversionSub')}>
          <Ratio num={ti} den={activeTeam.pos} />
        </Row>
        <Row label={t('results.ui.pointsGiven')} sub={t('results.ui.pointsGivenSub')}>
          <Pct num={activeTeam.tDonne} den={ti} />
        </Row>
      </Card>

      {/* ── Timeline des points ── */}
      <Card title={t('results.ui.timelineTitle')}>
        <TimelineGraph teams={teams} timeline={timeline} settings={settings} />

        {shotEvents.length > 0 && (
          <div className="tl-list">
            {shotEvents.map((ev, i) => (
              <div className="tl-item" key={`${ev.at}-${i}`}>
                <div className="tl-time">{fmtClock(ev.elapsedSec)}</div>
                <div className="tl-main">
                  <div className="tl-label">
                    {t(`shotLabels.${ev.id}`, ev.id)}
                    <span className={`tl-delta ${ev.d > 0 ? 'pos' : 'neg'}`}>{ev.d > 0 ? '+1' : '-1'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <button
        className="btn-ghost"
        style={{ alignSelf: 'center', minWidth: 260, marginTop: 4 }}
        onClick={handleDownloadSheet}
      >
        {t('results.ui.downloadPdf')}
      </button>

      <button
        className="btn-ghost"
        style={{ alignSelf: 'center', minWidth: 200, marginTop: 8 }}
        onClick={onNew}
      >
        {t('results.ui.newMatch')}
      </button>
    </>
  )
}
