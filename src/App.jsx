import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { applyAdj, fautesTotal, mkTeam, score, tirs } from './lib/stats'
import { applyPlayerAdj, mkPlayer, playerTeamScore } from './lib/playerStats'
import { supabase } from './lib/supabase'
import { teamBtnTxt } from './lib/teamColor'
import { parseJoinHash, pushScore } from './features/tournament/cloud'
import { applyScore } from './features/tournament/overview'
import { navigate, useRoute } from './lib/router'
import { clearLive, loadLive, saveLive, saveLiveLogos } from './lib/liveMatch'
import AppBar from './components/AppBar'
import Setup from './features/setup/Setup'
import Match from './features/match/Match'
import Results from './features/results/Results'
import Scorer from './features/scorer/Scorer'
import History from './features/history/History'
import PlayerMatch from './features/playerMatch/PlayerMatch'
import PlayerResults from './features/playerResults/PlayerResults'
import Tournament from './features/tournament/Tournament'
import PublicBoard from './features/tournament/views/PublicBoard'
import TeamDraw from './features/teamDraw/TeamDraw'
import Guide from './features/guide/Guide'
import NotFound from './components/NotFound'
import ErrorBoundary from './components/ErrorBoundary'
import { normalizeHistory } from './lib/matchRecord'
import TournamentLink from './components/TournamentLink'
import PwaBanner from './pwa/PwaBanner'
import UndoBar from './components/UndoBar'
import { CATEGORIES } from './features/match/constants'
import { PLAYER_STATS } from './lib/playerStats'
import logoAl from './public/logo_al.png'
import { Analytics } from "@vercel/analytics/react"

function AppFooter() {
  const { t } = useTranslation()
  return (
    <footer className="app-footer">
      <img src={logoAl} alt="AL" className="app-footer-logo" />
      <span>{t('common.copyright', { year: new Date().getFullYear() })}</span>
      <span className="app-footer-version">v{__APP_VERSION__}</span>
    </footer>
  )
}

const DEFAULT_SETTINGS = {
  teamColors: ['#0000b6', '#ae0000'],
  halfDurationMin: 15,
  halfCount: 3,
}

const HISTORY_KEY     = 'tchouk_match_history'
const TOURNAMENTS_KEY = 'tchouk_tournaments'
const TOURNAMENTS_BACKUP_KEY = 'tchouk_tournaments_backup'
const HISTORY_LIMIT   = 200
const RESULT_SCREENS  = ['results', 'playerresults']
const TOURNAMENT_ROUTES = ['tournaments', 'tournamentNew', 'tournament', 'tournamentJoin']

// Anciens liens de partage (#trn=CODE.CLÉ) → /t/CODE#key=CLÉ
function legacyJoinUrl() {
  const req = parseJoinHash()
  return req ? `/t/${req.code}${req.key ? `#key=${req.key}` : ''}` : null
}

function loadHistory() {
  try { return normalizeHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')) }
  catch { return [] }
}

// Fusionne deux listes de matchs par id (la version locale l'emporte), du plus
// récent au plus ancien — la synchro cloud ne doit jamais effacer un match local.
function mergeHistory(local, remote) {
  const byId = new Map()
  for (const m of remote) if (m?.id) byId.set(m.id, m)
  for (const m of local)  if (m?.id) byId.set(m.id, m)
  return [...byId.values()].sort((a, b) => String(b.playedAt).localeCompare(String(a.playedAt)))
}

function saveHistory(history) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT))) }
  catch {}
}

function loadTournaments() {
  try {
    const raw = localStorage.getItem(TOURNAMENTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}

  try {
    const backup = localStorage.getItem(TOURNAMENTS_BACKUP_KEY)
    if (!backup) return []
    const parsed = JSON.parse(backup)
    return Array.isArray(parsed) ? parsed : (parsed?.tournaments || [])
  } catch {
    return []
  }
}

function saveTournaments(list) {
  try {
    const trimmed = list.slice(0, 50)
    localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(trimmed))
    localStorage.setItem(TOURNAMENTS_BACKUP_KEY, JSON.stringify({
      updatedAt: new Date().toISOString(),
      tournaments: trimmed,
    }))
  }
  catch {}
}

