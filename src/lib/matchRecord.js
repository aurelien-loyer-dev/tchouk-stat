// Remet en forme un match de l'historique, qu'il vienne du localStorage ou de
// Supabase : les anciennes versions de l'app (ou une ligne abîmée) ont pu
// enregistrer des champs manquants ou nuls, ce qui faisait planter les écrans.
// Renvoie null si le match est inutilisable (pas d'identifiant).

const MODES = ['stats', 'player', 'scorer']
const arr = v => (Array.isArray(v) ? v : [])
const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

export function normalizeMatch(m) {
  if (!m || typeof m !== 'object' || !m.id) return null
  const playedAt = m.playedAt && !Number.isNaN(Date.parse(m.playedAt)) ? m.playedAt : null
  const teams = arr(m.teams)
    .filter(tm => tm && typeof tm === 'object')
    .map((tm, i) => ({ ...tm, name: String(tm.name ?? `#${i + 1}`), score: num(tm.score) }))
  return {
    ...m,
    id: String(m.id),
    playedAt,
    mode: MODES.includes(m.mode) ? m.mode : 'stats',
    teams,
    timeline: arr(m.timeline),
    teamsSnapshot: arr(m.teamsSnapshot),
    players: arr(m.players),
    settings: m.settings && typeof m.settings === 'object' ? m.settings : {},
  }
}

export function normalizeHistory(list) {
  return arr(list).map(normalizeMatch).filter(Boolean)
}
