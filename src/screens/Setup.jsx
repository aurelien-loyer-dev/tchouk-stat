import { useEffect, useRef, useState } from 'react'
import { mkPlayer } from '../lib/playerStats'

const COMPOS_KEY = 'tchouk_compos'
function loadComposFromStorage() {
  try { return JSON.parse(localStorage.getItem(COMPOS_KEY) || '[]') }
  catch { return [] }
}
function saveComposToStorage(list) {
  try { localStorage.setItem(COMPOS_KEY, JSON.stringify(list.slice(0, 30))) }
  catch {}
}

// ── Gestionnaire de compositions ─────────────────────────────────────────────
function CompoLoader({ compos, onLoad, onSave, onDelete, onUpdate, currentTeamLabel }) {
  const [open, setOpen]         = useState(false)
  const [saveName, setSaveName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft]       = useState(null)

  function startEdit(c) {
    setEditingId(c.id)
    setDraft({ name: c.name, teamName: c.teamName, color: c.color, players: [...c.players] })
  }

  function cancelEdit() { setEditingId(null); setDraft(null) }

  function confirmEdit() {
    if (!draft) return
    onUpdate(editingId, {
      name:     draft.name.trim() || draft.teamName,
      teamName: draft.teamName,
      color:    draft.color,
      players:  draft.players.filter(p => p.trim()),
    })
    cancelEdit()
  }

  function draftSetPlayer(i, val) {
    setDraft(d => { const p = [...d.players]; p[i] = val; return { ...d, players: p } })
  }

  function handleSave() {
    const n = saveName.trim()
    if (!n) return
    onSave(n)
    setSaveName('')
  }

  return (
    <div className="ps-compo-mgr">
      <button className="btn-mini ps-compo-toggle" onClick={() => setOpen(v => !v)}>
        {open ? '▲ Compos' : '▼ Compos'}
      </button>
      {open && (
        <div className="ps-compo-panel">
          {compos.length === 0
            ? <div className="ps-compo-empty">Aucune compo sauvegardée</div>
            : compos.map(c => (
                <div key={c.id}>
                  {editingId === c.id && draft ? (
                    <div className="ps-compo-edit">
                      <div className="ps-compo-edit-row">
                        <input
                          className="ps-compo-edit-input"
                          placeholder="Nom de la compo"
                          value={draft.name}
                          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                        />
                      </div>
                      <div className="ps-compo-edit-row">
                        <input
                          className="ps-compo-edit-input"
                          placeholder="Nom d'équipe"
                          value={draft.teamName}
                          onChange={e => setDraft(d => ({ ...d, teamName: e.target.value }))}
                        />
                        <input
                          type="color"
                          className="color-in ps-compo-edit-color"
                          value={draft.color}
                          onChange={e => setDraft(d => ({ ...d, color: e.target.value }))}
                        />
                      </div>
                      <div className="ps-compo-edit-players">
                        {draft.players.map((p, i) => (
                          <div className="ps-player-row" key={i}>
                            <input
                              type="text"
                              placeholder={`Joueur ${i + 1}`}
                              value={p}
                              onChange={e => draftSetPlayer(i, e.target.value)}
                            />
                            {draft.players.length > 1 && (
                              <button className="btn-mini ps-rm-btn"
                                onClick={() => setDraft(d => ({ ...d, players: d.players.filter((_, j) => j !== i) }))}>×</button>
                            )}
                          </div>
                        ))}
                        <button className="btn-mini ps-add-btn"
                          onClick={() => setDraft(d => ({ ...d, players: [...d.players, ''] }))}>+ Joueur</button>
                      </div>
                      <div className="ps-compo-edit-actions">
                        <button className="btn-mini ps-compo-ok" onClick={confirmEdit}>Valider ✓</button>
                        <button className="btn-mini" onClick={cancelEdit}>Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <div className="ps-compo-item">
                      <span className="ps-compo-dot" style={{ background: c.color }} />
                      <span className="ps-compo-lbl">
                        <span className="ps-compo-name">{c.name}</span>
                        <span className="ps-compo-meta">{c.teamName} · {c.players.length}j</span>
                      </span>
                      <button className="btn-mini" onClick={() => { onLoad(c); setOpen(false) }}>Charger</button>
                      <button className="btn-mini ps-compo-edit-btn" onClick={() => startEdit(c)}>✏</button>
                      <button className="btn-mini ps-compo-del" onClick={() => onDelete(c.id)}>×</button>
                    </div>
                  )}
                </div>
              ))
          }
          <div className="ps-compo-save">
            <input
              type="text"
              placeholder={currentTeamLabel ? `Sauvegarder "${currentTeamLabel}"…` : 'Nom de la compo…'}
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onFocus={() => { if (!saveName && currentTeamLabel) setSaveName(currentTeamLabel) }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <button className="btn-mini" onClick={handleSave}>Sauvegarder</button>
          </div>
        </div>
      )}
    </div>
  )
}

function fmtDateTime(iso) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return '' }
}

