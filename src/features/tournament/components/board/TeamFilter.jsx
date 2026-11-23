import { useTranslation } from 'react-i18next'

// Puces pour suivre une équipe (filtre les matchs, met en avant sa ligne).
export default function TeamFilter({ teams, value, onChange, label }) {
  const { t } = useTranslation()
  return (
    <div className="tf" role="group" aria-label={label}>
      <span className="tf-label">{label}</span>
      <div className="tf-chips">
        <button className={`tf-chip${!value ? ' on' : ''}`} aria-pressed={!value} onClick={() => onChange(null)}>
          {t('tournament.board.allTeams')}
        </button>
        {teams.map(team => (
          <button key={team} className={`tf-chip${value === team ? ' on' : ''}`} aria-pressed={value === team}
                  onClick={() => onChange(value === team ? null : team)}>
            {team}
          </button>
        ))}
      </div>
    </div>
  )
}
