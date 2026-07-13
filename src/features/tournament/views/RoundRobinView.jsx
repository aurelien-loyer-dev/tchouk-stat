import { useTranslation } from 'react-i18next'
import { setMatchScore, setKnockoutScore, startKnockout, canStartKnockout } from '../../../lib/tournament'
import Progress from '../components/Progress'
import CrossTable from '../components/CrossTable'
import Standings from '../components/Standings'
import MatchRow from '../components/MatchRow'
import KnockoutBracket from '../components/KnockoutBracket'
import ValidationBanner from '../components/ValidationBanner'

export default function RoundRobinView({ tournament, onUpdate, finished, onValidate }) {
  const { t } = useTranslation()
  const done = tournament.matches.filter(m => m.score1 !== null).length
  const perGroup = tournament.knockoutSize ?? 0

  return (
    <>
      <Progress done={done} total={tournament.matches.length} />
      <div className="trn-section">{t('tournament.crossTable')}</div>
      <CrossTable teams={tournament.teams} matches={tournament.matches} />

      <div className="trn-section">{t('tournament.standingsTitle')}</div>
      <Standings teams={tournament.teams} matches={tournament.matches} qualifyN={perGroup} />

      <div className="trn-section">{t('tournament.matches')}</div>
      <div className="trn-matches-list">
        {tournament.matches.map(m => (
          <MatchRow key={m.id + m.score1 + m.score2} match={m}
            onScore={(s1, s2) => onUpdate(setMatchScore(tournament, m.id, s1, s2))} />
        ))}
      </div>

      {canStartKnockout(tournament) && (
        <button className="btn-acc trn-ko-btn" onClick={() => onUpdate(startKnockout(tournament))}>
          {t('tournament.startKnockout')}
        </button>
      )}
      {tournament.knockoutRounds && (
        <>
          <div className="trn-section">{t('tournament.pdf.knockoutStage')}</div>
          <KnockoutBracket rounds={tournament.knockoutRounds}
            onScore={(ri, mi, s1, s2) => onUpdate(setKnockoutScore(tournament, ri, mi, s1, s2))} />
        </>
      )}

      {finished && (
        <ValidationBanner onValidate={onValidate} />
      )}
    </>
  )
}
