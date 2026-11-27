import { useTranslation } from 'react-i18next'
import LanguageToggle from '../i18n/LanguageToggle'
import { useTheme } from '../theme/useTheme'
import Icon from './Icon'
import { Link } from '../lib/router'
import { promptInstall, usePwa } from '../pwa/pwa'
import './AppBar.css'

export default function AppBar() {
  const { t } = useTranslation()
  const { theme, toggle } = useTheme()
  const toLabel = theme === 'dark' ? t('common.theme.toLight') : t('common.theme.toDark')
  const { canInstall, online } = usePwa()

  return (
    <header className="app-bar">
      <div className="app-bar-in">
        <Link className="app-bar-brand" to="/" aria-label={t('nav.homeLink')}>
          {/* Logo (public/icons/logo.svg) : tuile à la couleur du texte, dessin à la couleur du fond,
              pour rester net en thème clair comme sombre. */}
          <svg className="app-bar-mark" viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="15" fill="currentColor" />
            <g transform="translate(1.2 0)" fill="none" stroke="var(--s1)" strokeLinecap="round" strokeLinejoin="round">
              <path d="M29 13 H50 L53 41 H26 Z" strokeWidth="3.6" />
              <path d="M36 13 L35 41 M43 13 L44 41 M27.9 22.3 H51 M27 31.7 H52" strokeWidth="1.6" strokeOpacity=".55" />
              <path d="M30 41 L28 50 M49 41 L51 50" strokeWidth="3.6" />
              <path d="M19.6 30.2 Q 21.8 29.6 23.2 27.8" strokeWidth="2.4" strokeOpacity=".7" />
              <path d="M19.6 36 Q 22 35.8 23.4 34.2" strokeWidth="2.4" strokeOpacity=".45" />
              <circle cx="12.4" cy="33" r="5.6" fill="var(--s1)" stroke="none" />
            </g>
          </svg>
          <span aria-hidden="true">{t('setup.appTitle')}</span>
        </Link>
        <div className="app-bar-actions">
          {!online && <span className="app-bar-offline" title={t('pwa.offlineTitle')}><span className="app-bar-hide-sm">{t('pwa.offline')}</span></span>}
          {canInstall && (
            <button className="icon-btn icon-btn-text app-bar-install" onClick={promptInstall}>
              <Icon name="download" size={16} /><span className="app-bar-hide-sm">{t('pwa.install')}</span>
            </button>
          )}
          <Link className="icon-btn icon-btn-text app-bar-guide" to="/guide">{t('nav.guide')}</Link>
          <LanguageToggle className="icon-btn icon-btn-text" />
          <button className="icon-btn" onClick={toggle} title={toLabel} aria-label={toLabel}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
