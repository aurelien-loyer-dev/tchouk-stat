import { useEffect, useMemo, useState } from 'react'
import { PLAYER_STATS, STAT_GROUPS, playerTeamScore } from '../lib/playerStats'
import { fmtClock } from '../lib/format'

// ── Carte joueur ──────────────────────────────────────────────────────────────
function PlayerCard({ player, teamColor, selectedStat, onAdj }) {
  const statVal = selectedStat ? (player[selectedStat] ?? 0) : null

  return (
    <div
      className={`pm-player-card${selectedStat ? ' pm-player-active' : ''}`}
      style={{ borderColor: teamColor }}
    >
      <div className="pm-player-top">
        <div className="pm-player-name" style={{ color: teamColor }}>{player.name}</div>
        <div className="pm-player-pts">
          {player.pointsMarques}
          <span className="pm-player-pts-lbl"> pts</span>
        </div>
      </div>
      {selectedStat && (
        <div className="pm-player-bottom">
          <span className="pm-stat-cur">{statVal}</span>
          <button className="pm-adj-btn pm-adj-p" onClick={() => onAdj(player, 1)}>+</button>
          <button className="pm-adj-btn pm-adj-m" onClick={() => onAdj(player, -1)}>−</button>
        </div>
      )}
    </div>
  )
}

// ── Colonne d'équipe avec grille de joueurs ───────────────────────────────────
function TeamColumn({ teamName, teamColor, players, selectedStat, dimmed, onAdj }) {
  return (
    <div className={`pm-team-col${dimmed ? ' pm-col-dimmed' : ''}`}>
      <div className="pm-team-hd" style={{ color: teamColor }}>{teamName}</div>
      {players.length === 0 && <div className="pm-no-players">Aucun joueur</div>}
      <div className="pm-players-grid-inner">
        {players.map(p => (
          <PlayerCard
            key={p.id}
            player={p}
            teamColor={teamColor}
            selectedStat={selectedStat}
            onAdj={onAdj}
          />
        ))}
      </div>
    </div>
  )
}

