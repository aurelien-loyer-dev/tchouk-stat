import { useTranslation } from 'react-i18next'
import { getTournamentEndState } from '../../../lib/tournament'
import RoundRobinView from './RoundRobinView'
import GroupsView from './GroupsView'
import SwissView from './SwissView'
import TournamentEnd from './TournamentEnd'
import PageHeader from '../../../components/PageHeader'

export default function TournamentDetail({ tournament, onUpdate, onBack, onValidate, validated }) {
  const { t } = useTranslation()
  const formatLabel = t('tournament.formatLabel', { returnObjects: true })
  const { finished } = getTournamentEndState(tournament)

  return (
    <div className="trn-detail">
      <PageHeader
        title={tournament.name}
        subtitle={`${formatLabel[tournament.format]} · ${t('tournament.teamsCount', { count: tournament.teams.length })}`}
        onBack={onBack}
        backLabel={t('tournament.back')}
      />

      {validated && <TournamentEnd tournament={tournament} onBack={onBack} />}
      {!validated && tournament.format === 'roundrobin' && <RoundRobinView tournament={tournament} onUpdate={onUpdate} finished={finished} onValidate={() => onValidate(tournament.id)} />}
      {!validated && tournament.format === 'groups'     && <GroupsView     tournament={tournament} onUpdate={onUpdate} finished={finished} onValidate={() => onValidate(tournament.id)} />}
      {!validated && tournament.format === 'swiss'      && <SwissView      tournament={tournament} onUpdate={onUpdate} finished={finished} onValidate={() => onValidate(tournament.id)} />}
    </div>
  )
}
