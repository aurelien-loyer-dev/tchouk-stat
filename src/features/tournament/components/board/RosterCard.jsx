import { useTranslation } from 'react-i18next'

// Composition d'une équipe (venue du tirage d'équipes).
export default function RosterCard({ team, players, highlight }) {
  const { t } = useTranslation()
  return (
    <article className={`rst${highlight ? ' rst-hl' : ''}`}>
      <header className="rst-hd">
        <h4 className="rst-name">{team}</h4>
        <span className="rst-count">{t('tournament.setup.playersN', { count: players.length })}</span>
      </header>
      <ul className="rst-list">
        {players.map((p, i) => <li key={`${p}-${i}`}>{p}</li>)}
      </ul>
    </article>
  )
}
