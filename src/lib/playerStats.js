// Stats disponibles par joueur
export const PLAYER_STATS = [
  { id: 'pointsMarques',   labelKey: 'playerStats.pointsMarques',      scoreImpact: 'self', color: 'green', group: 'off' },
  { id: 'tirsNonTransformes', labelKey: 'playerStats.tirsNonTransformes', color: 'slate', group: 'off' },
  { id: 'pointsDonnes',    labelKey: 'playerStats.pointsDonnes',       scoreImpact: 'opp', color: 'red', group: 'off' },
  { id: 'fautesTir',       labelKey: 'playerStats.fautesTir',          color: 'orange', group: 'off' },
  { id: 'defenseSolo',     labelKey: 'playerStats.defenseSolo',        color: 'blue', group: 'def' },
  { id: 'participationDef', labelKey: 'playerStats.participationDef',   color: 'aqua', group: 'def' },
  { id: 'defenseRatee',    labelKey: 'playerStats.defenseRatee',       color: 'yellow', group: 'def' },
  { id: 'passesRatees',    labelKey: 'playerStats.passesRatees',       color: 'violet', group: 'tech' },
  { id: 'fautesTech',      labelKey: 'playerStats.fautesTech',         color: 'magenta', group: 'tech' },
  { id: 'sanctions',       labelKey: 'playerStats.sanctions',          color: 'ink', group: 'tech' },
]

export const STAT_GROUPS = [
  { id: 'off',  labelKey: 'playerStats.groups.off' },
  { id: 'def',  labelKey: 'playerStats.groups.def' },
  { id: 'tech', labelKey: 'playerStats.groups.tech' },
]

export function mkPlayer(name, teamIdx) {
  return {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : String(Date.now() + Math.random()),
    name,
    teamIdx,
    tirsNonTransformes: 0,
    pointsMarques:      0,  // tGagne → +1 point équipe
    pointsDonnes:       0,  // tDonne → +1 point adverse
    fautesTir:          0,
    defenseSolo:        0,
    participationDef:   0,
    defenseRatee:       0,
    passesRatees:       0,
    fautesTech:         0,
    sanctions:          0,
  }
}

// Tirs totaux par joueur : pointsMarques + pointsDonnes + fautesTir
// (tirsNonTransformes est une stat de qualité séparée, pas une outcome)
export function playerTirsTotal(player) {
  return (player.pointsMarques ?? 0) + (player.pointsDonnes ?? 0) + (player.fautesTir ?? 0)
}

// Stats dérivées calculées pour l'affichage et le PDF
export function playerDerivedStats(player) {
  const tirsTotal   = playerTirsTotal(player)
  const defTotal    = (player.defenseSolo ?? 0) + (player.participationDef ?? 0)
  const fautesTotal = (player.fautesTir ?? 0) + (player.fautesTech ?? 0)
  const effOff      = tirsTotal > 0 ? player.pointsMarques / tirsTotal : null
  const pctDonnes   = tirsTotal > 0 ? player.pointsDonnes  / tirsTotal : null

  return { tirsTotal, defTotal, fautesTotal, effOff, pctDonnes }
}

// Score équipe = pointsMarques de l'équipe + pointsDonnes de l'adversaire
// Pour numTeams === 1 : seulement les points de l'équipe 0
export function playerTeamScore(players, teamIdx, numTeams = 2) {
  if (numTeams === 1) {
    return players.filter(p => p.teamIdx === 0).reduce((s, p) => s + p.pointsMarques, 0)
  }
  return (
    players.filter(p => p.teamIdx === teamIdx).reduce((s, p) => s + p.pointsMarques, 0) +
    players.filter(p => p.teamIdx === 1 - teamIdx).reduce((s, p) => s + p.pointsDonnes, 0)
  )
}

export function applyPlayerAdj(players, playerId, statId, d) {
  return players.map(p => {
    if (p.id !== playerId) return p
    const val = p[statId] ?? 0
    if (d < 0 && val <= 0) return p
    return { ...p, [statId]: d > 0 ? val + 1 : val - 1 }
  })
}

// ── Temps de jeu et remplacements ─────────────────────────────────────────
// Chaque joueur garde ses passages sur le terrain : stints = [[entrée, sortie|null]]
// en secondes de match (chrono, pas l'heure). onCourt : sur le terrain maintenant.
export const COURT_SIZE = 7

// Au coup d'envoi : les 7 premiers de chaque équipe sont sur le terrain.
export function withStarters(players, size = COURT_SIZE) {
  const seen = [0, 0]
  return players.map(p => {
    const starter = seen[p.teamIdx]++ < size
    return { ...p, onCourt: starter, stints: starter ? [[0, null]] : [] }
  })
}

// Entrée ou sortie d'un joueur à `atSec` (secondes de match écoulées).
export function toggleCourt(players, playerId, atSec) {
  return players.map(p => {
    if (p.id !== playerId) return p
    const stints = Array.isArray(p.stints) ? p.stints.map(s => [...s]) : []
    if (p.onCourt) {
      const open = stints[stints.length - 1]
      if (open && open[1] === null) open[1] = Math.max(open[0], atSec)
      return { ...p, onCourt: false, stints }
    }
    return { ...p, onCourt: true, stints: [...stints, [atSec, null]] }
  })
}

// Temps de jeu en secondes (null si le match n'a pas suivi les remplacements).
export function playSeconds(p, nowSec = 0) {
  if (typeof p.playSec === 'number') return p.playSec
  if (!Array.isArray(p.stints)) return null
  return p.stints.reduce((sum, [a, b]) => sum + Math.max(0, (b ?? nowSec) - a), 0)
}

// Fin du match : passages fermés et temps de jeu figé.
export function closeStints(players, atSec) {
  return players.map(p => {
    if (!Array.isArray(p.stints)) return p
    const stints = p.stints.map(([a, b]) => [a, b ?? Math.max(a, atSec)])
    return { ...p, onCourt: false, stints, playSec: stints.reduce((s, [a, b]) => s + (b - a), 0) }
  })
}

export const fmtPlay = sec => (sec == null ? '—' : `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`)
