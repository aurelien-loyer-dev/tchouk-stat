import { useTranslation } from 'react-i18next'
import {
  setMatchScore, setKnockoutScore, startKnockout, canStartKnockout,
  canStartFullPlacement, startFullPlacement, setPlacementScore,
} from '../../../lib/tournament'
import Progress from '../components/Progress'
import CrossTable from '../components/CrossTable'
import Standings from '../components/Standings'
import MatchRow from '../components/MatchRow'
import KnockoutBracket from '../components/KnockoutBracket'
import ValidationBanner from '../components/ValidationBanner'

export default function GroupsView({ tournament, onUpdate, finished, onValidate }) {
  const { t } = useTranslation()
  const allMatches = tournament.groups.flatMap(g => g.matches)
  const done = allMatches.filter(m => m.score1 !== null).length
  const perGroup = tournament.knockoutSize ? Math.ceil(tournament.knockoutSize / tournament.groups.length) : 0

  return (
    <>
      <Progress done={done} total={allMatches.length} />

      <div className="trn-groups-grid">
        {tournament.groups.map(g => (
          <div key={g.id} className="trn-group">
            <div className="trn-group-hd">{g.name}</div>
            <CrossTable teams={g.teams} matches={g.matches} />
            <Standings teams={g.teams} matches={g.matches} qualifyN={perGroup} />
            <div className="trn-matches-list">
              {g.matches.map(m => (
                <MatchRow key={m.id + m.score1 + m.score2} match={m} compact
                  onScore={(s1, s2) => onUpdate(setMatchScore(tournament, m.id, s1, s2))} />
              ))}
            </div>
          </div>
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

      {canStartFullPlacement(tournament) && (
        <button className="btn-acc trn-ko-btn" onClick={() => onUpdate(startFullPlacement(tournament))}>
          {t('tournament.startPlacement')}
        </button>
      )}
      {tournament.placementRounds?.length > 0 && (
        <>
          <div className="trn-section">{t('tournament.placementMatchesTitle')}</div>
          <div className="trn-placement-list">
            {tournament.placementRounds.map((r, ri) => (
              <div key={r.id} className="trn-placement-row">
                <div className="trn-placement-label">{r.label}</div>
                <MatchRow
                  key={r.match.id + r.match.score1 + r.match.score2}
                  match={r.match}
                  onScore={(s1, s2) => onUpdate(setPlacementScore(tournament, ri, s1, s2))}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {finished && (
        <ValidationBanner onValidate={onValidate} />
      )}
    </>
  )
}
