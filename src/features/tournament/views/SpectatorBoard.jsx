import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../../components/Icon'
import { formatCode } from '../cloud'
import { involves, isPlayed, listFixtures, planCourts, recentResults, standingTables } from '../overview'
import FixtureCard from '../components/board/FixtureCard'
import StandingsBoard from '../components/board/StandingsBoard'
import BracketBoard from '../components/board/BracketBoard'
import TeamFilter from '../components/board/TeamFilter'
import RosterCard from '../components/board/RosterCard'
import TournamentClock from '../components/board/TournamentClock'

const FOCUS_KEY = 'tchouk_trn_focus'
const NEW_MS = 12000

function loadFocus(id) {
  try { return JSON.parse(localStorage.getItem(FOCUS_KEY) || '{}')[id] || null } catch { return null }
}
function saveFocus(id, team) {
  try {
    const all = JSON.parse(localStorage.getItem(FOCUS_KEY) || '{}')
    if (team) all[id] = team; else delete all[id]
    localStorage.setItem(FOCUS_KEY, JSON.stringify(all))
  } catch {}
}

// « il y a 12 s », rafraîchi chaque seconde.
function useAgo(iso) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (!iso) return null
  return Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
}

// Résultats arrivés depuis l'ouverture → heure jusqu'à laquelle les signaler.
// (L'écran se re-rend chaque seconde via useAgo, ce qui fait disparaître le badge.)
function useFreshResults(results) {
  const seen = useRef(null)
  const [fresh, setFresh] = useState({})
  useEffect(() => {
    const ids = results.map(f => f.match.id)
    if (seen.current === null) { seen.current = new Set(ids); return }
    const added = ids.filter(id => !seen.current.has(id))
    ids.forEach(id => seen.current.add(id))
    if (!added.length) return
    const until = Date.now() + NEW_MS
    setFresh(prev => ({ ...prev, ...Object.fromEntries(added.map(id => [id, until])) }))
  }, [results])
  return fresh
}

function agoLabel(t, sec) {
  if (sec == null) return null
  if (sec < 10) return t('tournament.board.agoNow')
  if (sec < 60) return t('tournament.board.agoSec', { n: sec })
  if (sec < 3600) return t('tournament.board.agoMin', { n: Math.floor(sec / 60) })
  return t('tournament.board.agoHour', { n: Math.floor(sec / 3600) })
}

