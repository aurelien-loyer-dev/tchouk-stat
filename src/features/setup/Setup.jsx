import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mkPlayer } from '../../lib/playerStats'
import LanguageToggle from '../../i18n/LanguageToggle'
import MatchCard from '../../components/MatchCard'
import { loadComposFromStorage, saveComposToStorage } from './compoStorage'
import LogoUpload from './components/LogoUpload'
import PlayerNamesCol from './components/PlayerNamesCol'
import './setup.css'

export default function Setup({ numTeams, setNumTeams, onStart, defaultSettings, history, onViewHistory, onOpenMatch, onViewTournament }) {
  const { t } = useTranslation()
  const [step, setStep]   = useState('home') // 'home' | 'stats-choice' | 'form'
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

  const n1Label = name1.trim() || t('setup.defaultTeam1')
  const n2Label = name2.trim() || t('setup.defaultTeam2')

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
      if (!allPlayers.some(p => p.teamIdx === 0)) allPlayers.unshift(mkPlayer(t('setup.defaultPlayerName'), 0))
      if (playerNumTeams === 2 && !allPlayers.some(p => p.teamIdx === 1)) allPlayers.push(mkPlayer(t('setup.defaultPlayerName'), 1))

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

  function chooseScorer()      { setMode('scorer'); setStep('form') }
  function chooseStatsHome()   { setStep('stats-choice') }
  function chooseStatsSheet()  { setMode('stats');  setStep('form') }
  function chooseStatsPlayers(){ setMode('player'); setStep('form') }
  function backToHome()        { setStep('home') }
  function backFromForm()      { setStep(mode === 'scorer' ? 'home' : 'stats-choice') }

  const recentHistory = (history || []).slice(0, 3)

  return (
    <>
      {/* ── Accueil : 3 choix ── */}
      {step === 'home' && (
        <>
          <div className="setup-head">
            <h1>{t('setup.appTitle')}</h1>
            <LanguageToggle className="btn-mini" style={{ marginLeft: 'auto' }} />
          </div>

          <section className="setup-section">
            <div className="home-choices">
              <button className="home-card" onClick={chooseStatsHome}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                <span className="home-card-label">{t('setup.home.statsLabel')}</span>
                <span className="home-card-desc">{t('setup.home.statsDesc')}</span>
              </button>
              <button className="home-card" onClick={chooseScorer}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                <span className="home-card-label">{t('setup.home.scorerLabel')}</span>
                <span className="home-card-desc">{t('setup.home.scorerDesc')}</span>
              </button>
              <button className="home-card" onClick={onViewTournament}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
                  <path d="M8 20h8" />
                  <path d="M12 12v5" />
                  <path d="M9 20h6" />
                  <path d="M6 6H4a2 2 0 0 0 2 2" />
                  <path d="M18 6h2a2 2 0 0 1-2 2" />
                </svg>
                <span className="home-card-label">{t('setup.home.tournamentLabel')}</span>
                <span className="home-card-desc">{t('setup.home.tournamentDesc')}</span>
              </button>
            </div>
          </section>
        </>
      )}

      {/* ── Sous-choix Stats : feuille de stats ou joueurs ── */}
      {step === 'stats-choice' && (
        <>
          <div className="setup-head">
            <button className="btn-mini" onClick={backToHome}>{t('common.back')}</button>
            <h1>{t('setup.statsChoice.title')}</h1>
          </div>

          <section className="setup-section">
            <div className="section-title">{t('setup.statsChoice.question')}</div>
            <div className="home-choices home-choices-2">
              <button className="home-card" onClick={chooseStatsSheet}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                <span className="home-card-label">{t('setup.statsChoice.sheetLabel')}</span>
                <span className="home-card-desc">{t('setup.statsChoice.sheetDesc')}</span>
              </button>
              <button className="home-card" onClick={chooseStatsPlayers}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="7" r="4" />
                  <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
                </svg>
                <span className="home-card-label">{t('setup.statsChoice.playersLabel')}</span>
                <span className="home-card-desc">{t('setup.statsChoice.playersDesc')}</span>
              </button>
            </div>
          </section>
        </>
      )}

      {step === 'form' && (
      <div className="setup-head">
        <button className="btn-mini" onClick={backFromForm}>{t('common.back')}</button>
        <h1>{mode === 'scorer' ? t('setup.formTitle.scorer') : mode === 'player' ? t('setup.formTitle.player') : t('setup.formTitle.stats')}</h1>
      </div>
      )}

      {/* ── Équipes (stats & scorer) ── */}
      {step === 'form' && mode !== 'player' && (
        <section className="setup-section">
          <div className="section-title">{t('setup.teamsSection')}</div>
          <div className="flabel" style={{ marginBottom: 10 }}>{t('setup.fixedFormat')}</div>
          <div className="team-rows">
            {/* Équipe 1 */}
            <div className="team-row">
              {mode === 'scorer' && <LogoUpload label={t('setup.team1')} logo={logo1} onChange={setLogo1} color={color1} />}
              <div className="team-row-fields">
                <div className="field">
                  <div className="flabel">{t('setup.team1')}</div>
                  <input type="text" placeholder={t('setup.namePlaceholder')} value={name1}
                         onChange={e => setName1(e.target.value)} onKeyDown={handleKey} autoFocus />
                </div>
                <div className="field" style={{ maxWidth: 80 }}>
                  <div className="flabel">{t('setup.color')}</div>
                  <input className="color-in" type="color" value={color1} onChange={e => setColor1(e.target.value)} />
                </div>
              </div>
            </div>
            {/* Équipe 2 */}
            <div className="team-row">
              {mode === 'scorer' && <LogoUpload label={t('setup.team2')} logo={logo2} onChange={setLogo2} color={color2} />}
              <div className="team-row-fields">
                <div className="field">
                  <div className="flabel">{t('setup.team2')}</div>
                  <input type="text" placeholder={t('setup.namePlaceholder')} value={name2}
                         onChange={e => setName2(e.target.value)} onKeyDown={handleKey} />
                </div>
                <div className="field" style={{ maxWidth: 80 }}>
                  <div className="flabel">{t('setup.color')}</div>
                  <input className="color-in" type="color" value={color2} onChange={e => setColor2(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Mode joueurs : noms des équipes + joueurs ── */}
      {step === 'form' && mode === 'player' && (
        <section className="setup-section">
          <div className="section-title">{t('setup.teamsPlayersSection')}</div>

          {/* Nombre d'équipes */}
          <div className="seg" style={{ maxWidth: 280 }}>
            <button className={playerNumTeams === 1 ? 'on' : ''} onClick={() => setPlayerNumTeams(1)}>
              {t('setup.oneTeam')}
            </button>
            <button className={playerNumTeams === 2 ? 'on' : ''} onClick={() => setPlayerNumTeams(2)}>
              {t('setup.twoTeams')}
            </button>
          </div>

          {/* Noms + couleurs des équipes */}
          <div className={`ps-teams-row${playerNumTeams === 1 ? ' ps-single' : ''}`}>
            <div className="ps-team-name-field">
              <div className="flabel">{t('setup.team1')}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="text" placeholder={t('setup.team1NamePlaceholder')} value={name1}
                       onChange={e => setName1(e.target.value)} autoFocus />
                <input className="color-in" type="color" value={color1}
                       onChange={e => setColor1(e.target.value)} style={{ width: 44, flexShrink: 0 }} />
              </div>
            </div>
            {playerNumTeams === 2 && (
              <div className="ps-team-name-field">
                <div className="flabel">{t('setup.team2')}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="text" placeholder={t('setup.team2NamePlaceholder')} value={name2}
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

      {step === 'form' && (
        <>
          {/* ── Mi-temps ── */}
          <section className="setup-section">
            <div className="section-title">{t('setup.halvesSection')}</div>
            <div className="opts-grid">
              <div className="field">
                <div className="flabel">{t('setup.halfDuration')}</div>
                <input type="number" min={1} max={60} value={halfDurationMin}
                       onChange={e => setHalfDurationMin(e.target.value)} />
              </div>
              <div className="field">
                <div className="flabel">{t('setup.halfCount')}</div>
                <select className="sel" value={halfCount} onChange={e => setHalfCount(e.target.value)}>
                  {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </section>

          <div className="setup-actions">
            <button className="btn-acc setup-start-btn" onClick={handleStart}>
              {mode === 'scorer' ? t('setup.startScorer') : mode === 'player' ? t('setup.startPlayerMatch') : t('setup.start')}
            </button>
          </div>
        </>
      )}

      {/* ── Historique récent ── */}
      {step === 'home' && recentHistory.length > 0 && (
        <section className="setup-section">
          <div className="history-head">
            <div className="section-title">{t('setup.recentMatches')}</div>
            <button className="btn-mini" onClick={onViewHistory}>{t('setup.viewAll')}</button>
          </div>
          <div className="mr-list">
            {recentHistory.map(m => (
              <MatchCard key={m.id} match={m} onClick={onOpenMatch} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
