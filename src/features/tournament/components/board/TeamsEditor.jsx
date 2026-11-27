import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { teamNameError } from '../../../../lib/tournament'

// Noms des équipes, modifiables : le nouveau nom est repris partout
// (matchs, poules, tableau, arbitres, compositions).
function TeamNameField({ tournament, name, onRename }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(name)
  useEffect(() => setValue(name), [name])
  const error = value.trim() === name ? null : teamNameError(tournament, name, value)

  function commit() {
    if (value.trim() === name) { setValue(name); return }
    if (error) return
    onRename(name, value)
  }

  return (
    <li className="te-row">
      <input
        className={`te-input${error ? ' te-invalid' : ''}`}
        value={value}
        maxLength={40}
        aria-label={t('tournament.edit.teamName', { name })}
        aria-invalid={!!error}
        onChange={e => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') { setValue(name); e.currentTarget.blur() }
        }}
      />
      {error && <span className="te-error" role="alert">{t(`tournament.edit.nameError.${error}`)}</span>}
    </li>
  )
}

export default function TeamsEditor({ tournament, onRename }) {
  const { t } = useTranslation()
  return (
    <section className="te" aria-labelledby="te-title">
      <h2 id="te-title" className="te-title">{t('tournament.edit.teamsTitle')}</h2>
      <p className="ob-hint">{t('tournament.edit.teamsHint')}</p>
      <ul className="te-list">
        {tournament.teams.map(name => (
          <TeamNameField key={name} tournament={tournament} name={name} onRename={onRename} />
        ))}
      </ul>
    </section>
  )
}
