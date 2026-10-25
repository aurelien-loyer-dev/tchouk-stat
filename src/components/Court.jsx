// Terrain de tchoukball schématique (40 × 20 m) : ligne médiane, cadres et
// zones interdites (demi-cercles de 3 m) aux deux extrémités.
export default function Court({ className }) {
  return (
    <svg className={className} viewBox="0 0 400 200" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="398" height="198" rx="2" />
      <path d="M200 1v198" />
      <circle cx="200" cy="100" r="14" />
      <path d="M1 70a30 30 0 0 1 0 60" />
      <path d="M399 70a30 30 0 0 0 0 60" />
      <rect x="1" y="92" width="6" height="16" className="court-frame" />
      <rect x="393" y="92" width="6" height="16" className="court-frame" />
    </svg>
  )
}
