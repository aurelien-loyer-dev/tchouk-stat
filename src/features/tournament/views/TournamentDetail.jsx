import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getTournamentEndState } from '../../../lib/tournament'
import OrganizerBoard from './OrganizerBoard'
import TournamentEnd from './TournamentEnd'
import SharePanel from '../components/SharePanel'
import PageHeader from '../../../components/PageHeader'
import Icon from '../../../components/Icon'

export default function TournamentDetail({ tournament, onUpdate, onBack, onValidate, onResume, validated, syncStatus, onShare, onUnshare, onPlayMatch }) {
  const { t } = useTranslation()
  const [shareOpen, setShareOpen] = useState(false)
  const formatLabel = t('tournament.formatLabel', { returnObjects: true })
  const { finished } = getTournamentEndState(tournament)

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
        <TournamentEnd tournament={tournament} onBack={onBack} onResume={() => onResume(tournament.id)} />
      ) : (
        <OrganizerBoard
          tournament={tournament}
          onUpdate={onUpdate}
          finished={finished}
          onValidate={() => onValidate(tournament.id)}
          onPlayMatch={onPlayMatch}
        />
      )}
    </div>
  )
}
