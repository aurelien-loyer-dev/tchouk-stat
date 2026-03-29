import { useState } from 'react'

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return 'Date inconnue'
  }
}

export default function Setup({ numTeams, setNumTeams, onStart, history, onClearHistory, defaultSettings }) {
  const [name1, setName1] = useState('')
  const [name2, setName2] = useState('')
  const [color1, setColor1] = useState(defaultSettings?.teamColors?.[0] || '#5de8d6')
  const [color2, setColor2] = useState(defaultSettings?.teamColors?.[1] || '#ff7272')
  const [halfDurationMin, setHalfDurationMin] = useState(defaultSettings?.halfDurationMin || 12)
  const [halfCount, setHalfCount] = useState(defaultSettings?.halfCount || 2)

  function handleStart() {
    const n1 = name1.trim() || 'Équipe 1'
    const names = [n1]
    if (numTeams === 2) names.push(name2.trim() || 'Équipe 2')
    onStart({
      names,
      settings: {
        teamColors: [color1, color2],
        halfDurationMin: Math.max(1, Number(halfDurationMin) || 1),
        halfCount: Math.max(1, Number(halfCount) || 1),
      },
    })
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleStart()
  }

  return (
    <>
      <h1>Tchoukball</h1>

      <div>
        <div className="flabel" style={{ textAlign: 'center', marginBottom: 10 }}>
          Nombre d'équipes
        </div>
        <div className="seg">
          <button className={numTeams === 1 ? 'on' : ''} onClick={() => setNumTeams(1)}>
            1 équipe
          </button>
          <button className={numTeams === 2 ? 'on' : ''} onClick={() => setNumTeams(2)}>
            2 équipes
          </button>
        </div>
      </div>

      <div className="fields">
        <div className="field">
          <div className="flabel">Équipe 1</div>
          <input
            type="text"
            placeholder="Nom…"
            value={name1}
            onChange={e => setName1(e.target.value)}
            onKeyDown={handleKey}
            autoFocus
          />
        </div>
        {numTeams === 2 && (
          <div className="field">
            <div className="flabel">Équipe 2</div>
            <input
              type="text"
              placeholder="Nom…"
              value={name2}
              onChange={e => setName2(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>
        )}
      </div>

      <div className="setup-card">
        <div className="flabel">Options de match</div>

        <div className="opts-grid">
          <div className="field">
            <div className="flabel">Couleur Équipe 1</div>
            <input
              className="color-in"
              type="color"
              value={color1}
              onChange={e => setColor1(e.target.value)}
            />
          </div>

          {numTeams === 2 && (
            <div className="field">
              <div className="flabel">Couleur Équipe 2</div>
              <input
                className="color-in"
                type="color"
                value={color2}
                onChange={e => setColor2(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <div className="flabel">Durée d'une mi-temps (min)</div>
            <input
              type="number"
              min={1}
              max={60}
              value={halfDurationMin}
              onChange={e => setHalfDurationMin(e.target.value)}
            />
          </div>

          <div className="field">
            <div className="flabel">Nombre de mi-temps</div>
            <select
              className="sel"
              value={halfCount}
              onChange={e => setHalfCount(e.target.value)}
            >
              {[1, 2, 3, 4].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button className="btn-acc" onClick={handleStart}>
        Commencer
      </button>

      <div className="history-box">
        <div className="history-head">
          <div className="flabel">Historique des matchs</div>
          {history && history.length > 0 && (
            <button className="btn-mini" onClick={onClearHistory}>Vider</button>
          )}
        </div>

        {!history || history.length === 0 ? (
          <div className="history-empty">Aucun match enregistré pour le moment.</div>
        ) : (
          <div className="history-list">
            {history.slice(0, 5).map(entry => (
              <div className="history-item" key={entry.id}>
                <div className="history-date">{fmtDate(entry.playedAt)}</div>
                <div className="history-score">{entry.teams.map(team => `${team.name} ${team.score}`).join(' - ')}</div>
                <div className="history-meta">{entry.teams.map(team => `${team.tirs} tirs`).join(' | ')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
