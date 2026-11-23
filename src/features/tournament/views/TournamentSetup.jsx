import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../../i18n'
import { mkTournament } from '../../../lib/tournament'
import { KNOCKOUT_OPTIONS } from '../constants'
import PageHeader from '../../../components/PageHeader'
import Icon from '../../../components/Icon'
import { Link } from '../../../lib/router'
import { loadDrawnTeams } from '../../../lib/teamDraw'
import { DEFAULT_SCHEDULE, estimateSchedule, fmtHour, listFixtures, matchMinutes, planCourts } from '../overview'

// Prochain quart d'heure, au format HH:MM.
function nextQuarter() {
  const d = new Date(Date.now() + 15 * 60000)
  d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// « 14:30 » → aujourd'hui à 14 h 30 (ISO).
function timeToday(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map(Number)
  const d = new Date()
  d.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0)
  return d.toISOString()
}

export default function TournamentSetup({ onStart, onCancel }) {
  const { t } = useTranslation()
  const [name, setName]               = useState('')
  const [format, setFormat]           = useState('roundrobin')
  const [teamInput, setTeamInput]     = useState('')
  const [teams, setTeams]             = useState([])
  const [numGroups, setNumGroups]     = useState(2)
  const [knockoutSize, setKoSize]     = useState(null)
  const [swissRounds, setSwissRounds] = useState(5)
  const [fullPlacement, setFull]      = useState(false)
  const [rosters, setRosters]         = useState({}) // nom d'équipe → joueurs
  const [courtCount, setCourtCount]   = useState(1)
  const [doubleRound, setDoubleRound] = useState(false)
  const [useTimes, setUseTimes]       = useState(true)
  const [startTime, setStartTime]     = useState(nextQuarter)
  const [sched, setSched]             = useState(DEFAULT_SCHEDULE)
  const setSchedField = (k, v) => setSched(s => ({ ...s, [k]: v }))
  const [imported, setImported]       = useState(false)

  const drawn = loadDrawnTeams(i => t('teamDraw.teamN', { n: i + 1 }))

  function importDraw() {
    if (!drawn) return
    const names = drawn.map(d => d.name)
    setTeams(prev => [...prev.filter(n => !names.includes(n)), ...names])
    setRosters(prev => ({ ...prev, ...Object.fromEntries(drawn.map(d => [d.name, d.players])) }))
    setImported(true)
  }

  // Arrivée depuis « Créer un tournoi avec ces équipes » : import direct.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('from') === 'draw') importDraw()
  }, [])

  function addTeam() {
    const name = teamInput.trim()
    if (name && !teams.includes(name)) { setTeams(p => [...p, name]); setTeamInput('') }
  }

  function build() {
    const n = name.trim() || t('tournament.setup.defaultName', { date: new Date().toLocaleDateString(i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR') })
    const schedule = useTimes ? {
      startAt: timeToday(startTime),
      halves: Math.max(1, Number(sched.halves) || 1),
      halfMin: Math.max(1, Number(sched.halfMin) || 1),
      halfBreakMin: Math.max(0, Number(sched.halfBreakMin) || 0),
      changeMin: Math.max(0, Number(sched.changeMin) || 0),
    } : null
    return {
      ...mkTournament({
        name: n, format, teams,
        numGroups: Number(numGroups),
        knockoutSize: fullPlacement ? null : knockoutSize,
        fullPlacement: format === 'groups' ? fullPlacement : false,
        numSwissRounds: Number(swissRounds),
        doubleRound: format !== 'swiss' && doubleRound,
      }),
      courtCount: Math.max(1, Number(courtCount) || 1),
      schedule,
      rosters: Object.fromEntries(teams.filter(tm => rosters[tm]?.length).map(tm => [tm, rosters[tm]])),
    }
  }

  function handleStart() {
    if (teams.length < 2) return
    onStart(build())
  }

  // Aperçu : nombre de matchs et heure de fin, avec les réglages en cours.
  const preview = useMemo(() => {
    if (teams.length < 2) return null
    const tour = build()
    const fixtures = listFixtures(tour)
    const est = tour.schedule ? estimateSchedule(tour, planCourts(tour, fixtures), Date.parse(tour.schedule.startAt)) : null
    return { matches: fixtures.length, endAt: est?.endAt ?? null }
  }, [teams, format, numGroups, knockoutSize, fullPlacement, swissRounds, doubleRound, courtCount, useTimes, startTime, sched])

  const showKo = (format === 'roundrobin' || format === 'groups') && !fullPlacement

  return (
    <>
      <div className="trn-setup">
        <PageHeader title={t('tournament.setup.title')} onBack={onCancel} backLabel={t('tournament.setup.cancel')} />

        <div className="trn-field">
 <label className="flabel" htmlFor="trn-name">{t('tournament.setup.nameLabel')}</label>
          <input id="trn-name" type="text" placeholder={t('tournament.setup.namePlaceholder')} value={name}
            onChange={e => setName(e.target.value)} autoFocus />
        </div>

        <div className="trn-field">
          <div className="flabel">{t('tournament.setup.formatLabelField')}</div>
          <div className="seg">
            <button className={format === 'roundrobin' ? 'on' : ''} onClick={() => setFormat('roundrobin')}>{t('tournament.formatLabel.roundrobin')}</button>
            <button className={format === 'groups' ? 'on' : ''} onClick={() => setFormat('groups')}>{t('tournament.formatLabel.groups')}</button>
            <button className={format === 'swiss' ? 'on' : ''} onClick={() => setFormat('swiss')}>{t('tournament.formatLabel.swiss')}</button>
          </div>
        </div>

        {format === 'groups' && (
          <div className="trn-field">
            <div className="flabel">{t('tournament.setup.groupsCountLabel')}</div>
            <select className="sel" value={numGroups} onChange={e => { setNumGroups(e.target.value); setFull(false) }}>
              {[2, 3, 4, 6, 8].map(n => <option key={n} value={n}>{t('tournament.setup.groupsOption', { n })}</option>)}
            </select>
          </div>
        )}

        {format === 'groups' && (
          <label className="trn-toggle">
            <input type="checkbox" checked={fullPlacement} onChange={e => { setFull(e.target.checked); if (e.target.checked) setKoSize(null) }} />
            <span className="trn-toggle-track"><span className="trn-toggle-thumb" /></span>
            <span>{t('tournament.setup.fullPlacementLabel')}</span>
          </label>
        )}

        {format === 'swiss' && (
          <div className="trn-field">
            <label className="flabel" htmlFor="trn-swiss">{t('tournament.setup.swissRoundsLabel')}</label>
            <input id="trn-swiss" type="number" min="2" max="15" value={swissRounds}
              onChange={e => setSwissRounds(e.target.value)} />
          </div>
        )}

        {showKo && (
          <div className="trn-field">
            <div className="flabel">{t('tournament.setup.knockoutOptional')}</div>
            <select className="sel" value={knockoutSize === null ? 'null' : String(knockoutSize)}
              onChange={e => setKoSize(e.target.value === 'null' ? null : Number(e.target.value))}>
              {KNOCKOUT_OPTIONS.map(o => (
                <option key={String(o.value)} value={String(o.value)}>{t(o.labelKey)}</option>
              ))}
            </select>
          </div>
        )}

        <div className="trn-field">
          <label className="flabel" htmlFor="trn-courts">{t('tournament.courts.setupLabel')}</label>
          <div className="trn-courts-row">
            <input id="trn-courts" type="number" min="1" max="32" inputMode="numeric" value={courtCount}
                   onChange={e => setCourtCount(e.target.value)} />
            <span className="trn-courts-hint">{t('tournament.courts.setupHint')}</span>
          </div>
        </div>

        {format !== 'swiss' && (
          <label className="trn-toggle">
            <input type="checkbox" checked={doubleRound} onChange={e => setDoubleRound(e.target.checked)} />
            <span className="trn-toggle-track"><span className="trn-toggle-thumb" /></span>
            <span>{t('tournament.schedule.doubleRound')}</span>
          </label>
        )}

        <fieldset className="trn-sched">
          <legend className="flabel">{t('tournament.schedule.title')}</legend>
          <label className="trn-toggle">
            <input type="checkbox" checked={useTimes} onChange={e => setUseTimes(e.target.checked)} />
            <span className="trn-toggle-track"><span className="trn-toggle-thumb" /></span>
            <span>{t('tournament.schedule.enable')}</span>
          </label>
          {useTimes && (
            <div className="trn-sched-grid">
              <label className="field">
                <span className="flabel">{t('tournament.schedule.start')}</span>
                <input type="time" className="trn-time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </label>
              <label className="field">
                <span className="flabel">{t('tournament.schedule.halves')}</span>
                <select className="sel" value={sched.halves} onChange={e => setSchedField('halves', Number(e.target.value))}>
                  {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="flabel">{t('tournament.schedule.halfMin')}</span>
                <input type="number" min="1" max="90" inputMode="numeric" value={sched.halfMin} onChange={e => setSchedField('halfMin', e.target.value)} />
              </label>
              {Number(sched.halves) > 1 && (
                <label className="field">
                  <span className="flabel">{t('tournament.schedule.halfBreak')}</span>
                  <input type="number" min="0" max="60" inputMode="numeric" value={sched.halfBreakMin} onChange={e => setSchedField('halfBreakMin', e.target.value)} />
                </label>
              )}
              <label className="field">
                <span className="flabel">{t('tournament.schedule.change')}</span>
                <input type="number" min="0" max="60" inputMode="numeric" value={sched.changeMin} onChange={e => setSchedField('changeMin', e.target.value)} />
              </label>
            </div>
          )}
          {useTimes && (
            <p className="trn-sched-sum">{t('tournament.schedule.matchLength', { n: matchMinutes(sched) })}</p>
          )}
        </fieldset>

        <div className="trn-field">
          <label className="flabel" htmlFor="trn-team">{t('tournament.setup.teamsLabel', { count: teams.length })}</label>
          <div className="trn-team-row">
            <input id="trn-team" type="text" placeholder={t('tournament.setup.teamNamePlaceholder')} value={teamInput}
              onChange={e => setTeamInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTeam()} />
            <button className="btn-mini" onClick={addTeam} disabled={!teamInput.trim()}>{t('tournament.setup.addTeam')}</button>
          </div>
          <div className="trn-import">
            {drawn && !imported ? (
              <button type="button" className="btn-mini" onClick={importDraw}>
                <Icon name="players" size={16} />{t('tournament.setup.importDraw', { count: drawn.length })}
              </button>
            ) : imported ? (
              <span className="trn-import-done" role="status"><Icon name="check" size={16} />{t('tournament.setup.importedDraw')}</span>
            ) : null}
            <Link className="btn-link" to="/teams">{t('tournament.setup.goDraw')}<Icon name="chevron" size={16} /></Link>
          </div>
          {teams.length > 0 && (
            <div className="trn-chips">
              {teams.map(tm => (
                <div key={tm} className="trn-chip">
                  <span>{tm}{rosters[tm]?.length > 0 && <span className="trn-chip-count">{' · '}{t('tournament.setup.playersN', { count: rosters[tm].length })}</span>}</span>
                  <button onClick={() => setTeams(p => p.filter(x => x !== tm))} title={t('common.remove')} aria-label={`${t('common.remove')} ${tm}`}>
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {preview && (
          <div className="trn-preview" role="status">
            <span>{t('tournament.schedule.previewMatches', { count: preview.matches })}</span>
            {preview.endAt && <strong>{t('tournament.schedule.previewEnd', { time: fmtHour(preview.endAt) })}</strong>}
          </div>
        )}

        <button className="btn-acc trn-start-btn" onClick={handleStart} disabled={teams.length < 2}>
          {t('tournament.setup.start')}
        </button>
      </div>
    </>
  )
}
