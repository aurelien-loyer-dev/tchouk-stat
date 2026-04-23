import { useEffect, useRef, useState } from 'react'
import { applyAdj, fautesTotal, mkTeam, score, tirs } from './lib/stats'
import { applyPlayerAdj, playerTeamScore } from './lib/playerStats'
import { supabase } from './lib/supabase'
import Setup from './screens/Setup'
import Match from './screens/Match'
import Results from './screens/Results'
import Scorer from './screens/Scorer'
import History from './screens/History'
import PlayerMatch from './screens/PlayerMatch'
import PlayerResults from './screens/PlayerResults'
import { Analytics } from "@vercel/analytics/react"

const DEFAULT_SETTINGS = {
  teamColors: ['#5de8d6', '#ff7272'],
  halfDurationMin: 12,
  halfCount: 2,
}

const HISTORY_KEY = 'tchouk_match_history'
const THEME_KEY   = 'tchouk_theme'

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {}
  return 'light'
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') }
  catch { return [] }
}

function saveHistory(history) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50))) }
  catch {}
}

function buildMatchSummary(teams, numTeams, startedAt, timeline, settings) {
  const now = Date.now()
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(now),
    playedAt: new Date(now).toISOString(),
    durationSec: startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0,
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
  const [screen, setScreen]         = useState('setup')
  const [appMode, setAppMode]       = useState('stats') // 'stats' | 'scorer' | 'player'
  const [numTeams, setNumTeams]     = useState(2)
  const [teams, setTeams]           = useState([])
  const [teamLogos, setTeamLogos]   = useState([null, null])
  const [timeline, setTimeline]     = useState([])
  const [lastSummary, setLastSummary] = useState(null)
  const [matchSettings, setMatchSettings] = useState(DEFAULT_SETTINGS)
  const [history, setHistory]       = useState(loadHistory)
  const [theme, setTheme]           = useState(loadTheme)

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
    document.documentElement.style.setProperty('--c1', matchSettings.teamColors[0] || DEFAULT_SETTINGS.teamColors[0])
    document.documentElement.style.setProperty('--c2', matchSettings.teamColors[1] || DEFAULT_SETTINGS.teamColors[1])
  }, [matchSettings])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
  }, [theme])

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

  // ── Fin du match (mode stats) ─────────────────────────────────────────────
  function endMatch() {
    const summary = buildMatchSummary(teamsRef.current, numTeams, matchStartRef.current, timeline, matchSettings)
    setLastSummary(summary)
    const newHistory = [summary, ...history]
    setHistory(newHistory)
    saveHistory(newHistory)
    saveMatchToCloud(summary)
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

  return (
    <>
      <button
        className="theme-toggle"
        onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
      >
        {theme === 'dark' ? 'Theme clair' : 'Theme sombre'}
      </button>

      {screen === 'setup' && (
        <Setup
          numTeams={numTeams}
          setNumTeams={setNumTeams}
          onStart={startMatch}
          defaultSettings={matchSettings}
          history={history}
          onClearHistory={clearHistory}
          onViewHistory={() => setScreen('history')}
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
          onEnd={endMatch}
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
          mode={appMode}
          logos={teamLogos}
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
        />
      )}
    </>
  )
}
