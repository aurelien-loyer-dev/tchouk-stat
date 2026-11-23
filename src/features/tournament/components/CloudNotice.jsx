import { useTranslation } from 'react-i18next'
import Icon from '../../../components/Icon'

// Message après un événement de synchro (conflit, partage arrêté, droits retirés).
export default function CloudNotice({ kind, name, onClose }) {
  const { t } = useTranslation()
  return (
    <div className="shr-notice" role="alert">
      <p>{t(`tournament.share.notice.${kind}`, { name: name || '' })}</p>
      <button className="icon-btn" onClick={onClose} aria-label={t('tournament.share.close')}>
        <Icon name="close" size={18} />
      </button>
    </div>
  )
}