// Libellé d'une stat d'équipe, pour « Annuler : Gagné · Équipe ».
const TEAM_STAT_KEYS = {
  pos: 'match.stats.balls',
  padv: 'match.stats.opponentScore',
  ...Object.fromEntries(CATEGORIES.flatMap(c => c.items).map(it => [it.id, it.labelKey])),
}
const UNDO_LIMIT = 100

function buildMatchSummary(teams, numTeams, startedAt, timeline, settings, mode) {
  const now = Date.now()
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(now),
    playedAt: new Date(now).toISOString(),
    durationSec: startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0,
    mode,
    numTeams,
    shotEvents: timeline.filter(e => e.category === 'tirs').length,
    settings,
    timeline,
    teamsSnapshot: teams.map(team => ({ ...team })),
    teams: teams.map((team, i) => ({
      name:    team.name,
      score:   score(teams, numTeams, i),
      tirs:    tirs(teams, numTeams, i),
      tGagne:  team.tGagne,
      tDonne:  team.tDonne,
      tCatche: team.tCatche,
      tFaute:  team.tFaute,
      fautes:  fautesTotal(team),
      pos:     team.pos,
    })),
  }
}

export default function App() {
  // Match en cours restauré après un rechargement (null s'il n'y en a pas).
  const [live] = useState(loadLive)
  const { t } = useTranslation()
  const route = useRoute()
  // Match en cours : 'live' (en jeu), 'results' (écran de fin) ou null.
  const [session, setSession]       = useState(() => (live ? (RESULT_SCREENS.includes(live.screen) ? 'results' : 'live') : null))
  const [appMode, setAppMode]       = useState(live?.appMode || 'stats') // 'stats' | 'scorer' | 'player'
  const [numTeams, setNumTeams]     = useState(live?.numTeams || 2)
  const [teams, setTeams]           = useState(live?.teams || [])
  const [teamLogos, setTeamLogos]   = useState(live?.logos || [null, null])
  const [timeline, setTimeline]     = useState(live?.timeline || [])
  const [lastSummary, setLastSummary] = useState(live?.lastSummary || null)
  const [matchSettings, setMatchSettings] = useState(live?.settings || DEFAULT_SETTINGS)
  const [history, setHistory]       = useState(loadHistory)
  const [tournaments, setTournaments] = useState(loadTournaments)
  // Match lancé depuis un tournoi : { tournamentId, matchId, label } ; son score y est reporté à la fin.
  const [origin, setOrigin]         = useState(live?.origin || null)
  const [report, setReport]         = useState(live?.report || null) // { status, tournamentId }

  // Chargement depuis Supabase au démarrage
  useEffect(() => {
    if (!supabase) return
    supabase
      .from('matches')
      .select('data')
      .order('played_at', { ascending: false })
      .limit(HISTORY_LIMIT)
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) return
        const remote = normalizeHistory(data.map(row => row?.data))
        setHistory(local => {
          const merged = mergeHistory(local, remote)
          saveHistory(merged)
          return merged
        })
      })
  }, [])

  // Mode joueurs
  const [players, setPlayers]         = useState(live?.players || [])
  const [playerNumTeams, setPlayerNumTeams] = useState(live?.playerNumTeams || 2)

  const teamsRef      = useRef(live?.teams || [])
  const playersRef    = useRef(live?.players || [])
  const timelineRef   = useRef(live?.timeline || [])

  // ── Annuler : pile des états d'avant chaque action du match en cours ──
  // { teams, players, timeline, label } ; vidée à chaque nouveau match.
  const undoRef = useRef([])
  const [undoTop, setUndoTop] = useState(null) // libellé de la dernière action annulable
  function pushUndo(label) {
    undoRef.current = [...undoRef.current.slice(-(UNDO_LIMIT - 1)), {
      teams: teamsRef.current, players: playersRef.current, timeline: timelineRef.current, label,
    }]
    setUndoTop(label)
  }
  function clearUndo() {
    undoRef.current = []
    setUndoTop(null)
  }
  function undo() {
    const last = undoRef.current[undoRef.current.length - 1]
    if (!last) return
    undoRef.current = undoRef.current.slice(0, -1)
    teamsRef.current = last.teams
    playersRef.current = last.players
    timelineRef.current = last.timeline
    setTeams(last.teams)
    setPlayers(last.players)
    setTimeline(last.timeline)
    setUndoTop(undoRef.current[undoRef.current.length - 1]?.label || null)
  }
  function setTimelineNow(next) {
    timelineRef.current = next
    setTimeline(next)
  }
  const matchStartRef = useRef(live?.matchStartedAt || null)

  const matchScreen   = appMode === 'player' ? 'playermatch' : appMode === 'scorer' ? 'scorer' : 'match'
  const resultsScreen = appMode === 'player' ? 'playerresults' : 'results'
  const screen = session === 'live' ? matchScreen : session === 'results' ? resultsScreen : null

  // ── Sauvegarde automatique du match en cours ─────────────────────────────
  useEffect(() => {
    if (!screen) return
    saveLive({
      screen, appMode, numTeams, teams, timeline, players, playerNumTeams, origin, report,
      settings: matchSettings,
      lastSummary,
      matchStartedAt: matchStartRef.current,
    })
  }, [screen, appMode, numTeams, teams, timeline, players, playerNumTeams, origin, report, matchSettings, lastSummary])

  useEffect(() => { saveLiveLogos(teamLogos) }, [teamLogos])

  useEffect(() => { teamsRef.current = teams }, [teams])

  useEffect(() => {
    const c1 = matchSettings.teamColors[0] || DEFAULT_SETTINGS.teamColors[0]
    const c2 = matchSettings.teamColors[1] || DEFAULT_SETTINGS.teamColors[1]
    document.documentElement.style.setProperty('--c1', c1)
    document.documentElement.style.setProperty('--c2', c2)
    document.documentElement.style.setProperty('--c1-btn-txt', teamBtnTxt(c1))
    document.documentElement.style.setProperty('--c2-btn-txt', teamBtnTxt(c2))
  }, [matchSettings])

  // ── Redirections : écran de match sans match, anciens liens de partage ──
  const redirect =
    route.name === 'match'        && session !== 'live'    ? (session === 'results' ? '/match/results' : '/') :
    route.name === 'matchResults' && session !== 'results' ? (session === 'live' ? '/match' : '/') :
    legacyJoinUrl()
  useEffect(() => {
    if (redirect) navigate(redirect, { replace: true })
  }, [redirect])
  useEffect(() => {
    const onHash = () => { const url = legacyJoinUrl(); if (url) navigate(url, { replace: true }) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // ── Après chaque navigation : haut de page, focus sur le titre (lecteurs d'écran) ──
  useEffect(() => {
    if (!route.nav) return
    window.scrollTo(0, 0)
    const id = requestAnimationFrame(() => {
      const target = document.querySelector('#main h1') || document.getElementById('main')
      if (!target) return
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(id)
  }, [route.nav, route.pathname])

  useEffect(() => {
    function handleStorage(e) {
      if (e.key !== TOURNAMENTS_KEY && e.key !== TOURNAMENTS_BACKUP_KEY) return
      setTournaments(loadTournaments())
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // ── Sauvegarde cloud ─────────────────────────────────────────────────────
  async function saveMatchToCloud(summary) {
    if (!supabase) return
    await supabase.from('matches').upsert({
      id:        summary.id,
      played_at: summary.playedAt,
      data:      summary,
    })
  }

  // ── Démarrage d'un match ──────────────────────────────────────────────────
  function startMatch(payload) {
    const names              = Array.isArray(payload) ? payload : payload.names
    const settingsFromSetup  = Array.isArray(payload) ? DEFAULT_SETTINGS : payload.settings
    const logos              = payload.logos  || [null, null]
    const mode               = payload.mode   || 'stats'

    const mergedSettings = {
      ...DEFAULT_SETTINGS,
      ...settingsFromSetup,
      teamColors: [
        settingsFromSetup?.teamColors?.[0] || DEFAULT_SETTINGS.teamColors[0],
        settingsFromSetup?.teamColors?.[1] || DEFAULT_SETTINGS.teamColors[1],
      ],
    }

    const nextTeams = names.map(mkTeam)
    clearLive()
    setOrigin(payload.origin || null)
    setReport(null)
    matchStartRef.current = Date.now()
    teamsRef.current = nextTeams
    setAppMode(mode)
    setMatchSettings(mergedSettings)
    setTeamLogos(logos)
    setTimelineNow([])
    clearUndo()
    setTeams(nextTeams)

    if (mode === 'player') {
      const playerList = payload.players || []
      const pnt = payload.playerNumTeams ?? 2
      playersRef.current = playerList
      setPlayers(playerList)
      setPlayerNumTeams(pnt)
    }

    setSession('live')
    navigate('/match', { replace: true })
  }

  // ── Ajustement stats équipe (mode stats / scorer) ─────────────────────────
  function handleAdj(i, id, d) {
    const prev = teamsRef.current
    if (!prev[i]) return
    if (d < 0 && prev[i][id] <= 0) return

    pushUndo(`${t(TEAM_STAT_KEYS[id] || 'match.stats.won')} ${d > 0 ? '+1' : '−1'} · ${prev[i].name}`)
    const next = applyAdj(prev, numTeams, i, id, d)
    teamsRef.current = next
    setTeams(next)

    const now        = Date.now()
    const elapsedSec = matchStartRef.current
      ? Math.max(0, Math.floor((now - matchStartRef.current) / 1000))
      : 0
    const category = id.startsWith('t') ? 'tirs'
      : id.startsWith('p') ? 'passes'
      : id.startsWith('f') ? 'fautes'
      : 'autre'

    setTimelineNow([
      ...timelineRef.current,
      {
        at: now,
        elapsedSec,
        teamIdx:  i,
        teamName: next[i].name,
        id,
        d,
        category,
        scores: next.map((_, idx) => score(next, numTeams, idx)),
      },
    ])
  }

  // ── Ajustement stats joueur (mode player) ─────────────────────────────────
  function handlePlayerAdj(playerId, statId, d) {
    const prev = playersRef.current
    const idx  = prev.findIndex(p => p.id === playerId)
    if (idx === -1) return
    if (d < 0 && (prev[idx][statId] ?? 0) <= 0) return

    const def = PLAYER_STATS.find(s => s.id === statId)
    pushUndo(`${def ? t(def.labelKey) : statId} ${d > 0 ? '+1' : '−1'} · ${prev[idx].name}`)
    const next = applyPlayerAdj(prev, playerId, statId, d)
    playersRef.current = next
    setPlayers(next)
  }

  // ── Fin du match (mode stats / scorer) ────────────────────────────────────
  function saveMatchToHistory() {
    const summary = buildMatchSummary(teamsRef.current, numTeams, matchStartRef.current, timelineRef.current, matchSettings, appMode)
    setLastSummary(summary)
    const newHistory = [summary, ...history]
    setHistory(newHistory)
    saveHistory(newHistory)
    saveMatchToCloud(summary)
    reportToTournament(summary.teams[0]?.score, summary.teams[1]?.score)
  }

  function endMatch() {
    clearUndo()
    saveMatchToHistory()
    setSession('results')
    navigate('/match/results', { replace: true })
  }

  // ── Fin du match (mode player) ────────────────────────────────────────────
  function endPlayerMatch() {
    clearUndo()
    const now  = Date.now()
    const pls  = playersRef.current
    const nt   = playerNumTeams
    const s0   = playerTeamScore(pls, 0, nt)
    const s1   = nt === 2 ? playerTeamScore(pls, 1, nt) : null

    const summary = {
      id:          typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(now),
      playedAt:    new Date(now).toISOString(),
      durationSec: matchStartRef.current ? Math.max(0, Math.round((now - matchStartRef.current) / 1000)) : 0,
      mode:        'player',
      numTeams:    nt,
      settings:    matchSettings,
      teams:       teamsRef.current.slice(0, nt).map((t, i) => ({
        name:  t.name,
        score: i === 0 ? s0 : s1,
      })),
      players:     pls,
    }
    setLastSummary(summary)
    const newHistory = [summary, ...history]
    setHistory(newHistory)
    saveHistory(newHistory)
    saveMatchToCloud(summary)
    if (nt === 2) reportToTournament(s0, s1)
    setSession('results')
    navigate('/match/results', { replace: true })
  }

  function resetScorer() {
    const resetTeams = teamsRef.current.map(team => mkTeam(team.name))
    teamsRef.current = resetTeams
    matchStartRef.current = Date.now()
    setTeams(resetTeams)
    setTimelineNow([])
    clearUndo()
  }

  function newMatch() {
    clearLive()
    setTeams([])
    teamsRef.current    = []
    playersRef.current  = []
    matchStartRef.current = null
    setTimelineNow([])
    clearUndo()
    setLastSummary(null)
    setTeamLogos([null, null])
    setPlayers([])
    setPlayerNumTeams(2)
    setSession(null)
    setOrigin(null)
    setReport(null)
    navigate('/')
  }

  // ── Lien tournoi ↔ match ──────────────────────────────────────────────
  function playTournamentMatch(tour, fixture, mode) {
    const { team1, team2 } = fixture.match
    const payload = {
      names: [team1, team2],
      mode,
      settings: tour.schedule
        ? { ...matchSettings, halfCount: tour.schedule.halves, halfDurationMin: tour.schedule.halfMin }
        : matchSettings,
      origin: { tournamentId: tour.id, matchId: fixture.match.id, label: fixture.label || null },
    }
    if (mode === 'player') {
      payload.playerNumTeams = 2
      payload.players = [
        ...(tour.rosters?.[team1] || []).map(n => mkPlayer(n, 0)),
        ...(tour.rosters?.[team2] || []).map(n => mkPlayer(n, 1)),
      ]
    }
    startMatch(payload)
  }

  // Fin d'un match lancé depuis un tournoi : le score part dans le tournoi
  // (et sur le serveur s'il est partagé et qu'on en est organisateur).
  function reportToTournament(s1, s2) {
    if (!origin || s1 == null || s2 == null) return
    const tour = tournaments.find(x => x.id === origin.tournamentId)
    if (!tour) { setReport({ status: 'missing', tournamentId: origin.tournamentId }); return }
    if (tour.share && !tour.share.key) { setReport({ status: 'readonly', tournamentId: tour.id }); return }
    const applied = applyScore(tour, origin.matchId, s1, s2)
    if (applied.error) { setReport({ status: applied.error, tournamentId: tour.id }); return }

    const next = tour.share ? { ...applied.tour, share: { ...tour.share, dirty: true } } : applied.tour
    handleSaveTournaments(list => list.map(x => (x.id === tour.id ? next : x)))
    setReport({ status: tour.share ? 'sending' : 'ok', tournamentId: tour.id })
    if (!tour.share) return

    pushScore(next, origin.matchId, s1, s2).then(r => {
      if (r.ok) {
        handleSaveTournaments(list => list.map(x => (x.id === tour.id ? r.tour : x)))
        setReport({ status: 'ok', tournamentId: tour.id })
      } else {
        // Reste marqué « dirty » : renvoyé dès que le tournoi sera rouvert en ligne.
        setReport({ status: 'pending', tournamentId: tour.id })
      }
    })
  }

  function clearHistory() {
    setHistory([])
    saveHistory([])
    if (supabase) supabase.from('matches').delete().neq('id', '').then(() => {})
  }

  function deleteMatch(id) {
    setHistory(prev => {
      const next = prev.filter(m => m.id !== id)
      saveHistory(next)
      return next
    })
    // Le client Supabase est paresseux : sans .then la requête n'est jamais envoyée.
    if (supabase) supabase.from('matches').delete().eq('id', id).then(() => {})
  }

  // Accepte une liste ou une fonction (liste précédente → suivante), pour les
  // mises à jour asynchrones de la synchro. Stable : la synchro en dépend.
  const handleSaveTournaments = useCallback(listOrFn => {
    setTournaments(prev => {
      const next = typeof listOrFn === 'function' ? listOrFn(prev) : listOrFn
      if (next !== prev) saveTournaments(next)
      return next
    })
  }, [])

  // ── Titre de l'onglet ───────────────────────────────────────────────────
  const tournamentInRoute = route.name === 'tournament' ? tournaments.find(x => x.id === route.params.id) : null
  const matchInRoute = route.name === 'historyMatch' ? history.find(m => m.id === route.params.id) : null
  const pageTitle = {
    newStats:      t('setup.formTitle.stats'),
    newPlayers:    t('setup.formTitle.player'),
    newScoreboard: t('setup.formTitle.scorer'),
    match:         t(`nav.titles.${matchScreen}`),
    matchResults:  t('nav.titles.results'),
    history:       t('history.title'),
    historyMatch:  matchInRoute ? (matchInRoute.teams || []).map(tm => tm.name).join(' – ') : t('history.title'),
    tournaments:   t('tournament.title'),
    tournamentNew: t('tournament.setup.title'),
    tournament:    tournamentInRoute?.name || t('tournament.title'),
    tournamentJoin: t('tournament.title'),
    teams:         t('teamDraw.title'),
    guide:         t('nav.guide'),
    notFound:      t('nav.notFound.title'),
  }[route.name]
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} · ${t('setup.appTitle')}` : t('setup.appTitle')
  }, [pageTitle, t])

  const setupMode = { newStats: 'stats', newPlayers: 'player', newScoreboard: 'scorer' }[route.name] || null
  const liveInfo = session && teams.length ? {
    mode: appMode,
    finished: session === 'results',
    names: (appMode === 'player' ? teams.slice(0, playerNumTeams) : teams).map(tm => tm.name),
  } : null

  return (
    <>
      <a className="skip-link" href="#main">{t('nav.skip')}</a>
      <AppBar />
      <main className="app-main" id="main" tabIndex={-1}>
        <ErrorBoundary resetKey={route.pathname}>
        {(route.name === 'home' || setupMode) && (
          <Setup
            mode={setupMode}
            numTeams={numTeams}
            setNumTeams={setNumTeams}
            onStart={startMatch}
            defaultSettings={matchSettings}
            history={history}
            tournamentCount={tournaments.length}
            liveMatch={liveInfo}
            onDiscardLive={newMatch}
          />
        )}
        {(route.name === 'match' || route.name === 'matchResults') && origin && (
          <TournamentLink
            origin={origin}
            report={report}
            tournament={tournaments.find(x => x.id === origin.tournamentId)}
          />
        )}
        {route.name === 'match' && screen === 'match' && (
          <Match
            teams={teams}
            numTeams={numTeams}
            onAdj={handleAdj}
            onEnd={endMatch}
            settings={matchSettings}
          />
        )}
        {route.name === 'match' && screen === 'scorer' && (
          <Scorer
            teams={teams}
            numTeams={numTeams}
            onAdj={handleAdj}
            onFinish={saveMatchToHistory}
            onNewMatch={newMatch}
            onReset={resetScorer}
            onUndo={undo}
            undoLabel={undoTop}
            settings={matchSettings}
            logos={teamLogos}
          />
        )}
        {route.name === 'match' && (screen === 'match' || screen === 'playermatch') && (
          <UndoBar label={undoTop} onUndo={undo} />
        )}
        {route.name === 'match' && screen === 'playermatch' && (
          <PlayerMatch
            teams={teams}
            players={players}
            numTeams={playerNumTeams}
            onPlayerAdj={handlePlayerAdj}
            onEnd={endPlayerMatch}
            settings={matchSettings}
          />
        )}
        {route.name === 'matchResults' && screen === 'results' && (
          <Results
            teams={teams}
            numTeams={numTeams}
            timeline={timeline}
            settings={matchSettings}
            summary={lastSummary}
            onNew={newMatch}
          />
        )}
        {route.name === 'matchResults' && screen === 'playerresults' && (
          <PlayerResults
            teams={teams}
            players={players}
            numTeams={playerNumTeams}
            settings={matchSettings}
            summary={lastSummary}
            onNew={newMatch}
          />
        )}
        {(route.name === 'history' || route.name === 'historyMatch') && (
          <History
            history={history}
            selectedId={route.name === 'historyMatch' ? route.params.id : null}
            onBack={() => navigate('/')}
            onClear={clearHistory}
            onDelete={deleteMatch}
          />
        )}
        {route.name === 'teams' && (
          <TeamDraw
            onBack={() => navigate('/')}
            onStartMatch={payload => startMatch({ ...payload, settings: matchSettings })}
          />
        )}
        {TOURNAMENT_ROUTES.includes(route.name) && (
          <Tournament
            tournaments={tournaments}
            onSave={handleSaveTournaments}
            route={route}
            onPlayMatch={playTournamentMatch}
          />
        )}
        {route.name === 'guide' && <Guide onBack={() => navigate('/')} />}
        {route.name === 'live' && <PublicBoard code={route.params.code} />}
        {route.name === 'notFound' && <NotFound />}
        </ErrorBoundary>
      </main>
      <AppFooter />
      <PwaBanner />
      <Analytics />
    </>
  )
}
