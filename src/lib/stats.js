export function mkTeam(name) {
  return {
    name,
    pos:      0,  // possessions
    // Tirs (4 outcomes, tous += tirs_total)
    tGagne:   0,  // gagné  → +1 point pour nous
    tDonne:   0,  // donné  → +1 point pour l'adversaire (pas une faute technique)
    tCatche:  0,  // catché → possession adverse, 0 point
    tFaute:   0,  // faute sur tir (zone, cadre...) → 0 point, possession adverse
    // Passes
    pReussie: 0,
    pRatee:   0,
    // Fautes techniques hors tir (pas de points)
    fZone:    0,
    fMarche:  0,
    fAutre:   0,
    // 1-team mode : score adverse saisi manuellement
    padv:     0,
  }
}

// Score affiché = nos buts + les points que l'adversaire nous a donnés (leurs tDonne)
export function score(teams, n, i) {
  return teams[i].tGagne + (n === 2 ? teams[1 - i].tDonne : 0)
}

// Tirs total = tous les outcomes de tir
export function tirs(teams, n, i) {
  const t = teams[i]
  return t.tGagne + t.tDonne + t.tCatche + t.tFaute
}

// Score adverse total
export function pointAdv(teams, n, i) {
  return n === 2 ? score(teams, n, 1 - i) : teams[i].padv
}

// Tirs adverses qui ont marqué (hors "points donnés")
// Formule : point_adverse − point_donné
// En 2 équipes : directement les gagnés adverses
// En 1 équipe : score_manuel − nos_tirs_donnés (les points qu'on leur a "offerts" soi-même)
export function tirAdvMarques(teams, n, i) {
  if (n === 2) return teams[1 - i].tGagne
  return Math.max(0, teams[i].padv - teams[i].tDonne)
}

// Tirs total adverses (pour efficacité défensive en 2 équipes)
export function tirsAdv(teams, n, i) {
  return n === 2 ? tirs(teams, n, 1 - i) : null
}

// Nos catches défensifs = les tirs adverses qu'on a catchés = leurs tCatche
export function catchsNous(teams, n, i) {
  return n === 2 ? teams[1 - i].tCatche : teams[i].tCatche
}

// Total fautes (tir + techniques hors tir)
export function fautesTotal(t) {
  return t.tFaute + t.fZone + t.fMarche + t.fAutre
}

// Mise à jour immutable : tous les champs sont des compteurs indépendants
export function applyAdj(teams, n, i, id, d) {
  const next = teams.map(t => ({ ...t }))
  const t = next[i]
  if (d === 1) {
    t[id]++
  } else {
    if (t[id] > 0) t[id]--
  }
  return next
}
