import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../../components/Icon'
import { estimateSchedule, fmtHour, involves, isPlayed, listFixtures, nextStep, planCourts, recentResults, sameCourts, standingTables } from '../overview'
import MatchRow from '../components/MatchRow'
import CrossTable from '../components/CrossTable'
import ValidationBanner from '../components/ValidationBanner'
import ScoreEntry from '../components/board/ScoreEntry'
import StandingsBoard from '../components/board/StandingsBoard'
import BracketBoard from '../components/board/BracketBoard'
import TeamFilter from '../components/board/TeamFilter'
import RosterCard from '../components/board/RosterCard'
import TournamentClock from '../components/board/TournamentClock'
import ScheduleBar from '../components/board/ScheduleBar'
import { useNow } from '../useNow'

const TABS = ['plan', 'done', 'table', 'rosters']

function FixtureEditRow({ fixture, tournament, onUpdate, focusTeam, court }) {
  const { t } = useTranslation()
  const m = fixture.match
  const mine = focusTeam && involves(fixture, focusTeam)
  return (
    <div className={`ob-row${mine ? ' ob-row-mine' : ''}`}>
      {(fixture.label || court) && (
        <div className="ob-row-head">
          {court && <span className="court-tag">{t('tournament.courts.short', { n: court })}</span>}
          {fixture.label && <span className="fx-label">{fixture.label}</span>}
        </div>
      )}
      <MatchRow
        key={m.id + m.score1 + m.score2 + m.team1 + m.team2}
        match={m}
        onScore={(s1, s2) => onUpdate(fixture.save(tournament, s1, s2))}
      />
    </div>
  )
}

