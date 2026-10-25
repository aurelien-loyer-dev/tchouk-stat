import { useTranslation } from 'react-i18next'
import { setMatchScore, addSwissRound, isRoundComplete } from '../../../lib/tournament'
import Progress from '../components/Progress'
import Standings from '../components/Standings'
import MatchRow from '../components/MatchRow'
import ValidationBanner from '../components/ValidationBanner'

export default function SwissView({ tournament, onUpdate, finished, onValidate }) {
  const { t } = useTranslation()
  const allMatches = tournament.rounds.flatMap(r => r.matches)
  const currentRound = tournament.rounds[tournament.rounds.length - 1]
  const roundDone = isRoundComplete(currentRound)
  const canNext = roundDone && tournament.rounds.length < tournament.numSwissRounds
  const roundFinished = roundDone && tournament.rounds.length >= tournament.numSwissRounds

  return (
    <>
      <Progress
        done={tournament.rounds.length}
        total={tournament.numSwissRounds}
        label={t('tournament.roundLabel', { current: tournament.rounds.length, total: tournament.numSwissRounds })}
      />

      <div className="trn-section">{t('tournament.standingsTitle')}</div>
      <Standings teams={tournament.teams} matches={allMatches} />

      {tournament.rounds.map((round, ri) => (
        <div key={ri}>
          <div className="trn-section">{round.name}</div>
          <div className="trn-matches-list">
            {round.matches.map(m => (
              <MatchRow key={m.id + m.score1 + m.score2} match={m}
                onScore={(s1, s2) => onUpdate(setMatchScore(tournament, m.id, s1, s2))} />
            ))}
          </div>
        </div>
      ))}

      {canNext && (
        <button className="btn-acc trn-ko-btn" onClick={() => onUpdate(addSwissRound(tournament))}>
          {t('tournament.nextRound', { n: tournament.rounds.length + 1 })}
        </button>
      )}
      {finished && roundFinished && <ValidationBanner onValidate={onValidate} />}
    </>
  )
}
