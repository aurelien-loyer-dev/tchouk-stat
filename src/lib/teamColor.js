// Utilitaires de contraste pour les couleurs d'équipe choisies librement par
// l'utilisateur (y compris noir/très sombre, invisible sur le thème noir).

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

// Contour de texte pour rester lisible quand la couleur d'équipe se fond
// dans le fond (très sombre sur fond noir, très claire sur fond blanc).
export function teamHalo(hex) {
  const lum = colorLum(hex)
  if (lum > 0.75)
    return '-1px -1px 0 rgba(0,0,0,0.28), 1px -1px 0 rgba(0,0,0,0.28), -1px 1px 0 rgba(0,0,0,0.28), 1px 1px 0 rgba(0,0,0,0.28), 0 0 8px rgba(0,0,0,0.18)'
  if (lum < 0.22)
    return '-1px -1px 0 rgba(255,255,255,0.38), 1px -1px 0 rgba(255,255,255,0.38), -1px 1px 0 rgba(255,255,255,0.38), 1px 1px 0 rgba(255,255,255,0.38), 0 0 8px rgba(255,255,255,0.25)'
  return 'none'
}

// Couleur de texte à poser sur un fond plein de la couleur d'équipe (bouton +1, etc.)
export function teamBtnTxt(hex) {
  return colorLum(hex) > 0.55 ? '#111111' : '#ffffff'
}

// Style prêt à l'emploi pour du texte affiché dans la couleur d'une équipe :
// style={{ ...teamTextStyle(color) }}
export function teamTextStyle(hex) {
  return { color: hex, textShadow: teamHalo(hex) }
}

// Style pour une pastille/point plein (légende, sélecteur) : anneau de contraste
// pour rester visible même si la couleur se fond dans le fond.
export function teamSwatchStyle(hex) {
  const lum = colorLum(hex)
  const ring = lum < 0.22 ? 'rgba(255,255,255,0.4)' : lum > 0.85 ? 'rgba(0,0,0,0.4)' : 'transparent'
  return { background: hex, boxShadow: `0 0 0 1px ${ring}` }
}

// Retire le boilerplate `settings?.teamColors?.[i] || fallback` répété dans
// chaque écran — les couleurs de repli restent au choix de l'appelant car
// elles diffèrent légitimement selon l'écran (stats vs scorer/setup).
export function pickTeamColors(settings, fallback1, fallback2) {
  return [settings?.teamColors?.[0] || fallback1, settings?.teamColors?.[1] || fallback2]
}
