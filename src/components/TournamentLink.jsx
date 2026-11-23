import { useTranslation } from 'react-i18next'
import { Link } from '../lib/router'
import Icon from './Icon'

// Bandeau au-dessus d'un match lancé depuis un tournoi : rappelle d'où il vient,
// puis dit si le score final a bien été reporté.
export default function TournamentLink({ origin, report, tournament }) {
  const { t } = useTranslation()
  const name = tournament?.name || t('tournament.title')
  const status = report?.status || 'linked'
  const tone = status === 'ok' ? 'ok' : ['draw', 'missing', 'readonly', 'pending'].includes(status) ? 'warn' : 'info'

  return (
    <div className={`tlink tlink-${tone}`} role={report ? 'status' : undefined}>
      <Icon name={status === 'ok' ? 'check' : 'trophy'} size={18} className="tlink-icon" />
      <p className="tlink-text">
        {t(`matchLink.${status}`, { name, label: origin.label || '' })}
        {status === 'linked' && origin.label && <span className="tlink-label">{origin.label}</span>}
      </p>
      {tournament && (
        <Link className="btn-mini tlink-go" to={`/tournaments/${tournament.id}`}>
          {t('matchLink.open')}<Icon name="chevron" size={16} />
        </Link>
      )}
    </div>
  )
}
