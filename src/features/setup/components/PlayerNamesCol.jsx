import { useTranslation } from 'react-i18next'
import { teamSwatchStyle } from '../../../lib/teamColor'
import CompoLoader from './CompoLoader'

// Liste de noms de joueurs (colonne)
export default function PlayerNamesCol({ teamLabel, teamColor, names, onChange, compos, onSaveCompo, onDeleteCompo, onLoadCompo, onUpdateCompo }) {
  const { t } = useTranslation()
  function updateName(i, val) {
    const next = [...names]
    next[i] = val
    onChange(next)
  }
  function addPlayer() { onChange([...names, '']) }
  function removePlayer(i) { onChange(names.filter((_, j) => j !== i)) }

  return (
    <div className="ps-team-col">
      <div className="ps-team-hd">
        <span className="team-dot" style={teamSwatchStyle(teamColor)} />
        {teamLabel}
      </div>
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
            placeholder={t('setup.compos.playerPlaceholder', { n: i + 1 })}
            value={name}
            onChange={e => updateName(i, e.target.value)}
          />
          {names.length > 1 && (
            <button className="btn-mini ps-rm-btn" onClick={() => removePlayer(i)}>×</button>
          )}
        </div>
      ))}
      <button className="btn-mini ps-add-btn" onClick={addPlayer}>{t('setup.compos.addPlayer')}</button>
    </div>
  )
}
