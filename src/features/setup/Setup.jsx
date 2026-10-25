import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mkPlayer } from '../../lib/playerStats'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import Court from '../../components/Court'
import MatchCard from '../../components/MatchCard'
import { loadComposFromStorage, saveComposToStorage } from './compoStorage'
import LogoUpload from './components/LogoUpload'
import PlayerNamesCol from './components/PlayerNamesCol'
import './setup.css'

function Tile({ label, desc, onClick }) {
  return (
    <button className="tile" onClick={onClick}>
      <span className="tile-label">{label}</span>
      <span className="tile-desc">{desc}</span>
      <Icon name="chevron" size={20} className="tile-chev" />
    </button>
  )
}

export default function Setup({ numTeams, setNumTeams, onStart, defaultSettings, history, onViewHistory, onOpenMatch, onViewTournament, tournamentCount }) {
  const { t } = useTranslation()
  const [step, setStep]   = useState('home') // 'home' | 'form'
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

  function choose(nextMode) { setMode(nextMode); setStep('form') }
  function backToHome()      { setStep('home') }

  const recentHistory = (history || []).slice(0, 3)

  const startChoices = [
    { mode: 'stats',  label: t('setup.statsChoice.sheetLabel'),   desc: t('setup.statsChoice.sheetDesc') },
    { mode: 'player', label: t('setup.statsChoice.playersLabel'), desc: t('setup.statsChoice.playersDesc') },
    { mode: 'scorer', label: t('setup.home.scorerLabel'),         desc: t('setup.home.scorerDesc') },
  ]

  const formTitle = mode === 'scorer' ? t('setup.formTitle.scorer') : mode === 'player' ? t('setup.formTitle.player') : t('setup.formTitle.stats')

  return (
    <>
      {/* ── Accueil : choix directs ── */}
      {step === 'home' && (
        <div className="home">
          <section className="hero">
            <div className="hero-main">
              <h1>{t('setup.home.heroTitle')}</h1>
              <p>{t('setup.home.heroSub')}</p>
              <dl className="hero-stats">
                <div>
                  <dt>{(history || []).length}</dt>
                  <dd>{t('setup.home.statMatches')}</dd>
                </div>
                <div>
                  <dt>{tournamentCount || 0}</dt>
                  <dd>{t('setup.home.statTournaments')}</dd>
                </div>
              </dl>
            </div>
            <div className="hero-art" aria-hidden="true">
              <Court className="hero-court" />
            </div>
          </section>

          <section className="sec">
            <h2 className="sec-title">{t('setup.home.startTitle')}</h2>
            <div className="tiles tiles-3">
              {startChoices.map(c => (
                <Tile key={c.mode} label={c.label} desc={c.desc} onClick={() => choose(c.mode)} />
              ))}
            </div>
          </section>

          <section className="sec">
            <h2 className="sec-title">{t('setup.home.competitionTitle')}</h2>
            <div className="tiles tiles-2">
              <Tile label={t('setup.home.tournamentLabel')} desc={t('setup.home.tournamentDesc')} onClick={onViewTournament} />
              <Tile label={t('setup.home.historyLabel')} desc={t('setup.home.historyDesc')} onClick={onViewHistory} />
            </div>
          </section>

          {recentHistory.length > 0 && (
            <section className="sec">
              <h2 className="sec-title">
                {t('setup.recentMatches')}
                <button className="btn-link" onClick={onViewHistory}>
                  {t('setup.viewAll')}<Icon name="chevron" size={16} />
                </button>
              </h2>
              <div className="mc-grid">
                {recentHistory.map(m => (
                  <MatchCard key={m.id} match={m} onClick={onOpenMatch} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {step === 'form' && (
        <div className="setup-form">
          <PageHeader title={formTitle} onBack={backToHome} />

          {/* ── Équipes (stats & scorer) ── */}
          {mode !== 'player' && (
            <section className="sec">
              <h2 className="sec-title">{t('setup.teamsSection')}</h2>
              <div className="team-rows">
                {[
                  { label: t('setup.team1'), name: name1, setName: setName1, color: color1, setColor: setColor1, logo: logo1, setLogo: setLogo1 },
                  { label: t('setup.team2'), name: name2, setName: setName2, color: color2, setColor: setColor2, logo: logo2, setLogo: setLogo2 },
                ].map((tm, i) => (
                  <div className="team-row" key={i}>
                    {mode === 'scorer' && <LogoUpload label={tm.label} logo={tm.logo} onChange={tm.setLogo} color={tm.color} />}
                    <label className="field">
                      <span className="flabel">{tm.label}</span>
                      <input type="text" placeholder={t('setup.namePlaceholder')} value={tm.name}
                             onChange={e => tm.setName(e.target.value)} onKeyDown={handleKey} autoFocus={i === 0} />
                    </label>
                    <label className="field field-color">
                      <span className="flabel">{t('setup.color')}</span>
                      <input className="color-in" type="color" value={tm.color} onChange={e => tm.setColor(e.target.value)} />
                    </label>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Mode joueurs : noms des équipes + joueurs ── */}
          {mode === 'player' && (
            <section className="sec">
              <h2 className="sec-title">{t('setup.teamsPlayersSection')}</h2>

              <div className="seg seg-inline">
                <button className={playerNumTeams === 1 ? 'on' : ''} onClick={() => setPlayerNumTeams(1)}>
                  {t('setup.oneTeam')}
                </button>
                <button className={playerNumTeams === 2 ? 'on' : ''} onClick={() => setPlayerNumTeams(2)}>
                  {t('setup.twoTeams')}
                </button>
              </div>

              <div className={`ps-players-grid${playerNumTeams === 1 ? ' ps-single' : ''}`}>
                <div className="ps-team">
                  <div className="team-row">
                    <label className="field">
                      <span className="flabel">{t('setup.team1')}</span>
                      <input type="text" placeholder={t('setup.team1NamePlaceholder')} value={name1}
                             onChange={e => setName1(e.target.value)} autoFocus />
                    </label>
                    <label className="field field-color">
                      <span className="flabel">{t('setup.color')}</span>
                      <input className="color-in" type="color" value={color1} onChange={e => setColor1(e.target.value)} />
                    </label>
                  </div>
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
                </div>
                {playerNumTeams === 2 && (
                  <div className="ps-team">
                    <div className="team-row">
                      <label className="field">
                        <span className="flabel">{t('setup.team2')}</span>
                        <input type="text" placeholder={t('setup.team2NamePlaceholder')} value={name2}
                               onChange={e => setName2(e.target.value)} />
                      </label>
                      <label className="field field-color">
                        <span className="flabel">{t('setup.color')}</span>
                        <input className="color-in" type="color" value={color2} onChange={e => setColor2(e.target.value)} />
                      </label>
                    </div>
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
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Mi-temps ── */}
          <section className="sec">
            <h2 className="sec-title">{t('setup.halvesSection')}</h2>
            <div className="opts-grid">
              <label className="field">
                <span className="flabel">{t('setup.halfDuration')}</span>
                <input type="number" min={1} max={60} value={halfDurationMin}
                       onChange={e => setHalfDurationMin(e.target.value)} />
              </label>
              <label className="field">
                <span className="flabel">{t('setup.halfCount')}</span>
                <select className="sel" value={halfCount} onChange={e => setHalfCount(e.target.value)}>
                  {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            </div>
          </section>

          <div className="setup-actions">
            <button className="btn-acc setup-start-btn" onClick={handleStart}>
              {mode === 'scorer' ? t('setup.startScorer') : mode === 'player' ? t('setup.startPlayerMatch') : t('setup.start')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