// ── Écran match joueurs ───────────────────────────────────────────────────────
export default function PlayerMatch({ teams, players, numTeams, onPlayerAdj, onEnd, settings }) {
  const [selectedStat, setSelectedStat]   = useState(null)
  const [focusedTeam, setFocusedTeam]     = useState(null) // null = les deux, 0 = équipe 1, 1 = équipe 2
  const [elapsedSec, setElapsedSec]       = useState(0)
  const [running, setRunning]             = useState(false)

  const n = numTeams ?? 2

  const halfDurationMin = Math.max(1, Number(settings?.halfDurationMin) || 12)
  const halfCount       = Math.max(1, Number(settings?.halfCount) || 2)
  const totalHalfSec    = halfDurationMin * 60
  const totalMatchSec   = totalHalfSec * halfCount

  useEffect(() => {
    if (!running) return undefined
    const id = window.setInterval(() => {
      setElapsedSec(prev => {
        const next = prev + 1
        if (next >= totalMatchSec) { setRunning(false); return totalMatchSec }
        return next
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running, totalMatchSec])

  const currentHalf = useMemo(() => {
    if (elapsedSec >= totalMatchSec) return halfCount
    return Math.min(halfCount, Math.floor(elapsedSec / totalHalfSec) + 1)
  }, [elapsedSec, totalHalfSec, totalMatchSec, halfCount])

  const elapsedInHalf     = elapsedSec >= totalMatchSec ? totalHalfSec : elapsedSec % totalHalfSec
  const remainingHalfSec  = Math.max(0, totalHalfSec - elapsedInHalf)
  const remainingMatchSec = Math.max(0, totalMatchSec - elapsedSec)

  const score0      = playerTeamScore(players, 0, n)
  const score1      = n === 2 ? playerTeamScore(players, 1, n) : null
  const team1Players = players.filter(p => p.teamIdx === 0)
  const team2Players = players.filter(p => p.teamIdx === 1)
  const selectedDef  = PLAYER_STATS.find(s => s.id === selectedStat)

  function handleStatClick(statId) {
    setSelectedStat(prev => {
      if (prev === statId) { setFocusedTeam(null); return null }
      return statId
    })
  }

  function handleTeamFocus(idx) {
    setFocusedTeam(prev => (prev === idx ? null : idx))
  }

  function handlePlayerAdj(player, d) {
    if (!selectedStat) return
    onPlayerAdj(player.id, selectedStat, d)
  }

  function handleEnd() {
    if (window.confirm('Terminer le match et voir les statistiques ?')) onEnd()
  }

  return (
    <>
      {/* ── Tableau de bord + Timer ── */}
      <div className="sb">
        <div className="sb-scores">
          {n === 2 ? (
            <>
              <div className="sb-t">
                <div className="sb-name" style={{ color: 'var(--c1)' }}>{teams[0]?.name}</div>
                <div className="sb-score" style={{ color: 'var(--c1)' }}>{score0}</div>
              </div>
              <div className="sb-sep">–</div>
              <div className="sb-t">
                <div className="sb-score" style={{ color: 'var(--c2)' }}>{score1}</div>
                <div className="sb-name" style={{ color: 'var(--c2)' }}>{teams[1]?.name}</div>
              </div>
            </>
          ) : (
            <div className="sb-t">
              <div className="sb-name" style={{ color: 'var(--c1)' }}>{teams[0]?.name}</div>
              <div className="sb-score" style={{ color: 'var(--c1)' }}>{score0}</div>
            </div>
          )}
        </div>
        <div className="clock-wrap">
          <div className="clock-main">{fmtClock(remainingHalfSec)}</div>
          <div className="clock-meta">
            Mi-temps {currentHalf}/{halfCount} · Restant {fmtClock(remainingMatchSec)}
          </div>
          <div className="clock-ctrl">
            <button className="btn-mini" onClick={() => setRunning(v => !v)}>
              {running ? 'Pause' : elapsedSec > 0 ? 'Reprendre' : 'Démarrer'}
            </button>
            <button className="btn-mini" onClick={() => { setRunning(false); setElapsedSec(0) }}>Reset</button>
          </div>
        </div>
      </div>

      {/* ── Sélecteur de stats ── */}
      <div className="pm-stats-panel">
        <div className={`pm-stats-hint${selectedDef ? ' pm-hint-active' : ''}`}>
          {selectedDef
            ? <>Stat : <strong>{selectedDef.label}</strong> — touche un joueur</>
            : 'Sélectionne une stat à affecter à un joueur'}
        </div>
        <div className="pm-stat-groups">
          {STAT_GROUPS.map(group => {
            const stats = PLAYER_STATS.filter(s => s.group === group.id)
            return (
              <div key={group.id} className="pm-stat-group">
                <div className="pm-stat-group-label">{group.label}</div>
                <div className="pm-stat-grid">
                  {stats.map(stat => (
                    <button
                      key={stat.id}
                      className={[
                        'pm-stat-btn',
                        stat.color && `pm-stat-${stat.color}`,
                        selectedStat === stat.id && 'pm-stat-sel',
                      ].filter(Boolean).join(' ')}
                      onClick={() => handleStatClick(stat.id)}
                    >
                      <span className="pm-stat-label">{stat.label}</span>
                      {stat.sub && <span className="pm-stat-sub">{stat.sub}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Sélecteur d'équipe (visible quand une stat est active, 2 équipes) ── */}
      {selectedStat && n === 2 && (
        <div className="pm-team-selector">
          <button
            className={`pm-team-sel-btn${focusedTeam === 0 ? ' pm-team-sel-active' : ''}`}
            style={focusedTeam === 0 ? { borderColor: 'var(--c1)', color: 'var(--c1)' } : {}}
            onClick={() => handleTeamFocus(0)}
          >
            <span className="pm-team-sel-dot" style={{ background: 'var(--c1)' }} />
            {teams[0]?.name}
          </button>

          <button className="pm-team-adv-btn" onClick={() => handleTeamFocus(focusedTeam === 0 ? 1 : 0)}>
            ⇄ Adverse
          </button>

          <button
            className={`pm-team-sel-btn${focusedTeam === 1 ? ' pm-team-sel-active' : ''}`}
            style={focusedTeam === 1 ? { borderColor: 'var(--c2)', color: 'var(--c2)' } : {}}
            onClick={() => handleTeamFocus(1)}
          >
            <span className="pm-team-sel-dot" style={{ background: 'var(--c2)' }} />
            {teams[1]?.name}
          </button>
        </div>
      )}

      {/* ── Joueurs en grille ── */}
      <div className={`pm-players-wrap${n === 1 ? ' pm-single-team' : ''}`}>
        <TeamColumn
          teamName={teams[0]?.name}
          teamColor="var(--c1)"
          players={team1Players}
          selectedStat={selectedStat}
          dimmed={selectedStat && n === 2 && focusedTeam === 1}
          onAdj={handlePlayerAdj}
        />
        {n === 2 && (
          <TeamColumn
            teamName={teams[1]?.name}
            teamColor="var(--c2)"
            players={team2Players}
            selectedStat={selectedStat}
            dimmed={selectedStat && focusedTeam === 0}
            onAdj={handlePlayerAdj}
          />
        )}
      </div>

      <button className="btn-end" onClick={handleEnd}>
        Fin du match →
      </button>
    </>
  )
}
