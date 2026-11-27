import { useTranslation } from 'react-i18next'
import { isPlayed } from '../../overview'

function Slot({ team, score, win, played, focus }) {
  const { t } = useTranslation()
  const tbd = team === 'TBD'
  const bye = team === 'BYE'
  return (
    <div className={`bk-slot${win ? ' bk-win' : ''}${played && !win ? ' bk-lose' : ''}${focus ? ' bk-focus' : ''}`}>
      <span className={`bk-team${tbd || bye ? ' bk-tbd' : ''}`}>{tbd ? t('tournament.board.tbd') : bye ? t('tournament.board.bye') : team}</span>
      <span className="bk-score">{played ? score : ''}</span>
    </div>
  )
}

// Tableau final en colonnes (une par tour), vainqueurs mis en avant.
// `markFinal` : met en avant le dernier tour (faux pour les tableaux d'une
// double élimination, dont la finale est à part). Les matchs entre deux
// exempts n'existent pas et ne sont pas affichés.
export default function BracketBoard({ rounds, focusTeam, markFinal = true }) {
  const shown = rounds
    .map(r => ({ ...r, matches: r.matches.filter(m => !(m.team1 === 'BYE' && m.team2 === 'BYE')) }))
    .filter(r => r.matches.length)
  return (
    <div className="bk" style={{ '--bk-rounds': shown.length }}>
      {shown.map((round, ri) => (
        <div key={ri} className="bk-round">
          <div className="bk-round-name">{round.name}</div>
          <div className="bk-matches">
            {round.matches.map(m => {
              const played = isPlayed(m)
              return (
                <div key={m.id} className={`bk-match${markFinal && ri === shown.length - 1 ? ' bk-final' : ''}`}>
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
