import { useTranslation } from 'react-i18next'

export default function LanguageToggle({ className, style }) {
  const { i18n, t } = useTranslation()
  const next = i18n.language?.startsWith('fr') ? 'en' : 'fr'

  return (
    <button
      className={className || 'btn-mini'}
      style={style}
      onClick={() => i18n.changeLanguage(next)}
      title={next === 'en' ? 'Switch to English' : 'Passer en français'}
    >
      {t('common.langToggle')}
    </button>
  )
}