// Poste de pilotage : chrono, matchs sur les terrains (saisie directe),
// planning des créneaux suivants, puis résultats, classements et équipes.
export default function OrganizerBoard({ tournament, onUpdate, finished, onValidate, onPlayMatch }) {
  const { t } = useTranslation()
  const [tab, setTab]     = useState('plan')
  const [focus, setFocus] = useState(null)

  const fixtures = useMemo(() => listFixtures(tournament), [tournament])
  const tables   = useMemo(() => standingTables(tournament), [tournament])
  const done     = useMemo(() => recentResults(fixtures), [fixtures])
  const plan     = useMemo(() => planCourts(tournament, fixtures), [tournament, fixtures])
  const step     = nextStep(tournament)
  const now      = useNow(30000)
  const est      = estimateSchedule(tournament, plan, now)

  // Les terrains attribués sont enregistrés dans le tournoi : les numéros
  // restent stables et les spectateurs voient la même chose.
  useEffect(() => {
    if (sameCourts(plan.courts, tournament.courts || {})) return
    // Heure de mise sur le terrain : sert à estimer la fin de chaque match.
    const stamp = new Date().toISOString()
    const courtsSince = Object.fromEntries(Object.keys(plan.courts).map(id => [id, tournament.courtsSince?.[id] || stamp]))
    onUpdate({ ...tournament, courts: plan.courts, courtsSince })
  }, [plan.courts])

  const playedCount = fixtures.filter(f => isPlayed(f.match)).length
  const pct = fixtures.length ? Math.round((playedCount / fixtures.length) * 100) : 0
  const onCourtCount = plan.onCourt.filter(Boolean).length
  const toPlay = onCourtCount + plan.slots.reduce((n, sl) => n + sl.length, 0)
  const doneList = focus ? done.filter(f => involves(f, focus)) : done
  const counts   = { plan: toPlay + plan.waiting.length, done: done.length }
  const hasRosters = Object.values(tournament.rosters || {}).some(p => p?.length)
  const canPlayers = f => !!(tournament.rosters?.[f.match.team1]?.length && tournament.rosters?.[f.match.team2]?.length)
  const setCourtCount = n => onUpdate({ ...tournament, courtCount: Math.max(1, Math.min(32, n)) })

  return (
    <div className="ob">
      <div className="ob-prog">
        <div className="ob-prog-text">
          <strong>{t('tournament.matchesPlayed', { done: playedCount, total: fixtures.length })}</strong>
          {plan.waiting.length > 0 && <span>{t('tournament.board.waiting', { count: plan.waiting.length })}</span>}
        </div>
        <div className="trn-prog-track"><div className="trn-prog-fill" style={{ width: `${pct}%` }} /></div>
      </div>

      <ScheduleBar schedule={tournament.schedule} estimate={est} onChange={schedule => onUpdate({ ...tournament, schedule })} />

      <TournamentClock clock={tournament.clock} editable onChange={clock => onUpdate({ ...tournament, clock })} />

      {step && (
        <div className="ob-step" role="status">
          <div>
            <div className="ob-step-title">{t(`tournament.board.step.${step.kind}.title`, { n: step.n })}</div>
            <div className="ob-step-text">{t(`tournament.board.step.${step.kind}.text`)}</div>
          </div>
          <button className="btn-acc" onClick={() => onUpdate(step.apply(tournament))}>
            {t(`tournament.board.step.${step.kind}.button`, { n: step.n })}
            <Icon name="chevron" size={18} />
          </button>
        </div>
      )}

      {finished && !step && <ValidationBanner onValidate={onValidate} />}

      {(onCourtCount > 0 || plan.count > 1) && (
        <section className="ob-courts" aria-labelledby="ob-courts-title">
          <div className="ob-courts-head">
            <h2 id="ob-courts-title" className="ob-courts-title">{t('tournament.courts.onCourts')}</h2>
            <div className="court-stepper" role="group" aria-label={t('tournament.courts.count')}>
              <button className="icon-btn" onClick={() => setCourtCount(plan.count - 1)} disabled={plan.count <= 1} aria-label={t('tournament.courts.fewer')}>
                <Icon name="minus" size={18} />
              </button>
              <span className="court-stepper-val">{t('tournament.courts.countN', { count: plan.count })}</span>
              <button className="icon-btn" onClick={() => setCourtCount(plan.count + 1)} aria-label={t('tournament.courts.more')}>
                <Icon name="plus" size={18} />
              </button>
            </div>
          </div>
          <div className={`ob-court-grid${plan.count > 1 ? ' ob-court-multi' : ''}`}>
            {plan.onCourt.map((f, i) => f ? (
              <ScoreEntry
                key={`${i}-${f.match.id}`}
                kicker={[
                  plan.count > 1 ? t('tournament.courts.court', { n: i + 1 }) : t('tournament.board.nextMatch'),
                  est?.courtEnds[i] && t('tournament.schedule.untilTime', { time: fmtHour(est.courtEnds[i]) }),
                ].filter(Boolean).join(' · ')}
                fixture={f}
                knockout={f.stage === 'knockout'}
                onSave={(s1, s2) => onUpdate(f.save(tournament, s1, s2))}
                onPlay={onPlayMatch ? mode => onPlayMatch(tournament, f, mode) : null}
                canPlayers={canPlayers(f)}
                compact={plan.count > 1}
              />
            ) : (
              <div key={`free-${i}`} className="court-free">
                <span className="court-tag">{t('tournament.courts.court', { n: i + 1 })}</span>
                <p>{plan.waiting.length ? t('tournament.courts.freeWaiting') : t('tournament.courts.free')}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="ob-tabs" role="tablist">
        {TABS.filter(id => id !== 'rosters' || hasRosters).map(id => (
          <button key={id} role="tab" aria-selected={tab === id} className={`ob-tab${tab === id ? ' on' : ''}`} onClick={() => setTab(id)}>
            {t(`tournament.board.tabs.${id}`)}
            {id in counts && <span className="ob-count">{counts[id]}</span>}
          </button>
        ))}
      </div>

      {(tab === 'plan' || tab === 'done') && (
        <TeamFilter teams={tournament.teams} value={focus} onChange={setFocus} label={t('tournament.board.filterTeam')} />
      )}

      {tab === 'plan' && (
        plan.slots.length === 0 && plan.waiting.length === 0 ? (
          <p className="ob-empty">{onCourtCount ? t('tournament.courts.nothingAfter') : t('tournament.board.noUpcoming')}</p>
        ) : (
          <div className="plan">
            {plan.slots.map((slot, si) => {
              const rows = slot.filter(s => !focus || involves(s.fixture, focus))
              if (!rows.length) return null
              return (
                <section key={si} className="plan-slot">
                  <h3 className="plan-slot-title">
                    {t('tournament.courts.slot', { n: si + 1 })}
                    {est?.slotStarts[si] && <span className="plan-time">~{fmtHour(est.slotStarts[si])}</span>}
                    {si === 0 && <span className="plan-next">{t('tournament.courts.nextSlot')}</span>}
                  </h3>
                  <div className="ob-list">
                    {rows.map(({ fixture, court }) => (
                      <FixtureEditRow key={fixture.match.id} fixture={fixture} tournament={tournament} onUpdate={onUpdate}
                                      focusTeam={focus} court={plan.count > 1 ? court : null} />
                    ))}
                  </div>
                </section>
              )
            })}
            {plan.waiting.length > 0 && (
              <section className="plan-slot plan-waiting">
                <h3 className="plan-slot-title">{t('tournament.courts.waitingTitle')}</h3>
                <ul className="plan-wait-list">
                  {plan.waiting.filter(f => !focus || involves(f, focus)).map(f => (
                    <li key={f.match.id}>
                      {f.label && <span className="fx-label">{f.label}</span>}
                      <span>{f.match.team1 === 'TBD' ? t('tournament.board.tbd') : f.match.team1}</span>
                      <span className="ob-then-vs">{t('tournament.board.vs')}</span>
                      <span>{f.match.team2 === 'TBD' ? t('tournament.board.tbd') : f.match.team2}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )
      )}

      {tab === 'done' && (
        doneList.length === 0 ? (
          <p className="ob-empty">{t('tournament.board.noResults')}</p>
        ) : (
          <>
            <p className="ob-hint">{t('tournament.board.editHint')}</p>
            <div className="ob-list">
              {doneList.map(f => <FixtureEditRow key={f.match.id} fixture={f} tournament={tournament} onUpdate={onUpdate} focusTeam={focus} />)}
            </div>
          </>
        )
      )}

      {tab === 'rosters' && hasRosters && (
        <div className="rst-grid">
          {tournament.teams.filter(tm => tournament.rosters[tm]?.length).map(tm => (
            <RosterCard key={tm} team={tm} players={tournament.rosters[tm]} />
          ))}
        </div>
      )}

      {tab === 'table' && (
        <div className="ob-tables">
          <div className={`sp-tables${tables.length > 1 ? ' sp-tables-multi' : ''}`}>
            {tables.map(table => (
              <div key={table.id} className="ob-table-block">
                <StandingsBoard table={table} fixtures={fixtures} detailed />
                {tournament.format !== 'swiss' && (
                  <details className="ob-xt">
                    <summary>{t('tournament.crossTable')}</summary>
                    <CrossTable teams={table.teams} matches={table.matches} />
                  </details>
                )}
              </div>
            ))}
          </div>
          {tournament.knockoutRounds && (
            <>
              <h3 className="sp-sec-title">{t('tournament.pdf.knockoutStage')}</h3>
              <BracketBoard rounds={tournament.knockoutRounds} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
