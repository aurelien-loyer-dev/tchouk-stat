import { useEffect, useRef, useState } from 'react'
import { applyAdj, fautesTotal, mkTeam, score, tirs } from './lib/stats'
import Setup from './screens/Setup'
import Match from './screens/Match'
import Results from './screens/Results'

const HISTORY_KEY = 'tchouk-history-v1'
const MAX_HISTORY = 25
const DEFAULT_SETTINGS = {
  teamColors: ['#5de8d6', '#ff7272'],
  halfDurationMin: 12,
  halfCount: 2,
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
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
  const [numTeams, setNumTeams] = useState(1)
  const [teams, setTeams]       = useState([])
  const [timeline, setTimeline] = useState([])
  const [history, setHistory]   = useState(loadHistory)
  const [matchSettings, setMatchSettings] = useState(DEFAULT_SETTINGS)

  const teamsRef = useRef([])
  const matchStartRef = useRef(null)

  useEffect(() => {
    teamsRef.current = teams
  }, [teams])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  useEffect(() => {
    document.documentElement.style.setProperty('--c1', matchSettings.teamColors[0] || DEFAULT_SETTINGS.teamColors[0])
    document.documentElement.style.setProperty('--c2', matchSettings.teamColors[1] || DEFAULT_SETTINGS.teamColors[1])
  }, [matchSettings])

  function startMatch(payload) {
    const names = Array.isArray(payload) ? payload : payload.names
    const settingsFromSetup = Array.isArray(payload) ? DEFAULT_SETTINGS : payload.settings
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
    setMatchSettings(mergedSettings)
    setTimeline([])
    setTeams(nextTeams)
    setScreen('match')
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
    setHistory(prev => [summary, ...prev].slice(0, MAX_HISTORY))
    setScreen('results')
  }

  function newMatch() {
    setTeams([])
    teamsRef.current = []
    matchStartRef.current = null
    setTimeline([])
    setScreen('setup')
  }

  function clearHistory() {
    setHistory([])
  }

  return (
    <>
      {screen === 'setup' && (
        <Setup
          numTeams={numTeams}
          setNumTeams={setNumTeams}
          onStart={startMatch}
          history={history}
          onClearHistory={clearHistory}
          defaultSettings={matchSettings}
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
      {screen === 'results' && (
        <Results
          teams={teams}
          numTeams={numTeams}
          timeline={timeline}
          history={history}
          settings={matchSettings}
          onNew={newMatch}
        />
      )}
    </>
  )
}
