import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '../../../lib/router'
import { fetchShared, formatCode, normalizeCode } from '../cloud'
import SpectatorBoard from './SpectatorBoard'
import '../tournament.css'
import '../board.css'

const POLL_MS = 4000

// Page publique d'un tournoi partagé (lien spectateur, QR code) : lecture
// seule, rafraîchie toutes les 4 s. Rien n'est enregistré sur l'appareil et
// aucune saisie n'est possible, même sur le téléphone de l'organisateur.
export default function PublicBoard({ code: rawCode }) {
  const { t } = useTranslation()
  const code = normalizeCode(rawCode)
  const [state, setState] = useState({ status: 'loading' }) // loading | ok | notFound | notConfigured | offline

  useEffect(() => {
    let alive = true
    let timer
    let lastRev = 0
    async function load() {
      if (document.visibilityState === 'visible') {
        const r = await fetchShared(code)
        if (!alive) return
        if (r.ok) {
          if (r.rev !== lastRev) {
            lastRev = r.rev
            setState({ status: 'ok', tournament: r.data, updatedAt: r.updatedAt })
          } else {
            setState(s => (s.offline ? { ...s, offline: false } : s))
          }
        } else if (r.status === 404) {
          setState({ status: 'notFound' })
          return
        } else {
          setState(s => (s.status === 'ok' ? { ...s, offline: true } : { status: r.status === 503 ? 'notConfigured' : 'offline' }))
        }
      }
      timer = setTimeout(load, POLL_MS)
    }
    load()
    const onVisible = () => { if (document.visibilityState === 'visible') { clearTimeout(timer); load() } }
    document.addEventListener('visibilitychange', onVisible)
    return () => { alive = false; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [code])

  useEffect(() => {
    if (state.tournament?.name) document.title = `${state.tournament.name} · ${t('tournament.board.live')}`
  }, [state.tournament?.name, t])

  if (state.status === 'ok') {
    return (
      <SpectatorBoard
        tournament={state.tournament}
        updatedAt={state.updatedAt}
        code={code}
        syncStatus={state.offline ? 'offline' : 'ok'}
      />
    )
  }

  return (
    <div className="pub-state" aria-busy={state.status === 'loading'}>
      {state.status === 'loading' ? (
        <p className="pub-loading">{t('tournament.public.loading', { code: formatCode(code) })}</p>
      ) : (
        <>
          <h1>{t(`tournament.public.${state.status}.title`)}</h1>
          <p>{t(`tournament.public.${state.status}.text`, { code: formatCode(code) })}</p>
          <Link className="btn-ghost" to="/tournaments">{t('tournament.public.other')}</Link>
        </>
      )}
    </div>
  )
}
