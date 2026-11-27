import { useTranslation } from 'react-i18next'
import { applyUpdate, usePwa } from './pwa'
import './pwa.css'

// Bandeau en bas d'écran : nouvelle version prête. On laisse l'utilisateur
// choisir le moment (un rechargement en plein match ne perd rien, mais surprend).
export default function PwaBanner() {
  const { t } = useTranslation()
  const { updateReady } = usePwa()
  if (!updateReady) return null
  return (
    <div className="pwa-banner" role="status">
      <span>{t('pwa.updateReady')}</span>
      <button className="btn-mini pwa-banner-btn" onClick={applyUpdate}>{t('pwa.reload')}</button>
    </div>
  )
}
