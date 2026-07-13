import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../../i18n'
import { mkTournament } from '../../../lib/tournament'
import { KNOCKOUT_OPTIONS } from '../constants'

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

  function addTeam() {
    const name = teamInput.trim()
    if (name && !teams.includes(name)) { setTeams(p => [...p, name]); setTeamInput('') }
  }

  function handleStart() {
    if (teams.length < 2) return
    const n = name.trim() || t('tournament.setup.defaultName', { date: new Date().toLocaleDateString(i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR') })
    onStart(mkTournament({
      name: n, format, teams,
      numGroups: Number(numGroups),
      knockoutSize: fullPlacement ? null : knockoutSize,
      fullPlacement: format === 'groups' ? fullPlacement : false,
      numSwissRounds: Number(swissRounds),
    }))
  }

  const showKo = (format === 'roundrobin' || format === 'groups') && !fullPlacement

  return (
    <>
      <div className="trn-topbar">
        <button className="btn-mini" onClick={onCancel}>{t('tournament.setup.cancel')}</button>
        <div className="trn-topbar-title">{t('tournament.setup.title')}</div>
      </div>

      <div className="trn-setup">
        <div className="trn-field">
          <div className="flabel">{t('tournament.setup.nameLabel')}</div>
          <input type="text" placeholder={t('tournament.setup.namePlaceholder')} value={name}
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
            <div className="flabel">{t('tournament.setup.swissRoundsLabel')}</div>
            <input type="number" min="2" max="15" value={swissRounds}
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
          <div className="flabel">{t('tournament.setup.teamsLabel', { count: teams.length })}</div>
          <div className="trn-team-row">
            <input type="text" placeholder={t('tournament.setup.teamNamePlaceholder')} value={teamInput}
              onChange={e => setTeamInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTeam()} />
            <button className="btn-mini" onClick={addTeam}>{t('tournament.setup.addTeam')}</button>
          </div>
          {teams.length > 0 && (
            <div className="trn-chips">
              {teams.map(tm => (
                <div key={tm} className="trn-chip">
                  <span>{tm}</span>
                  <button onClick={() => setTeams(p => p.filter(x => x !== tm))}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="btn-acc" onClick={handleStart} disabled={teams.length < 2}>
          {t('tournament.setup.start')}
        </button>
      </div>
    </>
  )
}
