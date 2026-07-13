import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import MatchCard from '../../components/MatchCard'
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
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h1>{t('history.title')}</h1>
        <button className="btn-ghost" style={{ padding: '8px 14px', fontSize: 14 }} onClick={onBack}>{t('common.back')}</button>
      </div>

      {history.length === 0 ? (
        <div className="card" style={{ color: 'var(--dim)', fontSize: 14, textAlign: 'center', padding: 32 }}>
          {t('history.noMatches')}
        </div>
      ) : (
        <>
          <div className="mr-list">
            {history.map(m => (
              <MatchCard key={m.id} match={m} onClick={setSelected} onDownloadPdf={downloadMatchPdf} showFooter />
            ))}
          </div>

          <button
            className="btn-ghost"
            style={{ alignSelf: 'center', marginTop: 8, color: 'var(--err)' }}
            onClick={() => { if (window.confirm(t('history.clearConfirm'))) onClear() }}
          >
            {t('history.clearButton')}
          </button>
        </>
      )}
    </>
  )
}
