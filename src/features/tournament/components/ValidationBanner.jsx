import { useTranslation } from 'react-i18next'

export default function ValidationBanner({ onValidate }) {
  const { t } = useTranslation()
  return (
    <div className="trn-validate-banner">
      <div>
        <div className="trn-validate-title">{t('tournament.validateTitle')}</div>
        <div className="trn-validate-text">{t('tournament.validateText')}</div>
      </div>
      <button className="btn-acc trn-validate-btn" onClick={onValidate}>
        {t('tournament.validateButton')}
      </button>
    </div>
  )
}
