import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadTournamentUi, TOURNAMENT_UI_KEY } from './storage'
import { canEdit } from './cloud'
import { useTournamentCloud } from './useTournamentCloud'
import TournamentList from './views/TournamentList'
import TournamentSetup from './views/TournamentSetup'
import TournamentDetail from './views/TournamentDetail'
import CloudNotice from './components/CloudNotice'
import './tournament.css'

export default function Tournament({ tournaments, onSave, onBack, joinRequest, onJoinHandled }) {
  const { t } = useTranslation()
  const [initialUi] = useState(loadTournamentUi)
  const [view, setView]         = useState(initialUi.view)
  const [activeId, setActiveId] = useState(initialUi.activeId)
  const [validatedIds, setValidatedIds] = useState([])
  const [joinState, setJoinState] = useState(null) // null | 'loading' | { error }

  const active = tournaments.find(tour => tour.id === activeId) || null
  const cloud  = useTournamentCloud({ tournaments, save: onSave, activeId: active?.id, view })

  // Tournoi supprimé (ici ou dans un autre onglet) : retour à la liste.
  useEffect(() => {
    if (view === 'detail' && activeId && !active && joinState !== 'loading') setView('list')
  }, [view, activeId, active, joinState])

  useEffect(() => {
    try {
      localStorage.setItem(TOURNAMENT_UI_KEY, JSON.stringify({ view, activeId: active?.id || null }))
    } catch {}
  }, [view, active])

  async function join(code, key) {
    setJoinState('loading')
    const r = await cloud.join(code, key)
    if (r.ok) {
      setJoinState(null)
      setActiveId(r.id)
      setView('detail')
    } else {
      setJoinState({ error: r.status === 404 ? 'notFound' : r.status === 503 ? 'notConfigured' : 'offline' })
      setView('list')
    }
    return r
  }

  // Ouverture via un lien partagé.
  useEffect(() => {
    if (!joinRequest) return
    onJoinHandled()
    join(joinRequest.code, joinRequest.key)
  }, [joinRequest])

  function handleStart(tour) {
    onSave(list => [tour, ...list])
    setActiveId(tour.id)
    setView('detail')
  }

  function handleUpdate(updated) {
    if (updated.share && !canEdit(updated)) return // spectateur : lecture seule
    onSave(list => list.map(tour => (tour.id === updated.id ? updated : tour)))
    setValidatedIds(ids => ids.filter(id => id !== updated.id))
    if (updated.share) cloud.push(updated)
  }

  function handleValidate(id) {
    setValidatedIds(ids => (ids.includes(id) ? ids : [id, ...ids]))
  }

  function handleDelete(id) {
    const tour = tournaments.find(x => x.id === id)
    const msg = tour?.share ? t('tournament.share.deleteSharedConfirm') : t('tournament.deleteConfirm')
    if (!window.confirm(msg)) return
    onSave(list => list.filter(x => x.id !== id))
    setValidatedIds(ids => ids.filter(vId => vId !== id))
    if (activeId === id) setView('list')
  }

  const notice = cloud.notice && (
    <CloudNotice
      kind={cloud.notice.kind}
      name={tournaments.find(x => x.id === cloud.notice.id)?.name}
      onClose={cloud.clearNotice}
    />
  )

  if (view === 'setup')
    return <TournamentSetup onStart={handleStart} onCancel={() => setView('list')} />

  if (view === 'detail' && active)
    return (
      <>
        {notice}
        <TournamentDetail
          tournament={active}
          onUpdate={handleUpdate}
          onBack={() => setView('list')}
          onValidate={handleValidate}
          validated={validatedIds.includes(active.id)}
          syncStatus={cloud.sync[active.id]}
          onShare={() => cloud.share(active)}
          onUnshare={() => cloud.unshare(active)}
        />
      </>
    )

  return (
    <>
      {notice}
      <TournamentList
        tournaments={tournaments}
        onBack={onBack}
        onCreate={() => setView('setup')}
        onOpen={tour => { setActiveId(tour.id); setView('detail') }}
        onDelete={handleDelete}
        onJoin={code => join(code, null)}
        joinState={joinState}
      />
    </>
  )
}
