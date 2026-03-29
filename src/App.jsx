import { useEffect, useRef, useState } from 'react'
import { applyAdj, fautesTotal, mkTeam, score, tirs } from './lib/stats'
import Setup from './screens/Setup'
import Match from './screens/Match'
import Results from './screens/Results'
import Scorer from './screens/Scorer'
import History from './screens/History'

const DEFAULT_SETTINGS = {
  teamColors: ['#5de8d6', '#ff7272'],
  halfDurationMin: 12,
  halfCount: 2,
}

const HISTORY_KEY = 'tchouk_match_history'
const THEME_KEY = 'tchouk_theme'

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {}
  return 'light'
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)))
  } catch {}
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
      name: team.name,
      score: score(teams, numTeams, i),
      tirs: tirs(teams, numTeams, i),
      tGagne: team.tGagne,
      tDonne: team.tDonne,
      tCatche: team.tCatche,
      tFaute: team.tFaute,
      fautes: fautesTotal(team),
      pos: team.pos,
    })),
  }
}

export default function App() {
  const [screen, setScreen]     = useState('setup')
  const [appMode, setAppMode]   = useState('stats') // 'stats' | 'scorer'
  const [numTeams, setNumTeams] = useState(2)
  const [teams, setTeams]       = useState([])
  const [teamLogos, setTeamLogos] = useState([null, null])
  const [timeline, setTimeline] = useState([])
  const [lastSummary, setLastSummary] = useState(null)
  const [matchSettings, setMatchSettings] = useState(DEFAULT_SETTINGS)
  const [history, setHistory]   = useState(loadHistory)
  const [theme, setTheme] = useState(loadTheme)

  const teamsRef = useRef([])
  const matchStartRef = useRef(null)

  useEffect(() => {
    teamsRef.current = teams
  }, [teams])

  useEffect(() => {
    document.documentElement.style.setProperty('--c1', matchSettings.teamColors[0] || DEFAULT_SETTINGS.teamColors[0])
    document.documentElement.style.setProperty('--c2', matchSettings.teamColors[1] || DEFAULT_SETTINGS.teamColors[1])
  }, [matchSettings])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {}
  }, [theme])

  function startMatch(payload) {
    const names = Array.isArray(payload) ? payload : payload.names
    const settingsFromSetup = Array.isArray(payload) ? DEFAULT_SETTINGS : payload.settings
    const logos = payload.logos || [null, null]
    const mode = payload.mode || 'stats'
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
    setScreen(mode === 'scorer' ? 'scorer' : 'match')
  }

  function handleAdj(i, id, d) {
    const prev = teamsRef.current
    if (!prev[i]) return
    if (d < 0 && prev[i][id] <= 0) return

    const next = applyAdj(prev, numTeams, i, id, d)
    teamsRef.current = next
    setTeams(next)

    const now = Date.now()
    const elapsedSec = matchStartRef.current
      ? Math.max(0, Math.floor((now - matchStartRef.current) / 1000))
      : 0
    const category = id.startsWith('t') ? 'tirs' : id.startsWith('p') ? 'passes' : id.startsWith('f') ? 'fautes' : 'autre'

    setTimeline(prevTimeline => [
      ...prevTimeline,
      {
        at: now,
        elapsedSec,
        teamIdx: i,
        teamName: next[i].name,
        id,
        d,
        category,
        scores: next.map((_, idx) => score(next, numTeams, idx)),
      },
    ])
  }

  function endMatch() {
    const summary = buildMatchSummary(teamsRef.current, numTeams, matchStartRef.current, timeline, matchSettings)
    setLastSummary(summary)
    const newHistory = [summary, ...history]
    setHistory(newHistory)
    saveHistory(newHistory)
    setScreen('results')
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
    teamsRef.current = []
    matchStartRef.current = null
    setTimeline([])
    setLastSummary(null)
    setTeamLogos([null, null])
    setScreen('setup')
  }

  function clearHistory() {
    setHistory([])
    saveHistory([])
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
