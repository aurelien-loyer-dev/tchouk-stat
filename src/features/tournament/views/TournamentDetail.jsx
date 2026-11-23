import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getTournamentEndState } from '../../../lib/tournament'
import { isViewer } from '../cloud'
import OrganizerBoard from './OrganizerBoard'
import SpectatorBoard from './SpectatorBoard'
import TournamentEnd from './TournamentEnd'
import SharePanel from '../components/SharePanel'
import PageHeader from '../../../components/PageHeader'
import Icon from '../../../components/Icon'

export default function TournamentDetail({ tournament, onUpdate, onBack, onValidate, validated, syncStatus, onShare, onUnshare }) {
  const { t } = useTranslation()
  const [shareOpen, setShareOpen] = useState(false)
  const formatLabel = t('tournament.formatLabel', { returnObjects: true })
  const { finished } = getTournamentEndState(tournament)
  const viewer = isViewer(tournament)

  // Spectateur : tableau en direct, puis le classement final dès la fin.
  if (viewer) {
    return (
      <div className="trn-detail">
        <button className="btn-back" onClick={onBack}>
          <Icon name="back" size={18} />{t('tournament.back')}
        </button>
        {finished && <TournamentEnd tournament={tournament} onBack={onBack} />}
        <SpectatorBoard tournament={tournament} syncStatus={syncStatus} />
      </div>
    )
  }

  return (
    <div className="trn-detail">
      <PageHeader
        title={tournament.name}
        subtitle={`${formatLabel[tournament.format]} · ${t('tournament.teamsCount', { count: tournament.teams.length })}`}
        onBack={onBack}
        backLabel={t('tournament.back')}
        actions={!tournament.share && (
          <button className={`btn-ghost${shareOpen ? ' on' : ''}`} onClick={() => setShareOpen(o => !o)} aria-expanded={shareOpen}>
            <Icon name="share" size={18} />{t('tournament.share.button')}
          </button>
        )}
      />

      {(tournament.share || shareOpen) && (
        <SharePanel
          tournament={tournament}
          syncStatus={syncStatus}
          onShare={onShare}
          onUnshare={async () => { const r = await onUnshare(); if (r?.ok) setShareOpen(false); return r }}
        />
      )}

      {validated ? (
        <TournamentEnd tournament={tournament} onBack={onBack} />
      ) : (
        <OrganizerBoard
          tournament={tournament}
          onUpdate={onUpdate}
          finished={finished}
          onValidate={() => onValidate(tournament.id)}
        />
      )}
    </div>
  )
}
