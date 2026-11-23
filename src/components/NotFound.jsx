import { useTranslation } from 'react-i18next'
import { Link } from '../lib/router'
import PageHeader from './PageHeader'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="not-found">
      <PageHeader title={t('nav.notFound.title')} subtitle={t('nav.notFound.text')} />
      <div className="not-found-actions">
        <Link className="btn-acc" to="/">{t('nav.notFound.home')}</Link>
        <Link className="btn-ghost" to="/tournaments">{t('setup.home.tournamentLabel')}</Link>
        <Link className="btn-ghost" to="/history">{t('setup.home.historyLabel')}</Link>
      </div>
    </div>
  )
}