// Écran public : grand, lisible, centré sur « qui joue où, et ensuite ? ».
// Rien n'y est modifiable.
export default function SpectatorBoard({ tournament, syncStatus, updatedAt, code }) {
  const { t } = useTranslation()
  const rootRef = useRef(null)
  const [focus, setFocusState] = useState(() => loadFocus(tournament.id))
  const [isFull, setIsFull] = useState(false)

  const fixtures = useMemo(() => listFixtures(tournament), [tournament])
  const tables   = useMemo(() => standingTables(tournament), [tournament])
  const plan     = useMemo(() => planCourts(tournament, fixtures), [tournament, fixtures])
  const results  = useMemo(() => recentResults(fixtures), [fixtures])
  const fresh    = useFreshResults(results)
  const ago      = useAgo(updatedAt)

  const done  = fixtures.filter(f => isPlayed(f.match)).length
  const total = fixtures.length
  const pct   = total ? Math.round((done / total) * 100) : 0
  const formatLabel = t('tournament.formatLabel', { returnObjects: true })

  const keep = f => !focus || involves(f, focus)
  const onCourt = plan.onCourt.map((f, i) => f && { fixture: f, court: i + 1 }).filter(Boolean)
  const slots = plan.slots.map(sl => sl.filter(x => keep(x.fixture))).map((sl, i) => ({ sl, i })).filter(x => x.sl.length)
  const teamResults = focus ? results.filter(f => involves(f, focus)) : results
  const live = syncStatus !== 'offline'
  const latestFresh = results.find(f => (fresh[f.match.id] || 0) > Date.now())

  function setFocus(team) {
    setFocusState(team)
    saveFocus(tournament.id, team)
  }

  useEffect(() => {
    const onChange = () => setIsFull(document.fullscreenElement === rootRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else rootRef.current?.requestFullscreen?.().catch(() => {})
  }

  const canFullscreen = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen

  return (
    <div className={`sp${isFull ? ' sp-full' : ''}`} ref={rootRef}>
      <header className="sp-hero">
        <div className="sp-hero-main">
          <div className="sp-hero-top">
            <span className={`sp-live${live ? '' : ' sp-live-off'}`}>
              <span className="sp-live-dot" aria-hidden="true" />
              {live ? t('tournament.board.live') : t('tournament.board.offline')}
            </span>
            {ago != null && <span className="sp-ago">{t('tournament.board.updated', { ago: agoLabel(t, ago) })}</span>}
          </div>
          <h1 className="sp-name">{tournament.name}</h1>
          <p className="sp-sub">
            {formatLabel[tournament.format]} · {t('tournament.teamsCount', { count: tournament.teams.length })}
            {code && <> · <span className="sp-nowrap">{t('tournament.share.codeLabel')} {formatCode(code)}</span></>}
          </p>
        </div>
        <div className="sp-hero-side">
          {tournament.clock?.durationSec > 0 && <TournamentClock clock={tournament.clock} variant="hero" />}
          <div className="sp-prog" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}
               aria-label={t('tournament.matchesPlayed', { done, total })}>
            <span className="sp-prog-num">{done}<small>/{total}</small></span>
            <span className="sp-prog-label">{t('tournament.board.matchesDone')}</span>
            <span className="sp-prog-track"><span style={{ width: `${pct}%` }} /></span>
          </div>
          {canFullscreen && (
            <button className="sp-full-btn" onClick={toggleFull} aria-label={isFull ? t('tournament.board.exitFull') : t('tournament.board.full')}
                    title={isFull ? t('tournament.board.exitFull') : t('tournament.board.full')}>
              <Icon name={isFull ? 'shrink' : 'expand'} size={20} />
            </button>
          )}
        </div>
      </header>

      <p className="sr-only" aria-live="polite">
        {latestFresh ? t('tournament.board.newResult', {
          team1: latestFresh.match.team1, s1: latestFresh.match.score1,
          team2: latestFresh.match.team2, s2: latestFresh.match.score2,
        }) : ''}
      </p>

      <TeamFilter teams={tournament.teams} value={focus} onChange={setFocus} label={t('tournament.board.followTeam')} />

      {onCourt.length > 0 && (
        <section className="sp-sec" aria-labelledby="sp-oncourt">
          <h2 id="sp-oncourt" className="sp-sec-title">{plan.count > 1 ? t('tournament.courts.onCourts') : t('tournament.courts.nowPlaying')}</h2>
          <div className={`sp-courts${onCourt.length > 1 ? ' sp-courts-multi' : ''}`}>
            {onCourt.map(({ fixture, court }) => (
              <FixtureCard key={fixture.match.id} fixture={fixture} focusTeam={focus} live
                           court={plan.count > 1 ? court : null} dim={focus && !involves(fixture, focus)} />
            ))}
          </div>
        </section>
      )}

      <div className="sp-grid">
        <section className="sp-sec sp-a-plan" aria-labelledby="sp-plan">
          <h2 id="sp-plan" className="sp-sec-title">
            {focus ? t('tournament.board.teamUpcoming', { team: focus }) : t('tournament.courts.order')}
          </h2>
          {slots.length === 0 && plan.waiting.length === 0 ? (
            <p className="sp-empty">{t('tournament.board.noUpcoming')}</p>
          ) : (
            <ol className="sp-slots">
              {slots.map(({ sl, i }) => (
                <li key={i} className="sp-slot">
                  <h3 className="plan-slot-title">
                    {t('tournament.courts.slot', { n: i + 1 })}
                    {i === 0 && <span className="plan-next">{t('tournament.courts.nextSlot')}</span>}
                  </h3>
                  <div className="sp-list">
                    {sl.map(({ fixture, court }) => (
                      <FixtureCard key={fixture.match.id} fixture={fixture} focusTeam={focus} court={plan.count > 1 ? court : null} />
                    ))}
                  </div>
                </li>
              ))}
              {plan.waiting.filter(keep).length > 0 && (
                <li className="sp-slot">
                  <h3 className="plan-slot-title">{t('tournament.courts.waitingTitle')}</h3>
                  <div className="sp-list">
                    {plan.waiting.filter(keep).map(f => <FixtureCard key={f.match.id} fixture={f} focusTeam={focus} />)}
                  </div>
                </li>
              )}
            </ol>
          )}
        </section>

        <aside className="sp-col sp-a-side">
          {focus && tournament.rosters?.[focus]?.length > 0 && (
            <section className="sp-sec">
              <h2 className="sp-sec-title">{t('tournament.board.roster')}</h2>
              <RosterCard team={focus} players={tournament.rosters[focus]} highlight />
            </section>
          )}

          <section className="sp-sec">
            <h2 className="sp-sec-title">
              {focus ? t('tournament.board.teamResults', { team: focus }) : t('tournament.board.results')}
            </h2>
            {teamResults.length === 0 ? (
              <p className="sp-empty">{t('tournament.board.noResults')}</p>
            ) : (
              <div className="sp-list">
                {teamResults.slice(0, focus ? 10 : 6).map(f => (
                  <FixtureCard key={f.match.id} fixture={f} focusTeam={focus} isNew={(fresh[f.match.id] || 0) > Date.now()} />
                ))}
              </div>
            )}
          </section>
        </aside>

        <section className="sp-sec sp-a-table">
          <h2 className="sp-sec-title">{t('tournament.standingsTitle')}</h2>
          <div className={`sp-tables${tables.length > 1 ? ' sp-tables-multi' : ''}`}>
            {tables.map(table => (
              <StandingsBoard key={table.id} table={table} fixtures={fixtures} focusTeam={focus} onPickTeam={team => setFocus(focus === team ? null : team)} />
            ))}
          </div>
        </section>

        {tournament.knockoutRounds && (
          <section className="sp-sec sp-a-bracket">
            <h2 className="sp-sec-title">{t('tournament.pdf.knockoutStage')}</h2>
            <BracketBoard rounds={tournament.knockoutRounds} focusTeam={focus} />
          </section>
        )}
      </div>
    </div>
  )
}
