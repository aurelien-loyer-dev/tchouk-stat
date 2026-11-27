import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../../components/Icon'
import { Link } from '../../../lib/router'
import { formatCode, normalizeCode, viewerLink } from '../cloud'
import { estimateSchedule, fmtHour, isPlayed, listFixtures, planCourts, recentResults, standingTables } from '../overview'
import { assignReferees } from '../referees'
import { useSharedTournament } from '../useSharedTournament'
import { useNow } from '../useNow'
import FixtureCard from '../components/board/FixtureCard'
import StandingsBoard from '../components/board/StandingsBoard'
import BracketBoard from '../components/board/BracketBoard'
import DoubleBracket from '../components/board/DoubleBracket'
import TournamentClock from '../components/board/TournamentClock'
import QrCode from '../components/board/QrCode'
import '../tournament.css'
import '../board.css'
import './hall.css'

const SLIDE_MS = 12000

// Écran de salle (/hall/CODE) : pour la télé de l'accueil. Plein écran, sans
// barre d'app, il alterne tout seul entre les terrains, les prochains matchs,
// le classement (ou le tableau) et les derniers résultats. Les flèches du
// clavier changent de vue, la barre d'espace met en pause.
export default function HallScreen({ code: rawCode }) {
  const { t } = useTranslation()
  const code = normalizeCode(rawCode)
  const state = useSharedTournament(code)
  const rootRef = useRef(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const now = useNow(30000)
  const tour = state.tournament

  const fixtures = useMemo(() => (tour ? listFixtures(tour) : []), [tour])
  const plan = useMemo(() => (tour ? planCourts(tour, fixtures) : null), [tour, fixtures])
  const tables = useMemo(() => (tour ? standingTables(tour) : []), [tour])
  const refs = useMemo(() => (tour && plan ? assignReferees(tour, plan) : { byMatch: {} }), [tour, plan])
  const est = tour && plan ? estimateSchedule(tour, plan, now) : null
  const results = useMemo(() => recentResults(fixtures).slice(0, 8), [fixtures])

  // Vues à faire défiler (celles qui ont quelque chose à montrer).
  const slides = []
  if (plan?.onCourt.some(Boolean)) slides.push('courts')
  if (plan?.slots.length) slides.push('next')
  if (tables.length) slides.push('table')
  if (tour?.format === 'double' || tour?.knockoutRounds) slides.push('bracket')
  if (results.length) slides.push('results')
  const current = slides.length ? slides[index % slides.length] : null

  useEffect(() => {
    if (paused || slides.length < 2) return undefined
    const id = setTimeout(() => setIndex(i => (i + 1) % slides.length), SLIDE_MS)
    return () => clearTimeout(id)
  }, [index, paused, slides.length])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') setIndex(i => i + 1)
      else if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1 + slides.length))
      else if (e.key === ' ') { e.preventDefault(); setPaused(p => !p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length])

  useEffect(() => {
    if (tour?.name) document.title = `${tour.name} · ${t('tournament.hall.title')}`
  }, [tour?.name, t])

  if (state.status !== 'ok') {
    return (
      <div className="hall hall-empty">
        <p>{state.status === 'loading' ? t('tournament.public.loading', { code: formatCode(code) }) : t(`tournament.public.${state.status}.text`, { code: formatCode(code) })}</p>
        {state.status !== 'loading' && <Link className="btn-ghost" to="/tournaments">{t('tournament.public.other')}</Link>}
      </div>
    )
  }

  const done = fixtures.filter(f => isPlayed(f.match)).length
  const formatLabel = t('tournament.formatLabel', { returnObjects: true })
  const canFull = !!document.documentElement.requestFullscreen

  return (
    <div className="hall" ref={rootRef}>
      <header className="hall-head">
        <div className="hall-title">
          <span className={`sp-live${state.offline ? ' sp-live-off' : ''}`}>
            <span className="sp-live-dot" aria-hidden="true" />
            {state.offline ? t('tournament.board.offline') : t('tournament.board.live')}
          </span>
          <h1>{tour.name}</h1>
          <p>
            {formatLabel[tour.format]} · {t('tournament.matchesPlayed', { done, total: fixtures.length })}
            {est?.endAt && <> · {est.finished ? t('tournament.schedule.ended') : t('tournament.schedule.endShort')} ~{fmtHour(est.endAt)}</>}
          </p>
        </div>
        {tour.clock?.durationSec > 0 && <TournamentClock clock={tour.clock} variant="hero" />}
        <div className="hall-qr">
          <QrCode value={viewerLink({ code })} label={t('tournament.share.viewerLink')} />
          <span>{t('tournament.hall.follow')}<strong>{formatCode(code)}</strong></span>
        </div>
      </header>

      <nav className="hall-tabs" aria-label={t('tournament.hall.views')}>
        {slides.map((s, i) => (
          <button key={s} className={`hall-tab${s === current ? ' on' : ''}`} onClick={() => setIndex(i)} aria-current={s === current}>
            {t(`tournament.hall.slides.${s}`)}
            {s === current && !paused && slides.length > 1 && <span className="hall-timer" style={{ animationDuration: `${SLIDE_MS}ms` }} key={index} />}
          </button>
        ))}
        <span className="hall-tools">
          <button className="icon-btn" onClick={() => setPaused(p => !p)} aria-label={paused ? t('tournament.hall.play') : t('tournament.hall.pause')}>
            <Icon name={paused ? 'play' : 'pause'} size={18} />
          </button>
          {canFull && (
            <button className="icon-btn" onClick={() => (document.fullscreenElement ? document.exitFullscreen?.() : rootRef.current?.requestFullscreen?.().catch(() => {}))} aria-label={t('tournament.board.full')}>
              <Icon name="expand" size={18} />
            </button>
          )}
        </span>
      </nav>

      <main className="hall-body" key={current}>
        {!current && <p className="hall-none">{t('tournament.board.noUpcoming')}</p>}

        {current === 'courts' && (
          <>
            <div className={`hall-courts hall-n${plan.onCourt.filter(Boolean).length}`}>
              {plan.onCourt.map((f, i) => f && (
                <FixtureCard key={f.match.id} fixture={f} live court={plan.count > 1 ? i + 1 : null} referee={refs.byMatch[f.match.id]}
                             time={est?.courtEnds[i] ? t('tournament.schedule.untilTime', { time: fmtHour(est.courtEnds[i]) }) : null} />
              ))}
            </div>
            {plan.slots[0] && (
              <section className="hall-then">
                <h2>{t('tournament.board.then')}{est?.slotStarts[0] && <span> ~{fmtHour(est.slotStarts[0])}</span>}</h2>
                <div className="hall-slot-list hall-then-list">
                  {plan.slots[0].map(({ fixture, court }) => (
                    <FixtureCard key={fixture.match.id} fixture={fixture} court={plan.count > 1 ? court : null} referee={refs.byMatch[fixture.match.id]} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {current === 'next' && (
          <div className="hall-slots">
            {plan.slots.slice(0, 3).map((sl, si) => (
              <section key={si} className="hall-slot">
                <h2>{t('tournament.courts.slot', { n: si + 1 })}{est?.slotStarts[si] && <span> · ~{fmtHour(est.slotStarts[si])}</span>}</h2>
                <div className="hall-slot-list">
                  {sl.map(({ fixture, court }) => (
                    <FixtureCard key={fixture.match.id} fixture={fixture} court={plan.count > 1 ? court : null} referee={refs.byMatch[fixture.match.id]} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {current === 'table' && (
          <div className={`hall-tables${tables.length > 1 ? ' hall-tables-multi' : ''}`}>
            {tables.map(table => <StandingsBoard key={table.id} table={table} fixtures={fixtures} />)}
          </div>
        )}

        {current === 'bracket' && (
          tour.format === 'double' ? <DoubleBracket bracket={tour.bracket} headingLevel={2} /> : <BracketBoard rounds={tour.knockoutRounds} />
        )}

        {current === 'results' && (
          <div className="hall-results">
            {results.map(f => <FixtureCard key={f.match.id} fixture={f} />)}
          </div>
        )}
      </main>
    </div>
  )
}
