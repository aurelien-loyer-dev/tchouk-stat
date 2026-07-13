import { useTranslation } from 'react-i18next'
import { getTournamentEndState } from '../../../lib/tournament'
import RoundRobinView from './RoundRobinView'
import GroupsView from './GroupsView'
import SwissView from './SwissView'
import TournamentEnd from './TournamentEnd'

export default function TournamentDetail({ tournament, onUpdate, onBack, onValidate, validated }) {
  const { t } = useTranslation()
  const formatLabel = t('tournament.formatLabel', { returnObjects: true })
  const { finished } = getTournamentEndState(tournament)
  if (validated) {
    return (
      <div className="trn-detail">
        <div className="trn-topbar">
          <button className="btn-mini" onClick={onBack}>{t('tournament.back')}</button>
          <div>
            <div className="trn-topbar-title">{tournament.name}</div>
            <div className="trn-topbar-meta">
              {formatLabel[tournament.format]} · {t('tournament.teamsCount', { count: tournament.teams.length })}
            </div>
          </div>
        </div>

        <TournamentEnd tournament={tournament} onBack={onBack} />
      </div>
    )
  }

  return (
    <div className="trn-detail">
      <div className="trn-topbar">
        <button className="btn-mini" onClick={onBack}>{t('tournament.back')}</button>
        <div>
          <div className="trn-topbar-title">{tournament.name}</div>
          <div className="trn-topbar-meta">
            {formatLabel[tournament.format]} · {t('tournament.teamsCount', { count: tournament.teams.length })}
          </div>
        </div>
      </div>

      {tournament.format === 'roundrobin' && <RoundRobinView tournament={tournament} onUpdate={onUpdate} finished={finished} onValidate={() => onValidate(tournament.id)} />}
      {tournament.format === 'groups'     && <GroupsView     tournament={tournament} onUpdate={onUpdate} finished={finished} onValidate={() => onValidate(tournament.id)} />}
      {tournament.format === 'swiss'      && <SwissView      tournament={tournament} onUpdate={onUpdate} finished={finished} onValidate={() => onValidate(tournament.id)} />}
    </div>
  )
}
