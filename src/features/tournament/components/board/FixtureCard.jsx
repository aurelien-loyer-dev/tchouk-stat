import { useTranslation } from 'react-i18next'
import { isPlayed } from '../../overview'

// Un match en lecture seule : contexte, équipes, score (ou « contre »).
export default function FixtureCard({ fixture, focusTeam, isNew, featured, live, court, dim, time }) {
  const { t } = useTranslation()
  const m = fixture.match
  const played = isPlayed(m)
  const win1 = played && m.score1 > m.score2
  const win2 = played && m.score2 > m.score1
  const mine = focusTeam && (m.team1 === focusTeam || m.team2 === focusTeam)

  const cls = [
    'fx',
    played ? 'fx-played' : 'fx-upcoming',
    featured && 'fx-featured',
    live && 'fx-live',
    dim && 'fx-dim',
    mine && 'fx-mine',
    isNew && 'fx-new',
  ].filter(Boolean).join(' ')

  return (
    <article className={cls}>
      {(fixture.label || isNew || featured || live || court) && (
        <header className="fx-meta">
          {court && <span className="court-tag">{t('tournament.courts.court', { n: court })}</span>}
          {live && <span className="fx-live-tag"><span className="fx-live-dot" aria-hidden="true" />{t('tournament.courts.inProgress')}</span>}
          {time && <span className="fx-time">{time}</span>}
          {featured && <span className="fx-next">{t('tournament.board.nextMatch')}</span>}
          {fixture.label && <span className="fx-label">{fixture.label}</span>}
          {isNew && <span className="fx-new-tag">{t('tournament.board.justIn')}</span>}
        </header>
      )}
      <div className="fx-line">
        <span className={`fx-team${win1 ? ' fx-win' : ''}${played && !win1 ? ' fx-lose' : ''}${focusTeam === m.team1 ? ' fx-focus' : ''}`}>{m.team1}</span>
        {played ? (
          <span className="fx-score">
            <span className={win1 ? 'fx-win' : ''}>{m.score1}</span>
            <span className="fx-sep">–</span>
            <span className={win2 ? 'fx-win' : ''}>{m.score2}</span>
          </span>
        ) : (
          <span className="fx-vs">{t('tournament.board.vs')}</span>
        )}
        <span className={`fx-team fx-team-r${win2 ? ' fx-win' : ''}${played && !win2 ? ' fx-lose' : ''}${focusTeam === m.team2 ? ' fx-focus' : ''}`}>{m.team2}</span>
      </div>
    </article>
  )
}
