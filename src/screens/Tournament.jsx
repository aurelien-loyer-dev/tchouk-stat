import { useEffect, useState } from 'react'
import {
  mkTournament, calcStandings, setMatchScore, setKnockoutScore,
  startKnockout, canStartKnockout, addSwissRound, isRoundComplete,
} from '../lib/tournament'
import { fmtDateTime } from '../lib/format'

// ── Score input pour un match ─────────────────────────────────────────────────
function MatchRow({ match, onScore, compact }) {
  const [s1, setS1] = useState(match.score1 !== null ? String(match.score1) : '')
  const [s2, setS2] = useState(match.score2 !== null ? String(match.score2) : '')
  const played = match.score1 !== null && match.score2 !== null

  useEffect(() => {
    setS1(match.score1 !== null ? String(match.score1) : '')
    setS2(match.score2 !== null ? String(match.score2) : '')
  }, [match.score1, match.score2])

  function save(v1, v2) {
    const n1 = parseInt(v1), n2 = parseInt(v2)
    if (!isNaN(n1) && !isNaN(n2) && n1 >= 0 && n2 >= 0) onScore(n1, n2)
  }

  const winner1 = played && match.score1 > match.score2
  const winner2 = played && match.score2 > match.score1

  return (
    <div className={`trn-match${played ? ' trn-match-done' : ''}${compact ? ' trn-match-compact' : ''}`}>
      <div className={`trn-mt${winner1 ? ' trn-mt-win' : ''}`}>{match.team1}</div>
      <div className="trn-score-wrap">
        <input className="trn-si" type="number" min="0" value={s1}
          onChange={e => setS1(e.target.value)}
          onBlur={e => save(e.target.value, s2)}
          onKeyDown={e => e.key === 'Enter' && save(s1, s2)}
        />
        <span className="trn-dash">–</span>
        <input className="trn-si" type="number" min="0" value={s2}
          onChange={e => setS2(e.target.value)}
          onBlur={e => save(s1, e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save(s1, s2)}
        />
      </div>
      <div className={`trn-mt trn-mt-r${winner2 ? ' trn-mt-win' : ''}`}>{match.team2}</div>
    </div>
  )
}

// ── Tableau de classement ─────────────────────────────────────────────────────
function Standings({ teams, matches, qualifyN }) {
  const rows = calcStandings(teams, matches)
  return (
    <div className="trn-table-wrap">
      <table className="trn-table">
        <thead>
          <tr>
            <th>#</th><th className="trn-th-team">Équipe</th>
            <th title="Joués">J</th><th title="Victoires">V</th>
            <th title="Nuls">N</th><th title="Défaites">D</th>
            <th title="Buts pour">BP</th><th title="Buts contre">BC</th>
            <th title="Différence">Diff</th><th className="trn-th-pts">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team} className={qualifyN && i < qualifyN ? 'trn-qualified' : ''}>
              <td className="trn-rank">{i + 1}</td>
              <td className="trn-th-team">{r.team}</td>
              <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
              <td>{r.gf}</td><td>{r.ga}</td>
              <td className={r.gd > 0 ? 'trn-pos' : r.gd < 0 ? 'trn-neg' : ''}>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              <td className="trn-pts">{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Bracket knockout ──────────────────────────────────────────────────────────
function KnockoutBracket({ rounds, onScore }) {
  return (
    <div className="trn-bracket">
      {rounds.map((round, ri) => (
        <div key={ri} className="trn-bround">
          <div className="trn-bround-name">{round.name}</div>
          <div className="trn-bround-matches">
            {round.matches.map((m, mi) =>
              m.team1 === 'TBD' || m.team2 === 'TBD' ? (
                <div key={m.id} className="trn-match trn-match-tbd">
                  <span className="trn-mt">{m.team1}</span>
                  <span className="trn-dash">–</span>
                  <span className="trn-mt">{m.team2}</span>
                </div>
              ) : (
                <MatchRow
                  key={m.id + m.score1 + m.score2}
                  match={m}
                  compact
                  onScore={(s1, s2) => onScore(ri, mi, s1, s2)}
                />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Barre de progression ──────────────────────────────────────────────────────
function Progress({ done, total, label }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="trn-prog">
      <div className="trn-prog-label">{label || `${done} / ${total} matchs joués`}</div>
      <div className="trn-prog-track"><div className="trn-prog-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

function getTournamentMatches(tournament) {
  if (tournament.format === 'groups') return tournament.groups?.flatMap(g => g.matches) || []
  if (tournament.format === 'swiss') return tournament.rounds?.flatMap(r => r.matches) || []
  return tournament.matches || []
}

function isAllPlayed(matches) {
  return matches.length > 0 && matches.every(m => m.score1 !== null && m.score2 !== null)
}

function getWinnerFromKnockout(rounds) {
  const finalRound = rounds?.[rounds.length - 1]
  const finalMatch = finalRound?.matches?.[0]
  if (!finalMatch || finalMatch.score1 === null || finalMatch.score2 === null || finalMatch.score1 === finalMatch.score2) return null
  return finalMatch.score1 > finalMatch.score2 ? finalMatch.team1 : finalMatch.team2
}

function getTournamentEndState(tournament) {
  const allMatches = getTournamentMatches(tournament)
  const standings = calcStandings(tournament.teams, allMatches)
  const knockoutDone = tournament.knockoutRounds
    ? tournament.knockoutRounds.every(round => round.matches.every(match => match.score1 !== null && match.score2 !== null && match.score1 !== match.score2))
    : false
  const finished = tournament.format === 'swiss'
    ? isRoundComplete(tournament.rounds?.[tournament.rounds.length - 1]) && tournament.rounds.length >= tournament.numSwissRounds
    : tournament.knockoutRounds
    ? isAllPlayed(allMatches) && knockoutDone
    : isAllPlayed(allMatches)

  const winner = tournament.knockoutRounds
    ? getWinnerFromKnockout(tournament.knockoutRounds)
    : standings[0]?.team || null

  return { finished, standings, winner, allMatches }
}

function TournamentEnd({ tournament, onBack }) {
  const { standings, winner, allMatches } = getTournamentEndState(tournament)
  const topThree = standings.slice(0, 3)
  const totalPlayed = allMatches.filter(m => m.score1 !== null && m.score2 !== null).length

  return (
    <div className="trn-end">
      <div className="trn-end-hero">
        <div className="trn-end-badge">🏆</div>
        <div className="trn-end-title">Tournoi terminé</div>
        <div className="trn-end-subtitle">
          {winner ? `Vainqueur : ${winner}` : 'Classement final disponible'}
        </div>
        <div className="trn-end-meta">
          {totalPlayed} matchs joués · {tournament.teams.length} équipes
        </div>
      </div>

      <div className="trn-section">Podium</div>
      <div className="trn-podium">
        {topThree.map((row, i) => (
          <div key={row.team} className={`trn-podium-card trn-podium-${i + 1}`}>
            <div className="trn-podium-rank">#{i + 1}</div>
            <div className="trn-podium-team">{row.team}</div>
            <div className="trn-podium-points">{row.pts} pts</div>
          </div>
        ))}
      </div>

      <div className="trn-section">Classement final</div>
      <Standings teams={tournament.teams} matches={allMatches} />

      <button className="btn-acc trn-end-btn" onClick={onBack}>← Retour à la liste</button>
    </div>
  )
}

function ValidationBanner({ onValidate }) {
  return (
    <div className="trn-validate-banner">
      <div>
        <div className="trn-validate-title">Tournoi terminé</div>
        <div className="trn-validate-text">Valide le tournoi pour afficher l'écran final et le classement complet.</div>
      </div>
      <button className="btn-acc trn-validate-btn" onClick={onValidate}>
        Valider le tournoi
      </button>
    </div>
  )
}

// ── Vue Tous contre tous ──────────────────────────────────────────────────────
function RoundRobinView({ tournament, onUpdate, finished, onValidate }) {
  const done = tournament.matches.filter(m => m.score1 !== null).length
  const perGroup = tournament.knockoutSize ?? 0

  return (
    <>
      <Progress done={done} total={tournament.matches.length} />
      <div className="trn-section">Classement</div>
      <Standings teams={tournament.teams} matches={tournament.matches} qualifyN={perGroup} />

      <div className="trn-section">Matchs</div>
      <div className="trn-matches-list">
        {tournament.matches.map(m => (
          <MatchRow key={m.id + m.score1 + m.score2} match={m}
            onScore={(s1, s2) => onUpdate(setMatchScore(tournament, m.id, s1, s2))} />
        ))}
      </div>

      {canStartKnockout(tournament) && (
        <button className="btn-acc trn-ko-btn" onClick={() => onUpdate(startKnockout(tournament))}>
          Lancer la phase finale →
        </button>
      )}
      {tournament.knockoutRounds && (
        <>
          <div className="trn-section">Phase finale</div>
          <KnockoutBracket rounds={tournament.knockoutRounds}
            onScore={(ri, mi, s1, s2) => onUpdate(setKnockoutScore(tournament, ri, mi, s1, s2))} />
        </>
      )}

      {finished && (
        <ValidationBanner onValidate={onValidate} />
      )}
    </>
  )
}

// ── Vue Poules ────────────────────────────────────────────────────────────────
function GroupsView({ tournament, onUpdate, finished, onValidate }) {
  const allMatches = tournament.groups.flatMap(g => g.matches)
  const done = allMatches.filter(m => m.score1 !== null).length
  const perGroup = tournament.knockoutSize ? Math.ceil(tournament.knockoutSize / tournament.groups.length) : 0

  return (
    <>
      <Progress done={done} total={allMatches.length} />

      <div className="trn-groups-grid">
        {tournament.groups.map(g => (
          <div key={g.id} className="trn-group">
            <div className="trn-group-hd">{g.name}</div>
            <Standings teams={g.teams} matches={g.matches} qualifyN={perGroup} />
            <div className="trn-matches-list">
              {g.matches.map(m => (
                <MatchRow key={m.id + m.score1 + m.score2} match={m} compact
                  onScore={(s1, s2) => onUpdate(setMatchScore(tournament, m.id, s1, s2))} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {canStartKnockout(tournament) && (
        <button className="btn-acc trn-ko-btn" onClick={() => onUpdate(startKnockout(tournament))}>
          Lancer la phase finale →
        </button>
      )}
      {tournament.knockoutRounds && (
        <>
          <div className="trn-section">Phase finale</div>
          <KnockoutBracket rounds={tournament.knockoutRounds}
            onScore={(ri, mi, s1, s2) => onUpdate(setKnockoutScore(tournament, ri, mi, s1, s2))} />
        </>
      )}

      {finished && (
        <ValidationBanner onValidate={onValidate} />
      )}
    </>
  )
}

// ── Vue Ronde suisse ──────────────────────────────────────────────────────────
function SwissView({ tournament, onUpdate, finished, onValidate }) {
  const allMatches = tournament.rounds.flatMap(r => r.matches)
  const currentRound = tournament.rounds[tournament.rounds.length - 1]
  const roundDone = isRoundComplete(currentRound)
  const canNext = roundDone && tournament.rounds.length < tournament.numSwissRounds
  const roundFinished = roundDone && tournament.rounds.length >= tournament.numSwissRounds;

  return (
    <>
      <div className="trn-prog-label" style={{ marginBottom: 4 }}>
        Ronde {tournament.rounds.length} / {tournament.numSwissRounds}
      </div>
      <div className="trn-prog-track" style={{ marginBottom: 12 }}>
        <div className="trn-prog-fill" style={{ width: `${Math.round(tournament.rounds.length / tournament.numSwissRounds * 100)}%` }} />
      </div>

      <div className="trn-section">Classement</div>
      <Standings teams={tournament.teams} matches={allMatches} />

      {tournament.rounds.map((round, ri) => (
        <div key={ri}>
          <div className="trn-section">{round.name}</div>
          <div className="trn-matches-list">
            {round.matches.map(m => (
              <MatchRow key={m.id + m.score1 + m.score2} match={m}
                onScore={(s1, s2) => onUpdate(setMatchScore(tournament, m.id, s1, s2))} />
            ))}
          </div>
        </div>
      ))}

      {canNext && (
        <button className="btn-acc trn-ko-btn" onClick={() => onUpdate(addSwissRound(tournament))}>
          Ronde {tournament.rounds.length + 1} →
        </button>
      )}
      {finished && roundFinished && <ValidationBanner onValidate={onValidate} />}
    </>
  )
}

// ── Formulaire de création ────────────────────────────────────────────────────
const KNOCKOUT_OPTIONS = [
  { value: null, label: 'Pas de phase finale' },
  { value: 2,   label: 'Finale uniquement' },
  { value: 4,   label: 'Demi-finales + Finale' },
  { value: 8,   label: 'Quarts + Demis + Finale' },
  { value: 16,  label: '8èmes + Quarts + Demis + Finale' },
  { value: 32,  label: '16èmes + ...' },
]

function TournamentSetup({ onStart, onCancel }) {
  const [name, setName]             = useState('')
  const [format, setFormat]         = useState('roundrobin')
  const [teamInput, setTeamInput]   = useState('')
  const [teams, setTeams]           = useState([])
  const [numGroups, setNumGroups]   = useState(2)
  const [knockoutSize, setKoSize]   = useState(null)
  const [swissRounds, setSwissRounds] = useState(5)

  function addTeam() {
    const t = teamInput.trim()
    if (t && !teams.includes(t)) { setTeams(p => [...p, t]); setTeamInput('') }
  }

  function handleStart() {
    if (teams.length < 2) return
    const n = name.trim() || `Tournoi du ${new Date().toLocaleDateString('fr-FR')}`
    onStart(mkTournament({
      name: n, format, teams,
      numGroups: Number(numGroups),
      knockoutSize,
      numSwissRounds: Number(swissRounds),
    }))
  }

  const showKo = format === 'roundrobin' || format === 'groups'

  return (
    <>
      <div className="trn-topbar">
        <button className="btn-mini" onClick={onCancel}>← Annuler</button>
        <div className="trn-topbar-title">Nouveau tournoi</div>
      </div>

      <div className="trn-setup">
        <div className="trn-field">
          <div className="flabel">Nom du tournoi</div>
          <input type="text" placeholder="Ex: Open de printemps" value={name}
            onChange={e => setName(e.target.value)} autoFocus />
        </div>

        <div className="trn-field">
          <div className="flabel">Format</div>
          <div className="seg">
            <button className={format === 'roundrobin' ? 'on' : ''} onClick={() => setFormat('roundrobin')}>Tous vs tous</button>
            <button className={format === 'groups' ? 'on' : ''} onClick={() => setFormat('groups')}>Poules</button>
            <button className={format === 'swiss' ? 'on' : ''} onClick={() => setFormat('swiss')}>Ronde suisse</button>
          </div>
        </div>

        {format === 'groups' && (
          <div className="trn-field">
            <div className="flabel">Nombre de poules</div>
            <select className="sel" value={numGroups} onChange={e => setNumGroups(e.target.value)}>
              {[2, 3, 4, 6, 8].map(n => <option key={n} value={n}>{n} poules</option>)}
            </select>
          </div>
        )}

        {format === 'swiss' && (
          <div className="trn-field">
            <div className="flabel">Nombre de rondes</div>
            <input type="number" min="2" max="15" value={swissRounds}
              onChange={e => setSwissRounds(e.target.value)} />
          </div>
        )}

        {showKo && (
          <div className="trn-field">
            <div className="flabel">Phase finale (optionnel)</div>
            <select className="sel" value={knockoutSize === null ? 'null' : String(knockoutSize)}
              onChange={e => setKoSize(e.target.value === 'null' ? null : Number(e.target.value))}>
              {KNOCKOUT_OPTIONS.map(o => (
                <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="trn-field">
          <div className="flabel">Équipes ({teams.length})</div>
          <div className="trn-team-row">
            <input type="text" placeholder="Nom de l'équipe" value={teamInput}
              onChange={e => setTeamInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTeam()} />
            <button className="btn-mini" onClick={addTeam}>+ Ajouter</button>
          </div>
          {teams.length > 0 && (
            <div className="trn-chips">
              {teams.map(t => (
                <div key={t} className="trn-chip">
                  <span>{t}</span>
                  <button onClick={() => setTeams(p => p.filter(x => x !== t))}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="btn-acc" onClick={handleStart} disabled={teams.length < 2}>
          Lancer le tournoi →
        </button>
      </div>
    </>
  )
}

// ── Détail d'un tournoi ───────────────────────────────────────────────────────
function TournamentDetail({ tournament, onUpdate, onBack, onValidate, validated }) {
  const formatLabel = { roundrobin: 'Tous vs tous', groups: 'Poules', swiss: 'Ronde suisse' }
  const { finished } = getTournamentEndState(tournament)
  if (validated) {
    return (
      <div className="trn-detail">
        <div className="trn-topbar">
          <button className="btn-mini" onClick={onBack}>← Retour</button>
          <div>
            <div className="trn-topbar-title">{tournament.name}</div>
            <div className="trn-topbar-meta">
              {formatLabel[tournament.format]} · {tournament.teams.length} équipes
            </div>
          </div>
        </div>

        <TournamentEnd tournament={tournament} onBack={onBack} />
      </div>
    )
  }

  return (
    <div className="trn-detail">
      <div className="trn-topbar">
        <button className="btn-mini" onClick={onBack}>← Retour</button>
        <div>
          <div className="trn-topbar-title">{tournament.name}</div>
          <div className="trn-topbar-meta">
            {formatLabel[tournament.format]} · {tournament.teams.length} équipes
          </div>
        </div>
      </div>

      {tournament.format === 'roundrobin' && <RoundRobinView tournament={tournament} onUpdate={onUpdate} finished={finished} onValidate={() => onValidate(tournament.id)} />}
      {tournament.format === 'groups'     && <GroupsView     tournament={tournament} onUpdate={onUpdate} finished={finished} onValidate={() => onValidate(tournament.id)} />}
      {tournament.format === 'swiss'      && <SwissView      tournament={tournament} onUpdate={onUpdate} finished={finished} onValidate={() => onValidate(tournament.id)} />}
    </div>
  )
}

// ── Écran principal Tournois ──────────────────────────────────────────────────
export default function Tournament({ tournaments, onSave, onBack, theme, onToggleTheme }) {
  const [view, setView]       = useState('list')
  const [active, setActive]   = useState(null)
  const [validatedIds, setValidatedIds] = useState([])

  function handleStart(t) {
    const next = [t, ...tournaments]
    onSave(next); setActive(t); setView('detail')
  }

  function handleUpdate(updated) {
    const next = tournaments.map(t => t.id === updated.id ? updated : t)
    onSave(next); setActive(updated)
    setValidatedIds(ids => ids.filter(id => id !== updated.id))
  }

  function handleValidate(id) {
    setValidatedIds(ids => ids.includes(id) ? ids : [id, ...ids])
  }

  function handleDelete(id) {
    if (!window.confirm('Supprimer ce tournoi ?')) return
    onSave(tournaments.filter(t => t.id !== id))
    setValidatedIds(ids => ids.filter(vId => vId !== id))
    if (active?.id === id) setView('list')
  }

  if (view === 'setup')
    return <TournamentSetup onStart={handleStart} onCancel={() => setView('list')} />

  if (view === 'detail' && active)
    return (
      <TournamentDetail
        tournament={active}
        onUpdate={handleUpdate}
        onBack={() => setView('list')}
        onValidate={handleValidate}
        validated={validatedIds.includes(active.id)}
      />
    )

  return (
    <div className="trn-list-screen">
      <div className="trn-topbar">
        <button className="btn-mini" onClick={onBack}>← Accueil</button>
        <div className="trn-topbar-title">Tournois</div>
        <button className="btn-mini trn-theme-btn" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Theme clair' : 'Theme sombre'}
        </button>
        <button className="btn-acc trn-new-btn" onClick={() => setView('setup')}>+ Nouveau</button>
      </div>

      {tournaments.length === 0 ? (
        <div className="trn-empty">
          <div className="trn-empty-icon">🏆</div>
          <div>Aucun tournoi créé pour l'instant.</div>
          <button className="btn-acc" onClick={() => setView('setup')}>Créer un tournoi</button>
        </div>
      ) : (
        <div className="trn-list">
          {tournaments.map(t => {
            const allMatches = t.format === 'groups'
              ? t.groups?.flatMap(g => g.matches) ?? []
              : t.format === 'swiss'
              ? t.rounds?.flatMap(r => r.matches) ?? []
              : t.matches ?? []
            const done = allMatches.filter(m => m.score1 !== null).length
            const formatLabel = { roundrobin: 'Tous vs tous', groups: 'Poules', swiss: 'Ronde suisse' }
            return (
              <div key={t.id} className="trn-item" onClick={() => { setActive(t); setView('detail') }}>
                <div className="trn-item-info">
                  <div className="trn-item-name">{t.name}</div>
                  <div className="trn-item-meta">
                    {formatLabel[t.format]} · {t.teams.length} équipes · {done}/{allMatches.length} matchs
                    {t.createdAt && <> · {fmtDateTime(t.createdAt)}</>}
                  </div>
                </div>
                <button className="trn-item-del" onClick={e => { e.stopPropagation(); handleDelete(t.id) }}>×</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
