import { useEffect, useRef, useState } from 'react'

function fmtDateTime(iso) {
  try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
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

export default function Setup({ numTeams, setNumTeams, onStart, defaultSettings, history, onViewHistory }) {
  const [mode, setMode] = useState('stats') // 'stats' | 'scorer'
  const [name1, setName1] = useState('')
  const [name2, setName2] = useState('')
  const [color1, setColor1] = useState(defaultSettings?.teamColors?.[0] || '#5de8d6')
  const [color2, setColor2] = useState(defaultSettings?.teamColors?.[1] || '#ff7272')
  const [logo1, setLogo1] = useState(null)
  const [logo2, setLogo2] = useState(null)
  const [halfDurationMin, setHalfDurationMin] = useState(defaultSettings?.halfDurationMin || 12)
  const [halfCount, setHalfCount] = useState(defaultSettings?.halfCount || 2)

  useEffect(() => {
    if (numTeams !== 2) setNumTeams(2)
  }, [numTeams, setNumTeams])

  function handleStart() {
    const effectiveNumTeams = 2
    const n1 = name1.trim() || 'Équipe 1'
    const names = [n1]
    if (effectiveNumTeams === 2) names.push(name2.trim() || 'Équipe 2')

    if (numTeams !== 2) {
      setNumTeams(2)
    }

    onStart({
      names,
      mode,
      logos: [logo1, logo2],
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

  const recentHistory = (history || []).slice(0, 3)

  return (
    <>
      <h1>Tchoukball Assistant</h1>

      {/* Mode selector */}
      <section className="setup-section">
        <div className="section-title">Mode</div>
        <div className="seg mode-seg">
          <button className={mode === 'stats' ? 'on' : ''} onClick={() => setMode('stats')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            Feuille de stats
          </button>
          <button className={mode === 'scorer' ? 'on' : ''} onClick={() => setMode('scorer')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            Scoreur
          </button>
        </div>
      </section>

      {/* Teams */}
      <section className="setup-section">
        <div className="section-title">Configuration des équipes</div>

        <div className="flabel" style={{ marginBottom: 10 }}>
          Format fixe: 2 équipes
        </div>

        <div className="team-rows">
          {/* Team 1 */}
          <div className="team-row">
            {mode === 'scorer' && (
              <LogoUpload label="Équipe 1" logo={logo1} onChange={setLogo1} color={color1} />
            )}
            <div className="team-row-fields">
              <div className="field">
                <div className="flabel">Équipe 1</div>
                <input type="text" placeholder="Nom" value={name1} onChange={e => setName1(e.target.value)} onKeyDown={handleKey} autoFocus />
              </div>
              <div className="field" style={{ maxWidth: 80 }}>
                <div className="flabel">Couleur</div>
                <input className="color-in" type="color" value={color1} onChange={e => setColor1(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Team 2 */}
          {numTeams === 2 && (
            <div className="team-row">
              {mode === 'scorer' && (
                <LogoUpload label="Équipe 2" logo={logo2} onChange={setLogo2} color={color2} />
              )}
              <div className="team-row-fields">
                <div className="field">
                  <div className="flabel">Équipe 2</div>
                  <input type="text" placeholder="Nom" value={name2} onChange={e => setName2(e.target.value)} onKeyDown={handleKey} />
                </div>
                <div className="field" style={{ maxWidth: 80 }}>
                  <div className="flabel">Couleur</div>
                  <input className="color-in" type="color" value={color2} onChange={e => setColor2(e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Half config */}
      <section className="setup-section">
        <div className="section-title">Configuration des mi-temps</div>
        <div className="opts-grid">
          <div className="field">
            <div className="flabel">Durée d'une mi-temps (min)</div>
            <input type="number" min={1} max={60} value={halfDurationMin} onChange={e => setHalfDurationMin(e.target.value)} />
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
        {mode === 'scorer' ? 'Lancer le scoreur' : 'Commencer'}
      </button>

      {/* Match history preview */}
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
                <div className="history-meta">{m.settings?.halfCount}×{m.settings?.halfDurationMin}min · {m.teams[0]?.tirs ?? 0} tirs</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
