import MatchRow from './MatchRow'

export default function KnockoutBracket({ rounds, onScore }) {
  return (
    <div className="trn-bracket">
      {rounds.map((round, ri) => (
        <div key={ri} className="trn-bround">
          <div className="trn-bround-name">{round.name}</div>
          <div className="trn-bround-matches">
            {round.matches.map((m, mi) =>
              m.team1 === 'TBD' || m.team2 === 'TBD' ? (
                <div key={m.id} className="trn-match trn-match-tbd">
                  <span className="trn-mt">{m.team1}</span>
                  <span className="trn-dash">–</span>
                  <span className="trn-mt">{m.team2}</span>
                </div>
              ) : (
                <MatchRow
                  key={m.id + m.score1 + m.score2}
                  match={m}
                  compact
                  onScore={(s1, s2) => onScore(ri, mi, s1, s2)}
                />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
