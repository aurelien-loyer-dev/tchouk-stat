import { useTranslation } from 'react-i18next'
import { teamTextStyle } from '../lib/teamColor'
import './ScoreHero.css'

// Score final mis en scène : une colonne par équipe (bande de couleur, nom,
// score), le vainqueur en avant, la zone interdite en filet au centre.
// teams : [{ name, score, color }]
export default function ScoreHero({ teams, meta }) {
  const { t } = useTranslation()
  const two = teams.length === 2
  const [a, b] = teams
  const winner = two && a.score !== b.score ? (a.score > b.score ? 0 : 1) : null

  return (
    <section className="score-hero">
      <div className={`sh-board${two ? '' : ' sh-single'}`}>
        {teams.map((tm, i) => (
          <div key={i} className={`sh-side${winner !== null && winner !== i ? ' sh-lost' : ''}`} style={{ '--tc': tm.color || 'var(--acc)' }}>
            <span className="sh-name">{tm.name}</span>
            <span className="sh-score" style={tm.color ? teamTextStyle(tm.color) : undefined}>{tm.score}</span>
          </div>
        ))}
        {two && <span className="sh-sep" aria-hidden="true">–</span>}
      </div>
      <div className="sh-foot">
        {two && (
          <span className="sh-result">
            {winner === null ? t('history.draw') : t('history.winner', { team: teams[winner].name })}
          </span>
        )}
        {meta && <span className="sh-meta">{meta}</span>}
      </div>
    </section>
  )
}