function LogoUpload({ label, logo, onChange, color }) {
  const ref = useRef(null)
  return (
    <div className="logo-upload" onClick={() => ref.current.click()} style={{ borderColor: color + '55' }}>
      {logo
        ? <img src={logo} alt={label} className="logo-preview" />
        : <div className="logo-placeholder" style={{ color }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span>Logo</span>
          </div>
      }
      <input
        ref={ref}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = ev => onChange(ev.target.result)
          reader.readAsDataURL(file)
        }}
      />
    </div>
  )
}

// ── Liste de noms de joueurs (colonne) ────────────────────────────────────────
function PlayerNamesCol({ teamLabel, teamColor, names, onChange, compos, onSaveCompo, onDeleteCompo, onLoadCompo, onUpdateCompo }) {
  function updateName(i, val) {
    const next = [...names]
    next[i] = val
    onChange(next)
  }
  function addPlayer() { onChange([...names, '']) }
  function removePlayer(i) { onChange(names.filter((_, j) => j !== i)) }

  return (
    <div className="ps-team-col">
      <div className="ps-team-hd" style={{ color: teamColor }}>{teamLabel}</div>
      <CompoLoader
        compos={compos}
        onLoad={onLoadCompo}
        onSave={onSaveCompo}
        onDelete={onDeleteCompo}
        onUpdate={onUpdateCompo}
        currentTeamLabel={teamLabel}
      />
      {names.map((name, i) => (
        <div className="ps-player-row" key={i}>
          <input
            type="text"
            placeholder={`Joueur ${i + 1}`}
            value={name}
            onChange={e => updateName(i, e.target.value)}
          />
          {names.length > 1 && (
            <button className="btn-mini ps-rm-btn" onClick={() => removePlayer(i)}>×</button>
          )}
        </div>
      ))}
      <button className="btn-mini ps-add-btn" onClick={addPlayer}>+ Joueur</button>
    </div>
  )
}

