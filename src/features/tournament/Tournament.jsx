import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadTournamentUi, TOURNAMENT_UI_KEY } from './storage'
import TournamentList from './views/TournamentList'
import TournamentSetup from './views/TournamentSetup'
import TournamentDetail from './views/TournamentDetail'
import './tournament.css'

export default function Tournament({ tournaments, onSave, onBack }) {
  const { t } = useTranslation()
  const initialUi = loadTournamentUi()
  const [view, setView]       = useState(initialUi.view)
  const [active, setActive]   = useState(() => tournaments.find(t => t.id === initialUi.activeId) || null)
  const [validatedIds, setValidatedIds] = useState([])

  useEffect(() => {
    if (!active) return
    const nextActive = tournaments.find(t => t.id === active.id)
    if (!nextActive) {
      setActive(null)
      setView('list')
      setValidatedIds(ids => ids.filter(id => id !== active.id))
      return
    }
    if (nextActive !== active) setActive(nextActive)
  }, [tournaments, active])

  useEffect(() => {
    if (view !== 'detail' || active) return
    const restored = tournaments.find(t => t.id === initialUi.activeId)
    if (restored) setActive(restored)
  }, [view, active, tournaments, initialUi.activeId])

  useEffect(() => {
    try {
      localStorage.setItem(TOURNAMENT_UI_KEY, JSON.stringify({
        view,
        activeId: active?.id || null,
      }))
    } catch {}
  }, [view, active])

  function handleStart(t) {
    const next = [t, ...tournaments]
    onSave(next); setActive(t); setView('detail')
  }

  function handleUpdate(updated) {
    const next = tournaments.map(t => t.id === updated.id ? updated : t)
    onSave(next); setActive(updated)
    setValidatedIds(ids => ids.filter(id => id !== updated.id))
  }

  function handleValidate(id) {
    setValidatedIds(ids => ids.includes(id) ? ids : [id, ...ids])
  }

  function handleDelete(id) {
    if (!window.confirm(t('tournament.deleteConfirm'))) return
    onSave(tournaments.filter(t => t.id !== id))
    setValidatedIds(ids => ids.filter(vId => vId !== id))
    if (active?.id === id) setView('list')
  }

  if (view === 'setup')
    return <TournamentSetup onStart={handleStart} onCancel={() => setView('list')} />

  if (view === 'detail' && active)
    return (
      <TournamentDetail
        tournament={active}
        onUpdate={handleUpdate}
        onBack={() => setView('list')}
        onValidate={handleValidate}
        validated={validatedIds.includes(active.id)}
      />
    )

  return (
    <TournamentList
      tournaments={tournaments}
      onBack={onBack}
      onCreate={() => setView('setup')}
      onOpen={tour => { setActive(tour); setView('detail') }}
      onDelete={handleDelete}
    />
  )
}
