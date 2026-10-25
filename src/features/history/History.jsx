import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import MatchCard from '../../components/MatchCard'
import PageHeader from '../../components/PageHeader'
import Icon from '../../components/Icon'
import { dayKey, fmtDayLabel } from '../../lib/format'
import { downloadMatchPdf } from './pdf'
import MatchDetail from './components/MatchDetail'
import PlayerMatchDetail from './components/PlayerMatchDetail'
import './history.css'

const MODES = ['all', 'stats', 'player', 'scorer']

function normalize(s) {
  return String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export default function History({ history, onBack, onClear, onDelete, onStartNew, initialMatch }) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState(initialMatch?.id || null)
  const [mode, setMode]   = useState('all')
  const [query, setQuery] = useState('')

  // Le match ouvert est relu dans la liste : s'il est supprimé, on revient à la liste.
  const selected = selectedId ? history.find(m => m.id === selectedId) : null

  const counts = useMemo(() => {
    const c = { all: history.length, stats: 0, player: 0, scorer: 0 }
    history.forEach(m => { c[m.mode || 'stats'] = (c[m.mode || 'stats'] || 0) + 1 })
    return c
  }, [history])

  const groups = useMemo(() => {
    const q = normalize(query.trim())
    const filtered = history.filter(m =>
      (mode === 'all' || (m.mode || 'stats') === mode) &&
      (!q || (m.teams || []).some(tm => normalize(tm.name).includes(q)))
    )
    const out = []
    filtered.forEach(m => {
      const key = dayKey(m.playedAt)
      const last = out[out.length - 1]
      if (last && last.key === key) last.matches.push(m)
      else out.push({ key, label: fmtDayLabel(m.playedAt), matches: [m] })
    })
    return out
  }, [history, mode, query])

  function handleDelete(match) {
    if (!window.confirm(t('history.deleteConfirm'))) return
    onDelete(match.id)
  }

  if (selected) {
    const props = { match: selected, onClose: () => setSelectedId(null), onDelete: handleDelete }
    return selected.mode === 'player' ? <PlayerMatchDetail {...props} /> : <MatchDetail {...props} />
  }

  return (
    <div className="hist">
      <PageHeader
        title={t('history.title')}
        subtitle={history.length > 0 ? t('history.count', { count: history.length }) : null}
        onBack={onBack}
        actions={history.length > 0 && (
          <button
            className="btn-mini btn-mini-danger"
            onClick={() => { if (window.confirm(t('history.clearConfirm'))) onClear() }}
          >
            <Icon name="trash" size={16} />{t('history.clearButton')}
          </button>
        )}
      />

      {history.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon"><Icon name="history" size={28} /></span>
          <div>
            <div className="empty-title">{t('history.noMatches')}</div>
            <div className="empty-text">{t('history.noMatchesHint')}</div>
          </div>
          <button className="btn-acc" onClick={onStartNew}>{t('history.startCta')}</button>
        </div>
      ) : (
        <>
          <div className="hist-tools">
            <label className="search">
              <Icon name="search" size={18} />
              <input
                type="text"
                placeholder={t('history.searchPlaceholder')}
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label={t('history.searchPlaceholder')}
              />
              {query && (
                <button className="search-clear" onClick={() => setQuery('')} aria-label={t('common.remove')}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </label>
            <div className="seg hist-modes" role="tablist">
              {MODES.map(m => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  className={mode === m ? 'on' : ''}
                  onClick={() => setMode(m)}
                  disabled={m !== 'all' && !counts[m]}
                >
                  {t(`history.modesShort.${m}`)}
                  <span className="seg-count">{counts[m] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="empty-state empty-small">{t('history.noResults')}</div>
          ) : groups.map(g => (
            <section key={g.key} className="sec hist-day">
              <h2 className="sec-title hist-day-title">
                <span>{g.label}</span>
                <span className="hist-day-count">{g.matches.length}</span>
              </h2>
              <div className="mc-grid">
                {g.matches.map(m => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    timeOnly
                    onClick={() => setSelectedId(m.id)}
                    onDownloadPdf={downloadMatchPdf}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}
