// Petits primitifs d'affichage de statistiques réutilisés dans tout l'écran
// résultats : valeur numérique (N), pourcentage (Pct), ratio (Ratio), une
// ligne libellé + valeur (Row) et une carte titrée (Card).

export function N({ v }) {
  if (v === null || v === undefined) return <span className="si-v na">—</span>
  return <span className="si-v">{v}</span>
}

export function Pct({ num, den }) {
  if (!den || isNaN(num / den)) return <span className="si-v na">—</span>
  return (
    <span className="si-v">
      {Math.round((num / den) * 100)}
      <span className="unit">%</span>
    </span>
  )
}

export function Ratio({ num, den }) {
  if (!den || isNaN(num / den)) return <span className="si-v na">—</span>
  return <span className="si-v">{(num / den).toFixed(2).replace('.', ',')}</span>
}

export function Row({ label, sub, children }) {
  return (
    <div className="si">
      <div className="si-l">
        {label}
        {sub && <small>{sub}</small>}
      </div>
      {children}
    </div>
  )
}

export function Card({ title, children }) {
  return (
    <div className="card">
      <div className="ctitle">{title}</div>
      {children}
    </div>
  )
}
