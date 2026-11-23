import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { mkPlayer } from '../../lib/playerStats'
import { DRAW_KEY, LEVELS, drawTeams, parsePeopleList } from '../../lib/teamDraw'
import { navigate } from '../../lib/router'
import './teamDraw.css'

const STORAGE_KEY = DRAW_KEY
const TEAM_COLORS = ['blue', 'red', 'green', 'yellow', 'violet', 'orange', 'aqua', 'magenta']

const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()))

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (s && Array.isArray(s.people)) return s
  } catch {}
  return null
}

export default function TeamDraw({ onBack, onStartMatch }) {
  const { t } = useTranslation()
  const saved = useMemo(loadState, [])
  const [people, setPeople]           = useState(saved?.people || [])
  const [teamCount, setTeamCount]     = useState(saved?.teamCount || 2)
  const [mixity, setMixity]           = useState(saved?.mixity ?? true)
  const [balanceLevel, setBalanceLvl] = useState(saved?.balanceLevel ?? true)
  const [teams, setTeams]             = useState(saved?.teams || null)
  const [teamNames, setTeamNames]     = useState(saved?.teamNames || [])
  const [paste, setPaste]             = useState('')
  const [newName, setNewName]         = useState('')
  const [copied, setCopied]           = useState(false)
  const [drawId, setDrawId]           = useState(0)
  const pasteRef   = useRef(null)
  const resultsRef = useRef(null)

  useEffect(() => {
    if (drawId) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [drawId])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ people, teamCount, mixity, balanceLevel, teams, teamNames })) }
    catch {}
  }, [people, teamCount, mixity, balanceLevel, teams, teamNames])

  const girls     = people.filter(p => p.gender === 'f').length
  const boys      = people.filter(p => p.gender === 'm').length
  const unknown   = people.length - girls - boys
  const maxTeams  = Math.max(2, Math.min(8, people.length))
  const count     = Math.min(teamCount, maxTeams)
  const canDraw   = people.length >= 2

  function addPeople(list) {
    if (!list.length) return
    setPeople(prev => [...prev, ...list.map(p => ({ id: newId(), ...p }))])
  }

  function addFromPaste() {
    addPeople(parsePeopleList(paste))
    setPaste('')
    if (pasteRef.current) pasteRef.current.open = false
  }

  function addOne(e) {
    e.preventDefault()
    const name = newName.trim().replace(/\s+/g, ' ')
    if (!name) return
    addPeople([{ name, gender: null, level: 2 }])
    setNewName('')
  }

  function update(id, fields) {
    setPeople(prev => prev.map(p => (p.id === id ? { ...p, ...fields } : p)))
  }

  function remove(id) {
    setPeople(prev => prev.filter(p => p.id !== id))
  }

  function clearAll() {
    if (!window.confirm(t('teamDraw.clearConfirm'))) return
    setPeople([])
    setTeams(null)
  }

  function draw() {
    if (!canDraw) return
    setTeams(drawTeams(people, count, { mixity, balanceLevel }))
    setCopied(false)
    setDrawId(n => n + 1)
  }

  const defaultLabel = i => t('teamDraw.teamN', { n: i + 1 })
  const teamLabel = i => teamNames[i]?.trim() || defaultLabel(i)
  const renameTeam = (i, value) => setTeamNames(prev => { const next = [...prev]; next[i] = value; return next })
  const levelLabel = lvl => t(`teamDraw.levels.${lvl}`)

  async function copy() {
    const text = teams.map((tm, i) =>
      `${teamLabel(i)}\n${tm.members.map(m => `- ${m.name}`).join('\n')}`
    ).join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  function startMatch() {
    const players = teams.flatMap((tm, i) => tm.members.map(m => mkPlayer(m.name, i)))
    onStartMatch({
      names: [teamLabel(0), teamLabel(1)],
      mode: 'player',
      playerNumTeams: 2,
      players,
    })
  }

  const notEnoughGirls = mixity && girls > 0 && girls < count
  const noGirls        = mixity && girls === 0 && people.length > 0

  return (
    <div className="td">
      <PageHeader title={t('teamDraw.title')} subtitle={t('teamDraw.subtitle')} onBack={onBack} />

      {/* ── Ajout ── */}
      <section className="sec">
        <h2 className="sec-title">{t('teamDraw.addTitle')}</h2>
        <form className="td-add" onSubmit={addOne}>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                 placeholder={t('teamDraw.namePlaceholder')} aria-label={t('teamDraw.namePlaceholder')} />
          <button type="submit" className="btn-ghost" disabled={!newName.trim()}>
            <Icon name="plus" size={18} />{t('teamDraw.add')}
          </button>
        </form>
        <details className="td-paste" ref={pasteRef}>
          <summary>{t('teamDraw.pasteToggle')}</summary>
          <textarea rows={6} value={paste} onChange={e => setPaste(e.target.value)}
                    placeholder={t('teamDraw.pastePlaceholder')} />
          <p className="td-hint">{t('teamDraw.pasteHint')}</p>
          <button type="button" className="btn-ghost" onClick={addFromPaste} disabled={!paste.trim()}>
            {t('teamDraw.pasteAdd')}
          </button>
        </details>
      </section>

      {/* ── Liste ── */}
      <section className="sec">
        <h2 className="sec-title">
          <span>
            {t('teamDraw.listTitle', { count: people.length })}
            {people.length > 0 && (
              <span className="td-counts">
                {' · '}{t('teamDraw.girlsCount', { count: girls })}
                {' · '}{t('teamDraw.boysCount', { count: boys })}
                {unknown > 0 && <>{' · '}{t('teamDraw.unknownCount', { count: unknown })}</>}
              </span>
            )}
          </span>
          {people.length > 0 && <button className="btn-link td-clear" onClick={clearAll}>{t('teamDraw.clear')}</button>}
        </h2>

        {people.length === 0 ? (
          <p className="td-empty">{t('teamDraw.empty')}</p>
        ) : (
          <ul className="td-list">
            {people.map(p => (
              <li key={p.id} className={`td-row${p.gender ? '' : ' td-row-missing'}`}>
                <input type="text" className="td-name" value={p.name} aria-label={t('teamDraw.namePlaceholder')}
                       onChange={e => update(p.id, { name: e.target.value })} />
                <div className="seg td-seg" role="group" aria-label={t('teamDraw.gender')}>
                  <button className={p.gender === 'f' ? 'on' : ''} aria-pressed={p.gender === 'f'}
                          onClick={() => update(p.id, { gender: p.gender === 'f' ? null : 'f' })}>{t('teamDraw.girl')}</button>
                  <button className={p.gender === 'm' ? 'on' : ''} aria-pressed={p.gender === 'm'}
                          onClick={() => update(p.id, { gender: p.gender === 'm' ? null : 'm' })}>{t('teamDraw.boy')}</button>
                </div>
                <div className="seg td-seg td-seg-lvl" role="group" aria-label={t('teamDraw.level')}>
                  {LEVELS.map(lvl => (
                    <button key={lvl} className={p.level === lvl ? 'on' : ''} aria-pressed={p.level === lvl}
                            title={levelLabel(lvl)} onClick={() => update(p.id, { level: lvl })}>
                      <span className="td-lvl-long">{levelLabel(lvl)}</span>
                      <span className="td-lvl-short">{t(`teamDraw.levelsShort.${lvl}`)}</span>
                    </button>
                  ))}
                </div>
                <button className="icon-btn danger" onClick={() => remove(p.id)}
                        title={t('common.remove')} aria-label={t('common.remove')}>
                  <Icon name="close" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Tirage ── */}
      <section className="sec">
        <h2 className="sec-title">{t('teamDraw.drawTitle')}</h2>
        <div className="td-opts">
          <div className="field td-count">
            <span className="flabel">{t('teamDraw.teamCount')}</span>
            <div className="td-stepper">
              <button className="icon-btn" onClick={() => setTeamCount(Math.max(2, count - 1))} disabled={count <= 2}
                      aria-label={t('teamDraw.fewer')}><Icon name="minus" size={18} /></button>
              <span className="td-stepper-val">{count}</span>
              <button className="icon-btn" onClick={() => setTeamCount(Math.min(maxTeams, count + 1))} disabled={count >= maxTeams}
                      aria-label={t('teamDraw.more')}><Icon name="plus" size={18} /></button>
            </div>
            {people.length >= count && (
              <span className="td-hint">{people.length % count === 0
                ? t('teamDraw.perTeamExact', { n: people.length / count })
                : t('teamDraw.perTeam', { min: Math.floor(people.length / count), max: Math.ceil(people.length / count) })}</span>
            )}
          </div>
          <div className="td-checks">
            <label className="td-check">
              <input type="checkbox" checked={mixity} onChange={e => setMixity(e.target.checked)} />
              <span>
                <strong>{t('teamDraw.mixity')}</strong>
                <span className="td-hint">{t('teamDraw.mixityHint')}</span>
              </span>
            </label>
            <label className="td-check">
              <input type="checkbox" checked={balanceLevel} onChange={e => setBalanceLvl(e.target.checked)} />
              <span>
                <strong>{t('teamDraw.balanceLevel')}</strong>
                <span className="td-hint">{t('teamDraw.balanceLevelHint')}</span>
              </span>
            </label>
          </div>
        </div>

        {notEnoughGirls && <p className="td-warn">{t('teamDraw.notEnoughGirls', { girls, teams: count })}</p>}
        {noGirls && <p className="td-warn">{t('teamDraw.noGirls')}</p>}

        <div className="td-actions">
          <button className="btn-acc td-draw-btn" onClick={draw} disabled={!canDraw}>
            {teams ? t('teamDraw.redraw') : t('teamDraw.draw')}
          </button>
        </div>
      </section>

      {/* ── Résultat ── */}
      {teams && (
        <section className="sec td-results" ref={resultsRef}>
          <h2 className="sec-title">
            {t('teamDraw.resultTitle')}
            <span className="td-res-actions">
              <button className="btn-mini" onClick={copy}>{copied ? t('teamDraw.copied') : t('teamDraw.copy')}</button>
              {teams.length === 2 && (
                <button className="btn-mini" onClick={startMatch}>{t('teamDraw.startMatch')}</button>
              )}
              <button className="btn-mini td-to-trn" onClick={() => navigate('/tournaments/new?from=draw')}>
                <Icon name="trophy" size={16} />{t('teamDraw.toTournament')}
              </button>
            </span>
          </h2>
          <div className="td-teams">
            {teams.map((tm, i) => {
              const tGirls = tm.members.filter(m => m.gender === 'f').length
              return (
                <article key={i} className={`td-team stat-${TEAM_COLORS[i % TEAM_COLORS.length]}`}>
                  <header className="td-team-hd">
                    <span className="td-team-dot" />
                    <input className="td-team-name" type="text" value={teamNames[i] ?? ''} placeholder={defaultLabel(i)}
                           maxLength={40} aria-label={t('teamDraw.teamNameLabel', { n: i + 1 })}
                           onChange={e => renameTeam(i, e.target.value)} />
                    <span className="td-team-meta">
                      {t('teamDraw.playersCount', { count: tm.members.length })}
                      {mixity && <> · {t('teamDraw.girlsCount', { count: tGirls })}</>}
                      {balanceLevel && <> · {t('teamDraw.levelSum', { n: tm.members.reduce((s, m) => s + m.level, 0) })}</>}
                    </span>
                  </header>
                  <ul className="td-members">
                    {tm.members.map(m => (
                      <li key={m.id}>
                        <span className="td-m-name">{m.name}</span>
                        {m.gender === 'f' && <span className="td-tag">{t('teamDraw.girlShort')}</span>}
                        {balanceLevel && <span className={`td-lvl td-lvl-${m.level}`}>{levelLabel(m.level)}</span>}
                      </li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
