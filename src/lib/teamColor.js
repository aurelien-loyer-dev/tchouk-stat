// Utilitaires de contraste pour les couleurs d'équipe choisies librement par
// l'utilisateur (y compris très sombres ou très claires), en thème clair comme sombre.

export function colorLum(hex) {
  const clean = String(hex || '').replace('#', '')
  const full  = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const n     = Number.parseInt(full, 16)
  if (Number.isNaN(n)) return 0.5
  const r = (n >> 16) & 255
  const g = (n >> 8)  & 255
  const b =  n        & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

// Couleur de texte à poser sur un fond plein de la couleur d'équipe (bouton +1, etc.)
export function teamBtnTxt(hex) {
  return colorLum(hex) > 0.55 ? '#111111' : '#ffffff'
}

// Style prêt à l'emploi pour du texte affiché dans la couleur d'une équipe :
// la couleur est mêlée à l'encre du thème, ce qui fonce les teintes claires
// sur fond clair et éclaircit les teintes sombres sur fond sombre.
export function teamTextStyle(hex) {
  return { color: `color-mix(in oklab, ${hex} 72%, var(--txt))` }
}

// Style pour une pastille/point plein (légende, sélecteur) : anneau de contraste
// pour rester visible même si la couleur se fond dans le fond.
export function teamSwatchStyle(hex) {
  return { background: hex, boxShadow: '0 0 0 1px color-mix(in srgb, var(--txt) 22%, transparent)' }
}

// Retire le boilerplate `settings?.teamColors?.[i] || fallback` répété dans
// chaque écran — les couleurs de repli restent au choix de l'appelant car
// elles diffèrent légitimement selon l'écran (stats vs scorer/setup).
export function pickTeamColors(settings, fallback1, fallback2) {
  return [settings?.teamColors?.[0] || fallback1, settings?.teamColors?.[1] || fallback2]
}
