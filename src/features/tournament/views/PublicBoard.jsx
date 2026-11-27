import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '../../../lib/router'
import { formatCode, normalizeCode } from '../cloud'
import SpectatorBoard from './SpectatorBoard'
import { useSharedTournament } from '../useSharedTournament'
import '../tournament.css'
import '../board.css'

// Page publique d'un tournoi partagé (lien spectateur, QR code) : lecture
// seule, rafraîchie toutes les 4 s. Rien n'est enregistré sur l'appareil et
// aucune saisie n'est possible, même sur le téléphone de l'organisateur.
export default function PublicBoard({ code: rawCode }) {
  const { t } = useTranslation()
  const code = normalizeCode(rawCode)
  const state = useSharedTournament(code)

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
