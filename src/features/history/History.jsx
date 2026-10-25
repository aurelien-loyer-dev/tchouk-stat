import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import MatchCard from '../../components/MatchCard'
import PageHeader from '../../components/PageHeader'
import { downloadMatchPdf } from './pdf'
import MatchDetail from './components/MatchDetail'
import PlayerMatchDetail from './components/PlayerMatchDetail'
import './history.css'

export default function History({ history, onBack, onClear, initialMatch }) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(initialMatch || null)

  if (selected) {
    return selected.mode === 'player'
      ? <PlayerMatchDetail match={selected} onClose={() => setSelected(null)} />
      : <MatchDetail match={selected} onClose={() => setSelected(null)} />
  }

  return (
    <div className="hist">
      <PageHeader title={t('history.title')} onBack={onBack} />

      {history.length === 0 ? (
        <div className="empty-state">{t('history.noMatches')}</div>
      ) : (
        <>
          <div className="mr-list">
            {history.map(m => (
              <MatchCard key={m.id} match={m} onClick={setSelected} onDownloadPdf={downloadMatchPdf} showFooter />
            ))}
          </div>

          <div className="actions-row">
            <button
              className="btn-danger"
              onClick={() => { if (window.confirm(t('history.clearConfirm'))) onClear() }}
            >
              {t('history.clearButton')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
