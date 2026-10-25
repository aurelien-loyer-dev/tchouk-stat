import { useTranslation } from 'react-i18next'
import LanguageToggle from '../i18n/LanguageToggle'
import { useTheme } from '../theme/useTheme'
import Icon from './Icon'
import './AppBar.css'

export default function AppBar() {
  const { t } = useTranslation()
  const { theme, toggle } = useTheme()
  const toLabel = theme === 'dark' ? t('common.theme.toLight') : t('common.theme.toDark')

  return (
    <header className="app-bar">
      <div className="app-bar-in">
        <span className="app-bar-brand">
          <svg className="app-bar-mark" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 18h18" />
            <path d="M6 18a6 6 0 0 1 12 0" />
          </svg>
          {t('setup.appTitle')}
        </span>
        <div className="app-bar-actions">
          <LanguageToggle className="icon-btn icon-btn-text" />
          <button className="icon-btn" onClick={toggle} title={toLabel} aria-label={toLabel}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
