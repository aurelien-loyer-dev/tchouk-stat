import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { applyAdj, fautesTotal, mkTeam, score, tirs } from './lib/stats'
import { applyPlayerAdj, playerTeamScore } from './lib/playerStats'
import { supabase } from './lib/supabase'
import { teamHalo, teamBtnTxt } from './lib/teamColor'
import Setup from './features/setup/Setup'
import Match from './features/match/Match'
import Results from './features/results/Results'
import Scorer from './features/scorer/Scorer'
import History from './features/history/History'
import PlayerMatch from './features/playerMatch/PlayerMatch'
import PlayerResults from './features/playerResults/PlayerResults'
import Tournament from './features/tournament/Tournament'
import logoAl from './public/logo_al.png'
import { Analytics } from "@vercel/analytics/react"

function AppFooter() {
  const { t } = useTranslation()
  return (
    <footer className="app-footer">
      <img src={logoAl} alt="AL" className="app-footer-logo" />
      <span>{t('common.copyright', { year: new Date().getFullYear() })}</span>
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
const SCREEN_KEY      = 'tchouk_screen'

function loadScreen() {
  try {
    const saved = localStorage.getItem(SCREEN_KEY)
    if (saved === 'tournament') return 'tournament'
  } catch {}
  return 'setup'
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') }
  catch { return [] }
}

function saveHistory(history) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50))) }
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
  const [screen, setScreen]         = useState(loadScreen)
  const [appMode, setAppMode]       = useState('stats') // 'stats' | 'scorer' | 'player'
  const [numTeams, setNumTeams]     = useState(2)
  const [teams, setTeams]           = useState([])
  const [teamLogos, setTeamLogos]   = useState([null, null])
  const [timeline, setTimeline]     = useState([])
  const [lastSummary, setLastSummary] = useState(null)
  const [matchSettings, setMatchSettings] = useState(DEFAULT_SETTINGS)
  const [history, setHistory]       = useState(loadHistory)
  const [historyInitialMatch, setHistoryInitialMatch] = useState(null)
  const [tournaments, setTournaments] = useState(loadTournaments)

  // Chargement depuis Supabase au démarrage
  useEffect(() => {
    if (!supabase) return
    supabase
      .from('matches')
      .select('data')
      .order('played_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) return
        const matches = data.map(row => row.data)
        setHistory(matches)
        saveHistory(matches)
      })
  }, [])

  // Mode joueurs
  const [players, setPlayers]         = useState([])
  const [playerNumTeams, setPlayerNumTeams] = useState(2)

  const teamsRef      = useRef([])
  const playersRef    = useRef([])
  const matchStartRef = useRef(null)

  useEffect(() => { teamsRef.current = teams }, [teams])

  useEffect(() => {
    const c1 = matchSettings.teamColors[0] || DEFAULT_SETTINGS.teamColors[0]
    const c2 = matchSettings.teamColors[1] || DEFAULT_SETTINGS.teamColors[1]
    document.documentElement.style.setProperty('--c1', c1)
    document.documentElement.style.setProperty('--c2', c2)
    document.documentElement.style.setProperty('--c1-halo',    teamHalo(c1))
    document.documentElement.style.setProperty('--c2-halo',    teamHalo(c2))
    document.documentElement.style.setProperty('--c1-btn-txt', teamBtnTxt(c1))
    document.documentElement.style.setProperty('--c2-btn-txt', teamBtnTxt(c2))
  }, [matchSettings])

  useEffect(() => {
    try {
      if (screen === 'tournament') localStorage.setItem(SCREEN_KEY, screen)
      else localStorage.removeItem(SCREEN_KEY)
    } catch {}
  }, [screen])

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
    matchStartRef.current = Date.now()
    teamsRef.current = nextTeams
    setAppMode(mode)
    setMatchSettings(mergedSettings)
    setTeamLogos(logos)
    setTimeline([])
    setTeams(nextTeams)

    if (mode === 'player') {
      const playerList = payload.players || []
      const pnt = payload.playerNumTeams ?? 2
      playersRef.current = playerList
      setPlayers(playerList)
      setPlayerNumTeams(pnt)
      setScreen('playermatch')
      return
    }

    setScreen(mode === 'scorer' ? 'scorer' : 'match')
  }

  // ── Ajustement stats équipe (mode stats / scorer) ─────────────────────────
  function handleAdj(i, id, d) {
    const prev = teamsRef.current
    if (!prev[i]) return
    if (d < 0 && prev[i][id] <= 0) return

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

    setTimeline(prev => [
      ...prev,
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

    const next = applyPlayerAdj(prev, playerId, statId, d)
    playersRef.current = next
    setPlayers(next)
  }

  // ── Fin du match (mode stats / scorer) ────────────────────────────────────
  function saveMatchToHistory() {
    const summary = buildMatchSummary(teamsRef.current, numTeams, matchStartRef.current, timeline, matchSettings, appMode)
    setLastSummary(summary)
    const newHistory = [summary, ...history]
    setHistory(newHistory)
    saveHistory(newHistory)
    saveMatchToCloud(summary)
  }

  function endMatch() {
    saveMatchToHistory()
    setScreen('results')
  }

  // ── Fin du match (mode player) ────────────────────────────────────────────
  function endPlayerMatch() {
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
    setScreen('playerresults')
  }

  function resetScorer() {
    const resetTeams = teamsRef.current.map(team => mkTeam(team.name))
    teamsRef.current = resetTeams
    matchStartRef.current = Date.now()
    setTeams(resetTeams)
    setTimeline([])
  }

  function newMatch() {
    setTeams([])
    teamsRef.current    = []
    playersRef.current  = []
    matchStartRef.current = null
    setTimeline([])
    setLastSummary(null)
    setTeamLogos([null, null])
    setPlayers([])
    setPlayerNumTeams(2)
    setScreen('setup')
  }

  function clearHistory() {
    setHistory([])
    saveHistory([])
    if (supabase) supabase.from('matches').delete().neq('id', '')
  }

  function handleSaveTournaments(list) {
    setTournaments(list)
    saveTournaments(list)
  }

  return (
    <>
      {screen === 'setup' && (
        <Setup
          numTeams={numTeams}
          setNumTeams={setNumTeams}
          onStart={startMatch}
          defaultSettings={matchSettings}
          history={history}
          onClearHistory={clearHistory}
          onViewHistory={() => { setHistoryInitialMatch(null); setScreen('history') }}
          onOpenMatch={m => { setHistoryInitialMatch(m); setScreen('history') }}
          onViewTournament={() => setScreen('tournament')}
        />
      )}
      {screen === 'match' && (
        <Match
          teams={teams}
          numTeams={numTeams}
          onAdj={handleAdj}
          onEnd={endMatch}
          settings={matchSettings}
        />
      )}
      {screen === 'scorer' && (
        <Scorer
          teams={teams}
          numTeams={numTeams}
          onAdj={handleAdj}
          onFinish={saveMatchToHistory}
          onNewMatch={newMatch}
          onReset={resetScorer}
          settings={matchSettings}
          logos={teamLogos}
        />
      )}
      {screen === 'playermatch' && (
        <PlayerMatch
          teams={teams}
          players={players}
          numTeams={playerNumTeams}
          onPlayerAdj={handlePlayerAdj}
          onEnd={endPlayerMatch}
          settings={matchSettings}
        />
      )}
      {screen === 'results' && (
        <Results
          teams={teams}
          numTeams={numTeams}
          timeline={timeline}
          settings={matchSettings}
          summary={lastSummary}
          onNew={newMatch}
        />
      )}
      {screen === 'playerresults' && (
        <PlayerResults
          teams={teams}
          players={players}
          numTeams={playerNumTeams}
          settings={matchSettings}
          summary={lastSummary}
          onNew={newMatch}
        />
      )}
      {screen === 'history' && (
        <History
          history={history}
          onBack={() => setScreen('setup')}
          onClear={clearHistory}
          initialMatch={historyInitialMatch}
        />
      )}
      {screen === 'tournament' && (
        <Tournament
          tournaments={tournaments}
          onSave={handleSaveTournaments}
          onBack={() => setScreen('setup')}
        />
      )}
      <AppFooter />
      <Analytics />
    </>
  )
}
