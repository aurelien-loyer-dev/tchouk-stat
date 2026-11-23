import { useTranslation } from 'react-i18next'
import { isPlayed } from '../../overview'

function Slot({ team, score, win, played, focus }) {
  const { t } = useTranslation()
  const tbd = team === 'TBD'
  return (
    <div className={`bk-slot${win ? ' bk-win' : ''}${played && !win ? ' bk-lose' : ''}${focus ? ' bk-focus' : ''}`}>
      <span className={`bk-team${tbd ? ' bk-tbd' : ''}`}>{tbd ? t('tournament.board.tbd') : team}</span>
      <span className="bk-score">{played ? score : ''}</span>
    </div>
  )
}

// Tableau final en colonnes (une par tour), vainqueurs mis en avant.
export default function BracketBoard({ rounds, focusTeam }) {
  return (
    <div className="bk" style={{ '--bk-rounds': rounds.length }}>
      {rounds.map((round, ri) => (
        <div key={ri} className="bk-round">
          <div className="bk-round-name">{round.name}</div>
          <div className="bk-matches">
            {round.matches.map(m => {
              const played = isPlayed(m)
              return (
                <div key={m.id} className={`bk-match${ri === rounds.length - 1 ? ' bk-final' : ''}`}>
                  <Slot team={m.team1} score={m.score1} played={played} win={played && m.score1 > m.score2} focus={focusTeam === m.team1} />
                  <Slot team={m.team2} score={m.score2} played={played} win={played && m.score2 > m.score1} focus={focusTeam === m.team2} />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
