import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getTournamentEndState } from '../../../lib/tournament'
import { isViewer } from '../cloud'
import RoundRobinView from './RoundRobinView'
import GroupsView from './GroupsView'
import SwissView from './SwissView'
import TournamentEnd from './TournamentEnd'
import SharePanel from '../components/SharePanel'
import PageHeader from '../../../components/PageHeader'
import Icon from '../../../components/Icon'

export default function TournamentDetail({ tournament, onUpdate, onBack, onValidate, validated, syncStatus, onShare, onUnshare }) {
  const { t } = useTranslation()
  const [shareOpen, setShareOpen] = useState(false)
  const formatLabel = t('tournament.formatLabel', { returnObjects: true })
  const { finished } = getTournamentEndState(tournament)
  const readOnly = isViewer(tournament)
  // Un spectateur n'a pas à valider : le classement final s'affiche dès la fin.
  const showEnd = validated || (readOnly && finished)
  const viewProps = { tournament, onUpdate, finished, onValidate: () => onValidate(tournament.id) }

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

      {showEnd ? (
        <TournamentEnd tournament={tournament} onBack={onBack} />
      ) : (
        /* fieldset désactivé : tous les champs et boutons du tournoi passent en lecture seule */
        <fieldset className="trn-body" disabled={readOnly}>
          {tournament.format === 'roundrobin' && <RoundRobinView {...viewProps} />}
          {tournament.format === 'groups'     && <GroupsView     {...viewProps} />}
          {tournament.format === 'swiss'      && <SwissView      {...viewProps} />}
        </fieldset>
      )}
    </div>
  )
}
