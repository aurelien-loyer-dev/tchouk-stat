import { useTranslation } from 'react-i18next'

export default function Progress({ done, total, label }) {
  const { t } = useTranslation()
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="trn-prog">
      <div className="trn-prog-label">{label || t('tournament.matchesPlayed', { done, total })}</div>
      <div className="trn-prog-track"><div className="trn-prog-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}
