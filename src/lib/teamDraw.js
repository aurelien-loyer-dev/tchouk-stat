// Tirage d'équipes aléatoires équilibrées.
// Personne : { id, name, gender: 'f' | 'm' | null, level: 1 | 2 | 3 }
// Niveaux : 1 débutant · 2 moyen · 3 expérimenté.

export const LEVELS = [1, 2, 3]

export function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Ordre de distribution : mélangé, puis trié par niveau décroissant
// (le tri est stable, l'ordre reste aléatoire à niveau égal).
function draftOrder(people, balanceLevel) {
  const mixed = shuffle(people)
  return balanceLevel ? mixed.sort((a, b) => b.level - a.level) : mixed
}

// Parmi les équipes, garde celles qui minimisent chaque critère dans l'ordre,
// puis tire au sort parmi les ex æquo.
function pickTeam(teams, criteria) {
  let pool = teams
  for (const crit of criteria) {
    const best = Math.min(...pool.map(crit))
    pool = pool.filter(t => crit(t) === best)
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

export function drawTeams(people, teamCount, { mixity = true, balanceLevel = true } = {}) {
  const n = Math.max(1, Math.min(teamCount, people.length || 1))
  const teams = Array.from({ length: n }, (_, idx) => ({ idx, members: [], girls: 0, levelSum: 0 }))

  const add = (team, p) => {
    team.members.push(p)
    team.levelSum += p.level
    if (p.gender === 'f') team.girls++
  }

  const size  = t => t.members.length
  const level = t => (balanceLevel ? t.levelSum : 0)

  const girls  = mixity ? people.filter(p => p.gender === 'f') : []
  const others = mixity ? people.filter(p => p.gender !== 'f') : people

  // 1. Les filles d'abord, réparties une par une : chaque équipe en reçoit
  //    au moins une tant qu'il y en a assez.
  for (const p of draftOrder(girls, balanceLevel)) {
    add(pickTeam(teams, [t => t.girls, level, size]), p)
  }
  // 2. Le reste complète les équipes les moins remplies, puis les plus faibles.
  for (const p of draftOrder(others, balanceLevel)) {
    add(pickTeam(teams, [size, level]), p)
  }

  for (const t of teams) {
    t.members.sort((a, b) => b.level - a.level || a.name.localeCompare(b.name))
  }
  return teams
}

// Une ligne collée → un nom. Accepte « Nom Prénom », « Prénom Nom », etc.
// Un suffixe F/G/H (ou fille/garçon) et un niveau 1–3 / D·M·E sont reconnus
// s'ils sont séparés par une virgule, un point-virgule ou une tabulation.
export function parsePeopleList(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [rawName, ...rest] = line.split(/[,;\t]/).map(s => s.trim())
      let gender = null
      let level  = 2
      for (const tok of rest.map(s => s.toLowerCase())) {
        if (['f', 'fille', 'femme', 'w'].includes(tok)) gender = 'f'
        else if (['g', 'h', 'm', 'garçon', 'garcon', 'homme'].includes(tok)) gender = 'm'
        else if (['1', 'd', 'débutant', 'debutant', 'beginner'].includes(tok)) level = 1
        else if (['2', 'moyen', 'intermediate', 'i'].includes(tok)) level = 2
        else if (['3', 'e', 'expérimenté', 'experimente', 'confirmé', 'advanced'].includes(tok)) level = 3
      }
      return { name: rawName.replace(/\s+/g, ' '), gender, level }
    })
    .filter(p => p.name)
}

// ── Passage vers les tournois ────────────────────────────────────────────
export const DRAW_KEY = 'tchouk_team_draw'

// Dernier tirage enregistré → [{ name, players: [noms] }], ou null.
// `defaultName(i)` donne le nom d'une équipe que l'utilisateur n'a pas nommée.
export function loadDrawnTeams(defaultName) {
  try {
    const s = JSON.parse(localStorage.getItem(DRAW_KEY) || 'null')
    if (!Array.isArray(s?.teams) || s.teams.length < 2) return null
    const used = new Set()
    return s.teams.map((tm, i) => {
      let name = String(s.teamNames?.[i] || '').trim() || defaultName(i)
      while (used.has(name)) name += ` (${i + 1})`
      used.add(name)
      return { name, players: (tm.members || []).map(m => m.name).filter(Boolean) }
    })
  } catch {
    return null
  }
}
