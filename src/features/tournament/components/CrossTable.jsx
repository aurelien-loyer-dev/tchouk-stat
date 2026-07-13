// Tableau croisé (round-robin / poule)
export default function CrossTable({ teams, matches }) {
  const map = {}
  matches.forEach(m => {
    map[`${m.team1}||${m.team2}`] = m
    map[`${m.team2}||${m.team1}`] = { score1: m.score2, score2: m.score1 }
  })

  return (
    <div className="trn-xt-wrap">
      <div className="trn-xt-scroll">
        <table className="trn-xt">
          <thead>
            <tr>
              <th className="trn-xt-corner" />
              {teams.map((_, j) => (
                <th key={j} className="trn-xt-ch">{j + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((rowTeam, i) => (
              <tr key={i}>
                <td className="trn-xt-rh">
                  <span className="trn-xt-rnum">{i + 1}</span>
                  <span className="trn-xt-rname">{rowTeam}</span>
                </td>
                {teams.map((colTeam, j) => {
                  if (i === j) return <td key={j} className="trn-xt-self">×</td>
                  const m = map[`${rowTeam}||${colTeam}`]
                  if (!m || m.score1 === null) return <td key={j} className="trn-xt-empty">·</td>
                  const cls = m.score1 > m.score2 ? 'trn-xt-w' : m.score1 < m.score2 ? 'trn-xt-l' : 'trn-xt-d'
                  return <td key={j} className={`trn-xt-cell ${cls}`}>{m.score1}–{m.score2}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
