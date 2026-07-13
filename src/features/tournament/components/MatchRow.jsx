import { useEffect, useState } from 'react'

// Score input pour un match
export default function MatchRow({ match, onScore, compact }) {
  const [s1, setS1] = useState(match.score1 !== null ? String(match.score1) : '')
  const [s2, setS2] = useState(match.score2 !== null ? String(match.score2) : '')
  const played = match.score1 !== null && match.score2 !== null

  useEffect(() => {
    setS1(match.score1 !== null ? String(match.score1) : '')
    setS2(match.score2 !== null ? String(match.score2) : '')
  }, [match.score1, match.score2])

  function save(v1, v2) {
    const n1 = parseInt(v1), n2 = parseInt(v2)
    if (!isNaN(n1) && !isNaN(n2) && n1 >= 0 && n2 >= 0) onScore(n1, n2)
  }

  const winner1 = played && match.score1 > match.score2
  const winner2 = played && match.score2 > match.score1

  return (
    <div className={`trn-match${played ? ' trn-match-done' : ''}${compact ? ' trn-match-compact' : ''}`}>
      <div className={`trn-mt${winner1 ? ' trn-mt-win' : ''}`}>{match.team1}</div>
      <div className="trn-score-wrap">
        <input className="trn-si" type="number" min="0" value={s1}
          onChange={e => setS1(e.target.value)}
          onBlur={e => save(e.target.value, s2)}
          onKeyDown={e => e.key === 'Enter' && save(s1, s2)}
        />
        <span className="trn-dash">–</span>
        <input className="trn-si" type="number" min="0" value={s2}
          onChange={e => setS2(e.target.value)}
          onBlur={e => save(s1, e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save(s1, s2)}
        />
      </div>
      <div className={`trn-mt trn-mt-r${winner2 ? ' trn-mt-win' : ''}`}>{match.team2}</div>
    </div>
  )
}
