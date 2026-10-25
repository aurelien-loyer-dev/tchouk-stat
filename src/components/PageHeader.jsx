import { useTranslation } from 'react-i18next'
import Icon from './Icon'

// En-tête d'écran : retour (optionnel), titre, sous-titre et actions à droite.
export default function PageHeader({ title, subtitle, onBack, backLabel, actions }) {
  const { t } = useTranslation()
  return (
    <div className="page-head">
      {onBack && (
        <button className="btn-back" onClick={onBack}>
          <Icon name="back" size={18} />
          {backLabel || t('common.back')}
        </button>
      )}
      <div className="page-head-row">
        <div className="page-head-text">
          <h1>{title}</h1>
          {subtitle && <p className="page-sub">{subtitle}</p>}
        </div>
        {actions && <div className="page-head-actions">{actions}</div>}
      </div>
    </div>
  )
}
