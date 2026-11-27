import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { navigate } from '../../lib/router'
import { canEdit } from './cloud'
import { useTournamentCloud } from './useTournamentCloud'
import TournamentList from './views/TournamentList'
import TournamentSetup from './views/TournamentSetup'
import TournamentDetail from './views/TournamentDetail'
import CloudNotice from './components/CloudNotice'
import PageHeader from '../../components/PageHeader'
import './tournament.css'
import './board.css'

// Routes : /tournaments (liste), /tournaments/new, /tournaments/:id,
// /t/:code (lien de partage ; la clé organisateur arrive dans #key=…).
export default function Tournament({ tournaments, onSave, route, onPlayMatch }) {
  const { t } = useTranslation()
  const [validatedIds, setValidatedIds] = useState([])
  const [joinState, setJoinState] = useState(null) // null | 'loading' | { error }

  const view = { tournaments: 'list', tournamentNew: 'setup', tournament: 'detail', tournamentJoin: 'join' }[route.name]
  const active = view === 'detail' ? tournaments.find(tour => tour.id === route.params.id) || null : null
  const cloud  = useTournamentCloud({ tournaments, save: onSave, activeId: active?.id, view })

  // Copie suivie en spectateur (ancienne version) : on ouvre la page publique.
  const viewerCode = active?.share && !active.share.key ? active.share.code : null
  useEffect(() => {
    if (viewerCode) navigate(`/live/${viewerCode}`, { replace: true })
  }, [viewerCode])

  async function join(code, key) {
    setJoinState('loading')
    const r = await cloud.join(code, key)
    if (r.ok) {
      setJoinState(null)
      navigate(`/tournaments/${r.id}`, { replace: view === 'join' })
    } else {
      setJoinState({ error: r.status === 404 ? 'notFound' : r.status === 503 ? 'notConfigured' : 'offline' })
      if (view === 'join') navigate('/tournaments', { replace: true })
    }
    return r
  }

  // Ouverture via un lien partagé /t/CODE[#key=CLÉ].
  const joined = useRef(null)
  useEffect(() => {
    if (view !== 'join') return
    const code = route.params.code
    const key = new URLSearchParams(route.hash.slice(1)).get('key')
    const token = `${code}.${key}`
    if (joined.current === token) return
    joined.current = token
    // Sans clé, c'est un lien spectateur : page publique, rien n'est importé.
    if (!key) { navigate(`/live/${code}`, { replace: true }); return }
    join(code.toUpperCase().replace(/[^A-Z0-9]/g, ''), key)
  }, [view, route.params.code, route.hash])

  function handleStart(tour) {
    onSave(list => [tour, ...list])
    navigate(`/tournaments/${tour.id}`, { replace: true })
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

  function handleResume(id) {
    setValidatedIds(ids => ids.filter(vId => vId !== id))
  }

  function handleDelete(id) {
    const tour = tournaments.find(x => x.id === id)
    const msg = tour?.share ? t('tournament.share.deleteSharedConfirm') : t('tournament.deleteConfirm')
    if (!window.confirm(msg)) return
    onSave(list => list.filter(x => x.id !== id))
    setValidatedIds(ids => ids.filter(vId => vId !== id))
    if (active?.id === id) navigate('/tournaments', { replace: true })
  }

  const notice = cloud.notice && (
    <CloudNotice
      kind={cloud.notice.kind}
      name={tournaments.find(x => x.id === cloud.notice.id)?.name}
      onClose={cloud.clearNotice}
    />
  )

  if (view === 'setup')
    return <TournamentSetup onStart={handleStart} onCancel={() => navigate('/tournaments')} />

  if (view === 'join')
    return (
      <div className="trn-list-screen" aria-busy="true">
        <PageHeader title={t('tournament.share.joining')} onBack={() => navigate('/tournaments')} backLabel={t('tournament.title')} />
      </div>
    )

  if (view === 'detail') {
    if (!active) {
      return (
        <div className="trn-list-screen">
          <PageHeader title={t('tournament.notFoundTitle')} subtitle={t('tournament.notFoundText')}
                      onBack={() => navigate('/tournaments')} backLabel={t('tournament.title')} />
        </div>
      )
    }
    if (viewerCode) return null
    return (
      <>
        {notice}
        <TournamentDetail
          tournament={active}
          onUpdate={handleUpdate}
          onBack={() => navigate('/tournaments')}
          onValidate={handleValidate}
          onResume={handleResume}
          validated={validatedIds.includes(active.id)}
          syncStatus={cloud.sync[active.id]}
          onShare={() => cloud.share(active)}
          onUnshare={() => cloud.unshare(active)}
          onPlayMatch={onPlayMatch}
        />
      </>
    )
  }

  return (
    <>
      {notice}
      <TournamentList
        tournaments={tournaments}
        onBack={() => navigate('/')}
        onCreate={() => navigate('/tournaments/new')}
        onDelete={handleDelete}
        onJoin={code => navigate(`/live/${code}`)}
        joinState={joinState}
      />
    </>
  )
}
