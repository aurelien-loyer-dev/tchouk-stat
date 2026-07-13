// ── Algorithmes de scoring automatique ───────────────────────────────────────
//
// BOPM : attaque pure — pts marqués, efficacité, pénalise pts donnés et fautes tir
// BDPM : défense pure — actions défensives, pénalise passes ratées et fautes tech
// MVP  : bilan global — pondère attaque + défense + toutes les fautes
//
export function offScore(p) {
  const tt  = p.pointsMarques + p.pointsDonnes + p.fautesTir
  const eff = tt > 0 ? p.pointsMarques / tt : 0
  return p.pointsMarques * 2 - p.pointsDonnes * 2 - p.fautesTir + eff * 8
}

export function defScore(p) {
  return p.defenseSolo * 3 + p.participationDef * 1.5 - p.passesRatees * 0.5 - p.fautesTech
}

export function mvpScore(p) {
  const tt  = p.pointsMarques + p.pointsDonnes + p.fautesTir
  const eff = tt > 0 ? p.pointsMarques / tt : 0
  return (
    p.pointsMarques * 2
    - p.pointsDonnes * 2
    - p.fautesTir
    + p.defenseSolo * 2
    + p.participationDef
    - p.passesRatees * 0.5
    - p.fautesTech * 1.5
    + eff * 8
  )
}

// Retourne les groupes du top N, avec ex aequo groupés ensemble
// Ex: [{rank:1, players:[A,B]}, {rank:2, players:[C]}, {rank:3, players:[D,E]}]
export function topPlayers(players, scoreFn, limit = 3) {
  if (!players || players.length === 0) return []
  const sorted = [...players].sort((a, b) => scoreFn(b) - scoreFn(a))
  const groups = []
  for (const p of sorted) {
    const s    = scoreFn(p)
    const last = groups[groups.length - 1]
    if (last && last.score === s) {
      last.players.push(p)
    } else {
      if (groups.length === limit) break
      groups.push({ rank: groups.length + 1, score: s, players: [p] })
    }
  }
  return groups
}

export const AWARDS = [
  {
    key:      'bopm',
    labelKey: 'awards.bopmLabel',
    full:     'Best Offensive Player of the Match',
    descKey:  'awards.bopmDesc',
    fn:       offScore,
    color:    '#d97706',
    pdfRgb:   [217, 119, 6],
    hint: (p, pctFn, t) => {
      const tt = p.pointsMarques + p.pointsDonnes + p.fautesTir
      return t('awards.hintBopm', { scored: p.pointsMarques, eff: pctFn(p.pointsMarques, tt), given: p.pointsDonnes })
    },
  },
  {
    key:      'bdpm',
    labelKey: 'awards.bdpmLabel',
    full:     'Best Defensive Player of the Match',
    descKey:  'awards.bdpmDesc',
    fn:       defScore,
    color:    '#1f6feb',
    pdfRgb:   [31, 111, 235],
    hint: (p, pctFn, t) => t('awards.hintBdpm', { solo: p.defenseSolo, part: p.participationDef }),
  },
  {
    key:      'mvp',
    labelKey: 'awards.mvpLabel',
    full:     'Most Valuable Player',
    descKey:  'awards.mvpDesc',
    fn:       mvpScore,
    color:    '#eab308',
    pdfRgb:   [234, 179, 8],
    hint: (p, pctFn, t) => {
      const tt = p.pointsMarques + p.pointsDonnes + p.fautesTir
      return t('awards.hintMvp', { pts: p.pointsMarques, eff: pctFn(p.pointsMarques, tt), def: p.defenseSolo + p.participationDef, fouls: p.fautesTir + p.fautesTech })
    },
  },
]
