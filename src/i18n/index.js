import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import fr from './locales/fr'
import en from './locales/en'

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'tchouk_lang',
    },
  })

function syncHtmlLang(lng) {
  if (typeof document !== 'undefined') document.documentElement.lang = lng?.startsWith('en') ? 'en' : 'fr'
}
syncHtmlLang(i18next.language)
i18next.on('languageChanged', syncHtmlLang)

export default i18next