// ── Écran de configuration ────────────────────────────────────────────────────
export default function Setup({ numTeams, setNumTeams, onStart, defaultSettings, history, onViewHistory }) {
  const [mode, setMode]   = useState('stats') // 'stats' | 'scorer' | 'player'
  const [name1, setName1] = useState('')
  const [name2, setName2] = useState('')
  const [color1, setColor1] = useState(defaultSettings?.teamColors?.[0] || '#5de8d6')
  const [color2, setColor2] = useState(defaultSettings?.teamColors?.[1] || '#ff7272')
  const [logo1, setLogo1] = useState(null)
  const [logo2, setLogo2] = useState(null)
  const [halfDurationMin, setHalfDurationMin] = useState(defaultSettings?.halfDurationMin || 12)
  const [halfCount, setHalfCount] = useState(defaultSettings?.halfCount || 2)

  // Noms des joueurs par équipe (mode 'player')
  const [playerNumTeams, setPlayerNumTeams] = useState(2) // 1 ou 2 équipes en mode joueurs
  const [players1, setPlayers1] = useState(['', '', ''])
  const [players2, setPlayers2] = useState(['', '', ''])

  // Compositions sauvegardées
  const [compos, setCompos] = useState(loadComposFromStorage)

  function saveCompo(saveName, teamName, teamColor, players) {
    const entry = {
      id:       typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name:     saveName,
      teamName,
      color:    teamColor,
      players:  players.filter(p => p.trim()),
      savedAt:  new Date().toISOString(),
    }
    const next = [entry, ...compos]
    setCompos(next)
    saveComposToStorage(next)
  }

  function deleteCompo(id) {
    const next = compos.filter(c => c.id !== id)
    setCompos(next)
    saveComposToStorage(next)
  }

  function updateCompo(id, fields) {
    const next = compos.map(c => c.id === id ? { ...c, ...fields, savedAt: new Date().toISOString() } : c)
    setCompos(next)
    saveComposToStorage(next)
  }

  useEffect(() => { if (numTeams !== 2) setNumTeams(2) }, [numTeams, setNumTeams])

  const n1Label = name1.trim() || 'Équipe 1'
  const n2Label = name2.trim() || 'Équipe 2'

  function handleStart() {
    const settings = {
      teamColors: [color1, color2],
      halfDurationMin: Math.max(1, Number(halfDurationMin) || 1),
      halfCount:       Math.max(1, Number(halfCount) || 1),
    }

    if (mode === 'player') {
      const buildPlayers = (names, teamIdx) =>
        names
          .map(n => n.trim())
          .filter(n => n.length > 0)
          .map(n => mkPlayer(n, teamIdx))

      const allPlayers = [...buildPlayers(players1, 0)]
      if (playerNumTeams === 2) allPlayers.push(...buildPlayers(players2, 1))

      // Joueur par défaut si colonne vide
      if (!allPlayers.some(p => p.teamIdx === 0)) allPlayers.unshift(mkPlayer('Joueur 1', 0))
      if (playerNumTeams === 2 && !allPlayers.some(p => p.teamIdx === 1)) allPlayers.push(mkPlayer('Joueur 1', 1))

      onStart({
        names:          [n1Label, n2Label],
        mode:           'player',
        playerNumTeams,
        players:        allPlayers,
        settings,
      })
      return
    }

    onStart({
      names:    [n1Label, n2Label],
      mode,
      logos:    [logo1, logo2],
      settings,
    })
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleStart()
  }

  const recentHistory = (history || []).slice(0, 3)

  return (
    <>
      <h1>Tchoukball Assistant</h1>

      {/* ── Mode ── */}
      <section className="setup-section">
        <div className="section-title">Mode</div>
        <div className="seg mode-seg">
          <button className={mode === 'stats' ? 'on' : ''} onClick={() => setMode('stats')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            Feuille de stats
          </button>
          <button className={mode === 'scorer' ? 'on' : ''} onClick={() => setMode('scorer')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            Scoreur
          </button>
          <button className={mode === 'player' ? 'on' : ''} onClick={() => setMode('player')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <circle cx="9" cy="7" r="4" />
              <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
            Stats joueurs
          </button>
        </div>
      </section>

      {/* ── Équipes (stats & scorer) ── */}
      {mode !== 'player' && (
        <section className="setup-section">
          <div className="section-title">Configuration des équipes</div>
          <div className="flabel" style={{ marginBottom: 10 }}>Format fixe : 2 équipes</div>
          <div className="team-rows">
            {/* Équipe 1 */}
            <div className="team-row">
              {mode === 'scorer' && <LogoUpload label="Équipe 1" logo={logo1} onChange={setLogo1} color={color1} />}
              <div className="team-row-fields">
                <div className="field">
                  <div className="flabel">Équipe 1</div>
                  <input type="text" placeholder="Nom" value={name1}
                         onChange={e => setName1(e.target.value)} onKeyDown={handleKey} autoFocus />
                </div>
                <div className="field" style={{ maxWidth: 80 }}>
                  <div className="flabel">Couleur</div>
                  <input className="color-in" type="color" value={color1} onChange={e => setColor1(e.target.value)} />
                </div>
              </div>
            </div>
            {/* Équipe 2 */}
            <div className="team-row">
              {mode === 'scorer' && <LogoUpload label="Équipe 2" logo={logo2} onChange={setLogo2} color={color2} />}
              <div className="team-row-fields">
                <div className="field">
                  <div className="flabel">Équipe 2</div>
                  <input type="text" placeholder="Nom" value={name2}
                         onChange={e => setName2(e.target.value)} onKeyDown={handleKey} />
                </div>
                <div className="field" style={{ maxWidth: 80 }}>
                  <div className="flabel">Couleur</div>
                  <input className="color-in" type="color" value={color2} onChange={e => setColor2(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Mode joueurs : noms des équipes + joueurs ── */}
      {mode === 'player' && (
        <section className="setup-section">
          <div className="section-title">Équipes &amp; joueurs</div>

          {/* Nombre d'équipes */}
          <div className="seg" style={{ maxWidth: 280 }}>
            <button className={playerNumTeams === 1 ? 'on' : ''} onClick={() => setPlayerNumTeams(1)}>
              1 équipe
            </button>
            <button className={playerNumTeams === 2 ? 'on' : ''} onClick={() => setPlayerNumTeams(2)}>
              2 équipes
            </button>
          </div>

          {/* Noms + couleurs des équipes */}
          <div className={`ps-teams-row${playerNumTeams === 1 ? ' ps-single' : ''}`}>
            <div className="ps-team-name-field">
              <div className="flabel">Équipe 1</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="text" placeholder="Nom équipe 1" value={name1}
                       onChange={e => setName1(e.target.value)} autoFocus />
                <input className="color-in" type="color" value={color1}
                       onChange={e => setColor1(e.target.value)} style={{ width: 44, flexShrink: 0 }} />
              </div>
            </div>
            {playerNumTeams === 2 && (
              <div className="ps-team-name-field">
                <div className="flabel">Équipe 2</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="text" placeholder="Nom équipe 2" value={name2}
                         onChange={e => setName2(e.target.value)} />
                  <input className="color-in" type="color" value={color2}
                         onChange={e => setColor2(e.target.value)} style={{ width: 44, flexShrink: 0 }} />
                </div>
              </div>
            )}
          </div>

          {/* Joueurs par équipe */}
          <div className={`ps-players-grid${playerNumTeams === 1 ? ' ps-single' : ''}`}>
            <PlayerNamesCol
              teamLabel={n1Label}
              teamColor={color1}
              names={players1}
              onChange={setPlayers1}
              compos={compos}
              onSaveCompo={name => saveCompo(name, n1Label, color1, players1)}
              onDeleteCompo={deleteCompo}
              onUpdateCompo={updateCompo}
              onLoadCompo={c => { setName1(c.teamName || c.name); setColor1(c.color); setPlayers1(c.players.length ? c.players : ['']) }}
            />
            {playerNumTeams === 2 && (
              <PlayerNamesCol
                teamLabel={n2Label}
                teamColor={color2}
                names={players2}
                onChange={setPlayers2}
                compos={compos}
                onSaveCompo={name => saveCompo(name, n2Label, color2, players2)}
                onDeleteCompo={deleteCompo}
                onUpdateCompo={updateCompo}
                onLoadCompo={c => { setName2(c.teamName || c.name); setColor2(c.color); setPlayers2(c.players.length ? c.players : ['']) }}
              />
            )}
          </div>
        </section>
      )}

      {/* ── Mi-temps ── */}
      <section className="setup-section">
        <div className="section-title">Configuration des mi-temps</div>
        <div className="opts-grid">
          <div className="field">
            <div className="flabel">Durée d'une mi-temps (min)</div>
            <input type="number" min={1} max={60} value={halfDurationMin}
                   onChange={e => setHalfDurationMin(e.target.value)} />
          </div>
          <div className="field">
            <div className="flabel">Nombre de mi-temps</div>
            <select className="sel" value={halfCount} onChange={e => setHalfCount(e.target.value)}>
              {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
      </section>

      <button className="btn-acc" onClick={handleStart}>
        {mode === 'scorer' ? 'Lancer le scoreur' : mode === 'player' ? 'Lancer le match' : 'Commencer'}
      </button>

      {/* ── Historique récent ── */}
      {recentHistory.length > 0 && (
        <section className="setup-section">
          <div className="history-head">
            <div className="section-title">Matchs récents</div>
            <button className="btn-mini" onClick={onViewHistory}>Voir tout →</button>
          </div>
          <div className="history-list">
            {recentHistory.map(m => (
              <div className="history-item" key={m.id}>
                <div className="history-date">{fmtDateTime(m.playedAt)}</div>
                <div className="history-score">
                  {m.teams.map((t, i) => (
                    <span key={i}>
                      {i > 0 && <span style={{ color: 'var(--dim)', fontWeight: 200 }}> – </span>}
                      <span style={{ color: m.settings?.teamColors?.[i] || 'var(--txt)' }}>{t.name} {t.score}</span>
                    </span>
                  ))}
                </div>
                <div className="history-meta">
                  {m.settings?.halfCount}×{m.settings?.halfDurationMin}min · {m.teams[0]?.tirs ?? 0} tirs
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
