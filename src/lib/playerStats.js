// Stats disponibles par joueur
export const PLAYER_STATS = [
  { id: 'tirsNonTransformes', label: 'Tirs non transformés', sub: null,             color: 'amber', group: 'off' },
  { id: 'pointsMarques',      label: 'Points marqués',       sub: null, scoreImpact: 'self', color: 'green', group: 'off' },
  { id: 'pointsDonnes',       label: 'Points donnés',        sub: null, scoreImpact: 'opp',  color: 'red',   group: 'off' },
  { id: 'fautesTir',          label: 'Fautes de tir',        sub: null,             color: 'amber', group: 'off' },
  { id: 'defenseSolo',        label: 'Défense solo',         sub: null,             color: 'green', group: 'def' },
  { id: 'participationDef',   label: 'Participation déf.',   sub: null,                             group: 'def' },
  { id: 'defenseRatee',       label: 'Défense ratée',        sub: null,             color: 'red',   group: 'def' },
  { id: 'passesRatees',       label: 'Passe ratée',          sub: null,             color: 'amber',   group: 'tech' },
  { id: 'fautesTech',         label: 'Faute technique',      sub: null,             color: 'red',   group: 'tech' },
  { id: 'sanctions',          label: 'Sanctions',            sub: null,             color: 'red',   group: 'tech' },
]

export const STAT_GROUPS = [
  { id: 'off',  label: 'Offensives' },
  { id: 'def',  label: 'Défensives' },
  { id: 'tech', label: 'Techniques' },
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
